// V3.1 pure helpers: a Day (Entry) contains ordered Moments; Growth checks
// stay unique per (habitId, date) and can carry private reflections.
import { normalizeMoment } from "./model.mjs";
import { smartLayout, SMART_VARIANTS } from "./smart-layout.mjs";

const newId = () => globalThis.crypto.randomUUID();
const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

/* ---------- Moments ---------- */

export function createMoment(entry, values = {}) {
  return normalizeMoment(
    {
      id: newId(),
      title: "",
      time: "",
      body: "",
      mood: "",
      tags: [],
      layers: [],
      media: [],
      collapsed: false,
      updatedAt: new Date().toISOString(),
      ...values,
    },
    entry,
  );
}

export function findMoment(entry, momentId) {
  return entry?.moments?.find((moment) => moment.id === momentId) || null;
}

export function moveMoment(entry, momentId, delta) {
  const index = entry.moments.findIndex((moment) => moment.id === momentId);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= entry.moments.length) return false;
  const [moment] = entry.moments.splice(index, 1);
  entry.moments.splice(next, 0, moment);
  return true;
}

// Copies share media Blobs (Blobs are never auto-deleted) but get fresh IDs.
export function duplicateMoment(entry, momentId) {
  const index = entry.moments.findIndex((moment) => moment.id === momentId);
  if (index < 0) return null;
  const copy = structuredClone(entry.moments[index]);
  copy.id = newId();
  copy.collapsed = false;
  copy.updatedAt = new Date().toISOString();
  for (const layer of copy.layers) layer.id = newId();
  for (const clip of copy.media) clip.id = newId();
  entry.moments.splice(index + 1, 0, copy);
  return copy;
}

export function removeMoment(entry, momentId) {
  const before = entry.moments.length;
  entry.moments = entry.moments.filter((moment) => moment.id !== momentId);
  return entry.moments.length !== before;
}

// Saves a single Moment into the saved day without committing other drafts.
export function saveMoment(state, draft, momentId) {
  const moment = findMoment(draft, momentId);
  if (!moment) throw new Error("error.invalidData");
  const copy = {
    ...structuredClone(moment),
    visibility: "private",
    updatedAt: new Date().toISOString(),
  };
  let saved = state.entries.find((entry) => entry.date === draft.date);
  if (!saved) {
    saved = {
      id: draft.id,
      date: draft.date,
      title: "",
      body: "",
      mood: draft.mood || "", // V10.24: no mood unless chosen (older days keep theirs)
      bookId: draft.bookId || "daily",
      photo: "",
      template: draft.template || "cute",
      font: draft.font || "serif",
      layers: [],
      media: [],
      fieldValues: {},
      moments: [],
      isDemo: false,
      visibility: "private",
    };
    state.entries.push(saved);
  }
  saved.moments ||= [];
  const existing = saved.moments.findIndex((item) => item.id === momentId);
  if (existing >= 0) saved.moments[existing] = copy;
  else {
    const order = draft.moments.map((item) => item.id);
    const position = saved.moments.filter(
      (item) =>
        order.indexOf(item.id) >= 0 &&
        order.indexOf(item.id) < order.indexOf(momentId),
    ).length;
    saved.moments.splice(position, 0, copy);
  }
  saved.isDemo = false;
  saved.updatedAt = copy.updatedAt;
  return saved;
}

export function hasDayPageContent(entry) {
  return Boolean(
    entry &&
      (entry.title?.trim() ||
        entry.body?.trim() ||
        entry.photo ||
        entry.layers?.length ||
        entry.media?.length ||
        Object.values(entry.fieldValues || {}).some(
          (value) => value !== "" && value !== false && value != null,
        )),
  );
}

export function hasMomentContent(moment) {
  return Boolean(
    moment.title?.trim() ||
      moment.body?.trim() ||
      moment.layers?.length ||
      moment.media?.length,
  );
}

/* ---------- Summaries for Calendar / Home / Books ---------- */

const pagesOf = (entry) => (entry ? [entry, ...(entry.moments || [])] : []);

export function photoRefs(entry) {
  const refs = [];
  if (entry?.photo) refs.push(entry.photo);
  for (const page of pagesOf(entry))
    for (const layer of page.layers || [])
      if (layer.kind === "photo" && layer.mediaRef) refs.push(layer.mediaRef);
  return refs;
}

export function coverPhoto(entry) {
  return photoRefs(entry)[0] || "";
}

export function clipsOf(entry) {
  return pagesOf(entry).flatMap((page) => page.media || []);
}

// V10.41 (S1): a sample day (isDemo, never saved by the person) counts as
// nothing here unless `samples` is asked for (Settings → 示例内容 → a day).
export function daySummary(state, date, { samples = false } = {}) {
  const entry = state.entries.find((item) => item.date === date && (samples || item.isDemo !== true));
  const clips = clipsOf(entry);
  const checks = state.checks.filter((check) => check.date === date);
  return {
    entry,
    photos: new Set(photoRefs(entry)).size, // V10.41: different photos (a day cover repeats them)
    videos: clips.filter((clip) => clip.kind === "video").length,
    audios: clips.filter((clip) => clip.kind === "audio").length,
    moments: entry?.moments?.length || 0,
    growth: checks.length,
    notes: checks.filter((check) => check.note?.trim()).length,
  };
}

export function bookPages(state, bookId) {
  const result = [];
  for (const entry of state.entries) {
    if (entry.isDemo === true) continue;
    if (entry.bookId === bookId && hasDayPageContent(entry))
      result.push({ entry, moment: null });
    for (const moment of entry.moments || [])
      if (moment.bookId === bookId) result.push({ entry, moment });
  }
  return result.sort((a, b) => b.entry.date.localeCompare(a.entry.date));
}

export function bookEntryCount(state, bookId) {
  return state.entries.filter(
    (entry) =>
      entry.isDemo !== true &&
      (entry.bookId === bookId ||
        (entry.moments || []).some((moment) => moment.bookId === bookId)),
  ).length;
}

/* ---------- Growth reflections ---------- */

const REFLECTION_TEXT = ["detail", "note", "mood", "photo"];

// Adds or updates a check-in's reflection. The (habitId, date) pair stays
// unique, so editing a note never creates a second completion.
export function saveCheckReflection(state, habitId, date, values = {}) {
  if (!state.habits.some((habit) => habit.id === habitId))
    throw new Error("error.invalidData");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("error.invalidData");
  let check = state.checks.find(
    (item) => item.habitId === habitId && item.date === date,
  );
  if (!check) {
    check = { habitId, date, minutes: 0 };
    state.checks.push(check);
  }
  if (values.minutes != null && values.minutes !== "")
    check.minutes = Math.max(0, Math.round(Number(values.minutes) || 0));
  for (const key of REFLECTION_TEXT)
    if (values[key] != null) check[key] = String(values[key]).slice(0, 2000);
  check.shareNote = values.shareNote === true;
  check.updatedAt = new Date().toISOString();
  return check;
}

export function periodKey(period, date) {
  if (period === "month") return date.slice(0, 7);
  const day = new Date(`${date}T12:00:00`);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export function findReflection(state, period, key) {
  return (state.reflections || []).find(
    (item) => item.period === period && item.key === key,
  );
}

export function saveReflection(state, period, key, values) {
  if (!["week", "month"].includes(period)) throw new Error("error.invalidData");
  state.reflections ||= [];
  let reflection = findReflection(state, period, key);
  if (!reflection) {
    reflection = { id: newId(), period, key };
    state.reflections.push(reflection);
  }
  for (const field of ["wentWell", "challenges", "learned", "nextFocus"])
    reflection[field] = String(values[field] || "").slice(0, 2000);
  reflection.updatedAt = new Date().toISOString();
  return reflection;
}

/* ---------- Photo layout ---------- */

export const LAYOUT_TEMPLATES = ["duo", "trio", "grid", "polaroid", "collage", "full", "corner", "stack"];
// Step 1 picks how many photos (0 = text only, 5 = five or more); step 2
// offers the layouts that suit that number.
export const TEMPLATES_BY_COUNT = {
  0: ["text"],
  1: ["full", "polaroid", "corner"],
  2: ["duo", "stack", "polaroid"],
  3: ["trio", "collage", "polaroid"],
  4: ["grid", "collage", "polaroid"],
  5: ["collage", "grid", "stack"],
};
export const PHOTO_FRAMES = ["polaroid", "border", "rounded", "bare"];

export function suggestLayout(count) {
  return count <= 1
    ? "polaroid"
    : count === 2
      ? "duo"
      : count === 3
        ? "trio"
        : count === 4
          ? "grid"
          : "collage";
}

// Coordinates are relative to the canvas: x/y are the centre in %, w is a %
// of canvas width and h a % of canvas height, so every screen restores the
// same page. `region` keeps photos above a day page's fixed title/body.
export function autoLayout(count, template, region = { top: 4, bottom: 60 }) {
  const top = region.top,
    height = region.bottom - region.top,
    slots = [];
  const grid = (n, rows, cols, y0 = top, h = height, frame = "border") => {
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols),
        col = i % cols,
        cellW = 92 / cols,
        cellH = h / rows;
      slots.push({
        x: 4 + cellW * (col + 0.5),
        y: y0 + cellH * (row + 0.5),
        w: cellW - 3,
        h: cellH - 3,
        rotation: 0,
        frame,
      });
    }
  };
  if (template === "full" && count === 1) {
    slots.push({ x: 50, y: top + height / 2, w: 92, h: height * 0.96, rotation: 0, frame: "bare" });
  } else if (template === "corner" && count === 1) {
    slots.push({ x: 30, y: top + height * 0.34, w: 46, h: height * 0.6, rotation: -4, frame: "polaroid", tape: true });
  } else if (template === "stack") {
    // Overlapping prints, as if dropped on the desk.
    for (let i = 0; i < count; i++)
      slots.push({
        x: 50 + [-10, 9, -4, 12, -12, 5][i % 6],
        y: top + height * 0.5 + [-6, 4, 8, -3, 2, -8][i % 6],
        w: 58,
        h: height * 0.62,
        rotation: [-8, 6, -3, 9, -6, 3][i % 6],
        frame: "polaroid",
        tape: i === count - 1,
      });
  } else if (template === "duo") {
    const rows = Math.max(1, Math.ceil(count / 2));
    grid(count, rows, 2, top, height, "border");
    slots.forEach((slot, i) => (slot.rotation = i % 2 ? 2 : -2));
  } else if (template === "trio") {
    slots.push({
      x: 50,
      y: top + height * 0.3,
      w: 88,
      h: height * 0.56,
      rotation: -1,
      frame: "border",
    });
    const rest = Math.max(0, count - 1),
      cols = Math.max(2, Math.min(3, rest));
    for (let i = 0; i < rest; i++) {
      const row = Math.floor(i / cols),
        col = i % cols,
        cellW = 92 / cols,
        rows = Math.ceil(rest / cols),
        cellH = (height * 0.42) / rows;
      slots.push({
        x: 4 + cellW * (col + 0.5),
        y: top + height * 0.6 + cellH * (row + 0.5),
        w: cellW - 3,
        h: cellH - 3,
        rotation: i % 2 ? 2 : -2,
        frame: "border",
      });
    }
  } else if (template === "grid") {
    const cols = count <= 4 ? 2 : 3,
      rows = Math.max(1, Math.ceil(count / cols));
    grid(count, rows, cols, top, height, "bare");
  } else if (template === "polaroid") {
    const cols = count === 1 ? 1 : 2,
      rows = Math.max(1, Math.ceil(count / cols));
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols),
        col = i % cols,
        cellH = height / rows;
      slots.push({
        x: cols === 1 ? 50 : 28 + col * 44,
        y: top + cellH * (row + 0.5),
        w: cols === 1 ? 70 : 42,
        h: Math.min(cellH * 0.92, cols === 1 ? height * 0.92 : 40),
        rotation: [-6, 5, 3, -4, 7, -3][i % 6],
        frame: "polaroid",
      });
    }
  } else {
    // Collage: overlapping, varied sizes and gentle rotations.
    const cols = count <= 2 ? 2 : 3,
      rows = Math.max(1, Math.ceil(count / cols));
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols),
        col = i % cols,
        cellW = 92 / cols,
        cellH = height / rows,
        big = i % 4 === 0;
      slots.push({
        x: 4 + cellW * (col + 0.5) + (row % 2 ? 4 : -2),
        y: top + cellH * (row + 0.5),
        w: cellW * (big ? 1.25 : 1.08),
        h: cellH * (big ? 1.15 : 1.02),
        rotation: [-7, 4, -3, 6, -5, 3][i % 6],
        frame: i % 3 === 1 ? "polaroid" : "border",
        tape: i % 2 === 0,
      });
    }
  }
  return slots.slice(0, count).map((slot) => ({
    ...slot,
    x: clamp(slot.x, 0, 100),
    y: clamp(slot.y, 0, 100),
    w: clamp(slot.w, 8, 100),
    h: clamp(slot.h, 8, 100),
  }));
}

// A framed photo takes part in layouts; a hand drawing (also a picture
// layer) stays where it was drawn.
export function framedPhoto(layer) {
  return layer?.kind === "photo" && !layer.drawing;
}
export function photoLayer(reference, name, values = {}) {
  return {
    id: newId(),
    kind: "photo",
    text: name || "photo",
    mediaRef: reference,
    x: 50,
    y: 35,
    w: 42,
    h: 34,
    scale: 1,
    rotation: 0,
    frame: "border",
    crop: { x: 50, y: 50, zoom: 1 },
    ...values,
  };
}

// Applies a template to photo layers in their current order (main photo
// first). Text, stickers and growth cards keep their positions.
// Applies a template for a chosen number of photos. Missing photos become
// empty frames (filled by the next photo pick); "text" keeps the page to the
// title and words. Existing photos are never removed.
export function applyPageTemplate(page, count, template, region, options = {}) {
  const filled = page.layers.filter((layer) => framedPhoto(layer) && layer.mediaRef);
  if (template === "text") {
    if ((filled.length || page.photo) && !options.force) throw new Error("layout.textHasPhotos");
    // Words only: photos leave the page (their files stay on the device; undoable).
    page.layers = page.layers.filter((layer) => !framedPhoto(layer));
    if (page.photo) page.photo = "";
    page.layers = page.layers.filter((layer) => !(layer.kind === "photo" && !layer.mediaRef));
    page.layoutTemplate = "text";
    page.layoutEdited = false;
    return 0;
  }
  const target = Math.max(count, filled.length);
  let empty = page.layers.filter((layer) => layer.kind === "photo" && !layer.mediaRef);
  // Drop surplus empty frames, add missing ones.
  const surplus = new Set(empty.slice(Math.max(0, target - filled.length)).map((layer) => layer.id));
  page.layers = page.layers.filter((layer) => !surplus.has(layer.id));
  for (let i = filled.length + empty.length - surplus.size; i < target; i++)
    page.layers.push(photoLayer("", "slot"));
  return applyLayout(page, template, region);
}

// Fills empty frames in order; returns references that did not fit.
export function fillEmptySlots(page, references) {
  const queue = [...references];
  for (const layer of page.layers)
    if (layer.kind === "photo" && !layer.mediaRef && queue.length) {
      const next = queue.shift();
      layer.mediaRef = next.reference;
      layer.text = next.name || "photo";
      if (next.sourceRef) {
        layer.sourceRef = next.sourceRef;
        layer.edit = next.edit;
      }
    }
  return queue;
}

export function applyLayout(page, template, region) {
  const photos = page.layers.filter(framedPhoto);
  if (template === "smart") {
    // Photos keep their own shape; layoutVariant picks one of three looks.
    const variant = (Number(page.layoutVariant) || 0) % SMART_VARIANTS.length;
    const slots = smartLayout(photos.map((layer) => layer.aspect), variant);
    photos.forEach((layer, index) => Object.assign(layer, slots[index], { scale: 1, crop: { x: 50, y: 50, zoom: 1 } }));
    page.layoutTemplate = "smart";
    page.layoutVariant = variant;
    page.layoutEdited = false;
    return photos.length;
  }
  const slots = autoLayout(photos.length, template, region);
  photos.forEach((layer, index) => {
    Object.assign(layer, slots[index], { scale: 1 });
    layer.tape = Boolean(slots[index].tape);
  });
  page.layoutTemplate = template;
  page.layoutEdited = false;
  return photos.length;
}

export function freeMainPhoto(entry) {
  if (!entry.photo) return null;
  const layer = photoLayer(entry.photo, "main-photo", {
    x: 50,
    y: 32.5,
    w: 74,
    h: 47,
    rotation: -4,
    frame: "polaroid",
  });
  entry.layers.unshift(layer);
  entry.photo = "";
  return layer;
}

// Video / audio placed on the paper. The clip stays in page.media; the layer
// only references it, so removing it from the paper never deletes the file.
export function mediaLayer(clip, values = {}) {
  const video = clip.kind === "video";
  return {
    id: newId(),
    kind: video ? "video" : "audio",
    clipId: clip.id,
    text: clip.name || (video ? "video" : "audio"),
    x: 50,
    y: video ? 62 : 80,
    w: video ? 58 : 64,
    ...(video ? { h: 30 } : {}),
    scale: 1,
    rotation: video ? -2 : 2,
    ...values,
  };
}
export function isOnPage(page, clipId) {
  return page.layers.some((layer) => layer.clipId === clipId);
}
export function moveLayer(page, layerId, delta) {
  const index = page.layers.findIndex((layer) => layer.id === layerId);
  const next = Math.max(0, Math.min(page.layers.length - 1, index + delta));
  if (index < 0 || next === index) return false;
  const [layer] = page.layers.splice(index, 1);
  page.layers.splice(next, 0, layer);
  return true;
}

/* ---------- Habit journey (read like a book) ---------- */

const nextDay = (key) => {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// All check-ins of one habit in date order, with streaks and totals.
export function habitJourney(state, habitId, today) {
  const checks = state.checks
    .filter((check) => check.habitId === habitId)
    .sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0,
    run = 0,
    previous = null;
  for (const check of checks) {
    run = previous && nextDay(previous) === check.date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = check.date;
  }
  // Current streak counts back from today (or yesterday, if today is not done yet).
  const dates = new Set(checks.map((check) => check.date));
  let current = 0;
  let cursor = dates.has(today) ? today : null;
  if (!cursor) {
    const yesterday = new Date(`${today}T12:00:00`);
    yesterday.setDate(yesterday.getDate() - 1);
    const key = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    cursor = dates.has(key) ? key : null;
  }
  while (cursor && dates.has(cursor)) {
    current++;
    const back = new Date(`${cursor}T12:00:00`);
    back.setDate(back.getDate() - 1);
    cursor = `${back.getFullYear()}-${String(back.getMonth() + 1).padStart(2, "0")}-${String(back.getDate()).padStart(2, "0")}`;
  }
  return {
    checks,
    total: checks.length,
    minutes: checks.reduce((sum, check) => sum + (Number(check.minutes) || 0), 0),
    notes: checks.filter((check) => check.note?.trim()).length,
    longestStreak: longest,
    currentStreak: current,
    since: checks[0]?.date || null,
  };
}

/* ---------- Book shelves: one cover card per day ---------- */

// Days that have content in a book, newest first. Each day lists the day
// page (if it belongs to the book) and the Moments filed in that book.
export function bookDays(state, bookId, filter = {}) {
  const days = [];
  for (const entry of state.entries) {
    if (entry.isDemo === true) continue; // V10.41 (S1): sample days are not the person's
    const dayPage = entry.bookId === bookId && hasDayPageContent(entry);
    const moments = (entry.moments || []).filter((moment) => moment.bookId === bookId);
    if (!dayPage && !moments.length) continue;
    if (filter.date && entry.date !== filter.date) continue;
    if (!filter.date && filter.month && !entry.date.startsWith(filter.month)) continue;
    const photos = [
      ...(dayPage ? photoRefs({ photo: entry.photo, layers: entry.layers }) : []),
      ...moments.flatMap((moment) => photoRefs({ layers: moment.layers })),
    ];
    const clips = [...(dayPage ? entry.media || [] : []), ...moments.flatMap((moment) => moment.media || [])];
    days.push({ date: entry.date, entry, dayPage, moments, photos, clips });
  }
  return days.sort((a, b) => b.date.localeCompare(a.date));
}

export function bookMonths(state, bookId) {
  return [...new Set(bookDays(state, bookId).map((day) => day.date.slice(0, 7)))];
}
