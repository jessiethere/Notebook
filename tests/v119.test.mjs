// V10.19 · A photo's own words (photo.caption) are laid out right by that
// photo — in all three styles, every variant, 1–5 photos, with or without the
// Moment's own line — never on another photo, never off the page, never cut.
// Bound by the photo layer's id; the page's quick type (typeStyle) applies
// to the page's own words only.
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../Public/js/scrapbook-layout.mjs";

const aspects = [1.5, 0.75, 1, 1.33, 0.66, 1.78, 0.8];
const caps = ["深蹲终于到 60kg", "和小雨在新开的店喝拿铁 latte", "", "一只很胖的猫在窗台上晒太阳，看起来比我还会享受周末的下午时光，真是羡慕它", "sunset", "", ""];

test("each photo's line sits by its own photo, on the page, over no other photo (144 cases)", () => {
  let checked = 0;
  for (const style of L.STYLES)
    for (let v = 0; v < 3; v++)
      for (let n = 1; n <= 5; n++)
        for (const title of ["", "练腿日 Leg day"]) {
          const visuals = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, aspect: aspects[(i + v) % aspects.length], caption: caps[(i + n) % caps.length] }));
          const r = L.layoutMoment({ visuals, title, time: "14:18" }, style, v);
          const want = visuals.filter((x) => x.caption.trim()).map((x) => x.id).sort();
          const caps2 = r.layers.filter((l) => l.bind === "caption");
          assert.deepEqual(caps2.map((l) => l.captionOf).sort(), want, `${style} ${v} ${n}: one line per photo with words`);
          for (const l of caps2) {
            checked++;
            const b = r.place[l.captionOf];
            const h = L.textBlock(l.text, l.fontSize, l.w).height;
            const top = l.y - h / 2,
              bottom = l.y + h / 2;
            const below = top >= b.y + b.h / 2 - 0.5 && top <= b.y + b.h / 2 + 3;
            const above = bottom <= b.y - b.h / 2 + 0.5 && bottom >= b.y - b.h / 2 - 3;
            assert.ok(below || above, `${style} ${v} ${n} ${l.captionOf}: right by its photo`);
            assert.ok(Math.abs(l.x - b.x) <= Math.max(4, b.w / 2), `${style} ${v} ${n}: centred on its photo`);
            assert.ok(top >= 0.5 && bottom <= 100.5, `${style} ${v} ${n}: on the page`);
            for (const [pid, o] of Object.entries(r.place)) if (pid !== l.captionOf && o.h) assert.ok(L.overlapArea({ x: l.x, y: l.y, w: l.w, h }, o) <= 0.15 * l.w * h, `${style} ${v} ${n}: not over ${pid}`);
            // Never cut: the whole line is in the layer (it wraps).
            assert.equal(l.text, visuals.find((x) => x.id === l.captionOf).caption);
          }
        }
  assert.ok(checked > 100);
});

test("words are read from the photo itself, by its id", () => {
  const page = { layers: [{ id: "a", kind: "photo", caption: "第一张" }, { id: "b", kind: "photo", caption: "second" }, { id: "t1", kind: "text", bind: "caption", captionOf: "b" }] };
  assert.equal(L.boundText(page.layers[2], page), "second");
  page.layers[1].caption = "第二张改了";
  assert.equal(L.boundText(page.layers[2], page), "第二张改了", "editing the photo's words shows at once");
  assert.equal(L.boundText({ kind: "text", bind: "caption", captionOf: "gone" }, page), "", "a photo that was removed: nothing shown");
  // Same shooting time, same order changes: the id is what matters.
  page.layers.reverse();
  assert.equal(L.boundText(page.layers.find((l) => l.bind === "caption"), page), "第二张改了");
});

test("quick type: the page's own words only, in Studio's fields; bigger type keeps the room", () => {
  const visuals = [{ id: "a", aspect: 1.5, caption: "拉花是一只小熊" }, { id: "b", aspect: 1, caption: "" }];
  const type = { fontId: "song", color: "#6D8299", bold: true, align: "left", scale: 1.3 };
  const r = L.layoutMoment({ visuals, title: "周末的咖啡馆", time: "14:18", folio: "LITTLE DAYS · NO. 12", type }, "editorial", 0);
  const own = r.layers.filter((l) => ["title", "caption"].includes(l.bind) && !l.prefix);
  assert.equal(own.length, 2);
  for (const l of own) assert.deepEqual([l.fontId, l.color, l.weight, l.align], ["song", "#6D8299", 700, "left"]);
  // The time kicker and the folio keep the style's own look.
  assert.ok(r.layers.filter((l) => l.prefix === "kicker" || /LITTLE DAYS/.test(l.text || "")).every((l) => l.fontId !== "song"));
  const plain = L.layoutMoment({ visuals, title: "周末的咖啡馆", time: "14:18" }, "editorial", 0);
  const size = (res) => res.layers.find((l) => l.bind === "title").fontSize;
  assert.ok(size(r) > size(plain), "A+ makes the line bigger (and laid out for it)");
  assert.equal(L.typeScale({ scale: 7 }), 1, "only the offered sizes");
  // No type chosen: nothing changes.
  assert.deepEqual(L.applyType([{ kind: "text", bind: "title", fontId: "x" }], null)[0].fontId, "x");
});
