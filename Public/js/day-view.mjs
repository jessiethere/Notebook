import { dayCounts, isDayCover } from "./pages.mjs";
// Calendar "Day Detail": a read-only, magazine-like view of a finished day.
import { richHTML } from "./rich-text.mjs";
import { pageLine, pageCoverRef } from "./page-label.mjs";
import { findTrack, musicChipHTML, dayMusic } from "./music.mjs";
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
    ? `<p class="day-body" style="font-family:${esc(fontFamily(page.bodyFont || page.font, ctx.catalog))}">${richHTML(page.body, page.bodyMarks, esc)}</p>`
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

export function momentChapterHTML(moment, index, ctx, date = "") {
  const { t } = ctx;
  // Reading, with a way to change it: double-click (or tap, when untitled)
  // the title to write one; ⋯ for edit / delete.
  const title = moment.title
    ? esc(moment.title)
    : `<span class="title-add">＋ ${t("read.addTitle")}</span>`;
  return `<section class="moment-chapter" id="moment-${esc(moment.id)}" data-moment-view="${esc(moment.id)}"><div class="chapter-head"><span class="chapter-no">${t("moment.chapter", { number: String(index + 1).padStart(2, "0") })}</span>${moment.time ? `<span class="chapter-time">${esc(moment.time)}</span>` : ""}${moment.mood ? `<span class="chapter-mood">${esc(moment.mood)}</span>` : ""}${moment.music && moment.music !== ctx.dayMusic ? musicChipHTML(findTrack(ctx.catalog, moment.music), ctx) : ""}${date && !moment.isDemo ? `<button class="chapter-edit" data-action="read-edit" data-date="${esc(date)}" data-moment="${esc(moment.id)}" aria-label="${t("read.edit")}">✎ ${t("day.edit")}</button>` : ""}${date ? `<button class="chapter-more" data-action="page-menu" data-date="${esc(date)}" data-moment="${esc(moment.id)}" aria-label="${t("read.more")}">⋯</button>` : ""}</div><h2 class="chapter-title ${moment.title ? "" : "untitled"}" ${date ? `data-title-edit data-date="${esc(date)}" data-moment="${esc(moment.id)}" tabindex="0" title="${t("read.titleHint")}"` : ""} style="font-family:${esc(fontFamily(moment.font, ctx.catalog))}">${title}</h2>${moment.tags?.length ? `<div class="chapter-tags">${moment.tags.map((tag) => `<span>#${esc(tag)}</span>`).join("")}</div>` : ""}${moment.layoutTemplate === "text" || moment.layoutTemplate === "line" || moment.backdrop || moment.layers?.some((layer) => !(layer.kind === "photo" && !layer.mediaRef)) ? `<div class="chapter-canvas">${canvasHTML(moment, ctx, { readOnly: true, dayPage: false })}</div>` : ""}${moment.layoutTemplate === "text" || moment.layoutTemplate === "line" ? "" : pageBodyHTML(moment, ctx)}${mediaListHTML(moment, ctx)}<footer class="chapter-foot">${bookBadge(moment.bookId, ctx)}${moment.isDemo ? `<span class="badge">${t("entry.sample")}</span>` : ""}</footer></section>`;
}

function growthHTML(date, ctx) {
  const { state, t } = ctx;
  const checks = state.checks.filter((check) => check.date === date);
  const week = findReflection(state, "week", periodKey("week", date));
  // V6.6 "today's list": the habits checked and the things done that day.
  const done = (state.plans?.[date] || []).filter((p) => p?.done && typeof p.text === "string");
  if (!checks.length && !week && !done.length) return "";
  // One quiet list: habits checked and things done look the same (✓ rows);
  // a habit's row opens its note (or asks for one).
  const items = checks
    .map((check) => {
      const habit = state.habits.find((item) => item.id === check.habitId);
      if (!habit) return "";
      const photo = ctx.media.resolve(check.photo || "");
      const facts = [check.minutes ? t("growth.minutes", { count: check.minutes }) : "", check.detail || ""].filter(Boolean).join(" · ");
      const has = check.note || check.photo || check.detail;
      return `<li><button class="check-line" data-action="${has ? "check-view" : "check-note"}" data-habit="${esc(check.habitId)}" data-date="${esc(date)}"><i aria-hidden="true">✓</i><span><b>${esc(habit.title)}</b>${facts ? `<small>${esc(facts)}</small>` : ""}${check.note ? `<em>“${esc(check.note.slice(0, 60))}”</em>` : ""}</span>${photo ? `<img src="${esc(photo)}" alt="">` : ""}<span class="check-line-go" aria-label="${t(check.note ? "growth.editNote" : "growth.addNote")}">${check.mood ? esc(check.mood) : "›"}</span></button></li>`;
    })
    .join("");
  const weekly = week
    ? `<div class="reflection-note small"><b>${t("reflection.weekOf", { date: week.key })}</b>${["wentWell", "challenges", "learned", "nextFocus"].map((key) => (week[key] ? `<p><span>${t("reflection." + key)}</span>${esc(week[key])}</p>` : "")).join("")}</div>`
    : "";
  const plans = done.map((p) => `<li><span class="check-line"><i aria-hidden="true">✓</i><span><b>${esc(p.text)}</b></span></span></li>`).join("");
  return `<section class="day-growth today-list-card"><span class="checklist-tape" aria-hidden="true"></span><div class="section-heading"><h2>${t("day.checklist")}</h2><span class="badge">${t("private")}</span></div>${items || plans ? `<ul class="day-checklist">${items}${plans}</ul>` : ""}${weekly}</section>`;
}

export function dayDetailHTML(date, ctx, helpers) {
  const { state, t } = ctx;
  const saved = state.entries.find((entry) => entry.date === date);
  const draft = state.drafts[date];
  const entry = saved || draft;
  const summary = daySummary(state, date, { samples: true });
  const pagesHere = dayCounts(state, date, { samples: entry && entry.isDemo === true ? "only" : "exclude" }).pages;
  const stats = [
    // V10.41 (counts): pages (the day's own page if shown + its Moment pages), as labelled.
    pagesHere ? t("day.statMoments", { count: pagesHere }) : "",
    summary.photos ? t("day.statPhotos", { count: summary.photos }) : "",
    summary.videos ? t("day.statVideos", { count: summary.videos }) : "",
    summary.audios ? t("day.statAudios", { count: summary.audios }) : "",
    summary.growth ? t("day.statGrowth", { count: summary.growth }) : "",
  ].filter(Boolean);
  // D3 (V10.44): a hidden day cover is not shown; a quiet row brings it back.
  const coverHidden = entry && isDayCover(entry) && entry.dayCoverHidden === true;
  const dayPage = coverHidden
    ? `<p class="day-cover-hidden"><span>${t("cover.hiddenNote")}</span><button class="text-button" data-action="day-cover-toggle" data-date="${esc(date)}" data-hide="">${t("cover.show")}</button></p>`
    : entry && hasDayPageContent(entry)
      ? `<section class="day-page"><div class="chapter-head"><span class="chapter-no">${t("day.cover")}</span><span class="chapter-time">${t("cover.what")}</span>${entry.isDemo ? "" : `<button class="chapter-edit" data-action="read-edit" data-date="${esc(date)}" data-moment="" aria-label="${t("read.edit")}">✎ ${t("day.edit")}</button>`}<button class="chapter-more" data-action="page-menu" data-date="${esc(date)}" data-moment="" aria-label="${t("read.more")}">⋯</button>${entry.mood ? `<span class="chapter-mood">${esc(entry.mood)}</span>` : ""}</div><div class="chapter-canvas">${canvasHTML(entry, ctx, { readOnly: true, dayPage: true })}</div>${(entry.body || "").length > 60 || (entry.body || "").includes("\n") ? pageBodyHTML(entry, ctx) : ""}${fieldsHTML(entry, ctx)}${mediaListHTML(entry, ctx)}<footer class="chapter-foot">${bookBadge(entry.bookId, ctx)}${entry.isDemo ? `<span class="badge">${t("entry.sample")}</span>` : ""}</footer></section>`
      : "";
  // The day's music plays while it is read; a page with another piece has its own chip.
  const music = findTrack(ctx.catalog, dayMusic(entry, state.books));
  const moments = (entry?.moments || [])
    .map((moment, index) => momentChapterHTML(moment, index, { ...ctx, dayMusic: music?.id || "" }, date))
    .join("");
  const growth = growthHTML(date, ctx);
  // V10.7: a record still being made says so, quietly, with a way back in.
  const resume = `<button class="text-button" data-action="draft-continue" data-date="${date}">${t("day.continueDraft")} ›</button>`;
  const banner =
    draft && saved
      ? `<div class="draft-banner">${t("day.draftPending")} ${resume}</div>`
      : draft || saved?.status === "draft"
        ? `<div class="draft-banner is-draft"><span class="draft-tag">${t("status.draft")}</span>${t("day.draftOnly")} ${resume}</div>`
        : "";
  const contents = (entry?.moments || []).length
    ? `<div class="day-pages-head"><b>${t("day.pagesCount", { count: entry.moments.length })}</b><button class="text-button" data-action="pages-manage" data-date="${date}">${t("pages.manage")}</button></div><nav class="day-contents" aria-label="${t("day.contents")}">${entry.moments.map((moment, index) => `<button type="button" data-action="read-page" data-date="${esc(date)}" data-moment="${esc(moment.id)}"><span>${String(index + 1).padStart(2, "0")}</span>${(() => { const src = pageCoverRef(moment) ? ctx.media?.resolve?.(pageCoverRef(moment)) : ""; return src ? `<img class="day-contents-thumb" src="${esc(src)}" alt="" loading="lazy">` : `<i class="day-contents-thumb words" aria-hidden="true"></i>`; })()}<b>${esc(pageLine(moment, { t, index }))}</b></button>`).join("")}</nav>`
    : "";
  const empty =
    !dayPage && !moments && !growth
      ? `<div class="empty">${t("calendar.empty")}<br><button class="primary" data-action="edit-date" data-date="${date}">${helpers.icon("plus")} ${t("calendar.add")}</button></div>`
      : "";
  return `<article class="day-detail"><header class="day-detail-top"><button class="back-button" data-action="day-back">${helpers.icon("back")} ${t("calendar.title")}</button><button class="primary" data-action="edit-date" data-date="${date}">${t("day.edit")}</button></header><div class="day-masthead"><span class="day-eyebrow">CAPIDAY · ${t("day.reading")}</span><h1>${esc(helpers.friendlyDate(date))}</h1>${stats.length ? `<p class="day-stats">${stats.map(esc).join(" · ")}</p>` : ""}${music ? `<div class="day-music">${musicChipHTML(music, ctx)}</div>` : ""}<span class="day-seal">${esc(entry?.mood || "✿")}</span></div>${banner}${contents}${dayPage}${moments}${growth}<button class="moment-cta in-day" data-action="quick-open" data-date="${date}"><span>✎</span><span><b>${t("moment.ctaDay")}</b><small>${t("moment.ctaHint")}</small></span><i>›</i></button>${empty}<p class="home-quote">Some days become memories. All days become you.</p></article>`;
}
