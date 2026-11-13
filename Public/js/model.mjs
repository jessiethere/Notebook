import { smartLayout } from "./smart-layout.mjs";
import { storeMarks } from "./rich-text.mjs";
export function dateKey(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
export function addDays(key, amount) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}
export function weekStart(key) {
  const day = new Date(`${key}T12:00:00`).getDay();
  return addDays(key, -(day + 6) % 7);
}
export function weeklyCount(state, habitId, key) {
  const start = weekStart(key);
  return state.checks.filter(
    (c) =>
      c.habitId === habitId && c.date >= start && c.date <= addDays(start, 6),
  ).length;
}
// One scene a day for the sample page, the same all day long.
export function sceneOfDay(ids, day = dateKey()) {
  if (!ids?.length) return "";
  const n = Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000);
  return ids[((n % ids.length) + ids.length) % ids.length];
}
// Sample days (seed.sampleDays): a few pages over the past two weeks, so a
// new journal shows what the app can make. All marked isDemo — they are
// never shared, can be removed in Settings, and are added only to empty
// dates. state.samplesAdded remembers the version so they come back only
// once (and never after being removed).
export function addSampleDays(state, seed, today = dateKey()) {
  const version = Number(seed?.samplesVersion) || 0;
  if (!seed?.sampleDays?.length || (Number(state.samplesAdded) || 0) >= version) return 0;
  const taken = new Set([...state.entries.map((e) => e.date), ...Object.keys(state.drafts || {})]);
  let added = 0;
  for (const day of seed.sampleDays) {
    const date = addDays(today, day.dayOffset);
    if (taken.has(date) || state.entries.some((e) => e.id === day.id)) continue;
    const moments = day.pages.map((pageSeed, index) => {
      const moment = {
        id: `${day.id}-${index + 1}`,
        title: pageSeed.title || "",
        body: pageSeed.body || "",
        time: pageSeed.time || "",
        mood: "",
        tags: [],
        bookId: pageSeed.bookId,
        template: "minimal",
        font: "system",
        layers: [],
        media: [],
        layoutTemplate: pageSeed.layout === "smart" ? "smart" : pageSeed.layout === "line" ? "line" : "text",
        isDemo: true,
      };
      if (pageSeed.backdrop) moment.backdrop = pageSeed.backdrop;
      if (pageSeed.layout === "smart") {
        const photos = pageSeed.photos || [];
        moment.layoutVariant = pageSeed.variant || 0;
        const slots = smartLayout(photos.map(([, aspect]) => aspect), moment.layoutVariant);
        moment.layers = photos.map(([id, aspect], i) => ({ id: `${moment.id}-p${i + 1}`, kind: "photo", text: id, mediaRef: `photo:${id}`, aspect, scale: 1, crop: { x: 50, y: 50, zoom: 1 }, ...slots[i] }));
      }
      return moment;
    });
    state.entries.push({
      id: day.id,
      date,
      title: "",
      body: "",
      mood: day.mood || "",
      bookId: day.pages[0]?.bookId || "daily",
      photo: "",
      template: "minimal",
      font: "system",
      layers: [],
      media: [],
      moments,
      isDemo: true,
      updatedAt: new Date().toISOString(),
    });
    added++;
  }
  state.samplesAdded = version;
  return added;
}
// Removes every sample day (and sample drafts); the user's own days stay.
export function removeSamples(state) {
  const before = state.entries.length;
  state.entries = state.entries.filter((entry) => !entry.isDemo);
  for (const [date, draft] of Object.entries(state.drafts || {})) if (draft.isDemo) delete state.drafts[date];
  return before - state.entries.length;
}
export function createInitialState(seed, today = dateKey()) {
  return normalizeState({
    schemaVersion: 1,
    habits: structuredClone(seed.habits),
    books: structuredClone(seed.books),
    checks: [],
    drafts: {},
    entries: seed.journals.map(({ dayOffset, ...entry }) => ({
      ...entry,
      ...(entry.photo === "scene:daily" ? { photo: `scene:${sceneOfDay(seed.dailyScenes, today) || "coffee-morning"}` } : {}),
      date: addDays(today, dayOffset),
      layers: [],
      isDemo: true,
      updatedAt: new Date().toISOString(),
    })),
  });
}
const SAMPLE_COVER = { title: "把日子过成喜欢的样子", body: "一杯热咖啡，一点慢下来的时间。\n今天，也收集到了生活的小小美好。", photo: "/assets/coffee.jpg" };
export function normalizeState(value) {
  const result = structuredClone(value);
  const autoCover = { "Daily Life": ["floral-notebook", "tulip"], Travel: ["travel-album", "postcard"], Food: ["scrapbook-collage", "croissant"] };
  const sampleMagazine = { daily: "magazine-jp", travel: "magazine-west", food: "magazine-jp" };
  for (const book of result.books) {
    // The sample books once got these covers automatically; if they were never
    // changed (same template, sticker, no photo), they become magazine covers
    // one time (coverRestyled keeps a later choice of the old cover).
    const auto = autoCover[book.category];
    if (!book.coverRestyled && sampleMagazine[book.id] && !book.coverImage && auto && book.coverTemplate === auto[0] && (book.coverDecoration || auto[1]) === auto[1]) book.coverTemplate = sampleMagazine[book.id];
    if (sampleMagazine[book.id]) book.coverRestyled = true;
    book.visibility ||= "private";
    book.description ??= "";
    book.coverTemplate ||=
      book.category === "Travel"
        ? "travel-album"
        : book.category === "Food"
          ? "scrapbook-collage"
          : book.category === "Daily Life"
            ? "floral-notebook"
            : "minimal-linen";
    book.coverDecoration ||=
      book.category === "Travel"
        ? "postcard"
        : book.category === "Food"
          ? "croissant"
          : "tulip";
    book.coverFont ||= "elegant";
    book.fields ||= [];
  }
  for (const entry of [...result.entries, ...Object.values(result.drafts)]) {
    // The sample page briefly used a drawn scene; it goes back to the photo.
    if (entry.isDemo && entry.id === "sample-today" && /^scene:/.test(entry.photo || "")) entry.photo = "/assets/coffee.jpg";
    // Earlier, writing on the sample day kept the sample cover as my own. If
    // that cover is still exactly the sample, it is cleared (my pages stay).
    if (!entry.isDemo && entry.id === "sample-today" && entry.title === SAMPLE_COVER.title && (entry.body || "") === SAMPLE_COVER.body && entry.photo === SAMPLE_COVER.photo) {
      entry.title = "";
      entry.body = "";
      entry.photo = "";
    }
    entry.media ||= [];
    entry.fieldValues ||= {};
    entry.textStyle ||= { size: 20, color: "#2F2A26", weight: 400, spacing: 0 };
    entry.visibility ||= "private";
    entry.layers ||= [];
    // V3.1: a saved day is the date container for ordered Moments.
    entry.moments ||= [];
    for (const moment of entry.moments) normalizeMoment(moment, entry);
    tidyMarks(entry);
    // Only "draft" and "completed" are statuses; anything else is dropped (= completed).
    if (entry.status != null && entry.status !== "draft" && entry.status !== "completed") delete entry.status;
  }
  result.reflections ||= [];
  for (const check of result.checks) {
    // Growth notes are private unless the user explicitly opts in later.
    if (check.note != null || check.detail != null) check.shareNote ??= false;
  }
  return result;
}
// V10.6: formatting ranges are optional and never trusted — anything that
// does not fit the words is dropped; the words themselves are not touched.
function tidyMarks(page) {
  if (page.titleMarks != null) storeMarks(page, "titleMarks", page.titleMarks, String(page.title ?? "").length);
  if (page.bodyMarks != null) storeMarks(page, "bodyMarks", page.bodyMarks, String(page.body ?? "").length);
  for (const layer of page.layers || []) if (layer && layer.marks != null) storeMarks(layer, "marks", layer.marks, String(layer.text ?? "").length);
}
export function normalizeMoment(moment, entry = {}) {
  moment.title ??= "";
  moment.time ??= "";
  moment.body ??= "";
  moment.mood ??= "";
  moment.tags ||= [];
  moment.bookId ||= entry.bookId || "daily";
  moment.template ||= entry.template || "minimal";
  moment.font ||= entry.font || "serif";
  moment.layers ||= [];
  moment.media ||= [];
  moment.collapsed ??= false;
  moment.visibility = "private";
  tidyMarks(moment);
  return moment;
}
// The shelf order is the order of state.books (Home shows the same order).
// Puts a book just before (or after) another one; false if nothing moved.
export function moveBookTo(state, bookId, targetId, after = false) {
  const books = state.books || [];
  const from = books.findIndex((book) => book.id === bookId);
  if (from < 0 || bookId === targetId || !books.some((book) => book.id === targetId)) return false;
  const [book] = books.splice(from, 1);
  const at = books.findIndex((item) => item.id === targetId) + (after ? 1 : 0);
  books.splice(at, 0, book);
  return books.indexOf(book) !== from;
}
// One step earlier (-1) or later (+1) on the shelf.
export function stepBook(state, bookId, delta) {
  const books = state.books || [];
  const from = books.findIndex((book) => book.id === bookId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= books.length) return false;
  [books[from], books[to]] = [books[to], books[from]];
  return true;
}
// V7.6 book tags. Spaces separate tags ("阅读 感恩 健身"); a tag after "#"
// keeps its spaces ("#self awareness"); with commas (and no "#") commas
// separate and spaces stay ("self awareness, 健身"). No repeats (any case);
// at most 8 tags of at most 16 characters.
export function parseTags(text) {
  const input = String(text || "");
  const commas = /[,，、;；]/.test(input) && !/[#＃]/.test(input);
  const pieces = [];
  for (const [, hashed, plain] of input.matchAll(/[#＃]([^#＃,，、;；]+)|([^#＃,，、;；]+)/g)) {
    if (hashed) pieces.push(hashed);
    else if (commas) pieces.push(plain);
    else pieces.push(...plain.split(/\s+/));
  }
  const seen = new Set();
  const tags = [];
  for (const raw of pieces) {
    const tag = raw.replace(/\s+/g, " ").trim().slice(0, 16).trim();
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= 8) break;
  }
  return tags;
}
export function saveBook(state, book) {
  if (!book.title.trim() || !book.category.trim())
    throw new Error("error.bookRequired");
  if (book.tags != null) book = { ...book, tags: Array.isArray(book.tags) ? parseTags(book.tags.map((tag) => `#${tag}`).join("")) : parseTags(book.tags) };
  const index = state.books.findIndex((item) => item.id === book.id);
  const saved = { ...structuredClone(book), visibility: "private" };
  if (index < 0) state.books.push(saved);
  else state.books[index] = saved;
}
export function toggleCheck(state, habitId, date, minutes = 0) {
  if (!state.habits.some((h) => h.id === habitId))
    throw new Error("习惯不存在");
  const existing = state.checks.findIndex(
    (c) => c.habitId === habitId && c.date === date,
  );
  if (existing >= 0) state.checks.splice(existing, 1);
  else
    state.checks.push({
      habitId,
      date,
      minutes: Math.max(0, Math.round(Number(minutes) || 0)),
    });
}
// V10.7: a day's record is either still being made ("draft") or finished
// ("completed"). The status belongs to the whole record — the cover and all
// its pages together — never to one page. Records saved before V10.7 have no
// status and count as completed; a day that only exists in `drafts` (the
// autosave copy of a record never finished) counts as a draft.
export function entryStatus(state, date) {
  const saved = (state.entries || []).find((entry) => entry.date === date);
  if (saved) return saved.status === "draft" ? "draft" : "completed";
  return state.drafts?.[date] ? "draft" : null;
}
export function saveEntry(state, entry, status = "completed") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date))
    throw new Error("日期格式不正确");
  const saved = {
    ...structuredClone(entry),
    isDemo: false,
    visibility: "private",
    status: status === "draft" ? "draft" : "completed",
    updatedAt: new Date().toISOString(),
  };
  for (const moment of saved.moments || []) moment.visibility = "private";
  const index = state.entries.findIndex((e) => e.date === saved.date);
  if (index >= 0) state.entries[index] = saved;
  else state.entries.push(saved);
  delete state.drafts[saved.date];
}
export function validateStateSnapshot(value) {
  const object = (item) =>
    item !== null && typeof item === "object" && !Array.isArray(item);
  const text = (item) => typeof item === "string";
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !["books", "entries", "habits", "checks"].every((key) =>
      Array.isArray(value[key]),
    ) ||
    !object(value.drafts)
  )
    throw new Error("error.invalidData");
  for (const book of value.books) {
    if (
      !object(book) ||
      ![book.id, book.title, book.category].every(text) ||
      (book.fields != null && !Array.isArray(book.fields)) ||
      (book.tags != null && (!Array.isArray(book.tags) || !book.tags.every(text)))
    )
      throw new Error("error.invalidData");
  }
  for (const book of value.books)
    for (const field of book.fields || []) {
      if (
        !object(field) ||
        ![field.id, field.label, field.type].every(text) ||
        ![
          "text",
          "number",
          "date",
          "select",
          "checkbox",
          "duration",
          "image",
        ].includes(field.type) ||
        (field.options != null &&
          (!Array.isArray(field.options) || !field.options.every(text)))
      )
        throw new Error("error.invalidData");
    }
  const pages = [];
  for (const entry of [...value.entries, ...Object.values(value.drafts)]) {
    if (
      !object(entry) ||
      ![entry.id, entry.date, entry.title, entry.body].every(text) ||
      (entry.layers != null && !Array.isArray(entry.layers)) ||
      (entry.media != null && !Array.isArray(entry.media)) ||
      (entry.moments != null && !Array.isArray(entry.moments)) ||
      (entry.fieldValues != null && !object(entry.fieldValues)) ||
      (entry.updatedAt != null && !text(entry.updatedAt))
    )
      throw new Error("error.invalidData");
    pages.push(entry);
    const momentIds = new Set();
    for (const moment of entry.moments || []) {
      if (
        !object(moment) ||
        !text(moment.id) ||
        momentIds.has(moment.id) ||
        ![moment.title ?? "", moment.body ?? "", moment.time ?? ""].every(
          text,
        ) ||
        (moment.tags != null &&
          (!Array.isArray(moment.tags) || !moment.tags.every(text))) ||
        (moment.layers != null && !Array.isArray(moment.layers)) ||
        (moment.media != null && !Array.isArray(moment.media))
      )
        throw new Error("error.invalidData");
      momentIds.add(moment.id);
      pages.push(moment);
    }
  }
  for (const entry of pages) {
    for (const clip of entry.media || [])
      if (
        !object(clip) ||
        ![clip.id, clip.kind, clip.source, clip.name, clip.mime].every(text) ||
        !["audio", "video"].includes(clip.kind)
      )
        throw new Error("error.invalidData");
    for (const layer of entry.layers || []) {
      if (
        !object(layer) ||
        ![layer.id, layer.text].every(text) ||
        ![layer.x, layer.y, layer.scale, layer.rotation].every(
          Number.isFinite,
        ) ||
        ["w", "h"].some(
          (key) => layer[key] != null && !Number.isFinite(layer[key]),
        ) ||
        (layer.crop != null &&
          (!object(layer.crop) ||
            ![layer.crop.x, layer.crop.y, layer.crop.zoom].every(
              Number.isFinite,
            )))
      )
        throw new Error("error.invalidData");
    }
  }
  for (const habit of value.habits) {
    if (
      !object(habit) ||
      ![habit.id, habit.title, habit.theme, habit.kind].every(text) ||
      !["completion", "duration"].includes(habit.kind) ||
      !Number.isInteger(habit.target) ||
      habit.target < 1 ||
      habit.target > 7 ||
      !Number.isFinite(habit.minutes)
    )
      throw new Error("error.invalidData");
  }
  for (const check of value.checks) {
    if (
      !object(check) ||
      ![check.habitId, check.date].every(text) ||
      !Number.isFinite(check.minutes) ||
      ["note", "detail", "mood", "photo"].some(
        (key) => check[key] != null && !text(check[key]),
      )
    )
      throw new Error("error.invalidData");
  }
  if (value.reflections != null) {
    if (!Array.isArray(value.reflections)) throw new Error("error.invalidData");
    for (const reflection of value.reflections)
      if (
        !object(reflection) ||
        ![reflection.id, reflection.period, reflection.key].every(text) ||
        !["week", "month"].includes(reflection.period) ||
        ["wentWell", "challenges", "learned", "nextFocus"].some(
          (key) => reflection[key] != null && !text(reflection[key]),
        )
      )
        throw new Error("error.invalidData");
  }
  const checkKeys = (item) => {
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      if (["__proto__", "prototype", "constructor"].includes(key))
        throw new Error("error.invalidData");
      checkKeys(child);
    }
  };
  checkKeys(value);
  return value;
}
export const MIRROR_OFF_KEY = "little-days.v1-mirror"; // "off": LocalStorage was full
export class Store {
  // options.durableRaw: the copy read from IndexedDB at start (V7.5);
  // options.persist(raw): writes a new copy there (returns a promise);
  // options.onPersistError(error): that write failed.
  constructor(storage, seed, today = dateKey(), options = {}) {
    this.storage = storage;
    this.persist = options.persist || null;
    this.onPersistError = options.onPersistError || (() => {});
    this.mirror = storage.getItem(MIRROR_OFF_KEY) !== "off";
    const local = this.mirror ? storage.getItem("little-days.v1") : null;
    // LocalStorage is written first on every save, so while it has a copy it
    // is the newest; without one, the IndexedDB copy is the journal.
    // A1: options.useDurable — the person chose the earlier IndexedDB copy
    // because the LocalStorage copy is damaged (it was kept aside first).
    const raw = options.useDurable ? options.durableRaw || null : local || options.durableRaw || null;
    this.baselineRaw = local;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.schemaVersion !== 1 ||
        !["entries", "habits", "checks", "books"].every((key) =>
          Array.isArray(parsed[key]),
        ) ||
        !parsed.drafts ||
        Array.isArray(parsed.drafts) ||
        typeof parsed.drafts !== "object"
      )
        throw new Error("本地记录格式不兼容，请先备份浏览器数据。");
      this.state = normalizeState(validateStateSnapshot(parsed));
      // First start after the upgrade: copy the journal into IndexedDB.
      if (this.persist && raw !== options.durableRaw) this.save(raw);
    } else this.state = createInitialState(seed, today);
    if (addSampleDays(this.state, seed, today)) this.state = normalizeState(this.state);
  }
  save(encoded) {
    if (!this.persist) return;
    let write;
    try {
      write = Promise.resolve(this.persist(encoded));
    } catch (error) {
      write = Promise.reject(error);
    }
    // A2: remember the newest durable write, so "saved" is only shown once
    // it has really finished (stored() resolves true) — not when it started.
    const tracked = write.then(
      () => true,
      (error) => {
        this.onPersistError(error);
        return false;
      },
    );
    this.lastWrite = tracked;
  }
  // true once the newest change is in the durable store (or there is none to
  // wait for); false when that write failed.
  stored() {
    return this.lastWrite || Promise.resolve(true);
  }
  update(change) {
    if (this.mirror && this.storage.getItem("little-days.v1") !== this.baselineRaw) {
      const error = new Error("error.conflict");
      error.code = "stale-state";
      throw error;
    }
    const next = structuredClone(this.state);
    change(next);
    validateStateSnapshot(next);
    // Write first: a storage failure must not be reported as a successful save.
    const encoded = JSON.stringify(next);
    if (this.mirror) {
      try {
        this.storage.setItem("little-days.v1", encoded);
        this.baselineRaw = encoded;
      } catch (error) {
        // LocalStorage is full: with IndexedDB the journal carries on there.
        if (!this.persist) throw error;
        this.mirror = false;
        this.baselineRaw = null;
        try {
          this.storage.removeItem("little-days.v1");
          this.storage.setItem(MIRROR_OFF_KEY, "off");
        } catch {}
      }
    }
    this.save(encoded);
    this.state = next;
  }
}
