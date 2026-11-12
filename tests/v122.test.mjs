// V10.22 · the read-only media check: every way a picture can fail is told
// apart, nothing in storage changes, and the copied report has no words.
import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { MediaStore, errName, kindOf } from "../Public/js/media.mjs";
import { inspectMedia, mediaUses, reportText, STATUSES } from "../Public/js/media-check.mjs";
import { cleanData } from "../Public/js/events.mjs";

const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const page = (layers, extra = {}) => ({ id: "m" + layers.length, title: "私人的标题", body: "私人的正文", layers, media: [], ...extra });
const photo = (n) => ({ id: "l" + n, kind: "photo", mediaRef: `media:${ID(n)}` });

async function store() {
  const media = new MediaStore(new IDBFactory());
  await media.open();
  return media;
}
async function raw(media, record) {
  await media.write(record, "put");
}
const all = async (media) =>
  new Promise((resolve) => {
    const r = media.db.transaction("media").objectStore("media").getAll();
    r.onsuccess = () => resolve(r.result);
  });

test("each kind of failure is told apart; ok files stay ok", async () => {
  const media = await store();
  const ok = await media.put(new Blob(["pic"], { type: "image/jpeg" }), { kind: "photo" }, null);
  await raw(media, { id: ID(2), kind: "photo", mime: "image/jpeg", bytes: new ArrayBuffer(0) }); // empty
  await raw(media, { id: ID(3), kind: "photo", mime: "image/jpeg" }); // no data at all
  await raw(media, { id: ID(9), kind: "photo", mime: "image/jpeg", bytes: new Uint8Array([1]).buffer }); // nobody uses it
  const state = {
    entries: [],
    books: [],
    checks: [],
    drafts: {
      "2026-11-12": { date: "2026-11-12", layers: [], media: [], moments: [page([{ id: "a", kind: "photo", mediaRef: `media:${ok}` }, photo(2), photo(3), photo(4), { id: "bad", kind: "photo", mediaRef: "blob:https://x/123" }])] },
    },
  };
  const result = await inspectMedia(media, state, { decode: false });
  assert.deepEqual(STATUSES.map((s) => result.counts[s]), [1, 1, 1, 1, 0, 1], JSON.stringify(result.counts));
  assert.equal(result.referenced, 4);
  assert.equal(result.stored, 4);
  assert.equal(result.unused, 1);
  const bad = result.items.find((i) => i.status === "badref");
  assert.deepEqual([bad.date, bad.page, bad.draft], ["2026-11-12", 1, true]);
});

test("an older Blob record is read but not rewritten by the check", async () => {
  const media = await store();
  await raw(media, { id: ID(5), kind: "photo", mime: "image/jpeg", blob: new Blob(["old"], { type: "image/jpeg" }) });
  const state = { entries: [{ date: "2026-11-01", layers: [photo(5)], media: [], moments: [] }], books: [], checks: [], drafts: {} };
  const before = JSON.stringify(await all(media), (k, v) => (v instanceof Blob ? "blob" : v));
  const result = await inspectMedia(media, state, { decode: false });
  assert.equal(result.counts.ok, 1);
  assert.equal(result.legacy, 1);
  const after = JSON.stringify(await all(media), (k, v) => (v instanceof Blob ? "blob" : v));
  assert.equal(after, before, "storage unchanged");
});

test("the copied report has no titles or words, only dates, kinds and error names", async () => {
  const media = await store();
  const state = { entries: [], books: [], checks: [], drafts: { "2026-11-12": { date: "2026-11-12", layers: [], media: [], moments: [page([photo(7)])] } } };
  const result = await inspectMedia(media, state, { decode: false });
  const env = { engine: "WebKit", browser: "in-app web view", platform: "iOS", shell: "", address: "https://example.test", embedded: true, parent: "https://claude.ai", standalone: false, persisted: false, usage: 1048576, quota: 2097152, idb: "ok", localStorage: "ok", ua: "Mozilla/5.0 (iPhone)" };
  const text = reportText({ env, result, events: [{ e: "media_read_failed", t: 0, kind: "photo", stage: "blob", err: "notreadableerror" }], version: "10.22", now: new Date(0) });
  assert.doesNotMatch(text, /私人/);
  assert.match(text, /missing\s+photo\s+2026-11-12 p1 draft 00000000/);
  assert.match(text, /embedded yes in https:\/\/claude\.ai/);
  assert.match(text, /persisted no/);
  assert.match(text, /media_read_failed photo stage=blob err=notreadableerror/);
});

test("media failures reach the local log with their stage and error name only", async () => {
  const media = await store();
  const seen = [];
  media.onEvent = (name, data) => seen.push([name, cleanData(data)]);
  const broken = { type: "image/jpeg", arrayBuffer: () => Promise.reject(Object.assign(new Error("gone"), { name: "NotReadableError" })) };
  await assert.rejects(media.put(broken, { kind: "photo", name: "secret.jpg" }));
  assert.deepEqual(seen, [["media_save_failed", { kind: "photo", stage: "read", err: "notreadableerror" }]]);
  // missing record: reported once, however often it is asked for
  await media.readable(ID(8));
  await media.readable(ID(8));
  assert.deepEqual(seen.slice(1), [["media_missing", {}]]);
  assert.equal(errName({ name: "QuotaExceededError" }), "quotaexceedederr");
  assert.equal(kindOf("", "video/mp4"), "video");
});

test("mediaUses: a page's photo, its original, a clip and its cover", () => {
  const { uses, badRefs } = mediaUses({
    entries: [],
    books: [],
    checks: [],
    drafts: { d: { date: "2026-11-12", layers: [], moments: [page([{ id: "p", kind: "photo", mediaRef: `media:${ID(1)}`, sourceRef: `media:${ID(2)}` }], { media: [{ id: "c", kind: "video", source: `media:${ID(3)}`, poster: `media:${ID(4)}` }] })], media: [] } },
  });
  assert.equal(uses.size, 4);
  assert.equal(uses.get(ID(3)).type, "clip");
  assert.equal(badRefs.length, 0);
});
