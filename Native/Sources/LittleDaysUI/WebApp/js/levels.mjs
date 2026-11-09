// Experience and levels, worked out from what a person has actually written
// on this device (nothing extra is stored; samples don't count). Community
// posts count too while the community is a local demo.
// Stationery-shop levels (not plants): from a first page to running the shop.
// The ids stay the same so earlier level-up notes still read correctly.
export const LEVELS = [
  { id: "seed", xp: 0, icon: "page" },
  { id: "sprout", xp: 30, icon: "note" },
  { id: "leaf", xp: 90, icon: "sticker" },
  { id: "bud", xp: 200, icon: "journal" },
  { id: "bloom", xp: 400, icon: "story" },
  { id: "garden", xp: 700, icon: "editor" },
  { id: "forest", xp: 1100, icon: "publisher" },
  { id: "meadow", xp: 1600, icon: "shop" },
];
export const XP_RULES = [
  { id: "activeDay", xp: 10 },
  { id: "page", xp: 5 },
  { id: "moment", xp: 3 },
  { id: "photo", xp: 1 },
  { id: "check", xp: 2 },
  { id: "note", xp: 3 },
  { id: "reflection", xp: 8 },
  { id: "post", xp: 15 },
];

const realPages = (state) => [
  ...(state.entries || []).filter((entry) => !entry.isDemo),
  ...Object.values(state.drafts || {}).filter(
    (draft) => !(state.entries || []).some((entry) => entry.date === draft.date && !entry.isDemo),
  ),
];
const hasDayContent = (entry) =>
  Boolean(entry.title?.trim() || entry.body?.trim() || entry.photo || entry.layers?.length || entry.media?.length);

function addDays(key, amount) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function experience(state, demo = null, today = null) {
  const pages = realPages(state);
  const moments = pages.flatMap((entry) => entry.moments || []);
  const allPages = [...pages, ...moments];
  const photos = allPages.reduce(
    (sum, page) => sum + (page.layers || []).filter((layer) => layer.kind === "photo" && layer.mediaRef).length + (page.photo ? 1 : 0),
    0,
  );
  const checks = state.checks || [];
  const reflections = (state.reflections || []).filter((item) =>
    ["wentWell", "challenges", "learned", "nextFocus"].some((key) => item[key]?.trim?.()),
  );
  const days = new Set([
    ...pages.filter((entry) => hasDayContent(entry) || entry.moments?.length).map((entry) => entry.date),
    ...checks.map((check) => check.date),
  ]);
  const counts = {
    activeDay: days.size,
    page: pages.filter(hasDayContent).length,
    moment: moments.filter((moment) => moment.title?.trim() || moment.body?.trim() || moment.layers?.length).length,
    // Photos give a little, up to 300 points, so writing still matters most.
    photo: Math.min(photos, 300),
    check: checks.length,
    note: checks.filter((check) => check.note?.trim()).length,
    reflection: reflections.length,
    post: (demo?.works || []).filter((work) => work.authorId === "me").length,
  };
  const breakdown = XP_RULES.map((rule) => ({ ...rule, count: counts[rule.id], points: counts[rule.id] * rule.xp }));
  const total = breakdown.reduce((sum, item) => sum + item.points, 0);
  let index = 0;
  while (index + 1 < LEVELS.length && total >= LEVELS[index + 1].xp) index++;
  const level = LEVELS[index],
    next = LEVELS[index + 1] || null;
  const progress = next ? (total - level.xp) / (next.xp - level.xp) : 1;
  // Days in a row up to today (or yesterday, so the streak isn't lost before writing today).
  let streak = 0;
  if (today) {
    let day = days.has(today) ? today : addDays(today, -1);
    while (days.has(day)) {
      streak++;
      day = addDays(day, -1);
    }
  }
  return { total, level, levelIndex: index, next, progress, toNext: next ? next.xp - total : 0, breakdown, activeDays: days.size, streak };
}
