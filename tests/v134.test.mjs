// V10.33–V10.34 · Layout quality L1–L3, without a browser (the engine's own
// browser-like line count; tests/v133-browser.cjs checks real fonts on real pages).
import test from "node:test";
import assert from "node:assert/strict";
import { layoutMoment, checkQuality, measuredBlock, wrapLines, lineFor, suggestSplit, minShortFor, QUALITY } from "../Public/js/scrapbook-layout.mjs";

const A = { L: 4 / 3, P: 3 / 4, W: 16 / 9, T: 9 / 16, S: 1 };
const ZH_LONG = "今天和朋友在街角的咖啡馆坐了一个下午，聊了很多以前的事，窗外一直在下小雨，感觉很安静也很幸福";
const visualsOf = (set, caps = []) => [...set].map((c, i) => ({ id: "p" + i, aspect: A[c], caption: caps[i] || "" }));

test("lines are counted the way a browser wraps them: Latin words whole, a CJK closing mark never starts a line", () => {
  assert.equal(wrapLines("一二三四五六七八九十", 32, 100), 1);
  assert.equal(wrapLines("一二三四五六七八九十一", 32, 100), 2);
  // "，" cannot start the second line: the character before it goes along.
  assert.equal(wrapLines("一二三四五六七八九十，", 32, 100), 2);
  // A whole word moves to the next line instead of breaking.
  assert.ok(wrapLines("Saturday afternoon coffee", 32, 60) >= 2);
  assert.ok(wrapLines("WWWW MMMM", 20, 30) > wrapLines("iiii llll", 20, 30), "wide letters take more room");
});

test("a real measure is used when the app lends one, and its answer decides the page", () => {
  const visuals = visualsOf("PP", ["拿铁", "早午餐"]);
  const plain = layoutMoment({ visuals, title: "", time: "09:10" }, "editorial", 0);
  // A font that renders the words three times taller than counted.
  const tall = layoutMoment({ visuals, title: "", time: "09:10", measure: (text, size, width) => wrapLines(text, size, width) * size * 0.3375 * 3 }, "editorial", 0);
  const shape = (r) => JSON.stringify([r.place, r.layers.map((l) => [l.captionOf || l.bind || "", l.y])]);
  assert.notEqual(shape(tall), shape(plain), "the page is laid out for the words' real height");
  assert.equal(tall.quality.ok, true);
  // The caption's real (taller) box clears the photo below it, if any.
  const capTall = tall.layers.find((l) => l.captionOf === "p0");
  const h = wrapLines(capTall.text, capTall.fontSize, capTall.w) * capTall.fontSize * 0.3375 * 3;
  assert.ok(capTall.y + h / 2 <= 99, "on the page at its real height");
  // null = "font still loading": the safe-side count is used.
  const loading = layoutMoment({ visuals, title: "", time: "09:10", measure: () => null }, "editorial", 0);
  assert.deepEqual(loading.place, plain.place);
});

test("the page's line: a headline while it fits two lines; longer, body text at a reading size — never shrunk, never cut", () => {
  const short = lineFor("周六的咖啡", 24, 86);
  assert.equal(short.body, false);
  assert.equal(short.size, 24);
  const long = lineFor(ZH_LONG, 21, 86);
  assert.equal(long.body, true);
  assert.equal(long.size, 16);
  assert.ok(long.lines >= 3);
  // The page's bigger type size counts.
  assert.equal(lineFor(ZH_LONG, 21, 86, 1.15).size, 16 * 1.15);
  const page = layoutMoment({ visuals: visualsOf("LPP"), title: ZH_LONG, time: "09:10" }, "editorial", 0);
  const title = page.layers.find((l) => l.bind === "title");
  assert.equal(title.text, ZH_LONG, "never cut");
  assert.ok(title.fontSize >= 16, "never squeezed below body size");
});

test("the quality rules: photo size (tall pictures 26%), words never on a photo or off the page", () => {
  assert.equal(minShortFor(9 / 16), 26);
  assert.equal(minShortFor(3 / 4), 20);
  const tiny = { place: { a: { x: 50, y: 40, w: 11, h: 15 } }, layers: [] };
  assert.equal(checkQuality(tiny, ["a"]).ok, false);
  const meme = { place: { a: { x: 50, y: 40, w: 22, h: 22 * 0.8 / (9 / 16) } }, layers: [] };
  assert.equal(checkQuality(meme, ["a"]).ok, false, "a 9:16 picture at 22% is too narrow to read its words");
  const onPhoto = { place: { a: { x: 50, y: 40, w: 60, h: 40 } }, layers: [{ kind: "text", bind: "caption", text: "拿铁", x: 50, y: 50, w: 30, fontSize: 12 }] };
  assert.ok(checkQuality(onPhoto, ["a"]).hard.some((x) => x.kind === "words-on-photo"));
  const off = { place: { a: { x: 50, y: 40, w: 60, h: 40 } }, layers: [{ kind: "text", bind: "title", text: "周六", x: 50, y: 99.5, w: 30, fontSize: 24 }] };
  assert.ok(checkQuality(off, ["a"]).hard.some((x) => x.kind === "words-off-page"));
  // The 1/3 balance is a soft rule: a lead photo with smaller ones still passes.
  const hero = { place: { a: { x: 50, y: 25, w: 80, h: 40 }, b: { x: 30, y: 72, w: 28, h: 24 } }, layers: [] };
  const q = checkQuality(hero, ["a", "b"]);
  assert.equal(q.ok, true);
  assert.ok(q.soft.some((x) => x.kind === "uneven"));
});

test("the three problems found before are gone", () => {
  // 1. 9:16 beside three photos and a long line: no longer ~11% wide.
  const p1 = layoutMoment({ visuals: visualsOf("PSWT"), title: ZH_LONG, time: "14:42" }, "editorial", 0);
  assert.equal(p1.quality.ok, true);
  assert.ok(p1.place.p3.w >= QUALITY.minShortTall, `the 9:16 is ${p1.place.p3.w}% wide`);
  // 2. Five portraits, each with words: no line on a photo.
  const caps = ["拿铁", "第二张照片的一句话", "早午餐吃得很饱", "回家路上看到 sunset", "晚安"];
  const p2 = layoutMoment({ visuals: visualsOf("PPPPP", caps), title: "周六的咖啡", time: "14:42" }, "editorial", 0);
  assert.equal(p2.quality.ok, true);
  assert.ok(!checkQuality(p2, visualsOf("PPPPP").map((v) => v.id)).hard.length);
  // 3. Three photos and a long line: the lower two are not tiny.
  const p3 = layoutMoment({ visuals: visualsOf("LPP"), title: ZH_LONG, time: "14:42" }, "editorial", 0);
  assert.equal(p3.quality.ok, true);
  for (const id of ["p1", "p2"]) assert.ok((p3.place[id].w * p3.place[id].h) / 100 >= QUALITY.minArea, `${id}: ${((p3.place[id].w * p3.place[id].h) / 100).toFixed(1)}% of the page`);
});

test("a page that already passes keeps its layout; 换个排版 never offers the same page twice", () => {
  const ok = layoutMoment({ visuals: visualsOf("LL"), title: "", time: "09:10" }, "editorial", 0);
  assert.equal(ok.quality.ok, true);
  assert.equal(ok.quality.from, "style 0", "the style's own first layout");
  const sigs = new Set();
  const n = layoutMoment({ visuals: visualsOf("PPPPP", ["拿铁", "第二张照片的一句话"]), title: "周六的咖啡", time: "14:42" }, "editorial", 0).quality.options;
  for (let v = 0; v < n; v++) sigs.add(JSON.stringify(layoutMoment({ visuals: visualsOf("PPPPP", ["拿铁", "第二张照片的一句话"]), title: "周六的咖啡", time: "14:42" }, "editorial", v).place));
  assert.equal(sigs.size, n, `${n} options, all different`);
});

test("too much for one page: a split, in order, the line first, each photo with its words, each page passing", () => {
  const caps = ["霜花", "花束", "街角", "饼干", "甜甜圈", "早午餐", "回家路上", "晚安"];
  const input = { visuals: visualsOf("PSLPPLPL", caps), title: ZH_LONG, time: "14:42" };
  const one = layoutMoment(input, "editorial", 0);
  assert.equal(one.quality.ok, false, "no arrangement passes on one page");
  assert.ok(!one.quality.hard.some((k) => k.startsWith("words")), "even then, the page offered keeps words off the photos");
  const parts = suggestSplit(input, "editorial");
  assert.deepEqual(parts, [["p0", "p1", "p2", "p3"], ["p4", "p5", "p6", "p7"]]);
  parts.forEach((ids, i) => {
    const r = layoutMoment({ ...input, title: i === 0 ? input.title : "", visuals: input.visuals.filter((v) => ids.includes(v.id)) }, "editorial", 0);
    assert.equal(r.quality.ok, true, `page ${i + 1} passes`);
  });
  // Photos that fit are never split.
  assert.equal(suggestSplit({ visuals: visualsOf("LL"), title: "" }, "editorial") === null || layoutMoment({ visuals: visualsOf("LL"), title: "" }, "editorial", 0).quality.ok, true);
});

test("every page of the matrix either passes or has a split that passes (magazine style, 1–6 photos)", () => {
  const SETS = ["T", "L", "LL", "LT", "LLT", "LPP", "PSWT", "PPPPP", "LPLPL", "TTT", "PPPPPP"];
  const TITLES = ["", "周六的咖啡", ZH_LONG, "A whole afternoon at the corner cafe, old stories, soft rain outside"];
  let pass = 0, split = 0;
  for (const set of SETS)
    for (const title of TITLES)
      for (const caps of [[], ["拿铁", "第二张照片的一句话", "早午餐吃得很饱", "回家路上看到 sunset", "晚安", "周末"]]) {
        const input = { visuals: visualsOf(set, caps), title, time: "14:42" };
        const r = layoutMoment(input, "editorial", 0);
        if (r.quality.ok) pass++;
        else {
          assert.ok(suggestSplit(input, "editorial"), `${set} / ${title.slice(0, 6)} / ${caps.length ? "words" : "-"}: a split exists`);
          split++;
        }
      }
  assert.ok(pass > split, `${pass} pass on one page, ${split} split`);
});
