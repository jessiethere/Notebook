// V7.5 storage upgrade: the journal's words and pages (the `little-days.v1`
// JSON) are kept in IndexedDB, which has far more room than LocalStorage
// (~5 MB in WebKit). LocalStorage stays as a best-effort mirror while it
// fits (older code paths, other tabs' conflict check); when it is full the
// mirror is dropped and IndexedDB carries on alone. Media bytes already live
// in IndexedDB (media.mjs).

export const META_DB = "little-days-meta";
export const META_KEY = "little-days.v1";

export class MetaStore {
  constructor(indexedDBFactory = globalThis.indexedDB) {
    this.factory = indexedDBFactory;
    this.db = null;
    this.pending = null; // the latest value waiting to be written
    this.writing = null; // the write in progress
  }
  async open() {
    if (this.db) return this;
    if (!this.factory) throw new Error("IndexedDB unavailable");
    this.db = await new Promise((resolve, reject) => {
      const request = this.factory.open(META_DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("kv")) request.result.createObjectStore("kv");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Close older Little Days tabs and retry."));
    });
    this.db.onversionchange = () => {
      this.db.close();
      this.db = null;
    };
    return this;
  }
  async read(key = META_KEY) {
    await this.open();
    return new Promise((resolve, reject) => {
      const request = this.db.transaction("kv", "readonly").objectStore("kv").get(key);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  }
  // Writes are queued and coalesced: only the newest value is written next,
  // in order, so a slow write can never overwrite a newer one.
  write(value, key = META_KEY) {
    this.pending = { key, value };
    if (!this.writing) this.writing = this.flush().finally(() => (this.writing = null));
    return this.writing;
  }
  async flush() {
    await this.open();
    while (this.pending) {
      const { key, value } = this.pending;
      this.pending = null;
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Write aborted"));
      });
    }
  }
}
