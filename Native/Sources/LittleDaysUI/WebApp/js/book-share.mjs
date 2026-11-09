// Sharing a book with family, read-only: one person keeps the book, the
// others look at it. The whole book becomes one PDF (a title page, then every
// page in date order) that opens on any phone from Messages or WhatsApp — no
// account, no server. Pure helpers; drawing the pages happens in export.mjs.

export const MAX_SHARE_PAGES = 60;
// PDF page size in points: the journal page is 4:5 (1080 × 1350 px).
export const PDF_PAGE = { width: 432, height: 540 };

const hasCover = (entry) =>
  Boolean(
    entry &&
      ((entry.title || "").trim() ||
        (entry.body || "").trim() ||
        entry.photo ||
        (entry.layers || []).length ||
        (entry.media || []).length),
  );

// The pages of one book, oldest first: each day's cover (if it belongs to
// this book and has something on it), then that day's pages in their order.
// Saved days are used; a day that only exists as a draft is included too.
// Sample (demo) days are left out.
// (Reading the book in the app may include the sample days; sharing never does.)
export function bookSharePages(state, bookId, { includeDemo = false } = {}) {
  const days = new Map();
  for (const entry of state.entries || []) if (includeDemo || !entry.isDemo) days.set(entry.date, entry);
  for (const [date, draft] of Object.entries(state.drafts || {})) if (!days.has(date) && (includeDemo || !draft.isDemo)) days.set(date, draft);
  const pages = [];
  for (const date of [...days.keys()].sort()) {
    const entry = days.get(date);
    if (entry.bookId === bookId && hasCover(entry)) pages.push({ date, entry, moment: null });
    for (const moment of entry.moments || []) if ((moment.bookId || entry.bookId) === bookId) pages.push({ date, entry, moment });
  }
  return pages;
}
// Too many pages for one file: keep the most recent ones.
export function limitPages(pages, max = MAX_SHARE_PAGES) {
  return pages.length > max ? { pages: pages.slice(-max), skipped: pages.length - max } : { pages, skipped: 0 };
}
export function dateRange(pages) {
  if (!pages.length) return null;
  return { from: pages[0].date, to: pages.at(-1).date };
}

// ---------- A minimal PDF: one full-page JPEG per page ----------
const encoder = new TextEncoder();
// jpegs: [{ bytes: Uint8Array, width, height }] (pixel size of each JPEG).
export function buildPdf(jpegs, { title = "Little Days" } = {}) {
  const chunks = [];
  let length = 0;
  const offsets = [];
  const push = (part) => {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (n, body) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    body();
    push("\nendobj\n");
  };
  const { width: W } = PDF_PAGE;
  // Each page takes its picture's own shape (a day's first page can be taller:
  // it carries the day's list underneath).
  const pageHeight = (jpeg) => (jpeg.width && jpeg.height ? Math.round((W * jpeg.height) / jpeg.width) : PDF_PAGE.height);
  const n = jpegs.length;
  // 1 catalog, 2 pages, 3 info, then per page: page, content, image.
  const pageId = (i) => 4 + i * 3;
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  object(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${jpegs.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] >>`));
  // Title as UTF-16BE hex so any language shows correctly.
  const hex = [...String(title).slice(0, 80)].map((ch) => ch.codePointAt(0) > 0xffff ? "" : ch.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  object(3, () => push(`<< /Title <FEFF${hex}> /Producer (Little Days) >>`));
  jpegs.forEach((jpeg, i) => {
    const id = pageId(i);
    const H = pageHeight(jpeg);
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    object(id, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`));
    object(id + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    object(id + 2, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.bytes.length} >>\nstream\n`);
      push(jpeg.bytes);
      push("\nendstream");
    });
  });
  const total = 4 + n * 3;
  const xref = length;
  push(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let i = 1; i < total; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(length);
  let at = 0;
  for (const part of chunks) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
