// V5.5: reordering the shelf (Home follows the same order).
import test from "node:test";
import assert from "node:assert/strict";
import { moveBookTo, stepBook } from "../Public/js/model.mjs";

const shelf = () => ({ books: ["a", "b", "c", "d"].map((id) => ({ id })) });
const ids = (s) => s.books.map((b) => b.id).join("");

test("drop a book before or after another", () => {
  const s = shelf();
  assert.equal(moveBookTo(s, "d", "a"), true);
  assert.equal(ids(s), "dabc");
  assert.equal(moveBookTo(s, "d", "c", true), true);
  assert.equal(ids(s), "abcd");
  assert.equal(moveBookTo(s, "b", "a", true), false, "already there");
  assert.equal(moveBookTo(s, "b", "b"), false);
  assert.equal(moveBookTo(s, "x", "a"), false);
  assert.equal(moveBookTo(s, "a", "x"), false);
  assert.equal(ids(s), "abcd", "nothing lost");
});

test("one step earlier or later, never off the ends", () => {
  const s = shelf();
  assert.equal(stepBook(s, "c", -1), true);
  assert.equal(ids(s), "acbd");
  assert.equal(stepBook(s, "a", -1), false);
  assert.equal(stepBook(s, "d", 1), false);
  assert.equal(ids(s), "acbd");
});

test("sample days: added once to empty dates, marked as samples, removable", async () => {
  const { readFileSync } = await import("node:fs");
  const { createInitialState, addSampleDays, removeSamples, normalizeState } = await import("../Public/js/model.mjs");
  const seed = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json", import.meta.url)));
  const library = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/library.json", import.meta.url)));
  const photos = new Set(library.photos.map((p) => p.id));
  for (const day of seed.sampleDays) for (const page of day.pages) for (const [id] of page.photos || []) assert.ok(photos.has(id), id);
  const state = createInitialState(seed, "2026-11-09");
  // Someone already wrote on one of the sample dates: that day is left alone.
  state.entries.push({ id: "mine", date: "2026-11-06", title: "我的一天", moments: [], layers: [], media: [] });
  const added = addSampleDays(state, seed, "2026-11-09");
  assert.equal(added, seed.sampleDays.length - 1);
  assert.equal(state.entries.find((e) => e.date === "2026-11-06").id, "mine");
  assert.equal(addSampleDays(state, seed, "2026-11-09"), 0, "only once");
  const samples = state.entries.filter((e) => e.isDemo && e.moments.length);
  assert.ok(samples.every((e) => e.moments.every((m) => m.isDemo)));
  const smart = samples.flatMap((e) => e.moments).filter((m) => m.layoutTemplate === "smart");
  assert.ok(smart.length >= 3 && smart.every((m) => m.layers.every((l) => l.aspect > 0 && l.w > 0)));
  const normalized = normalizeState(state);
  assert.ok(normalized.entries.every((e) => e.visibility === "private"));
  const demoCount = normalized.entries.filter((e) => e.isDemo).length;
  assert.equal(removeSamples(normalized), demoCount);
  assert.deepEqual(normalized.entries.map((e) => e.id), ["mine"], "only my own day stays");
  normalized.samplesAdded = 2;
  assert.equal(addSampleDays(normalized, seed, "2026-11-09"), 0, "removed samples do not come back");
});
