// Scene of the day + the shared scene catalog (original illustrations).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createInitialState, sceneOfDay } from "../Public/js/model.mjs";

const R = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const seed = JSON.parse(readFileSync(new URL("seed.json", R)));
const library = JSON.parse(readFileSync(new URL("library.json", R)));

test("every scene is listed with an original-art notice and its file exists", () => {
  assert.equal(library.scenes.length, 33);
  // Six collections, each listed with names and a line about it.
  assert.deepEqual(library.sceneCollections.map((c) => c.id), ["life", "color", "ribbons", "kaleido", "pattern", "sky"]);
  for (const c of library.sceneCollections) {
    assert.ok(c.nameZh && c.nameEn && c.descZh && c.descEn);
    assert.ok(library.scenes.some((s) => s.collection === c.id), c.id);
  }
  for (const scene of library.scenes) {
    assert.ok(scene.nameZh && scene.nameEn && scene.category);
    assert.ok(existsSync(new URL(`Scenes/${scene.file}`, R)), scene.file);
    assert.match(readFileSync(new URL(`Scenes/${scene.file}`, R), "utf8"), /^<svg /);
  }
  assert.match(readFileSync(new URL("Scenes/LittleDays-Original-Scenes.txt", R), "utf8"), /Original artwork/);
  // The picture of the day comes from the hand-drawn life scenes.
  assert.deepEqual(seed.dailyScenes, library.scenes.filter((s) => s.collection === "life").map((s) => s.id));
});

test("scene of the day: same all day, changes day to day, covers the set", () => {
  const ids = seed.dailyScenes;
  assert.equal(sceneOfDay(ids, "2026-11-09"), sceneOfDay(ids, "2026-11-09"));
  assert.notEqual(sceneOfDay(ids, "2026-11-09"), sceneOfDay(ids, "2026-11-10"));
  const seen = new Set();
  for (let i = 0; i < ids.length; i++) seen.add(sceneOfDay(ids, new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)));
  assert.equal(seen.size, ids.length, "twelve days, twelve different pictures");
  assert.equal(sceneOfDay([], "2026-11-09"), "");
});

test("a new journal's sample page uses that day's scene (not always coffee)", () => {
  const a = createInitialState(seed, "2026-11-09").entries.find((e) => e.id === "sample-today");
  const b = createInitialState(seed, "2026-11-10").entries.find((e) => e.id === "sample-today");
  assert.match(a.photo, /^scene:[a-z-]+$/);
  assert.notEqual(a.photo, b.photo);
  assert.equal(a.photo, `scene:${sceneOfDay(seed.dailyScenes, "2026-11-09")}`);
  // The other samples keep their photos.
  assert.equal(createInitialState(seed, "2026-11-09").entries.find((e) => e.id === "sample-walk").photo, "/assets/lake.jpg");
});
