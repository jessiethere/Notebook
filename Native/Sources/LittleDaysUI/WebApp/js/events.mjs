// A small, local usage log for the user test (never uploaded). It keeps only
// what happened and when — no words, names, photos or media references — so
// a tester can choose to export it from Settings and send it back.
export const EVENTS_KEY = "little-days.events";
export const MAX_EVENTS = 600;
// Only these fields may be stored with an event, and only as numbers,
// booleans or short ids.
const ALLOWED = ["way", "photo", "photos", "ms", "taps", "shuffles", "variant", "line", "size", "kind", "pages"];

export function cleanData(data = {}) {
  const out = {};
  for (const key of ALLOWED) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.round(value);
    else if (typeof value === "boolean") out[key] = value;
    else if (typeof value === "string" && /^[a-z0-9-]{0,16}$/.test(value)) out[key] = value;
  }
  return out;
}

export function readEvents(storage = globalThis.localStorage) {
  try {
    const list = JSON.parse(storage?.getItem(EVENTS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function logEvent(name, data = {}, storage = globalThis.localStorage, now = Date.now()) {
  if (!/^[a-z_]{2,32}$/.test(name)) return;
  try {
    const list = readEvents(storage);
    list.push({ e: name, t: now, ...cleanData(data) });
    storage?.setItem(EVENTS_KEY, JSON.stringify(list.slice(-MAX_EVENTS)));
  } catch {
    // The log is a convenience for testing; journaling never depends on it.
  }
}

// A summary that is easy to read in a test interview.
export function summarize(events) {
  const done = events.filter((e) => e.e === "page_done");
  const times = done.map((e) => e.ms).filter((n) => typeof n === "number").sort((a, b) => a - b);
  const days = new Set(events.map((e) => new Date(e.t).toISOString().slice(0, 10)));
  return {
    events: events.length,
    activeDays: days.size,
    quickPages: done.length,
    medianSeconds: times.length ? Math.round(times[Math.floor(times.length / 2)] / 1000) : null,
    shuffles: events.filter((e) => e.e === "layout_shuffle").length,
    edits: events.filter((e) => e.e === "quick_edit").length,
    exports: events.filter((e) => e.e === "export").length,
    shares: events.filter((e) => e.e === "share").length,
  };
}
