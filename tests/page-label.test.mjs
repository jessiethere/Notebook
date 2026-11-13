// V10.27 · Optional titles: the display label never writes the title and
// never says "untitled".
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageLabel, pageLine, dayLabel, pageWords, pageMedia, clip } from "../Public/js/page-label.mjs";

const dict = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json", import.meta.url)));
const tr = (lang) => (key, values = {}) => String(dict[key]?.[lang] ?? key).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
const zh = tr("zh"), en = tr("en");
const photo = (id) => ({ id, kind: "photo", text: "photo", mediaRef: `media:${id.padEnd(36, "0")}`, x: 50, y: 50, scale: 1, rotation: 0 });

test("the person's own title wins and is shown exactly", () => {
  const page = { title: "  海边  ", layers: [photo("a")] };
  assert.deepEqual(pageLabel(page, { t: zh }), { title: "海边", label: "海边", source: "title" });
});

test("no title: a short piece of their own words, never written into the title", () => {
  const page = { title: "", body: "今天和朋友去海边散步，风很大但是很开心", layers: [photo("a")] };
  const out = pageLabel(page, { t: zh });
  assert.equal(out.source, "words");
  assert.equal(out.label, "今天和朋友去海边散步，风很大但是很…");
  assert.equal(page.title, "", "title left empty");
  assert.equal(pageLabel(page, { t: zh, words: false }).source, "media", "words can be skipped when shown nearby");
});

test("no title, no words: what is on the page, in both languages", () => {
  const page = { time: "11:05", layers: [photo("a"), photo("b")] };
  assert.equal(pageLine(page, { t: zh }), "11:05 · 2 张照片");
  assert.equal(pageLine(page, { t: en }), "11:05 · 2 photos");
  assert.equal(pageLabel({ layers: [photo("a")] }, { t: en }).label, "1 photo");
  const clips = { media: [{ id: "v1", kind: "video" }], layers: [photo("a"), { id: "l2", kind: "video", clipId: "v1", text: "v", x: 1, y: 1, scale: 1, rotation: 0 }] };
  assert.equal(pageLabel(clips, { t: zh }).label, "1 张照片 · 1 段视频");
  assert.equal(pageLabel(clips, { t: en }).label, "1 photo · 1 video");
});

test("drawings and day-spread copies are not counted as photos; a library backdrop is", () => {
  const page = { backdrop: "photo:beach-day", layers: [{ ...photo("d"), drawing: true }, { ...photo("g"), gen: true }] };
  assert.deepEqual(pageMedia(page), { photos: 1, videos: 0, audios: 0 });
});

test("nothing on the page: the time of day, then the page number, never 'untitled'", () => {
  assert.equal(pageLine({ time: "19:57" }, { t: zh }), "19:57 · 傍晚记录");
  assert.equal(pageLine({ time: "21:03" }, { t: en }), "21:03 · Evening notes");
  assert.equal(pageLine({ time: "23:40" }, { t: zh }), "23:40 · 晚间记录");
  assert.equal(pageLabel({}, { t: zh, index: 1 }).label, "第 2 页");
  assert.equal(pageLabel({}, { t: en }).label, "A page");
  for (const lang of ["zh", "en"]) for (const key of Object.keys(dict)) if (key.startsWith("label.")) assert.doesNotMatch(dict[key][lang], /未命名|无标题|Untitled/i, key);
  assert.equal(dict["moment.untitled"], undefined);
  assert.equal(dict["entry.untitled"], undefined);
});

test("three untitled pages on one day are told apart", () => {
  const pages = [
    { time: "11:05", layers: [photo("a"), photo("b")] },
    { time: "19:57", layers: [photo("c"), photo("d"), photo("e")] },
    { time: "21:03", body: "晚饭吃了火锅" },
  ];
  const lines = pages.map((p, index) => pageLine(p, { t: zh, index }));
  assert.deepEqual(lines, ["11:05 · 2 张照片", "19:57 · 3 张照片", "21:03 · 晚饭吃了火锅"]);
  assert.equal(new Set(lines).size, 3);
});

test("a whole day: title, then a page title, then words, then what it holds", () => {
  assert.equal(dayLabel({ title: "生日", moments: [] }, { t: zh }), "生日");
  assert.equal(dayLabel({ moments: [{ title: "" }, { title: "晚饭" }] }, { t: zh }), "晚饭");
  assert.equal(dayLabel({ moments: [{ layers: [photo("a")] }, { layers: [photo("b"), photo("c")] }, {}] }, { t: zh }), "3 页 · 3 张照片");
  assert.equal(dayLabel({ moments: [] }, { t: en }), "This day");
});

test("words: text layers count, bound titles and copies do not; clip keeps whole characters", () => {
  const page = { title: "标题", layers: [{ kind: "text", bind: "title", text: "标题" }, { kind: "text", gen: true, text: "副本" }, { kind: "text", text: "  一句  话 " }] };
  assert.equal(pageWords(page), "一句 话");
  assert.equal(clip("😀😀😀", 2), "😀…");
});
