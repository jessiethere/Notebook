import { MediaStore, migrateLegacyPhotos } from "./js/media.mjs";
import {
  configureI18n,
  t,
  locale,
  languageCode,
  setLanguage,
} from "./js/i18n.mjs";
import {
  fontFamily,
  stickerURL,
  validateFieldDefinitions,
} from "./js/library.mjs";
import {
  coverHTML,
  bookDialogHTML,
  fieldDefinitionHTML,
  customFieldsHTML,
  mediaPanelHTML,
  settingsHTML,
  fieldLabel,
} from "./js/personal-ui.mjs";
import { loadImage, exportJournalImage } from "./js/export.mjs";
import {
  canvasHTML as sharedCanvasHTML,
  layerGeometry,
  cropStyle,
  cropOf,
  formatDuration,
  growthCardInner,
} from "./js/canvas.mjs";
import { dayDetailHTML } from "./js/day-view.mjs";
import { habitJourneyHTML, journeyPageCount } from "./js/journey-view.mjs";
import { communityHTML } from "./js/community-view.mjs";
import * as Community from "./js/community.mjs";
import {
  createMoment,
  findMoment,
  moveMoment,
  duplicateMoment,
  removeMoment,
  saveMoment,
  hasDayPageContent,
  hasMomentContent,
  coverPhoto,
  clipsOf,
  daySummary,
  bookPages,
  bookDays,
  bookMonths,
  bookEntryCount,
  saveCheckReflection,
  saveReflection,
  findReflection,
  periodKey,
  LAYOUT_TEMPLATES,
  PHOTO_FRAMES,
  suggestLayout,
  applyLayout,
  applyPageTemplate,
  fillEmptySlots,
  TEMPLATES_BY_COUNT,
  photoLayer,
  freeMainPhoto,
  moveLayer,
} from "./js/day.mjs";
import {
  Store,
  dateKey,
  addDays,
  weekStart,
  weeklyCount,
  toggleCheck,
  saveEntry,
  saveBook,
  normalizeState,
} from "./js/model.mjs";

// The iOS Swift shell opens index.html?shell=ios (and also injects this marker).
if (new URLSearchParams(location.search).get("shell") === "ios")
  document.documentElement.dataset.shell = "ios";
const $ = (selector) => document.querySelector(selector);
const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const id = () => crypto.randomUUID();
const paths = {
  house: "M3 10 12 3l9 7M5 9v11h5v-7h4v7h5V9",
  calendar: "M4 5h16v16H4zM7 3v5M17 3v5M4 10h16M8 14h1M14 14h1M8 18h1",
  plus: "M12 5v14M5 12h14",
  leaf: "M20 3C10 2 3 7 5 15c7 6 16-1 15-12ZM4 21 15 9M8 15l5 1",
  book: "M4 3h12a3 3 0 0 1 3 3v15H6a3 3 0 0 1-3-3V5a2 2 0 0 1 1-2ZM7 3v18M3 17h16",
  photo: "M3 5h18v15H3zM7 9h.01M3 17l6-6 5 5 3-3 4 4",
  text: "M5 5h14M12 5v15M8 20h8",
  smile:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8 9h.01M16 9h.01M8 14c2 3 6 3 8 0",
  check: "m5 12 4 4L19 6",
  arrow: "m9 5 7 7-7 7",
  back: "m15 5-7 7 7 7",
  undo: "M8 4 3 9l5 5M3 9h10a7 7 0 0 1 7 7",
  redo: "m16 4 5 5-5 5M21 9H11a7 7 0 0 0-7 7",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
  users:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.spark}"/></svg>`;
const friendlyDate = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(locale(), {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
const shortDate = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(locale(), {
    month: "long",
    day: "numeric",
  });
const themeIcon = (theme) =>
  ({ Learning: "📖", Fitness: "🌿", Wellness: "☁️", "Creative Life": "🎨" })[
    theme
  ] || "🌱";
let media = new MediaStore(),
  catalog,
  bookDraft = null,
  materialCategory = "animals",
  busyMedia = false,
  recorder = null,
  recordingStream = null,
  recordingTimer = null,
  recordingTimeout = null,
  recordingStarted = 0,
  attachmentTarget = null,
  recordingTargetId = null;
// Object URL scopes that finished loading; a view shows "loading" until then.
const readyScopes = new Set();
let activeMomentId = null,
  demoSocial = null,
  communityView = {
    tab: "discover",
    feed: "all",
    peopleQuery: "",
    savedType: "",
    editProfile: false,
    workId: null,
    chatUser: null,
    period: "week",
    category: null,
    query: "",
    publish: null,
    saveMenu: false,
    reportMenu: false,
    replyTo: null,
  },
  bookFilter = { month: "", date: "" },
  journeyHabit = null,
  journeyPage = 0,
  studioTool = null,
  templateCount = null,
  previewLarge = false,
  cropMode = false,
  scopedPage = null;
const safePhoto = (photo) => media.resolve(photo);
const ctx = () => ({
  catalog,
  tokens,
  media,
  t,
  state: state(),
  language: languageCode(),
  locale: locale(),
  mediaReady: () => readyScopes.has(page),
});
let store, features, tokens;
let page = "home",
  selectedDate = dateKey(),
  month = new Date(`${dateKey()}T12:00:00`),
  calendarMode = "memory",
  selectedBook = null;
let editor = null,
  editorMode = "quick",
  materialStyle = "cute",
  selectedLayer = null,
  history = [],
  future = [],
  draftTimer,
  draftDirty = false;
let dialogKind = null,
  dialogPayload = null,
  toastTimer;
const state = () => store.state;
const todayEntry = () =>
  state().entries.find((entry) => entry.date === dateKey());

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
function flushDraft() {
  clearTimeout(draftTimer);
  if (!editor || !draftDirty) return;
  store.update((s) => {
    s.drafts[editor.date] = structuredClone(editor);
  });
  draftDirty = false;
  if ($("#draft-status"))
    $("#draft-status").textContent = t("草稿已保存在本机");
}
function scheduleDraft() {
  draftDirty = true;
  if ($("#draft-status")) $("#draft-status").textContent = t("正在保存草稿…");
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try {
      flushDraft();
    } catch (error) {
      toast(
        error.code === "stale-state"
          ? t("error.conflict")
          : t("保存失败：浏览器空间不足，请先导出图片或备份记录。"),
      );
      if ($("#draft-status"))
        $("#draft-status").textContent = t("草稿未保存，请勿关闭页面");
    }
  }, 450);
}
function changeEditor(change, redraw = true) {
  history.push(structuredClone(editor));
  if (history.length > 30) history.shift();
  future = [];
  change(editor);
  scheduleDraft();
  if (redraw) render();
  else updateCanvas();
}
function navigate(target) {
  flushDraft();
  if (target === "studio") {
    openStudio(dateKey());
    return;
  }
  page = target;
  selectedBook = null;
  render();
  $("#app-scroll").scrollTop = 0;
}
function openStudio(date = dateKey()) {
  flushDraft();
  selectedDate = date;
  const existing =
    state().drafts[date] ||
    state().entries.find((entry) => entry.date === date);
  editor = existing
    ? structuredClone(existing)
    : {
        id: id(),
        date,
        title: "",
        body: "",
        mood: "☀️",
        bookId: "daily",
        photo: "",
        template: "cute",
        font: "serif",
        layers: [],
        isDemo: false,
        updatedAt: new Date().toISOString(),
      };
  editor.layers ||= [];
  editor.media ||= [];
  editor.fieldValues ||= {};
  editor.textStyle ||= { size: 20, color: "#2F2A26", weight: 400, spacing: 0 };
  editor.moments ||= [];
  templateCount = null;
  history = [];
  future = [];
  selectedLayer = null;
  activeMomentId = null;
  cropMode = false;
  draftDirty = false;
  if (page === "studio") media.release("studio");
  readyScopes.delete("studio");
  page = "studio";
  render();
  $("#app-scroll").scrollTop = 0;
  loadScope("studio", editorClips());
}
function navigation() {
  // Sub-pages highlight the tab they belong to.
  const current = { journey: "growth", day: "calendar" }[page] || page;
  $("#navigation").innerHTML = features.tabs
    .map(
      (tab) =>
        `<button class="nav-item ${tab.id === current ? "active" : ""} ${tab.id}" data-action="nav" data-page="${tab.id}" aria-label="${t("nav." + tab.id)}" ${tab.id === current ? 'aria-current="page"' : ""}>${icon(tab.symbol)}<span>${t("nav." + tab.id)}</span></button>`,
    )
    .join("");
}
function journeyHelpers() {
  return {
    icon,
    today: dateKey(),
    addDays,
    shortDate,
    weekday: (key) =>
      new Date(`${key}T12:00:00`).toLocaleDateString(locale(), { weekday: "long" }),
    monthLabel: (key) =>
      new Date(`${key}-01T12:00:00`).toLocaleDateString(locale(), {
        year: "numeric",
        month: "long",
      }),
  };
}
function openJourney(habitId, pageIndex = 0) {
  journeyHabit = habitId;
  const total = journeyPageCount(state(), habitId, dateKey());
  journeyPage = Math.max(0, Math.min(total - 1, pageIndex));
  page = "journey";
  render();
}
function habitRow(habit, date) {
  const done = state().checks.find(
    (check) => check.habitId === habit.id && check.date === date,
  );
  return `<div class="habit-row ${done?.note ? "has-note" : ""}"><span class="habit-symbol">${themeIcon(habit.theme)}</span><div class="habit-detail"><strong>${esc(habit.title)}</strong><small>${esc(habit.theme)} · ${habit.kind === "duration" ? `${done?.minutes || habit.minutes} min` : t("growth.encourage")}${done?.detail ? " · " + esc(done.detail) : ""}</small>${done?.note ? `<span class="habit-note">“${esc(done.note.slice(0, 60))}”</span>` : ""}</div>${done ? `<button class="note-button" data-action="check-note" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${t(done.note ? "growth.editNote" : "growth.addNote")} ${esc(habit.title)}">✎</button>` : ""}<button class="check-button ${done ? "done" : ""}" data-action="check" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${t(done ? "habit.cancel" : "habit.complete")} ${esc(habit.title)}" aria-pressed="${Boolean(done)}">${done ? icon("check") : ""}</button></div>`;
}

// One cover per day in a book: photos, date, mood and that day's Moments.
function dayCoverHTML(day) {
  const { entry, moments, photos, clips } = day;
  const date = new Date(`${day.date}T12:00:00`);
  const titles = [
    day.dayPage && entry.title ? entry.title : "",
    ...moments.map((m) => `${m.time ? m.time + " · " : ""}${m.title || t("moment.untitled")}`),
  ].filter(Boolean);
  const shots = photos
    .map((ref) => safePhoto(ref))
    .filter(Boolean)
    .slice(0, 3);
  const extras = [
    moments.length ? t("day.statMoments", { count: moments.length }) : "",
    clips.some((c) => c.kind === "video") ? "◈" : "",
    clips.some((c) => c.kind === "audio") ? "♫" : "",
  ].filter(Boolean);
  return `<button class="day-cover" data-action="open-day" data-date="${day.date}"><span class="day-cover-photos n${shots.length}">${shots.length ? shots.map((src) => `<img src="${esc(src)}" alt="">`).join("") : `<span class="day-cover-mood">${esc(entry.mood || "✿")}</span>`}</span><span class="day-cover-copy"><span class="day-cover-date"><b>${date.getDate()}</b><span>${esc(date.toLocaleDateString(locale(), { month: "short", weekday: "short" }))}</span>${entry.mood ? `<i>${esc(entry.mood)}</i>` : ""}</span><strong>${esc(titles[0] || t("entry.untitled"))}</strong>${titles.length > 1 ? `<ul>${titles
    .slice(1, 4)
    .map((title) => `<li>${esc(title)}</li>`)
    .join("")}</ul>` : ""}${extras.length ? `<small>${esc(extras.join(" · "))}</small>` : ""}</span></button>`;
}
function bookCard(book) {
  const count = bookEntryCount(state(), book.id);
  return `<button class="book-item" data-action="book" data-book="${esc(book.id)}">${coverHTML(book, ctx())}<strong>${esc(book.title)}</strong><small>${esc(book.category)} · ${t("entry.count", { count })}</small></button>`;
}

function home() {
  // Calm home: one invitation to write; everything else lives in the tab bar.
  const entry = todayEntry(),
    completed = state().checks.filter((check) => check.date === dateKey()).length;
  const date = new Date().toLocaleDateString(locale(), {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const photo = safePhoto(coverPhoto(entry));
  const moments = entry?.moments || [];
  const preview = entry
    ? `<button class="today-preview" data-action="open-day" data-date="${dateKey()}" aria-label="${t("home.readToday")}">${photo ? `<img src="${esc(photo)}" alt="${t("photo.alt")}">` : `<span class="today-preview-mood">${esc(entry.mood || "✿")}</span>`}<span class="today-preview-copy"><b>${esc(entry.title || moments[0]?.title || t("entry.untitled"))}</b><small>${esc((entry.body || moments[0]?.body || "").slice(0, 40))}</small>${moments.length ? `<i>${t("day.statMoments", { count: moments.length })}</i>` : ""}${entry.isDemo ? `<i>${t("home.sample")}</i>` : ""}</span><span class="today-preview-go" aria-hidden="true">›</span></button>`
    : `<p class="today-blank">${t("home.blankBody")}</p>`;
  return `<header class="home-top"><div class="brand-title"><span class="flower">✿</span>Little Days</div><button class="icon-button" data-action="nav" data-page="settings" aria-label="${t("settings")}">⚙</button></header>
 <section class="hero today-card"><span class="date-label">${esc(date)}</span><h1 class="today-prompt">${t(entry ? "home.greeting" : "home.prompt")}</h1>${preview}<button class="moment-cta" data-action="quick-moment"><span>✎</span><span><b>${t("moment.cta")}</b><small>${t("moment.ctaHint")}</small></span><i>›</i></button></section>
 <section class="home-section"><div class="section-heading"><h2>${t("home.growth")}</h2><button data-action="nav" data-page="growth">${t("home.completed", { done: completed, total: state().habits.length })} ›</button></div><div class="habit-list">${state()
   .habits.map((habit) => habitRow(habit, dateKey()))
   .join("")}</div></section><section class="home-section"><div class="section-heading"><h2>${t("home.books")}</h2><button data-action="nav" data-page="books">${t("home.allBooks")}</button></div><div class="book-grid">${[...state().books]
   .sort((a, b) => latestBook(b.id).localeCompare(latestBook(a.id)))
   .slice(0, 3)
   .map(bookCard)
   .join("")}</div></section><p class="home-quote">Collect moments, grow gently.</p>`;
}
function latestBook(bookId) {
  return (
    state()
      .entries.filter(
        (e) =>
          e.bookId === bookId ||
          (e.moments || []).some((moment) => moment.bookId === bookId),
      )
      .map((e) => e.updatedAt || "")
      .sort()
      .at(-1) || ""
  );
}
function memoryCard(entry, moment = null) {
  const page = moment || entry;
  const photo = safePhoto(
    moment ? coverPhoto({ layers: moment.layers }) : coverPhoto(entry),
  );
  const clips = moment ? moment.media || [] : clipsOf(entry);
  const momentCount = moment ? 0 : entry.moments?.length || 0;
  const title = moment
    ? `${moment.time ? moment.time + " · " : ""}${moment.title || t("moment.untitled")}`
    : entry.title || entry.moments?.[0]?.title || t("entry.untitled");
  const extras = [
    momentCount ? `✦ ${t("day.statMoments", { count: momentCount })}` : "",
    clips.some((clip) => clip.kind === "video") ? "◈" : "",
    clips.some((clip) => clip.kind === "audio")
      ? `♫ ${clips.filter((clip) => clip.kind === "audio").length}`
      : "",
  ].filter(Boolean);
  return `<button class="memory-card" data-action="open-day" data-date="${entry.date}" ${moment ? `data-moment="${esc(moment.id)}"` : ""}>${photo ? `<img src="${esc(photo)}" alt="${t("photo.alt")}">` : '<span class="empty-photo">✿</span>'}<div><strong>${esc(title)} ${esc(page.mood || "")}</strong><p>${esc(page.body?.slice(0, 45) || t("entry.read"))}<br>${shortDate(entry.date)} · ${t(entry.isDemo ? "entry.sample" : "entry.saved")}${extras.length ? " · " + extras.join(" · ") : ""}</p></div></button>`;
}
function dayMarks(key) {
  const summary = daySummary(state(), key);
  const marks = [
    ["photo", summary.photos, "calendar.markPhoto"],
    ["video", summary.videos, "calendar.markVideo"],
    ["audio", summary.audios, "calendar.markAudio"],
    ["growth", summary.growth, "calendar.markGrowth"],
  ].filter(([, count]) => count);
  return {
    html:
      marks.length || summary.moments > 1
        ? `<span class="day-dots" aria-hidden="true">${marks.map(([kind]) => `<i class="dot-${kind}"></i>`).join("")}${summary.moments > 1 ? `<b>${summary.moments}</b>` : ""}</span>`
        : "",
    label: [
      ...marks.map(([, , key]) => t(key)),
      summary.moments > 1
        ? t("day.statMoments", { count: summary.moments })
        : "",
    ]
      .filter(Boolean)
      .join(", "),
    hasContent: Boolean(summary.entry || summary.growth || state().drafts[key]),
  };
}

function calendarPage() {
  const year = month.getFullYear(),
    monthIndex = month.getMonth(),
    count = new Date(year, monthIndex + 1, 0).getDate(),
    offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const entry = state().entries.find((e) => e.date === selectedDate),
    checks = state().checks.filter((c) => c.date === selectedDate);
  const weekdays =
    languageCode() === "en"
      ? ["M", "T", "W", "T", "F", "S", "S"]
      : ["一", "二", "三", "四", "五", "六", "日"];
  const cells = Array.from({ length: count }, (_, i) => {
    const key = dateKey(new Date(year, monthIndex, i + 1)),
      recorded = state().entries.find((e) => e.date === key),
      total = state().checks.filter((c) => c.date === key).length,
      marks = dayMarks(key),
      thumb = safePhoto(coverPhoto(recorded));
    const mark =
      calendarMode === "memory"
        ? thumb
          ? `<img src="${esc(thumb)}" alt="${t("calendar.hasEntry")}">`
          : esc(recorded?.mood || "")
        : total
          ? `${total} ✦`
          : "";
    return `<button class="day-cell ${key === selectedDate ? "selected" : ""} ${key === dateKey() ? "today" : ""} ${key > dateKey() ? "future" : ""}" data-action="select-date" data-date="${key}" data-has-content="${marks.hasContent}" aria-label="${key}${recorded ? " " + t("calendar.hasEntry") : ""}${marks.label ? " · " + marks.label : ""}" aria-pressed="${key === selectedDate}"><span>${new Intl.NumberFormat(locale()).format(i + 1)}</span><span class="day-mark">${mark}</span>${calendarMode === "memory" ? marks.html : ""}</button>`;
  }).join("");
  return `<header class="page-top"><div><h1 class="page-title">${t("calendar.title")}</h1><p class="page-subtitle">${t("calendar.subtitle")}</p></div><button class="icon-button" data-action="calendar-today" aria-label="${t("calendar.today")}">${icon("calendar")}</button></header><div class="segmented"><button data-action="calendar-mode" data-mode="memory" class="${calendarMode === "memory" ? "selected" : ""}">${t("calendar.memory")}</button><button data-action="calendar-mode" data-mode="growth" class="${calendarMode === "growth" ? "selected" : ""}">${t("calendar.growth")}</button></div><div class="month-controls"><button data-action="month" data-delta="-1" aria-label="${t("calendar.prev")}">${icon("back")}</button><h2>${month.toLocaleDateString(locale(), { month: "long", year: "numeric" })}</h2><button data-action="month" data-delta="1" aria-label="${t("calendar.next")}">${icon("arrow")}</button></div><div class="calendar-grid">${weekdays.map((d) => `<span class="weekday">${d}</span>`).join("")}${"<span></span>".repeat(offset)}${cells}</div>${calendarMode === "memory" ? `<div class="calendar-legend" aria-hidden="true"><span><i class="dot-photo"></i>${t("calendar.markPhoto")}</span><span><i class="dot-video"></i>${t("calendar.markVideo")}</span><span><i class="dot-audio"></i>${t("calendar.markAudio")}</span><span><i class="dot-growth"></i>${t("calendar.markGrowth")}</span><span><b>3</b>${t("calendar.markMoments")}</span></div>` : ""}<section class="date-summary"><div class="section-heading"><h3>${t(calendarMode === "memory" ? "calendar.dayTitle" : "calendar.growthTitle", { date: shortDate(selectedDate) })}</h3><span class="summary-actions">${entry ? `<button data-action="open-day" data-date="${selectedDate}">${t("calendar.read")}</button>` : ""}<button data-action="edit-date" data-date="${selectedDate}">${t(entry ? "calendar.edit" : "calendar.backfill")} ↗</button></span></div>${
    calendarMode === "memory"
      ? entry
        ? memoryCard(entry)
        : `<div class="empty">${t("calendar.empty")}<br><button class="primary" data-action="edit-date" data-date="${selectedDate}">${icon("plus")} ${t("calendar.add")}</button></div>`
      : `<p class="subtext">${t("calendar.linked", { count: checks.length })}</p>${state()
          .habits.map((h) => habitRow(h, selectedDate))
          .join("")}`
  }</section><p class="home-quote">Some days become memories. All days become you.</p>`;
}

function growthPage() {
  const today = dateKey(),
    start = weekStart(today),
    total = state().habits.reduce(
      (sum, h) => sum + Math.min(weeklyCount(state(), h.id, today), h.target),
      0,
    ),
    target = state().habits.reduce((sum, h) => sum + h.target, 0),
    themes = [...new Set(state().habits.map((h) => h.theme))],
    weekdays =
      languageCode() === "en"
        ? ["M", "T", "W", "T", "F", "S", "S"]
        : ["一", "二", "三", "四", "五", "六", "日"];
  return `<header class="page-top"><div><h1 class="page-title">${t("growth.title")}</h1><p class="page-subtitle">${t("growth.subtitle")}</p></div><button class="icon-button" data-action="new-habit" aria-label="${t("growth.add")}">${icon("plus")}</button></header><section class="growth-intro"><h2>${t("growth.headline")}</h2><p>${t("growth.description")}</p><div class="progress-track"><span style="width:${target ? Math.min(100, (total / target) * 100) : 0}%"></span></div><div class="progress-caption"><span>${t("growth.week")}</span><span>${t("growth.count", { count: total, target })}</span></div></section>${themes
    .map(
      (theme) =>
        `<div class="theme-header">${esc(theme.toUpperCase())}</div>${state()
          .habits.filter((h) => h.theme === theme)
          .map(
            (h) =>
              `<section class="growth-habit">${habitRow(h, today)}<p class="subtext">${t("growth.weekCount", { target: h.target, count: weeklyCount(state(), h.id, today) })}</p><div class="week-dots">${Array.from({ length: 7 }, (_, i) => `<span class="${state().checks.some((c) => c.habitId === h.id && c.date === addDays(start, i)) ? "complete" : ""}">${weekdays[i]}</span>`).join("")}</div><button class="journey-link" data-action="habit-journey" data-habit="${esc(h.id)}">📖 ${t("journey.open")} <span>${t("journey.openHint", { count: state().checks.filter((c) => c.habitId === h.id).length })}</span> ›</button></section>`,
          )
          .join("")}`,
    )
    .join(
      "",
    )}<button class="secondary full-width" data-action="new-habit">${t("growth.new")}</button>${reflectionsHTML(today)}${checkHistoryHTML()}<section class="milestone"><span>${state().checks.length >= 3 ? "🌼" : "🌱"}</span><h3>${t(state().checks.length >= 3 ? "growth.flower" : "growth.seed")}</h3><p>${t("growth.milestone", { count: state().checks.length })}${state().checks.length < 3 ? " · " + t("growth.remaining", { count: 3 - state().checks.length }) : ""}<br>${t("growth.linked")}</p><button class="secondary" data-action="growth-calendar">${t("growth.calendar")}</button></section>`;
}

function reflectionsHTML(today) {
  const card = (period) => {
    const key = periodKey(period, today),
      reflection = findReflection(state(), period, key);
    const filled =
      reflection &&
      ["wentWell", "challenges", "learned", "nextFocus"].some(
        (field) => reflection[field],
      );
    return `<article class="reflection-note ${filled ? "" : "blank"}"><header><b>${t(period === "week" ? "reflection.thisWeek" : "reflection.thisMonth")}</b><button class="text-button" data-action="reflection-edit" data-period="${period}" data-key="${key}">${t(filled ? "edit" : "reflection.write")}</button></header>${
      filled
        ? ["wentWell", "challenges", "learned", "nextFocus"]
            .map((field) =>
              reflection[field]
                ? `<p><span>${t("reflection." + field)}</span>${esc(reflection[field])}</p>`
                : "",
            )
            .join("")
        : `<p class="subtext">${t("reflection.prompt")}</p>`
    }</article>`;
  };
  const past = (state().reflections || [])
    .filter((item) => item.key !== periodKey(item.period, today))
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 6);
  return `<section class="reflections"><div class="section-heading"><div><h2>${t("reflection.title")}</h2><p class="section-caption">${t("reflection.caption")}</p></div></div><div class="reflection-grid">${card("week")}${card("month")}</div>${past.length ? `<details class="past-reflections"><summary>${t("reflection.past", { count: past.length })}</summary>${past.map((item) => `<button class="past-reflection" data-action="reflection-edit" data-period="${item.period}" data-key="${item.key}">${esc(item.period === "week" ? t("reflection.weekOf", { date: shortDate(item.key) }) : item.key)} · ${esc((item.wentWell || item.learned || "").slice(0, 40))}</button>`).join("")}</details>` : ""}</section>`;
}
function checkHistoryHTML() {
  const notes = state()
    .checks.filter((check) => check.note || check.detail || check.photo)
    .sort((a, b) =>
      (b.date + (b.updatedAt || "")).localeCompare(
        a.date + (a.updatedAt || ""),
      ),
    )
    .slice(0, 12);
  if (!notes.length) return "";
  return `<section class="check-history"><div class="section-heading"><h2>${t("growth.history")}</h2><span class="badge">${t("private")}</span></div>${notes
    .map((check) => {
      const habit = state().habits.find((h) => h.id === check.habitId);
      return `<article class="history-note"><time>${esc(shortDate(check.date))}</time>${growthCardInner(check, habit, ctx())}<div class="history-actions"><button class="text-button" data-action="check-note" data-habit="${esc(check.habitId)}" data-date="${check.date}">${t("edit")}</button><button class="text-button" data-action="open-day" data-date="${check.date}">${t("growth.openDay")}</button></div></article>`;
    })
    .join("")}</section>`;
}
function booksPage() {
  if (selectedBook) {
    const book = state().books.find((b) => b.id === selectedBook),
      entries = bookPages(state(), selectedBook),
      days = bookDays(state(), selectedBook, bookFilter),
      months = bookMonths(state(), selectedBook);
    const filtered = bookFilter.month || bookFilter.date;
    return `<div class="section-heading"><button class="back-button" data-action="all-books">${icon("back")} ${t("books.all")}</button><button class="secondary" data-action="edit-book" data-book="${esc(book.id)}">${t("edit")}</button></div><div class="book-detail-showcase">${coverHTML(book, ctx())}</div><div class="book-detail-copy"><h2>${esc(book.title)}</h2><p>${esc(book.description || "")}</p><span class="badge">${t("private")} · ${t("entry.count", { count: entries.length })}</span></div><button class="primary full-width" data-action="book-new-entry">${icon("plus")} ${t("books.addPage")}</button><div class="book-filter"><p class="journal-list-caption">${t("books.memories")}</p><div class="book-filter-row"><select data-book-filter="month" aria-label="${t("books.month")}"><option value="">${t("books.allMonths")}</option>${months.map((m) => `<option value="${m}" ${bookFilter.month === m ? "selected" : ""}>${esc(new Date(`${m}-01T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long" }))}</option>`).join("")}</select><input type="date" data-book-filter="date" aria-label="${t("books.pickDate")}" value="${esc(bookFilter.date)}">${filtered ? `<button class="text-button" data-action="book-filter-clear">${t("books.clearFilter")}</button>` : ""}</div></div>${
      days.length
        ? `<div class="day-covers">${days.map(dayCoverHTML).join("")}</div>`
        : `<div class="empty">${t(filtered ? "books.noMatch" : "books.empty")}</div>`
    }`;
  }
  return `<header class="page-top"><div><h1 class="page-title">${t("books.title")}</h1><p class="page-subtitle">${t("books.subtitle")}</p></div><button class="icon-button" data-action="new-book" aria-label="${t("books.new")}">${icon("plus")}</button></header><div class="book-grid books-full">${state().books.map(bookCard).join("")}</div><button class="secondary full-width" data-action="new-book">${t("books.create")}</button><p class="home-quote">A home for every little story.</p>`;
}

// The Studio edits either the day page (the Entry itself) or one Moment.
function activePage(entry = editor) {
  return (activeMomentId && findMoment(entry, activeMomentId)) || entry;
}
function isDayPage() {
  return activePage() === editor;
}
function changeTarget(change, redraw = true) {
  changeEditor((entry) => change(activePage(entry), entry), redraw);
}
function selectedLayerOf(page = activePage()) {
  return page.layers.find((layer) => layer.id === selectedLayer);
}
function canvasHTML() {
  return sharedCanvasHTML(activePage(), ctx(), {
    selectedId: selectedLayer,
    cropMode,
    dayPage: isDayPage(),
  });
}
function photoRegion() {
  return isDayPage() ? { top: 4, bottom: 60 } : { top: 4, bottom: 96 };
}

function layerControls() {
  const layer = selectedLayerOf();
  if (!layer) return "";
  const slider = ([field, min, max, step, label, value]) =>
    `<label>${t(label)}<input type="range" data-layer-field="${field}" aria-label="${t(label)}" min="${min}" max="${max}" step="${step}" value="${value ?? layer[field]}"></label>`;
  const base = [
    ["x", 0, 100, 1, "layer.x"],
    ["y", 0, 100, 1, "layer.y"],
    ["scale", 0.3, 3, 0.05, "layer.size"],
    ["rotation", -180, 180, 1, "layer.rotation"],
  ];
  if (layer.kind === "photo")
    base.push(
      ["w", 8, 100, 1, "layer.width", layer.w ?? 42],
      ["h", 8, 100, 1, "layer.height", layer.h ?? 34],
    );
  if (layer.kind === "growth" || layer.kind === "text")
    base.push([
      "w",
      20,
      100,
      1,
      "layer.width",
      layer.w ?? (layer.kind === "text" ? 65 : 62),
    ]);
  const crop = cropOf(layer);
  const photoTools =
    layer.kind === "photo"
      ? `<div class="photo-tools"><label class="field">${t("photo.frame")}<select data-layer-text="frame">${PHOTO_FRAMES.map((frame) => `<option value="${frame}" ${(layer.frame || "border") === frame ? "selected" : ""}>${t("frame." + frame)}</option>`).join("")}</select></label><label class="check-label"><input type="checkbox" data-layer-flag="tape" ${layer.tape ? "checked" : ""}> ${t("photo.tape")}</label><button class="${cropMode ? "selected" : ""}" data-action="crop-mode" aria-pressed="${cropMode}">✂ ${t(cropMode ? "photo.cropDone" : "photo.crop")}</button><button data-action="replace-photo">${t("photo.replace")}</button></div>${
          cropMode
            ? `<p class="save-help">${t("photo.cropHelp")}</p><div class="crop-sliders">${[
                ["zoom", 1, 4, 0.05, "photo.cropZoom"],
                ["x", 0, 100, 1, "photo.cropX"],
                ["y", 0, 100, 1, "photo.cropY"],
              ]
                .map(
                  ([field, min, max, step, label]) =>
                    `<label>${t(label)}<input type="range" data-crop-field="${field}" min="${min}" max="${max}" step="${step}" value="${crop[field]}" aria-label="${t(label)}"></label>`,
                )
                .join("")}</div>`
            : ""
        }`
      : "";
  const textTools =
    layer.kind === "text"
      ? `<label class="field">${t("layer.content")}<textarea data-layer-text="text" maxlength="300">${esc(layer.text)}</textarea></label><label class="field">${t("studio.font")}<select data-layer-text="fontId">${fontOptions(layer.fontId || activePage().font)}</select></label><label>${t("studio.size")}<input data-layer-text="fontSize" type="range" min="10" max="50" value="${layer.fontSize || 16}"></label><label>${t("studio.weight")}<input data-layer-text="weight" type="range" min="100" max="900" step="100" value="${layer.weight || 400}"></label><label>${t("studio.spacing")}<input data-layer-text="spacing" type="range" min="0" max="5" step=".5" value="${layer.spacing || 0}"></label><label>${t("studio.textColor")}<input data-layer-text="color" type="color" value="${layer.color || "#2F2A26"}"></label><label>${t("layer.align")}<select data-layer-text="align">${["left", "center", "right"].map((a) => `<option value="${a}" ${(layer.align || "left") === a ? "selected" : ""}>${t("layer." + a)}</option>`).join("")}</select></label>`
      : "";
  return `<div class="layer-controls"><span>${t(layer.kind === "photo" ? "layer.photo" : layer.kind === "growth" ? "layer.growth" : "layer.selected")}</span><p class="gesture-help">${t("layer.gestureHelp")}</p>${base.map(slider).join("")}${photoTools}${textTools}<div class="layer-buttons"><button data-action="layer-back">${t("layer.back")}</button><button data-action="layer-backward">${t("layer.backward")}</button><button data-action="layer-forward">${t("layer.forward")}</button><button data-action="layer-front">${t("layer.front")}</button><button data-action="layer-copy">${t("copy")}</button><button data-action="layer-delete">${t("delete")}</button></div></div>`;
}

// ---------- Studio: chapter chips, sticky preview and a summary tool menu ----------
// One-line summary per tool; tapping a row opens its details (one at a time)
// while the page preview stays pinned above, so every change is visible.
function pageCounts(page) {
  const photos = page.layers.filter((layer) => layer.kind === "photo").length,
    videos = page.media.filter((clip) => clip.kind === "video").length,
    audios = page.media.filter((clip) => clip.kind === "audio").length;
  return { photos, videos, audios };
}
function chapterChipsHTML() {
  const moments = editor.moments || [];
  const badges = (page) => {
    const c = pageCounts(page);
    return [c.photos ? `📷${c.photos}` : "", c.videos ? `◈${c.videos}` : "", c.audios ? `♫${c.audios}` : ""]
      .filter(Boolean)
      .map((b) => `<i>${b}</i>`)
      .join("");
  };
  return `<nav class="chapter-chips" aria-label="${t("moment.title")}"><button class="chapter-chip add" data-action="add-moment">＋ ${t("moment.addShort")}</button><button class="chapter-chip ${activeMomentId ? "" : "active"}" data-action="select-moment" data-moment="" aria-pressed="${!activeMomentId}"><b>✿ ${t("day.cover")}</b>${badges(editor)}</button>${moments
    .map(
      (moment, index) =>
        `<button class="chapter-chip ${moment.id === activeMomentId ? "active" : ""}" data-action="select-moment" data-moment="${esc(moment.id)}" aria-pressed="${moment.id === activeMomentId}"><b><span>${String(index + 1).padStart(2, "0")}</span> <span data-chapter-label="${esc(moment.id)}">${esc((moment.time ? moment.time + " · " : "") + (moment.title || t("moment.untitled")))}</span></b>${badges(moment)}</button>`,
    )
    .join("")}</nav>`;
}
function chaptersOutlineHTML() {
  const moments = editor.moments || [];
  const thumbs = (page) =>
    page.layers
      .filter((layer) => layer.kind === "photo" && safePhoto(layer.mediaRef))
      .slice(0, 4)
      .map((layer) => `<img src="${esc(safePhoto(layer.mediaRef))}" alt="">`)
      .join("");
  const counts = (page) => {
    const c = pageCounts(page);
    return [c.photos ? `📷 ${c.photos}` : "", c.videos ? `◈ ${c.videos}` : "", c.audios ? `♫ ${c.audios}` : ""].filter(Boolean).join(" · ");
  };
  const active = findMoment(editor, activeMomentId);
  return `${
    active
      ? `<div class="moment-actions"><button class="primary" data-action="save-moment">${icon("check")} ${t("moment.save")}</button><button class="secondary" data-action="moment-duplicate">${t("copy")}</button><button class="secondary danger" data-action="moment-delete">${t("delete")}</button></div>${active.savedAt ? `<p class="moment-saved">${t("moment.savedAt", { time: new Date(active.savedAt).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }) })}</p>` : ""}`
      : ""
  }<div class="chapter-list">${moments
    .map(
      (moment, index) =>
        `<div class="chapter-item ${moment.id === activeMomentId ? "active" : ""} ${moment.collapsed ? "collapsed" : ""}" data-chapter="${esc(moment.id)}"><button class="chapter-select" data-action="select-moment" data-moment="${esc(moment.id)}" aria-pressed="${moment.id === activeMomentId}"><span class="chapter-index">${String(index + 1).padStart(2, "0")}</span><span class="chapter-copy"><b>${esc((moment.time ? moment.time + " · " : "") + (moment.title || t("moment.untitled")))}</b><small>${esc(counts(moment) || moment.body?.slice(0, 30) || t("moment.empty"))}</small></span></button><span class="chapter-tools"><button data-action="moment-up" data-moment="${esc(moment.id)}" aria-label="${t("moment.up")}" ${index ? "" : "disabled"}>↑</button><button data-action="moment-down" data-moment="${esc(moment.id)}" aria-label="${t("moment.down")}" ${index < moments.length - 1 ? "" : "disabled"}>↓</button><button data-action="moment-collapse" data-moment="${esc(moment.id)}" aria-expanded="${!moment.collapsed}" aria-label="${t(moment.collapsed ? "moment.expand" : "moment.collapse")}">${moment.collapsed ? "▸" : "▾"}</button></span>${moment.collapsed ? "" : `<div class="chapter-preview">${thumbs(moment)}${moment.body ? `<p>${esc(moment.body.slice(0, 80))}</p>` : ""}</div>`}</div>`,
    )
    .join("") || `<p class="subtext">${t("moment.none")}</p>`}</div><button class="add-moment" data-action="add-moment">＋ ${t("moment.add")}</button>`;
}
function fontName(id) {
  const font = catalog.fonts.find((item) => item.id === id);
  return font ? font.name : t("font." + (id || "serif"));
}
// Template picker: first how many photos (or words only), then a layout.
function templatePickerHTML(page) {
  const filled = page.layers.filter((layer) => layer.kind === "photo" && layer.mediaRef).length +
    (isDayPage() && editor.photo ? 1 : 0);
  const slots = page.layers.filter((layer) => layer.kind === "photo").length;
  const current = page.layoutTemplate === "text" ? 0 : Math.min(5, slots || filled);
  const count = templateCount ?? current;
  const counts = [0, 1, 2, 3, 4, 5]
    .map((n) => {
      const disabled = n < Math.min(5, filled);
      return `<button data-action="template-count" data-count="${n}" class="count-option ${n === count ? "selected" : ""}" aria-pressed="${n === count}" ${disabled ? `disabled title="${t("layout.hasPhotos", { count: filled })}"` : ""}>${n === 0 ? t("layout.textOnly") : n === 5 ? "5+" : n}</button>`;
    })
    .join("");
  const options = (TEMPLATES_BY_COUNT[count] || [])
    .map(
      (template) =>
        `<button data-action="apply-layout" data-count="${count}" data-template="${template}" class="layout-option ${page.layoutTemplate === template && !page.layoutEdited ? "selected" : ""}"><span class="layout-icon layout-${template}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${t("layout." + template)}</button>`,
    )
    .join("");
  return `<span class="small-label">${t("layout.step1")}</span><div class="count-options">${counts}</div><span class="small-label">${t("layout.step2")}</span><div class="layout-options">${options}</div><p class="save-help">${t(count === 0 ? "layout.textHelp" : "layout.slotHelp")}</p>`;
}
// Writing comes first: the words of this page are always open under the
// preview; styling lives in the menu below ("装饰这一页").
function writeCardHTML() {
  const page = activePage();
  if (isDayPage())
    return `<section class="write-card" aria-label="${t("write.title")}"><div class="write-head"><b>${t("write.dayTitle")}</b><button class="text-button" data-action="add-text-layer">＋ ${t("studio.textBox")}</button></div><input id="entry-title" class="write-title" data-editor-field="title" placeholder="${t("studio.titlePlaceholder")}" maxlength="70" value="${esc(editor.title)}" aria-label="${t("studio.titleLabel")}"><textarea id="entry-body" class="write-body" data-editor-field="body" maxlength="2000" placeholder="${t("studio.bodyPlaceholder")}" aria-label="${t("studio.bodyLabel")}">${esc(editor.body)}</textarea></section>`;
  const index = editor.moments.indexOf(page);
  return `<section class="write-card moment" aria-label="${t("write.title")}"><div class="write-head"><b>${t("moment.chapter", { number: String(index + 1).padStart(2, "0") })}</b><input type="time" class="write-time" data-moment-field="time" value="${esc(page.time)}" aria-label="${t("moment.time")}"><button class="text-button" data-action="add-text-layer">＋ ${t("studio.textBox")}</button></div><input class="write-title" data-moment-field="title" maxlength="70" placeholder="${t("moment.titlePlaceholder")}" value="${esc(page.title)}" aria-label="${t("moment.titleLabel")}"><textarea class="write-body" data-moment-field="body" maxlength="4000" placeholder="${t("moment.bodyPlaceholder")}" aria-label="${t("moment.bodyLabel")}">${esc(page.body)}</textarea><input class="write-tags" data-moment-field="tags" maxlength="200" placeholder="${t("moment.tagsPlaceholder")}" value="${esc(page.tags.join(", "))}" aria-label="${t("moment.tags")}"></section>`;
}
function studioTools() {
  const page = activePage(),
    dayPage = isDayPage(),
    style = editor.textStyle || {},
    counts = pageCounts(page),
    book = state().books.find((b) => b.id === (dayPage ? editor.bookId : page.bookId)),
    checks = state().checks.filter((check) => check.date === editor.date),
    categories = [...new Set(catalog.stickers.map((s) => s.category))],
    moodAction = dayPage ? "mood" : "moment-mood",
    paperAction = dayPage ? "template" : "moment-template",
    photoTotal = counts.photos + (dayPage && editor.photo ? 1 : 0);
  const tools = [];
  if (selectedLayerOf())
    tools.push({
      id: "layer",
      icon: "◎",
      label: "tool.layer",
      value: t(selectedLayerOf().kind === "photo" ? "layer.photo" : selectedLayerOf().kind === "growth" ? "layer.growth" : "layer.selected"),
      body: () => layerControls(),
    });
  tools.push(
    {
      id: "photos",
      icon: "▣",
      label: "tool.photos",
      value: photoTotal ? t("photo.count", { count: photoTotal }) : t("tool.none"),
      body: () =>
        `<button class="primary full-width" data-action="add-photos">${icon("photo")} ${t("photo.addMany")}</button>${
          dayPage && editor.photo
            ? `<div class="editor-actions"><button data-action="upload">${t("studio.replacePhoto")}</button><button data-action="free-main-photo">${t("photo.freeMain")}</button></div>`
            : dayPage && !photoTotal
              ? `<div class="editor-actions"><button data-action="upload">${t("studio.addPhoto")}</button></div>`
              : ""
        }<p class="save-help">${t("photo.toolHelp")}</p>`,
    },
    {
      id: "layout",
      icon: "⊞",
      label: "tool.layout",
      value:
        page.layoutTemplate
          ? `${t("layout." + page.layoutTemplate)} · ${t(page.layoutEdited ? "layout.free" : "layout.auto")}`
          : t(page.layoutEdited ? "layout.free" : "tool.none"),
      body: () => templatePickerHTML(page),
    },
    {
      id: "font",
      icon: "Aa",
      label: "tool.font",
      value: fontName(page.font),
      body: () =>
        dayPage
          ? `<label class="field">${t("studio.font")}<select data-editor-field="font" aria-label="${t("studio.font")}">${fontOptions(editor.font)}</select></label><div class="font-preview" style="font-family:${esc(fontFamily(editor.font, catalog))}">Little moments, 美好小日子。<small>${t("studio.fontPreview")}</small></div><label class="field">${t("studio.bodyFont")}<select data-editor-field="bodyFont">${fontOptions(editor.bodyFont || editor.font)}</select></label><div class="text-tools"><label>${t("studio.size")}<input data-text-style="size" type="range" min="12" max="40" value="${style.size || 20}"></label><label>${t("studio.textColor")}<input data-text-style="color" type="color" value="${style.color || "#2F2A26"}"></label><label>${t("studio.weight")}<input data-text-style="weight" type="range" min="100" max="900" step="100" value="${style.weight || 400}"></label><label>${t("studio.spacing")}<input data-text-style="spacing" type="range" min="0" max="5" step=".5" value="${style.spacing || 0}"></label></div>`
          : `<label class="field">${t("studio.font")}<select data-moment-field="font">${fontOptions(page.font)}</select></label><div class="font-preview" style="font-family:${esc(fontFamily(page.font, catalog))}">Little moments, 美好小日子。</div>`,
    },
    {
      id: "paper",
      icon: "▤",
      label: "tool.paper",
      value: t("template." + (page.template || "minimal")),
      body: () =>
        `<div class="paper-grid">${features.templates.map((template) => `<button data-action="${paperAction}" data-template="${template.id}" class="paper-option ${page.template === template.id ? "selected" : ""}" aria-pressed="${page.template === template.id}"><span class="paper-swatch journal-canvas ${template.id}" aria-hidden="true"></span>${t("template." + template.id)}</button>`).join("")}</div>`,
    },
    {
      id: "mood",
      icon: "☺",
      label: "tool.mood",
      value: page.mood || t("tool.none"),
      body: () =>
        `<div class="mood-list">${features.moods.map((m) => `<button data-action="${moodAction}" data-mood="${m}" class="${page.mood === m ? "selected" : ""}" aria-label="${t("studio.moodLabel", { mood: m })}" aria-pressed="${page.mood === m}">${m}</button>`).join("")}</div>`,
    },
    {
      id: "stickers",
      icon: "✿",
      label: "tool.stickers",
      value: t("tool.layers", { count: page.layers.filter((layer) => layer.kind !== "photo").length }),
      body: () =>
        `<div class="material-categories">${categories.map((category) => `<button data-action="material-category" data-category="${category}" class="${materialCategory === category ? "selected" : ""}">${t("category." + category)}</button>`).join("")}</div><div class="art-sticker-grid">${catalog.stickers
          .filter((s) => s.category === materialCategory)
          .map((s) => `<button data-action="asset-sticker" data-sticker="${s.id}" aria-label="${esc(languageCode() === "en" ? s.nameEn : s.nameZh)}"><img src="library/stickers/${s.file}" alt=""><span>${esc(languageCode() === "en" ? s.nameEn : s.nameZh)}</span></button>`)
          .join("")}</div><div class="editor-actions"><button data-action="add-text-layer">${t("studio.textBox")}</button><button data-action="collage-photo">${t("studio.collagePhoto")}</button></div>`,
    },
    {
      id: "media",
      icon: "♫",
      label: "tool.media",
      value: counts.videos || counts.audios ? [counts.videos ? t("day.statVideos", { count: counts.videos }) : "", counts.audios ? t("day.statAudios", { count: counts.audios }) : ""].filter(Boolean).join(" · ") : t("tool.none"),
      body: () => mediaPanelHTML(page, ctx(), Boolean(recorder)),
    },
  );
  if (checks.length)
    tools.push({
      id: "growth",
      icon: "🌱",
      label: "tool.growth",
      value: t("day.statGrowth", { count: checks.length }),
      body: () => growthPanelHTML(),
    });
  tools.push({
    id: "book",
    icon: "📔",
    label: "tool.book",
    value: book?.title || "—",
    body: () =>
      dayPage
        ? `<label class="field">${t("studio.book")}<select data-editor-field="bookId" aria-label="${t("studio.book")}">${state().books.map((b) => `<option value="${esc(b.id)}" ${b.id === editor.bookId ? "selected" : ""}>${esc(b.title)}</option>`).join("")}</select></label>${customFieldsHTML(book, editor, ctx())}`
        : `<label class="field">${t("studio.book")}<select data-moment-field="bookId">${state().books.map((b) => `<option value="${esc(b.id)}" ${b.id === page.bookId ? "selected" : ""}>${esc(b.title)}</option>`).join("")}</select></label>`,
  });
  tools.push({
    id: "chapters",
    icon: "☰",
    label: "tool.chapters",
    value: t("day.statMoments", { count: editor.moments.length }),
    body: () => chaptersOutlineHTML(),
  });
  return tools;
}
function toolMenuHTML() {
  const tools = studioTools();
  if (studioTool && !tools.some((tool) => tool.id === studioTool)) studioTool = null;
  return tools
    .map((tool) => {
      const open = tool.id === studioTool;
      return `<section class="tool-row ${open ? "open" : ""}" data-tool-row="${tool.id}"><button class="tool-head" data-action="tool" data-tool="${tool.id}" aria-expanded="${open}"><span class="tool-icon" aria-hidden="true">${tool.icon}</span><span class="tool-label">${t(tool.label)}</span><span class="tool-value" data-tool-value="${tool.id}">${esc(tool.value)}</span><span class="tool-chevron" aria-hidden="true">›</span></button>${open ? `<div class="tool-body">${tool.body()}</div>` : ""}</section>`;
    })
    .join("");
}
// Updates the one-line summaries without re-rendering open inputs.
function refreshToolSummaries() {
  for (const tool of studioTools()) {
    const element = document.querySelector(`[data-tool-value="${tool.id}"]`);
    if (element && element.textContent !== tool.value) element.textContent = tool.value;
  }
}
function refreshToolMenu() {
  if ($("#tool-menu")) $("#tool-menu").innerHTML = toolMenuHTML();
}
function growthPanelHTML() {
  const checks = state().checks.filter((check) => check.date === editor.date);
  if (!checks.length) return "";
  return `<p class="save-help">${t("growth.insertHelp")}</p>${checks
    .map((check) => {
      const habit = state().habits.find((h) => h.id === check.habitId);
      const inserted = activePage().layers.some(
        (layer) => layer.kind === "growth" && layer.habitId === check.habitId && layer.checkDate === check.date,
      );
      return `<div class="growth-insert-row">${growthCardInner(check, habit, ctx())}<button class="secondary" data-action="insert-growth" data-habit="${esc(check.habitId)}" ${inserted ? "disabled" : ""}>${t(inserted ? "growth.inserted" : "growth.insert")}</button></div>`;
    })
    .join("")}`;
}

function studioPage() {
  const dayPage = isDayPage();
  return `<header class="page-top studio-heading"><div><h1 class="page-title">${t("studio.title")}</h1><p class="page-subtitle">${t("studio.subtitle")}</p></div><button class="primary" data-action="save-entry">${t("save")} ${icon("check")}</button></header><div class="studio-meta"><input class="date-input" type="date" id="editor-date" aria-label="${t("field.date")}" value="${editor.date}"><span class="badge">${t("studio.linked", { count: state().checks.filter((c) => c.date === editor.date).length })}</span></div><div class="draft-status" id="draft-status">${draftDirty ? t("正在保存草稿…") : state().drafts[editor.date] ? t("草稿已保存在本机") : t("studio.draftHint")}</div>${chapterChipsHTML()}<div class="studio-stage ${previewLarge ? "large" : ""}"><div class="canvas-wrap ${dayPage ? "" : "moment-wrap"}" id="canvas-wrap">${canvasHTML()}</div><div class="stage-bar"><button data-action="undo" ${history.length ? "" : "disabled"} aria-label="${t("studio.undo")}">${icon("undo")}</button><button data-action="redo" ${future.length ? "" : "disabled"} aria-label="${t("studio.redo")}">${icon("redo")}</button><button class="stage-add" data-action="add-photos">${icon("photo")} ${t("photo.addShort")}</button><button data-action="preview-size" aria-pressed="${previewLarge}" aria-label="${t(previewLarge ? "studio.previewSmall" : "studio.previewLarge")}">${previewLarge ? "⤡" : "⤢"}</button></div></div>${writeCardHTML()}<h3 class="style-heading">${t("write.decorate")}<small>${t("write.decorateHint")}</small></h3><div class="tool-menu" id="tool-menu">${toolMenuHTML()}</div><div class="studio-footer"><button class="secondary" data-action="save-draft">${t("studio.saveDraft")}</button><button class="primary" data-action="export">${icon("download")} ${t("studio.export")}</button></div><p class="save-help">${t("studio.help")}</p>`;
}

function updateCanvas() {
  if ($("#canvas-wrap")) $("#canvas-wrap").innerHTML = canvasHTML();
  if ($(".font-preview"))
    $(".font-preview").style.fontFamily = fontFamily(activePage().font, catalog);
  const undo = document.querySelector('[data-action="undo"]');
  const redo = document.querySelector('[data-action="redo"]');
  if (undo) undo.disabled = history.length === 0;
  if (redo) redo.disabled = future.length === 0;
  refreshToolSummaries();
}

function fontOptions(selected) {
  return [
    ["serif", t("font.serif")],
    ["rounded", t("font.rounded")],
    ["system", t("font.system")],
    ...catalog.fonts.map((font) => [
      font.id,
      `${font.name} · ${t("font." + font.category)}`,
    ]),
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${selected === value ? "selected" : ""}>${esc(label)}</option>`,
    )
    .join("");
}

function releaseLeftScope() {
  if (scopedPage && scopedPage !== page) {
    // Revoke audio/video object URLs held only by the view we just left.
    document
      .querySelectorAll("#app audio, #app video")
      .forEach((element) => element.pause());
    media.release(scopedPage);
    readyScopes.delete(scopedPage);
  }
  scopedPage = ["studio", "day"].includes(page) ? page : null;
}
async function loadScope(scope, clips) {
  readyScopes.delete(scope);
  const ids = clips
    .flatMap((clip) => [clip.source, clip.poster])
    .filter((ref) => typeof ref === "string" && ref.startsWith("media:"))
    .map((ref) => ref.slice(6));
  try {
    await media.acquire(ids, scope);
  } catch (error) {
    console.warn("Media could not load", error?.name);
  }
  readyScopes.add(scope);
  if (page === scope && !drag) render();
}
function editorClips() {
  return editor ? clipsOf(editor) : [];
}
// Re-rendering keeps the field you are typing in focused (e.g. after media loads).
function focusKey(element) {
  if (!element || !$("#app").contains(element)) return null;
  for (const attr of ["id", "data-moment-field", "data-editor-field", "data-publish", "data-community-search", "data-people-search"])
    if (element.hasAttribute(attr)) return `[${attr}="${CSS.escape(element.getAttribute(attr))}"]`;
  return null;
}
function render() {
  const focused = focusKey(document.activeElement);
  const caret = focused ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  const scrollTop = $("#app-scroll").scrollTop;
  releaseLeftScope();
  $("#app").innerHTML = {
    home,
    calendar: calendarPage,
    growth: growthPage,
    books: booksPage,
    studio: studioPage,
    day: () => dayDetailHTML(selectedDate, ctx(), { icon, friendlyDate }),
    journey: () =>
      habitJourneyHTML(journeyHabit, journeyPage, ctx(), journeyHelpers()),
    community: () =>
      communityHTML(social(), communityView, state(), ctx(), { icon }),
    settings: () => settingsHTML(ctx()),
  }[page]();
  navigation();
  applyShellLanguage();
  $("#app-scroll").scrollTop = scrollTop;
  if (focused) {
    const again = $(`#app ${focused}`);
    if (again) {
      again.focus({ preventScroll: true });
      try {
        if (caret[0] != null) again.setSelectionRange(caret[0], caret[1]);
      } catch {}
    }
  }
  if (page === "settings") showMediaUsage();
}
function openDay(date, momentId = null) {
  flushDraft();
  selectedDate = date;
  month = new Date(`${date}T12:00:00`);
  page = "day";
  readyScopes.delete("day");
  render();
  $("#app-scroll").scrollTop = 0;
  const entry =
    state().entries.find((item) => item.date === date) || state().drafts[date];
  loadScope("day", clipsOf(entry)).then(() => {
    if (momentId)
      document
        .getElementById(`moment-${momentId}`)
        ?.scrollIntoView({ block: "start" });
  });
}
async function showMediaUsage() {
  const target = $("#media-usage");
  if (!target) return;
  try {
    const usage = await media.usage(state());
    target.textContent = t("settings.usage", {
      count: usage.count,
      size: new Intl.NumberFormat(locale(), {
        maximumFractionDigits: 1,
      }).format(usage.bytes / 1024 / 1024),
    });
    target.classList.toggle("warning", usage.bytes > 80 * 1024 * 1024);
  } catch {
    target.textContent = t("settings.usageUnknown");
  }
}
function openDialog(kind, payload = null) {
  dialogKind = kind;
  dialogPayload = payload;
  let title, description, fields;
  if (kind === "habit") {
    title = t("dialog.habitTitle");
    description = t("dialog.habitDescription");
    fields = `<label class="field">${t("dialog.habitName")}<input name="title" required maxlength="40" placeholder="${t("dialog.habitPlaceholder")}"></label><label class="field">${t("dialog.theme")}<input name="theme" required maxlength="30" list="theme-options" value="Learning"><datalist id="theme-options">${["Fitness", "Learning", "Wellness", "Creative Life"].map((theme) => `<option value="${theme}">`).join("")}</datalist></label><div class="field-row"><label class="field">${t("dialog.kind")}<select name="kind"><option value="completion">${t("dialog.completion")}</option><option value="duration">${t("dialog.duration")}</option></select></label><label class="field">${t("dialog.target")}<input name="target" type="number" min="1" max="7" value="3" required></label></div><label class="field">${t("dialog.minutes")}<input name="minutes" type="number" min="1" max="1440" value="20" required></label>`;
  } else {
    title = t("dialog.durationTitle");
    description = `${payload.habit.title} · ${shortDate(payload.date)}`;
    fields = `<label class="field">${t("dialog.durationLabel")}<input name="minutes" type="number" min="1" max="1440" value="${payload.habit.minutes || 20}" required></label>`;
  }
  $("#dialog-form").innerHTML =
    `<h2>${title}</h2><p class="dialog-description">${esc(description)}</p><div class="dialog-fields">${fields}</div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary">${t(kind === "duration" ? "dialog.record" : "create")}</button></div>`;
  $("#form-dialog").showModal();
}
function openCheckDialog(habitId, date) {
  const habit = state().habits.find((h) => h.id === habitId);
  if (!habit) return;
  const check = state().checks.find(
    (c) => c.habitId === habitId && c.date === date,
  );
  dialogKind = "check-note";
  dialogPayload = { habit, date, photo: check?.photo || "", isNew: !check };
  const photo = safePhoto(check?.photo || "");
  $("#dialog-form").innerHTML =
    `<h2>${t(check ? "growth.noteTitle" : "dialog.durationTitle")}</h2><p class="dialog-description">${esc(habit.title)} · ${esc(shortDate(date))}</p><div class="dialog-fields note-paper"><label class="field">${t("growth.detail")}<input name="detail" maxlength="80" placeholder="${t("growth.detailPlaceholder")}" value="${esc(check?.detail || "")}"></label><label class="field">${t(habit.kind === "duration" ? "dialog.durationLabel" : "growth.minutesOptional")}<input name="minutes" type="number" min="${habit.kind === "duration" ? 1 : 0}" max="1440" ${habit.kind === "duration" ? "required" : ""} value="${check ? check.minutes || "" : habit.kind === "duration" ? habit.minutes || 20 : ""}"></label><label class="field">${t("growth.note")}<textarea name="note" maxlength="2000" placeholder="${t("growth.notePlaceholder")}">${esc(check?.note || "")}</textarea></label><div><span class="small-label">${t("studio.mood")}</span><div class="mood-list">${["", ...features.moods].map((m) => `<label class="mood-radio"><input type="radio" name="mood" value="${m}" ${(check?.mood || "") === m ? "checked" : ""}><span>${m || "—"}</span></label>`).join("")}</div></div><div class="check-photo"><span id="check-photo-preview">${photo ? `<img src="${esc(photo)}" alt="">` : ""}</span><button type="button" class="secondary" data-action="check-photo">${t("growth.photo")}</button><button type="button" class="text-button" data-action="check-photo-remove">${t("books.removePhoto")}</button></div><label class="check-label"><input type="checkbox" name="shareNote" ${check?.shareNote ? "checked" : ""}> ${t("growth.shareNote")}</label><p class="save-help">${t("growth.privateNote")}</p></div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary">${t(check ? "save" : "dialog.record")}</button></div>`;
  $("#form-dialog").showModal();
}
function openReflectionDialog(period, key) {
  const reflection = findReflection(state(), period, key) || {};
  dialogKind = "reflection";
  dialogPayload = { period, key };
  $("#dialog-form").innerHTML =
    `<h2>${t(period === "week" ? "reflection.weekTitle" : "reflection.monthTitle")}</h2><p class="dialog-description">${esc(period === "week" ? t("reflection.weekOf", { date: shortDate(key) }) : new Date(`${key}-01T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long" }))} · ${t("reflection.optional")}</p><div class="dialog-fields note-paper">${["wentWell", "challenges", "learned", "nextFocus"].map((field) => `<label class="field">${t("reflection." + field)}<textarea name="${field}" maxlength="2000">${esc(reflection[field] || "")}</textarea></label>`).join("")}</div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary">${t("save")}</button></div>`;
  $("#form-dialog").showModal();
}
// In-page confirmation: works the same on localhost, in the iOS shell and on a
// hosted link (where browser confirm() dialogs are unavailable).
function askConfirm(message) {
  const dialog = $("#confirm-dialog");
  $("#confirm-message").textContent = message;
  $("#confirm-cancel").textContent = t("cancel");
  $("#confirm-ok").textContent = t("confirm.ok");
  dialog.returnValue = "";
  dialog.showModal();
  $("#confirm-cancel").focus();
  return new Promise((resolve) =>
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), {
      once: true,
    }),
  );
}
async function handleCheck(habitId, date) {
  const habit = state().habits.find((h) => h.id === habitId);
  const existingCheck = state().checks.find(
    (c) => c.habitId === habitId && c.date === date,
  );
  const existing = Boolean(existingCheck);
  if (!existing && habit.kind === "duration") {
    openCheckDialog(habitId, date);
    return;
  }
  if (
    existingCheck &&
    (existingCheck.note || existingCheck.detail || existingCheck.photo) &&
    !(await askConfirm(t("growth.cancelConfirm")))
  )
    return;

  store.update((s) => toggleCheck(s, habitId, date));
  render();
  toast(existing ? t("这次打卡已取消") : t("收集到一份小小的成长 🌱"));
}
async function action(target) {
  const actionName = target.dataset.action;
  if (
    (busyMedia || recorder) &&
    [
      "nav",
      "edit-date",
      "edit-today",
      "book",
      "book-new-entry",
      "quick-photo",
      "quick-text",
      "quick-mood",
      "quick-growth",
      "close-dialog",
      "save-entry",
      "open-day",
      "day-back",
      "save-moment",
      "moment-delete",
    ].includes(actionName)
  ) {
    toast(t("media.busy"));
    return;
  }
  if (await v3Action(target)) return;
  if (actionName === "nav") navigate(target.dataset.page);
  if (actionName === "edit-today") openStudio(dateKey());
  if (actionName === "quick-photo") {
    studioTool = "photos";
    openStudio(dateKey());
    $("#photos-input").click();
  }
  if (actionName === "quick-text") {
    studioTool = null;
    openStudio(dateKey());
    $("#entry-title").focus();
  }
  if (actionName === "quick-mood") {
    studioTool = "mood";
    openStudio(dateKey());
    $(".mood-list").scrollIntoView({ block: "center", behavior: "smooth" });
  }
  if (actionName === "quick-growth") navigate("growth");
  if (actionName === "check")
    await handleCheck(target.dataset.habit, target.dataset.date);
  if (actionName === "new-habit") openDialog("habit");
  if (actionName === "new-book") openDialog("book");
  if (actionName === "close-dialog") $("#form-dialog").close();
  if (actionName === "calendar-mode") {
    calendarMode = target.dataset.mode;
    render();
  }
  if (actionName === "select-date") {
    selectedDate = target.dataset.date;
    if (calendarMode === "memory" && target.dataset.hasContent === "true")
      openDay(selectedDate);
    else render();
  }
  if (actionName === "open-day")
    openDay(target.dataset.date, target.dataset.moment);
  if (actionName === "day-back") {
    page = "calendar";
    render();
  }
  if (actionName === "jump-moment")
    document
      .getElementById(`moment-${target.dataset.moment}`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  if (actionName === "zoom-photo") openLightbox(target.dataset.src);
  if (actionName === "player-toggle") togglePlayer(target);
  if (actionName === "calendar-today") {
    selectedDate = dateKey();
    month = new Date(`${selectedDate}T12:00:00`);
    render();
  }
  if (actionName === "month") {
    month = new Date(
      month.getFullYear(),
      month.getMonth() + Number(target.dataset.delta),
      1,
    );
    render();
  }
  if (actionName === "edit-date") openStudio(target.dataset.date);
  if (actionName === "growth-calendar") {
    navigate("calendar");
    calendarMode = "growth";
    render();
  }
  if (actionName === "book") {
    flushDraft();
    selectedBook = target.dataset.book;
    bookFilter = { month: "", date: "" };
    page = "books";
    render();
    $("#app-scroll").scrollTop = 0;
  }
  if (actionName === "all-books") {
    selectedBook = null;
    render();
  }
  if (actionName === "book-new-entry") {
    const book = selectedBook;
    openStudio(dateKey());
    changeEditor((e) => {
      e.bookId = book;
    });
  }
  if (actionName === "editor-mode") {
    editorMode = target.dataset.mode;
    selectedLayer = null;
    render();
  }
  if (actionName === "mood")
    changeEditor((e) => {
      e.mood = target.dataset.mood;
    });
  if (actionName === "template")
    changeEditor((e) => {
      e.template = target.dataset.template;
    });
  if (actionName === "material-style") {
    materialStyle = target.dataset.style;
    render();
  }
  if (actionName === "sticker")
    changeTarget((e) => {
      const layer = {
        id: id(),
        kind: "sticker",
        text: target.dataset.sticker,
        x: 80,
        y: 60,
        scale: 1,
        rotation: -12,
      };
      e.layers.push(layer);
      selectedLayer = layer.id;
    });
  if (actionName === "layer-delete")
    changeTarget((e) => {
      e.layers = e.layers.filter((l) => l.id !== selectedLayer);
      selectedLayer = null;
      cropMode = false;
    });
  if (actionName === "layer-front" || actionName === "layer-back")
    changeTarget((e) => {
      const layer = e.layers.find((l) => l.id === selectedLayer);
      if (!layer) return;
      e.layers = e.layers.filter((l) => l.id !== selectedLayer);
      if (actionName === "layer-front") e.layers.push(layer);
      else e.layers.unshift(layer);
    });
  if (actionName === "layer-forward" || actionName === "layer-backward")
    changeTarget((e) =>
      moveLayer(e, selectedLayer, actionName === "layer-forward" ? 1 : -1),
    );
  if (actionName === "undo" && history.length) {
    future.push(structuredClone(editor));
    editor = history.pop();
    afterHistoryStep();
  }
  if (actionName === "redo" && future.length) {
    history.push(structuredClone(editor));
    editor = future.pop();
    afterHistoryStep();
  }
  if (actionName === "upload") $("#photo-input").click();
  if (actionName === "add-photos") $("#photos-input").click();
  if (actionName === "save-draft") {
    draftDirty = true;
    flushDraft();
    toast(t("草稿已保存，下次从 Studio 继续。"));
  }
  if (actionName === "save-entry") {
    if (
      !editor.title.trim() &&
      !editor.body.trim() &&
      !editor.photo &&
      !editor.media.length &&
      !editor.layers.length &&
      !editor.moments.length
    ) {
      toast(t("先留下一张照片，或者写点什么吧。"));
      return;
    }
    clearTimeout(draftTimer);
    store.update((s) => saveEntry(s, editor));
    draftDirty = false;
    toast(t("这一天，已经好好收藏。🌷"));
    navigate("home");
  }
  if (actionName === "export") {
    const page = activePage();
    await exportJournalImage(page, {
      resolvePhoto: safePhoto,
      catalog,
      fontFamily,
      dayPage: isDayPage(),
      date: editor.date,
      suffix: isDayPage() ? "" : `moment-${editor.moments.indexOf(page) + 1}`,
      growthCard: (layer) => {
        const check = state().checks.find(
          (item) =>
            item.habitId === layer.habitId && item.date === layer.checkDate,
        );
        const habit = state().habits.find((item) => item.id === layer.habitId);
        return {
          title: habit?.title || layer.text,
          facts: [check?.detail, check?.minutes ? `${check.minutes} min` : ""]
            .filter(Boolean)
            .join(" · "),
          note: check?.note || "",
        };
      },
    });
    toast(t("手帐图片已导出（基础排版版本）。"));
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (target)
    action(target).catch((error) => {
      console.error(error);
      toast(
        error.code === "stale-state"
          ? t("error.conflict")
          : error.code === "backup-size"
            ? t("error.backupSize")
            : t("操作未保存，请检查浏览器存储空间后重试。"),
      );
    });
});
document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.dataset.playerSeek != null) {
    const player = target.closest("[data-player]"),
      audio = player.querySelector("audio"),
      duration = playerDuration(audio, player);
    if (duration) audio.currentTime = (Number(target.value) / 1000) * duration;
    player.style.setProperty("--progress", `${Number(target.value) / 10}%`);
    return;
  }
  if (handleCommunityInput(target)) return;
  handleV3Input(event);
  if (target.dataset.editorField) {
    try {
      changeEditor((e) => {
        e[target.dataset.editorField] = target.value;
      }, false);
    } catch {
      toast(t("编辑失败，请重试。"));
    }
  }
  if (target.dataset.layerField) {
    if (selectedLayerOf())
      changeTarget((e) => {
        const layer = e.layers.find((l) => l.id === selectedLayer);
        layer[target.dataset.layerField] = Number(target.value);
        if (layer.kind === "photo") e.layoutEdited = true;
      }, false);
  }
  if (target.dataset.cropField) {
    if (selectedLayerOf()?.kind === "photo")
      changeTarget((e) => {
        const layer = e.layers.find((l) => l.id === selectedLayer);
        layer.crop = {
          ...cropOf(layer),
          [target.dataset.cropField]: Number(target.value),
        };
      }, false);
  }
  if (target.dataset.momentField) {
    const key = target.dataset.momentField;
    changeTarget((moment) => {
      if (moment === editor) return;
      moment[key] =
        key === "tags"
          ? target.value
              .split(/[,，#]/)
              .map((tag) => tag.trim())
              .filter(Boolean)
              .slice(0, 12)
          : target.value;
      moment.updatedAt = new Date().toISOString();
    }, false);
    const moment = activePage();
    const label = document.querySelector(
      `[data-chapter-label="${CSS.escape(moment.id)}"]`,
    );
    if (label)
      label.textContent =
        (moment.time ? moment.time + " · " : "") +
        (moment.title || t("moment.untitled"));
  }
});
document.addEventListener("change", (event) => {
  if (handleV3Change(event)) return;
  if (event.target.id === "editor-date" && event.target.value) {
    try {
      openStudio(event.target.value);
    } catch {
      toast(t("旧草稿未保存，暂不能切换日期。"));
    }
  }
});
$("#dialog-form").addEventListener("submit", (event) => {
  if (dialogKind === "check-note" || dialogKind === "reflection") {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    try {
      if (dialogKind === "check-note")
        store.update((next) =>
          saveCheckReflection(
            next,
            dialogPayload.habit.id,
            dialogPayload.date,
            {
              ...values,
              photo: dialogPayload.photo || "",
              shareNote: values.shareNote === "on",
            },
          ),
        );
      else
        store.update((next) =>
          saveReflection(next, dialogPayload.period, dialogPayload.key, values),
        );
      $("#form-dialog").close();
      render();
      toast(
        t(
          dialogKind === "reflection"
            ? "reflection.saved"
            : dialogPayload.isNew
              ? "成长已记录，也已关联当天日期 🌱"
              : "growth.noteSaved",
        ),
      );
    } catch (error) {
      toast(
        t(
          error.code === "stale-state"
            ? "error.conflict"
            : "保存失败，请检查本机存储空间。",
        ),
      );
    }
    return;
  }
  if (dialogKind === "book" || dialogKind === "edit-book") {
    event.preventDefault();
    try {
      const book = readBookForm();
      validateFieldDefinitions(book.fields);
      book.id ||= id();
      store.update((next) => saveBook(next, book));
      selectedBook = book.id;
      page = "books";
      $("#form-dialog").close();
      render();
      toast(t("entry.saved"));
    } catch (error) {
      toast(t(error.message || "error.generic"));
    }
    return;
  }
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  try {
    if (dialogKind === "habit") {
      if (!values.title.trim() || !values.theme.trim()) return;
      store.update((s) =>
        s.habits.push({
          id: id(),
          title: values.title.trim(),
          theme: values.theme.trim(),
          kind: values.kind,
          target: Number(values.target),
          minutes: values.kind === "duration" ? Number(values.minutes) : 0,
        }),
      );
    } else if (dialogKind === "duration")
      store.update((s) =>
        toggleCheck(
          s,
          dialogPayload.habit.id,
          dialogPayload.date,
          Number(values.minutes),
        ),
      );
    else {
      if (!values.title.trim() || !values.category.trim()) return;
      store.update((s) =>
        s.books.push({
          id: id(),
          ...values,
          title: values.title.trim(),
          category: values.category.trim(),
        }),
      );
    }
    $("#form-dialog").close();
    render();
    toast(
      dialogKind === "duration"
        ? t("成长已记录，也已关联当天日期 🌱")
        : t("新的小期待，已准备好。"),
    );
  } catch {
    toast(t("保存失败，请检查本机存储空间。"));
  }
});
$("#photo-input").addEventListener("change", (event) =>
  handleImageUpload(event, "primary"),
);
$("#photos-input").addEventListener("change", (event) =>
  handleImageUpload(event, { kind: "photos" }),
);
$("#attachment-image-input").addEventListener("change", (event) =>
  handleImageUpload(event, attachmentTarget),
);
$("#video-input").addEventListener("change", (event) =>
  handleMediaUpload(event, "video"),
);
$("#audio-input").addEventListener("change", (event) =>
  handleMediaUpload(event, "audio"),
);
// Free canvas gestures. Pointer Events cover mouse (Windows), pen and touch:
// one pointer drags, two pointers pinch-scale and rotate, corner handles
// resize/rotate with a mouse, the wheel scales (Shift+wheel rotates) and arrow
// keys nudge. In crop mode the same gestures pan/zoom inside the photo frame.
let drag = null;
const pointers = new Map();
function canvasRect() {
  return $("#journal-canvas")?.getBoundingClientRect();
}
function layerElement(layerId) {
  return document.querySelector(
    `#journal-canvas [data-layer="${CSS.escape(layerId)}"]`,
  );
}
function paintLayer(layer) {
  const element = layerElement(layer.id);
  if (!element) return;
  element.style.left = `${layer.x}%`;
  element.style.top = `${layer.y}%`;
  if (layer.kind === "photo" || layer.w != null)
    element.style.width = `${layer.w}%`;
  if (layer.kind === "photo") element.style.height = `${layer.h}%`;
  element.style.transform = layerGeometry(layer).match(/transform:(.*)$/)[1];
  const image = element.querySelector(".photo-crop img");
  if (image) image.setAttribute("style", cropStyle(layer));
}
function gestureSnapshot(layer) {
  return {
    x: layer.x,
    y: layer.y,
    w:
      layer.w ??
      (layer.kind === "photo" ? 42 : layer.kind === "text" ? 65 : 62),
    h: layer.h ?? 34,
    scale: layer.scale,
    rotation: layer.rotation,
    crop: cropOf(layer),
  };
}
function twoPointerMetrics() {
  const [a, b] = [...pointers.values()];
  return {
    distance: Math.hypot(b.x - a.x, b.y - a.y) || 1,
    angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}
function beginGesture(layer, mode, event) {
  const rect = canvasRect();
  drag = {
    layer,
    mode,
    rect,
    startX: event.clientX,
    startY: event.clientY,
    start: gestureSnapshot(layer),
    before: structuredClone(editor),
    moved: false,
  };
  if (mode === "rotate") {
    const element = layerElement(layer.id).getBoundingClientRect();
    drag.center = {
      x: element.left + element.width / 2,
      y: element.top + element.height / 2,
    };
    drag.startAngle =
      (Math.atan2(
        event.clientY - drag.center.y,
        event.clientX - drag.center.x,
      ) *
        180) /
      Math.PI;
  }
  if (mode === "pinch") Object.assign(drag, twoPointerMetrics());
}
$("#app").addEventListener("pointerdown", (event) => {
  if (page !== "studio") return;
  const canvas = event.target.closest("#journal-canvas");
  if (!canvas) return;
  const element = event.target.closest("[data-layer]");
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  // A second finger anywhere on the canvas pinches the selected layer.
  if (pointers.size === 2 && drag?.layer) {
    beginGesture(drag.layer, "pinch", event);
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {}
    event.preventDefault();
    return;
  }
  if (!element) {
    if (selectedLayer && pointers.size === 1) {
      selectedLayer = null;
      cropMode = false;
      if (studioTool === "layer") studioTool = null;
      render();
    }
    return;
  }
  const layer = activePage().layers.find((l) => l.id === element.dataset.layer);
  if (!layer) return;
  if (selectedLayer !== layer.id) {
    if (cropMode) cropMode = false;
    selectedLayer = layer.id;
    // Re-render so handles and controls appear, then keep dragging.
    $("#canvas-wrap").innerHTML = canvasHTML();
    studioTool = "layer";
    refreshToolMenu();
  }
  const handle = event.target.closest("[data-handle]")?.dataset.handle;
  beginGesture(
    layer,
    cropMode && layer.kind === "photo" ? "crop" : handle || "move",
    event,
  );
  try {
    $("#journal-canvas").setPointerCapture(event.pointerId);
  } catch {}
  event.preventDefault();
});
$("#app").addEventListener("pointermove", (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (!drag) return;
  const { layer, start, rect } = drag;
  const dx = ((event.clientX - drag.startX) / rect.width) * 100,
    dy = ((event.clientY - drag.startY) / rect.height) * 100;
  if (drag.mode === "move") {
    layer.x = Math.max(0, Math.min(100, start.x + dx));
    layer.y = Math.max(0, Math.min(100, start.y + dy));
  } else if (drag.mode === "resize") {
    const factor = 2 / (start.scale || 1);
    layer.w =
      Math.round(Math.max(8, Math.min(100, start.w + dx * factor)) * 10) / 10;
    if (layer.kind === "photo")
      layer.h =
        Math.round(Math.max(8, Math.min(100, start.h + dy * factor)) * 10) / 10;
  } else if (drag.mode === "rotate") {
    const angle =
      (Math.atan2(
        event.clientY - drag.center.y,
        event.clientX - drag.center.x,
      ) *
        180) /
      Math.PI;
    layer.rotation = Math.round(
      ((start.rotation + angle - drag.startAngle + 540) % 360) - 180,
    );
  } else if (drag.mode === "pinch" && pointers.size >= 2) {
    const metrics = twoPointerMetrics();
    if (cropMode && layer.kind === "photo")
      layer.crop = {
        ...start.crop,
        zoom: Math.max(
          1,
          Math.min(4, start.crop.zoom * (metrics.distance / drag.distance)),
        ),
      };
    else {
      layer.scale =
        Math.round(
          Math.max(
            0.3,
            Math.min(3, start.scale * (metrics.distance / drag.distance)),
          ) * 100,
        ) / 100;
      layer.rotation = Math.round(
        ((start.rotation + metrics.angle - drag.angle + 540) % 360) - 180,
      );
    }
  } else if (drag.mode === "crop") {
    const zoom = start.crop.zoom;
    layer.crop = {
      ...start.crop,
      x: Math.max(
        0,
        Math.min(100, start.crop.x - (dx * 100) / ((start.w || 42) * zoom)),
      ),
      y: Math.max(
        0,
        Math.min(100, start.crop.y - (dy * 100) / ((start.h || 34) * zoom)),
      ),
    };
  }
  drag.moved ||=
    Math.abs(event.clientX - drag.startX) +
      Math.abs(event.clientY - drag.startY) >
      2 || drag.mode === "pinch";
  paintLayer(layer);
});
function commitGesture() {
  if (!drag) return;
  const { moved, before, layer } = drag;
  drag = null;
  if (moved) {
    history.push(before);
    if (history.length > 30) history.shift();
    future = [];
    if (layer.kind === "photo") activePage().layoutEdited = true;
    scheduleDraft();
  }
  render();
}
function endPointer(event) {
  if (!pointers.has(event.pointerId)) return;
  pointers.delete(event.pointerId);
  if (!drag) return;
  if (drag.mode === "pinch" && pointers.size === 1) {
    // Lifting one finger finishes the pinch; the other may keep dragging.
    const [pointer] = pointers.values();
    const layer = drag.layer,
      wasMoved = drag.moved,
      before = drag.before;
    beginGesture(layer, cropMode && layer.kind === "photo" ? "crop" : "move", {
      clientX: pointer.x,
      clientY: pointer.y,
    });
    drag.before = before;
    drag.moved = wasMoved;
    return;
  }
  if (!pointers.size) commitGesture();
}
$("#app").addEventListener("pointerup", endPointer);
$("#app").addEventListener("pointercancel", endPointer);
let wheelCommit;
$("#app").addEventListener(
  "wheel",
  (event) => {
    if (page !== "studio" || !selectedLayer) return;
    const element = event.target.closest("[data-layer]");
    if (!element || element.dataset.layer !== selectedLayer) return;
    const layer = selectedLayerOf();
    if (!layer) return;
    event.preventDefault();
    if (!wheelCommit) {
      history.push(structuredClone(editor));
      if (history.length > 30) history.shift();
      future = [];
    }
    if (cropMode && layer.kind === "photo") {
      const crop = cropOf(layer);
      layer.crop = {
        ...crop,
        zoom: Math.max(
          1,
          Math.min(4, crop.zoom * (event.deltaY < 0 ? 1.06 : 0.94)),
        ),
      };
    } else if (event.shiftKey)
      layer.rotation = Math.round(
        ((layer.rotation + (event.deltaY < 0 ? 3 : -3) + 540) % 360) - 180,
      );
    else
      layer.scale =
        Math.round(
          Math.max(
            0.3,
            Math.min(3, layer.scale * (event.deltaY < 0 ? 1.05 : 0.95)),
          ) * 100,
        ) / 100;
    if (layer.kind === "photo") activePage().layoutEdited = true;
    paintLayer(layer);
    clearTimeout(wheelCommit);
    wheelCommit = setTimeout(() => {
      wheelCommit = null;
      scheduleDraft();
      render();
    }, 350);
  },
  { passive: false },
);
$("#app").addEventListener("keydown", (event) => {
  const element = event.target.closest("[data-layer]");
  if (!element) {
    if (
      event.target.closest('[data-action="zoom-photo"]') &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      openLightbox(
        event.target.closest('[data-action="zoom-photo"]').dataset.src,
      );
    }
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectedLayer = element.dataset.layer;
    studioTool = "layer";
    render();
    $(".layer-controls")?.scrollIntoView({ block: "nearest" });
    return;
  }
  const delta = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  }[event.key];
  if (delta && element.dataset.layer === selectedLayer) {
    event.preventDefault();
    const step = event.shiftKey ? 5 : 1;
    changeTarget((page) => {
      const layer = page.layers.find((item) => item.id === selectedLayer);
      layer.x = Math.max(0, Math.min(100, layer.x + delta[0] * step));
      layer.y = Math.max(0, Math.min(100, layer.y + delta[1] * step));
      if (layer.kind === "photo") page.layoutEdited = true;
    }, false);
    layerElement(selectedLayer)?.focus();
  }
  if (
    (event.key === "Delete" || event.key === "Backspace") &&
    element.dataset.layer === selectedLayer
  ) {
    event.preventDefault();
    changeTarget((page) => {
      page.layers = page.layers.filter((layer) => layer.id !== selectedLayer);
      selectedLayer = null;
    });
  }
});
window.addEventListener("beforeunload", (event) => {
  try {
    if (recorder || busyMedia) throw new Error("Media pending");
    flushDraft();
  } catch {
    event.preventDefault();
    event.returnValue = "";
  }
});
$("#backup-input").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 150 * 1024 * 1024) throw new Error("Backup is too large");
    const backup = JSON.parse(await file.text());
    if (
      backup.format !== "little-days-backup" ||
      backup.version !== 1 ||
      backup.state?.schemaVersion !== 1
    )
      throw new Error("Invalid backup");
    if (!(await askConfirm(t("settings.restoreConfirm")))) return;
    busyMedia = true;
    const restored = normalizeState(await media.restore(backup));
    store.update((next) => {
      for (const key of Object.keys(next)) delete next[key];
      Object.assign(next, restored);
    });
    editor = null;
    await media.hydrate(state());
    render();
    toast(t("settings.restoreDone"));
  } catch {
    toast(t("settings.restoreFailed"));
  } finally {
    busyMedia = false;
    event.target.value = "";
  }
});
function applyShellLanguage() {
  $("#navigation").setAttribute("aria-label", t("nav.label"));
  document.title =
    "Little Days · " +
    (languageCode() === "en" ? "The Little Stationery Shop" : "手帐文具店");
  const preview = document.querySelector(".preview-label>span:last-child");
  if (preview) preview.textContent = t("preview.label");
  const foot = document.querySelector(".preview-footnote");
  if (foot) foot.textContent = t("preview.footer");
  const note = document.querySelector(".desktop-note h1 span");
  if (note) note.textContent = t("brand.note");
  const motto = document.querySelector(".desktop-note>p:not(.note-eyebrow)");
  if (motto) motto.textContent = t("brand.motto");
}
function openBookDialog(book = null) {
  bookDraft = book
    ? structuredClone(book)
    : {
        title: "",
        description: "",
        category: "Daily Life",
        color: "blush",
        cover: "🌷",
        coverTemplate: "minimal-linen",
        coverFont: "elegant",
        coverDecoration: "tulip",
        coverImage: "",
        fields: [],
        visibility: "private",
      };
  dialogKind = book ? "edit-book" : "book";
  $("#dialog-form").innerHTML = bookDialogHTML(bookDraft, ctx());
  $("#form-dialog").classList.add("book-editor-dialog");
  $("#form-dialog").showModal();
}
function readBookForm() {
  const values = Object.fromEntries(new FormData($("#dialog-form")));
  const fields = [...document.querySelectorAll("[data-field-row]")].map(
    (row) => {
      const original =
        bookDraft.fields?.find((field) => field.id === row.dataset.fieldRow) ||
        {};
      const label = row.querySelector("[data-definition-label]").value.trim();
      const field = {
        ...original,
        id: row.dataset.fieldRow,
        label,
        type: row.querySelector("[data-definition-type]").value,
        options: row
          .querySelector("[data-definition-options]")
          .value.split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (label !== fieldLabel(original, languageCode())) {
        delete field.labelZh;
        delete field.labelEn;
      }
      return field;
    },
  );
  return {
    ...bookDraft,
    ...values,
    title: values.title?.trim() || "",
    category: values.category?.trim() || "",
    fields,
    visibility: "private",
  };
}
function refreshBookPreview() {
  if (!$("#book-cover-preview")) return;
  bookDraft = readBookForm();
  $("#book-cover-preview").innerHTML = coverHTML(bookDraft, ctx());
}
function chooseAttachment(target) {
  attachmentTarget = target;
  $("#attachment-image-input").multiple = target.kind === "collage";
  $("#attachment-image-input").click();
}
function afterHistoryStep() {
  if (activeMomentId && !findMoment(editor, activeMomentId))
    activeMomentId = null;
  if (!selectedLayerOf()) selectedLayer = null;
  cropMode = false;
  scheduleDraft();
  render();
}
function selectMoment(momentId) {
  activeMomentId = momentId || null;
  templateCount = null;
  selectedLayer = null;
  cropMode = false;
  if (studioTool === "layer") studioTool = null;
  // A Moment with audio/video opens its players straight away.
  const page = activePage();
  if (!studioTool && page.media?.length) studioTool = "media";
  render();
  $(".chapter-chips")?.scrollIntoView({ block: "start" });
}
function addMomentNow() {
  let created;
  changeEditor((entry) => {
    const now = new Date();
    created = createMoment(entry, {
      time:
        entry.date === dateKey()
          ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
          : "",
    });
    entry.moments.push(created);
  }, false);
  studioTool = null;
  selectMoment(created.id);
  $('[data-moment-field="title"]')?.focus();
  toast(t("moment.added"));
}
// ---------- Community (local demo, separate storage) ----------
function social() {
  demoSocial ||= Community.loadDemo(localStorage);
  return demoSocial;
}
function persistSocial() {
  try {
    Community.saveDemo(localStorage, social());
  } catch {
    toast(t("community.saveFailed"));
  }
}
function openCommunity(changes = {}) {
  communityView = { ...communityView, saveMenu: false, reportMenu: false, ...changes };
  page = "community";
  render();
}
const SIMULATED_REPLIES = ["community.sim1", "community.sim2", "community.sim3"];
async function communityAction(target) {
  const name = target.dataset.action;
  if (!name?.startsWith("community-")) return false;
  const demo = social();
  const work = communityView.workId;
  const user = target.dataset.user;
  try {
    switch (name) {
      case "community-tab":
        openCommunity({ tab: target.dataset.tab, workId: null, chatUser: null, publish: null });
        $("#app-scroll").scrollTop = 0;
        break;
      case "community-open-work":
        openCommunity({ workId: target.dataset.work, replyTo: null });
        $("#app-scroll").scrollTop = 0;
        break;
      case "community-back":
        openCommunity({ workId: null });
        break;
      case "community-like":
        Community.toggleLike(demo, work);
        persistSocial();
        openCommunity();
        break;
      case "community-save-menu":
        communityView.saveMenu = !communityView.saveMenu;
        render();
        break;
      case "community-save":
        Community.saveAs(demo, work, target.dataset.type || null);
        persistSocial();
        toast(t(target.dataset.type ? "community.saved" : "community.unsaved"));
        openCommunity();
        break;
      case "community-share": {
        const item = demo.works.find((w) => w.id === work);
        const text = t("community.shareText", { title: item.title });
        try {
          await navigator.clipboard.writeText(text);
          toast(t("community.shareCopied"));
        } catch {
          toast(text);
        }
        break;
      }
      case "community-report-menu":
        communityView.reportMenu = !communityView.reportMenu;
        render();
        break;
      case "community-report":
        Community.report(demo, "work", work, target.dataset.reason);
        persistSocial();
        toast(t("community.reported"));
        openCommunity({ workId: null });
        break;
      case "community-report-user":
        Community.report(demo, "user", user, "other");
        persistSocial();
        toast(t("community.reported"));
        break;
      case "community-reply":
        communityView.replyTo = target.dataset.comment || null;
        render();
        $("#community-comment")?.focus();
        break;
      case "community-comment":
        Community.addComment(demo, work, $("#community-comment").value, communityView.replyTo);
        persistSocial();
        openCommunity({ replyTo: null });
        break;
      case "community-toggle-comments":
        Community.setCommentsOpen(demo, target.dataset.work || work, target.checked);
        persistSocial();
        openCommunity();
        break;
      case "community-unpublish":
        if (!(await askConfirm(t("community.unpublishConfirm")))) break;
        Community.unpublish(demo, target.dataset.work || work);
        persistSocial();
        toast(t("community.unpublished"));
        openCommunity({ workId: null, tab: "me" });
        break;
      case "community-follow":
        Community.toggleFollow(demo, user);
        persistSocial();
        openCommunity();
        break;
      case "community-friend-request":
        Community.requestFriend(demo, user);
        persistSocial();
        toast(t("community.requestSent"));
        openCommunity();
        break;
      case "community-friend-accept":
      case "community-simulate-accept":
        Community.acceptFriend(demo, user);
        persistSocial();
        openCommunity();
        break;
      case "community-friend-decline":
        Community.declineFriend(demo, user);
        persistSocial();
        openCommunity();
        break;
      case "community-friend-cancel":
        Community.cancelRequest(demo, user);
        persistSocial();
        openCommunity();
        break;
      case "community-friend-remove":
        if (!(await askConfirm(t("community.removeConfirm")))) break;
        Community.removeFriend(demo, user);
        persistSocial();
        openCommunity();
        break;
      case "community-block":
        if (!(await askConfirm(t("community.blockConfirm")))) break;
        Community.block(demo, user);
        persistSocial();
        toast(t("community.blockedToast"));
        openCommunity({ chatUser: null, workId: null });
        break;
      case "community-unblock":
        Community.unblock(demo, user);
        persistSocial();
        openCommunity();
        break;
      case "community-period":
        openCommunity({ period: target.dataset.period });
        break;
      case "community-category":
        openCommunity({ category: target.dataset.category });
        break;
      case "community-open-chat":
        Community.markRead(demo, user);
        persistSocial();
        openCommunity({ tab: "messages", chatUser: user, workId: null });
        break;
      case "community-chat-back":
        openCommunity({ chatUser: null });
        break;
      case "community-sticker":
      case "community-send": {
        const text = name === "community-send" ? $("#chat-text").value : "";
        const workId = name === "community-send" ? $("#chat-share-work")?.value : "";
        Community.sendMessage(demo, communityView.chatUser, {
          text,
          sticker: name === "community-sticker" ? target.dataset.sticker : null,
          workId: workId || null,
        });
        persistSocial();
        openCommunity();
        const chatUser = communityView.chatUser;
        setTimeout(() => {
          if (!Community.canMessage(social(), chatUser)) return;
          const key = SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)];
          Community.simulateReply(social(), chatUser, t(key));
          if (page === "community" && communityView.chatUser === chatUser) Community.markRead(social(), chatUser);
          persistSocial();
          if (page === "community") render();
        }, 1200);
        break;
      }
      case "community-delete-message":
        Community.deleteMessage(demo, communityView.chatUser, target.dataset.message);
        persistSocial();
        openCommunity();
        break;
      case "community-delete-chat":
        if (!(await askConfirm(t("community.deleteChatConfirm")))) break;
        Community.deleteConversation(demo, user);
        persistSocial();
        openCommunity({ chatUser: null });
        break;
      case "community-publish-start":
        openCommunity({
          tab: "me",
          publish: { date: "", pages: [], media: [], title: "", category: "Daily Life", commentsOpen: demo.profile.defaultCommentsOpen !== false, confirmed: false },
        });
        $("#app-scroll").scrollTop = 0;
        break;
      case "community-feed":
        openCommunity({ feed: target.dataset.feed, query: "" });
        break;
      case "community-jump":
        if (target.dataset.target === "friends") openCommunity({ tab: "friends" });
        else document.getElementById(target.dataset.target)?.scrollIntoView({ block: "start", behavior: "smooth" });
        break;
      case "community-profile-edit":
        openCommunity({ editProfile: !communityView.editProfile });
        break;
      case "community-profile-cancel":
        openCommunity({ editProfile: false });
        break;
      case "community-avatar":
        Community.updateProfile(demo, { avatar: target.dataset.avatar });
        persistSocial();
        openCommunity();
        break;
      case "community-profile-save":
        Community.updateProfile(demo, { name: $("#profile-name").value, bio: $("#profile-bio").value });
        persistSocial();
        toast(t("community.profileSaved"));
        openCommunity({ editProfile: false });
        break;
      case "community-saved-type":
        openCommunity({ savedType: target.dataset.type || "" });
        break;
      case "community-publish-cancel":
        openCommunity({ publish: null });
        break;
      case "community-publish-submit": {
        const created = Community.publishDay(demo, state(), communityView.publish.date, communityView.publish);
        persistSocial();
        toast(t("community.published"));
        openCommunity({ publish: null, workId: created.id });
        break;
      }
      case "community-reset":
        if (!(await askConfirm(t("community.resetConfirm")))) break;
        demoSocial = Community.createDemoState();
        persistSocial();
        openCommunity({ tab: "discover", workId: null, chatUser: null, publish: null });
        break;
      default:
        return false;
    }
  } catch (error) {
    toast(t(error.message?.startsWith("community.") ? error.message : "error.generic"));
  }
  return true;
}
function handleCommunityInput(target) {
  if (target.dataset.peopleSearch != null) {
    communityView.peopleQuery = target.value;
    render();
    return true;
  }
  if (target.dataset.communitySearch != null) {
    communityView.query = target.value;
    const caret = target.selectionStart;
    render();
    const input = $("#community-search");
    input?.focus();
    input?.setSelectionRange(caret, caret);
    return true;
  }
  const field = target.dataset.publish;
  if (field === "title" || field === "category") {
    communityView.publish[field] = target.value;
    return true;
  }
  return false;
}
function handleCommunityChange(target) {
  if (target.dataset.profileSetting) {
    const key = target.dataset.profileSetting;
    Community.updateProfile(social(), { [key]: target.type === "checkbox" ? target.checked : target.value });
    persistSocial();
    toast(t("community.settingSaved"));
    render();
    return true;
  }
  const p = communityView.publish;
  if (!p) return false;
  if (target.dataset.publish === "date") {
    communityView.publish = { ...p, date: target.value, pages: [], media: [], confirmed: false };
  } else if (target.dataset.publish === "commentsOpen" || target.dataset.publish === "confirmed") {
    p[target.dataset.publish] = target.checked;
  } else if (target.dataset.publishPage) {
    const id = target.dataset.publishPage;
    p.pages = target.checked ? [...p.pages, id] : p.pages.filter((x) => x !== id);
  } else if (target.dataset.publishMedia) {
    const id = target.dataset.publishMedia;
    p.media = target.checked ? [...p.media, id] : p.media.filter((x) => x !== id);
  } else return false;
  render();
  return true;
}
function openTool(tool) {
  studioTool = studioTool === tool ? null : tool;
  render();
  if (studioTool)
    document
      .querySelector(`[data-tool-row="${studioTool}"]`)
      ?.scrollIntoView({ block: "nearest" });
}
async function v31Action(target) {
  const name = target.dataset.action;
  const momentId = target.dataset.moment;
  switch (name) {
    case "tool":
      openTool(target.dataset.tool);
      return true;
    case "book-filter-clear":
      bookFilter = { month: "", date: "" };
      render();
      return true;
    case "habit-journey":
      openJourney(target.dataset.habit, 0);
      $("#app-scroll").scrollTop = 0;
      return true;
    case "journey-page":
      openJourney(journeyHabit, Number(target.dataset.page));
      return true;
    case "journey-back":
      page = "growth";
      render();
      return true;
    case "preview-size":
      previewLarge = !previewLarge;
      render();
      return true;
    case "select-moment":
      selectMoment(momentId);
      return true;
    case "add-moment":
      addMomentNow();
      return true;
    case "quick-moment":
      // Home / Calendar / Day Detail: one tap to start writing a Moment.
      openStudio(target.dataset.date || dateKey());
      addMomentNow();
      return true;
    case "moment-up":
    case "moment-down":
      changeEditor((entry) =>
        moveMoment(entry, momentId, name === "moment-up" ? -1 : 1),
      );
      return true;
    case "moment-collapse":
      changeEditor((entry) => {
        const moment = findMoment(entry, momentId);
        if (moment) moment.collapsed = !moment.collapsed;
      });
      return true;
    case "moment-duplicate": {
      let copy;
      changeEditor(
        (entry) => (copy = duplicateMoment(entry, activeMomentId)),
        false,
      );
      if (copy) selectMoment(copy.id);
      return true;
    }
    case "moment-delete": {
      const moment = findMoment(editor, activeMomentId);
      if (!moment) return true;
      if (
        hasMomentContent(moment) &&
        !(await askConfirm(t("moment.deleteConfirm")))
      )
        return true;
      changeEditor((entry) => removeMoment(entry, moment.id), false);
      selectMoment(null);
      toast(t("moment.deleted"));
      return true;
    }
    case "save-moment": {
      if (!activeMomentId) return true;
      clearTimeout(draftTimer);
      const savedAt = new Date().toISOString();
      const snapshot = structuredClone(editor);
      findMoment(snapshot, activeMomentId).savedAt = savedAt;
      store.update((next) => {
        saveMoment(next, snapshot, activeMomentId);
        next.drafts[editor.date] = structuredClone(snapshot);
      });
      editor = snapshot;
      draftDirty = false;
      render();
      toast(t("moment.savedToast"));
      return true;
    }
    case "moment-mood":
      changeTarget((moment) => {
        if (moment !== editor)
          moment.mood =
            moment.mood === target.dataset.mood ? "" : target.dataset.mood;
      });
      return true;
    case "moment-template":
      changeTarget((moment) => {
        if (moment !== editor) moment.template = target.dataset.template;
      });
      return true;
    case "template-count":
      templateCount = Number(target.dataset.count);
      render();
      return true;
    case "apply-layout": {
      const page = activePage();
      if (page.layoutEdited && !(await askConfirm(t("layout.confirm"))))
        return true;
      const count = Number(target.dataset.count ?? -1);
      try {
        changeTarget((entry) => {
          if (entry === editor) freeMainPhoto(entry);
          if (count >= 0)
            applyPageTemplate(entry, count, target.dataset.template, photoRegion());
          else applyLayout(entry, target.dataset.template, photoRegion());
        });
      } catch (error) {
        toast(t(error.message));
        return true;
      }
      toast(
        t("layout.applied", { name: t("layout." + target.dataset.template) }),
      );
      return true;
    }
    case "free-main-photo":
      changeEditor((entry) => {
        const layer = freeMainPhoto(entry);
        if (layer) selectedLayer = layer.id;
        entry.layoutEdited = true;
      });
      editorMode = "creative";
      render();
      return true;
    case "crop-mode":
      cropMode = !cropMode;
      render();
      return true;
    case "replace-photo":
      if (selectedLayerOf()?.kind === "photo")
        chooseAttachment({ kind: "replace", layer: selectedLayer });
      return true;
    case "insert-growth": {
      const check = state().checks.find(
        (item) =>
          item.habitId === target.dataset.habit && item.date === editor.date,
      );
      const habit = state().habits.find(
        (item) => item.id === target.dataset.habit,
      );
      if (!check || !habit) return true;
      changeTarget((page) => {
        if (
          page.layers.some(
            (layer) =>
              layer.kind === "growth" &&
              layer.habitId === check.habitId &&
              layer.checkDate === check.date,
          )
        )
          return;
        const layer = {
          id: id(),
          kind: "growth",
          text: habit.title,
          habitId: check.habitId,
          checkDate: check.date,
          x: 50,
          y: 50,
          w: 62,
          scale: 1,
          rotation: -2,
        };
        page.layers.push(layer);
        selectedLayer = layer.id;
      });
      toast(t("growth.insertedToast"));
      return true;
    }
    case "check-note":
      openCheckDialog(target.dataset.habit, target.dataset.date);
      return true;
    case "check-photo":
      chooseAttachment({ kind: "check-photo" });
      return true;
    case "check-photo-remove":
      if (dialogPayload) dialogPayload.photo = "";
      if ($("#check-photo-preview")) $("#check-photo-preview").innerHTML = "";
      return true;
    case "reflection-edit":
      openReflectionDialog(target.dataset.period, target.dataset.key);
      return true;
  }
  return false;
}
async function v3Action(target) {
  const name = target.dataset.action;
  if (busyMedia) {
    toast(t("media.busy"));
    return true;
  }
  if (await v31Action(target)) return true;
  if (await communityAction(target)) return true;
  if (name === "new-book") {
    openBookDialog();
    return true;
  }
  if (name === "edit-book") {
    openBookDialog(
      state().books.find((book) => book.id === target.dataset.book),
    );
    return true;
  }
  if (name === "cover-template") {
    bookDraft = readBookForm();
    bookDraft.coverTemplate = target.dataset.template;
    $('#dialog-form [name="coverTemplate"]').value = target.dataset.template;
    document
      .querySelectorAll(".cover-option")
      .forEach((option) =>
        option.classList.toggle(
          "selected",
          option.dataset.template === target.dataset.template,
        ),
      );
    refreshBookPreview();
    return true;
  }
  if (name === "cover-photo") {
    chooseAttachment({ kind: "cover" });
    return true;
  }
  if (name === "cover-photo-remove") {
    bookDraft = readBookForm();
    bookDraft.coverImage = "";
    refreshBookPreview();
    return true;
  }
  if (name === "field-add") {
    bookDraft = readBookForm();
    const field = { id: id(), label: "", type: "text", options: [] };
    bookDraft.fields.push(field);
    $("#book-field-list").insertAdjacentHTML(
      "beforeend",
      fieldDefinitionHTML(field, ctx()),
    );
    return true;
  }
  if (name === "field-remove") {
    target.closest("[data-field-row]").remove();
    refreshBookPreview();
    return true;
  }
  if (name === "field-image") {
    chooseAttachment({ kind: "field", field: target.dataset.field });
    return true;
  }
  if (name === "language") {
    flushDraft();
    setLanguage(target.dataset.language);
    render();
    return true;
  }
  if (name === "material-category") {
    materialCategory = target.dataset.category;
    render();
    return true;
  }
  if (name === "asset-sticker") {
    const asset = catalog.stickers.find((s) => s.id === target.dataset.sticker);
    changeTarget((entry) => {
      const layer = {
        id: id(),
        kind: "sticker",
        assetId: asset.id,
        text: languageCode() === "en" ? asset.nameEn : asset.nameZh,
        x: 80,
        y: 60,
        scale: 1,
        rotation: -12,
      };
      entry.layers.push(layer);
      selectedLayer = layer.id;
    });
    return true;
  }
  if (name === "layer-copy") {
    changeTarget((entry) => {
      const original = entry.layers.find((layer) => layer.id === selectedLayer);
      if (!original) return;
      const copy = {
        ...structuredClone(original),
        id: id(),
        x: Math.min(95, original.x + 5),
        y: Math.min(95, original.y + 5),
      };
      entry.layers.push(copy);
      selectedLayer = copy.id;
    });
    return true;
  }
  if (name === "add-text-layer") {
    changeTarget((entry) => {
      const layer = {
        id: id(),
        kind: "text",
        text: t("layer.newText"),
        x: 50,
        y: 60,
        scale: 1,
        rotation: 0,
        fontId: "handwritten",
        fontSize: 16,
        color: "#6A7059",
        weight: 400,
        spacing: 0,
        align: "left",
      };
      entry.layers.push(layer);
      selectedLayer = layer.id;
    });
    return true;
  }
  if (name === "collage-photo") {
    chooseAttachment({ kind: "collage" });
    return true;
  }
  if (name === "upload-video") {
    $("#video-input").click();
    return true;
  }
  if (name === "upload-audio") {
    $("#audio-input").click();
    return true;
  }
  if (name === "video-poster") {
    chooseAttachment({ kind: "poster", clip: target.dataset.clip });
    return true;
  }
  if (name === "remove-media") {
    changeTarget((entry) => {
      entry.media = entry.media.filter(
        (clip) => clip.id !== target.dataset.clip,
      );
    });
    return true;
  }
  if (name === "record-audio") {
    await startRecording();
    return true;
  }
  if (name === "stop-recording") {
    if (recorder?.state === "recording") recorder.stop();
    return true;
  }
  if (name === "restore-backup") {
    $("#backup-input").click();
    return true;
  }
  if (name === "backup") {
    flushDraft();
    const backup = await media.backup(state());
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `Little-Days-Backup-${dateKey()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast(t("settings.backupDone"));
    return true;
  }
  return false;
}
function handleV3Input(event) {
  const target = event.target;
  if (
    target.closest("#dialog-form") &&
    (dialogKind === "book" || dialogKind === "edit-book")
  )
    refreshBookPreview();
  if (target.dataset.customField) {
    const field = target.dataset.customField;
    const value =
      target.dataset.fieldType === "checkbox"
        ? target.checked
        : ["number", "duration"].includes(target.dataset.fieldType) &&
            target.value !== ""
          ? Number(target.value)
          : target.value;
    changeEditor((entry) => {
      entry.fieldValues[field] = value;
    }, false);
  }
  if (target.dataset.textStyle) {
    const key = target.dataset.textStyle;
    changeEditor((entry) => {
      entry.textStyle[key] =
        key === "color" ? target.value : Number(target.value);
    }, false);
  }
  if (target.dataset.layerText) {
    const key = target.dataset.layerText;
    changeTarget((entry) => {
      const layer = entry.layers.find((item) => item.id === selectedLayer);
      if (layer)
        layer[key] = ["fontSize", "weight", "spacing"].includes(key)
          ? Number(target.value)
          : target.value;
    }, key === "frame");
  }
  if (target.dataset.layerFlag) {
    const key = target.dataset.layerFlag;
    changeTarget((entry) => {
      const layer = entry.layers.find((item) => item.id === selectedLayer);
      if (layer) layer[key] = target.checked;
    }, false);
  }
}
function handleV3Change(event) {
  const target = event.target;
  if (handleCommunityChange(target)) return true;
  if (target.dataset.bookFilter) {
    bookFilter =
      target.dataset.bookFilter === "date"
        ? { month: "", date: target.value }
        : { month: target.value, date: "" };
    render();
    return true;
  }
  if (target.id === "editor-date" && (busyMedia || recorder)) {
    toast(t("media.busy"));
    render();
    return true;
  }
  if (target.dataset.editorField === "bookId") {
    render();
    return true;
  }
  if (target.id === "book-preset") {
    const preset = catalog.recordTemplates?.find(
      (item) => item.id === target.value,
    );
    if (!preset) return true;
    bookDraft = readBookForm();
    for (const definition of preset.fields) {
      const field = {
        ...structuredClone(definition),
        id: `${preset.id}-${definition.id}`,
        label:
          languageCode() === "en" ? definition.labelEn : definition.labelZh,
      };
      if (!bookDraft.fields.some((existing) => existing.id === field.id)) {
        bookDraft.fields.push(field);
        $("#book-field-list").insertAdjacentHTML(
          "beforeend",
          fieldDefinitionHTML(field, ctx()),
        );
      }
    }
    return true;
  }
  return false;
}
async function imageBlob(file) {
  if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024)
    throw new Error(t("media.imageLimit"));
  const source = URL.createObjectURL(file);
  let image;
  try {
    image = await loadImage(source);
  } finally {
    URL.revokeObjectURL(source);
  }
  const canvas = document.createElement("canvas"),
    factor = Math.min(1, 1200 / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * factor));
  canvas.height = Math.max(1, Math.round(image.height * factor));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Image encoding failed")),
      "image/jpeg",
      0.84,
    ),
  );
}
const MAX_PHOTOS_PER_PICK = 20;
async function handleImageUpload(event, target) {
  const files = [...event.target.files];
  if (!files.length) return;
  if (busyMedia) {
    toast(t("media.busy"));
    event.target.value = "";
    return;
  }
  busyMedia = true;
  const multiple = ["photos", "collage"].includes(target?.kind);
  let failed = 0;
  try {
    const saved = [];
    // Every Blob is written to IndexedDB before any metadata references it.
    for (const file of files.slice(0, multiple ? MAX_PHOTOS_PER_PICK : 1)) {
      try {
        const blob = await imageBlob(file),
          mediaId = await media.put(blob, { kind: "photo", name: file.name });
        saved.push({ reference: `media:${mediaId}`, name: file.name });
      } catch (error) {
        if (!multiple) throw error;
        failed++;
      }
    }
    if (!saved.length) throw new Error(t("media.failed"));
    const [{ reference }] = saved;
    if (target?.kind === "cover") {
      bookDraft = readBookForm();
      bookDraft.coverImage = reference;
      refreshBookPreview();
    } else if (target?.kind === "check-photo") {
      dialogPayload.photo = reference;
      const preview = $("#check-photo-preview");
      if (preview)
        preview.innerHTML = `<img src="${esc(safePhoto(reference))}" alt="">`;
    } else if (target?.kind === "field") {
      changeEditor((entry) => {
        entry.fieldValues[target.field] = reference;
      });
      flushDraft();
    } else if (target?.kind === "poster") {
      changeTarget((entry) => {
        const clip = entry.media.find((item) => item.id === target.clip);
        if (clip) clip.poster = reference;
      });
      flushDraft();
    } else if (target?.kind === "replace") {
      changeTarget((entry) => {
        const layer = entry.layers.find((item) => item.id === target.layer);
        if (layer) {
          layer.mediaRef = reference;
          layer.text = saved[0].name;
          layer.crop = { x: 50, y: 50, zoom: 1 };
        }
      });
      flushDraft();
    } else if (multiple) {
      addPhotoLayers(saved);
      flushDraft();
    } else {
      changeEditor((entry) => {
        entry.photo = reference;
      });
      flushDraft();
    }
    toast(
      failed
        ? t("photo.partial", { saved: saved.length, failed })
        : multiple && saved.length > 1
          ? t("photo.addedMany", { count: saved.length })
          : t(target?.kind === "cover" ? "media.saved" : "media.savedPhoto"),
    );
  } catch (error) {
    toast(
      error.message === t("media.imageLimit")
        ? error.message
        : t("media.failed"),
    );
  } finally {
    busyMedia = false;
    event.target.value = "";
  }
}
// New photos never overwrite existing ones. While the page still follows an
// auto layout, all photos are re-flowed; after manual edits, new photos are
// cascaded on top so the user's arrangement is preserved.
function addPhotoLayers(saved) {
  // Open Layout with the new photos so arranging them is one tap away.
  studioTool = "layout";
  if (editorMode !== "creative") editorMode = "creative";
  changeTarget((page) => {
    if (page === editor) freeMainPhoto(page);
    // Empty frames from a chosen template are filled first, in order.
    const hadSlots = page.layers.some((layer) => layer.kind === "photo" && !layer.mediaRef);
    const remaining = fillEmptySlots(page, saved);
    if (page.layoutTemplate === "text" && saved.length) page.layoutTemplate = null;
    if (hadSlots && !remaining.length) {
      selectedLayer = null;
      return;
    }
    saved = remaining;
    const existing = page.layers.filter(
      (layer) => layer.kind === "photo",
    ).length;
    const added = saved.map(({ reference, name }, index) =>
      photoLayer(reference, name, {
        x: Math.min(85, 30 + ((existing + index) % 6) * 8),
        y: Math.min(80, 22 + ((existing + index) % 6) * 6),
        rotation: [-4, 3, -2, 5, -3, 2][(existing + index) % 6],
      }),
    );
    page.layers.push(...added);
    if (!page.layoutEdited) {
      const total = existing + added.length;
      applyLayout(page, suggestLayout(total), photoRegion());
    }
    selectedLayer = added.at(-1).id;
  });
}
async function mediaMetadata(file, kind) {
  return new Promise((resolve, reject) => {
    const element = document.createElement(
        kind === "video" ? "video" : "audio",
      ),
      url = URL.createObjectURL(file);
    const timer = setTimeout(
      () => finish(new Error("Unsupported media")),
      10000,
    );
    const finish = (error) => {
      clearTimeout(timer);
      element.removeAttribute("src");
      element.load();
      URL.revokeObjectURL(url);
      if (error) reject(error);
    };
    element.preload = "metadata";
    element.onloadedmetadata = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      clearTimeout(timer);
      element.onloadedmetadata = null;
      element.onerror = null;
      finish();
      resolve({ duration });
    };
    element.onerror = () => {
      element.onerror = null;
      finish(new Error("Unsupported media"));
    };
    element.src = url;
  });
}
async function attachClip(blob, kind, name, duration = 0, options = {}) {
  const mediaId = await media.put(blob, { kind, name, duration }, "studio");
  const targetId = options.targetId ?? activeMomentId;
  changeEditor((entry) => {
    const page = (targetId && findMoment(entry, targetId)) || entry;
    page.media.push({
      id: id(),
      kind,
      name,
      mime: blob.type,
      size: blob.size,
      duration,
      source: `media:${mediaId}`,
      poster: "",
      ...(options.origin ? { origin: options.origin } : {}),
    });
  });
  flushDraft();
}
async function handleMediaUpload(event, kind) {
  const file = event.target.files[0];
  if (!file) return;
  if (busyMedia || recorder) {
    toast(t("media.busy"));
    event.target.value = "";
    return;
  }
  busyMedia = true;
  try {
    if (
      !file.type.startsWith(kind + "/") ||
      file.size > (kind === "video" ? 50 : 20) * 1024 * 1024
    )
      throw new Error("Invalid media");
    const metadata = await mediaMetadata(file, kind);
    await attachClip(file, kind, file.name, metadata.duration);
    toast(t("media.saved"));
  } catch {
    toast(t("media.failed"));
  } finally {
    busyMedia = false;
    event.target.value = "";
  }
}
async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) {
    toast(t("media.recordUnsupported"));
    return;
  }
  busyMedia = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingStream = stream;
    const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
      (type) => MediaRecorder.isTypeSupported(type),
    );
    const current = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
    recorder = current;
    recordingTargetId = activeMomentId;
    recordingStarted = Date.now();
    const chunks = [];
    let bytes = 0,
      recordingFailed = false;
    current.ondataavailable = (event) => {
      if (event.data.size) {
        chunks.push(event.data);
        bytes += event.data.size;
        if (bytes > 20 * 1024 * 1024 && current.state === "recording")
          current.stop();
      }
    };
    current.onstop = async () => {
      clearInterval(recordingTimer);
      clearTimeout(recordingTimeout);
      stream.getTracks().forEach((track) => track.stop());
      busyMedia = true;
      try {
        const blob = new Blob(chunks, { type: current.mimeType });
        if (recordingFailed || !blob.size || blob.size > 20 * 1024 * 1024)
          throw new Error("Recording size");
        await attachClip(
          blob,
          "audio",
          `${t("media.voiceName")} · ${shortDate(editor.date)}`,
          Math.round((Date.now() - recordingStarted) / 1000),
          { targetId: recordingTargetId, origin: "recording" },
        );
        toast(t("media.saved"));
      } catch {
        toast(t("media.failed"));
      } finally {
        recorder = null;
        recordingStream = null;
        busyMedia = false;
        render();
      }
    };
    current.onerror = () => {
      recordingFailed = true;
      stream.getTracks().forEach((track) => track.stop());
      if (current.state === "recording") current.stop();
      toast(t("media.failed"));
    };
    current.start(250);
    busyMedia = false;
    recordingTimer = setInterval(() => {
      if ($("#record-status"))
        $("#record-status").textContent = t("media.recording", {
          seconds: Math.floor((Date.now() - recordingStarted) / 1000),
        });
    }, 500);
    recordingTimeout = setTimeout(
      () => {
        if (current.state === "recording") current.stop();
      },
      5 * 60 * 1000,
    );
    render();
  } catch (error) {
    recordingStream?.getTracks().forEach((track) => track.stop());
    recordingStream = null;
    recorder = null;
    busyMedia = false;
    toast(
      t(error.name === "NotAllowedError" ? "media.denied" : "media.failed"),
    );
  }
}
$("#form-dialog").addEventListener("close", () =>
  $("#form-dialog").classList.remove("book-editor-dialog"),
);
$("#form-dialog").addEventListener("cancel", (event) => {
  if (busyMedia) {
    event.preventDefault();
    toast(t("media.busy"));
  }
});
document.addEventListener(
  "durationchange",
  (event) => {
    const element = event.target;
    if (!element.matches?.("audio,video") || !Number.isFinite(element.duration))
      return;
    const label = element
      .closest(".media-card")
      ?.querySelector(".media-duration");
    if (label)
      label.textContent = `${Math.floor(element.duration / 60)}:${String(Math.floor(element.duration % 60)).padStart(2, "0")}`;
  },
  true,
);
function openLightbox(src) {
  if (!src) return;
  $("#lightbox-image").src = src;
  $("#lightbox .lightbox-close").setAttribute("aria-label", t("close"));
  $("#lightbox").showModal();
}
$("#lightbox").addEventListener("click", (event) => {
  if (
    event.target.id === "lightbox" ||
    event.target.dataset.action === "close-lightbox"
  )
    $("#lightbox").close();
});
$("#lightbox").addEventListener("close", () =>
  $("#lightbox-image").removeAttribute("src"),
);
function togglePlayer(button) {
  const audio = button.closest("[data-player]")?.querySelector("audio");
  if (!audio) return;
  if (audio.paused) audio.play().catch(() => toast(t("media.missing")));
  else audio.pause();
}
function playerDuration(audio, player) {
  return Number.isFinite(audio.duration) && audio.duration > 0
    ? audio.duration
    : Number(player.dataset.duration) || 0;
}
function updatePlayer(audio) {
  const player = audio.closest?.("[data-player]");
  if (!player) return;
  const duration = playerDuration(audio, player);
  const seek = player.querySelector("[data-player-seek]");
  if (seek && !player.classList.contains("seeking"))
    seek.value = duration
      ? Math.round(Math.min(1, audio.currentTime / duration) * 1000)
      : 0;
  player.querySelector(".ld-current").textContent = formatDuration(
    audio.currentTime,
  );
  player.style.setProperty("--progress", `${(Number(seek?.value) || 0) / 10}%`);
  if (duration)
    player
      .closest(".media-card")
      ?.querySelectorAll(".media-duration")
      .forEach((label) => (label.textContent = formatDuration(duration)));
  const playing = !audio.paused && !audio.ended;
  player.classList.toggle("playing", playing);
  const button = player.querySelector(".ld-play");
  button.setAttribute(
    "aria-label",
    playing ? button.dataset.labelPause : button.dataset.labelPlay,
  );
  button.setAttribute("aria-pressed", String(playing));
}
for (const type of [
  "play",
  "pause",
  "ended",
  "timeupdate",
  "loadedmetadata",
  "seeked",
])
  document.addEventListener(
    type,
    (event) => {
      if (event.target.matches?.("[data-player] audio"))
        updatePlayer(event.target);
    },
    true,
  );
document.addEventListener(
  "play",
  (event) => {
    if (event.target.matches("audio,video"))
      document.querySelectorAll("audio,video").forEach((element) => {
        if (element !== event.target) element.pause();
      });
  },
  true,
);
document.addEventListener(
  "error",
  (event) => {
    if (
      event.target.matches?.("audio,video") &&
      event.target.getAttribute("src")
    )
      toast(t("media.missing"));
  },
  true,
);

async function start() {
  const names = ["design-tokens", "features", "seed", "library", "i18n"];
  const responses = await Promise.all(
    names.map(async (name) => {
      const response = await fetch(`shared/${name}.json`);
      if (!response.ok) throw new Error("Shared configuration could not load");
      return response.json();
    }),
  );
  [tokens, features] = responses;
  catalog = responses[3];
  configureI18n(responses[4], localStorage);
  document.documentElement.lang = languageCode();
  for (const [name, color] of Object.entries(tokens.colors))
    document.documentElement.style.setProperty(`--${name}`, color);
  store = new Store(localStorage, responses[2]);
  let warning = "";
  try {
    await media.open();
    await media.hydrate(state());
    await migrateLegacyPhotos(store, media);
  } catch (error) {
    warning = t("media.migrationFailed");
    console.warn("Media initialization incomplete", error.name);
  }
  $("#clock").textContent = new Date().toLocaleTimeString(locale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
  render();
  if (warning) toast(warning);
}
start().catch((error) => {
  $("#app").innerHTML =
    `<div class="error-panel"><h1>${t("error.start")}</h1><p>${esc(t(error.message))}</p><p>${t("error.startHelp")}</p></div>`;
});
// Turn journey pages with a swipe (touch or mouse) or the arrow keys.
let journeySwipe = null;
$("#app").addEventListener("pointerdown", (event) => {
  if (page === "journey" && event.target.closest(".journey-page"))
    journeySwipe = { x: event.clientX, y: event.clientY };
});
$("#app").addEventListener("pointerup", (event) => {
  if (!journeySwipe || page !== "journey") return;
  const dx = event.clientX - journeySwipe.x,
    dy = event.clientY - journeySwipe.y;
  journeySwipe = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
    openJourney(journeyHabit, journeyPage + (dx < 0 ? 1 : -1));
});
document.addEventListener("keydown", (event) => {
  if (page !== "journey" || event.target.closest("input,textarea,select,dialog"))
    return;
  if (event.key === "ArrowRight") openJourney(journeyHabit, journeyPage + 1);
  if (event.key === "ArrowLeft") openJourney(journeyHabit, journeyPage - 1);
});
