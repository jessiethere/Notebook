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

test("the sample page keeps the coffee photo; an earlier scene sample goes back to it", async () => {
  const a = createInitialState(seed, "2026-11-09").entries.find((e) => e.id === "sample-today");
  assert.equal(a.photo, "/assets/coffee.jpg");
  const { normalizeState } = await import("../Public/js/model.mjs");
  const state = createInitialState(seed, "2026-11-09");
  state.entries.find((e) => e.id === "sample-today").photo = "scene:picnic";
  const own = { ...structuredClone(state.entries[0]), id: "mine", isDemo: false, photo: "scene:picnic" };
  state.entries.push(own);
  const fixed = normalizeState(state);
  assert.equal(fixed.entries.find((e) => e.id === "sample-today").photo, "/assets/coffee.jpg");
  assert.equal(fixed.entries.find((e) => e.id === "mine").photo, "scene:picnic", "a person's own choice stays");
  assert.equal(createInitialState(seed, "2026-11-09").entries.find((e) => e.id === "sample-walk").photo, "/assets/lake.jpg");
});
