// V3.1 pure helpers: a Day (Entry) contains ordered Moments; Growth checks
// stay unique per (habitId, date) and can carry private reflections.
import { normalizeMoment } from "./model.mjs";

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
      mood: draft.mood || "☀️",
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

export function daySummary(state, date) {
  const entry = state.entries.find((item) => item.date === date);
  const clips = clipsOf(entry);
  const checks = state.checks.filter((check) => check.date === date);
  return {
    entry,
    photos: photoRefs(entry).length,
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
      entry.bookId === bookId ||
      (entry.moments || []).some((moment) => moment.bookId === bookId),
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

export const LAYOUT_TEMPLATES = ["duo", "trio", "grid", "polaroid", "collage"];
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
  if (template === "duo") {
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
export function applyLayout(page, template, region) {
  const photos = page.layers.filter((layer) => layer.kind === "photo");
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

export function moveLayer(page, layerId, delta) {
  const index = page.layers.findIndex((layer) => layer.id === layerId);
  const next = Math.max(0, Math.min(page.layers.length - 1, index + delta));
  if (index < 0 || next === index) return false;
  const [layer] = page.layers.splice(index, 1);
  page.layers.splice(next, 0, layer);
  return true;
}
