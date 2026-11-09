// Aspect-aware auto layout ("smart"): photos keep their own shape (landscape,
// portrait, square) and are packed into rows that fill the page, like a
// justified photo gallery, so nothing important is cropped away. Three looks
// can be shuffled: clean rows, a scrapbook look (frames, small tilts, tape)
// and a hero (the first photo large). Pure functions, no DOM.
//
// Units: x / y are the centre in % of the page, w is % of page width and h %
// of page height. The page is 4:5 (1080 × 1350), so a photo with aspect a
// (width / height) that is W% wide is W × 0.8 / a % tall.

export const PAGE_RATIO = 1080 / 1350; // width / height
export const SMART_VARIANTS = ["clean", "scrapbook", "hero"];
// Above the one-line caption strip at the bottom of the page.
export const SMART_REGION = { top: 4, bottom: 81, left: 5, right: 95 };
const GAP = 2; // % of page width between photos

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round = (n) => Math.round(n * 100) / 100;
export function safeAspect(a) {
  const n = Number(a);
  return Number.isFinite(n) && n > 0 ? clamp(n, 0.3, 3.5) : 1;
}

// Every way to split n photos (in order) into rows of 1..maxPerRow photos.
export function rowPartitions(n, maxPerRow = 3) {
  const out = [];
  const walk = (left, acc) => {
    if (!left) return out.push(acc);
    for (let k = 1; k <= Math.min(maxPerRow, left); k++) walk(left - k, [...acc, k]);
  };
  if (n > 0) walk(n, []);
  return out;
}

// Rows of photos sharing one height that fill the width; scaled down as a
// whole when the page is not tall enough. Returns slots and a fit score.
export function justify(aspects, rows, region = SMART_REGION, gap = GAP) {
  const width = region.right - region.left,
    height = region.bottom - region.top;
  let index = 0;
  const rowBoxes = rows.map((count) => {
    const list = aspects.slice(index, index + count);
    index += count;
    const sum = list.reduce((s, a) => s + a, 0);
    const rowW = width - gap * (count - 1);
    const rowH = (rowW / sum) * PAGE_RATIO; // in % of page height
    return { list, rowH };
  });
  const gapH = gap * PAGE_RATIO;
  const natural = rowBoxes.reduce((s, r) => s + r.rowH, 0) + gapH * (rows.length - 1);
  const scale = Math.min(1, height / natural);
  const used = natural * scale;
  let y = region.top + (height - used) / 2;
  const slots = [];
  let widest = 0;
  for (const { list, rowH } of rowBoxes) {
    const h = rowH * scale;
    const rowWidth = list.reduce((s, a) => s + (h / PAGE_RATIO) * a, 0) + gap * (list.length - 1);
    widest = Math.max(widest, rowWidth);
    let x = region.left + (width - rowWidth) / 2;
    for (const a of list) {
      const w = (h / PAGE_RATIO) * a;
      slots.push({ x: x + w / 2, y: y + h / 2, w, h });
      x += w + gap;
    }
    y += h + gapH * scale;
  }
  // Prefer pages that are well filled edge to edge, with no tiny photo, no
  // lone photo stranded mid-page, and calm, similar rows.
  const area = slots.reduce((s, b) => s + b.w * b.h, 0) / (width * height);
  const smallest = Math.min(...slots.map((b) => Math.min(b.w, b.h / PAGE_RATIO)));
  const widthUse = Math.min(1, widest / width);
  const lone = aspects.length >= 4 ? rows.slice(1).filter((count) => count === 1).length : 0;
  const spread = Math.max(...rows) - Math.min(...rows);
  const score =
    area -
    (1 - widthUse) * 0.3 -
    (smallest < 18 ? (18 - smallest) * 0.03 : 0) -
    (rows.length > 4 ? 0.15 : 0) -
    lone * 0.12 -
    (spread > 1 ? (spread - 1) * 0.05 : 0);
  return { slots, score, rows };
}

// Arrangements ranked best first (optionally only those with the first
// photo alone on top, as a hero).
export function rankedRows(aspects, { hero = false, region = SMART_REGION } = {}) {
  const n = aspects.length;
  const maxPerRow = n >= 7 ? 4 : 3;
  let options = rowPartitions(n, maxPerRow);
  if (hero && n > 1) options = options.filter((rows) => rows[0] === 1);
  return options.map((rows) => justify(aspects, rows, region)).sort((a, b) => b.score - a.score);
}
export function bestRows(aspects, options = {}) {
  return rankedRows(aspects, options)[0];
}

const finish = (slot, extra) => ({
  x: round(clamp(slot.x, 0, 100)),
  y: round(clamp(slot.y, 0, 100)),
  w: round(clamp(slot.w, 4, 120)),
  h: round(clamp(slot.h, 4, 120)),
  rotation: 0,
  frame: "bare",
  tape: false,
  ...extra,
});

// The slots for one look. `variant` is an index into SMART_VARIANTS (wraps).
export function smartLayout(aspectsIn, variant = 0) {
  const aspects = aspectsIn.map(safeAspect);
  const n = aspects.length;
  if (!n) return [];
  const look = SMART_VARIANTS[((variant % SMART_VARIANTS.length) + SMART_VARIANTS.length) % SMART_VARIANTS.length];
  if (n === 1) {
    if (look === "hero") {
      // Full bleed: the photo is the page; the caption sits on top of it.
      return [finish({ x: 50, y: 50, w: 100, h: 100 }, { frame: "bare" })];
    }
    const region = look === "scrapbook" ? { top: 9, bottom: 76, left: 14, right: 86 } : SMART_REGION;
    const { slots } = justify(aspects, [1], region);
    return slots.map((s) => finish(s, look === "scrapbook" ? { frame: "polaroid", rotation: -3, tape: true, h: s.h + 4 } : { frame: "bare" }));
  }
  if (look === "scrapbook") {
    // Frames take a little room: pack into a slightly smaller area, then tilt.
    const region = { top: 6, bottom: 79, left: 8, right: 92 };
    const { slots } = bestRows(aspects, { region });
    return slots.map((s, i) => finish({ ...s, w: s.w * 0.94, h: s.h * 0.94 }, { frame: "border", rotation: [-2.5, 2, -1.5, 3, -2, 1.5][i % 6], tape: i === 0 || i === n - 1 }));
  }
  // "hero": the first photo alone on top; if that is already the best clean
  // arrangement, the next best one, so every shuffle looks different.
  const clean = bestRows(aspects);
  let pick = clean;
  if (look === "hero") {
    const key = (r) => r.rows.join(",");
    const near = (r) => key(r) !== key(clean) && r.score >= clean.score - 0.15;
    pick = rankedRows(aspects, { hero: true }).find(near) || rankedRows(aspects).find((r) => key(r) !== key(clean)) || clean;
  }
  return pick.slots.map((s) => finish(s, { frame: "bare" }));
}

// How much of each photo a layout would crop (0 = none): photos are cropped
// to fill their frame, so a frame with a different shape loses some picture.
export function cropLoss(aspects, slots) {
  return slots.map((slot, i) => {
    const frame = (slot.w / slot.h) * PAGE_RATIO; // frame aspect (w / h)
    const a = safeAspect(aspects[i]);
    return round(1 - Math.min(frame, a) / Math.max(frame, a));
  });
}
