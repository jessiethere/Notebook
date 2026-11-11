// Personal mark (the profile avatar) — V10.16, decided 2026-11-11:
//   • five monograms (the first letter of the name on five papers) and the
//     sprout, which is also what shows when nothing was chosen;
//   • no system emoji to pick any more, but an emoji someone already has is
//     kept and shown as it is ("现在的头像" in the editor);
//   • the six drawn emblems wait for a designer (docs/PROFILE_EDITOR_PLAN.md §4).
//
// Stored in the same field as before (little-days.account.avatar, a string):
//   "🌷"               nothing chosen (the old default) → the sprout
//   "mark:sprout"      the sprout, chosen
//   "mono:<style>"     a monogram: the first letter of the current name
//   any other emoji    an avatar picked before V10.16 → shown as it is
// No migration: old records read the same; nothing about journals changes.

export const UNSET = "🌷";
export const SPROUT = "mark:sprout";
export const MONOGRAMS = ["mono:paper", "mono:seal", "mono:kraft", "mono:sage", "mono:script"];
export const PICKABLE = [...MONOGRAMS, SPROUT];

export const isMonogram = (value) => MONOGRAMS.includes(value);
export const isPickable = (value) => PICKABLE.includes(value);

// The emoji avatars of earlier versions (and of the welcome page then).
export const LEGACY = ["🌼", "🍓", "🐰", "🐱", "🌿", "☁️", "📖", "☕", "🌙"];

// The first letter of a name: a Latin letter upper-cased, a Chinese / Japanese
// character as it is, the first whole grapheme otherwise; "" for no name.
export function initialOf(name) {
  const text = String(name || "").trim();
  if (!text) return "";
  let first = text;
  try {
    first = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)][0].segment;
  } catch {
    first = Array.from(text)[0];
  }
  // Letters with a case (A, é, Ж) are shown upper-case; 小, あ stay as they are.
  return first.toUpperCase() !== first.toLowerCase() ? first.toUpperCase() : first;
}
const isWide = (letter) => /[⺀-鿿豈-﫿぀-ヿ가-힯]/.test(letter);

// What a stored avatar shows.
// → { kind: "sprout" } | { kind: "mono", style, letter, sample } | { kind: "emoji", value }
export function markOf(avatar, name, { language = "zh" } = {}) {
  const value = String(avatar || UNSET);
  if (value === UNSET || value === SPROUT) return { kind: "sprout" };
  if (isMonogram(value)) {
    const letter = initialOf(name);
    // No name yet: a faint sample letter, so the five styles can still be seen.
    return { kind: "mono", style: value.slice(5), letter: letter || (language === "en" ? "A" : "名"), sample: !letter };
  }
  if (value.startsWith("mono:") || value.startsWith("mark:")) return { kind: "sprout" }; // unknown future id
  return { kind: "emoji", value };
}

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const SPROUT_SVG =
  '<svg class="pm-sprout" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 26.5V15.5"/><path d="M16 17.2c0-4.4-3.1-7.3-7.8-7.3 0 4.5 3.3 7.3 7.8 7.3Z"/><path d="M16 14.8c0-4.2 2.9-7 7.4-7 0 4.3-3 7-7.4 7Z"/><path d="M11.5 26.5h9" class="pm-ground"/></svg>';

// One mark, as a round piece of paper. size in px. The same markup for the
// Settings header, the editor's preview and choices, and the welcome page.
export function markHTML(mark, { size = 48, label = "" } = {}) {
  const aria = label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"';
  const style = ` style="--pm:${Number(size) || 48}px"`;
  if (mark.kind === "emoji") return `<span class="pmark pm-emoji"${style}${aria}><span class="pm-glyph">${esc(mark.value)}</span></span>`;
  if (mark.kind === "mono")
    return `<span class="pmark pm-${esc(mark.style)}${mark.sample ? " pm-sample" : ""}${isWide(mark.letter) ? " pm-wide" : ""}"${style}${aria}><span class="pm-letter">${esc(mark.letter)}</span></span>`;
  return `<span class="pmark pm-sprout-chip"${style}${aria}>${SPROUT_SVG}</span>`;
}
