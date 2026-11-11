// A gentle streak: days in a row with at least one page, where one missed
// day a week is a rest day and does not break it (two missed days in a row
// do). Sample days never count. Worked out from the journal itself — nothing
// extra is stored except which day was last celebrated (a local nicety).
import { addDays, weekStart } from "./model.mjs";
import { hasDayPageContent, hasMomentContent } from "./day.mjs";

export const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];
export const CELEBRATED_KEY = "little-days.celebrated";

// Dates (YYYY-MM-DD) with something written, saved or still a draft.
export function recordedDays(state) {
  const days = new Set();
  const visit = (entry) => {
    if (!entry || entry.isDemo) return;
    if (hasDayPageContent(entry) || (entry.moments || []).some((moment) => !moment.isDemo && hasMomentContent(moment))) days.add(entry.date);
  };
  for (const entry of state.entries || []) visit(entry);
  for (const draft of Object.values(state.drafts || {})) visit(draft);
  return days;
}

// The streak ending today (or yesterday, if today has nothing yet).
export function streakInfo(days, today) {
  let day = days.has(today) ? today : addDays(today, -1);
  let count = 0,
    lastRest = null,
    rests = 0;
  // Walk back through the run; a single gap uses the week's rest day.
  for (let guard = 0; guard < 4000; guard++) {
    if (days.has(day)) {
      count++;
      day = addDays(day, -1);
      continue;
    }
    const before = addDays(day, -1);
    const restAllowed = days.has(before) && count > 0 && (!lastRest || daysBetween(day, lastRest) >= 7);
    if (!restAllowed) break;
    lastRest = day;
    rests++;
    day = before;
  }
  const start = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => days.has(addDays(start, i)));
  return {
    streak: count,
    restsUsed: rests,
    today: days.has(today),
    week,
    weekCount: week.filter(Boolean).length,
    milestone: MILESTONES.includes(count) ? count : 0,
    next: MILESTONES.find((m) => m > count) || null,
  };
}
function daysBetween(a, b) {
  return Math.round(Math.abs(Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);
}
// The longest run in the whole journal (same rest-day rule).
export function bestStreak(days) {
  let best = 0;
  for (const day of days) {
    if (days.has(addDays(day, 1))) continue; // only check the end of each run
    best = Math.max(best, streakInfo(days, day).streak);
  }
  return best;
}
