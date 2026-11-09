// V5.4: sharing a book with family as a PDF (read-only), page order.
import test from "node:test";
import assert from "node:assert/strict";
import { bookSharePages, limitPages, dateRange, buildPdf, PDF_PAGE, MAX_SHARE_PAGES } from "../Public/js/book-share.mjs";

const state = {
  entries: [
    { date: "2026-11-03", bookId: "us", title: "纪念日", layers: [], media: [], moments: [{ id: "m1", bookId: "us", title: "晚饭" }, { id: "m2", bookId: "daily", title: "加班" }] },
    { date: "2026-11-01", bookId: "daily", title: "", body: "", layers: [], media: [], moments: [{ id: "m3", bookId: "us", title: "看海" }] },
    { date: "2026-11-02", bookId: "us", isDemo: true, title: "示例", layers: [], media: [], moments: [] },
  ],
  drafts: {
    "2026-11-03": { date: "2026-11-03", bookId: "us", title: "未保存的改动", moments: [] },
    "2026-11-05": { date: "2026-11-05", bookId: "us", title: "", layers: [], media: [], moments: [{ id: "m4", title: "散步" }] },
  },
};

test("a book's pages, oldest first: the day's cover, then its pages in order", () => {
  const pages = bookSharePages(state, "us");
  assert.deepEqual(pages.map((p) => [p.date, p.moment ? p.moment.title : "cover:" + p.entry.title]), [
    ["2026-11-01", "看海"],
    ["2026-11-03", "cover:纪念日"],
    ["2026-11-03", "晚饭"],
    ["2026-11-05", "散步"],
  ]);
  assert.deepEqual(dateRange(pages), { from: "2026-11-01", to: "2026-11-05" });
  assert.equal(bookSharePages(state, "daily").length, 1, "another book's pages stay out");
  assert.equal(dateRange([]), null);
});

test("long books keep the most recent pages", () => {
  const many = Array.from({ length: MAX_SHARE_PAGES + 5 }, (_, i) => ({ date: String(i) }));
  const { pages, skipped } = limitPages(many);
  assert.equal(pages.length, MAX_SHARE_PAGES);
  assert.equal(skipped, 5);
  assert.equal(pages[0].date, "5");
});

test("the PDF is well formed: one page per picture, offsets point at objects", () => {
  const jpeg = { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), width: 1080, height: 1350 };
  const pdf = buildPdf([jpeg, jpeg, jpeg], { title: "我们俩" });
  const text = new TextDecoder("latin1").decode(pdf);
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.trimEnd().endsWith("%%EOF"));
  assert.equal(text.match(/\/Type \/Page /g).length, 3);
  assert.match(text, new RegExp(`/MediaBox \\[0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}\\]`));
  assert.match(text, /\/Title <FEFF6211.*>/, "title in UTF-16");
  // Every xref offset lands on "N 0 obj".
  const startxref = Number(text.match(/startxref\n(\d+)/)[1]);
  const table = text.slice(startxref).split("\n").slice(3).filter((line) => / n $/.test(line));
  table.forEach((line, i) => {
    const offset = Number(line.slice(0, 10));
    assert.ok(text.startsWith(`${i + 1} 0 obj`, offset), `object ${i + 1}`);
  });
});
