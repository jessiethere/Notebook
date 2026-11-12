// Media bytes live in IndexedDB, never in LocalStorage metadata.
//
// V10.21 (P0, media that showed "Error" after leaving Studio): records are
// written as their bytes (ArrayBuffer + mime), not as Blob / File objects.
// iOS Safari / WKWebView can lose the file behind a stored Blob — notably a
// File straight from the photo / video picker — so a page kept its
// reference ("saved") while the bytes could no longer be read
// ("WebKitBlobResource error 1"). Every write is read back and its size
// checked before it counts as saved. Older Blob records are converted in
// place the first time they are read (same id, nothing deleted); one that
// cannot be read any more is reported as missing, never replaced.
import { validateStateSnapshot } from "./model.mjs";

// A record's bytes as a Blob, whichever way it was stored.
export function blobOf(record) {
  if (!record) return null;
  if (record.bytes instanceof ArrayBuffer) return new Blob([record.bytes], { type: record.mime || "" });
  return record.blob instanceof Blob ? record.blob : null;
}
export class MediaStore {
  constructor(indexedDBFactory = globalThis.indexedDB) {
    this.factory = indexedDBFactory;
    this.urls = new Map();
    // Object URLs are reference-counted by view scope ("app", "studio",
    // "day"). Leaving a view releases its scope and revokes unused URLs.
    this.holders = new Map();
    // Ids whose bytes could not be read (reported, never invented).
    this.broken = new Set();
    this.retried = new Set();
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
    // The bytes themselves (a File from the picker may be backed by a
    // temporary file the system deletes later).
    const bytes = await blob.arrayBuffer();
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackId();
    const record = {
      ...metadata,
      id,
      bytes,
      mime: blob.type,
      size: bytes.byteLength,
      createdAt: new Date().toISOString(),
    };
    await this.write(record, "add");
    // Read it back: only a record whose bytes are really there counts as saved.
    const check = await this.get(id);
    if (!(check?.bytes instanceof ArrayBuffer) || check.bytes.byteLength !== bytes.byteLength) {
      const error = new Error("media-verify");
      error.code = "media-verify";
      throw error;
    }
    if (scope) {
      this.urls.set(id, URL.createObjectURL(new Blob([bytes], { type: blob.type })));
      this.hold(id, scope);
    }
    return id;
  }
  async write(record, mode = "put") {
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("media", "readwrite");
      tx.objectStore("media")[mode](record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Media save aborted"));
    });
  }
  // A record's bytes, converting an older Blob record in place (same id).
  // Returns null when the bytes are gone (the id is then reported broken).
  async readable(id) {
    const record = await this.get(id);
    if (!record) return null;
    if (record.bytes instanceof ArrayBuffer) return record;
    if (!(record.blob instanceof Blob)) {
      this.broken.add(id);
      return null;
    }
    let bytes;
    try {
      bytes = await record.blob.arrayBuffer();
    } catch {
      this.broken.add(id);
      return null;
    }
    const upgraded = { ...record, bytes, mime: record.mime || record.blob.type, size: bytes.byteLength };
    delete upgraded.blob;
    try {
      await this.write(upgraded);
    } catch {
      // Could not rewrite (space?): still show it this time from the bytes read.
    }
    return upgraded;
  }
  // Which of these ids have no readable record (for an honest "saved").
  async missing(ids) {
    await this.open();
    const out = [];
    for (const id of ids) {
      const key = await new Promise((resolve, reject) => {
        const r = this.db.transaction("media").objectStore("media").getKey(id);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      if (key === undefined || this.broken.has(id)) out.push(id);
    }
    return out;
  }
  // A shown picture / clip failed to load: make a fresh URL from the stored
  // bytes once. Returns true when there is something new to show.
  async refresh(id) {
    if (this.retried.has(id)) return false;
    this.retried.add(id);
    const record = await this.readable(id).catch(() => null);
    const blob = blobOf(record);
    if (!blob) return false;
    const old = this.urls.get(id);
    if (old) URL.revokeObjectURL(old);
    this.urls.set(id, URL.createObjectURL(blob));
    if (!this.holders.has(id)) this.hold(id, "app");
    return true;
  }
  idOfUrl(url) {
    for (const [id, value] of this.urls) if (value === url) return id;
    return "";
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
        const blob = blobOf(await this.readable(id).catch(() => null));
        if (!blob) continue;
        if (!this.urls.has(id))
          this.urls.set(id, URL.createObjectURL(blob));
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
        bytes += record.bytes?.byteLength ?? record.blob?.size ?? 0;
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
    // Original artwork bundled with the app (library.json "scenes": page
    // backgrounds, plus the retired hand-drawn scenes older pages still use).
    if (/^scene:[a-z0-9-]+$/.test(reference)) return `library/scenes/LD-scene-${reference.slice(6)}.svg`;
    // Real photos bundled with the app (library.json "photos", Unsplash License).
    if (/^photo:[a-z0-9-]+$/.test(reference)) return `library/photos/LD-photo-${reference.slice(6)}.jpg`;
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
      // Size first (from the record), so an oversize backup stops before
      // any bytes are read or encoded.
      const stored = await this.get(id);
      if (!stored) throw new Error("A referenced media file is missing.");
      totalSize += stored.bytes?.byteLength ?? stored.blob?.size ?? stored.size ?? 0;
      if (totalSize > MAX_BACKUP_MEDIA_BYTES) {
        const error = new Error("error.backupSize");
        error.code = "backup-size";
        throw error;
      }
      const record = await this.readable(id);
      const blob = blobOf(record);
      if (!blob) throw new Error("A referenced media file is missing.");
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      media.push({ ...record, blob: undefined, bytes: undefined, data });
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

const fallbackId = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => ((c === "x" ? Math.random() * 16 : (Math.random() * 4) | 8) | 0).toString(16));
export const MAX_BACKUP_MEDIA_BYTES = 100 * 1024 * 1024;
export const MAX_BACKUP_FILES = 2000;
// visit(reference, type): type is "image" or "clip" (audio/video bytes).
export function visitMediaReferences(state, visit) {
  const reference = (object, key, type = "image") => {
    if (typeof object?.[key] === "string" && object[key].startsWith("media:"))
      object[key] = visit(object[key], type);
  };
  const page = (item) => {
    reference(item, "backdrop");
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
