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
export function createInitialState(seed, today = dateKey()) {
  return {
    schemaVersion: 1,
    habits: structuredClone(seed.habits),
    books: structuredClone(seed.books),
    checks: [],
    drafts: {},
    entries: seed.journals.map(({ dayOffset, ...entry }) => ({
      ...entry,
      date: addDays(today, dayOffset),
      layers: [],
      isDemo: true,
      updatedAt: new Date().toISOString(),
    })),
  };
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
    updatedAt: new Date().toISOString(),
  };
  const index = state.entries.findIndex((e) => e.date === saved.date);
  if (index >= 0) state.entries[index] = saved;
  else state.entries.push(saved);
  delete state.drafts[saved.date];
}
export class Store {
  constructor(storage, seed, today = dateKey()) {
    this.storage = storage;
    const raw = storage.getItem("little-days.v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.schemaVersion !== 1 ||
        !["entries", "habits", "checks", "books"].every((key) =>
          Array.isArray(parsed[key]),
        ) ||
        !parsed.drafts ||
        typeof parsed.drafts !== "object"
      )
        throw new Error("本地记录格式不兼容，请先备份浏览器数据。");
      this.state = parsed;
    } else this.state = createInitialState(seed, today);
  }
  update(change) {
    const next = structuredClone(this.state);
    change(next);
    // Write first: a storage failure must not be reported as a successful save.
    this.storage.setItem("little-days.v1", JSON.stringify(next));
    this.state = next;
  }
}
