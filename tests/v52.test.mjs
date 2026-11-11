// V5.2: the shape-aware ("smart") layout, the local test log.
import test from "node:test";
import assert from "node:assert/strict";
import { smartLayout, cropLoss, rowPartitions, justify, SMART_REGION, SMART_VARIANTS, safeAspect, PAGE_RATIO } from "../Public/js/smart-layout.mjs";
import { applyLayout, photoLayer } from "../Public/js/day.mjs";
import { logEvent, readEvents, cleanData, summarize, MAX_EVENTS, EVENTS_KEY } from "../Public/js/events.mjs";

const memory = () => {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
};
const inside = (s) => s.x - s.w / 2 >= -0.01 && s.x + s.w / 2 <= 100.01 && s.y - s.h / 2 >= -0.01 && s.y + s.h / 2 <= 100.01;
const overlap = (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w - 0.05 && Math.abs(a.y - b.y) * 2 < a.h + b.h - 0.05;

test("every row arrangement is listed once", () => {
  assert.deepEqual(rowPartitions(3), [[1, 1, 1], [1, 2], [2, 1], [3]]);
  assert.equal(rowPartitions(6, 3).length, 24);
});

test("photos keep their own shape: nothing is cropped in the clean and hero looks", () => {
  const sets = [[1.5], [0.75], [1.5, 0.75], [1.5, 1.5, 0.75], [0.75, 0.75, 1.5, 1, 1.33], Array(8).fill(1.5), [1, 1, 1, 1]];
  for (const aspects of sets)
    for (const variant of [0, 2]) {
      const slots = smartLayout(aspects, variant);
      assert.equal(slots.length, aspects.length);
      assert.ok(Math.max(...cropLoss(aspects, slots)) < 0.02, `${aspects} / ${variant}`);
      assert.ok(slots.every(inside), "on the page");
      if (aspects.length > 1 || variant === 0) {
        for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) assert.ok(!overlap(slots[i], slots[j]), `no overlap ${aspects} / ${variant}`);
        assert.ok(slots.every((s) => s.y + s.h / 2 <= SMART_REGION.bottom + 0.01), "above the caption");
      }
    }
});

test("three looks to shuffle, each different", () => {
  assert.deepEqual(SMART_VARIANTS, ["clean", "scrapbook", "hero"]);
  for (const aspects of [[1.5, 1.5, 0.75], [1.33, 1.33, 1.33], [1, 1, 1, 1], [0.75]]) {
    const looks = [0, 1, 2].map((v) => JSON.stringify(smartLayout(aspects, v).map((s) => [s.x, s.y, s.w, s.h, s.frame])));
    assert.equal(new Set(looks).size, 3, String(aspects));
  }
  const scrapbook = smartLayout([1.5, 0.75, 1], 1);
  assert.ok(scrapbook.every((s) => s.frame === "border" && s.rotation !== 0));
  const big = smartLayout([1.2], 2)[0];
  assert.equal(big.w, 100, "one photo can span the page");
  assert.ok(cropLoss([1.2], [big])[0] < 0.02, "…without being cropped");
  const tall = smartLayout([0.75], 2)[0];
  assert.equal(tall.h, 100);
  assert.ok(cropLoss([0.75], [tall])[0] < 0.02);
});

test("rows use the page's 4:5 shape; odd sizes are tamed", () => {
  const { slots } = justify([1.5], [1]);
  assert.ok(Math.abs((slots[0].w / slots[0].h) * PAGE_RATIO - 1.5) < 0.001);
  assert.equal(safeAspect(undefined), 1);
  assert.equal(safeAspect(40), 3.5);
  assert.equal(safeAspect(-1), 1);
});

test("a smart page lays out framed photos only, and remembers its look", () => {
  const drawing = photoLayer("media:ink", "drawing", { x: 20, y: 20, w: 30, h: 10, drawing: true });
  const page = { layers: [photoLayer("media:a", "a", { aspect: 1.5 }), drawing, photoLayer("media:b", "b", { aspect: 0.75 })], layoutVariant: 1 };
  assert.equal(applyLayout(page, "smart"), 2);
  assert.equal(page.layoutTemplate, "smart");
  assert.equal(page.layoutVariant, 1);
  assert.equal(page.layers[0].frame, "border");
  assert.deepEqual([drawing.x, drawing.y], [20, 20]);
});

test("the test log keeps no content and stays small", () => {
  const storage = memory();
  assert.deepEqual(cleanData({ ms: 1234.6, way: "photo", title: "我的秘密", photo: "media:abc", line: true }), { ms: 1235, way: "photo", line: true });
  logEvent("page_done", { ms: 80000, taps: 6, title: "secret" }, storage, 1000);
  logEvent("Bad Name!", {}, storage);
  assert.deepEqual(readEvents(storage), [{ e: "page_done", t: 1000, ms: 80000, taps: 6 }]);
  for (let i = 0; i < MAX_EVENTS + 20; i++) logEvent("export", {}, storage, 2000 + i);
  assert.equal(readEvents(storage).length, MAX_EVENTS);
  assert.doesNotMatch(storage.getItem(EVENTS_KEY), /secret|我的秘密/);
  const summary = summarize([{ e: "page_done", t: Date.UTC(2026, 10, 1), ms: 60000 }, { e: "page_done", t: Date.UTC(2026, 10, 2), ms: 90000 }, { e: "share", t: Date.UTC(2026, 10, 2) }]);
  assert.deepEqual([summary.quickPages, summary.activeDays, summary.shares, summary.medianSeconds], [2, 2, 1, 90]);
});

test("what's new: newest first, both languages, one entry per version", async () => {
  const { UPDATES, LATEST, hasUnseen, markSeen } = await import("../Public/js/whats-new.mjs");
  assert.equal(LATEST, UPDATES[0].version);
  const versions = UPDATES.map((u) => u.version);
  assert.equal(new Set(versions).size, versions.length);
  // Dotted versions compare part by part (10.10 comes after 10.9).
  const parts = (v) => String(v).split(".").map(Number);
  const newer = (a, b) => { const [x, y] = [parts(a), parts(b)]; for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); return 0; };
  assert.deepEqual([...versions].sort(newer), versions, "newest first");
  for (const u of UPDATES) for (const lang of ["zh", "en"]) assert.ok(u[lang].title && u[lang].items.length, `${u.version} ${lang}`);
  const storage = memory();
  assert.equal(hasUnseen(storage), true);
  markSeen(storage);
  assert.equal(hasUnseen(storage), false);
});
