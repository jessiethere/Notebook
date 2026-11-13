// Quick Create V2 · Scrapbook Layout Engine. Three styles with their own
// composition logic — not just another background colour:
//   editorial  one hero photo, asymmetric white space, serif words, almost no
//              decoration (a lifestyle magazine);
//   cozy       Polaroids, small tilts, tape, handwriting on kraft paper;
//   playful    a looser collage: mixed sizes, gentle overlaps, soft colour
//              backdrop, stickers.
// Rules only (no generative AI). Photos keep their own shape: frames are
// sized from the photo, so nothing is cropped. Words are text layers *bound*
// to the Moment's own text (title / time), so editing it anywhere updates the
// page. Pure functions; the app merges the result into a page.
import { safeAspect, bestRows } from "./smart-layout.mjs";

export const STYLES = ["editorial", "cozy", "playful"];
export const PAGE_RATIO = 1080 / 1350;
const PLAYFUL_BACKDROPS = ["scene:color-peach", "scene:color-mint", "scene:color-lavender"];

export const STYLE_LOOK = {
  editorial: { paper: "minimal", frame: "bare", latin: "elegant", cjk: "serif", meta: "minimal-sans", ink: "#2F2A26", muted: "#6F675D", accent: "#5F6F52", stickers: ["leaf"], deco: 1 },
  cozy: { paper: "kraft", frame: "polaroid", latin: "handwritten", cjk: "zh-wenkai", meta: "handwritten", ink: "#3A2A1C", muted: "#5E4A36", accent: "#7A5A3A", stickers: ["leaf", "coffee", "daisy", "ticket"], deco: 2 },
  playful: { paper: "minimal", frame: "border", latin: "rounded-cute", cjk: "zh-kuaile", meta: "rounded-cute", ink: "#3B2F4A", muted: "#5B4E6A", accent: "#B4547A", stickers: ["tulip", "bunny", "pink-tape", "daisy", "label"], deco: 3 },
};
export const styleOf = (id) => (STYLES.includes(id) ? id : "editorial");

const round = (n) => Math.round(n * 100) / 100;
const CJK = /[　-鿿＀-￯]/;
// A font that has the text's letters: CJK text uses the style's Chinese font.
export const pickFont = (text, look) => (CJK.test(String(text || "")) ? look.cjk : look.latin);
// Width units of a text (a CJK character is 1 em, a Latin letter about 0.55).
export function textUnits(text) {
  return [...String(text || "")].reduce((n, ch) => n + (CJK.test(ch) ? 1 : 0.55), 0);
}
// Lines and height (% of page height) of text at `size` in a box `width`% wide.
export function textBlock(text, size, width, lineHeight = 1.35) {
  const perLine = Math.max(1, (width * 10.8) / (size * 3.375));
  const lines = text ? Math.max(1, Math.ceil(textUnits(text) / perLine)) : 0;
  return { lines, height: (lines * size * 3.375 * lineHeight) / 13.5 };
}
// ---------- V10.33 (L1) · Words measured as they will really render ----------
// While a page is laid out, the app lends a measure(text, size, width,
// fontId, weight) that renders the words off screen in their real font and
// returns their height (% of the page height), or null while that font is
// still loading. Without one (tests, a font not loaded yet) the words are
// counted the way a browser wraps them — Latin words move whole, a CJK
// closing mark never starts a line, capitals are wider — so a page is never
// passed on a guess that is too small. Sizes under 10 render at 10.
let MEASURE = null;
const LINE = 0.25 * 1.35; // a line of size 1, in % of the page height
const CJK_CLOSE = /[，。、！？；：）」』〉》,.!?;:)]/;
const glyphW = (ch) => (CJK.test(ch) ? 1 : /[MW]/.test(ch) ? 0.92 : /[A-Z]/.test(ch) ? 0.72 : /[mw]/.test(ch) ? 0.82 : /[0-9]/.test(ch) ? 0.58 : /[il.,'!:;|]/.test(ch) ? 0.3 : ch === " " ? 0.3 : 0.56);
const WRAPPED = new Map();
export function wrapLines(text, size, width) {
  const key = `${size}|${Math.round(width * 4)}|${text}`;
  if (WRAPPED.has(key)) return WRAPPED.get(key);
  if (WRAPPED.size > 4000) WRAPPED.clear();
  const per = Math.max(1, (width * 3.2) / Math.max(10, size));
  let lines = 0;
  for (const para of String(text || "").split("\n")) {
    lines++;
    let x = 0;
    for (const tok of para.match(/[A-Za-z0-9'’\-]+|\s+|./gu) || []) {
      const w = [...tok].reduce((sum, ch) => sum + glyphW(ch), 0);
      if (/^\s+$/.test(tok)) { x += w; continue; }
      if (x + w <= per + 1e-6) { x += w; continue; }
      if (CJK_CLOSE.test(tok)) { lines++; x = 1 + w; continue; }
      if (w > per) { if (x > 0) lines++; let rest = w; while (rest > per) { lines++; rest -= per; } x = rest; continue; }
      lines++;
      x = w;
    }
  }
  WRAPPED.set(key, lines);
  return lines;
}
// { lines, height } of words at `size` in a box `width`% wide, in `font`.
export function measuredBlock(text, size, width, font = null, weight = 400) {
  if (!String(text || "").trim()) return { lines: 0, height: 0 };
  const sz = Math.max(10, size);
  // A slightly narrower box than asked: never fewer lines than the real one.
  const w = Math.floor(width * 2) / 2;
  const real = MEASURE ? MEASURE(String(text), sz, w, font, weight) : null;
  if (Number.isFinite(real) && real > 0) return { lines: Math.max(1, Math.round(real / (sz * LINE))), height: real };
  const lines = wrapLines(text, sz, w);
  return { lines, height: lines * sz * LINE };
}
// A size that keeps words readable inside `maxLines` (never under 10, the
// smallest size a page shows).
export function fitText(text, base, width, maxLines = 4, min = 11, font = null, weight = 400) {
  let size = base;
  const floor = Math.max(10, min);
  while (size > floor && measuredBlock(text, size, width, font, weight).lines > maxLines) size -= 1;
  return { size: Math.max(floor, size), ...measuredBlock(text, Math.max(floor, size), width, font, weight) };
}
// The page's own line: a headline while it fits in two lines at headline
// size (measured, in its real font and the page's type size); otherwise body
// text at a comfortable reading size — never shrunk to squeeze, never cut.
export function lineFor(title, headline, width, typeSize = 1, font = null, weight = 500) {
  if (!title) return { size: headline, lines: 0, height: 0, body: false };
  const head = Math.max(10, headline * typeSize);
  const h = measuredBlock(title, head, width, font, weight);
  if (h.lines <= 2) return { size: head, lines: h.lines, height: h.height, body: false };
  const size = Math.max(10, 16 * typeSize);
  const b = measuredBlock(title, size, width, font, weight);
  return { size, lines: b.lines, height: b.height, body: true };
}

// The frame around a photo (padding in % of page width, as styles.css):
// border 1.4 each side, polaroid 1.8 + 6 at the bottom.
const PAD = { bare: [0, 0], border: [2.8, 2.24], polaroid: [3.6, 6.24], rounded: [0, 0] };
export function frameHeight(aspect, w, frame = "bare") {
  const [px, py] = PAD[frame] || PAD.bare;
  return ((w - px) * PAGE_RATIO) / safeAspect(aspect) + py;
}
// The widest frame (≤ maxW) whose height stays ≤ maxH; keeps the photo whole.
export function fitPhoto(aspect, maxW, maxH, frame = "bare") {
  const [px, py] = PAD[frame] || PAD.bare;
  const a = safeAspect(aspect);
  const w = Math.max(6, Math.min(maxW, ((maxH - py) * a) / PAGE_RATIO + px));
  return { w, h: frameHeight(a, w, frame) };
}
const area = (b) => b.w * b.h;
export function overlapArea(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2));
  const y = Math.max(0, Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2));
  return x * y;
}
const inside = (b, top = 0, bottom = 100) => b.x - b.w / 2 >= 1 && b.x + b.w / 2 <= 99 && b.y - b.h / 2 >= top && b.y + b.h / 2 <= bottom;

// The best "hero" among visuals: a landscape photo first (it carries a page),
// otherwise the first one.
export function heroIndex(visuals) {
  const i = visuals.findIndex((v) => safeAspect(v.aspect) >= 1.2);
  return i >= 0 ? i : 0;
}

// Rows of photos (in their shapes) filling a region; returns boxes.
function rowsIn(visuals, region, frame) {
  if (!visuals.length) return [];
  const aspects = visuals.map((v) => safeAspect(v.aspect));
  const height = region.bottom - region.top;
  if (height < 6) return visuals.map(() => null);
  const { slots } = bestRows(aspects, { region });
  // bestRows sizes bare photos; give framed ones a little room.
  const shrink = frame === "polaroid" ? 0.9 : frame === "border" ? 0.95 : 1;
  return slots.map((s, i) => {
    const fit = fitPhoto(aspects[i], s.w * shrink, s.h * shrink, frame);
    return { x: s.x, y: s.y, w: fit.w, h: fit.h };
  });
}

// A loose collage: the hero first, then each photo where it overlaps the
// others least (at most ~12% of its area), a little smaller each time.
function collage(visuals, region, frame, variant = 0) {
  const boxes = [];
  const order = visuals.map((v, i) => i);
  const hero = heroIndex(visuals);
  order.splice(order.indexOf(hero), 1);
  order.unshift(hero);
  const regionW = 100 - 2 * (region.side || 6),
    regionH = region.bottom - region.top;
  const n = visuals.length;
  const heroMax = n === 1 ? 0.84 : n === 2 ? 0.62 : n <= 4 ? 0.54 : 0.46;
  const result = new Array(n);
  order.forEach((index, k) => {
    const a = safeAspect(visuals[index].aspect);
    let scale = k === 0 ? heroMax : Math.max(0.24, heroMax * [0.78, 0.7, 0.64, 0.58, 0.52, 0.48, 0.44][Math.min(6, k - 1)]);
    let best = null;
    for (let attempt = 0; attempt < 8 && !best; attempt++) {
      const fit = fitPhoto(a, regionW * scale, regionH * scale * 1.15, frame);
      let pick = null;
      for (let yi = 0; yi <= 12; yi++)
        for (let xi = 0; xi <= 12; xi++) {
          const x = (region.side || 6) + fit.w / 2 + ((regionW - fit.w) * ((xi + variant * 3) % 13)) / 12;
          const y = region.top + fit.h / 2 + ((regionH - fit.h) * yi) / 12;
          const box = { x, y, w: fit.w, h: fit.h };
          if (!inside(box, region.top, region.bottom)) continue;
          const over = boxes.reduce((s, b) => s + overlapArea(box, b), 0);
          const limit = 0.12 * Math.min(area(box), ...boxes.map(area), Infinity);
          if (boxes.length && over > limit) continue;
          // Each piece just touches its nearest neighbour (a collage, not a
          // pile) and the pieces spread out over the page.
          let score;
          if (!boxes.length) score = Math.abs(x - (variant % 2 ? 58 : 42)) + Math.abs(y - (region.top + region.bottom) / 2) * 0.6;
          else {
            const nearest = boxes.reduce((m, b) => (Math.hypot(b.x - x, b.y - y) < Math.hypot(m.x - x, m.y - y) ? b : m));
            const want = ((box.w + nearest.w) / 2) * 0.82;
            const cx = boxes.reduce((s2, b) => s2 + b.x, 0) / boxes.length,
              cy = boxes.reduce((s2, b) => s2 + b.y, 0) / boxes.length;
            score = over * 0.5 + Math.abs(Math.hypot(nearest.x - x, nearest.y - y) - want) * 0.8 - Math.hypot(cx - x, cy - y) * 0.25;
          }
          if (!pick || score < pick.score) pick = { box, score };
        }
      if (pick) best = pick.box;
      else scale *= 0.88;
    }
    if (!best) best = { ...fitPhoto(a, 24, 20, frame), x: 50, y: (region.top + region.bottom) / 2 };
    boxes.push(best);
    result[index] = best;
  });
  return result;
}

// Polaroids scattered on a loose grid, tilted (cozy).
function scatter(visuals, region, frame, variant = 0) {
  const n = visuals.length;
  const cols = n <= 2 ? 2 : n <= 4 ? 2 : n <= 9 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const gap = 3;
  const side = region.side || 7;
  const cellW = (100 - 2 * side - gap * (cols - 1)) / cols;
  const cellH = (region.bottom - region.top - gap * (rows - 1)) / rows;
  return visuals.map((v, i) => {
    const r = Math.floor(i / cols),
      c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const offset = ((cols - inRow) * (cellW + gap)) / 2;
    const fit = fitPhoto(v.aspect, cellW * 0.96, cellH * 0.96, frame);
    const jx = ((i + variant) % 3) - 1,
      jy = ((i * 2 + variant) % 3) - 1;
    return {
      x: side + offset + c * (cellW + gap) + cellW / 2 + jx * 1.2,
      y: region.top + r * (cellH + gap) + cellH / 2 + jy * 1.2,
      w: fit.w,
      h: fit.h,
    };
  });
}

const TILTS = { editorial: [0], cozy: [-4, 3, -2.5, 4, -3, 2.5], playful: [-6, 5, -3, 7, -5, 4] };
const tilt = (style, i, variant) => {
  const list = TILTS[style];
  return list[(i + variant) % list.length];
};

function textLayer(look, values) {
  return { kind: "text", scale: 1, rotation: 0, weight: 400, spacing: 0, align: "left", color: look.ink, gen: true, ...values };
}

// When the content is shorter than the page, move it to the optical centre
// (a little above the middle) instead of leaving the bottom empty. The small
// time label at the top stays.
function centreVertically(place, layers, top = 8, bottom = 95) {
  const boxes = Object.values(place).filter((b) => b.h);
  const texts = layers.filter((l) => l.bind !== "time");
  const hOf = (l) => measuredBlock(l.text, l.fontSize, l.w, l.fontId, l.weight).height;
  const tops = boxes.map((b) => b.y - b.h / 2).concat(texts.map((l) => l.y - hOf(l) / 2));
  const ends = boxes.map((b) => b.y + b.h / 2).concat(texts.map((l) => l.y + hOf(l) / 2));
  if (!tops.length) return;
  const minY = Math.min(...tops),
    maxY = Math.max(...ends);
  const shift = Math.max(0, ((bottom - top) - (maxY - minY)) * 0.42 - (minY - top));
  if (shift < 1.5) return;
  for (const b of boxes) b.y = round(b.y + shift);
  for (const l of texts) l.y = round(l.y + shift);
}

// ---------- V10.19 · words for one photo, and the page's own type ----------
// A photo's own line (photo.caption) sits right under that photo: the photo
// and its words are laid out as one unit, so photo 1's words can never land
// beside photo 2. The layer is bound to the photo by the photo layer's id
// (`captionOf`), never by its time or its place in the row.
const CAPTION_SIZE = { editorial: 10.5, cozy: 13, playful: 11.5 };
// V10.33: a photo's words are as wide as the photo (they used to be at least
// 26% wide and could reach over the photos beside a narrow one).
const captionWidth = (w) => Math.min(86, Math.max(18, w));
const capBox = (l) => ({ x: l.x, y: l.y, w: l.w, h: measuredBlock(l.text, l.fontSize, l.w, l.fontId, l.weight).height });
// The font and weight the page's words will really render in (the page's
// quick type wins over the style's default).
const wordsFont = (text, look, type) => type?.fontId || pickFont(text, look);
const wordsWeight = (type, title) => (type?.bold ? 700 : title ? 500 : 400);
// The page's quick type (the Moment's / day's `typeStyle`, chosen in the
// magazine view): { fontId, color, bold, align, scale }. Only the page's
// own words follow it (its line and the photos' lines) — not the small
// time, folio or date labels.
export const TYPE_SCALES = [0.85, 1, 1.15, 1.3];
export const typeScale = (type) => (TYPE_SCALES.includes(Number(type?.scale)) ? Number(type.scale) : 1);
export function applyType(layers, type) {
  if (!type) return layers;
  for (const layer of layers) {
    if (layer.kind !== "text" || !["title", "caption"].includes(layer.bind) || layer.prefix) continue;
    if (type.fontId) layer.fontId = type.fontId;
    if (/^#[0-9a-f]{6}$/i.test(type.color || "")) layer.color = type.color;
    if (type.bold != null) layer.weight = type.bold ? 700 : layer.bind === "title" ? 500 : 400;
    if (["left", "center", "right"].includes(type.align)) layer.align = type.align;
  }
  return layers;
}

// ---------- One Moment's page ----------
// input: { visuals: [{ id, aspect, caption? }], title, time, audio: [{ id }], type? }
// Returns { place: { [id]: { x, y, w, h, rotation, frame, tape } },
//           layers: [generated text layers], paper, backdrop }.
function layoutMomentBase(input, styleId = "editorial", variant = 0) {
  const style = styleOf(styleId);
  const look = STYLE_LOOK[style];
  const scale = typeScale(input.type);
  const said = (v) => String(v.caption || "").trim();
  const visuals = input.visuals || [];
  if (!visuals.some(said)) return applyResult(layoutCore(input, style, variant, scale), input.type);
  // Pass 1 sizes each photo; pass 2 lays out "photo + its words" units of
  // that height, so the words get their own room under their photo.
  const size = CAPTION_SIZE[style] * scale;
  const first = layoutCore(input, style, variant, scale);
  const frame = look.frame;
  const [px, py] = PAD[frame] || PAD.bare;
  const capOf = new Map();
  const units = visuals.map((v) => {
    const text = said(v);
    const box = first.place[v.id];
    if (!text || !box) return v;
    const fit = fitText(text, size, captionWidth(box.w), 5, 10, wordsFont(text, look, input.type), wordsWeight(input.type, false));
    const capH = fit.height + 1.8;
    capOf.set(v.id, { text, fit, capH });
    const unitAspect = ((box.w - px) * PAGE_RATIO) / Math.max(4, box.h + capH - py);
    return { ...v, aspect: unitAspect };
  });
  const second = layoutCore({ ...input, visuals: units }, style, variant, scale);
  const made = [];
  for (const v of visuals) {
    const cap = capOf.get(v.id);
    const unit = second.place[v.id];
    if (!cap || !unit) continue;
    const photoH = frameHeight(v.aspect, unit.w, frame);
    const top = unit.y - unit.h / 2;
    second.place[v.id] = { ...unit, h: round(photoH), y: round(top + photoH / 2) };
    // Words re-measured at the photo's final width (never cut: fewer lines
    // only by a slightly smaller size, then more lines).
    const w = captionWidth(unit.w);
    const fit = fitText(cap.text, size, w, 5, 10, wordsFont(cap.text, look, input.type), wordsWeight(input.type, false));
    const x = Math.min(96 - w / 2, Math.max(4 + w / 2, unit.x));
    const layer = textLayer(look, { bind: "caption", captionOf: v.id, text: cap.text, x: round(x), y: round(top + photoH + 1.2 + fit.height / 2), w: round(w), fontId: wordsFont(cap.text, look, input.type), weight: wordsWeight(input.type, false), fontSize: fit.size, align: "center", rotation: round((unit.rotation || 0) / 2), color: style === "editorial" ? look.muted : look.ink });
    second.layers.push(layer);
    made.push({ layer, v, size });
  }
  settleCaptions(second, made, frame);
  return applyResult(second, input.type);
}
// Words that would sit on another photo (tilted Polaroids, a loose collage)
// or run off the page: first keep them to their photo's width, then try
// above the photo, then make that photo a little smaller. Never cut.
function settleCaptions(result, made, frame) {
  const others = (self) => [
    ...Object.entries(result.place).filter(([id, o]) => id !== self.v.id && o.h).map(([, o]) => o),
    ...made.filter((m) => m !== self).map((m) => capBox(m.layer)),
    ...result.layers.filter((l) => l.kind === "text" && l.bind !== "caption" && l.w).map(capBox),
  ];
  const ok = (m) => {
    const box = capBox(m.layer);
    if (box.y - box.h / 2 < 1 || box.y + box.h / 2 > 99.5 || box.x - box.w / 2 < 1 || box.x + box.w / 2 > 99) return false;
    // V10.33: not on anything — the total, not 6% on each thing.
    return others(m).reduce((sum, o) => sum + overlapArea(box, o), 0) <= 0.003 * box.w * box.h;
  };
  const place = (m, where = "below") => {
    const p = result.place[m.v.id];
    const fit = fitText(m.layer.text, m.size, m.layer.w, 5, 10, m.layer.fontId, m.layer.weight);
    m.layer.fontSize = fit.size;
    m.layer.x = round(Math.min(99 - m.layer.w / 2, Math.max(1 + m.layer.w / 2, p.x)));
    m.layer.y = round(where === "below" ? p.y + p.h / 2 + 1.2 + fit.height / 2 : p.y - p.h / 2 - 1.2 - fit.height / 2);
  };
  for (const m of made) {
    for (let attempt = 0; attempt < 8 && !ok(m); attempt++) {
      const p = result.place[m.v.id];
      if (attempt === 0) {
        m.layer.w = round(Math.max(18, Math.min(m.layer.w, p.w)));
        place(m);
      } else if (attempt === 1) place(m, "above");
      else {
        // A smaller photo, same top-left feel (its centre moves up and in).
        const w = p.w * 0.88;
        const h = frameHeight(m.v.aspect, w, frame);
        result.place[m.v.id] = { ...p, w: round(w), h: round(h), y: round(p.y - p.h / 2 + h / 2) };
        m.layer.w = round(Math.max(18, Math.min(captionWidth(w), w + 6)));
        place(m);
      }
    }
  }
}
const applyResult = (result, type) => (applyType(result.layers, type), result);

function layoutCore(input, styleId = "editorial", variant = 0, typeSize = 1) {
  const style = styleOf(styleId);
  const look = STYLE_LOOK[style];
  const visuals = input.visuals || [];
  const n = visuals.length;
  const title = String(input.title || "").trim();
  const v = ((variant % 3) + 3) % 3;
  const layers = [];
  const place = {};
  const frame = look.frame;
  const put = (visual, box, i, extra = {}) => {
    place[visual.id] = { x: round(box.x), y: round(box.y), w: round(box.w), h: round(box.h), rotation: tilt(style, i, v), frame, tape: false, ...extra };
  };
  // Words: the time (small) and the Moment's own line (bound, so edits show).
  const meta = (values) =>
    layers.push(
      style === "editorial"
        ? // A magazine kicker: "— 08:10 · MORNING", in the accent colour.
          textLayer(look, { bind: "time", prefix: "kicker", text: input.time || "", fontId: look.meta, fontSize: 8.5, spacing: 2.4, color: look.accent, weight: 700, ...values })
        : textLayer(look, { bind: "time", text: input.time || "", fontId: look.meta, fontSize: style === "cozy" ? 14 : 9, spacing: 0, color: look.muted, weight: 400, ...values }),
    );
  const titleFont = wordsFont(title, look, input.type);
  const titleWeight = wordsWeight(input.type, true);
  const caption = (values) => {
    layers.push(textLayer(look, { bind: "title", text: title, fontId: titleFont, ...values }));
  };
  const audioBand = (input.audio || []).length ? 9 : 0;
  let arrangement = "";

  // A3 · A page of words only (the rest of a long text, on the page after
  // its photos): the words from the top at a comfortable reading size, as a
  // headline when they are short. Never shrunk to squeeze, never cut.
  if (n === 0) {
    const textW = 80;
    const fit = lineFor(title, textUnits(title) <= 14 ? 24 : 21, textW, typeSize, titleFont, titleWeight);
    if (input.time) meta({ x: 50, y: 6, w: textW, align: "left" });
    const top = input.time ? 12 : 9;
    if (title) caption({ x: 50, y: top + fit.height / 2, w: textW, fontSize: fit.size, align: "left", ...(style === "playful" ? { weight: 600 } : {}) });
    if (input.folio && style === "editorial") layers.push(textLayer(look, { text: input.folio, x: 70, y: 97.6, w: 50, fontId: look.meta, fontSize: 6.5, spacing: 2, color: look.muted, align: "right" }));
    (input.audio || []).forEach((clip, i) => {
      place[clip.id] = { x: 50, y: 95 - audioBand / 2 - i * 0.5, w: 70, rotation: 0 };
    });
    return { place, layers, paper: look.paper, backdrop: style === "playful" ? PLAYFUL_BACKDROPS[v] : null, arrangement: "text" };
  }

  if (style === "editorial") {
    const textW = n === 1 && v !== 0 ? 50 : 86;
    // A headline while it fits in two lines; a longer line is body text.
    const fit = lineFor(title, textUnits(title) <= 14 ? 24 : 21, textW, typeSize, titleFont, titleWeight);
    const textH = title ? fit.height + 4 : 0;
    const bottom = 94 - textH - audioBand;
    // The folio at the foot of the page, like a magazine.
    if (input.folio) layers.push(textLayer(look, { text: input.folio, x: v === 1 ? 30 : 70, y: 97.6, w: 50, fontId: look.meta, fontSize: 6.5, spacing: 2, color: look.muted, align: v === 1 ? "left" : "right" }));
    if (input.time) meta({ x: v === 1 ? 58 : 42, y: 4.6, w: 70, align: v === 1 ? "right" : "left" });
    if (n === 1) {
      const a = safeAspect(visuals[0].aspect);
      if (a < 0.9 && title && v !== 0) {
        // A portrait photo beside its words, like a magazine column.
        const box = fitPhoto(a, 56, 84 - audioBand, frame);
        const left = v === 1;
        put(visuals[0], { ...box, x: left ? 7 + box.w / 2 : 93 - box.w / 2, y: 8 + box.h / 2 }, 0);
        const colW = 86 - box.w - 5;
        const f = fitText(title, 20 * typeSize, colW, 8, 11, titleFont, titleWeight);
        caption({ x: left ? 93 - colW / 2 : 7 + colW / 2, y: 8 + box.h - f.height / 2 - 2, w: colW, fontSize: f.size, align: left ? "left" : "right" });
      } else {
        // A single landscape photo opens edge to edge (the magazine look).
        const full = v === 0;
        const box = fitPhoto(a, full ? (a >= 1 ? 100 : 76) : 82, bottom - 8, frame);
        const x = full ? 50 : v === 1 ? 93 - box.w / 2 : 7 + box.w / 2;
        const y = 8 + box.h / 2;
        put(visuals[0], { ...box, x, y }, 0);
        if (title) caption({ x: full ? 50 : v === 1 ? 7 + textW / 2 : 93 - textW / 2, y: y + box.h / 2 + 3 + fit.height / 2, w: full ? 80 : textW, fontSize: fit.size, align: full ? "center" : v === 1 ? "left" : "right" });
      }
    } else if (n === 2 && (!title || textUnits(title) > 24)) {
      // V10.28 · Two photos and no words: a balanced pair, never a big one,
      // a small one and an empty column kept for words that were not
      // written. Side by side, one above the other, or staggered — the best
      // for these two shapes first; "换个排版" takes the next ones.
      // V10.30: a long line (too long for the column beside a photo) goes
      // under the pair the same way (before, the second photo shrank).
      const pair = pairLayout(visuals, { top: 8, bottom, left: 7, right: 93 }, frame, v);
      pair.boxes.forEach((box, i) => put(visuals[i], box, i));
      arrangement = pair.kind;
      if (title) caption({ x: 50, y: bottom + 2 + fit.height / 2, w: 86, fontSize: fit.size, weight: 500 });
    } else {
      const hero = v === 2 ? -1 : heroIndex(visuals);
      const rest = visuals.filter((_, i) => i !== hero);
      let top = 8;
      if (hero >= 0) {
        const heroMax = n === 2 ? 46 : n <= 4 ? 44 : 38;
        // The hero takes at most ~60% of the room left after the words, so
        // the other photos never shrink to stamps.
        const box = fitPhoto(visuals[hero].aspect, 86, Math.min(heroMax, (bottom - 11) * 0.6), frame);
        const heroAtTop = v === 0;
        const restH = bottom - 8 - box.h - 3;
        const y = heroAtTop ? 8 + box.h / 2 : bottom - box.h / 2;
        put(visuals[hero], { ...box, x: v === 0 ? 93 - box.w / 2 : 7 + box.w / 2, y }, 0);
        const region = heroAtTop ? { top: 8 + box.h + 3, bottom, left: 7, right: 93 } : { top: 8, bottom: 8 + restH, left: 7, right: 93 };
        if (n === 2 && heroAtTop && textUnits(title) <= 24) {
          // A smaller second photo, set to one side, the words beside it.
          // The words beside it keep a readable column (≥ 36% of the width).
          const second = fitPhoto(rest[0].aspect, title ? 46 : 66, region.bottom - region.top, frame);
          put(rest[0], { ...second, x: 93 - second.w / 2, y: region.top + second.h / 2 }, 1);
          if (title) {
            const colW = 86 - second.w - 4;
            const f = fitText(title, 18 * typeSize, colW, 6, 11, titleFont, titleWeight);
            caption({ x: 7 + colW / 2, y: region.top + f.height / 2 + 1, w: colW, fontSize: f.size });
          }
          top = -1;
        } else {
          const boxes = rowsIn(rest, region, frame);
          // V10.29 (Step 5): with many photos and a long line the room under
          // the big photo can get so short that the others shrink to stamps
          // (seen: 3% of the page wide). Then every photo goes in even rows.
          if (boxes.some((b) => !b || b.w < 14)) {
            delete place[visuals[hero].id];
            rowsIn(visuals, { top: 8, bottom, left: 7, right: 93 }, frame).forEach((box2, i) => box2 && put(visuals[i], box2, i));
          } else boxes.forEach((box2, i) => box2 && put(rest[i], box2, i + 1));
        }
      } else rowsIn(visuals, { top: 8, bottom, left: 7, right: 93 }, frame).forEach((box2, i) => box2 && put(visuals[i], box2, i));
      if (title && top !== -1) caption({ x: 50, y: bottom + 2 + fit.height / 2, w: 86, fontSize: fit.size, weight: 500 });
    }
  } else if (style === "cozy") {
    const fit = lineFor(title, 22, 76, typeSize, titleFont, titleWeight);
    const textH = title ? fit.height + 5 : 0;
    const bottom = 95 - textH - audioBand;
    if (input.time) meta({ x: v === 1 ? 20 : 80, y: 5, w: 30, align: v === 1 ? "left" : "right", rotation: v === 1 ? 3 : -3 });
    const region = { top: 9, bottom, side: 7 };
    let boxes;
    if (n === 1) {
      const box = fitPhoto(visuals[0].aspect, 72, bottom - 10, frame);
      boxes = [{ ...box, x: 50 + (v === 1 ? 4 : v === 2 ? 0 : -4), y: 9 + (bottom - 9) / 2 }];
    } else if (n <= 3 && v !== 2) {
      const spots = n === 2 ? [[0.33, 0.3], [0.67, 0.7]] : [[0.3, 0.26], [0.72, 0.4], [0.42, 0.76]];
      const size = n === 2 ? 0.56 : 0.48;
      boxes = visuals.map((vis, i) => {
        const box = fitPhoto(vis.aspect, 86 * size, (bottom - 9) * (n === 2 ? 0.62 : 0.5), frame);
        const [sx, sy] = spots[i];
        const x = v === 1 ? 100 - (7 + 86 * sx) : 7 + 86 * sx;
        return { ...box, x: Math.min(93 - box.w / 2, Math.max(7 + box.w / 2, x)), y: Math.min(bottom - box.h / 2, Math.max(9 + box.h / 2, 9 + (bottom - 9) * sy)) };
      });
    } else boxes = scatter(visuals, region, frame, v);
    boxes.forEach((box, i) => put(visuals[i], box, i, { tape: i % 3 === 0 }));
    if (title) caption({ x: v === 1 ? 46 : 54, y: bottom + 3 + fit.height / 2, w: 76, fontSize: fit.size, align: "center", rotation: v === 1 ? 1.5 : -1.5 });
  } else {
    // playful
    const fit = lineFor(title, 22, 80, typeSize, titleFont, titleWeight);
    const headH = title ? fit.height + 6 : 4;
    const top = 6 + headH;
    const bottom = 95 - audioBand;
    if (title) caption({ x: v === 1 ? 54 : 46, y: 6 + fit.height / 2, w: 80, fontSize: fit.size, weight: 600, align: v === 1 ? "right" : "left", rotation: v === 1 ? 2 : -2 });
    if (input.time) meta({ x: v === 1 ? 16 : 84, y: title ? 6 + fit.height + 2 : 5, w: 24, align: v === 1 ? "left" : "right" });
    const boxes = n > 7 ? scatter(visuals, { top, bottom, side: 6 }, frame, v) : collage(visuals, { top, bottom, side: 6 }, frame, v);
    boxes.forEach((box, i) => put(visuals[i], box, i, { tape: i === 0 || i === 3 }));
  }
  // (A pair is centred on the page itself: the folio line at the foot does
  // not count as content.)
  if (style !== "playful") centreVertically(place, arrangement ? layers.filter((l) => l.y < 95) : layers, style === "cozy" ? 10 : 8, 95 - audioBand);
  (input.audio || []).forEach((clip, i) => {
    place[clip.id] = { x: 50, y: 95 - audioBand / 2 - i * 0.5, w: 70, rotation: 0 };
  });
  return { place, layers, paper: look.paper, backdrop: style === "playful" ? PLAYFUL_BACKDROPS[v] : null, ...(arrangement ? { arrangement } : {}) };
}

// ---------- V10.28 · Two photos as a pair ----------
// Three arrangements, each keeping both photos whole (no crop):
//   row     side by side;
//   column  one above the other;
//   stagger side by side, the second set a third lower.
// Two photos of very different shapes would come out one big and one tiny
// at the same height / width, so the smaller one is given a little more of
// the shared side (halfway to equal sizes). Each arrangement is scored by
// how much of the region the photos fill, how even their sizes are and how
// much of the width they span; a pair where one photo is under 35% of the
// other's size is marked down. `variant` 0 is the best, 1 and 2 the next
// ones. Returns { kind, boxes, order } (order: all three kinds, best first).
export const PAIR_KINDS = ["row", "column", "stagger"];
export function pairLayout(visuals, region, frame = "bare", variant = 0) {
  const W = region.right - region.left,
    H = region.bottom - region.top,
    gap = 2.4;
  const a = visuals.slice(0, 2).map((v) => safeAspect(v.aspect));
  const wAt = (i, h) => fitPhoto(a[i], 999, h, frame).w;
  const hAt = (i, w) => frameHeight(a[i], w, frame);
  const cx = region.left + W / 2;
  // Same height → sizes differ by a1/a0; same width → by a0/a1. Halfway
  // (in proportion) to equal: the second side is k times the first.
  const kRow = Math.pow(a[0] / a[1], 0.25),
    kCol = Math.pow(a[1] / a[0], 0.25);
  const shrink = (fits, start) => {
    let s = start;
    for (let k = 0; k < 120 && !fits(s); k++) s *= 0.97;
    return s;
  };
  const cands = [];
  {
    const h = shrink((h0) => wAt(0, h0) + wAt(1, h0 * kRow) + gap <= W && Math.max(h0, h0 * kRow) <= H, H / Math.max(1, kRow));
    const w0 = wAt(0, h),
      w1 = wAt(1, h * kRow),
      x0 = cx - (w0 + w1 + gap) / 2;
    const h0 = hAt(0, w0),
      h1 = hAt(1, w1),
      mid = region.top + Math.max(h0, h1) / 2;
    cands.push({ kind: "row", boxes: [{ x: x0 + w0 / 2, y: mid, w: w0, h: h0 }, { x: x0 + w0 + gap + w1 / 2, y: mid, w: w1, h: h1 }] });
  }
  {
    const w = shrink((w0) => Math.max(w0, w0 * kCol) <= W && hAt(0, w0) + hAt(1, w0 * kCol) + gap <= H, W / Math.max(1, kCol));
    const w1 = w * kCol,
      h0 = hAt(0, w),
      h1 = hAt(1, w1);
    cands.push({ kind: "column", boxes: [{ x: cx, y: region.top + h0 / 2, w, h: h0 }, { x: cx, y: region.top + h0 + gap + h1 / 2, w: w1, h: h1 }] });
  }
  {
    const drop = (w0) => hAt(0, w0) * 0.32;
    const w = shrink((w0) => w0 + w0 * kCol + gap <= W && Math.max(hAt(0, w0), drop(w0) + hAt(1, w0 * kCol)) <= H, (W - gap) / (1 + kCol));
    const w1 = w * kCol,
      h0 = hAt(0, w),
      h1 = hAt(1, w1),
      x0 = cx - (w + w1 + gap) / 2;
    cands.push({ kind: "stagger", boxes: [{ x: x0 + w / 2, y: region.top + h0 / 2, w, h: h0 }, { x: x0 + w + gap + w1 / 2, y: region.top + drop(w) + h1 / 2, w: w1, h: h1 }] });
  }
  for (const c of cands) {
    const areas = c.boxes.map((b) => b.w * b.h);
    const cover = (areas[0] + areas[1]) / (W * H);
    const balance = Math.min(...areas) / Math.max(...areas);
    const xs = c.boxes.flatMap((b) => [b.x - b.w / 2, b.x + b.w / 2]);
    const hfill = (Math.max(...xs) - Math.min(...xs)) / W;
    c.balance = balance;
    c.score = cover * (0.55 + 0.45 * balance) * (0.6 + 0.4 * hfill) * (balance < 0.35 ? 0.5 : 1);
  }
  // Stable: equal scores keep the row → column → stagger order.
  const ranked = cands.map((c, i) => ({ c, i })).sort((x, y) => y.c.score - x.c.score || x.i - y.i).map(({ c }) => c);
  const pick = ranked[((variant % 3) + 3) % 3];
  return { kind: pick.kind, boxes: pick.boxes, order: ranked.map((c) => c.kind) };
}

// ---------- The day spread (cover) ----------
// moments: [{ id, time, title, photo: { reference, name, aspect } }] (the
// Moment's best photo). The photos are copies (gen) of those references.
// Returns { layers, paper, backdrop }.
export function layoutDay(moments, styleId = "editorial", variant = 0, { dateSmall = "", dateBig = "", issue = "", more = (n) => `+${n}`, makeId } = {}) {
  const style = styleOf(styleId);
  const look = STYLE_LOOK[style];
  const v = ((variant % 3) + 3) % 3;
  const id = makeId || (() => Math.random().toString(36).slice(2, 10));
  const shown = moments.slice(0, 4);
  const hidden = moments.length - shown.length;
  const layers = [];
  const frame = look.frame;
  const photo = (m, box, i, extra = {}) =>
    layers.push({ id: id(), kind: "photo", text: m.photo.name || "photo", mediaRef: m.photo.reference, aspect: safeAspect(m.photo.aspect), x: round(box.x), y: round(box.y), w: round(box.w), h: round(box.h), scale: 1, rotation: tilt(style, i, v), frame, tape: false, crop: { x: 50, y: 50, zoom: 1 }, gen: true, ...extra });
  const bound = (m, field, values) => layers.push(textLayer(look, { id: id(), bind: field, of: m.id, text: field === "time" ? m.time : m.title, ...values }));
  const visuals = shown.map((m) => ({ id: m.id, aspect: m.photo?.aspect }));
  const hero = heroIndex(visuals);

  if (style === "editorial") {
    // A magazine cover's masthead: the name, the issue, then a big date.
    layers.push(textLayer(look, { id: id(), text: "LITTLE DAYS", x: 30, y: 3.4, w: 46, fontId: look.meta, fontSize: 7.5, spacing: 3, color: look.accent, weight: 700 }));
    if (issue) layers.push(textLayer(look, { id: id(), text: issue, x: 70, y: 3.4, w: 46, fontId: look.meta, fontSize: 7.5, spacing: 2, color: look.muted, weight: 600, align: "right" }));
    layers.push(textLayer(look, { id: id(), text: dateBig, x: 38, y: 9.4, w: 62, fontId: look.latin, fontSize: 34, color: look.ink, weight: 500 }));
    if (dateSmall) layers.push(textLayer(look, { id: id(), text: dateSmall, x: 80, y: 10.6, w: 26, fontId: pickFont(dateSmall, look), fontSize: 10, color: look.muted, align: "right" }));
    const heroM = shown[hero];
    const heroTitle = (heroM.title || "").trim();
    const hf = heroTitle ? fitText(heroTitle, 17, 86, 2, 12) : { height: 0, size: 17 };
    const rest = shown.filter((_, i) => i !== hero);
    const box = fitPhoto(heroM.photo.aspect, 86, rest.length ? 42 : 66, frame);
    const heroBox = { ...box, x: v === 1 ? 7 + box.w / 2 : 93 - box.w / 2, y: 15 + box.h / 2 };
    photo(heroM, heroBox, 0);
    let y = 15 + box.h + 2.5;
    bound(heroM, "time", { x: 30, y: y + 0.6, w: 46, fontId: look.meta, fontSize: 8, spacing: 2.4, color: look.accent, weight: 700, prefix: "kicker" });
    if (heroTitle) {
      bound(heroM, "title", { x: 50, y: y + 3 + hf.height / 2, w: 86, fontId: pickFont(heroTitle, look), fontSize: hf.size });
      y += 3 + hf.height;
    } else y += 3;
    if (rest.length) {
      const capRoom = 8;
      const region = { top: y + 3, bottom: 95 - capRoom - (hidden ? 3 : 0), left: 7, right: 93 };
      const slots = rowsIn(rest.map((m) => ({ aspect: m.photo.aspect })), region, frame);
      slots.forEach((slot, i) => {
        if (!slot) return;
        photo(rest[i], slot, i + 1);
        const m = rest[i];
        const t = (m.title || "").trim();
        bound(m, "time", { x: slot.x, y: slot.y + slot.h / 2 + 1.8, w: Math.max(18, slot.w), fontId: look.meta, fontSize: 7.5, spacing: 1.2, color: look.muted, weight: 600, align: "center" });
        if (t) {
          const capW = Math.max(20, slot.w);
          const excerpt = Math.max(8, Math.round((slot.w / 2.2) / Math.max(0.55, textUnits(t) / t.length)));
          const shown = t.length > excerpt ? t.slice(0, excerpt) : t;
          const h = textBlock(shown, 10, capW).height;
          bound(m, "title", { x: slot.x, y: slot.y + slot.h / 2 + 3.6 + h / 2, w: capW, fontId: pickFont(t, look), fontSize: 10, align: "center", excerpt });
        }
      });
    }
  } else if (style === "cozy") {
    layers.push(textLayer(look, { id: id(), text: dateBig, x: v === 1 ? 22 : 78, y: 6, w: 40, fontId: look.latin, fontSize: 28, align: v === 1 ? "left" : "right", rotation: v === 1 ? -3 : 3 }));
    if (dateSmall) layers.push(textLayer(look, { id: id(), text: dateSmall, x: v === 1 ? 22 : 78, y: 11, w: 40, fontId: pickFont(dateSmall, look), fontSize: 11, color: look.muted, align: v === 1 ? "left" : "right" }));
    const n = shown.length;
    const spots = {
      2: [[0.32, 0.36], [0.68, 0.72]],
      3: [[0.3, 0.3], [0.72, 0.48], [0.36, 0.78]],
      4: [[0.28, 0.28], [0.72, 0.3], [0.3, 0.74], [0.72, 0.76]],
    }[Math.max(2, n)];
    const top = 14,
      bottom = 95 - (hidden ? 4 : 0);
    shown.forEach((m, i) => {
      const size = i === hero ? (n === 2 ? 0.54 : 0.46) : n === 2 ? 0.46 : 0.38;
      const box = fitPhoto(m.photo.aspect, 86 * size, (bottom - top) * (n <= 2 ? 0.5 : 0.36), frame);
      const [sx, sy] = spots[i];
      const x = v === 1 ? 100 - (7 + 86 * sx) : 7 + 86 * sx;
      const b = { ...box, x: Math.min(93 - box.w / 2, Math.max(7 + box.w / 2, x)), y: Math.min(bottom - box.h / 2 - 5, Math.max(top + box.h / 2, top + (bottom - top) * sy - 3)) };
      photo(m, b, i, { tape: i % 2 === 0 });
      const t = (m.title || "").trim();
      const label = t ? `${m.time ? m.time + " " : ""}${t}` : m.time;
      const capW = Math.max(26, b.w + 4);
      const perLine = Math.max(6, Math.floor((capW * 10.8) / (12 * 3.375) / Math.max(0.55, textUnits(label) / Math.max(1, label.length))));
      if (label) layers.push(textLayer(look, { id: id(), bind: t ? "title" : "time", of: m.id, prefix: t && m.time ? "time" : "", text: label, x: b.x, y: b.y + b.h / 2 + 2.6, w: capW, fontId: pickFont(label, look), fontSize: 12, align: "center", rotation: tilt("cozy", i + 1, v) / 2, excerpt: perLine }));
    });
  } else {
    layers.push(textLayer(look, { id: id(), text: dateBig, x: v === 1 ? 70 : 30, y: 7, w: 50, fontId: look.latin, fontSize: 30, weight: 600, align: v === 1 ? "right" : "left", rotation: v === 1 ? 3 : -3 }));
    if (dateSmall) layers.push(textLayer(look, { id: id(), text: dateSmall, x: v === 1 ? 70 : 30, y: 12.5, w: 50, fontId: pickFont(dateSmall, look), fontSize: 11, color: look.muted, align: v === 1 ? "right" : "left" }));
    const boxes = collage(visuals, { top: 17, bottom: 95 - (hidden ? 4 : 0), side: 6 }, frame, v);
    boxes.forEach((b, i) => {
      const m = shown[i];
      photo(m, b, i, { tape: i === 0 });
      if (m.time) bound(m, "time", { x: b.x, y: b.y - b.h / 2 + 2.6, w: 16, fontId: look.meta, fontSize: 9, weight: 700, color: "#FFFFFF", align: "center", chip: look.accent });
    });
  }
  if (hidden) layers.push(textLayer(look, { id: id(), text: more(hidden), x: 50, y: 96.5, w: 80, fontId: look.cjk, fontSize: 11, color: look.muted, align: "center" }));
  return { layers, paper: look.paper, backdrop: style === "playful" ? PLAYFUL_BACKDROPS[v] : null };
}

// The words a bound text layer shows on `page` (a Moment page, or the day's
// cover whose `moments` hold the Moments the layer points at).
// "08:10" → "MORNING" (a magazine kicker), "" when unknown.
export function partWord(time) {
  const h = Number(/^(\d{1,2}):/.exec(String(time || ""))?.[1]);
  if (!Number.isFinite(h)) return "";
  return h < 5 ? "NIGHT" : h < 12 ? "MORNING" : h < 18 ? "AFTERNOON" : h < 22 ? "EVENING" : "NIGHT";
}
// Formatting of words bound to a Moment's title: only when the title is
// shown as it is (no time in front, not cut short), so the ranges still fit.
export function boundMarks(layer, page, shown) {
  if (layer?.bind !== "title" || layer.prefix || layer.excerpt) return null;
  const source = layer.of ? (page?.moments || []).find((m) => m.id === layer.of) : page;
  return source && Array.isArray(source.titleMarks) && source.title === shown ? source.titleMarks : null;
}
export function boundText(layer, page) {
  if (!layer?.bind) return layer?.text ?? "";
  const source = layer.of ? (page?.moments || []).find((m) => m.id === layer.of) : page;
  if (!source) return layer.text || "";
  if (layer.prefix === "kicker") {
    const time = String(source.time || "").trim();
    return time ? `— ${time}${partWord(time) ? ` · ${partWord(time)}` : ""}` : "";
  }
  if (layer.bind === "caption") {
    // A photo's own words, read from that photo (by its layer id).
    const photo = (page?.layers || []).find((l) => l.id === layer.captionOf);
    return String(photo?.caption || "").trim();
  }
  let text = String((layer.bind === "time" ? source.time : source.title) || "").trim();
  if (layer.prefix === "time" && source.time && text) text = `${source.time} ${text}`;
  if (layer.bind === "title" && !text && layer.prefix === "time") text = source.time || "";
  if (layer.excerpt && text.length > layer.excerpt) text = `${text.slice(0, layer.excerpt - 1)}…`;
  return text;
}

// ---------- V10.33 (L1) · Layout quality check ----------
// Hard rules (a page that breaks one is not used when another passes):
//   · a photo's short side ≥ 20% of the page width, its area ≥ 5.5% of the
//     page (starting values, checked on real pages);
//   · words never on a photo, never on other words, never off the page;
//   · photos inside the page (one landscape photo may run edge to edge) and,
//     in the magazine style, not on each other (Polaroids and the collage
//     may overlap a little on purpose).
// Soft (a score, not a failure): the smallest photo about a third of the
// largest when there are up to four (a lead photo with smaller ones is a
// fine design), and no big empty band without a reason.
export const QUALITY = { minShort: 20, minShortTall: 26, tall: 0.62, minArea: 5.5, balanceFew: 1 / 3, balanceMany: 1 / 5, textOnPhoto: 0.3, emptyBand: 24 };
// Calibrated on real pages: a very tall picture (9:16 and taller — phone
// screenshots, memes) usually carries words; at 20% of the page wide those
// words were about 8 px high on a phone. It gets 26% (about 90 px).
export const minShortFor = (aspect) => (safeAspect(aspect) <= QUALITY.tall ? QUALITY.minShortTall : QUALITY.minShort);
const edgesOf = (b) => ({ l: b.x - b.w / 2, r: b.x + b.w / 2, t: b.y - b.h / 2, b: b.y + b.h / 2 });
const overlapOf = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
export function checkQuality(result, ids, { loose = false, fullBleed = false } = {}) {
  const hard = [];
  const soft = [];
  const photos = ids.map((id) => ({ id, ...result.place[id] })).filter((p) => p.w && p.h);
  for (const p of photos) {
    const short = Math.min(p.w, p.h / PAGE_RATIO);
    const aspect = (p.w * PAGE_RATIO) / p.h;
    if (short < minShortFor(aspect) || (p.w * p.h) / 100 < QUALITY.minArea) hard.push({ kind: "photo-too-small", id: p.id, value: +short.toFixed(1) });
    const e = edgesOf(p);
    if (!fullBleed && (e.l < 0.5 || e.r > 99.5 || e.t < 0.5 || e.b > 99.5)) hard.push({ kind: "photo-off-page", id: p.id });
  }
  if (!loose) for (let i = 0; i < photos.length; i++) for (let j = i + 1; j < photos.length; j++) if (overlapOf(edgesOf(photos[i]), edgesOf(photos[j])) > 0.5) hard.push({ kind: "photo-on-photo" });
  const words = (result.layers || []).filter((l) => l.kind === "text" && (l.bind === "title" || l.bind === "caption") && String(l.text || "").trim());
  const boxes = words.map((l) => ({ l, e: edgesOf({ x: l.x, y: l.y, w: l.w, h: measuredBlock(l.text, l.fontSize, l.w, l.fontId, l.weight).height }) }));
  for (const { l, e } of boxes) {
    const area = Math.max(0.01, (e.r - e.l) * (e.b - e.t));
    if ((photos.reduce((sum, p) => sum + overlapOf(e, edgesOf(p)), 0) / area) * 100 > QUALITY.textOnPhoto) hard.push({ kind: "words-on-photo", bind: l.bind });
    if (e.l < 1 || e.r > 99 || e.t < 1 || e.b > 99) hard.push({ kind: "words-off-page", bind: l.bind });
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlapOf(boxes[i].e, boxes[j].e) > 0.3) hard.push({ kind: "words-on-words" });
  const areas = photos.map((p) => p.w * p.h);
  const balance = areas.length > 1 ? Math.min(...areas) / Math.max(...areas) : 1;
  if (balance < (areas.length <= 4 ? QUALITY.balanceFew : QUALITY.balanceMany)) soft.push({ kind: "uneven", value: +balance.toFixed(2) });
  const spans = [...photos.map(edgesOf), ...boxes.map((x) => x.e)].map((e) => [e.t, e.b]).sort((a, b) => a[0] - b[0]);
  let reach = spans.length ? spans[0][1] : 0, gap = 0;
  for (const [t, b] of spans.slice(1)) {
    gap = Math.max(gap, t - reach);
    reach = Math.max(reach, b);
  }
  if (gap > QUALITY.emptyBand) soft.push({ kind: "empty-band", value: +gap.toFixed(1) });
  const minShort = photos.length ? Math.min(...photos.map((p) => Math.min(p.w, p.h / PAGE_RATIO))) : 0;
  const cover = areas.reduce((sum, a) => sum + a, 0) / (86 * 86);
  const score = cover * (0.6 + 0.4 * Math.min(1, balance * 3)) * Math.min(1, minShort / 28) * (soft.some((x) => x.kind === "empty-band") ? 0.8 : 1);
  return { ok: !hard.length, hard, soft, score };
}

// ---------- One Moment's page ----------
// input: { visuals: [{ id, aspect, caption? }], title, time, audio: [{ id }],
//          type?, measure? }
// The layout asked for (`variant`) is used when it passes the hard rules;
// otherwise the next one that does. result.quality says how it went:
//   { ok, variant, hard: [...], soft: [...] }.
export function layoutMoment(input, styleId = "editorial", variant = 0) {
  const before = MEASURE;
  MEASURE = typeof input?.measure === "function" ? input.measure : null;
  try {
    return layoutChecked(input, styleOf(styleId), variant);
  } finally {
    MEASURE = before;
  }
}
function checkOptions(input, style) {
  const n = (input.visuals || []).length;
  return { loose: style !== "editorial", fullBleed: n === 1 };
}
// ---------- V10.33 (L2) · Other ways to arrange the photos ----------
// Used only when none of the style's own layouts passes the hard rules:
//   · tidy rows (with one lead photo over a pair, and the like); every photo
//     keeps the width it needs to be seen — a narrow one stands a little
//     taller than its row instead of being squeezed — and a lead photo is
//     narrowed when it would dwarf the others (about 3× the smallest);
//   · two columns that end level;
//   · a tall photo (9:16, 3:4…) in its own column, the others in rows beside it.
// Each photo's words sit right under it, as wide as it, measured in their
// real font. The style keeps its look (frames, a slight tilt, tape, its
// paper); only the arrangement changes. Deterministic; photos never cropped.
const GAP = 2.4, CAP_GAP = 1.2;
const floorWidth = (a) => Math.max(minShortFor(a), QUALITY.minShort * a, Math.sqrt((QUALITY.minArea * 100 * a) / PAGE_RATIO)) + 0.3;
function unitHeight(u, w, ctx) {
  return frameHeight(u.a, w, ctx.frame) + (u.cap ? CAP_GAP + measuredBlock(u.cap, ctx.capSize, w, u.font, ctx.capWeight).height : 0);
}
function widthAtHeight(u, H, ctx) {
  let lo = 4, hi = 100;
  for (let k = 0; k < 18; k++) {
    const m = (lo + hi) / 2;
    if (unitHeight(u, m, ctx) > H) hi = m;
    else lo = m;
  }
  return lo;
}
function rowsOf(units, parts, W, ctx, caps = []) {
  const rows = [];
  let i = 0;
  const wOf = (u, m) => Math.max(widthAtHeight(u, m, ctx), floorWidth(u.a));
  for (const [r, n] of parts.entries()) {
    const row = units.slice(i, i + n);
    i += n;
    const RW = Math.min(W, caps[r] || W);
    let lo = 2, hi = 300;
    for (let k = 0; k < 22; k++) {
      const m = (lo + hi) / 2;
      if (row.reduce((sum, u) => sum + wOf(u, m), 0) + GAP * (n - 1) > RW) hi = m;
      else lo = m;
    }
    const widths = row.map((u) => wOf(u, lo));
    const heights = row.map((u, j) => unitHeight(u, widths[j], ctx));
    rows.push({ row, widths, heights, H: Math.max(...heights) });
  }
  return rows;
}
function compositions(n, max = 3) {
  if (n === 0) return [[]];
  const out = [];
  for (let k = 1; k <= Math.min(max, n); k++) for (const rest of compositions(n - k, max)) out.push([k, ...rest]);
  return out;
}
function arrangements(units, region, ctx) {
  const W = region.right - region.left, H = region.bottom - region.top, cx = region.left + W / 2;
  const out = [];
  const place = (rows, x0, wSpan, y0, boxes) => {
    let y = y0;
    for (const r of rows) {
      const rw = r.widths.reduce((sum, x) => sum + x, 0) + GAP * (r.row.length - 1);
      let x = x0 + (wSpan - rw) / 2;
      r.row.forEach((u, j) => {
        boxes[u.id] = { x: x + r.widths[j] / 2, top: y + (r.H - r.heights[j]) / 2, w: r.widths[j] };
        x += r.widths[j] + GAP;
      });
      y += r.H + GAP;
    }
  };
  const rowsHeight = (rows) => rows.reduce((sum, r) => sum + r.H, 0) + GAP * (rows.length - 1);
  const rowsFit = (rows, w) => rows.every((r) => r.widths.reduce((sum, x) => sum + x, 0) + GAP * (r.row.length - 1) <= w + 0.5);
  for (const parts of compositions(units.length)) {
    if (parts.length > 3) continue;
    let w = W, caps = [], rows = rowsOf(units, parts, w, ctx);
    for (let k = 0; k < 12 && rows.length > 1; k++) {
      const all = rows.flatMap((r, ri) => r.row.map((u, j) => ({ ri, a: r.widths[j] * frameHeight(u.a, r.widths[j], ctx.frame) })));
      const big = all.reduce((m, x) => (x.a > m.a ? x : m));
      if (Math.min(...all.map((x) => x.a)) / big.a >= 0.34) break;
      caps = rows.map((r, ri) => caps[ri] || W);
      caps[big.ri] *= 0.92;
      rows = rowsOf(units, parts, w, ctx, caps);
    }
    for (let k = 0; k < 30 && rowsHeight(rows) > H; k++) {
      w *= Math.min(0.98, H / rowsHeight(rows));
      rows = rowsOf(units, parts, w, ctx, caps.map((c) => c * (w / W)));
    }
    if (rowsHeight(rows) > H + 0.5 || !rowsFit(rows, W)) continue;
    const boxes = {};
    place(rows, region.left, W, region.top, boxes);
    out.push({ kind: `rows ${parts.join("+")}`, boxes, height: rowsHeight(rows) });
  }
  const colHeight = (list, w) => list.reduce((sum, u) => sum + unitHeight(u, w, ctx), 0) + GAP * (list.length - 1);
  const splits = [];
  for (let k = 1; k < units.length; k++) splits.push([units.slice(0, k), units.slice(k)]);
  for (const [A, B] of splits) {
    if (A.length > 3 || B.length > 3) continue;
    let lo = 5, hi = W - GAP - 5;
    for (let k = 0; k < 20; k++) {
      const m = (lo + hi) / 2;
      if (colHeight(A, m) > colHeight(B, W - GAP - m)) hi = m;
      else lo = m;
    }
    let wa = lo, wb = W - GAP - lo, s = 1;
    for (let k = 0; k < 40 && Math.max(colHeight(A, wa * s), colHeight(B, wb * s)) > H; k++) s *= 0.97;
    wa *= s;
    wb *= s;
    const x0 = cx - (wa + wb + GAP) / 2;
    const boxes = {};
    let y = region.top;
    for (const u of A) { boxes[u.id] = { x: x0 + wa / 2, top: y, w: wa }; y += unitHeight(u, wa, ctx) + GAP; }
    y = region.top;
    for (const u of B) { boxes[u.id] = { x: x0 + wa + GAP + wb / 2, top: y, w: wb }; y += unitHeight(u, wb, ctx) + GAP; }
    out.push({ kind: `columns ${A.length}|${B.length}`, boxes, height: Math.max(colHeight(A, wa), colHeight(B, wb)) });
  }
  const tall = units.reduce((m, u) => (u.a < m.a ? u : m), units[0]);
  if (units.length >= 3 && tall.a < 0.8) {
    const others = units.filter((u) => u !== tall);
    for (const parts of compositions(others.length)) {
      if (parts.length > 3) continue;
      const restOf = (w) => { const rows = rowsOf(others, parts, w, ctx); return { rows, h: rowsHeight(rows) }; };
      let lo = 5, hi = W - GAP - 10;
      for (let k = 0; k < 16; k++) {
        const m = (lo + hi) / 2;
        if (unitHeight(tall, m, ctx) > restOf(W - GAP - m).h) hi = m;
        else lo = m;
      }
      let wa = lo, wb = W - GAP - lo, s = 1;
      for (let k = 0; k < 40 && Math.max(unitHeight(tall, wa * s, ctx), restOf(wb * s).h) > H; k++) s *= 0.96;
      wa *= s;
      wb *= s;
      const { rows, h: hB } = restOf(wb);
      if (!rowsFit(rows, wb)) continue;
      const hA = unitHeight(tall, wa, ctx);
      for (const left of [true, false]) {
        const x0 = cx - (wa + wb + GAP) / 2;
        const xa = left ? x0 : x0 + wb + GAP, xb = left ? x0 + wa + GAP : x0;
        const boxes = { [tall.id]: { x: xa + wa / 2, top: region.top, w: wa } };
        place(rows, xb, wb, region.top + Math.max(0, (hA - hB) / 2), boxes);
        out.push({ kind: `tall column + rows ${parts.join("+")}${left ? "" : " (right)"}`, boxes, height: Math.max(hA, hB) });
      }
    }
  }
  return out;
}
function arrangedPages(input, style) {
  const look = STYLE_LOOK[style];
  const typeSize = typeScale(input.type);
  const title = String(input.title || "").trim();
  const titleFont = wordsFont(title, look, input.type);
  const ctx = { frame: look.frame, capSize: Math.max(10, CAPTION_SIZE[style] * typeSize), capWeight: wordsWeight(input.type, false) };
  const units = (input.visuals || []).map((v) => {
    const cap = String(v.caption || "").trim();
    return { id: v.id, a: safeAspect(v.aspect), cap, font: cap ? wordsFont(cap, look, input.type) : null };
  });
  const line = lineFor(title, style === "editorial" ? (textUnits(title) <= 14 ? 24 : 21) : 22, 86, typeSize, titleFont, wordsWeight(input.type, true));
  const audioBand = (input.audio || []).length ? 9 : 0;
  const titleOnTop = style === "playful" && title;
  const region = { top: titleOnTop ? 6 + line.height + 3 : style === "cozy" ? 10 : 8, bottom: (titleOnTop || !title ? 94 : 94 - line.height - 4) - audioBand, left: 7, right: 93 };
  const out = [];
  for (const a of arrangements(units, region, ctx)) {
    const place = {}, layers = [];
    const shift = Math.max(0, (region.bottom - region.top - a.height) * 0.42);
    units.forEach((u, i) => {
      const b = a.boxes[u.id];
      const ph = frameHeight(u.a, b.w, ctx.frame);
      const top = b.top + shift;
      place[u.id] = { x: round(b.x), y: round(top + ph / 2), w: round(b.w), h: round(ph), rotation: style === "editorial" ? 0 : tilt(style, i, 0) / 2, frame: ctx.frame, tape: style !== "editorial" && i % 3 === 0 };
      if (u.cap) {
        const h = measuredBlock(u.cap, ctx.capSize, b.w, u.font, ctx.capWeight).height;
        layers.push(textLayer(look, { bind: "caption", captionOf: u.id, text: u.cap, x: round(b.x), y: round(top + ph + CAP_GAP + h / 2), w: round(b.w), fontId: u.font, weight: ctx.capWeight, fontSize: ctx.capSize, align: "center", color: style === "editorial" ? look.muted : look.ink }));
      }
    });
    if (input.time)
      layers.push(
        style === "editorial"
          ? textLayer(look, { bind: "time", prefix: "kicker", text: input.time, fontId: look.meta, fontSize: 8.5, spacing: 2.4, color: look.accent, weight: 700, x: 42, y: 4.6, w: 70 })
          : textLayer(look, { bind: "time", text: input.time, fontId: look.meta, fontSize: style === "cozy" ? 14 : 9, color: look.muted, x: 80, y: 5, w: 30, align: "right" }),
      );
    if (input.folio && style === "editorial") layers.push(textLayer(look, { text: input.folio, x: 70, y: 97.6, w: 50, fontId: look.meta, fontSize: 6.5, spacing: 2, color: look.muted, align: "right" }));
    if (title) {
      const ends = Math.max(...Object.values(place).map((b) => b.y + b.h / 2), ...layers.filter((l) => l.bind === "caption").map((l) => l.y + measuredBlock(l.text, l.fontSize, l.w, l.fontId, l.weight).height / 2));
      const y = titleOnTop ? 6 + line.height / 2 : ends + 3 + line.height / 2;
      layers.push(textLayer(look, { bind: "title", text: title, fontId: titleFont, x: 50, y: round(y), w: 86, fontSize: line.size, weight: line.body ? 400 : 500, align: line.body && style === "editorial" ? "left" : "center" }));
    }
    (input.audio || []).forEach((clip, i) => {
      place[clip.id] = { x: 50, y: 95 - audioBand / 2 - i * 0.5, w: 70, rotation: 0 };
    });
    out.push({ place, layers, paper: look.paper, backdrop: style === "playful" ? PLAYFUL_BACKDROPS[0] : null, arrangement: a.kind });
  }
  return out;
}
const signatureOf = (r, ids) => ids.map((id) => { const b = r.place[id]; return b ? `${Math.round(b.x / 4)},${Math.round(b.y / 4)},${Math.round(b.w / 4)}` : "-"; }).join("|");
// The page's options: the style's own layouts that pass, then (when fewer
// than three) other arrangements that pass, best first; no two alike.
// `variant` picks among them, so 换个排版 never shows the same page twice.
function layoutChecked(input, style, variant) {
  const ids = (input.visuals || []).map((v) => v.id);
  const opts = checkOptions(input, style);
  const options = [];
  const seen = new Set();
  const add = (result, q, from) => {
    const sig = signatureOf(result, ids);
    if (seen.has(sig)) return;
    seen.add(sig);
    options.push({ result, q, from });
  };
  const tried = [];
  for (const v of [0, 1, 2]) {
    const result = layoutMomentBase(input, style, v);
    const q = checkQuality(result, ids, opts);
    tried.push({ result, q, from: `style ${v}` });
    if (q.ok) add(result, q, `style ${v}`);
  }
  if (options.length < 3 && ids.length) {
    const others = arrangedPages(input, style).map((result) => {
      applyType(result.layers, input.type);
      return { result, q: checkQuality(result, ids, opts) };
    });
    tried.push(...others.map((o) => ({ ...o, from: o.result.arrangement })));
    for (const o of others.filter((x) => x.q.ok).sort((a, b) => b.q.score - a.q.score)) {
      if (options.length >= 3) break;
      add(o.result, o.q, o.result.arrangement);
    }
  }
  const v = ((Number(variant) % 3) + 3) % 3;
  if (options.length) {
    const pick = options[v % options.length];
    return { ...pick.result, quality: { ok: true, options: options.length, from: pick.from, hard: [], soft: pick.q.soft.map((x) => x.kind) } };
  }
  // Nothing passes: the least troubled page (words clear of photos first).
  const wordsTrouble = (q) => q.hard.filter((x) => x.kind.startsWith("words")).length;
  const best = tried.sort((a, b) => wordsTrouble(a.q) - wordsTrouble(b.q) || a.q.hard.length - b.q.hard.length || b.q.score - a.q.score)[0];
  return { ...best.result, quality: { ok: false, options: 0, from: best.from, hard: best.q.hard.map((x) => x.kind), soft: best.q.soft.map((x) => x.kind) } };
}

// ---------- V10.34 (L3) · When one page is too much ----------
// Only when no arrangement of these photos and words passes on one page:
// the photos shared over 2–4 pages, in their order, each page passing on its
// own. The page's line stays on the first page; each photo keeps its own
// words; sounds stay with the first page. Nothing is done here — the person
// sees the pages and decides. null when even that does not help.
export function suggestSplit(input, styleId = "editorial") {
  const visuals = input.visuals || [];
  for (const k of [2, 3, 4]) {
    if (visuals.length < k) break;
    const size = Math.ceil(visuals.length / k);
    const parts = [];
    for (let i = 0; i < visuals.length; i += size) parts.push(visuals.slice(i, i + size));
    if (parts.length < 2) continue;
    const ok = parts.every((part, i) => layoutMoment({ ...input, visuals: part, title: i === 0 ? input.title : "", audio: i === 0 ? input.audio : [] }, styleId, 0).quality.ok);
    if (ok) return parts.map((part) => part.map((v) => v.id));
  }
  return null;
}

// ---------- A3 · Long words: continue on the next page ----------
// The text in pieces that end a sentence (。！？!?；;… a line break, or a
// full stop before a space). Every character is kept: the pieces joined
// give the text back exactly.
export function sentencePieces(text) {
  const chars = [...String(text || "")];
  const out = [];
  let cur = "";
  for (let i = 0; i < chars.length; i++) {
    cur += chars[i];
    const c = chars[i],
      next = chars[i + 1];
    const end = /[。！？!?；;…\n]/.test(c) || (c === "." && (next === undefined || /\s/.test(next)));
    if (!end || (next && /[”’」』）)"'。！？!?…]/.test(next))) continue;
    while (chars[i + 1] && /[ \t\u3000]/.test(chars[i + 1])) cur += chars[++i];
    out.push(cur);
    cur = "";
  }
  if (cur) out.push(cur);
  return out;
}
// When the page's words do not fit on one page (also after sharing the
// photos out): the photos as before, the words continued on the pages after
// them, cut between sentences (inside one only when a single sentence is
// longer than a page). Each page must pass the quality rules on its own.
// Returns { parts: [[ids]…], texts: [text…] } (texts.join("") === title),
// or null. Nothing is done here — the person sees the pages and decides.
export function suggestTextSplit(input, styleId = "editorial", maxPages = 8) {
  const text = String(input.title || "");
  if (!text.trim()) return null;
  const visuals = input.visuals || [];
  const run = (vis, words, first) => layoutMoment({ ...input, visuals: vis, title: words, audio: first ? input.audio : [] }, styleId, 0);
  const area = (r, vis) => vis.reduce((sum, v) => sum + (r.place[v.id] ? r.place[v.id].w * r.place[v.id].h : 0), 0);
  // A page with photos keeps them as the subject: its words may take room
  // from them only while they keep at least ~60% of the size they have alone.
  const alone = new Map();
  const fits = (vis, words, first) => {
    const r = run(vis, words, first);
    if (!r.quality.ok) return false;
    // The words end clear of the folio at the foot of the page.
    const line = r.layers.find((l) => l.bind === "title" && String(l.text || "").trim());
    if (line && line.y + measuredBlock(line.text, line.fontSize, line.w, line.fontId, line.weight).height / 2 > 93) return false;
    if (!vis.length || !String(words).trim()) return true;
    const key = vis.map((v) => v.id).join("|");
    if (!alone.has(key)) alone.set(key, area(run(vis, "", first), vis));
    return area(r, vis) >= 0.6 * alone.get(key);
  };
  let photoParts = [visuals];
  if (visuals.length && !fits(visuals, "", true)) {
    const shared = suggestSplit({ ...input, title: "" }, styleId);
    if (!shared) return null;
    photoParts = shared.map((ids) => visuals.filter((v) => ids.includes(v.id)));
  }
  const pieces = sentencePieces(text);
  const parts = [],
    texts = [];
  let k = 0;
  for (let page = 0; page < maxPages; page++) {
    const vis = photoParts[page] || [];
    let cur = "";
    while (k < pieces.length) {
      if (fits(vis, cur + pieces[k], page === 0)) {
        cur += pieces[k];
        k++;
        continue;
      }
      if (!cur) {
        // One sentence longer than the room left: cut it where the page is
        // full, after a comma or a space when there is one near. Beside
        // photos only when a fair part of it fits; a page of words always.
        const chars = [...pieces[k]];
        let lo = 0,
          hi = chars.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          if (fits(vis, chars.slice(0, mid).join(""), page === 0)) lo = mid;
          else hi = mid - 1;
        }
        for (let j = lo; j > lo * 0.7; j--)
          if (/[，、,：:\s]/.test(chars[j - 1] || "")) {
            lo = j;
            break;
          }
        if (!vis.length && !lo) return null;
        if (!vis.length || lo >= 20) {
          cur = chars.slice(0, lo).join("");
          pieces[k] = chars.slice(lo).join("");
        }
      }
      break;
    }
    parts.push(vis.map((v) => v.id));
    texts.push(cur);
    if (k >= pieces.length && page >= photoParts.length - 1) break;
  }
  if (k < pieces.length || parts.length < 2) return null;
  // A last page of words with only a line or two: share the last two pages
  // of words more evenly (between sentences), when both still fit.
  const n = texts.length;
  if (n >= 2 && !parts[n - 1].length && !parts[n - 2].length && [...texts[n - 1]].length < 0.35 * [...texts[n - 2]].length) {
    const both = sentencePieces(texts[n - 2] + texts[n - 1]);
    const total = [...(texts[n - 2] + texts[n - 1])].length;
    let best = null;
    for (let i = 1, acc = ""; i < both.length; i++) {
      acc += both[i - 1];
      const rest = both.slice(i).join("");
      const score = Math.abs([...acc].length - total / 2);
      if ((!best || score < best.score) && fits([], acc, false) && fits([], rest, false)) best = { score, a: acc, b: rest };
    }
    if (best) [texts[n - 2], texts[n - 1]] = [best.a, best.b];
  }
  if (texts.join("") !== text) return null;
  return { parts, texts };
}
