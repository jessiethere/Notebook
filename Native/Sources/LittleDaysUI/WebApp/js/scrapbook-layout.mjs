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
// A caption size that keeps long words readable inside `maxLines`.
export function fitText(text, base, width, maxLines = 4, min = 11) {
  let size = base;
  while (size > min && textBlock(text, size, width).lines > maxLines) size -= 1;
  return { size, ...textBlock(text, size, width) };
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
  const tops = boxes.map((b) => b.y - b.h / 2).concat(texts.map((l) => l.y - textBlock(l.text, l.fontSize, l.w).height / 2));
  const ends = boxes.map((b) => b.y + b.h / 2).concat(texts.map((l) => l.y + textBlock(l.text, l.fontSize, l.w).height / 2));
  if (!tops.length) return;
  const minY = Math.min(...tops),
    maxY = Math.max(...ends);
  const shift = Math.max(0, ((bottom - top) - (maxY - minY)) * 0.42 - (minY - top));
  if (shift < 1.5) return;
  for (const b of boxes) b.y = round(b.y + shift);
  for (const l of texts) l.y = round(l.y + shift);
}

// ---------- One Moment's page ----------
// input: { visuals: [{ id, aspect }], title, time, audio: [{ id }] }
// Returns { place: { [id]: { x, y, w, h, rotation, frame, tape } },
//           layers: [generated text layers], paper, backdrop }.
export function layoutMoment(input, styleId = "editorial", variant = 0) {
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
  const meta = (values) => layers.push(textLayer(look, { bind: "time", text: input.time || "", fontId: look.meta, fontSize: style === "cozy" ? 14 : 9, spacing: style === "editorial" ? 2 : 0, color: look.muted, weight: style === "editorial" ? 600 : 400, ...values }));
  const caption = (values) => {
    layers.push(textLayer(look, { bind: "title", text: title, fontId: pickFont(title, look), ...values }));
  };
  const audioBand = (input.audio || []).length ? 9 : 0;

  if (style === "editorial") {
    const textW = n === 1 && v !== 0 ? 50 : 86;
    const fit = title ? fitText(title, 19, textW, 4) : { size: 19, lines: 0, height: 0 };
    const textH = title ? fit.height + 4 : 0;
    const bottom = 96 - textH - audioBand;
    if (input.time) meta({ x: v === 1 ? 70 : 30, y: 4.6, w: 40, align: v === 1 ? "right" : "left" });
    if (n === 1) {
      const a = safeAspect(visuals[0].aspect);
      if (a < 0.9 && title && v !== 0) {
        // A portrait photo beside its words, like a magazine column.
        const box = fitPhoto(a, 56, 84 - audioBand, frame);
        const left = v === 1;
        put(visuals[0], { ...box, x: left ? 7 + box.w / 2 : 93 - box.w / 2, y: 8 + box.h / 2 }, 0);
        const colW = 86 - box.w - 5;
        const f = fitText(title, 20, colW, 8);
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
            const f = fitText(title, 18, colW, 6);
            caption({ x: 7 + colW / 2, y: region.top + f.height / 2 + 1, w: colW, fontSize: f.size });
          }
          top = -1;
        } else rowsIn(rest, region, frame).forEach((box2, i) => box2 && put(rest[i], box2, i + 1));
      } else rowsIn(visuals, { top: 8, bottom, left: 7, right: 93 }, frame).forEach((box2, i) => box2 && put(visuals[i], box2, i));
      if (title && top !== -1) caption({ x: 50, y: bottom + 2 + fit.height / 2, w: 86, fontSize: fit.size });
    }
  } else if (style === "cozy") {
    const fit = title ? fitText(title, 22, 76, 3, 13) : { size: 22, lines: 0, height: 0 };
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
    const fit = title ? fitText(title, 22, 80, 3, 13) : { size: 22, lines: 0, height: 0 };
    const headH = title ? fit.height + 6 : 4;
    const top = 6 + headH;
    const bottom = 95 - audioBand;
    if (title) caption({ x: v === 1 ? 54 : 46, y: 6 + fit.height / 2, w: 80, fontSize: fit.size, weight: 600, align: v === 1 ? "right" : "left", rotation: v === 1 ? 2 : -2 });
    if (input.time) meta({ x: v === 1 ? 16 : 84, y: title ? 6 + fit.height + 2 : 5, w: 24, align: v === 1 ? "left" : "right" });
    const boxes = n > 7 ? scatter(visuals, { top, bottom, side: 6 }, frame, v) : collage(visuals, { top, bottom, side: 6 }, frame, v);
    boxes.forEach((box, i) => put(visuals[i], box, i, { tape: i === 0 || i === 3 }));
  }
  if (style !== "playful") centreVertically(place, layers, style === "cozy" ? 10 : 8, 95 - audioBand);
  (input.audio || []).forEach((clip, i) => {
    place[clip.id] = { x: 50, y: 95 - audioBand / 2 - i * 0.5, w: 70, rotation: 0 };
  });
  return { place, layers, paper: look.paper, backdrop: style === "playful" ? PLAYFUL_BACKDROPS[v] : null };
}

// ---------- The day spread (cover) ----------
// moments: [{ id, time, title, photo: { reference, name, aspect } }] (the
// Moment's best photo). The photos are copies (gen) of those references.
// Returns { layers, paper, backdrop }.
export function layoutDay(moments, styleId = "editorial", variant = 0, { dateSmall = "", dateBig = "", more = (n) => `+${n}`, makeId } = {}) {
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
    layers.push(textLayer(look, { id: id(), text: [dateSmall, dateBig].filter(Boolean).join(" · ").toUpperCase(), x: 50, y: 4.4, w: 86, fontId: look.meta, fontSize: 9, spacing: 2, color: look.muted, weight: 600 }));
    const heroM = shown[hero];
    const heroTitle = (heroM.title || "").trim();
    const hf = heroTitle ? fitText(heroTitle, 17, 86, 2, 12) : { height: 0, size: 17 };
    const rest = shown.filter((_, i) => i !== hero);
    const box = fitPhoto(heroM.photo.aspect, 86, rest.length ? 46 : 70, frame);
    const heroBox = { ...box, x: v === 1 ? 7 + box.w / 2 : 93 - box.w / 2, y: 8 + box.h / 2 };
    photo(heroM, heroBox, 0);
    let y = 8 + box.h + 2.5;
    bound(heroM, "time", { x: 30, y: y + 0.6, w: 46, fontId: look.meta, fontSize: 8, spacing: 1.5, color: look.muted, weight: 600 });
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
export function boundText(layer, page) {
  if (!layer?.bind) return layer?.text ?? "";
  const source = layer.of ? (page?.moments || []).find((m) => m.id === layer.of) : page;
  if (!source) return layer.text || "";
  let text = String((layer.bind === "time" ? source.time : source.title) || "").trim();
  if (layer.prefix === "time" && source.time && text) text = `${source.time} ${text}`;
  if (layer.bind === "title" && !text && layer.prefix === "time") text = source.time || "";
  if (layer.excerpt && text.length > layer.excerpt) text = `${text.slice(0, layer.excerpt - 1)}…`;
  return text;
}
