// V10.28 · Two photos and no words: a balanced pair (side by side, one above
// the other, or staggered) chosen by the photos' shapes — never one big photo,
// one small one and an empty column kept for words nobody wrote.
import test from "node:test";
import assert from "node:assert/strict";
import { layoutMoment, pairLayout, PAIR_KINDS, overlapArea, PAGE_RATIO } from "../Public/js/scrapbook-layout.mjs";

// Shapes phones really make: 4:3, 3:4, 16:9, 9:16 (a screenshot / meme), 1:1.
const COMBOS = {
  "4:3 + 4:3": [4 / 3, 4 / 3],
  "4:3 + 3:4": [4 / 3, 3 / 4],
  "3:4 + 3:4": [3 / 4, 3 / 4],
  "16:9 + 9:16": [16 / 9, 9 / 16],
  "1:1 + 3:4": [1, 3 / 4],
  "3:4 + 4:3": [3 / 4, 4 / 3],
  "9:16 + 9:16": [9 / 16, 9 / 16],
};
const pageOf = (a, b, extra = {}) => ({ visuals: [{ id: "a", aspect: a }, { id: "b", aspect: b }], title: "", time: "09:10", folio: "CAPIDAY · NO. 13", ...extra });
const areaOf = (box) => box.w * box.h;
const edges = (box) => ({ left: box.x - box.w / 2, right: box.x + box.w / 2, top: box.y - box.h / 2, bottom: box.y + box.h / 2 });

for (const [name, [a, b]] of Object.entries(COMBOS)) {
  test(`${name}: three different arrangements, all on the page, no overlap, photos whole`, () => {
    const kinds = [];
    for (const v of [0, 1, 2]) {
      const out = layoutMoment(pageOf(a, b), "editorial", v);
      const [p, q] = [out.place.a, out.place.b];
      kinds.push(out.arrangement);
      for (const box of [p, q]) {
        const e = edges(box);
        assert.ok(e.left >= 6.9 && e.right <= 93.1, `${name} v${v} inside the side margins: ${JSON.stringify(box)}`);
        assert.ok(e.top >= 7.9 && e.bottom <= 95, `${name} v${v} above the folio: ${JSON.stringify(box)}`);
      }
      assert.ok(overlapArea(p, q) < 0.01, `${name} v${v} the two photos do not overlap`);
      // Not cropped: each frame has its photo's own shape.
      assert.ok(Math.abs((p.w * PAGE_RATIO) / p.h - a) < 0.02, `${name} v${v} photo 1 keeps its shape`);
      assert.ok(Math.abs((q.w * PAGE_RATIO) / q.h - b) < 0.02, `${name} v${v} photo 2 keeps its shape`);
      // Words were not written, so no words are made up.
      assert.equal(out.layers.filter((l) => l.bind === "title" || l.bind === "caption").length, 0);
    }
    // Three different pages. V10.33: an arrangement that would make a photo
    // too small to see (a 9:16 beside a 16:9 at the same height) is replaced
    // by another one that passes the quality rules.
    assert.equal(new Set(kinds).size, 3, `${name}: ${kinds}`);
    assert.ok(kinds.filter((k) => PAIR_KINDS.includes(k)).length >= 2, `${name}: mostly the pair arrangements (${kinds})`);
  });

  test(`${name}: the default is balanced and fills the page, with no empty words column`, () => {
    const out = layoutMoment(pageOf(a, b), "editorial", 0);
    const [p, q] = [out.place.a, out.place.b];
    const balance = Math.min(areaOf(p), areaOf(q)) / Math.max(areaOf(p), areaOf(q));
    assert.ok(balance >= 0.5, `${name}: sizes are even enough (${balance.toFixed(2)})`);
    const cover = (areaOf(p) + areaOf(q)) / (86 * 86);
    assert.ok(cover >= 0.38, `${name}: the photos fill the page (${cover.toFixed(2)})`);
    // The pair is centred: as much room on the left as on the right.
    const left = Math.min(edges(p).left, edges(q).left) - 7;
    const right = 93 - Math.max(edges(p).right, edges(q).right);
    assert.ok(Math.abs(left - right) < 0.6, `${name}: centred (left ${left.toFixed(1)}, right ${right.toFixed(1)})`);
  });
}

test("the best arrangement follows the shapes: two landscapes stack, two portraits sit side by side", () => {
  assert.equal(layoutMoment(pageOf(4 / 3, 4 / 3), "editorial", 0).arrangement, "column");
  assert.notEqual(layoutMoment(pageOf(3 / 4, 3 / 4), "editorial", 0).arrangement, "column");
  const r = pairLayout([{ aspect: 3 / 4 }, { aspect: 3 / 4 }], { top: 8, bottom: 94, left: 7, right: 93 }, "bare", 0);
  assert.equal(r.order.length, 3);
  assert.equal(r.order[0], r.kind);
});

test("the pair sits in the middle of the page (the folio line does not count)", () => {
  const out = layoutMoment(pageOf(4 / 3, 3 / 4), "editorial", 1);
  const boxes = Object.values(out.place);
  const top = Math.min(...boxes.map((b) => edges(b).top));
  const bottom = Math.max(...boxes.map((b) => edges(b).bottom));
  assert.ok(top > 15 && bottom < 85, `centred block ${top.toFixed(1)}–${bottom.toFixed(1)}`);
});

test("photos with their own words (no page line) still get a pair, words right under each photo", () => {
  const out = layoutMoment({ ...pageOf(3 / 4, 3 / 4), visuals: [{ id: "a", aspect: 3 / 4, caption: "拿铁" }, { id: "b", aspect: 3 / 4, caption: "早午餐" }] }, "editorial", 0);
  assert.ok(out.arrangement);
  const caps = out.layers.filter((l) => l.bind === "caption");
  assert.equal(caps.length, 2);
  for (const cap of caps) {
    const photo = out.place[cap.captionOf];
    assert.ok(cap.y > photo.y + photo.h / 2 && Math.abs(cap.x - photo.x) < 6, "under its own photo");
  }
});

test("a page line keeps the magazine layout with the words beside the second photo (unchanged)", () => {
  const out = layoutMoment(pageOf(4 / 3, 4 / 3, { title: "周六的咖啡" }), "editorial", 0);
  assert.equal(out.arrangement, undefined);
  assert.equal(out.layers.filter((l) => l.bind === "title").length, 1);
});

test("other styles and other photo counts are not touched", () => {
  for (const style of ["cozy", "playful"]) assert.equal(layoutMoment(pageOf(4 / 3, 3 / 4), style, 0).arrangement, undefined);
  const three = layoutMoment({ visuals: [{ id: "a", aspect: 1 }, { id: "b", aspect: 1 }, { id: "c", aspect: 1 }], title: "" }, "editorial", 0);
  assert.equal(three.arrangement, undefined);
});

test("the same input gives the same page (no randomness)", () => {
  for (const v of [0, 1, 2]) assert.deepEqual(layoutMoment(pageOf(16 / 9, 9 / 16), "editorial", v), layoutMoment(pageOf(16 / 9, 9 / 16), "editorial", v));
});
