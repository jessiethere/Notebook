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
export function normalizeState(value) {
  const result = structuredClone(value);
  for (const book of result.books) {
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
    entry.media ||= [];
    entry.fieldValues ||= {};
    entry.textStyle ||= { size: 20, color: "#2F2A26", weight: 400, spacing: 0 };
    entry.visibility ||= "private";
    entry.layers ||= [];
    // V3.1: a saved day is the date container for ordered Moments.
    entry.moments ||= [];
    for (const moment of entry.moments) normalizeMoment(moment, entry);
  }
  result.reflections ||= [];
  for (const check of result.checks) {
    // Growth notes are private unless the user explicitly opts in later.
    if (check.note != null || check.detail != null) check.shareNote ??= false;
  }
  return result;
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
  return moment;
}
export function saveBook(state, book) {
  if (!book.title.trim() || !book.category.trim())
    throw new Error("error.bookRequired");
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
export function saveEntry(state, entry) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date))
    throw new Error("日期格式不正确");
  const saved = {
    ...structuredClone(entry),
    isDemo: false,
    visibility: "private",
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
      (book.fields != null && !Array.isArray(book.fields))
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
export class Store {
  constructor(storage, seed, today = dateKey()) {
    this.storage = storage;
    const raw = storage.getItem("little-days.v1");
    this.baselineRaw = raw;
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
    } else this.state = createInitialState(seed, today);
  }
  update(change) {
    if (this.storage.getItem("little-days.v1") !== this.baselineRaw) {
      const error = new Error("error.conflict");
      error.code = "stale-state";
      throw error;
    }
    const next = structuredClone(this.state);
    change(next);
    validateStateSnapshot(next);
    // Write first: a storage failure must not be reported as a successful save.
    const encoded = JSON.stringify(next);
    this.storage.setItem("little-days.v1", encoded);
    this.baselineRaw = encoded;
    this.state = next;
  }
}
