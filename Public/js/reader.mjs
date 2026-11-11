// The full-screen Book Reader (V10.11): pure helpers.
//
// A book is read as a sequence of positions: the cover (position 0), then
// every page in date order (js/book-share.mjs → bookSharePages). Positions
// are found by a page's identity — "date|momentId" ("date|" for a day's own
// cover page) — never by a stored number, so adding or removing pages never
// lands the reader on the wrong page.
//
// Reading progress is a preference of this device (localStorage
// "little-days.reader-pos"), not journal data: it is not in the journal
// store, not in backups, not in the Swift model.

export const READER_POS_KEY = "little-days.reader-pos";
export const COVER = "cover";

export const keyOf = (item) => (item ? `${item.date}|${item.moment?.id || ""}` : COVER);

// Where a key is in this book now: 0 = the cover. A page that is gone (deleted
// or moved to another book) → the nearest page of the same day, then the
// nearest earlier page, else the cover.
export function positionOf(pages, key) {
  if (!key || key === COVER) return 0;
  const exact = pages.findIndex((item) => keyOf(item) === key);
  if (exact >= 0) return exact + 1;
  const date = String(key).split("|")[0];
  const sameDay = pages.findIndex((item) => item.date === date);
  if (sameDay >= 0) return sameDay + 1;
  let before = -1;
  pages.forEach((item, i) => {
    if (item.date < date) before = i;
  });
  return before >= 0 ? before + 1 : 0;
}

// The page count people see: the cover is not a page. "封面 · 共 8 页",
// "第 1 / 8 页" … "第 8 / 8 页" (9 reading positions).
export function positionLabel(at, count, t) {
  return at <= 0 ? t("reader.coverPos", { count }) : t("reader.pagePos", { n: at, count });
}

// The first page of a day in this book (for the page list).
export function firstPageOf(pages, date) {
  const at = pages.findIndex((item) => item.date === date);
  return at >= 0 ? at + 1 : 0;
}

export function loadPositions(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(READER_POS_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}
export function savePosition(bookId, key, storage = globalThis.localStorage) {
  if (!bookId) return;
  try {
    const all = loadPositions(storage);
    all[bookId] = { key: String(key || COVER), at: new Date().toISOString() };
    storage?.setItem(READER_POS_KEY, JSON.stringify(all));
  } catch {}
}
export function savedPosition(bookId, storage = globalThis.localStorage) {
  const value = loadPositions(storage)[bookId];
  return typeof value?.key === "string" ? value.key : null;
}
