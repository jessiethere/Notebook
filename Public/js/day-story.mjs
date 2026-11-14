// Quick Create v3 — today's story: photos picked at once are split into
// Moments by when they were taken; each Moment becomes a page, and a day with
// several Moments gets a "timeline" cover (time, one photo and the line of
// each Moment). Pure functions: the cover is plain photo and text layers, so
// it reads, exports and edits like any other page.
import { photoLayer } from "./day.mjs";
import { safeAspect } from "./smart-layout.mjs";

export const STORY_GAP_MINUTES = 90;
export const TIMELINE_ROWS = 5;
const PAGE_RATIO = 1080 / 1350;

// "08:10" for a time in ms (local clock), "" when unknown.
export function clockLabel(ms) {
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
// morning / afternoon / evening / night, for the Moment's label.
export function partOfDay(ms) {
  if (!Number.isFinite(ms)) return "";
  const h = new Date(ms).getHours();
  return h < 5 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : h < 22 ? "evening" : "night";
}

// A Moment's time: the earliest photo time that can be trusted. Photos that
// say where their time came from (V10.58 `timeSource`) count only with a
// real capture time (a file's date or an editor's export time is not "when").
const RELIABLE = ["exif-original", "exif-digitized"];
const trusted = (item) => Number.isFinite(item.time) && (item.timeSource === undefined || RELIABLE.includes(item.timeSource));
const startOf = (items) => {
  const times = items.filter(trusted).map((item) => item.time);
  return times.length ? Math.min(...times) : null;
};
// A3: a page of only words (the rest of a long text) stays while it has words.
const tidy = (groups) => groups.filter((g) => g.items.length || (g.wordsOnly && String(g.line || "").trim())).map((g) => ({ ...g, start: startOf(g.items) }));

// Photos ([{ time: ms|null, ... }]) in shooting order, split wherever more
// than `gap` minutes pass. A photo without a time keeps its place after the
// photo picked before it. Returns [{ start, items, line }].
export function groupByTime(items, gap = STORY_GAP_MINUTES) {
  let last = null;
  const timed = items.map((item, index) => {
    if (Number.isFinite(item.time)) last = item.time;
    return { item, index, at: Number.isFinite(item.time) ? item.time : last };
  });
  timed.sort((a, b) => (a.at ?? -Infinity) - (b.at ?? -Infinity) || a.index - b.index);
  const groups = [];
  let previous = null;
  for (const { item, at } of timed) {
    if (!groups.length || (Number.isFinite(at) && Number.isFinite(previous) && at - previous > gap * 60000)) groups.push({ items: [], line: "" });
    groups.at(-1).items.push(item);
    if (Number.isFinite(at)) previous = at;
  }
  return tidy(groups);
}

// V10.58 · Picking order first, capture time as a hint, the person decides.
// Photos keep the order they were picked in (never re-sorted by time). Only
// when every photo has a real capture time (EXIF original / digitized) are
// pages suggested where more than `gap` minutes pass between neighbours;
// otherwise (file dates, no EXIF, or a mix) everything starts on one page,
// to split by hand. Returns { groups, mode: "time" | "single", reason }.
export function suggestGroups(items, gap = STORY_GAP_MINUTES) {
  const list = [...items];
  if (!list.length) return { groups: [], mode: "single", reason: "none" };
  const reliable = list.every((item) => RELIABLE.includes(item.timeSource) && Number.isFinite(item.time));
  if (!reliable || list.length < 2) {
    const some = list.some((item) => RELIABLE.includes(item.timeSource));
    return { groups: tidy([{ items: list, line: "" }]), mode: "single", reason: list.length < 2 ? "one" : some ? "mixed" : "unreliable" };
  }
  const groups = [{ items: [list[0]], line: "" }];
  for (let i = 1; i < list.length; i++) {
    if (Math.abs(list[i].time - list[i - 1].time) > gap * 60000) groups.push({ items: [], line: "" });
    groups.at(-1).items.push(list[i]);
  }
  return { groups: tidy(groups), mode: "time", reason: "reliable" };
}
// Everything on one page, in the order given (words kept).
export function oneGroup(items, line = "") {
  return tidy([{ items: [...items], line }]);
}
// Drag and drop: the photo at from {g, i} goes to to {g, i} (to.g may be
// groups.length for a new page at the end). Nothing is copied or lost.
export function movePhotoTo(groups, from, to) {
  const next = groups.map((group) => ({ ...group, items: [...group.items] }));
  const [item] = next[from.g]?.items.splice(from.i, 1) || [];
  if (!item) return groups;
  if (to.g >= next.length) next.push({ items: [], line: "" });
  const target = next[to.g];
  // In the same page, a place after the photo's old one moves up by one.
  const wanted = to.g === from.g && to.i > from.i ? to.i - 1 : to.i;
  const at = Math.max(0, Math.min(wanted, target.items.length));
  target.items.splice(at, 0, item);
  return tidy(next);
}
// Page g joins the page before it (its photos after that page's photos; the
// earlier page's words stay, or this page's when the earlier had none).
export function mergeWithPrevious(groups, g) {
  if (g <= 0 || g >= groups.length) return groups;
  const next = groups.map((group) => ({ ...group, items: [...group.items] }));
  const [gone] = next.splice(g, 1);
  next[g - 1].items.push(...gone.items);
  if (!String(next[g - 1].line || "").trim()) next[g - 1].line = gone.line || "";
  return tidy(next);
}

// Move one photo to the Moment before (dir -1) or after (+1); at either end
// it starts a new Moment of its own.
export function movePhoto(groups, g, i, dir) {
  const next = groups.map((group) => ({ ...group, items: [...group.items] }));
  const [item] = next[g]?.items.splice(i, 1) || [];
  if (!item) return groups;
  const to = g + (dir < 0 ? -1 : 1);
  if (to < 0) next.unshift({ items: [item], line: "" });
  else if (to >= next.length) next.push({ items: [item], line: "" });
  else if (dir < 0) next[to].items.push(item);
  else next[to].items.unshift(item);
  return tidy(next);
}
// This photo and the ones after it become a Moment of their own.
export function splitAt(groups, g, i) {
  if (!groups[g] || i <= 0 || i >= groups[g].items.length) return groups;
  const next = groups.map((group) => ({ ...group, items: [...group.items] }));
  const rest = next[g].items.splice(i);
  next.splice(g + 1, 0, { items: rest, line: "" });
  return tidy(next);
}
export function removePhoto(groups, g, i) {
  const next = groups.map((group) => ({ ...group, items: [...group.items] }));
  next[g]?.items.splice(i, 1);
  return tidy(next);
}

const textLayer = (makeId, text, values) => ({
  id: makeId(),
  kind: "text",
  text: String(text).slice(0, 500),
  scale: 1,
  rotation: 0,
  fontId: "serif",
  fontSize: 14,
  color: "#2F2A26",
  weight: 400,
  spacing: 0,
  align: "left",
  ...values,
});
const short = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

// The layers of a timeline cover. moments: [{ time, title, photo: {
// reference, name, aspect }, count }]; variant 0/1 start on the left/right,
// 2 is a calm, straight version. Labels come from the caller (language).
export function timelineLayers(moments, { dateSmall = "", dateBig = "", more = (n) => `+${n}`, photos = (n) => `${n}`, variant = 0, makeId, kit = null } = {}) {
  const ink = kit?.ink || "#2F2A26",
    accent = kit?.accent || "#5F6F52";
  const layers = [];
  const id = makeId || (() => Math.random().toString(36).slice(2, 10));
  layers.push(textLayer(id, dateSmall, { x: 28, y: 5.5, w: 44, fontSize: 10, spacing: 2, color: "#6F675D", weight: 500 }));
  layers.push(textLayer(id, dateBig, { x: 28, y: 13, w: 44, fontSize: 32, fontId: kit?.titleFont || "elegant", color: ink, weight: 500 }));
  const hidden = Math.max(0, moments.length - TIMELINE_ROWS);
  const rows = hidden ? moments.slice(0, TIMELINE_ROWS - 1) : moments.slice(0, TIMELINE_ROWS);
  const count = rows.length + (hidden ? 1 : 0);
  const top = 22,
    bottom = 96,
    rowH = (bottom - top) / Math.max(1, count);
  const tilt = [-2.5, 2, -1.5, 2.5, -2];
  rows.forEach((moment, index) => {
    const left = variant === 1 ? index % 2 === 1 : variant === 2 ? true : index % 2 === 0;
    const cy = top + rowH * (index + 0.5);
    const a = safeAspect(moment.photo?.aspect);
    const w = Math.min(46, (rowH * 0.82 * a) / PAGE_RATIO);
    const h = (w * PAGE_RATIO) / a;
    if (moment.photo?.reference) {
      layers.push(photoLayer(moment.photo.reference, moment.photo.name, {
        x: Math.round((left ? 6 + w / 2 : 94 - w / 2) * 100) / 100,
        y: Math.round(cy * 100) / 100,
        w: Math.round(w * 100) / 100,
        h: Math.round(h * 100) / 100,
        aspect: a,
        frame: "border",
        tape: index === 0,
        rotation: variant === 2 ? 0 : tilt[index % tilt.length],
      }));
    }
    const textLeft = moment.photo?.reference ? (left ? 6 + w + 4 : 6) : 6;
    const textRight = moment.photo?.reference ? (left ? 94 : 94 - w - 4) : 94;
    const tw = Math.max(20, textRight - textLeft);
    const tx = textLeft + tw / 2;
    const align = left ? "left" : "right";
    const small = count >= 4;
    layers.push(textLayer(id, moment.time || "·", { x: tx, y: cy - Math.min(4, rowH * 0.16), w: tw, fontSize: 11, color: accent, weight: 700, align }));
    const line = (moment.title || "").trim();
    const text = line ? short(line, small ? 28 : 40) : photos(moment.count || 0);
    // Longer lines get a little smaller so they stay inside their row.
    const size = (small ? 12 : 14) - (text.length > 16 ? 1.5 : 0);
    layers.push(textLayer(id, text, { x: tx, y: cy + Math.min(3.5, rowH * 0.14), w: tw, fontSize: size, fontId: kit?.lineFont || "serif", color: line ? ink : "#6F675D", align }));
  });
  if (hidden) layers.push(textLayer(id, more(hidden + 1), { x: 50, y: bottom - rowH / 2, w: 80, fontSize: 13, color: "#6F675D", align: "center" }));
  return layers;
}
