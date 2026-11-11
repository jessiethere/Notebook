// V10.6 · rich text: marks are ranges over the plain words; toggling,
// typing, plain edits and stored data keep them on the right characters.
import test from "node:test";
import assert from "node:assert/strict";
import * as Rich from "../Public/js/rich-text.mjs";
import { normalizeState } from "../Public/js/model.mjs";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const TEXT = "今天在思考要不要买电脑。";

test("bold on part of the words; the rest stays plain", () => {
  const marks = Rich.toggleMark([], 8, 11, "bold", TEXT.length);
  assert.deepEqual(marks, [{ start: 8, end: 11, bold: true }]);
  assert.equal(TEXT.slice(8, 11), "买电脑");
  assert.equal(Rich.richHTML(TEXT, marks, esc), '今天在思考要不要<span class="rt rt-b" data-m="b">买电脑</span>。');
  assert.deepEqual(Rich.runsOf(TEXT, marks), [{ text: "今天在思考要不要" }, { text: "买电脑", bold: true }, { text: "。" }]);
});

test("looks combine, and a second tap takes one off again", () => {
  let marks = Rich.toggleMark([], 8, 11, "bold", TEXT.length);
  marks = Rich.toggleMark(marks, 5, 11, "underline", TEXT.length);
  assert.deepEqual(marks, [{ start: 5, end: 8, underline: true }, { start: 8, end: 11, bold: true, underline: true }]);
  // Partly bold selection → all bold; all bold → none.
  marks = Rich.toggleMark(marks, 5, 11, "bold", TEXT.length);
  assert.deepEqual(marks, [{ start: 5, end: 11, bold: true, underline: true }]);
  marks = Rich.toggleMark(marks, 5, 11, "bold", TEXT.length);
  assert.deepEqual(marks, [{ start: 5, end: 11, underline: true }]);
  marks = Rich.toggleMark(marks, 0, TEXT.length, "strike", TEXT.length);
  marks = Rich.toggleMark(marks, 0, TEXT.length, "italic", TEXT.length);
  assert.match(Rich.richHTML(TEXT, marks, esc), /data-m="iux"/);
});

test("what the buttons show: a selection needs all of it; a caret continues the character before", () => {
  const marks = [{ start: 8, end: 11, bold: true }];
  assert.equal(Rich.lookAt(marks, 8, 11, TEXT.length).bold, true);
  assert.equal(Rich.lookAt(marks, 7, 11, TEXT.length).bold, false);
  assert.equal(Rich.lookAt(marks, 11, 11, TEXT.length).bold, true, "caret right after 买电脑");
  assert.equal(Rich.lookAt(marks, 8, 8, TEXT.length).bold, false, "caret right before 买电脑");
  assert.deepEqual(Rich.lookAt([], 0, 0, 0), { bold: false, italic: false, underline: false, strike: false });
});

test("words typed with a chosen look get exactly that look", () => {
  const before = TEXT, after = TEXT + "算了";
  const change = Rich.textChange(before, after);
  assert.deepEqual(change, { at: 12, removed: 0, added: 2 });
  const marks = Rich.applyLook([{ start: 8, end: 11, bold: true }], 12, 14, { strike: true }, after.length);
  assert.deepEqual(marks, [{ start: 8, end: 11, bold: true }, { start: 12, end: 14, strike: true }]);
  // Switched off at the end of bold words: the next words are plain.
  assert.deepEqual(Rich.applyLook([{ start: 0, end: 3, bold: true }], 3, 5, {}, 5), [{ start: 0, end: 3, bold: true }]);
});

test("a plain edit elsewhere keeps the marks on their own characters", () => {
  const marks = [{ start: 8, end: 11, bold: true }];
  // Words added in front.
  assert.deepEqual(Rich.editMarks(marks, TEXT, "其实" + TEXT), [{ start: 10, end: 13, bold: true }]);
  // Words removed in front.
  assert.deepEqual(Rich.editMarks(marks, TEXT, TEXT.slice(2)), [{ start: 6, end: 9, bold: true }]);
  // Typed inside the bold words: they stay one bold piece.
  assert.deepEqual(Rich.editMarks(marks, TEXT, "今天在思考要不要买新电脑。"), [{ start: 8, end: 12, bold: true }]);
  // Typed right after the bold words: continues bold (like typing there).
  assert.deepEqual(Rich.editMarks(marks, TEXT, "今天在思考要不要买电脑吗。"), [{ start: 8, end: 12, bold: true }]);
  // The bold words deleted: nothing left to mark.
  assert.deepEqual(Rich.editMarks(marks, TEXT, "今天在思考要不要。"), []);
  // Everything replaced.
  assert.deepEqual(Rich.editMarks(marks, TEXT, ""), []);
  // Mixed Chinese / English, emoji (two UTF-16 units) before the mark.
  const mixed = "Hi 😀 小日子 ok";
  const m2 = Rich.toggleMark([], mixed.indexOf("小日子"), mixed.indexOf("小日子") + 3, "italic", mixed.length);
  const moved = Rich.editMarks(m2, mixed, "Oh, " + mixed);
  assert.equal(("Oh, " + mixed).slice(moved[0].start, moved[0].end), "小日子");
});

test("stored marks are never trusted: odd values are dropped, overlaps merged, text untouched", () => {
  const odd = [null, "x", { start: -5, end: 3, bold: true }, { start: 2, end: 99, italic: true }, { start: 4, end: 4, bold: true }, { start: 1, end: 2 }, { start: "a", end: 3, bold: true }, { start: 6, end: 5, strike: true }];
  assert.deepEqual(Rich.normalizeMarks(odd, 8), [{ start: 0, end: 2, bold: true }, { start: 2, end: 3, bold: true, italic: true }, { start: 3, end: 8, italic: true }]);
  assert.deepEqual(Rich.normalizeMarks("nonsense", 8), []);
  assert.deepEqual(Rich.normalizeMarks(undefined, 8), []);
  assert.equal(Rich.richHTML("a<b>&", undefined, esc), "a&lt;b&gt;&amp;");
  assert.equal(Rich.richHTML("<i>x</i>", [{ start: 0, end: 3, bold: true }], esc), '<span class="rt rt-b" data-m="b">&lt;i&gt;</span>x&lt;/i&gt;');
  const owner = { marks: [{ start: 0, end: 2, bold: true }] };
  Rich.storeMarks(owner, "marks", [], 5);
  assert.equal("marks" in owner, false, "no formatting: no key at all");
});

test("a piece of the words keeps its part of the marks", () => {
  assert.deepEqual(Rich.sliceMarks([{ start: 8, end: 11, bold: true }], 6, 10), [{ start: 2, end: 4, bold: true }]);
  assert.deepEqual(Rich.sliceMarks(undefined, 0, 5), []);
});

test("old pages load unchanged; bad marks in saved data never break loading", () => {
  const state = normalizeState({
    schemaVersion: 1, books: [], habits: [], checks: [], drafts: {},
    entries: [
      { id: "old", date: "2026-01-01", title: "旧的一天", body: "只有文字", layers: [{ id: "t", kind: "text", text: "纯文本" }] },
      { id: "new", date: "2026-01-02", title: "标题", body: TEXT, bodyMarks: [{ start: 8, end: 11, bold: true }, { start: 50, end: 60, bold: true }], titleMarks: "broken",
        layers: [{ id: "l", kind: "text", text: "abc", marks: [{ start: 1, end: 9, underline: true }] }],
        moments: [{ id: "m", title: "页", body: "abcdef", bodyMarks: [{ start: 2, end: 4, italic: true }], layers: [{ id: "x", kind: "text", text: "hi", marks: [{ start: 5, end: 9, bold: true }] }] }] },
    ],
  });
  const [old, next] = state.entries;
  assert.equal(old.title, "旧的一天");
  assert.equal(old.body, "只有文字");
  assert.equal("bodyMarks" in old, false);
  assert.equal("marks" in old.layers[0], false);
  assert.deepEqual(next.bodyMarks, [{ start: 8, end: 11, bold: true }]);
  assert.equal("titleMarks" in next, false);
  assert.equal(next.body, TEXT);
  assert.deepEqual(next.layers[0].marks, [{ start: 1, end: 3, underline: true }]);
  assert.deepEqual(next.moments[0].bodyMarks, [{ start: 2, end: 4, italic: true }]);
  assert.equal("marks" in next.moments[0].layers[0], false);
});
