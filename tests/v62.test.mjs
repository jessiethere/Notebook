// V6.5 (Quick Create V2): the scrapbook layout engine. Three styles with their
// own layouts; for 1–12 photos, no / short / long words and every variant:
// every photo placed, on the page, never cropped (frames follow the photo),
// words inside the page and never over a photo; overlaps only where the style
// wants them (none in Editorial). Plus the day spread, bound words, video and
// voice notes, and fonts for Chinese / English.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STYLES, STYLE_LOOK, layoutMoment, layoutDay, boundText, pickFont, fitText, textBlock, frameHeight, fitPhoto, overlapArea, heroIndex, styleOf } from "../Public/js/scrapbook-layout.mjs";

const catalog = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/library.json", import.meta.url), "utf8"));
const i18n = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json", import.meta.url), "utf8"));
const aspectsFor = (n) => Array.from({ length: n }, (_, i) => [1.5, 0.75, 1, 1.33, 0.66, 1.78][i % 6]);
const TITLES = ["", "和小雨喝拿铁", "早上去健身房练腿，深蹲终于突破了 60kg，教练说下个月可以试试 65kg so good"];

test("three styles, each with fonts, papers and stickers that exist", () => {
  assert.deepEqual(STYLES, ["editorial", "cozy", "playful"]);
  const fonts = new Set(catalog.fonts.map((f) => f.id).concat(["serif"])),
    stickers = new Set(catalog.stickers.map((s) => s.id));
  for (const s of STYLES) {
    const look = STYLE_LOOK[s];
    assert.ok([look.latin, look.cjk, look.meta].every((f) => fonts.has(f)), s);
    assert.ok(look.stickers.every((id) => stickers.has(id)), s);
    assert.ok(i18n[`story.style.${s}`].zh && i18n[`story.style.${s}`].en);
  }
  assert.deepEqual(["editorial", "cozy", "playful"].map((s) => STYLE_LOOK[s].frame), ["bare", "polaroid", "border"], "different frames, not just colours");
  assert.equal(styleOf("nope"), "editorial", "Editorial is the default");
  const backdrops = new Set(catalog.scenes.map((s) => `scene:${s.id}`));
  for (let v = 0; v < 3; v++) assert.ok(backdrops.has(layoutMoment({ visuals: [{ id: "a", aspect: 1 }] }, "playful", v).backdrop));
  assert.equal(layoutMoment({ visuals: [{ id: "a", aspect: 1 }] }, "editorial", 0).backdrop, null);
});

test("frames follow the photo: nothing is cropped", () => {
  for (const frame of ["bare", "border", "polaroid"])
    for (const a of [0.5, 0.75, 1, 1.5, 2]) {
      const box = fitPhoto(a, 60, 50, frame);
      assert.ok(box.w <= 60.01 && box.h <= 50.01);
      assert.ok(Math.abs(frameHeight(a, box.w, frame) - box.h) < 1e-6);
    }
});

test("every style × 1–12 photos × words × variant: placed, on the page, uncropped, words clear", () => {
  for (const style of STYLES)
    for (let n = 1; n <= 12; n++)
      for (const title of TITLES)
        for (let v = 0; v < 3; v++) {
          const visuals = aspectsFor(n).map((aspect, i) => ({ id: `p${i}`, aspect }));
          const r = layoutMoment({ visuals, title, time: "08:10" }, style, v);
          const label = `${style} n${n} v${v} t${title.length}`;
          const boxes = visuals.map((vis) => ({ ...r.place[vis.id], a: vis.aspect }));
          for (const b of boxes) {
            assert.ok(Number.isFinite(b.x), `${label}: placed`);
            assert.ok(b.x - b.w / 2 > -0.5 && b.x + b.w / 2 < 100.5 && b.y - b.h / 2 > -0.5 && b.y + b.h / 2 < 100.5, `${label}: on the page`);
            assert.ok(Math.abs(frameHeight(b.a, b.w, b.frame) - b.h) < 0.05, `${label}: not cropped`);
          }
          const limit = style === "editorial" ? 0.001 : style === "cozy" ? 0.2 : 0.16;
          for (let i = 0; i < n; i++)
            for (let j = i + 1; j < n; j++) assert.ok(overlapArea(boxes[i], boxes[j]) / Math.min(boxes[i].w * boxes[i].h, boxes[j].w * boxes[j].h) <= limit, `${label}: overlap ${i}/${j}`);
          for (const l of r.layers) {
            const h = textBlock(l.text, l.fontSize, l.w).height;
            assert.ok(l.y - h / 2 > -1 && l.y + h / 2 < 101, `${label}: words on the page`);
            if (l.bind === "title") for (const b of boxes) assert.ok(overlapArea({ x: l.x, y: l.y, w: l.w, h }, b) <= 2, `${label}: words over a photo`);
          }
          assert.equal(r.layers.filter((l) => l.bind === "title").length, title ? 1 : 0, `${label}: the line once, only when written`);
        }
});

test("the three styles really lay out differently", () => {
  const visuals = aspectsFor(3).map((aspect, i) => ({ id: `p${i}`, aspect }));
  const shapes = STYLES.map((s) => JSON.stringify(Object.values(layoutMoment({ visuals, title: "一句话" }, s, 0).place).map((b) => [Math.round(b.x), Math.round(b.y), Math.round(b.w), b.rotation, b.frame])));
  assert.equal(new Set(shapes).size, 3);
  const editorial = layoutMoment({ visuals, title: "" }, "editorial", 0).place;
  const sizes = Object.values(editorial).map((b) => b.w * b.h);
  assert.ok(Math.max(...sizes) > 1.8 * Math.min(...sizes), "Editorial: one hero, the rest smaller");
  assert.ok(Object.values(layoutMoment({ visuals }, "cozy", 0).place).every((b) => b.rotation !== 0), "Cozy: tilted Polaroids");
});

test("the day spread: one photo per Moment (up to 4), words bound to their Moments", () => {
  for (const style of STYLES)
    for (let m = 2; m <= 7; m++) {
      const moments = Array.from({ length: m }, (_, i) => ({ id: `m${i}`, time: `0${i}:00`, title: i % 2 ? "一句话 a line" : "", photo: { reference: `media:${i}`, aspect: [1.5, 0.75, 1][i % 3] } }));
      const { layers } = layoutDay(moments, style, 0, { dateSmall: "星期一", dateBig: "Nov 9", more: (n) => `+${n}` });
      const photos = layers.filter((l) => l.kind === "photo");
      assert.equal(photos.length, Math.min(4, m), `${style} m${m}`);
      assert.ok(photos.every((p) => p.gen && p.mediaRef.startsWith("media:")));
      for (const p of photos) assert.ok(p.x - p.w / 2 > -0.5 && p.x + p.w / 2 < 100.5 && p.y - p.h / 2 > -0.5 && p.y + p.h / 2 < 100.5, `${style} m${m}: on the page`);
      assert.ok(layers.filter((l) => l.bind).every((l) => moments.some((x) => x.id === l.of)));
      if (m > 4) assert.ok(layers.some((l) => l.text === `+${m - 4}`), "the rest are counted, not dropped");
    }
});

test("bound words read the Moment (excerpts on the spread); fonts follow the language", () => {
  const cover = { moments: [{ id: "a", title: "和小雨在新开的店喝拿铁", time: "14:30" }] };
  assert.equal(boundText({ bind: "title", of: "a" }, cover), "和小雨在新开的店喝拿铁");
  assert.equal(boundText({ bind: "time", of: "a" }, cover), "14:30");
  assert.equal(boundText({ bind: "title", of: "a", excerpt: 6 }, cover), "和小雨在新…");
  assert.equal(boundText({ bind: "title", of: "a", prefix: "time" }, cover), "14:30 和小雨在新开的店喝拿铁");
  assert.equal(boundText({ bind: "title" }, { title: "my line" }), "my line");
  assert.equal(boundText({ text: "plain" }, {}), "plain");
  assert.equal(pickFont("Morning run", STYLE_LOOK.cozy), "handwritten");
  assert.equal(pickFont("晨跑 5km", STYLE_LOOK.cozy), "zh-wenkai");
  const long = fitText("早上去健身房练腿，深蹲终于突破了 60kg，教练说下个月可以试试 65kg", 22, 40, 3);
  assert.ok(long.size < 22 && long.lines <= 4, "long words get smaller");
  assert.equal(heroIndex([{ aspect: 0.75 }, { aspect: 1.5 }]), 1, "a landscape photo carries the page");
});

test("video and voice notes keep a place in the layout", () => {
  const r = layoutMoment({ visuals: [{ id: "p", aspect: 1.5 }, { id: "v", aspect: 16 / 9 }], audio: [{ id: "a" }], title: "一句话" }, "editorial", 0);
  assert.ok(r.place.v && r.place.a, "the video is placed like a photo; the voice note gets the bottom band");
  assert.ok(r.place.a.y > r.place.p.y && r.place.a.y + 3 < 100);
});
