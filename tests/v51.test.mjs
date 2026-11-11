// V5.1: three ways to keep a day (photo + a line / just write / draw), the
// drawing board's pure parts, decorating my space, and stationery levels.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { brush, inkBounds, boxToLayer, PAGE_W, PAGE_H, DRAW_TOOLS, DRAW_COLORS } from "../Public/js/draw.mjs";
import { framedPhoto, photoLayer, applyLayout } from "../Public/js/day.mjs";
import { mediaReferences } from "../Public/js/media.mjs";
import { LEVELS } from "../Public/js/levels.mjs";
import * as C from "../Public/js/community.mjs";

const R = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const library = JSON.parse(readFileSync(new URL("library.json", R)));
const i18n = JSON.parse(readFileSync(new URL("i18n.json", R)));

test("brushes: pen follows pencil pressure, marker is see-through, eraser erases", () => {
  assert.deepEqual(DRAW_TOOLS, ["pen", "marker", "pencil", "eraser"]);
  assert.ok(brush("pen", 6, 1).width > brush("pen", 6, 0.1).width, "pressing harder draws thicker");
  assert.equal(brush("marker", 6, 0.1).width, brush("marker", 6, 1).width, "a marker keeps its width");
  assert.ok(brush("marker", 6).alpha < 1);
  assert.equal(brush("eraser", 6).erase, true);
  assert.ok(brush("pen", 999).width <= brush("pen", 24, 1).width, "size is clamped");
  assert.ok(DRAW_COLORS.every((c) => /^#[0-9a-f]{6}$/.test(c)));
});

test("a drawing is trimmed to its ink and placed where it was drawn", () => {
  const w = 40,
    h = 30,
    data = new Uint8ClampedArray(w * h * 4);
  for (const [x, y] of [[10, 5], [20, 12], [15, 20]]) data[(y * w + x) * 4 + 3] = 255;
  assert.deepEqual(inkBounds(data, w, h, 2), { x: 8, y: 3, w: 15, h: 20 });
  assert.equal(inkBounds(new Uint8ClampedArray(w * h * 4), w, h), null, "nothing drawn");
  assert.deepEqual(boxToLayer({ x: 0, y: 0, w: PAGE_W, h: PAGE_H }), { x: 50, y: 50, w: 100, h: 100 });
  assert.deepEqual(boxToLayer({ x: 108, y: 135, w: 216, h: 270 }), { x: 20, y: 20, w: 20, h: 20 });
});

test("drawings stay put when photos are laid out", () => {
  const drawing = photoLayer("media:ink", "drawing", { x: 30, y: 20, w: 40, h: 10, frame: "bare", drawing: true });
  const page = { layers: [photoLayer("media:a", "a"), drawing, photoLayer("media:b", "b")] };
  assert.equal(framedPhoto(drawing), false);
  assert.equal(framedPhoto(page.layers[0]), true);
  assert.equal(applyLayout(page, "duo", { top: 4, bottom: 96 }), 2, "only the two photos are arranged");
  assert.deepEqual([drawing.x, drawing.y, drawing.w, drawing.h], [30, 20, 40, 10]);
});

test("my own photo as a whole page is kept with backups", () => {
  const state = {
    books: [],
    checks: [],
    entries: [{ bookId: "daily", moments: [{ layoutTemplate: "line", backdrop: "media:own-photo", layers: [], media: [] }] }],
    drafts: {},
  };
  assert.deepEqual([...mediaReferences(state)], ["own-photo"]);
});

test("decorate: one-tap looks, avatar frames and post layouts", () => {
  const state = { profile: { ...C.DEFAULT_PROFILE } };
  const photos = new Set(library.photos.map((p) => p.id));
  for (const look of C.SPACE_LOOKS) {
    assert.ok(photos.has(look.banner.slice(6)), look.id);
    assert.ok(C.SPACE_ACCENTS.includes(look.accent), look.id);
    assert.ok(C.SPACE_FRAMES.includes(look.frame) && C.SPACE_LAYOUTS.includes(look.layout), look.id);
    assert.ok(i18n["look." + look.id]?.zh, look.id);
  }
  C.updateSpace(state, { look: "cafe" });
  assert.deepEqual(state.profile.space, { banner: "photo:latte-art", accent: "#c08b5c", frame: "double", layout: "magazine", look: "cafe" });
  C.updateSpace(state, { frame: "dashed" });
  assert.equal(state.profile.space.frame, "dashed");
  assert.equal(state.profile.space.look, undefined, "changing one part is no longer the preset look");
  C.updateSpace(state, { layout: "list" });
  assert.equal(state.profile.space.layout, "list");
  for (const bad of [{ look: "neon" }, { frame: "glitter" }, { layout: "carousel" }]) assert.throws(() => C.updateSpace(state, bad));
  assert.equal(state.profile.space.layout, "list", "a refused change keeps the old value");
});

test("levels are stationery steps, not plants; ids stay the same", () => {
  assert.deepEqual(LEVELS.map((l) => l.id), ["seed", "sprout", "leaf", "bud", "bloom", "garden", "forest", "meadow"]);
  const names = LEVELS.map((l) => i18n["level." + l.id].zh);
  assert.deepEqual(names, ["第一页", "随手记", "贴纸控", "手帐控", "小作者", "杂志主编", "出版人", "文具店主"]);
  assert.ok(LEVELS.every((l) => !/\p{Extended_Pictographic}/u.test(l.icon)));
  assert.doesNotMatch(i18n["level.max"].zh + i18n["inbox.levelUp"].zh, /\p{Extended_Pictographic}/u);
});

test("the record sheet's words exist in both languages", () => {
  for (const key of ["way.photo", "way.write", "way.draw", "quick.title", "quick.start.photo", "quick.start.write", "quick.start.draw", "mode.line", "mode.lineOn", "draw.hint", "draw.again", "line.placeholder", "space.dressTitle", "dress.frame", "spaceLayout.magazine"])
    assert.ok(i18n[key]?.zh && i18n[key]?.en, key);
});
