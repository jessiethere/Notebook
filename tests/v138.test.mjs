// V10.38 · A3: long words are kept whole; continued over pages when needed.
import test from "node:test";
import assert from "node:assert/strict";
import { layoutMoment, sentencePieces, suggestTextSplit } from "../Public/js/scrapbook-layout.mjs";

const ZH = "今天和朋友在街角的咖啡馆坐了一个下午，聊了很多以前的事。窗外一直在下小雨，书翻到一半就忘了看。回家的路上买了一袋咖啡豆，想把这个下午的味道留久一点。";
const EN = "We drove out before sunrise and the hills were still wrapped in mist. By noon the tent was up, and after dinner we lay on the grass counting stars until it got too cold to stay outside.";
const one = (title, aspects = [1.5]) => ({ visuals: aspects.map((a, i) => ({ id: `p${i}`, aspect: a })), title, time: "", audio: [] });

test("sentence pieces keep every character", () => {
  for (const text of [ZH, EN, "Hi. I said “ok.” Then 走了。好！", "没有标点的一整段".repeat(30), "a\nb\n\nc", ""]) assert.equal(sentencePieces(text).join(""), text);
  assert.deepEqual(sentencePieces("一句。两句！三句"), ["一句。", "两句！", "三句"]);
});

test("the design board's long words fit one page as body text (no split)", () => {
  for (const text of [ZH, EN]) {
    const r = layoutMoment(one(text), "editorial", 0);
    assert.ok(r.quality.ok);
    const line = r.layers.find((l) => l.bind === "title");
    assert.equal(line.text, text, "the whole text on the page");
    assert.equal(line.fontSize, 16, "body size, not a squeezed headline");
    assert.equal(suggestTextSplit(one(text)), null);
  }
});

test("words longer than a page continue on pages of words, joined back exactly", () => {
  for (const [text, aspects] of [[ZH.repeat(6), [1.5]], [(EN + " ").repeat(5), [1.5, 0.8]], ["没有标点的一整段".repeat(60), [0.75]], [ZH.repeat(8), [1.5, 0.75, 1, 1.33, 0.56]]]) {
    assert.equal(layoutMoment(one(text, aspects), "editorial", 0).quality.ok, false);
    const s = suggestTextSplit(one(text, aspects));
    assert.ok(s, "a split is suggested");
    assert.equal(s.texts.join(""), text, "not one character lost or added");
    assert.deepEqual(s.parts.flat().sort(), aspects.map((_, i) => `p${i}`).sort(), "every photo kept");
    assert.ok(s.parts.length >= 2);
    s.parts.forEach((ids, i) => {
      const r = layoutMoment({ ...one(s.texts[i]), visuals: ids.map((id) => ({ id, aspect: aspects[Number(id.slice(1))] })) }, "editorial", 0);
      assert.ok(r.quality.ok, `page ${i + 1} passes the quality rules`);
    });
    assert.ok(s.texts.every((x) => x.trim()) || s.parts[0].length, "no empty page of words");
  }
});

test("a page of only words lays out from the top, never off the page", () => {
  const r = layoutMoment({ visuals: [], title: ZH, time: "08:10", audio: [] }, "editorial", 0);
  assert.ok(r.quality.ok);
  assert.equal(r.arrangement, "text");
  for (const style of ["editorial", "cozy", "playful", "scrapbook"]) assert.doesNotThrow(() => layoutMoment({ visuals: [], title: EN, audio: [] }, style, 1));
});
