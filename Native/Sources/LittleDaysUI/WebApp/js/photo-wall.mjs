// V10.55 · 照片墙 (Phase 1): every photo the person kept in their journal,
// as one wall — no calendar grid. Pure logic here (which photos, in which
// order, which column), the view and the viewer are in app.js.
//
// Which photos: the person's own pictures on saved pages — photo layers
// (Journal Studio, 今天的故事 and every other way of making a page), an older
// day photo, and a page background made from their own photo. Only their own
// files count (`media:` in the media store, or an older inline `data:` image):
// library photos, scenes, cover templates, stickers and hand drawings are not
// "a photo of my life". Sample days (isDemo) and unsaved drafts are left out.
//
// Nothing is copied: each item points at the same media reference the page
// uses, plus where it lives (date, book, page, layer), so the wall follows the
// journal — a new page adds its photos, a deleted page takes them away.
//
// Phase 2 (not built): a collage wall (polaroids, tilt, overlap, stickers,
// tickets, free placement) would keep its own layout per item id, next to
// these references — never inside the pages.
import { dayPageShown } from "./pages.mjs";

export const OWN_PHOTO = /^(media:[A-Za-z0-9-]+|data:image\/(jpeg|png|webp);base64,)/;

// [{ id, ref, date, bookId, momentId, layerId }], newest day first; within a
// day, newest page first (a day cover's copies count once, for the Moment page).
export function wallPhotos(state, { bookId = null } = {}) {
  const seen = new Map();
  const entries = (state.entries || []).filter((entry) => entry && entry.isDemo !== true && entry.date);
  entries.sort((a, b) => b.date.localeCompare(a.date));
  for (const entry of entries) {
    // Newest page of the day first (Moments are kept oldest first).
    const pages = [...(entry.moments || [])].reverse().map((moment) => ({ page: moment, momentId: moment.id, book: moment.bookId || entry.bookId || "" }));
    // The day's own page after its Moments: a day cover repeats their photos.
    if (dayPageShown(entry)) pages.push({ page: entry, momentId: "", book: entry.bookId || "", day: true });
    for (const { page, momentId, book, day } of pages) {
      if (bookId && book !== bookId) continue;
      const refs = [];
      if (day && entry.photo) refs.push({ ref: entry.photo, layerId: "" });
      for (const layer of page.layers || []) if (layer?.kind === "photo" && !layer.drawing && layer.mediaRef) refs.push({ ref: layer.mediaRef, layerId: layer.id || "" });
      if (page.backdrop) refs.push({ ref: page.backdrop, layerId: "backdrop" });
      for (const { ref, layerId } of refs) {
        if (typeof ref !== "string" || !OWN_PHOTO.test(ref) || seen.has(ref)) continue;
        seen.set(ref, { id: ref.startsWith("media:") ? ref.slice(6) : `inline-${seen.size}`, ref, date: entry.date, bookId: book, momentId, layerId });
      }
    }
  }
  return [...seen.values()];
}

// Months, newest first: [{ month: "2026-11", items }].
export function wallMonths(items) {
  const months = [];
  for (const item of items) {
    const month = item.date.slice(0, 7);
    if (months.at(-1)?.month !== month) months.push({ month, items: [] });
    months.at(-1).items.push(item);
  }
  return months;
}

// Masonry: each photo goes to the shortest column, by its shape (height /
// width; 1 until known). Items keep their place once given, so a photo that
// loads later never jumps to another column.
export function wallColumns(items, count, ratioOf = () => 1) {
  const columns = Array.from({ length: Math.max(1, count) }, () => ({ height: 0, items: [] }));
  for (const item of items) {
    const ratio = Math.min(3, Math.max(0.33, Number(ratioOf(item)) || 1));
    const shortest = columns.reduce((best, col) => (col.height < best.height - 0.01 ? col : best), columns[0]);
    shortest.items.push(item);
    shortest.height += ratio;
  }
  return columns.map((col) => col.items);
}

// Photos from the same day (the viewer's strip).
export function sameDay(items, item) {
  return items.filter((other) => other.date === item.date);
}
