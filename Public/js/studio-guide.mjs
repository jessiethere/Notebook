// Journal Studio · a light, three-step guide (V10.12): pure helpers.
//
// The guide points at the real things on the paper — it never shows a gesture
// the editor does not have. Whether it has been seen is a preference of this
// device (localStorage "little-days.studio-guide"), not journal data: it is
// not in the journal store, not in backups, not in the Swift model, and
// reading or clearing it never touches a page.
//
// Shown by itself only once, the first time someone opens the editor with no
// pages of their own yet. Someone who has already kept pages (they used the
// editor before this version) is not taught again because of an update; they
// can open it any time from 更多 → 操作指南.

export const GUIDE_KEY = "little-days.studio-guide";

// Each step names what it points at, in order of preference.
export const STEPS = [
  { id: "move", title: "guide.move.title", body: "guide.move.body", targets: ["photo", "sticker", "text", "any", "paper"] },
  { id: "type", title: "guide.type.title", body: "guide.type.body", targets: ["text", "addText"] },
  { id: "adjust", title: "guide.adjust.title", body: "guide.adjust.body", targets: ["selected", "photo", "sticker", "text", "any", "paper"] },
];

export function loadGuide(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(GUIDE_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return { tour: null, tips: {} };
    return {
      tour: value.tour === "done" || value.tour === "skipped" ? value.tour : null,
      at: typeof value.at === "string" ? value.at : null,
      tips: value.tips && typeof value.tips === "object" && !Array.isArray(value.tips) ? value.tips : {},
    };
  } catch {
    return { tour: null, tips: {} };
  }
}
function store(next, storage) {
  try {
    storage?.setItem(GUIDE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}
// outcome: "done" (went through the three steps) or "skipped".
export function finishTour(outcome, storage = globalThis.localStorage) {
  const guide = loadGuide(storage);
  return store({ ...guide, tour: outcome === "done" ? "done" : "skipped", at: new Date().toISOString() }, storage);
}
export function markTip(id, storage = globalThis.localStorage) {
  const guide = loadGuide(storage);
  if (guide.tips[id]) return guide;
  return store({ ...guide, tips: { ...guide.tips, [id]: true } }, storage);
}
export const tipSeen = (guide, id) => Boolean(guide?.tips?.[id]);

// Open by itself? Only for someone new: never seen or skipped, and no pages
// of their own (sample pages do not count).
export function shouldAutoStart(guide, journal) {
  if (guide?.tour) return false;
  const own = (journal?.entries || []).some((entry) => !entry?.isDemo);
  const drafts = Object.keys(journal?.drafts || {}).length > 0;
  return !own && !drafts;
}

// Which item on the paper a step points at. layers: the page's items (in
// stacking order); selectedId: the selected one, if any. Returns
// { kind: "layer", id } | { kind: "addText" } | { kind: "paper" }.
export function stepTarget(step, layers = [], selectedId = null) {
  const shown = layers.filter((layer) => layer && layer.id);
  const first = (test) => shown.find(test);
  for (const want of step?.targets || []) {
    let layer = null;
    if (want === "selected") layer = selectedId ? first((l) => l.id === selectedId) : null;
    else if (want === "photo") layer = first((l) => l.kind === "photo" && !l.drawing);
    else if (want === "sticker") layer = first((l) => !["photo", "text", "video", "audio", "growth"].includes(l.kind));
    else if (want === "text") layer = first((l) => l.kind === "text");
    else if (want === "any") layer = shown[0] || null;
    else if (want === "addText") return { kind: "addText" };
    else if (want === "paper") return { kind: "paper" };
    if (layer) return { kind: "layer", id: layer.id, layerKind: layer.kind };
  }
  return { kind: "paper" };
}

// The words of a step: when there is no text box yet, step 2 says how to get
// one first (it does not pretend there is one).
export function stepCopy(step, target) {
  if (step?.id === "type" && target?.kind === "addText") return { title: step.title, body: "guide.type.bodyAdd" };
  if (step?.id === "move" && target?.kind === "paper") return { title: step.title, body: "guide.move.bodyEmpty" };
  if (step?.id === "adjust" && target?.kind === "paper") return { title: step.title, body: "guide.adjust.bodyEmpty" };
  return { title: step.title, body: step.body };
}
