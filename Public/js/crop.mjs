// V10.20 · Crop: what part of a photo shows inside its frame — kept apart
// from the frame's shape (形状) and from how photos are arranged (排版).
//
// Non-destructive: the picture is never re-cut. A photo layer keeps
//   crop.rect   { x, y, w, h }  the part chosen, as fractions of the picture
//   crop.aspect                 the picture's width / height when chosen
// and the frame shows that part (cover-fitted when the frame's proportions
// differ — e.g. after switching to a circle). The older crop fields
// { x, y, zoom } (object-position + zoom) are still written alongside, so
// pages read the same everywhere, and old pages without a rect keep working.

export const RATIOS = [
  { id: "frame", value: null },
  { id: "free", value: null },
  { id: "original", value: null },
  { id: "1:1", value: 1 },
  { id: "3:4", value: 3 / 4 },
  { id: "4:3", value: 4 / 3 },
  { id: "9:16", value: 9 / 16 },
  { id: "16:9", value: 16 / 9 },
];
export const MIN_SIDE = 0.06; // the smallest part that can be kept (6% of a side)
const MASK = ["circle", "arch", "heart"];
const PAPER = 1.25; // the paper is 4:5: 1% of its height is 1.25% of its width
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
const r4 = (v) => Math.round(v * 10000) / 10000;

// The picture window inside a photo layer (its frame's paper edge taken off),
// as width / height in screen proportions.
export function boxAspect(layer) {
  const w = num(layer?.w, 42),
    h = num(layer?.h, 34);
  const frame = layer?.drawing || MASK.includes(layer?.shape) ? "bare" : layer?.frame || "border";
  const [side, top, bottom] = frame === "border" ? [1.4, 1.4, 1.4] : frame === "polaroid" ? [1.8, 1.8, 6] : [0, 0, 0];
  return Math.max(0.05, (w - 2 * side) / Math.max(0.5, h * PAPER - top - bottom));
}
// Width / height of a part of the picture, on screen.
export const rectAspect = (rect, imgAspect) => (rect.w * imgAspect) / rect.h;

// The part a frame shows with no crop at all (the picture cover-fitted).
export function coverRect(imgAspect, box) {
  if (imgAspect > box) {
    const w = box / imgAspect;
    return { x: r4((1 - w) / 2), y: 0, w: r4(w), h: 1 };
  }
  const h = imgAspect / box;
  return { x: 0, y: r4((1 - h) / 2), w: 1, h: r4(h) };
}
// The largest part with screen proportions `aspect` inside `rect`, same centre.
export function containIn(rect, aspect, imgAspect) {
  const now = rectAspect(rect, imgAspect);
  let w = rect.w,
    h = rect.h;
  if (now > aspect) w = (aspect * h) / imgAspect;
  else h = (w * imgAspect) / aspect;
  return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
}
// Keep a part inside the picture and not too small.
export function clampRect(rect) {
  const w = clamp(num(rect.w, 1), MIN_SIDE, 1),
    h = clamp(num(rect.h, 1), MIN_SIDE, 1);
  return { x: r4(clamp(num(rect.x, 0), 0, 1 - w)), y: r4(clamp(num(rect.y, 0), 0, 1 - h)), w: r4(w), h: r4(h) };
}
// A part of the picture → the frame's object-position / zoom (what canvas,
// reader and export draw). A part whose proportions differ from the frame
// is cover-fitted around its centre (only what was kept is shown).
export function rectToView(rect, imgAspect, box) {
  const part = containIn(clampRect(rect), box, imgAspect);
  const base = coverRect(imgAspect, box);
  const zoom = clamp(base.w / part.w, 1, 4);
  const x = part.w < 0.9999 ? clamp(part.x / (1 - part.w), 0, 1) * 100 : 50;
  const y = part.h < 0.9999 ? clamp(part.y / (1 - part.h), 0, 1) * 100 : 50;
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, zoom: Math.round(zoom * 1000) / 1000 };
}
// The older { x, y, zoom } → the part of the picture it shows.
export function viewToRect(view, imgAspect, box) {
  const base = coverRect(imgAspect, box);
  const zoom = clamp(num(view?.zoom, 1), 1, 4);
  const w = base.w / zoom,
    h = base.h / zoom;
  return clampRect({ x: (clamp(num(view?.x, 50), 0, 100) / 100) * (1 - w), y: (clamp(num(view?.y, 50), 0, 100) / 100) * (1 - h), w, h });
}
// What a photo layer shows: from its rect when it has one, else the older fields.
export function cropView(layer) {
  const crop = layer?.crop || {};
  if (crop.rect && Number(crop.aspect) > 0) return rectToView(crop.rect, Number(crop.aspect), boxAspect(layer));
  return { x: clamp(num(crop.x, 50), 0, 100), y: clamp(num(crop.y, 50), 0, 100), zoom: clamp(num(crop.zoom, 1), 1, 4) };
}
// A part with new proportions (a ratio chip): same centre, about the same
// size, kept inside the picture.
export function withRatio(rect, aspect, imgAspect) {
  const area = rect.w * rect.h;
  // w * imgAspect / h = aspect, w * h = area
  let w = Math.sqrt((area * aspect) / imgAspect),
    h = area / w;
  const k = Math.max(w, h, 1);
  if (k > 1) {
    w /= k;
    h /= k;
  }
  const cx = rect.x + rect.w / 2,
    cy = rect.y + rect.h / 2;
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h });
}
// The part after the picture is turned 90° clockwise.
export function rotateRect90(rect) {
  return clampRect({ x: 1 - (rect.y + rect.h), y: rect.x, w: rect.h, h: rect.w });
}
// A frame with new proportions (when a crop ratio needs it): the same centre
// and picture width, height from the ratio; kept on the paper.
export function frameFor(layer, aspect) {
  const w = num(layer?.w, 42);
  const frame = layer?.drawing || MASK.includes(layer?.shape) ? "bare" : layer?.frame || "border";
  const [side, top, bottom] = frame === "border" ? [1.4, 1.4, 1.4] : frame === "polaroid" ? [1.8, 1.8, 6] : [0, 0, 0];
  const innerW = w - 2 * side;
  let h = (innerW / aspect + top + bottom) / PAPER;
  let width = w;
  if (h > 96) {
    const k = 96 / h;
    h = 96;
    width = (innerW * k) + 2 * side;
  }
  return { w: Math.round(width * 10) / 10, h: Math.round(h * 10) / 10 };
}
// Shapes whose proportions are their own (a circle stays a circle).
export const FIXED_SHAPES = ["landscape", "portrait", "square", "circle", "arch", "heart", "film"];
export const fixedShape = (layer) => FIXED_SHAPES.includes(layer?.shape);
