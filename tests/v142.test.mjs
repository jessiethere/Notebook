// V10.41 · One definition of day / Moment / page for every view (pages.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import { visiblePages, dayCounts, bookCounts, isSampleDay, isDayCover, dayPageShown } from "../Public/js/pages.mjs";
import { bookSharePages } from "../Public/js/book-share.mjs";

const photo = (ref, gen = false) => ({ id: ref + (gen ? "-g" : ""), kind: "photo", mediaRef: `media:${ref}`, x: 50, y: 50, w: 40, scale: 1, rotation: 0, ...(gen ? { gen: true } : {}) });
const moment = (id, refs, bookId = "daily") => ({ id, title: id, body: "", bookId, layers: refs.map((r) => photo(r)), media: [] });
const day = (date, extra = {}) => ({ id: date, date, title: "", body: "", photo: "", bookId: "daily", layers: [], media: [], moments: [], isDemo: false, ...extra });

const state = {
  books: [{ id: "daily" }, { id: "food" }],
  drafts: {},
  entries: [
    // A day of three Moments with an old day cover (shown).
    day("2026-11-10", { layoutTemplate: "scrapbook", layers: [photo("a", true), photo("c", true)], moments: [moment("m1", ["a", "b"]), moment("m2", ["c"]), moment("m3", ["d"], "food")] }),
    // The same, cover hidden.
    day("2026-11-11", { layoutTemplate: "scrapbook", dayCoverHidden: true, layers: [photo("e", true)], moments: [moment("m4", ["e"]), moment("m5", ["f", "e"])] }),
    // An older written day page (not a day cover) + a Moment.
    day("2026-11-12", { title: "my words", moments: [moment("m6", [])] }),
    // A sample day never saved.
    day("2026-11-09", { isDemo: true, title: "sample", moments: [moment("s1", ["s"])] }),
    // A sample day the person saved: theirs, pages still flagged.
    day("2026-11-08", { isDemo: false, moments: [{ ...moment("s2", ["t"]), isDemo: true }] }),
  ],
};

test("pages: day cover counted while shown, not when hidden; older day page always", () => {
  assert.equal(isDayCover(state.entries[0]), true);
  assert.equal(isDayCover(state.entries[2]), false, "a written day page is not a day cover");
  assert.equal(dayPageShown(state.entries[1]), false, "hidden cover not read");
  assert.equal(dayCounts(state, "2026-11-10").pages, 4, "cover + 3 Moments");
  assert.equal(dayCounts(state, "2026-11-11").pages, 2, "hidden cover not counted");
  assert.equal(dayCounts(state, "2026-11-12").pages, 2, "day page + Moment");
  assert.equal(dayCounts(state, "2026-11-10").moments, 3);
  assert.equal(dayCounts(state, "2026-11-10").photos, 4, "cover copies counted once");
  assert.equal(dayCounts(state, "2026-11-11").photos, 2, "a photo used twice counts once");
});

test("samples: an unsaved sample day is nowhere; a saved one is the person's", () => {
  assert.equal(isSampleDay(state.entries[3]), true);
  assert.equal(dayCounts(state, "2026-11-09").pages, 0);
  assert.equal(dayCounts(state, "2026-11-09", { samples: "only" }).pages, 2);
  assert.equal(dayCounts(state, "2026-11-08").pages, 1, "saved sample day: its flagged page is shown");
  assert.ok(!visiblePages(state).some((p) => p.date === "2026-11-09"));
});

test("books: days and pages from the same pages the Reader and PDF use", () => {
  assert.deepEqual(bookCounts(state, "daily"), { days: 4, pages: 8 });
  assert.deepEqual(bookCounts(state, "food"), { days: 1, pages: 1 });
  assert.equal(bookSharePages(state, "daily").length, 8, "Reader / PDF list = the same 8 pages");
  assert.equal(bookSharePages(state, "daily", { includeDemo: true }).length, 10, "older callers can still ask for samples");
});
