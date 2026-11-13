// V10.41 · One set of rules for what counts as a day, a page and a sample,
// shared by the Reader, PDF, Calendar, My Books, Home, search and Captain,
// so no view filters on its own and gets a different number.
//
//   Day     a date with something the person kept (saved or still a draft).
//   Moment  one part of a day (its time, photos, words) — `entry.moments`.
//   Page    one page that can be read: a Moment page, and the day's own page
//           when it has something on it (an older day page, or a day cover).
//   Book cover   the book's front; never counted as a page (reader.mjs).
//   Day cover    a day's own page laid out as a spread of that day's
//           Moments (`layoutTemplate: "scrapbook"` with Moments). It is a
//           page while shown; `dayCoverHidden: true` hides it from reading
//           and counting only — it stays in the journal and in backups.
//
// Samples (S1). A sample day is one the app made (`isDemo: true`) that the
// person never saved: saving a day sets isDemo to false. Those days are
// kept in storage but left out of everything here unless asked for
// (`samples: "only"` — Settings → 示例内容). A day the person saved keeps
// every page in it, even pages that still carry isDemo from the sample:
// which of them were changed can't be told reliably, so they are protected
// as the person's own.
import { hasDayPageContent, photoRefs } from "./day.mjs";

export const isSampleDay = (day) => day?.isDemo === true;

export const isDayCover = (entry) =>
  Boolean(entry && entry.layoutTemplate === "scrapbook" && (entry.moments || []).length && (entry.layers || []).length);

// The day's own page is read (and counted) when it has something on it and
// is not a day cover the person chose to hide.
export const dayPageShown = (entry) => hasDayPageContent(entry) && !(isDayCover(entry) && entry.dayCoverHidden === true);

// Days by date: saved days first, a draft for a date with nothing saved.
// samples: "exclude" (default) | "only" | "include".
export function daysOf(state, { samples = "exclude" } = {}) {
  const keep = (day) => (samples === "include" ? true : samples === "only" ? isSampleDay(day) : !isSampleDay(day));
  const days = new Map();
  for (const entry of state.entries || []) if (keep(entry)) days.set(entry.date, entry);
  for (const [date, draft] of Object.entries(state.drafts || {})) if (!days.has(date) && keep(draft)) days.set(date, draft);
  return days;
}

// The saved (or draft) day for one date, or undefined for a sample day.
export function dayOf(state, date, options) {
  return daysOf(state, options).get(date);
}

// The pages that can be read, oldest first: [{ date, entry, moment }]
// (moment null = the day's own page). bookId: only that book's pages.
export function visiblePages(state, { bookId = null, samples = "exclude", date = null } = {}) {
  const days = daysOf(state, { samples });
  const pages = [];
  for (const day of [...days.keys()].sort()) {
    if (date && day !== date) continue;
    const entry = days.get(day);
    if ((!bookId || entry.bookId === bookId) && dayPageShown(entry)) pages.push({ date: day, entry, moment: null });
    for (const moment of entry.moments || []) if (!bookId || (moment.bookId || entry.bookId) === bookId) pages.push({ date: day, entry, moment });
  }
  return pages;
}

// What one date holds, for the Calendar and the day view.
export function dayCounts(state, date, options) {
  const pages = visiblePages(state, { date, ...options });
  const entry = pages[0]?.entry || dayOf(state, date, options);
  return {
    pages: pages.length,
    moments: entry?.moments?.length || 0,
    // Different photos: a day cover's copies and a photo used twice count once.
    photos: entry ? new Set(photoRefs(entry)).size : 0,
  };
}

// A book: how many days have a page in it, and how many pages.
export function bookCounts(state, bookId, options) {
  const pages = visiblePages(state, { bookId, ...options });
  return { days: new Set(pages.map((p) => p.date)).size, pages: pages.length };
}
