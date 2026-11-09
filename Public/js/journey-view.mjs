import { presetLabel } from "./i18n.mjs";
// Growth "journey": read one habit's check-ins like a little book.
// Page 0 is the cover (totals, streaks); every later page is one check-in.
import { escapeHTML as esc } from "./personal-ui.mjs";
import { habitJourney } from "./day.mjs";

const themeIcon = (theme) =>
  ({ Learning: "📖", Fitness: "🌿", Wellness: "☁️", "Creative Life": "🎨" })[
    theme
  ] || "🌱";

export function journeyPageCount(state, habitId, today) {
  return habitJourney(state, habitId, today).total + 1;
}

function coverHTML(habit, journey, ctx, helpers) {
  const { t } = ctx;
  const stat = (value, label) =>
    `<div class="journey-stat"><b>${esc(value)}</b><span>${t(label)}</span></div>`;
  const recent = Array.from({ length: 28 }, (_, index) => {
    const date = helpers.addDays(helpers.today, index - 27);
    const done = journey.checks.find((check) => check.date === date);
    return `<i class="${done ? (done.note ? "noted" : "done") : ""}" title="${date}"></i>`;
  }).join("");
  return `<div class="journey-cover"><span class="journey-emblem">${themeIcon(habit.theme)}</span><p class="journey-eyebrow">${esc(presetLabel("theme.habit", habit.theme))} · ${t("journey.title")}</p><h2>${esc(habit.title)}</h2><p class="journey-since">${journey.since ? t("journey.since", { date: helpers.shortDate(journey.since) }) : t("journey.empty")}</p><div class="journey-stats">${stat(journey.total, "journey.total")}${stat(journey.minutes, "journey.minutes")}${stat(journey.currentStreak, "journey.current")}${stat(journey.longestStreak, "journey.longest")}${stat(journey.notes, "journey.notes")}</div><div class="journey-recent" aria-label="${t("journey.recent")}"><span>${t("journey.recent")}</span><div>${recent}</div></div>${journey.total ? `<p class="journey-hint">${t("journey.hint")}</p>` : ""}</div>`;
}

function checkPageHTML(habit, check, number, ctx, helpers) {
  const { t, media } = ctx;
  const photo = media.resolve(check.photo || "");
  const entry = ctx.state.entries.find((item) => item.date === check.date);
  return `<div class="journey-entry"><div class="journey-date"><b>${esc(helpers.shortDate(check.date))}</b><span>${esc(helpers.weekday(check.date))}</span>${check.mood ? `<i>${esc(check.mood)}</i>` : ""}</div><p class="journey-meta">${[check.detail, check.minutes ? t("growth.minutes", { count: check.minutes }) : ""].filter(Boolean).map(esc).join(" · ") || t("journey.done")}</p>${check.note ? `<blockquote class="journey-note">${esc(check.note)}</blockquote>` : `<p class="journey-no-note">${t("journey.noNote")}</p>`}${photo ? `<img class="journey-photo" src="${esc(photo)}" alt="" data-action="zoom-photo" data-src="${esc(photo)}" role="button" tabindex="0" aria-label="${t("day.zoomPhoto")}">` : ""}<div class="journey-actions"><button class="text-button" data-action="check-note" data-habit="${esc(habit.id)}" data-date="${check.date}">${t(check.note ? "growth.editNote" : "growth.addNote")}</button>${entry ? `<button class="text-button" data-action="open-day" data-date="${check.date}">${t("journey.openDay")}</button>` : ""}</div><span class="journey-page-no">${number}</span></div>`;
}

export function habitJourneyHTML(habitId, pageIndex, ctx, helpers) {
  const { state, t } = ctx;
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return `<div class="empty">${t("journey.missing")}</div>`;
  const journey = habitJourney(state, habitId, helpers.today);
  const pages = journey.total + 1;
  const index = Math.max(0, Math.min(pages - 1, pageIndex));
  const body =
    index === 0
      ? coverHTML(habit, journey, ctx, helpers)
      : checkPageHTML(habit, journey.checks[index - 1], index + 1, ctx, helpers);
  // Contents grouped by month, so any day can be opened directly.
  const months = new Map();
  journey.checks.forEach((check, i) => {
    const key = check.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push([check, i + 1]);
  });
  const contents = [...months]
    .reverse()
    .map(
      ([month, items]) =>
        `<div class="journey-month"><b>${esc(helpers.monthLabel(month))}</b><div>${items
          .map(
            ([check, page]) =>
              `<button class="journey-day ${page === index ? "current" : ""} ${check.note ? "noted" : ""}" data-action="journey-page" data-page="${page}" aria-label="${esc(check.date)}">${Number(check.date.slice(8))}</button>`,
          )
          .join("")}</div></div>`,
    )
    .join("");
  const todayCheck = journey.checks.find((check) => check.date === helpers.today);
  return `<article class="journey" data-journey="${esc(habitId)}"><header class="day-detail-top"><button class="back-button" data-action="journey-back">${helpers.icon("back")} ${t("growth.title")}</button><button class="primary" data-action="check-note" data-habit="${esc(habitId)}" data-date="${helpers.today}">${t(todayCheck ? "journey.editToday" : "journey.writeToday")}</button></header><div class="journey-book"><div class="journey-page ${index === 0 ? "cover" : ""}" data-journey-page="${index}">${body}</div><nav class="journey-nav" aria-label="${t("journey.pages")}"><button data-action="journey-page" data-page="${index - 1}" ${index === 0 ? "disabled" : ""} aria-label="${t("journey.prev")}">‹</button><span>${t("journey.pageOf", { page: index + 1, total: pages })}</span><button data-action="journey-page" data-page="${index + 1}" ${index >= pages - 1 ? "disabled" : ""} aria-label="${t("journey.next")}">›</button></nav></div>${contents ? `<section class="journey-contents"><h3>${t("journey.contents")}</h3>${contents}</section>` : ""}</article>`;
}
