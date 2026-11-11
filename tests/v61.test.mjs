// V6.4 (Quick Create v3, P0 ②): story kits, the first look of a page,
// decorations only in empty corners, and caption fit.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kitList, findKit, kitForBook, applyKit, firstLook, decorate, layerBox, captionFit, DECO_SCALE } from "../Public/js/story-style.mjs";
import { smartLayout } from "../Public/js/smart-layout.mjs";
import { timelineLayers } from "../Public/js/day-story.mjs";

const catalog = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/library.json", import.meta.url), "utf8"));
const i18n = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json", import.meta.url), "utf8"));
const overlap = (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
let n = 0;
const makeId = () => `t${n++}`;

test("four kits, each using fonts, stickers and papers that exist", () => {
  const kits = kitList(catalog);
  assert.deepEqual(kits.map((k) => k.id), ["cream", "blush", "sage", "kraft"]);
  const fonts = new Set(catalog.fonts.map((f) => f.id)),
    stickers = new Set(catalog.stickers.map((s) => s.id));
  for (const kit of kits) {
    assert.ok(fonts.has(kit.titleFont) && fonts.has(kit.lineFont), kit.id);
    assert.ok(kit.stickers.length && kit.stickers.every((s) => stickers.has(s)), kit.id);
    assert.ok(["minimal", "cute", "grid", "kraft"].includes(kit.paper));
    assert.match(kit.ink, /^#[0-9A-F]{6}$/i);
  }
  assert.equal(findKit(catalog, "nope").id, "cream", "unknown → the first kit");
  assert.equal(kitForBook(catalog, { color: "sage" }).id, "sage", "a day matches its book");
  assert.equal(kitForBook(catalog, { color: "butter" }).id, "kraft");
  assert.equal(kitForBook(catalog, null).id, "cream");
  assert.ok(i18n["story.kit"].zh && i18n["story.kit"].en);
});

test("a kit styles a page without moving its photos", () => {
  const page = { layers: [{ kind: "photo", x: 30, y: 40, w: 40, h: 30 }], textStyle: { size: 20 } };
  applyKit(page, findKit(catalog, "blush"));
  assert.deepEqual([page.kit, page.template, page.font, page.textStyle.color, page.textStyle.size], ["blush", "cute", "zh-kuaile", "#4A3535", 20]);
  assert.deepEqual([page.layers[0].x, page.layers[0].y], [30, 40]);
});

test("first look: one photo big, a few in the kit's mood, many tidy", () => {
  const calm = findKit(catalog, "cream"),
    playful = findKit(catalog, "blush");
  assert.equal(firstLook(1, calm), 2);
  assert.equal(firstLook(3, calm), 0);
  assert.equal(firstLook(3, playful), 1);
  assert.equal(firstLook(8, playful), 0);
});

test("decorations only go in empty corners, never over photos, words or the caption", () => {
  const kit = findKit(catalog, "cream");
  for (const aspects of [[1.5], [0.75], [1.5, 1.5], [0.75, 0.75, 1.5], [1, 1, 1, 1, 1, 1]])
    for (const variant of [0, 1, 2]) {
      const page = { title: "一句话", layers: smartLayout(aspects, variant).map((s, i) => ({ id: `p${i}`, kind: "photo", ...s })) };
      const placed = decorate(page, kit, { seed: variant, caption: true, makeId });
      const deco = page.layers.filter((l) => l.deco);
      assert.equal(deco.length, placed);
      assert.ok(placed <= 2);
      const rest = page.layers.filter((l) => !l.deco).map(layerBox);
      rest.push({ x: 50, y: 90, w: 86, h: 14 });
      for (const d of deco) {
        assert.equal(d.scale, DECO_SCALE);
        assert.ok(kit.stickers.includes(d.assetId));
        assert.ok(rest.every((box) => !overlap(layerBox(d), box)), `${aspects} / ${variant}`);
      }
      decorate(page, kit, { seed: variant + 1, caption: true, makeId });
      assert.ok(page.layers.filter((l) => l.deco).length <= 2, "re-decorating replaces, never piles up");
    }
  const full = { layers: [{ kind: "photo", x: 50, y: 50, w: 100, h: 100 }] };
  assert.equal(decorate(full, kit, { makeId }), 0, "no room, no decoration");
});

test("the timeline cover uses the kit's fonts and colours", () => {
  const kit = findKit(catalog, "kraft");
  const layers = timelineLayers([{ time: "08:10", title: "早上", photo: { reference: "media:a", aspect: 1 }, count: 1 }], { dateBig: "Nov 9", kit, makeId });
  const date = layers.find((l) => l.text === "Nov 9"),
    time = layers.find((l) => l.text === "08:10"),
    line = layers.find((l) => l.text === "早上");
  assert.deepEqual([date.fontId, date.color, time.color, line.fontId], [kit.titleFont, kit.ink, kit.accent, kit.lineFont]);
});

test("long captions get smaller and may use two lines", () => {
  assert.deepEqual(captionFit("和小雨喝拿铁"), { factor: 1, lines: 1 });
  assert.deepEqual(captionFit("和小雨在新开的店里喝了一杯很好喝的拿铁"), { factor: 0.86, lines: 1 });
  assert.deepEqual(captionFit("和小雨在新开的店里喝了一杯很好喝的拿铁，还买了一包豆子回家"), { factor: 0.8, lines: 2 });
  assert.deepEqual(captionFit("A quick coffee"), { factor: 1, lines: 1 }, "Latin letters count narrower");
});
