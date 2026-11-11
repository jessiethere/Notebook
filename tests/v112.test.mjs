// V10.12 · The Journal Studio guide: when it opens by itself, what each step
// points at, and that its memory is a device preference (never journal data).
import test from "node:test";
import assert from "node:assert/strict";
import * as G from "../Public/js/studio-guide.mjs";
import { readFileSync } from "node:fs";

const memory = () => {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
};

test("opens by itself only for someone new; an update never re-teaches people who already keep pages", () => {
  const fresh = G.loadGuide(memory());
  assert.equal(fresh.tour, null);
  assert.equal(G.shouldAutoStart(fresh, { entries: [], drafts: {} }), true, "a new person");
  assert.equal(G.shouldAutoStart(fresh, { entries: [{ date: "2026-10-30", isDemo: true }], drafts: {} }), true, "sample pages do not count");
  assert.equal(G.shouldAutoStart(fresh, { entries: [{ date: "2026-11-01" }], drafts: {} }), false, "has pages of their own (used the editor before)");
  assert.equal(G.shouldAutoStart(fresh, { entries: [], drafts: { "2026-11-11": {} } }), false, "has a draft");
  for (const outcome of ["done", "skipped"]) {
    const s = memory();
    G.finishTour(outcome, s);
    assert.equal(G.loadGuide(s).tour, outcome);
    assert.equal(G.shouldAutoStart(G.loadGuide(s), { entries: [], drafts: {} }), false, `after ${outcome}`);
  }
});

test("its memory is one device key; broken values are ignored, never thrown", () => {
  const s = memory();
  G.finishTour("done", s);
  G.markTip("dblTap", s);
  assert.deepEqual([...s.data.keys()], [G.GUIDE_KEY]);
  const saved = JSON.parse(s.getItem(G.GUIDE_KEY));
  assert.equal(saved.tour, "done");
  assert.equal(saved.tips.dblTap, true);
  assert.equal(G.tipSeen(G.loadGuide(s), "dblTap"), true);
  for (const bad of ["{", "[]", '"x"', '{"tour":"maybe","tips":[1]}']) {
    s.setItem(G.GUIDE_KEY, bad);
    assert.equal(G.loadGuide(s).tour, null, bad);
    assert.deepEqual(G.loadGuide(s).tips, {}, bad);
  }
  assert.doesNotThrow(() => G.finishTour("done", { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } }));
});

test("three steps, each pointing at a real thing on the page (or saying how to get one)", () => {
  assert.deepEqual(G.STEPS.map((s) => s.id), ["move", "type", "adjust"]);
  const [move, type, adjust] = G.STEPS;
  const layers = [
    { id: "t1", kind: "text", text: "今天" },
    { id: "p1", kind: "photo", mediaRef: "media:x" },
    { id: "s1", kind: "sticker", assetId: "leaf" },
  ];
  assert.deepEqual(G.stepTarget(move, layers), { kind: "layer", id: "p1", layerKind: "photo" }, "move: a photo first");
  assert.deepEqual(G.stepTarget(type, layers), { kind: "layer", id: "t1", layerKind: "text" });
  assert.deepEqual(G.stepTarget(adjust, layers, "s1"), { kind: "layer", id: "s1", layerKind: "sticker" }, "adjust: what is selected");
  assert.deepEqual(G.stepTarget(adjust, layers), { kind: "layer", id: "p1", layerKind: "photo" });
  // An empty page: no pretending.
  assert.deepEqual(G.stepTarget(move, []), { kind: "paper" });
  assert.deepEqual(G.stepTarget(type, [{ id: "p1", kind: "photo" }]), { kind: "addText" });
  assert.equal(G.stepCopy(type, { kind: "addText" }).body, "guide.type.bodyAdd");
  assert.equal(G.stepCopy(move, { kind: "paper" }).body, "guide.move.bodyEmpty");
  assert.equal(G.stepCopy(type, { kind: "layer" }).body, "guide.type.body");
  // A drawing is a photo layer but not "a photo" to move first.
  assert.deepEqual(G.stepTarget(move, [{ id: "d", kind: "photo", drawing: true }, { id: "t", kind: "text" }]), { kind: "layer", id: "t", layerKind: "text" });
});

test("every guide string exists in Chinese and English", () => {
  const i18n = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json", import.meta.url)));
  const keys = new Set(["guide.count", "guide.skip", "guide.next", "guide.prev", "guide.done", "guide.tip.dblTap", "more.guide"]);
  for (const step of G.STEPS) {
    keys.add(step.title);
    keys.add(step.body);
    for (const kind of ["paper", "addText"]) keys.add(G.stepCopy(step, { kind }).body);
  }
  for (const key of keys) {
    assert.ok(i18n[key]?.zh && i18n[key]?.en, key);
  }
  assert.equal(i18n["guide.move.body"].zh, "按住并拖动，给照片和文字换个位置。");
  assert.equal(i18n["guide.type.body"].zh, "双击文字，直接开始写。");
});
