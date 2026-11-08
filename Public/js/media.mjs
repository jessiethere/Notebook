// Media bytes live in IndexedDB, never in LocalStorage metadata.
import { validateStateSnapshot } from "./model.mjs";
export class MediaStore {
  constructor(indexedDBFactory = globalThis.indexedDB) {
    this.factory = indexedDBFactory;
    this.urls = new Map();
    // Object URLs are reference-counted by view scope ("app", "studio",
    // "day"). Leaving a view releases its scope and revokes unused URLs.
    this.holders = new Map();
  }
  async open() {
    if (this.db) return this;
    if (!this.factory) throw new Error("IndexedDB unavailable");
    this.db = await new Promise((resolve, reject) => {
      const request = this.factory.open("little-days-media", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("media"))
          request.result.createObjectStore("media", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Close older Little Days tabs and retry."));
    });
    this.db.onversionchange = () => {
      this.db.close();
      this.db = null;
    };
    return this;
  }
  async put(blob, metadata = {}, scope = "app") {
    await this.open();
    const record = {
      ...metadata,
      id: crypto.randomUUID(),
      blob,
      mime: blob.type,
      size: blob.size,
      createdAt: new Date().toISOString(),
    };
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("media", "readwrite");
      tx.objectStore("media").add(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Media save aborted"));
    });
    if (scope) {
      this.urls.set(record.id, URL.createObjectURL(blob));
      this.hold(record.id, scope);
    }
    return record.id;
  }
  hold(id, scope) {
    if (!this.holders.has(id)) this.holders.set(id, new Set());
    this.holders.get(id).add(scope);
  }
  has(id) {
    return this.urls.has(id);
  }
  async acquire(ids, scope) {
    for (const id of ids) {
      if (!this.urls.has(id)) {
        const record = await this.get(id);
        if (!record?.blob) continue;
        if (!this.urls.has(id))
          this.urls.set(id, URL.createObjectURL(record.blob));
      }
      this.hold(id, scope);
    }
    return this;
  }
  release(scope) {
    let revoked = 0;
    for (const [id, scopes] of this.holders) {
      scopes.delete(scope);
      if (scopes.size) continue;
      this.holders.delete(id);
      const url = this.urls.get(id);
      if (url) URL.revokeObjectURL(url);
      this.urls.delete(id);
      revoked++;
    }
    return revoked;
  }
  async usage(state) {
    let bytes = 0,
      count = 0,
      missing = 0;
    for (const id of mediaReferences(state)) {
      const record = await this.get(id);
      if (!record) missing++;
      else {
        count++;
        bytes += record.blob?.size || 0;
      }
    }
    return { bytes, count, missing };
  }
  async get(id) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("media");
      const r = tx.objectStore("media").get(id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async url(id, scope = "app") {
    await this.acquire([id], scope);
    return this.urls.get(id) || "";
  }
  resolve(reference) {
    if (typeof reference !== "string") return "";
    if (reference.startsWith("media:"))
      return this.urls.get(reference.slice(6)) || "";
    // Stored sample photos keep their original "/assets/…" value; they are
    // displayed through a relative URL so hosted copies of the app work too.
    if (/^\/assets\/[a-z0-9-]+\.jpg$/i.test(reference)) return reference.slice(1);
    if (/^data:image\/(jpeg|png|webp);base64,/.test(reference)) return reference;
    return "";
  }
  // Images (photos, covers, posters, growth photos) stay available app-wide
  // for thumbnails; audio/video Blobs are loaded only by the view that plays them.
  async hydrate(state) {
    await this.acquire(mediaReferences(state, "image"), "app");
    return this;
  }
  async backup(state) {
    const media = [];
    let totalSize = 0;
    for (const id of mediaReferences(state)) {
      const record = await this.get(id);
      if (!record) throw new Error("A referenced media file is missing.");
      totalSize += record.blob.size;
      if (totalSize > MAX_BACKUP_MEDIA_BYTES) {
        const error = new Error("error.backupSize");
        error.code = "backup-size";
        throw error;
      }
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(record.blob);
      });
      media.push({ ...record, blob: undefined, data });
    }
    return {
      format: "little-days-backup",
      version: 1,
      createdAt: new Date().toISOString(),
      state: structuredClone(state),
      media,
    };
  }
  async restore(backup) {
    if (
      backup.format !== "little-days-backup" ||
      backup.version !== 1 ||
      backup.state?.schemaVersion !== 1 ||
      !["entries", "books", "habits", "checks"].every((key) =>
        Array.isArray(backup.state[key]),
      ) ||
      !backup.state.drafts ||
      typeof backup.state.drafts !== "object" ||
      !Array.isArray(backup.media)
    )
      throw new Error("Invalid backup");
    validateStateSnapshot(backup.state);
    const references = mediaReferences(backup.state),
      mapping = new Map();
    if (backup.media.length > MAX_BACKUP_FILES)
      throw new Error("Too many media files");
    for (const record of backup.media) {
      if (!references.has(record.id)) continue;
      if (
        mapping.has(record.id) ||
        typeof record.data !== "string" ||
        !/^data:(image\/(jpeg|png|webp)|audio\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+)(;codecs=[^;,]+)?;base64,/i.test(
          record.data,
        )
      )
        throw new Error("Invalid media");
      const blob = await (await fetch(record.data)).blob();
      if (blob.size > 50 * 1024 * 1024) throw new Error("Media too large");
      mapping.set(
        record.id,
        await this.put(
          blob,
          {
            kind: record.kind,
            name: record.name || "Restored media",
            duration: record.duration || 0,
          },
          null,
        ),
      );
    }
    if ([...references].some((id) => !mapping.has(id)))
      throw new Error("Incomplete media backup");
    const restored = structuredClone(backup.state);
    visitMediaReferences(
      restored,
      (ref) => "media:" + mapping.get(ref.slice(6)),
    );
    for (const book of restored.books) book.visibility = "private";
    for (const entry of [
      ...restored.entries,
      ...Object.values(restored.drafts),
    ]) {
      entry.visibility = "private";
      for (const moment of entry.moments || []) moment.visibility = "private";
    }
    return restored;
  }
  close() {
    for (const url of this.urls.values()) URL.revokeObjectURL(url);
    this.urls.clear();
    this.holders.clear();
    this.db?.close();
    this.db = null;
  }
}

export async function migrateLegacyPhotos(store, media) {
  // Old records are untouched unless every Blob write succeeds first.
  const changes = [];
  for (const entry of [
    ...store.state.entries,
    ...Object.values(store.state.drafts),
  ]) {
    if (/^data:image\/(jpeg|png|webp);base64,/.test(entry.photo || "")) {
      const blob = await (await fetch(entry.photo)).blob();
      const id = await media.put(blob, { kind: "photo", name: "legacy-photo" });
      changes.push({
        entryId: entry.id,
        date: entry.date,
        old: entry.photo,
        reference: `media:${id}`,
      });
    }
  }
  if (changes.length)
    store.update((next) => {
      for (const entry of [...next.entries, ...Object.values(next.drafts)]) {
        const match = changes.find(
          (c) =>
            c.entryId === entry.id &&
            c.date === entry.date &&
            c.old === entry.photo,
        );
        if (match) entry.photo = match.reference;
      }
    });
  return changes.length;
}

export const MAX_BACKUP_MEDIA_BYTES = 100 * 1024 * 1024;
export const MAX_BACKUP_FILES = 2000;
// visit(reference, type): type is "image" or "clip" (audio/video bytes).
export function visitMediaReferences(state, visit) {
  const reference = (object, key, type = "image") => {
    if (typeof object?.[key] === "string" && object[key].startsWith("media:"))
      object[key] = visit(object[key], type);
  };
  const page = (item) => {
    for (const clip of item.media || []) {
      reference(clip, "source", "clip");
      reference(clip, "poster");
    }
    for (const layer of item.layers || []) {
      reference(layer, "mediaRef");
      // The untouched original of an edited photo (kept for re-editing).
      reference(layer, "sourceRef");
    }
  };
  for (const book of state.books || []) reference(book, "coverImage");
  for (const check of state.checks || []) reference(check, "photo");
  for (const entry of [
    ...(state.entries || []),
    ...Object.values(state.drafts || {}),
  ]) {
    reference(entry, "photo");
    page(entry);
    for (const moment of entry.moments || []) page(moment);
    const book = state.books.find((book) => book.id === entry.bookId);
    for (const [key, value] of Object.entries(entry.fieldValues || {})) {
      const field = book?.fields?.find((field) => field.id === key);
      if (
        field?.type === "image" ||
        (!field && /^media:[a-f0-9-]{36}$/i.test(value))
      )
        reference(entry.fieldValues, key);
    }
  }
}
export function mediaReferences(state, type = null) {
  const ids = new Set();
  visitMediaReferences(structuredClone(state), (reference, kind) => {
    if (!type || kind === type) ids.add(reference.slice(6));
    return reference;
  });
  return ids;
}
