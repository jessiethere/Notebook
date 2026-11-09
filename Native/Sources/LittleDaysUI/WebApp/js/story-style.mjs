// Quick Create v3 · layout engine v2 — a "kit" keeps a whole day in one style
// (paper, fonts, ink, accent, a few matching stickers), the first look of a
// page follows simple rules, and decorations only go where the page is empty.
// Pure functions, no DOM; kits live in library.json ("kits").

export const DECO_SCALE = 0.7;
const STICKER_W = 17; // % of page width at scale 1 (styles.css .art-layer)
const PAGE_RATIO = 1080 / 1350;

export function kitList(catalog) {
  return Array.isArray(catalog?.kits) ? catalog.kits : [];
}
export function findKit(catalog, id) {
  const kits = kitList(catalog);
  return kits.find((kit) => kit.id === id) || kits[0] || null;
}
// A book's own color picks the default kit, so a day matches its book.
export function kitForBook(catalog, book) {
  const byColor = { blush: "blush", sage: "sage", butter: "kraft" };
  return findKit(catalog, byColor[book?.color] || "cream");
}
export function kitName(kit, language = "zh") {
  return kit ? (language === "en" ? kit.nameEn : kit.nameZh) : "";
}

// Paper, the words' font and ink of a page (its photos stay where they are).
export function applyKit(page, kit) {
  if (!page || !kit) return page;
  page.kit = kit.id;
  page.template = kit.paper;
  page.font = kit.lineFont;
  page.textStyle = { ...(page.textStyle || {}), color: kit.ink };
  return page;
}

// The first look of a page (index into the smart looks clean / scrapbook /
// hero): one photo is shown big; a few photos get the kit's mood.
export function firstLook(photoCount, kit) {
  if (photoCount <= 1) return 2;
  if (photoCount <= 5) return kit?.playful ? 1 : 0;
  return 0;
}

// The box a layer takes on the page, in % (x/y centre; w of width, h of height).
export function layerBox(layer) {
  if (layer.kind === "photo" || layer.kind === "video") return { x: layer.x, y: layer.y, w: layer.w ?? 42, h: layer.h ?? 34 };
  if (layer.kind === "text") return { x: layer.x, y: layer.y, w: layer.w ?? 60, h: Math.max(4, (layer.fontSize || 14) * 0.45) };
  const w = STICKER_W * (layer.scale || 1);
  return { x: layer.x, y: layer.y, w, h: w * PAGE_RATIO };
}
const overlaps = (a, b, margin = 1) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w + margin * 2 && Math.abs(a.y - b.y) * 2 < a.h + b.h + margin * 2;

const SPOTS = [
  [10, 7],
  [90, 7],
  [10, 93],
  [90, 93],
  [50, 4],
  [91, 50],
  [9, 50],
];

// Up to `max` of the kit's stickers, only in empty corners: never over a
// photo, a word or the caption strip. Earlier decorations are replaced.
// Returns how many were placed.
export function decorate(page, kit, { seed = 0, max = 2, caption = false, makeId } = {}) {
  if (!page || !kit) return 0;
  page.layers = (page.layers || []).filter((layer) => !layer.deco);
  const taken = page.layers.map(layerBox);
  if (caption) taken.push({ x: 50, y: 90, w: 86, h: 14 });
  const id = makeId || (() => Math.random().toString(36).slice(2, 10));
  const w = STICKER_W * DECO_SCALE,
    h = w * PAGE_RATIO;
  const order = SPOTS.map((_, i) => SPOTS[(i + seed) % SPOTS.length]);
  let placed = 0;
  for (const [x, y] of order) {
    if (placed >= max) break;
    const box = { x, y, w, h };
    if (x - w / 2 < 0 || x + w / 2 > 100 || y - h / 2 < 0 || y + h / 2 > 100) continue;
    if (taken.some((other) => overlaps(box, other))) continue;
    const sticker = kit.stickers[(seed + placed) % kit.stickers.length];
    const layer = { id: id(), kind: "sticker", assetId: sticker, text: sticker, x, y, scale: DECO_SCALE, rotation: (seed + placed) % 2 ? 10 : -12, deco: true };
    page.layers.push(layer);
    taken.push(box);
    placed++;
  }
  return placed;
}

// Caption size for a page's one line: long lines get smaller and may use two
// lines instead of being cut off. Returns a size factor and the line count.
export function captionFit(text) {
  const units = [...String(text || "")].reduce((n, ch) => n + (/[　-鿿＀-￯]/.test(ch) ? 1 : 0.55), 0);
  if (units <= 16) return { factor: 1, lines: 1 };
  if (units <= 24) return { factor: 0.86, lines: 1 };
  return { factor: 0.8, lines: 2 };
}
