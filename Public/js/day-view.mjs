// Calendar "Day Detail": a read-only, magazine-like view of a finished day.
import { canvasHTML, mediaCardHTML, growthCardInner } from "./canvas.mjs";
import { escapeHTML as esc, fieldLabel } from "./personal-ui.mjs";
import { fontFamily } from "./library.mjs";
import {
  hasDayPageContent,
  daySummary,
  findReflection,
  periodKey,
} from "./day.mjs";

function fieldsHTML(entry, ctx) {
  const book = ctx.state.books.find((item) => item.id === entry.bookId);
  const rows = (book?.fields || [])
    .map((field) => {
      const value = entry.fieldValues?.[field.id];
      if (value === "" || value == null || value === false) return "";
      let shown;
      if (field.type === "image") {
        const src = ctx.media.resolve(value);
        shown = src
          ? `<img src="${esc(src)}" alt="" data-action="zoom-photo" data-src="${esc(src)}" role="button" tabindex="0" aria-label="${ctx.t("day.zoomPhoto")}">`
          : "";
      } else if (field.type === "checkbox") shown = "✓";
      else shown = esc(value);
      return shown
        ? `<div><dt>${esc(fieldLabel(field, ctx.language))}</dt><dd>${shown}</dd></div>`
        : "";
    })
    .join("");
  return rows ? `<dl class="day-fields">${rows}</dl>` : "";
}

function bookBadge(bookId, ctx) {
  const book = ctx.state.books.find((item) => item.id === bookId);
  return book ? `<span class="day-book">📔 ${esc(book.title)}</span>` : "";
}

function pageBodyHTML(page, ctx) {
  return page.body?.trim()
    ? `<p class="day-body" style="font-family:${esc(fontFamily(page.bodyFont || page.font, ctx.catalog))}">${esc(page.body)}</p>`
    : "";
}

// Clips already placed on the paper play there; the list shows the rest.
function mediaListHTML(page, ctx) {
  const rest = (page.media || []).filter(
    (clip) => !(page.layers || []).some((layer) => layer.clipId === clip.id),
  );
  return rest.length
    ? `<div class="day-media">${rest.map((clip) => mediaCardHTML(clip, ctx, { editable: false })).join("")}</div>`
    : "";
}

export function momentChapterHTML(moment, index, ctx) {
  const { t } = ctx;
  return `<section class="moment-chapter" id="moment-${esc(moment.id)}" data-moment-view="${esc(moment.id)}"><div class="chapter-head"><span class="chapter-no">${t("moment.chapter", { number: String(index + 1).padStart(2, "0") })}</span>${moment.time ? `<span class="chapter-time">${esc(moment.time)}</span>` : ""}${moment.mood ? `<span class="chapter-mood">${esc(moment.mood)}</span>` : ""}</div><h2 class="chapter-title" style="font-family:${esc(fontFamily(moment.font, ctx.catalog))}">${esc(moment.title || t("moment.untitled"))}</h2>${moment.tags?.length ? `<div class="chapter-tags">${moment.tags.map((tag) => `<span>#${esc(tag)}</span>`).join("")}</div>` : ""}${moment.layoutTemplate === "text" || moment.layers?.some((layer) => !(layer.kind === "photo" && !layer.mediaRef)) ? `<div class="chapter-canvas">${canvasHTML(moment, ctx, { readOnly: true, dayPage: false })}</div>` : ""}${moment.layoutTemplate === "text" ? "" : pageBodyHTML(moment, ctx)}${mediaListHTML(moment, ctx)}<footer class="chapter-foot">${bookBadge(moment.bookId, ctx)}</footer></section>`;
}

function growthHTML(date, ctx) {
  const { state, t } = ctx;
  const checks = state.checks.filter((check) => check.date === date);
  const week = findReflection(state, "week", periodKey("week", date));
  if (!checks.length && !week) return "";
  const items = checks
    .map((check) => {
      const habit = state.habits.find((item) => item.id === check.habitId);
      const photo = ctx.media.resolve(check.photo || "");
      return `<li class="day-growth-item">${growthCardInner(check, habit, ctx)}${photo ? `<img class="growth-photo" src="${esc(photo)}" alt="" data-action="zoom-photo" data-src="${esc(photo)}" role="button" tabindex="0" aria-label="${t("day.zoomPhoto")}">` : ""}<button class="text-button" data-action="check-note" data-habit="${esc(check.habitId)}" data-date="${esc(date)}">${t(check.note ? "growth.editNote" : "growth.addNote")}</button></li>`;
    })
    .join("");
  const weekly = week
    ? `<div class="reflection-note small"><b>${t("reflection.weekOf", { date: week.key })}</b>${["wentWell", "challenges", "learned", "nextFocus"].map((key) => (week[key] ? `<p><span>${t("reflection." + key)}</span>${esc(week[key])}</p>` : "")).join("")}</div>`
    : "";
  return `<section class="day-growth"><div class="section-heading"><h2>🌱 ${t("day.growth")}</h2><span class="badge">${t("private")}</span></div>${items ? `<ul>${items}</ul>` : ""}${weekly}</section>`;
}

export function dayDetailHTML(date, ctx, helpers) {
  const { state, t } = ctx;
  const saved = state.entries.find((entry) => entry.date === date);
  const draft = state.drafts[date];
  const entry = saved || draft;
  const summary = daySummary(state, date);
  const stats = [
    summary.moments ? t("day.statMoments", { count: summary.moments }) : "",
    summary.photos ? t("day.statPhotos", { count: summary.photos }) : "",
    summary.videos ? t("day.statVideos", { count: summary.videos }) : "",
    summary.audios ? t("day.statAudios", { count: summary.audios }) : "",
    summary.growth ? t("day.statGrowth", { count: summary.growth }) : "",
  ].filter(Boolean);
  const dayPage =
    entry && hasDayPageContent(entry)
      ? `<section class="day-page"><div class="chapter-head"><span class="chapter-no">${t("day.cover")}</span>${entry.mood ? `<span class="chapter-mood">${esc(entry.mood)}</span>` : ""}</div><div class="chapter-canvas">${canvasHTML(entry, ctx, { readOnly: true, dayPage: true })}</div>${(entry.body || "").length > 60 || (entry.body || "").includes("\n") ? pageBodyHTML(entry, ctx) : ""}${fieldsHTML(entry, ctx)}${mediaListHTML(entry, ctx)}<footer class="chapter-foot">${bookBadge(entry.bookId, ctx)}${entry.isDemo ? `<span class="badge">${t("entry.sample")}</span>` : ""}</footer></section>`
      : "";
  const moments = (entry?.moments || [])
    .map((moment, index) => momentChapterHTML(moment, index, ctx))
    .join("");
  const growth = growthHTML(date, ctx);
  const banner =
    draft && saved
      ? `<div class="draft-banner">${t("day.draftPending")} <button class="text-button" data-action="edit-date" data-date="${date}">${t("day.continueDraft")}</button></div>`
      : draft
        ? `<div class="draft-banner">${t("day.draftOnly")}</div>`
        : "";
  const contents = (entry?.moments || []).length
    ? `<nav class="day-contents" aria-label="${t("day.contents")}">${entry.moments.map((moment, index) => `<button type="button" data-action="jump-moment" data-moment="${esc(moment.id)}"><span>${String(index + 1).padStart(2, "0")}</span>${esc(moment.time ? moment.time + " · " : "")}${esc(moment.title || t("moment.untitled"))}</button>`).join("")}</nav>`
    : "";
  const empty =
    !dayPage && !moments && !growth
      ? `<div class="empty">${t("calendar.empty")}<br><button class="primary" data-action="edit-date" data-date="${date}">${helpers.icon("plus")} ${t("calendar.add")}</button></div>`
      : "";
  return `<article class="day-detail"><header class="day-detail-top"><button class="back-button" data-action="day-back">${helpers.icon("back")} ${t("calendar.title")}</button><button class="primary" data-action="edit-date" data-date="${date}">${t("day.edit")}</button></header><div class="day-masthead"><span class="day-eyebrow">LITTLE DAYS · ${t("day.reading")}</span><h1>${esc(helpers.friendlyDate(date))}</h1>${stats.length ? `<p class="day-stats">${stats.map(esc).join(" · ")}</p>` : ""}<span class="day-seal">${esc(entry?.mood || "✿")}</span></div>${banner}${contents}${dayPage}${moments}<button class="moment-cta in-day" data-action="quick-moment" data-date="${date}"><span>✎</span><span><b>${t("moment.ctaDay")}</b><small>${t("moment.ctaHint")}</small></span><i>›</i></button>${growth}${empty}<p class="home-quote">Some days become memories. All days become you.</p></article>`;
}
