// V10.3 · Captain without AI: lines chosen from what happened, plain intent
// reading for the small chat, and picking an earlier page to look back at.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as K from "../Public/js/keeper.mjs";

const strings = JSON.parse(fs.readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json", import.meta.url)));
const photo = (id) => ({ id, kind: "photo", text: "", mediaRef: "photo:x", x: 50, y: 50, scale: 1, rotation: 0 });
const day = (date, moments, extra = {}) => ({ id: "e-" + date, date, title: "", body: "", photo: "", bookId: "daily", layers: [], media: [], moments, ...extra });
const page = (id, title, layers = [], extra = {}) => ({ id, title, body: "", time: "10:00", layers, media: [], ...extra });

test("every line Captain can say exists in both languages; no stage directions, no emoji", () => {
  for (const [group, count] of Object.entries(K.LINE_COUNTS))
    for (let i = 0; i < count; i++) {
      const line = strings[`kc.${group}.${i}`];
      assert.ok(line?.zh && line?.en, `kc.${group}.${i}`);
      assert.doesNotMatch(line.zh + line.en, /[（(][^）)]*(尾巴|点头|tail|nods)[^）)]*[）)]|\p{Extended_Pictographic}/u, `kc.${group}.${i}`);
    }
});

test("facts of the day: pages, photos, last title, days since the last page; sample days never count", () => {
  const state = { entries: [day("2026-11-07", [page("a", "湖边", [photo("p")])]), day("2026-11-09", [page("s", "示例")], { isDemo: true }), day("2026-11-11", [page("b", "咖啡", [photo("1"), photo("2"), photo("3")]), page("c", "散步", [photo("4")])])], drafts: {} };
  const facts = K.dayFacts(state, "2026-11-11", 15);
  assert.deepEqual([facts.pages, facts.photos, facts.title, facts.gap, facts.night], [2, 4, "散步", 4, false]);
  const quiet = K.dayFacts(state, "2026-11-12", 23);
  assert.deepEqual([quiet.pages, quiet.gap, quiet.night], [0, 1, true]);
  assert.equal(K.dayFacts({ entries: [day("2026-11-09", [page("s", "示例")], { isDemo: true })], drafts: {} }, "2026-11-11").keptDays, 0);
});

test("the line fits the situation and is not repeated while others remain", () => {
  const none = K.contextLine("tap", { pages: 0, keptDays: 3, gap: 1, night: false }, { seed: 0 });
  assert.match(none.id, /^tap\.none\./);
  assert.match(K.contextLine("tap", { pages: 0, keptDays: 3, gap: 1, night: true }).id, /^tap\.noneNight\./);
  assert.match(K.contextLine("tap", { pages: 0, keptDays: 3, gap: 5 }).id, /^tap\.back\./);
  assert.match(K.contextLine("tap", { pages: 0, keptDays: 0, gap: null }).id, /^tap\.first\./);
  // With pages today it never asks "anything to record today?".
  for (let seed = 0; seed < 12; seed++) assert.match(K.contextLine("tap", { pages: 2, photos: 4, title: "咖啡" }, { seed }).id, /^tap\.(many|photos)\./);
  assert.match(K.contextLine("tap", { pages: 1, photos: 0, title: "咖啡" }).id, /^tap\.one\./);
  const used = [];
  for (let i = 0; i < 7; i++) used.push(K.contextLine("tap", { pages: 2, photos: 4 }, { recent: used, seed: 0 }).id);
  assert.equal(new Set(used).size, 7, "seven different lines before any repeats");
  assert.deepEqual(K.contextLine("tap", { pages: 3, photos: 5, title: "咖啡" }).values, { count: 3, photos: 5, title: "咖啡", days: 0, untagged: 0 });
  assert.match(K.contextLine("shelf", { count: 3, untagged: 2 }, { seed: 0 }).id, /^shelf\.untagged\./);
  for (let seed = 0; seed < 8; seed++) assert.doesNotMatch(K.contextLine("shelf", { count: 3, untagged: 0, latest: "旅行" }, { seed }).id, /untagged/, "no “add a tag” when every journal has tags");
});

test("after saving: something true about the page instead of a general thank-you; feelings are still met first", () => {
  const say = (key, values) => strings[key].zh.replace(/\{(\w+)\}/g, (_, k) => values[k]);
  const plain = K.localFeedback({ text: "和小林去了街角那家店。", language: "zh", facts: { pages: 1, pagePhotos: 3 }, say, seed: 0 });
  assert.match(plain.text, /3 张照片|照片多/);
  assert.equal(plain.tone, "");
  assert.match(plain.line, /^saved\.photos\./);
  const words = K.localFeedback({ text: "", language: "zh", facts: { pages: 2, pagePhotos: 0, pageWordsOnly: true }, say, seed: 1 });
  assert.match(words.line, /^saved\.(words|more)\./);
  const tired = K.localFeedback({ text: "今天好累，忙到很晚。", language: "zh", facts: { pages: 1, pagePhotos: 3 }, say, seed: 0 });
  assert.match(tired.text, /很长、很累|辛苦了|不轻松/, "a hard day is answered as a hard day, not with a photo count");
  assert.doesNotMatch(tired.text, /尾巴|（/);
});

test("the small chat reads a few plain things; anything else is unknown (answered honestly, not with one stock line)", () => {
  assert.equal(K.localIntent("帮我整理一下今天"), "organize");
  assert.equal(K.localIntent("想翻翻以前的回忆"), "memory");
  assert.equal(K.localIntent("这周我写了什么"), "week");
  assert.equal(K.localIntent("看看我的书架"), "shelf");
  assert.equal(K.localIntent("帮我写一句话"), "write");
  assert.equal(K.localIntent("你好"), "greet");
  assert.equal(K.localIntent("谢谢"), "thanks");
  assert.equal(K.localIntent("今天好累"), "feel");
  assert.equal(K.localIntent("今天想吃蛋糕"), "unknown");
  assert.equal(K.localIntent("Help me write a line"), "write");
  assert.equal(K.localIntent(""), "unknown");
});

test("looking back: my own earlier pages only, never today or a sample, and not the one just shown", () => {
  const state = { entries: [day("2026-11-05", [page("a", "湖边", [photo("p")], { bookId: "travel", body: "风很轻。" })]), day("2026-11-08", [page("b", "读书")]), day("2026-11-09", [page("s", "示例")], { isDemo: true }), day("2026-11-11", [page("t", "今天")])], drafts: {} };
  const seen = [];
  for (let seed = 0; seed < 6; seed++) {
    const m = K.pickMemory(state, "2026-11-11", { exclude: seen.slice(-1), seed });
    assert.ok(["湖边", "读书"].includes(m.title));
    if (seen.length) assert.notEqual(m.key, seen.at(-1));
    seen.push(m.key);
  }
  const lake = K.pickMemory(state, "2026-11-06", { seed: 0 });
  assert.deepEqual([lake.date, lake.momentId, lake.bookId, lake.words, lake.photo, lake.more], ["2026-11-05", "a", "travel", "风很轻。", "photo:x", false]);
  assert.equal(K.pickMemory({ entries: [day("2026-11-09", [page("s", "示例")], { isDemo: true })], drafts: {} }, "2026-11-11"), null);
});

test("earlier pages need the person's own permission (Gentle or Interactive), never in Quiet; the AI hook is unchanged", () => {
  const k = (mode, allowMemories) => K.normalizeKeeper({ enabled: true, mode, allowMemories });
  assert.equal(K.modeAllows(k("gentle", false), "memories"), false);
  assert.equal(K.modeAllows(k("gentle", true), "memories"), true);
  assert.equal(K.modeAllows(k("interactive", true), "memories"), true);
  assert.equal(K.modeAllows(k("quiet", true), "memories"), false);
  assert.equal(K.createFeedbackService({ remote: null }).canUseRemote(k("gentle", true)), false, "no provider, no remote calls");
});
