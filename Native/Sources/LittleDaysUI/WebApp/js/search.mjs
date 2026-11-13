// V7.6 search and "On this day". Pure functions over the journal state (no
// DOM). Search looks through my own pages (not the sample days): titles,
// words, tags, words placed on the paper, a book's own fields, plus the day's
// list (habit notes and things done) and my books (name, description, tags).
import { hasDayPageContent } from "./day.mjs";

const isPhoto = (ref) => /^(photo|media):/.test(String(ref || ""));

// Every day I kept: saved days, and days that only exist as a draft.
function ownDays(state) {
  const days = new Map();
  for (const entry of state.entries || []) if (!entry.isDemo) days.set(entry.date, entry);
  for (const [date, draft] of Object.entries(state.drafts || {})) if (!days.has(date) && !draft.isDemo) days.set(date, draft);
  return days;
}

// The first photo on a page (its own photos, not the day spread's copies).
export function pagePhoto(page, entry) {
  if (isPhoto(page.backdrop)) return page.backdrop;
  if (page === entry && entry.photo) return entry.photo;
  return (page.layers || []).find((l) => l.kind === "photo" && l.mediaRef && !l.gen && !l.drawing)?.mediaRef || "";
}

// The words of a page, for searching and for a short preview.
export function pageTexts(page) {
  const texts = [page.title, page.body, ...(page.tags || []).map((tag) => `#${tag}`)];
  for (const layer of page.layers || []) if (layer.kind === "text" && !layer.gen && !layer.bind) texts.push(layer.text);
  for (const value of Object.values(page.fieldValues || {})) if (typeof value === "string" && !isPhoto(value)) texts.push(value);
  return texts.filter((text) => typeof text === "string" && text.trim());
}

const fold = (text) => String(text || "").toLocaleLowerCase();
export function terms(query) {
  return fold(query).trim().split(/\s+/).filter(Boolean).slice(0, 6);
}
const matchesAll = (haystack, words) => words.every((word) => haystack.includes(word));

// A short piece of text around the first match, about `room` characters.
export function snippet(text, words, room = 44) {
  const plain = String(text || "").replace(/\s+/g, " ").trim();
  const low = fold(plain);
  const at = Math.min(...words.map((w) => low.indexOf(w)).filter((i) => i >= 0), Infinity);
  if (!Number.isFinite(at)) return plain.slice(0, room);
  const start = Math.max(0, at - Math.floor(room / 3));
  return `${start ? "…" : ""}${plain.slice(start, start + room)}${start + room < plain.length ? "…" : ""}`;
}

export function searchJournal(state, query, { limit = 60 } = {}) {
  const words = terms(query);
  if (!words.length) return { pages: [], books: [], total: 0 };
  const books = new Map((state.books || []).map((book) => [book.id, book]));
  const pages = [];
  for (const [date, entry] of ownDays(state)) {
    const list = [entry, ...(entry.moments || [])].filter((page) => page !== entry || hasDayPageContent(entry));
    for (const page of list) {
      const texts = pageTexts(page);
      const book = books.get(page.bookId || entry.bookId);
      const haystack = fold([...texts, book?.title || "", ...(book?.tags || []).map((t) => `#${t}`)].join("\n"));
      if (!matchesAll(haystack, words)) continue;
      const hit = texts.find((text) => words.some((w) => fold(text).includes(w))) || texts[0] || "";
      pages.push({ kind: "page", date, momentId: page === entry ? null : page.id, time: page === entry ? "" : page.time || "", title: page.title || "", snippet: snippet(hit, words), photo: pagePhoto(page, entry), bookId: page.bookId || entry.bookId || "" });
    }
    // The day's list: habit notes and things done.
    const listTexts = [
      ...(state.checks || []).filter((c) => c.date === date).flatMap((c) => [state.habits?.find((h) => h.id === c.habitId)?.title, c.detail, c.note]),
      ...((state.plans || {})[date] || []).filter((p) => p.done).map((p) => p.text),
    ].filter((text) => typeof text === "string" && text.trim());
    if (listTexts.length && matchesAll(fold(listTexts.join("\n")), words)) {
      const hit = listTexts.find((text) => words.some((w) => fold(text).includes(w))) || "";
      pages.push({ kind: "list", date, momentId: null, time: "", title: "", snippet: snippet(hit, words), photo: "", bookId: "" });
    }
  }
  // Dates without a page but with a list (habits / things done) count too.
  for (const date of new Set([...(state.checks || []).map((c) => c.date), ...Object.keys(state.plans || {})])) {
    if (ownDays(state).has(date)) continue;
    const listTexts = [
      ...(state.checks || []).filter((c) => c.date === date).flatMap((c) => [state.habits?.find((h) => h.id === c.habitId)?.title, c.detail, c.note]),
      ...((state.plans || {})[date] || []).filter((p) => p.done).map((p) => p.text),
    ].filter((text) => typeof text === "string" && text.trim());
    if (listTexts.length && matchesAll(fold(listTexts.join("\n")), words)) {
      const hit = listTexts.find((text) => words.some((w) => fold(text).includes(w))) || "";
      pages.push({ kind: "list", date, momentId: null, time: "", title: "", snippet: snippet(hit, words), photo: "", bookId: "" });
    }
  }
  pages.sort((a, b) => (a.date === b.date ? (a.time || "").localeCompare(b.time || "") : a.date < b.date ? 1 : -1));
  const bookHits = (state.books || []).filter((book) => matchesAll(fold([book.title, book.description, ...(book.tags || []).map((t) => `#${t}`)].join("\n")), words));
  return { pages: pages.slice(0, limit), books: bookHits, total: pages.length };
}

// ---------- On this day ----------
// Days I kept on this date in earlier years (newest first); with none, the
// same day last month — a young journal has memories sooner.
export function onThisDay(state, today) {
  const [y, m, d] = today.split("-").map(Number);
  const days = ownDays(state);
  const has = (entry) => entry && (hasDayPageContent(entry) || (entry.moments || []).length > 0);
  const found = [];
  for (let back = 1; back <= 20; back++) {
    const date = `${y - back}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (has(days.get(date))) found.push({ date, years: back, months: 0, entry: days.get(date) });
  }
  if (!found.length) {
    const prev = new Date(y, m - 2, d);
    // Only a real "same day" (no 31 → 1 roll-over).
    if (prev.getDate() === d) {
      const date = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (has(days.get(date))) found.push({ date, years: 0, months: 1, entry: days.get(date) });
    }
  }
  return found.map((item) => {
    const pages = [item.entry, ...(item.entry.moments || [])].filter((page) => (page === item.entry ? hasDayPageContent(page) : true));
    const withPhoto = pages.find((page) => pagePhoto(page, item.entry)) || pages[0];
    const words = pages.map((page) => pageTexts(page)).flat();
    return { ...item, momentId: withPhoto && withPhoto !== item.entry ? withPhoto.id : null, photo: withPhoto ? pagePhoto(withPhoto, item.entry) : "", title: withPhoto?.title || words[0] || "", words: (withPhoto?.body || words.find((w) => w !== withPhoto?.title) || "").replace(/\s+/g, " ").slice(0, 80), pages: pages.length };
  });
}
