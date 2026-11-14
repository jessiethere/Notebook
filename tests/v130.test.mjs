// V10.29 · Step 5 regression matrix for the page layouts made in 今天的故事:
// 1–5 photos in the shapes phones make (4:3, 3:4, 16:9, 9:16, 1:1) × no
// words / a short line / a long line × with and without each photo's own
// words × 杂志 / 手账 / 拼贴 × the three layouts. Every photo stays on the
// page, whole and big enough to see; words stay on the page and off the
// photos (except the loose collage, which overlaps on purpose).
import test from "node:test";
import assert from "node:assert/strict";
import { layoutMoment, overlapArea, textBlock, PAGE_RATIO } from "../Public/js/scrapbook-layout.mjs";

const A = { L: 4 / 3, P: 3 / 4, W: 16 / 9, T: 9 / 16, S: 1 };
const SETS = ["L", "P", "T", "S", "LL", "LP", "PP", "WT", "SP", "LLL", "LPT", "PPP", "LLLL", "PSWT", "LPLPL", "PPPPP"];
const TITLES = { none: "", short: "周六的咖啡", long: "今天和朋友在街角的咖啡馆坐了一个下午，聊了很多以前的事，窗外一直在下小雨，感觉很安静也很幸福" };

function check(set, titleKey, style, variant, captions) {
  const visuals = [...set].map((c, i) => ({ id: "p" + i, aspect: A[c], caption: captions && i < 2 ? (i ? "第二张照片的一句话" : "拿铁") : "" }));
  const out = layoutMoment({ visuals, title: TITLES[titleKey], time: "14:42", folio: "CAPIDAY · NO. 13" }, style, variant);
  const where = `${set} · ${titleKey} · ${style} · layout ${variant + 1}${captions ? " · photo words" : ""}`;
  const boxes = visuals.map((v) => out.place[v.id]);
  for (const [i, b] of boxes.entries()) {
    assert.ok(b, `${where}: photo ${i + 1} is placed`);
    // A single landscape photo may open edge to edge (the magazine look).
    const out_ = Math.max(0.5 - (b.x - b.w / 2), b.x + b.w / 2 - 99.5, 0.5 - (b.y - b.h / 2), b.y + b.h / 2 - 99.5);
    assert.ok(out_ <= 0.51, `${where}: photo ${i + 1} on the page (${out_.toFixed(2)} out)`);
    assert.ok(b.w * b.h >= 120, `${where}: photo ${i + 1} big enough to see (${b.w.toFixed(1)} × ${b.h.toFixed(1)})`);
    if (style === "editorial") assert.ok(Math.abs((b.w * PAGE_RATIO) / b.h - A[set[i]]) < 0.02, `${where}: photo ${i + 1} whole, not cropped`);
  }
  if (style === "editorial") for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert.ok(overlapArea(boxes[i], boxes[j]) < 0.5, `${where}: photos ${i + 1} and ${j + 1} do not overlap`);
  const words = out.layers.filter((l) => l.kind === "text" && (l.bind === "title" || l.bind === "caption"));
  if (TITLES[titleKey]) assert.equal(words.filter((l) => l.bind === "title").length, 1, `${where}: the line is on the page`);
  else assert.equal(words.filter((l) => l.bind === "title").length, 0, `${where}: no empty box for words nobody wrote`);
  assert.equal(words.filter((l) => l.bind === "caption").length, captions ? Math.min(2, set.length) : 0, `${where}: each photo's words`);
  for (const l of words) {
    const h = textBlock(l.text, l.fontSize, l.w).height;
    assert.ok(l.y - h / 2 >= 0 && l.y + h / 2 <= 100.2, `${where}: ${l.bind} words on the page`);
    if (style !== "playful") {
      const over = boxes.reduce((s, b) => s + overlapArea({ x: l.x, y: l.y, w: l.w, h }, b), 0) / (l.w * h);
      assert.ok(over <= 0.12, `${where}: ${l.bind} words off the photos (${(over * 100).toFixed(0)}% on one)`);
    }
  }
}

for (const set of SETS)
  test(`${set.length} photo(s) ${set}: every style, layout and amount of words`, () => {
    for (const titleKey of Object.keys(TITLES)) for (const style of ["editorial", "cozy", "playful"]) for (const v of [0, 1, 2]) for (const captions of [false, true]) check(set, titleKey, style, v, captions);
  });

test("many photos and a long line: the others are not shrunk to stamps (every photo in rows instead)", () => {
  const visuals = [..."PPPPP"].map((c, i) => ({ id: "p" + i, aspect: A[c] }));
  const out = layoutMoment({ visuals, title: TITLES.long, time: "14:42" }, "editorial", 0);
  const widths = visuals.map((v) => out.place[v.id].w);
  assert.ok(Math.min(...widths) >= 14, `widths ${widths.map((w) => w.toFixed(1))}`);
});

test("a short line with three photos keeps the big photo on top (unchanged)", () => {
  const visuals = [..."LPP"].map((c, i) => ({ id: "p" + i, aspect: A[c] }));
  const out = layoutMoment({ visuals, title: TITLES.short, time: "14:42" }, "editorial", 0);
  const hero = out.place.p0;
  assert.ok(hero.w > out.place.p1.w && hero.y < out.place.p1.y, "the landscape photo leads at the top");
});

test("two photos and a long line: a balanced pair with the line under it (before, the second photo shrank)", () => {
  for (const [a, b] of [[4 / 3, 3 / 4], [3 / 2, 4 / 5], [4 / 3, 4 / 3]]) {
    const out = layoutMoment({ visuals: [{ id: "a", aspect: a }, { id: "b", aspect: b }], title: TITLES.long, time: "14:42" }, "editorial", 0);
    const [p, q] = [out.place.a, out.place.b];
    const balance = Math.min(p.w * p.h, q.w * q.h) / Math.max(p.w * p.h, q.w * q.h);
    assert.ok(out.arrangement, "laid out as a pair");
    assert.ok(balance >= 0.5, `even sizes (${balance.toFixed(2)})`);
    const line = out.layers.find((l) => l.bind === "title");
    assert.ok(line.y > Math.max(p.y + p.h / 2, q.y + q.h / 2), "the line under the photos");
  }
});
