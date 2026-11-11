// Rich text for the journal (V10.6): bold, italic, underline, strikethrough
// on part of a text.
//
// The words stay a plain string exactly as before (`title`, `body`, a text
// box's `text`). Formatting is a separate, optional list of ranges over that
// string — "marks":
//
//   { start, end, bold?, italic?, underline?, strike? }
//
// `start` / `end` are UTF-16 offsets into the string (end exclusive) — the
// same unit as a JavaScript string index and as NSString / NSRange in Swift,
// so both sides mean the same characters. A stored list is normalised:
// sorted, non-overlapping, neighbours with the same look merged, nothing
// outside the text, no empty ranges. An old page simply has no marks.
//
// Everything here is pure (no DOM) except readMarks / richHTML's caller.

export const MARK_KEYS = ["bold", "italic", "underline", "strike"];
const LETTERS = { bold: "b", italic: "i", underline: "u", strike: "x" };
const BITS = { bold: 1, italic: 2, underline: 4, strike: 8 };
const bitsOf = (mark) => MARK_KEYS.reduce((sum, key) => sum | (mark?.[key] ? BITS[key] : 0), 0);
const lookOf = (bits) => Object.fromEntries(MARK_KEYS.filter((key) => bits & BITS[key]).map((key) => [key, true]));

// One small number per character: which looks it has.
function flagsOf(marks, length) {
  const flags = new Uint8Array(Math.max(0, length | 0));
  if (!Array.isArray(marks)) return flags;
  for (const mark of marks) {
    if (!mark || typeof mark !== "object") continue;
    const start = Math.max(0, Math.floor(Number(mark.start)));
    const end = Math.min(flags.length, Math.floor(Number(mark.end)));
    const bits = bitsOf(mark);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !bits) continue;
    for (let k = start; k < end; k++) flags[k] |= bits;
  }
  return flags;
}
function marksOf(flags) {
  const marks = [];
  let k = 0;
  while (k < flags.length) {
    const bits = flags[k];
    let end = k + 1;
    while (end < flags.length && flags[end] === bits) end++;
    if (bits) marks.push({ start: k, end, ...lookOf(bits) });
    k = end;
  }
  return marks;
}

// Stored data is never trusted: anything odd is dropped, the text is untouched.
export function normalizeMarks(marks, length) {
  return marksOf(flagsOf(marks, length));
}

// B / I / U / S on a range: if every character already has the look it is
// removed, otherwise the whole range gets it (like Notes).
export function toggleMark(marks, start, end, key, length) {
  const flags = flagsOf(marks, length);
  const bit = BITS[key];
  const from = Math.max(0, Math.min(start, end)),
    to = Math.min(flags.length, Math.max(start, end));
  if (!bit || to <= from) return marksOf(flags);
  let all = true;
  for (let k = from; k < to; k++) if (!(flags[k] & bit)) all = false;
  for (let k = from; k < to; k++) flags[k] = all ? flags[k] & ~bit : flags[k] | bit;
  return marksOf(flags);
}

// Give a range exactly this look (used for words typed with B / I / U / S switched on or off).
export function applyLook(marks, start, end, look, length) {
  const flags = flagsOf(marks, length);
  const bits = bitsOf(look);
  for (let k = Math.max(0, start); k < Math.min(flags.length, end); k++) flags[k] = bits;
  return marksOf(flags);
}

// What the buttons show. A selection: a look is "on" when all of it has it.
// A caret: the look of the character before it (what typing would continue).
export function lookAt(marks, start, end, length) {
  const flags = flagsOf(marks, length);
  const from = Math.max(0, Math.min(start, end)),
    to = Math.min(flags.length, Math.max(start, end));
  let bits;
  if (to > from) {
    bits = 15;
    for (let k = from; k < to; k++) bits &= flags[k];
  } else bits = flags.length ? flags[from > 0 ? from - 1 : 0] : 0;
  return Object.fromEntries(MARK_KEYS.map((key) => [key, Boolean(bits & BITS[key])]));
}

// Where two versions of a text differ: `at`, how many characters went, how many came.
export function textChange(before, after) {
  const a = String(before ?? ""),
    b = String(after ?? "");
  let prefix = 0;
  const max = Math.min(a.length, b.length);
  while (prefix < max && a[prefix] === b[prefix]) prefix++;
  let suffix = 0;
  while (suffix < max - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
  return { at: prefix, removed: a.length - prefix - suffix, added: b.length - prefix - suffix };
}

// The words changed somewhere the marks did not see (a plain field, a
// template, an older editor): keep each mark on its own characters. New
// characters take the look of what they replace, or of the character before.
export function editMarks(marks, before, after) {
  const a = String(before ?? ""),
    b = String(after ?? "");
  const old = flagsOf(marks, a.length);
  const { at, removed, added } = textChange(a, b);
  const next = new Uint8Array(b.length);
  for (let k = 0; k < at; k++) next[k] = old[k];
  const inherit = removed > 0 ? old[at] : at > 0 ? old[at - 1] : old.length ? old[0] : 0;
  for (let k = 0; k < added; k++) next[at + k] = inherit;
  for (let k = at + removed; k < a.length; k++) next[k - removed + added] = old[k];
  return marksOf(next);
}

// The text cut into pieces that each have one look — what a renderer draws
// (HTML spans here, canvas text in the export, attributed runs in SwiftUI).
export function runsOf(text, marks) {
  const value = String(text ?? "");
  const flags = flagsOf(marks, value.length);
  const runs = [];
  let k = 0;
  while (k < value.length) {
    let end = k + 1;
    while (end < value.length && flags[end] === flags[k]) end++;
    runs.push({ text: value.slice(k, end), ...lookOf(flags[k]) });
    k = end;
  }
  return runs;
}

const lettersOf = (run) => MARK_KEYS.filter((key) => run[key]).map((key) => LETTERS[key]).join("");

// HTML for the page: plain text stays a bare text node; a formatted piece is
// one <span class="rt rt-b …" data-m="b…">. `escape` must escape HTML.
export function richHTML(text, marks, escape) {
  const value = String(text ?? "");
  if (!Array.isArray(marks) || !marks.length) return escape(value);
  return runsOf(value, marks)
    .map((run) => {
      const letters = lettersOf(run);
      if (!letters) return escape(run.text);
      return `<span class="rt${[...letters].map((letter) => ` rt-${letter === "x" ? "s" : letter}`).join("")}" data-m="${letters}">${escape(run.text)}</span>`;
    })
    .join("");
}

// Reads text + marks back from an edited element. Only our own spans count
// (data-m with the letters b i u x); anything else pasted or injected adds
// no formatting. The caller checks `text` against what the browser reports
// and falls back to editMarks when they differ.
export function readMarks(root) {
  let text = "";
  const marks = [];
  const walk = (node, bits) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const value = child.nodeValue || "";
        if (bits && value) marks.push({ start: text.length, end: text.length + value.length, ...lookOf(bits) });
        text += value;
      } else if (child.nodeType === 1) {
        if (child.tagName === "BR") {
          text += "\n";
          continue;
        }
        let own = 0;
        const letters = child.dataset?.m;
        if (child.tagName === "SPAN" && typeof letters === "string" && /^[biux]{1,4}$/.test(letters)) for (const [key, letter] of Object.entries(LETTERS)) if (letters.includes(letter)) own |= BITS[key];
        walk(child, bits | own);
      }
    }
  };
  walk(root, 0);
  return { text, marks: normalizeMarks(marks, text.length) };
}

// The marks of a piece of the text (from..to), counted from the piece's own start.
export function sliceMarks(marks, from, to) {
  if (!Array.isArray(marks)) return [];
  return normalizeMarks(
    marks.map((mark) => ({ ...mark, start: Number(mark?.start) - from, end: Math.min(Number(mark?.end), to) - from })),
    Math.max(0, to - from),
  );
}

// Keeps the optional field tidy on a page / text box: a list when there is
// formatting, no key at all when there is none.
export function storeMarks(owner, key, marks, length) {
  const clean = normalizeMarks(marks, length);
  if (clean.length) owner[key] = clean;
  else delete owner[key];
  return clean;
}
