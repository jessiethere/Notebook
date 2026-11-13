// V10.20 · Crop (js/crop.mjs): the part of a photo that shows, kept apart
// from the frame's shape. Non-destructive (a rect on the layer), exact round
// trip with the older x / y / zoom, a shape change keeps the chosen part,
// ratios keep the centre, a 90° turn maps the part, old pages unchanged.
import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../Public/js/crop.mjs";

const near = (a, b, eps = 0.003) => Math.abs(a - b) <= eps;

test("a part with the frame's proportions ↔ x / y / zoom: exact both ways", () => {
  for (const ia of [1.5, 0.75, 1, 1.78])
    for (const box of [0.8, 1, 1.33, 0.56]) {
      const base = C.coverRect(ia, box);
      assert.deepEqual(C.rectToView(base, ia, box).zoom, 1, "no crop = zoom 1");
      for (const k of [1.2, 2, 3.5])
        for (const [fx, fy] of [[0, 0], [0.5, 0.5], [1, 1], [0.2, 0.7]]) {
          const w = base.w / k,
            h = base.h / k;
          const rect = { x: fx * (1 - w), y: fy * (1 - h), w, h };
          const back = C.viewToRect(C.rectToView(rect, ia, box), ia, box);
          for (const key of ["x", "y", "w", "h"]) assert.ok(near(back[key], rect[key]), `${ia} ${box} ${k} ${key}: ${back[key]} vs ${rect[key]}`);
        }
    }
});

test("old pages (no rect) draw exactly as before", () => {
  const layer = { kind: "photo", w: 40, h: 30, crop: { x: 20, y: 70, zoom: 1.5 } };
  assert.deepEqual(C.cropView(layer), { x: 20, y: 70, zoom: 1.5 });
  assert.deepEqual(C.cropView({ kind: "photo" }), { x: 50, y: 50, zoom: 1 });
});

test("switching the shape keeps the chosen part (cover-fitted inside it)", () => {
  const ia = 1.5;
  const rect = { x: 0.3, y: 0.2, w: 0.3, h: 0.5 };
  const layer = { kind: "photo", w: 40, h: 30, frame: "border", crop: { rect, aspect: ia } };
  for (const shape of ["circle", "arch", "heart", "square", undefined]) {
    const v = C.cropView({ ...layer, shape });
    const shown = C.viewToRect(v, ia, C.boxAspect({ ...layer, shape }));
    // What shows is inside the part kept and centred on it.
    assert.ok(shown.x >= rect.x - 0.002 && shown.x + shown.w <= rect.x + rect.w + 0.002 && shown.y >= rect.y - 0.002 && shown.y + shown.h <= rect.y + rect.h + 0.002, `${shape}: inside`);
    assert.ok(near(shown.x + shown.w / 2, rect.x + rect.w / 2, 0.005) && near(shown.y + shown.h / 2, rect.y + rect.h / 2, 0.005), `${shape}: centred`);
  }
});

test("ratios keep the centre and stay inside the picture; a 90° turn maps the part", () => {
  const ia = 1.5;
  const start = { x: 0.2, y: 0.1, w: 0.5, h: 0.8 };
  for (const r of C.RATIOS.filter((x) => x.value)) {
    const out = C.withRatio(start, r.value, ia);
    assert.ok(near(C.rectAspect(out, ia), r.value, 0.01), r.id);
    assert.ok(out.x >= 0 && out.y >= 0 && out.x + out.w <= 1.0001 && out.y + out.h <= 1.0001, `${r.id} inside`);
  }
  assert.deepEqual(C.rotateRect90({ x: 0.1, y: 0.2, w: 0.3, h: 0.4 }), { x: 0.4, y: 0.1, w: 0.4, h: 0.3 });
  // Four turns: back where it started.
  let r = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
  for (let i = 0; i < 4; i++) r = C.rotateRect90(r);
  assert.deepEqual(r, { x: 0.1, y: 0.2, w: 0.3, h: 0.4 });
  // Never smaller than the minimum, never outside.
  assert.deepEqual(C.clampRect({ x: 2, y: -1, w: 0.001, h: 5 }), { x: 0.94, y: 0, w: 0.06, h: 1 });
});

test("a frame with new proportions keeps its width and stays on the paper", () => {
  const layer = { w: 40, h: 30, frame: "border" };
  const f = C.frameFor(layer, 0.75);
  assert.equal(f.w, 40);
  assert.ok(near(C.boxAspect({ ...layer, ...f }), 0.75, 0.01));
  const tall = C.frameFor({ w: 80, h: 30, frame: "border" }, 0.3);
  assert.ok(tall.h <= 96 && near(C.boxAspect({ w: tall.w, h: tall.h, frame: "border" }), 0.3, 0.02));
  assert.ok(C.fixedShape({ shape: "circle" }) && !C.fixedShape({ shape: "free" }) && !C.fixedShape({}));
});
