// V10.11 · The Book Reader's positions: the cover is position 0 and is not
// a page; pages are found by identity; progress is a device preference.
import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../Public/js/reader.mjs";

const T = { "reader.coverPos": "封面 · 共 {count} 页", "reader.pagePos": "第 {n} / {count} 页" };
const t = (key, values = {}) => T[key].replace(/\{(\w+)\}/g, (_, k) => values[k]);
const pages = [
  { date: "2026-11-01", entry: {}, moment: { id: "a" } },
  { date: "2026-11-01", entry: {}, moment: { id: "b" } },
  { date: "2026-11-03", entry: {}, moment: null },
  { date: "2026-11-03", entry: {}, moment: { id: "c" } },
  { date: "2026-11-07", entry: {}, moment: { id: "d" } },
  { date: "2026-11-08", entry: {}, moment: { id: "e" } },
  { date: "2026-11-09", entry: {}, moment: { id: "f" } },
  { date: "2026-11-10", entry: {}, moment: { id: "g" } },
];

test("8 pages: 9 positions; the cover is not counted as a page", () => {
  assert.equal(R.positionLabel(0, 8, t), "封面 · 共 8 页");
  assert.equal(R.positionLabel(1, 8, t), "第 1 / 8 页");
  assert.equal(R.positionLabel(8, 8, t), "第 8 / 8 页");
});

test("positions by page identity; a page that is gone lands nearby", () => {
  assert.equal(R.keyOf(null), R.COVER);
  assert.equal(R.keyOf(pages[2]), "2026-11-03|");
  assert.equal(R.keyOf(pages[3]), "2026-11-03|c");
  assert.equal(R.positionOf(pages, R.COVER), 0);
  assert.equal(R.positionOf(pages, "2026-11-03|c"), 4);
  assert.equal(R.positionOf(pages, "2026-11-03|"), 3, "a day's own cover page");
  assert.equal(R.positionOf(pages, "2026-11-03|gone"), 3, "deleted page → same day");
  assert.equal(R.positionOf(pages, "2026-11-05|x"), 4, "a day that is gone → the page before");
  assert.equal(R.positionOf(pages, "2026-10-01|x"), 0, "before everything → the cover");
  assert.equal(R.positionOf([], "2026-11-03|c"), 0);
  assert.equal(R.firstPageOf(pages, "2026-11-03"), 3);
});

test("reading progress is kept per book on this device, and survives bad data", () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
  assert.equal(R.savedPosition("daily", storage), null);
  R.savePosition("daily", "2026-11-03|c", storage);
  R.savePosition("travel", R.COVER, storage);
  assert.equal(R.savedPosition("daily", storage), "2026-11-03|c");
  assert.equal(R.savedPosition("travel", storage), R.COVER);
  store.set(R.READER_POS_KEY, "{broken");
  assert.deepEqual(R.loadPositions(storage), {});
  assert.equal(R.savedPosition("daily", storage), null);
  R.savePosition("", "x", storage);
});
