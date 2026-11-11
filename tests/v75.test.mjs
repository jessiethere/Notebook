// V7.5 storage upgrade: the journal in IndexedDB, LocalStorage as a mirror
// while it fits, nothing lost when LocalStorage is full.
import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { readFileSync } from "node:fs";
import { Store, MIRROR_OFF_KEY } from "../Public/js/model.mjs";
import { MetaStore } from "../Public/js/meta-store.mjs";

const seed = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json", import.meta.url)));
const memory = ({ quota = Infinity } = {}) => {
  const data = new Map();
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => {
      if (String(v).length > quota) throw Object.assign(new Error("full"), { name: "QuotaExceededError" });
      data.set(k, String(v));
    },
    removeItem: (k) => data.delete(k),
  };
};
const addTitle = (title) => (s) => {
  s.entries.push({ id: "e-" + title, date: "2026-10-01", title, body: "", photo: "", bookId: "daily", layers: [], media: [], moments: [] });
};

test("MetaStore keeps the newest of several quick writes", async () => {
  const meta = new MetaStore(new IDBFactory());
  meta.write("one");
  meta.write("two");
  await meta.write("three");
  assert.equal(await meta.read(), "three");
});

test("every save goes to IndexedDB too; the first start copies the journal over", async () => {
  const meta = new MetaStore(new IDBFactory());
  const storage = memory();
  const store = new Store(storage, seed, "2026-11-07", { durableRaw: await meta.read(), persist: (raw) => meta.write(raw) });
  store.update(addTitle("早上的咖啡"));
  await meta.write(storage.getItem("little-days.v1")); // let the queue settle
  assert.equal(await meta.read(), storage.getItem("little-days.v1"));
  // An older install (LocalStorage only) is copied into IndexedDB on start.
  const meta2 = new MetaStore(new IDBFactory());
  let copied = null;
  new Store(storage, seed, "2026-11-07", { durableRaw: null, persist: (raw) => (copied = raw) });
  assert.equal(copied, storage.getItem("little-days.v1"));
});

test("LocalStorage full: the mirror is dropped, the journal carries on in IndexedDB", async () => {
  const meta = new MetaStore(new IDBFactory());
  const storage = memory({ quota: 40000 });
  const store = new Store(storage, seed, "2026-11-07", { durableRaw: null, persist: (raw) => meta.write(raw) });
  store.update((s) => s.entries.push({ id: "big", date: "2026-10-02", title: "长长的一天", body: "字".repeat(50000), photo: "", bookId: "daily", layers: [], media: [], moments: [] }));
  assert.equal(storage.getItem(MIRROR_OFF_KEY), "off");
  assert.equal(storage.getItem("little-days.v1"), null, "no stale mirror left behind");
  assert.ok(store.state.entries.some((e) => e.id === "big"), "the save went through");
  await meta.write(JSON.stringify(store.state));
  // Next start: read from IndexedDB, keep going.
  const again = new Store(storage, seed, "2026-11-07", { durableRaw: await meta.read(), persist: (raw) => meta.write(raw) });
  assert.ok(again.state.entries.some((e) => e.id === "big"));
  again.update(addTitle("又一天"));
  assert.equal(storage.getItem("little-days.v1"), null, "stays off the mirror");
});

test("without IndexedDB a full LocalStorage is still reported, never silently lost", () => {
  const storage = memory({ quota: 40000 });
  const store = new Store(storage, seed, "2026-11-07");
  assert.throws(() => store.update((s) => s.entries.push({ id: "big", date: "2026-10-02", title: "", body: "字".repeat(50000), photo: "", bookId: "daily", layers: [], media: [], moments: [] })));
});

test("a mirror edited elsewhere (newer) wins over the IndexedDB copy", () => {
  const storage = memory();
  const a = new Store(storage, seed, "2026-11-07");
  a.update(addTitle("最新"));
  const oldRaw = JSON.stringify({ ...JSON.parse(storage.getItem("little-days.v1")), entries: [] });
  const b = new Store(storage, seed, "2026-11-07", { durableRaw: oldRaw, persist: () => {} });
  assert.ok(b.state.entries.some((e) => e.title === "最新"));
});
