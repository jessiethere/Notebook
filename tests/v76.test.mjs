// V7.6 search and "On this day" (pure functions).
import test from "node:test";
import assert from "node:assert/strict";
import { searchJournal, onThisDay, snippet, terms, pageTexts } from "../Public/js/search.mjs";

const day = (date, extra = {}) => ({ id: "e-" + date, date, title: "", body: "", photo: "", bookId: "daily", layers: [], media: [], moments: [], ...extra });
const state = () => ({
  books: [{ id: "daily", title: "平凡日子", category: "Daily Life", tags: ["生活"] }, { id: "fit", title: "健身记录", category: "Fitness", description: "练腿和跑步", tags: ["运动", "self awareness"] }],
  habits: [{ id: "move", title: "让身体动起来" }],
  checks: [{ habitId: "move", date: "2026-11-02", minutes: 0, detail: "练腿", note: "深蹲越来越稳" }],
  plans: { "2026-11-03": [{ id: "p1", text: "给妈妈打电话", done: true }, { id: "p2", text: "买花", done: false }] },
  drafts: { "2026-11-04": day("2026-11-04", { title: "还没保存的咖啡" }) },
  entries: [
    day("2025-11-10", { title: "去年的海边", moments: [{ id: "m1", title: "日落", time: "18:20", body: "", tags: ["旅行"], layers: [{ id: "p", kind: "photo", text: "", mediaRef: "photo:beach", x: 50, y: 50, scale: 1, rotation: 0 }] }] }),
    day("2026-10-10", { body: "上个月的今天，读完了一本书" }),
    day("2026-11-01", { title: "窗边的下午", body: "读了几页书，风很温柔。", moments: [{ id: "m2", title: "晚饭", time: "19:05", body: "和朋友吃火锅", tags: ["朋友"], layers: [{ id: "t", kind: "text", text: "辣得流眼泪", x: 0, y: 0, scale: 1, rotation: 0 }, { id: "g", kind: "text", text: "副本", gen: true, x: 0, y: 0, scale: 1, rotation: 0 }] }] }),
    day("2026-11-05", { isDemo: true, title: "示例：咖啡" }),
  ],
});

test("search: words, tags, text on the paper; all words must match; newest first", () => {
  let r = searchJournal(state(), "火锅");
  assert.equal(r.pages.length, 1);
  assert.equal(r.pages[0].momentId, "m2");
  assert.match(r.pages[0].snippet, /火锅/);
  assert.equal(searchJournal(state(), "辣得").pages[0].momentId, "m2", "words placed on the paper");
  assert.equal(searchJournal(state(), "副本").pages.length, 0, "not the day spread's copies");
  assert.equal(searchJournal(state(), "#旅行").pages[0].date, "2025-11-10");
  assert.equal(searchJournal(state(), "朋友 火锅").pages.length, 1);
  assert.equal(searchJournal(state(), "朋友 海边").pages.length, 0, "every word has to match");
  r = searchJournal(state(), "书");
  assert.deepEqual(r.pages.map((p) => p.date), ["2026-11-01", "2026-10-10"]);
});

test("search: drafts count; sample days don't; the day's list and journals are found", () => {
  assert.equal(searchJournal(state(), "还没保存").pages[0].date, "2026-11-04");
  assert.equal(searchJournal(state(), "示例").pages.length, 0);
  const notes = searchJournal(state(), "深蹲");
  assert.equal(notes.pages[0].kind, "list");
  assert.equal(notes.pages[0].date, "2026-11-02");
  assert.equal(searchJournal(state(), "妈妈").pages[0].kind, "list");
  assert.equal(searchJournal(state(), "买花").pages.length, 0, "not the things still to do");
  assert.deepEqual(searchJournal(state(), "运动").books.map((b) => b.id), ["fit"], "journals by tag");
  assert.deepEqual(searchJournal(state(), "SELF").books.map((b) => b.id), ["fit"], "case doesn't matter");
  assert.equal(searchJournal(state(), "   ").pages.length, 0);
});

test("snippet shows the words around the match", () => {
  const text = "今天早上很早就醒了，去楼下买了咖啡，然后在公园里走了很久很久，看到了很多小狗。";
  assert.match(snippet(text, terms("小狗"), 20), /^….*小狗/);
  assert.equal(snippet("短", terms("x")), "短");
  assert.deepEqual(pageTexts({ title: "a", body: "", tags: ["t"] }), ["a", "#t"]);
});

test("on this day: earlier years first; else the same day last month; never sample days", () => {
  const hits = onThisDay(state(), "2026-11-10");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].years, 1);
  assert.equal(hits[0].photo, "photo:beach", "the page with a photo");
  assert.equal(hits[0].momentId, "m1");
  const month = onThisDay(state(), "2026-11-10".replace("11-10", "11-10"));
  assert.ok(month.length);
  const s = state();
  s.entries = s.entries.filter((e) => e.date !== "2025-11-10");
  const fallback = onThisDay(s, "2026-11-10");
  assert.equal(fallback[0].months, 1);
  assert.match(fallback[0].words || fallback[0].title, /读完了一本书/);
  assert.deepEqual(onThisDay(s, "2026-03-31"), [], "no 31 → 1 roll-over");
  s.entries.push(day("2025-11-05", { isDemo: true, title: "示例" }));
  assert.deepEqual(onThisDay(s, "2026-11-05"), []);
});

test("book tags: split on spaces, commas, 、 and #; no repeats; at most 8 and 16 characters", async () => {
  const { parseTags, saveBook, validateStateSnapshot } = await import("../Public/js/model.mjs");
  assert.deepEqual(parseTags("阅读 感恩 健身 阅读"), ["阅读", "感恩", "健身"]);
  assert.deepEqual(parseTags("阅读 感恩 #self awareness"), ["阅读", "感恩", "self awareness"]);
  assert.deepEqual(parseTags("self awareness, 健身、Reading，reading"), ["self awareness", "健身", "Reading"]);
  assert.deepEqual(parseTags("#阅读#感恩"), ["阅读", "感恩"]);
  assert.equal(parseTags("a b c d e f g h i j").length, 8);
  assert.equal(parseTags("x".repeat(30))[0].length, 16);
  assert.deepEqual(parseTags(""), []);
  const s = { books: [] };
  saveBook(s, { id: "b", title: "书", category: "Daily Life", tags: "运动 运动 跑步" });
  assert.deepEqual(s.books[0].tags, ["运动", "跑步"]);
  saveBook(s, { id: "b", title: "书", category: "Daily Life", tags: ["self awareness", "运动"] });
  assert.deepEqual(s.books[0].tags, ["self awareness", "运动"], "a saved list keeps its tags as they are");
  assert.throws(() => validateStateSnapshot({ schemaVersion: 1, books: [{ id: "b", title: "t", category: "c", tags: "not-a-list" }], entries: [], habits: [], checks: [], drafts: {} }));
});
