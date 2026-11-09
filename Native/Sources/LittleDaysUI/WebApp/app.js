import { MediaStore, migrateLegacyPhotos } from "./js/media.mjs";
import {
  configureI18n,
  t,
  locale,
  languageCode,
  setLanguage,
  presetLabel,
} from "./js/i18n.mjs";
import {
  fontFamily,
  stickerURL,
  coverColor,
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
import { loadImage, exportJournalImage, exportJournalVideo } from "./js/export.mjs";
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
import { communityHTML, profileHTML, inboxHTML, bellHTML } from "./js/community-view.mjs";
import { experience } from "./js/levels.mjs";
import * as Community from "./js/community.mjs";
import * as Collab from "./js/collab.mjs";
import * as Account from "./js/account.mjs";
import { openPhotoEditor } from "./js/photo-editor-ui.mjs";
import { renderEdited, isIdentity } from "./js/photo-edit.mjs";
import { SHAPES, shapeSize, shapeForSize } from "./js/shapes.mjs";
import { frameAt, openPosterPicker } from "./js/poster-picker.mjs";
import { collabSectionHTML } from "./js/collab-view.mjs";
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
  mediaLayer,
  isOnPage,
  freeMainPhoto,
  moveLayer,
} from "./js/day.mjs";
import {
  sceneOfDay,
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
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  users:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
  pen: "M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4",
  pulse: "M3 12h4l2-6 4 12 2-6h6",
  cloud: "M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.6 4.2 4.2 0 0 0 7 18Z",
  palette: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.4 1-2.4 2.4-2.4H18a3 3 0 0 0 3-3c0-5-4-9-9-9ZM7.5 12h.01M10 8h.01M15 8h.01",
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
// Habit themes as thin line icons (the home page keeps emoji to a minimum).
const themeIcon = (theme) =>
  icon({ Learning: "book", Fitness: "pulse", Wellness: "cloud", "Creative Life": "palette" }[theme] || "leaf");
let calendarBook = "";
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
  collabOpen = false,
  photoTarget = "layers",
  sheetTall = false,
  noteReturn = "home",
  inboxFilter = "all",
  inboxReturn = "home",
  studioReturn = "home",
  soundMenu = false,
  studioStart = false,
  account = null,
  loginAvatar = null,
  tourStep = 0,
  settingsReturn = "home",
  booksView = "shelf", // "shelf" | "profile"
  pulledBook = null,
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
    // The ＋ in the menu first asks how to start (photos, words, sound…).
    studioStart = true;
    openStudio(dateKey());
    return;
  }
  if (target === "settings" && page !== "settings") settingsReturn = page;
  page = target;
  selectedBook = null;
  render();
  $("#app-scroll").scrollTop = 0;
}
function openStudio(date = dateKey()) {
  if (page !== "studio" && page !== "settings") studioReturn = page;
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
  const current = { journey: "growth", day: "calendar", inbox: "home" }[page] || page;
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
  return `<div class="habit-row ${done?.note ? "has-note" : ""}"><span class="habit-symbol">${themeIcon(habit.theme)}</span><div class="habit-detail"><strong>${esc(habit.title)}</strong><small>${esc(presetLabel("theme.habit", habit.theme))} · ${habit.kind === "duration" ? t("minutesShort", { count: done?.minutes || habit.minutes }) : t("growth.encourage")}${done?.detail ? " · " + esc(done.detail) : ""}</small>${done?.note ? `<span class="habit-note">“${esc(done.note.slice(0, 60))}”</span>` : ""}</div><button class="note-button ${done?.note || done?.photo || done?.detail ? "has-note" : ""}" data-action="check-note" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${t(done?.note ? "growth.editNote" : "growth.addNote")} ${esc(habit.title)}">${icon(done?.photo ? "photo" : "pen")}<span>${t(done?.note || done?.photo || done?.detail ? "growth.noteShort" : "growth.addShort")}</span></button><button class="check-button ${done ? "done" : ""}" data-action="check" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${t(done ? "habit.cancel" : "habit.complete")} ${esc(habit.title)}" aria-pressed="${Boolean(done)}">${done ? icon("check") : ""}</button></div>`;
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
  return `<button class="book-item" data-action="book" data-book="${esc(book.id)}">${coverHTML(book, ctx())}<strong>${esc(book.title)}</strong><small>${esc(presetLabel("category", book.category))} · ${t("entry.count", { count })}</small></button>`;
}

function home() {
  // Photo-led home, like a magazine page: today's picture large, a row of
  // library photos to start from, then habits and books.
  const entry = todayEntry(),
    completed = state().checks.filter((check) => check.date === dateKey()).length;
  const now = new Date();
  const weekday = now.toLocaleDateString(locale(), { weekday: "long" });
  const day = now.toLocaleDateString(locale(), { month: "long", day: "numeric" });
  const photo = safePhoto(coverPhoto(entry));
  const moments = entry?.moments || [];
  const scene = todayScene();
  let hero;
  if (entry) {
    const backdrop = photo || (scene ? safePhoto(`photo:${scene.id}`) : "");
    const kicker = [t("home.today"), moments.length ? t("day.statMoments", { count: moments.length }) : "", entry.isDemo ? t("home.sample") : ""].filter(Boolean).join(" · ");
    hero = `<button class="today-preview hero-photo" data-action="open-day" data-date="${dateKey()}" aria-label="${t("home.readToday")}">${backdrop ? `<img src="${esc(backdrop)}" alt="${t("photo.alt")}">` : ""}<span class="hero-shade" aria-hidden="true"></span><span class="today-preview-copy"><small class="hero-kicker">${esc(kicker)}</small><b>${esc(entry.title || moments[0]?.title || t("entry.untitled"))}</b><small>${esc((entry.body || moments[0]?.body || "").replace(/\s+/g, " ").slice(0, 60))}</small></span><span class="today-preview-go hero-go">${t("home.open")} ›</span></button>`;
  } else if (scene)
    hero = `<button class="today-scene hero-photo" data-action="use-scene" data-scene="${esc(scene.id)}" data-from="home"><img src="${esc(safePhoto(`photo:${scene.id}`))}" alt=""><span class="hero-shade" aria-hidden="true"></span><span class="hero-copy-block"><small class="hero-kicker">${t("scene.ofDay")} · ${esc(sceneName(scene))}</small><b>${t("home.prompt")}</b><em>${t("scene.useIt")} ›</em></span></button>`;
  else hero = `<p class="today-blank">${t("home.blankBody")}</p>`;
  // The journals, in the same order as on the shelf: open one, or add a page
  // straight into it (a fitness, plants or family journal each keeps its own).
  const books = `<section class="home-section home-books"><div class="section-heading"><div><h2>${t("home.books")}</h2><small>${t("home.booksHint")}</small></div><button data-action="nav" data-page="books">${t("home.shelf")} ›</button></div><div class="home-book-row">${state()
    .books.map((book) => {
      const count = bookEntryCount(state(), book.id);
      return `<article class="home-book"><button class="home-book-cover" data-action="book" data-book="${esc(book.id)}" aria-label="${esc(book.title)}">${coverHTML(book, ctx())}</button><b>${esc(book.title)}</b><small>${esc(presetLabel("category", book.category))} · ${t("entry.count", { count })}</small><button class="home-book-write" data-action="book-write" data-book="${esc(book.id)}">${icon("plus")} ${t("home.writeIn")}</button></article>`;
    })
    .join("")}<button class="home-book-new" data-action="new-book">${icon("plus")}<span>${t("home.newBook")}</span></button></div></section>`;
  return `<div class="home-mag"><header class="home-top"><div class="masthead"><span class="masthead-date">${esc(weekday)} · ${esc(day)}</span><div class="brand-title">Little Days</div></div><span class="home-actions">${bellHTML(social(), ctx())}<button class="icon-button" data-action="nav" data-page="settings" aria-label="${t("settings")}">${icon("gear")}</button></span></header>
 <section class="hero today-card"><h1 class="today-prompt">${t(entry ? "home.greeting" : "home.prompt")}</h1>${hero}<button class="moment-cta" data-action="quick-moment"><span>${icon("pen")}</span><span><b>${t("moment.cta")}</b><small>${t("moment.ctaHint")}</small></span><i>›</i></button></section>
 ${books}<section class="home-section"><div class="section-heading"><h2>${t("home.growth")}</h2><button data-action="nav" data-page="growth">${t("home.completed", { done: completed, total: state().habits.length })} ›</button></div><div class="habit-list">${state()
   .habits.map((habit) => habitRow(habit, dateKey()))
   .join("")}</div></section><p class="home-quote">Collect moments, grow gently.</p></div>`;
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

// Photo wall: the month as a grid of that day's pictures on a slowly moving
// background (like a month "wrapped" story).
// Calendar by journal: "" shows every day; a book id shows only its days and
// that book's pictures.
function calendarBookDays() {
  if (!calendarBook || !state().books.some((b) => b.id === calendarBook)) return null;
  return new Map(bookDays(state(), calendarBook).map((day) => [day.date, day]));
}
function calendarBookChips() {
  if (state().books.length < 2) return "";
  const chip = (id, label) => `<button data-action="calendar-book" data-book="${esc(id)}" class="${calendarBook === id ? "selected" : ""}" aria-pressed="${calendarBook === id}">${esc(label)}</button>`;
  return `<div class="calendar-books" role="group" aria-label="${t("home.books")}">${chip("", t("calendar.allBooks"))}${state().books.map((b) => chip(b.id, b.title)).join("")}</div>`;
}
function calendarWallHTML() {
  const year = month.getFullYear(),
    monthIndex = month.getMonth(),
    count = new Date(year, monthIndex + 1, 0).getDate(),
    offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const weekdays = languageCode() === "en" ? ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] : ["一", "二", "三", "四", "五", "六", "日"];
  let days = 0,
    pictures = 0,
    backdrop = "";
  const only = calendarBookDays();
  const cells = Array.from({ length: count }, (_, i) => {
    const key = dateKey(new Date(year, monthIndex, i + 1));
    const entry = only ? (only.has(key) ? state().entries.find((e) => e.date === key) : null) : state().entries.find((e) => e.date === key) || state().drafts[key];
    const photo = only ? (only.get(key)?.photos[0] ? safePhoto(only.get(key).photos[0]) : "") : entry ? safePhoto(coverPhoto(entry)) : "";
    const has = entry && (only ? true : hasDayPageContent(entry) || entry.moments?.length);
    if (has) days++;
    if (photo) {
      pictures++;
      backdrop ||= photo;
    }
    return photo
      ? `<button class="wall-day has-photo ${key === dateKey() ? "today" : ""}" data-action="open-day" data-date="${key}" aria-label="${key}"><img src="${esc(photo)}" alt="" loading="lazy"><b>${i + 1}</b></button>`
      : `<button class="wall-day ${has ? "has-words" : ""} ${key === dateKey() ? "today" : ""}" data-action="${has ? "open-day" : "edit-date"}" data-date="${key}" aria-label="${key}"><span>${i + 1}</span>${has ? "<i>✎</i>" : ""}</button>`;
  }).join("");
  const title = month.toLocaleDateString(locale(), { month: "long" });
  return `<section class="cal-wall">${backdrop ? `<img class="cal-wall-backdrop" src="${esc(backdrop)}" alt="" aria-hidden="true">` : ""}<div class="cal-wall-glow" aria-hidden="true"></div><div class="cal-wall-head"><button data-action="month" data-delta="-1" aria-label="${t("calendar.prev")}">${icon("back")}</button><div><h2>${esc(title)}</h2><small>${t("calendar.wrapped", { year })}</small></div><button data-action="month" data-delta="1" aria-label="${t("calendar.next")}">${icon("arrow")}</button></div><div class="cal-wall-grid">${weekdays.map((d) => `<span class="wall-weekday">${d}</span>`).join("")}${"<span></span>".repeat(offset)}${cells}</div><p class="cal-wall-stats">${t("calendar.wallStats", { days, pictures })}</p></section>`;
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
  const only = calendarMode === "memory" ? calendarBookDays() : null;
  const cells = Array.from({ length: count }, (_, i) => {
    const key = dateKey(new Date(year, monthIndex, i + 1)),
      recorded = only && !only.has(key) ? null : state().entries.find((e) => e.date === key),
      total = state().checks.filter((c) => c.date === key).length,
      marks = only && !only.has(key) ? { html: "", label: "", hasContent: false } : dayMarks(key),
      thumb = only ? (only.get(key)?.photos[0] ? safePhoto(only.get(key).photos[0]) : "") : safePhoto(coverPhoto(recorded));
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
  const top = `<header class="page-top"><div><h1 class="page-title">${t("calendar.title")}</h1><p class="page-subtitle">${t("calendar.subtitle")}</p></div><button class="icon-button" data-action="calendar-today" aria-label="${t("calendar.today")}">${icon("calendar")}</button></header>`;
  if (calendarMode === "wall")
    return `${top}<div class="segmented"><button data-action="calendar-mode" data-mode="memory">${t("calendar.memory")}</button><button data-action="calendar-mode" data-mode="growth">${t("calendar.growth")}</button><button data-action="calendar-mode" data-mode="wall" class="selected">${t("calendar.wall")}</button></div>${calendarBookChips()}${calendarWallHTML()}`;
  return `${top}<div class="segmented"><button data-action="calendar-mode" data-mode="memory" class="${calendarMode === "memory" ? "selected" : ""}">${t("calendar.memory")}</button><button data-action="calendar-mode" data-mode="growth" class="${calendarMode === "growth" ? "selected" : ""}">${t("calendar.growth")}</button><button data-action="calendar-mode" data-mode="wall" class="${calendarMode === "wall" ? "selected" : ""}">${t("calendar.wall")}</button></div>${calendarMode === "memory" ? calendarBookChips() : ""}<div class="month-controls"><button data-action="month" data-delta="-1" aria-label="${t("calendar.prev")}">${icon("back")}</button><h2>${month.toLocaleDateString(locale(), { month: "long", year: "numeric" })}</h2><button data-action="month" data-delta="1" aria-label="${t("calendar.next")}">${icon("arrow")}</button></div><div class="calendar-grid">${weekdays.map((d) => `<span class="weekday">${d}</span>`).join("")}${"<span></span>".repeat(offset)}${cells}</div>${calendarMode === "memory" ? `<div class="calendar-legend" aria-hidden="true"><span><i class="dot-photo"></i>${t("calendar.markPhoto")}</span><span><i class="dot-video"></i>${t("calendar.markVideo")}</span><span><i class="dot-audio"></i>${t("calendar.markAudio")}</span><span><i class="dot-growth"></i>${t("calendar.markGrowth")}</span><span><b>3</b>${t("calendar.markMoments")}</span></div>` : ""}<section class="date-summary"><div class="section-heading"><h3>${t(calendarMode === "memory" ? "calendar.dayTitle" : "calendar.growthTitle", { date: shortDate(selectedDate) })}</h3><span class="summary-actions">${entry ? `<button data-action="open-day" data-date="${selectedDate}">${t("calendar.read")}</button>` : ""}${entry || calendarMode !== "memory" ? `<button data-action="edit-date" data-date="${selectedDate}">${t(entry ? "calendar.edit" : "calendar.backfill")}</button>` : ""}</span></div>${
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
    habits = state().habits,
    total = habits.reduce(
      (sum, h) => sum + Math.min(weeklyCount(state(), h.id, today), h.target),
      0,
    ),
    target = habits.reduce((sum, h) => sum + h.target, 0),
    steps = state().checks.length,
    weekdays =
      languageCode() === "en"
        ? ["M", "T", "W", "T", "F", "S", "S"]
        : ["一", "二", "三", "四", "五", "六", "日"];
  // One calm strip: this week's progress, all-time steps, the calendar link.
  const summary = `<section class="growth-summary"><div class="growth-summary-row"><span class="growth-seal" aria-hidden="true">${steps >= 3 ? "🌼" : "🌱"}</span><div><b>${t("growth.week")}</b><small>${t("growth.count", { count: total, target })} · ${t("growth.milestone", { count: steps })}</small></div><button class="text-button" data-action="growth-calendar">${t("growth.calendarShort")} ›</button></div><div class="progress-track"><span style="width:${target ? Math.min(100, (total / target) * 100) : 0}%"></span></div></section>`;
  const cards = habits
    .map((h) => {
      const count = weeklyCount(state(), h.id, today),
        pages = state().checks.filter((c) => c.habitId === h.id).length;
      return `<section class="growth-habit compact">${habitRow(h, today)}<div class="growth-habit-foot"><div class="week-dots" aria-label="${esc(t("growth.weekCount", { target: h.target, count }))}">${Array.from({ length: 7 }, (_, i) => `<span class="${state().checks.some((c) => c.habitId === h.id && c.date === addDays(start, i)) ? "complete" : ""}">${weekdays[i]}</span>`).join("")}</div><span class="growth-habit-count">${count}/${h.target}</span><button class="journey-chip" data-action="habit-journey" data-habit="${esc(h.id)}" aria-label="${esc(t("journey.open"))} · ${esc(h.title)}">📖 ${pages}</button></div></section>`;
    })
    .join("");
  return `<header class="page-top"><div><h1 class="page-title">${t("growth.title")}</h1><p class="page-subtitle">${t("growth.subtitle")}</p></div><button class="icon-button" data-action="new-habit" aria-label="${t("growth.add")}">${icon("plus")}</button></header>${summary}${cards || `<div class="empty">${t("growth.none")}<br><button class="primary" data-action="new-habit">${t("growth.new")}</button></div>`}${reflectionsHTML(today)}${checkHistoryHTML()}`;
}

// Two small notes (week / month); a filled one shows a short preview.
function reflectionsHTML(today) {
  const fields = ["wentWell", "challenges", "learned", "nextFocus"];
  const card = (period) => {
    const key = periodKey(period, today),
      reflection = findReflection(state(), period, key);
    const preview = reflection
      ? fields.map((field) => reflection[field]).find(Boolean) || ""
      : "";
    return `<button class="reflection-chip ${preview ? "filled" : ""}" data-action="reflection-edit" data-period="${period}" data-key="${key}"><b>${t(period === "week" ? "reflection.thisWeek" : "reflection.thisMonth")}</b><span>${preview ? esc(preview.length > 40 ? preview.slice(0, 40) + "…" : preview) : t("reflection.write")}</span></button>`;
  };
  const past = (state().reflections || [])
    .filter((item) => item.key !== periodKey(item.period, today))
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 6);
  return `<section class="reflections"><h2 class="growth-section-title">${t("reflection.title")}</h2><div class="reflection-row">${card("week")}${card("month")}</div>${past.length ? `<details class="past-reflections"><summary>${t("reflection.past", { count: past.length })}</summary>${past.map((item) => `<button class="past-reflection" data-action="reflection-edit" data-period="${item.period}" data-key="${item.key}">${esc(item.period === "week" ? t("reflection.weekOf", { date: shortDate(item.key) }) : item.key)} · ${esc((item.wentWell || item.learned || "").slice(0, 40))}</button>`).join("")}</details>` : ""}</section>`;
}
// Folded by default; stays open across re-renders once opened.
let historyOpen = false;
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
  return `<details class="check-history" data-remember="history" ${historyOpen ? "open" : ""}><summary><span>${t("growth.history")} · ${notes.length}</span><span class="badge">${t("private")}</span></summary>${notes
    .map((check) => {
      const habit = state().habits.find((h) => h.id === check.habitId);
      return `<article class="history-note"><time>${esc(shortDate(check.date))}</time>${growthCardInner(check, habit, ctx())}<div class="history-actions"><button class="text-button" data-action="check-note" data-habit="${esc(check.habitId)}" data-date="${check.date}">${t("edit")}</button><button class="text-button" data-action="open-day" data-date="${check.date}">${t("growth.openDay")}</button></div></article>`;
    })
    .join("")}</details>`;
}
document.addEventListener(
  "toggle",
  (event) => {
    if (event.target?.dataset?.remember === "history")
      historyOpen = event.target.open;
  },
  true,
);
function booksPage() {
  if (selectedBook) {
    const book = state().books.find((b) => b.id === selectedBook),
      entries = bookPages(state(), selectedBook),
      days = bookDays(state(), selectedBook, bookFilter),
      months = bookMonths(state(), selectedBook);
    const filtered = bookFilter.month || bookFilter.date;
    return `<div class="section-heading"><button class="back-button" data-action="all-books">${icon("back")} ${t("books.all")}</button><button class="secondary" data-action="edit-book" data-book="${esc(book.id)}">${t("edit")}</button></div><div class="book-detail-showcase">${coverHTML(book, ctx())}</div><div class="book-detail-copy"><h2>${esc(book.title)}</h2><p>${esc(book.description || "")}</p><span class="badge">${t("private")} · ${t("entry.count", { count: entries.length })}</span></div>${collabSectionHTML(social(), book, ctx(), collabOpen)}<button class="primary full-width" data-action="book-new-entry">${icon("plus")} ${t("books.addPage")}</button><div class="book-filter"><p class="journal-list-caption">${t("books.memories")}</p><div class="book-filter-row"><select data-book-filter="month" aria-label="${t("books.month")}"><option value="">${t("books.allMonths")}</option>${months.map((m) => `<option value="${m}" ${bookFilter.month === m ? "selected" : ""}>${esc(new Date(`${m}-01T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long" }))}</option>`).join("")}</select><input type="date" data-book-filter="date" aria-label="${t("books.pickDate")}" value="${esc(bookFilter.date)}">${filtered ? `<button class="text-button" data-action="book-filter-clear">${t("books.clearFilter")}</button>` : ""}</div></div>${
      days.length
        ? `<div class="day-covers">${days.map(dayCoverHTML).join("")}</div>`
        : `<div class="empty">${t(filtered ? "books.noMatch" : "books.empty")}</div>`
    }`;
  }
  const switcher = `<div class="shelf-switch" role="tablist" aria-label="${t("books.title")}"><button role="tab" data-action="books-view" data-view="shelf" aria-selected="${booksView === "shelf"}">📚 ${t("shelf.tab")}</button><button role="tab" data-action="books-view" data-view="profile" aria-selected="${booksView === "profile"}">${esc(social().profile?.avatar || "🌷")} ${t("me.tab")}</button></div>`;
  if (booksView === "profile")
    return `<header class="page-top"><div><h1 class="page-title">${t("me.title")}</h1><p class="page-subtitle">${t("me.subtitle")}</p></div>${bellHTML(social(), ctx())}</header>${switcher}<div class="demo-banner"><b>${t("community.demoLabel")}</b>${t("me.demoNote")}</div>${profileHTML(social(), communityView, ctx(), state().books, myExperience())}`;
  return `<header class="page-top"><div><h1 class="page-title">${t("books.title")}</h1><p class="page-subtitle">${t("books.subtitle")}</p></div><button class="icon-button" data-action="new-book" aria-label="${t("books.new")}">${icon("plus")}</button></header>${switcher}${shelfHTML()}<p class="home-quote">A home for every little story.</p>`;
}

// A bookshelf: spines stand on wooden planks; tap one to pull it out.
function shelfHTML() {
  const books = state().books;
  const pulled = books.find((book) => book.id === pulledBook);
  const spine = (book, index) => {
    const count = bookEntryCount(state(), book.id);
    const sticker = book.coverDecoration && book.coverDecoration !== "none" ? stickerURL(book.coverDecoration, catalog) : "";
    return `<button class="spine h${index % 4} ${pulled?.id === book.id ? "pulled" : ""}" data-action="pull-book" data-book="${esc(book.id)}" aria-pressed="${pulled?.id === book.id}" aria-label="${esc(book.title)} · ${t("entry.count", { count })}" style="--spine:${coverColor(book, tokens)};font-family:${esc(fontFamily(book.coverFont || "elegant", catalog))}">${sticker ? `<img src="${esc(sticker)}" alt="">` : "<i></i>"}<span class="spine-title">${esc(book.title)}</span><small>${count}</small></button>`;
  };
  const items = [...books.map(spine), `<button class="spine add" data-action="new-book" aria-label="${t("books.create")}"><span>＋</span></button>`];
  const rows = [];
  for (let i = 0; i < items.length; i += 5) rows.push(items.slice(i, i + 5));
  const stage = pulled
    ? (() => {
        const count = bookEntryCount(state(), pulled.id);
        const shown = Community.isShowcased(social(), pulled.id);
        return `<section class="pulled-book" aria-live="polite">${coverHTML(pulled, ctx())}<div class="pulled-copy"><small>${esc(presetLabel("category", pulled.category || ""))}</small><h2>${esc(pulled.title)}</h2>${pulled.description ? `<p>${esc(pulled.description)}</p>` : ""}<span class="badge">${shown ? `🖼 ${t("who.coverShown")}` : `🔒 ${t("private")}`} · ${t("entry.count", { count })}</span><div class="pulled-actions"><button class="primary" data-action="book" data-book="${esc(pulled.id)}">${t("shelf.open")} ›</button><button class="secondary" data-action="shelf-write" data-book="${esc(pulled.id)}">✎ ${t("shelf.write")}</button></div><button class="text-button" data-action="put-back">${t("shelf.putBack")}</button></div></section>`;
      })()
    : `<p class="shelf-hint">${t("shelf.hint")}</p>`;
  return `${stage}<div class="bookshelf">${rows.map((row) => `<div class="shelf-row"><div class="shelf-books">${row.join("")}</div><div class="shelf-plank"></div></div>`).join("")}</div>`;
}
function openProfile() {
  page = "books";
  booksView = "profile";
  selectedBook = null;
  communityView = { ...communityView, publish: null, workId: null };
  render();
  $("#app-scroll").scrollTop = 0;

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
// A small bar right above the selected item: the common actions in reach.
function layerBarHTML() {
  const layer = selectedLayerOf();
  if (!layer || page !== "studio") return "";
  const b = (action, label, extra = "") => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
  const first =
    layer.kind === "photo" && layer.mediaRef
      ? b("photo-edit", `✨ ${t("pe.open")}`)
      : layer.kind === "video"
        ? b("video-cover", `🖼 ${t("poster.short")}`, `data-clip="${esc(layer.clipId)}"`)
        : layer.kind === "text"
          ? b("layer-edit-text", `✎ ${t("edit")}`)
          : "";
  return `<div class="layer-bar" role="toolbar" aria-label="${t("layer.selected")}">${first}${b("layer-copy", `⧉ ${t("copy")}`)}${b("layer-front", `⬆ ${t("layer.frontShort")}`)}${b("layer-delete", `🗑 ${t("delete")}`, 'class="danger"')}</div>`;
}
function placeLayerBar() {
  const bar = document.querySelector("#canvas-wrap .layer-bar");
  const element = selectedLayer && layerElement(selectedLayer);
  const wrap = $("#canvas-wrap");
  if (!bar || !element || !wrap) return;
  const box = element.getBoundingClientRect(),
    area = wrap.getBoundingClientRect();
  const half = bar.offsetWidth / 2;
  const left = Math.min(area.width - half - 4, Math.max(half + 4, box.left + box.width / 2 - area.left));
  const above = box.top - area.top - 8;
  bar.classList.toggle("below", above < bar.offsetHeight + 4);
  bar.style.left = `${left}px`;
  bar.style.top = `${above < bar.offsetHeight + 4 ? box.bottom - area.top + 8 : above}px`;
}
function canvasHTML() {
  return layerBarHTML() + sharedCanvasHTML(activePage(), ctx(), {
    selectedId: selectedLayer,
    cropMode,
    dayPage: isDayPage(),
    addChoices: addChoicesHTML("canvas-add-choice"),
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
  if (layer.kind === "photo" || layer.kind === "video")
    base.push(
      ["w", 8, 100, 1, "layer.width", layer.w ?? 42],
      ["h", 8, 100, 1, "layer.height", layer.h ?? 34],
    );
  if (layer.kind === "growth" || layer.kind === "text" || layer.kind === "audio")
    base.push([
      "w",
      20,
      100,
      1,
      "layer.width",
      layer.w ?? (layer.kind === "text" ? 65 : 62),
    ]);
  const crop = cropOf(layer);
  const shapes =
    layer.kind === "photo" || layer.kind === "video"
      ? `<div class="shape-picker" role="group" aria-label="${t("shape.title")}"><span class="small-label">${t("shape.title")}</span><div class="shape-chips">${[...(layer.kind === "photo" ? ["free"] : []), ...SHAPES.filter((s) => layer.kind === "video" || s !== "film")]
          .map((shape) => {
            const current = (layer.shape || (layer.kind === "video" ? "landscape" : "free")) === shape;
            return `<button data-action="layer-shape" data-shape="${shape}" class="${current ? "selected" : ""}" aria-pressed="${current}"><i class="shape-icon shape-icon-${shape}" aria-hidden="true"></i>${t("shape." + shape)}</button>`;
          })
          .join("")}</div></div>`
      : "";
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
  return `<div class="layer-controls">${textTools}${shapes}<p class="gesture-help">${t(matchMedia("(pointer: coarse)").matches ? "layer.gestureHelpTouch" : "layer.gestureHelp")}</p>${base.map(slider).join("")}${photoTools}<div class="layer-buttons"><button data-action="layer-back">${t("layer.back")}</button><button data-action="layer-backward">${t("layer.backward")}</button><button data-action="layer-forward">${t("layer.forward")}</button></div><p class="save-help">${t("layer.barHint")}</p></div>`;
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
      // Words only is always possible (photos leave the page after a confirm).
      const disabled = n > 0 && n < Math.min(5, filled);
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
// ---------- Typing right on the paper ----------
// Two ways to make a story page: 随手写 (a note: the title and words are on the
// paper, tap and type) and 自由排版 (photos, text boxes and stickers placed
// freely; the boxes below the paper are its name and a caption).
function pageModeHTML() {
  if (isDayPage()) return "";
  const note = activePage().layoutTemplate === "text";
  const b = (mode, glyph, on) =>
    `<button data-action="page-mode" data-mode="${mode}" class="${on ? "selected" : ""}" aria-pressed="${on}">${icon(glyph)}<span>${t("mode." + mode)}</span></button>`;
  return `<div class="page-mode" role="group" aria-label="${t("mode.label")}">${b("note", "pen", note)}${b("layout", "photo", !note)}</div>`;
}
// A note page becomes a free layout: what was written on the paper stays on
// it as text boxes (the title also stays the page's name in the contents).
function noteToLayout(page) {
  page.layoutTemplate = null;
  const title = (page.title || "").trim();
  const words = (page.body || "").trim();
  const box = (text, y, fontSize, color) => ({ id: id(), kind: "text", text: text.slice(0, 500), x: 50, y, w: 80, scale: 1, rotation: 0, fontId: page.font || "serif", fontSize, color, weight: 400, spacing: 0, align: "left" });
  // Where the note had them, so nothing jumps.
  if (title) page.layers.push(box(title, 27, 24, "#2F2A26"));
  if (words) page.layers.push(box(words, title ? 52 : 40, 15, "#5D554B"));
  page.body = "";
}
function setPageMode(mode, { quiet = false } = {}) {
  if (isDayPage()) return;
  const note = mode === "note";
  if ((activePage().layoutTemplate === "text") === note) {
    if (note) focusInline(activePage().title ? "body" : "title");
    return;
  }
  changeTarget((p) => {
    if (p === editor) return;
    if (note) p.layoutTemplate = "text";
    else noteToLayout(p);
  });
  if (!quiet) toast(t(note ? "mode.noteOn" : "mode.layoutOn"));
  if (note) focusInline(activePage().title ? "body" : "title");
}
function focusInline(field) {
  const el = $(`#journal-canvas [data-inline="${field}"]`);
  if (!el) return;
  el.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
// Tap a text box twice (or add one) and type into it on the paper.
function editTextLayer(layerId, selectAll = false) {
  const el = document.querySelector(`#journal-canvas [data-inline-layer="${CSS.escape(layerId || "")}"]`);
  if (!el) return;
  try {
    el.contentEditable = "plaintext-only";
  } catch {
    el.contentEditable = "true";
  }
  el.closest("[data-layer]")?.classList.add("editing");
  el.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(el);
  if (!selectAll) range.collapse(false);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
// Where the caret is inside words on the paper (as a character count), so a
// redraw can put it back.
function caretOffset(element) {
  const selection = getSelection();
  if (!selection.rangeCount || !element.contains(selection.anchorNode)) return null;
  const range = selection.getRangeAt(0).cloneRange();
  range.selectNodeContents(element);
  range.setEnd(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset);
  return range.toString().length;
}
function placeCaret(element, offset) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let left = offset;
  let node = walker.nextNode();
  const range = document.createRange();
  while (node && left > node.length) {
    left -= node.length;
    node = walker.nextNode();
  }
  if (node) range.setStart(node, Math.min(left, node.length));
  else {
    range.selectNodeContents(element);
    range.collapse(false);
  }
  range.collapse(true);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
// Words typed on the paper are saved without redrawing it (the caret stays);
// one undo step covers one stretch of typing.
let inlineTyping = false;
function inlineChange(change) {
  if (!inlineTyping) {
    history.push(structuredClone(editor));
    if (history.length > 30) history.shift();
    future = [];
    inlineTyping = true;
  }
  change(editor);
  scheduleDraft();
}
function inlineInput(target) {
  const text = target.innerText.replace(/\n$/, "");
  if (target.dataset.inlineLayer) {
    const layerId = target.dataset.inlineLayer;
    inlineChange(() => {
      const layer = activePage().layers.find((l) => l.id === layerId);
      if (layer) layer.text = text.slice(0, 500);
    });
    const box = $('[data-layer-text="text"]');
    if (box && document.activeElement !== box) box.value = text;
    return;
  }
  const field = target.dataset.inline;
  const value = text.slice(0, Number(target.dataset.max) || 4000);
  inlineChange(() => {
    const page = activePage();
    page[field] = value;
    if (page !== editor) page.updatedAt = new Date().toISOString();
  });
  if (isDayPage()) {
    const mirror = $(field === "title" ? "#entry-title" : "#entry-body");
    if (mirror) mirror.value = value;
  } else {
    const moment = activePage();
    const label = document.querySelector(`[data-chapter-label="${CSS.escape(moment.id)}"]`);
    if (label) label.textContent = (moment.time ? moment.time + " · " : "") + (moment.title || t("moment.untitled"));
  }
}
document.addEventListener("focusout", (event) => {
  const el = event.target;
  if (!el?.dataset || !(el.dataset.inline || el.dataset.inlineLayer)) return;
  inlineTyping = false;
  if (el.dataset.inlineLayer) {
    el.contentEditable = "false";
    el.closest("[data-layer]")?.classList.remove("editing");
  }
  const undo = document.querySelector('[data-action="undo"]');
  if (undo) undo.disabled = history.length === 0;
});
function writeCardHTML() {
  const page = activePage();
  if (isDayPage())
    return `<section class="write-card" aria-label="${t("write.title")}"><div class="write-head"><b>${t("write.dayTitle")}</b></div><input id="entry-title" class="write-title" data-editor-field="title" placeholder="${t("studio.titlePlaceholder")}" maxlength="70" value="${esc(editor.title)}" aria-label="${t("studio.titleLabel")}"><textarea id="entry-body" class="write-body" data-editor-field="body" maxlength="2000" placeholder="${t("studio.bodyPlaceholder")}" aria-label="${t("studio.bodyLabel")}">${esc(editor.body)}</textarea></section>`;
  const index = editor.moments.indexOf(page);
  const head = `<div class="write-head"><b>${t("moment.chapter", { number: String(index + 1).padStart(2, "0") })}</b><input type="time" class="write-time" data-moment-field="time" value="${esc(page.time)}" aria-label="${t("moment.time")}"></div>`;
  const tags = `<input class="write-tags" data-moment-field="tags" maxlength="200" placeholder="${t("moment.tagsPlaceholder")}" value="${esc(page.tags.join(", "))}" aria-label="${t("moment.tags")}">`;
  // A note page: the title and words are on the paper itself.
  if (page.layoutTemplate === "text")
    return `<section class="write-card moment note-mode" aria-label="${t("write.title")}">${head}<p class="write-tip">${icon("pen")} ${t("write.noteTip")}</p>${tags}</section>`;
  // A free layout: the page is the picture; these words go under it.
  return `<section class="write-card moment" aria-label="${t("write.title")}">${head}<label class="write-label">${t("write.pageName")}</label><input class="write-title" data-moment-field="title" maxlength="70" placeholder="${t("moment.titlePlaceholder")}" value="${esc(page.title)}" aria-label="${t("moment.titleLabel")}"><label class="write-label">${t("write.caption")}</label><textarea class="write-body" data-moment-field="body" maxlength="4000" placeholder="${t("moment.bodyPlaceholder")}" aria-label="${t("moment.bodyLabel")}">${esc(page.body)}</textarea><p class="write-tip">${icon("text")} ${t("write.layoutTip")}</p>${tags}</section>`;
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
        `<button class="primary full-width" data-action="choose-album">${icon("photo")} ${t("photo.addMany")}</button>${
          dayPage && editor.photo
            ? `<div class="editor-actions"><button data-action="upload">${t("studio.replacePhoto")}</button><button data-action="free-main-photo">${t("photo.freeMain")}</button></div>`
            : dayPage && !photoTotal
              ? `<div class="editor-actions"><button data-action="upload">${t("studio.addPhoto")}</button></div>`
              : ""
        }<p class="save-help">${t("photo.toolHelp")}</p>${sceneLibraryHTML()}`,
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
      value: page.backdrop ? t("backdrop.on") : t("template." + (page.template || "minimal")),
      body: () =>
        `${backdropHTML(page)}<div class="scene-head paper-head"><b>${t("tool.paper")}</b></div><div class="paper-grid">${features.templates.map((template) => `<button data-action="${paperAction}" data-template="${template.id}" class="paper-option ${page.template === template.id ? "selected" : ""}" aria-pressed="${page.template === template.id}"><span class="paper-swatch journal-canvas ${template.id}" aria-hidden="true"></span>${t("template." + template.id)}</button>`).join("")}</div>`,
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
// Decoration tools live in a small icon dock at the bottom of the screen;
// tapping one opens a bottom sheet so the page itself keeps the space.
function toolMenuHTML() {
  const tools = studioTools();
  if (studioTool && !tools.some((tool) => tool.id === studioTool)) studioTool = null;
  const open = tools.find((tool) => tool.id === studioTool);
  const sheet = open
    ? `<section class="tool-sheet open ${sheetTall ? "tall" : ""}" data-tool-row="${open.id}" aria-label="${t(open.label)}"><button class="sheet-grabber" data-action="sheet-grow" aria-label="${t(sheetTall ? "sheet.shrink" : "sheet.grow")}"><i></i></button><div class="sheet-head"><span class="tool-icon" aria-hidden="true">${open.icon}</span><b>${t(open.label)}</b><span class="tool-value" data-tool-value="${open.id}">${esc(open.value)}</span><button class="tool-head sheet-close" data-action="tool-close" aria-label="${t("close")}">×</button></div><div class="tool-body">${open.body()}</div></section>`
    : "";
  const dock = `<nav class="tool-dock" aria-label="${t("write.decorate")}">${tools
    .map(
      (tool) =>
        `<button class="dock-btn ${tool.id === studioTool ? "open" : ""}" data-action="tool" data-tool="${tool.id}" aria-expanded="${tool.id === studioTool}" aria-label="${t(tool.label)}"><span class="dock-icon" aria-hidden="true">${tool.icon}</span><small>${t("dock." + tool.id)}</small></button>`,
    )
    .join("")}</nav>`;
  return sheet + dock;
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

const START_IDEAS = ["meal", "walk", "happy", "note"];
function studioStartHTML() {
  const started = hasDayPageContent(editor) || editor.moments.length > 0;
  const date = new Date(`${editor.date}T12:00:00`).toLocaleDateString(locale(), { month: "long", day: "numeric", weekday: "long" });
  const card = (id, icon) => `<button class="start-card start-${id}" data-action="start-${id}"><span class="start-icon" aria-hidden="true">${icon}</span><b>${t("start." + id)}</b><small>${t("start." + id + "Hint")}</small></button>`;
  return `<section class="studio-start"><header class="start-top"><div><span class="date-label">${esc(date)}</span><h1 class="page-title">${t("start.title")}</h1></div><button class="icon-button" data-action="start-close" aria-label="${t("close")}">×</button></header>${
    started
      ? `<button class="start-continue" data-action="start-continue"><span aria-hidden="true">📖</span><span><b>${t("start.continue")}</b><small>${esc(editor.title || t("entry.untitled"))}${editor.moments.length ? ` · ${t("day.statMoments", { count: editor.moments.length })}` : ""}</small></span><i>›</i></button><p class="start-note">${t("start.newMoment")}</p>`
      : ""
  }<button class="start-quicknote" data-action="start-note"><span class="start-note-icon" aria-hidden="true">✎</span><span><b>${t("note.start")}</b><small>${t("note.startHint")}</small></span><i>›</i></button><div class="start-grid">${card("photos", "📷")}${card("words", "✎")}${card("video", "🎬")}${card("voice", "🎙")}${card("template", "▦")}${card("growth", "🌱")}</div>${(() => {
    const scene = todayScene();
    return scene ? `<button class="start-scene" data-action="use-scene" data-scene="${esc(scene.id)}"><img src="${esc(safePhoto(`photo:${scene.id}`))}" alt=""><span><small>${t("scene.ofDay")}</small><b>${esc(sceneName(scene))}</b></span><i>${t("scene.useIt")} ›</i></button>` : "";
  })()}<h2 class="start-sub">${t("start.ideas")}</h2><div class="start-ideas">${START_IDEAS.map((idea) => `<button data-action="start-idea" data-idea="${idea}">${t("start.idea." + idea)}</button>`).join("")}</div></section>`;
}
// Leaves the start screen; on a day that already has a page, the new thing
// becomes a new Moment so nothing written earlier is mixed up.
function beginStudio(tool = null) {
  studioStart = false;
  const started = hasDayPageContent(editor) || editor.moments.length > 0;
  if (started) addMomentNow();
  studioTool = tool;
  render();
}
async function studioStartAction(target) {
  const name = target.dataset.action;
  if (!name?.startsWith("start-")) return false;
  switch (name) {
    case "start-close":
      studioStart = false;
      navigate("home");
      break;
    case "start-continue":
      studioStart = false;
      render();
      break;
    case "start-photos":
      beginStudio(null);
      openPhotoChooser("layers");
      break;
    case "start-note":
      studioStart = false;
      openNote();
      break;
    case "start-words":
      beginStudio(null);
      if (isDayPage()) $("#entry-title")?.focus();
      else setPageMode("note", { quiet: true });
      break;
    case "start-video":
      beginStudio("media");
      $("#video-input").click();
      break;
    case "start-voice":
      beginStudio("media");
      await startRecording();
      break;
    case "start-template":
      beginStudio("layout");
      break;
    case "start-growth":
      beginStudio("growth");
      break;
    case "start-idea": {
      beginStudio(null);
      const title = t("start.idea." + target.dataset.idea);
      changeTarget((page) => {
        if (!page.title) page.title = title;
      });
      (isDayPage() ? $("#entry-body") : $('[data-moment-field="body"]'))?.focus();
      break;
    }
    default:
      return false;
  }
  return true;
}
// Experience from this device's journal; a level-up leaves a notification.
function myExperience() {
  const xp = experience(state(), social(), dateKey());
  if (Community.noteLevel(social(), xp.levelIndex, xp.level.id)) persistSocial();
  return xp;
}
// The photo library: real photos grouped by mood and moment (library.json
// "photos", Unsplash License). One is picked for each day.
function libraryPhotos() {
  return catalog.photos || [];
}
function sceneName(item) {
  return languageCode() === "en" ? item.nameEn : item.nameZh;
}
function todayScene() {
  const id = sceneOfDay(libraryPhotos().map((photo) => photo.id), dateKey());
  return libraryPhotos().find((photo) => photo.id === id);
}
// Collections look like a wallpaper gallery: one row per collection
// (stacked previews, name, a line about it, "Use"), then a swipeable sheet.
function sceneCollections() {
  return (catalog.photoCollections || []).filter((c) => libraryPhotos().some((photo) => photo.collection === c.id));
}
function collectionScenes(id) {
  const list = libraryPhotos().filter((photo) => photo.collection === id);
  const today = todayScene();
  return today && id === today.collection ? [today, ...list.filter((photo) => photo !== today)] : list;
}
// Today's picks: today's photo, then one from three other collections (also
// changing day by day).
function todayPicks() {
  const today = todayScene();
  const others = sceneCollections().filter((c) => c.id !== today?.collection);
  const day = Math.floor(Date.parse(`${dateKey()}T12:00:00Z`) / 86400000);
  const picks = [0, 1, 2].map((k) => {
    const c = others[(day * 3 + k * 4) % Math.max(1, others.length)];
    const list = c ? collectionScenes(c.id) : [];
    return list[(day + k) % Math.max(1, list.length)];
  });
  return [today, ...picks].filter((item, k, all) => item && all.indexOf(item) === k);
}
// Page backgrounds: a few library photos ("photo mood"), then the original
// gradients and cute patterns. Retired artwork is no longer offered.
function backdrops() {
  return (catalog.scenes || []).filter((scene) => !scene.retired);
}
function backdropHTML(page) {
  const en = languageCode() === "en";
  const current = /^(scene|photo):/.test(page.backdrop || "") ? page.backdrop : "";
  const option = (reference, inner, label) =>
    `<button class="backdrop-option ${current === reference ? "selected" : ""}" data-action="backdrop" data-backdrop="${esc(reference)}" aria-pressed="${current === reference}" aria-label="${esc(label)}">${inner}</button>`;
  const thumb = (reference) => `<img src="${esc(safePhoto(reference))}" alt="" loading="lazy">`;
  const photoMood = libraryPhotos().filter((photo) => photo.backdrop);
  const groups = [
    photoMood.length ? `<h4>${t("backdrop.photos")}</h4><div class="backdrop-row">${photoMood.map((photo) => option(`photo:${photo.id}`, thumb(`photo:${photo.id}`), sceneName(photo))).join("")}</div>` : "",
    ...(catalog.sceneCollections || []).map((c) => {
      const items = backdrops().filter((scene) => scene.collection === c.id);
      return items.length
        ? `<h4>${esc(en ? c.nameEn : c.nameZh)}</h4><div class="backdrop-row">${items.map((scene) => option(`scene:${scene.id}`, thumb(`scene:${scene.id}`), sceneName(scene))).join("")}</div>`
        : "";
    }),
  ];
  return `<section class="backdrop-picker"><div class="scene-head"><b>${t("backdrop.title")}</b><small>${t("backdrop.note")}</small></div><div class="backdrop-row backdrop-row-none">${option("", `<span class="backdrop-none">${t("backdrop.none")}</span>`, t("backdrop.none"))}</div>${groups.join("")}</section>`;
}
function sceneLibraryHTML() {
  const en = languageCode() === "en";
  return `<section class="wall-gallery"><div class="scene-head"><b>${t("scene.title")}</b><small>${t("scene.note")}</small></div>${sceneCollections()
    .map((c) => {
      const preview = collectionScenes(c.id).slice(0, 3);
      return `<article class="wall-row"><button class="wall-stack" data-action="scene-collection" data-collection="${esc(c.id)}" aria-label="${esc(en ? c.nameEn : c.nameZh)}">${preview
        .map((scene, k) => `<img class="wall-card w${k}" src="${esc(safePhoto(`photo:${scene.id}`))}" alt="" loading="lazy">`)
        .reverse()
        .join("")}</button><div class="wall-copy"><h4>${esc(en ? c.nameEn : c.nameZh)}</h4><p>${esc(en ? c.descEn : c.descZh)}</p><button class="wall-get" data-action="scene-collection" data-collection="${esc(c.id)}">${t("scene.get")}</button></div></article>`;
    })
    .join("")}</section>`;
}
function openSceneCollection(id) {
  const c = sceneCollections().find((item) => item.id === id);
  if (!c) return;
  const en = languageCode() === "en";
  const today = todayScene();
  const dialog = $("#scene-dialog");
  dialog.innerHTML = `<div class="wall-sheet"><header><button class="wall-close" data-action="scene-close" aria-label="${t("close")}">×</button><h2>${esc(en ? c.nameEn : c.nameZh)}</h2><span></span></header><p class="wall-desc">${esc(en ? c.descEn : c.descZh)}</p><div class="wall-scroller">${collectionScenes(id)
    .map(
      (scene) =>
        `<figure class="wall-big"><img src="${esc(safePhoto(`photo:${scene.id}`))}" alt="" loading="lazy">${scene === today ? `<i>${t("scene.today")}</i>` : ""}<figcaption><b>${esc(sceneName(scene))}</b><button class="wall-use" data-action="use-scene" data-scene="${esc(scene.id)}">${t("scene.useThis")}</button></figcaption></figure>`,
    )
    .join("")}</div><p class="wall-hint">${t("scene.swipe")}</p></div>`;
  dialog.showModal();
}
// Quick note, like the Notes app: a title line and the words, nothing else.
function openNote() {
  if (page !== "note") noteReturn = page === "studio" ? "home" : page;
  page = "note";
  render();
  $("#note-title")?.focus();
}
function noteHTML() {
  const date = new Date().toLocaleDateString(locale(), { month: "long", day: "numeric", weekday: "long" });
  return `<section class="quick-note"><header class="note-top"><button class="note-back" data-action="note-done" data-keep="0">${icon("back")} ${t("note.back")}</button><span>${esc(date)}</span><button class="note-done" data-action="note-done" data-keep="1">${t("note.done")}</button></header><input id="note-title" class="note-title" maxlength="70" placeholder="${t("note.titlePlaceholder")}" autocomplete="off"><textarea id="note-body" class="note-body" maxlength="4000" placeholder="${t("note.bodyPlaceholder")}"></textarea><p class="note-help">${t("note.help")}</p></section>`;
}
// Saves the note as a words-only little story on today's page.
function saveNote() {
  const title = $("#note-title")?.value.trim() || "";
  const body = $("#note-body")?.value.trim() || "";
  if (!title && !body) return false;
  openStudio(dateKey());
  const now = new Date();
  changeEditor((entry) => {
    const moment = createMoment(entry, {
      title: title || body.split("\n")[0].slice(0, 40),
      body: title ? body : body.split("\n").slice(1).join("\n"),
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    });
    moment.layoutTemplate = "text";
    entry.moments.push(moment);
  }, false);
  clearTimeout(draftTimer);
  store.update((s) => saveEntry(s, editor));
  draftDirty = false;
  return true;
}
// One place to add a picture: the album, the scene library, or today's pick.
function openPhotoChooser(targetSlot = "layers") {
  photoTarget = targetSlot;
  const en = languageCode() === "en";
  const picks = todayPicks();
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t(targetSlot === "main" ? "choose.mainTitle" : "choose.title")}</h2><button class="choose-album" data-action="choose-album"><span aria-hidden="true">📷</span><span><b>${t("choose.album")}</b><small>${t(targetSlot === "main" ? "choose.albumOne" : "choose.albumMany")}</small></span><i>›</i></button><h3>${t("choose.picks")}</h3><div class="choose-picks">${picks
    .map((scene) => `<button data-action="use-scene" data-scene="${esc(scene.id)}"><img src="${esc(safePhoto(`photo:${scene.id}`))}" alt=""><span>${esc(sceneName(scene))}</span></button>`)
    .join("")}</div><h3>${t("scene.title")}</h3><div class="choose-collections">${sceneCollections()
    .map((c) => {
      const cover = collectionScenes(c.id)[0];
      return `<button data-action="scene-collection" data-collection="${esc(c.id)}"><img src="${esc(safePhoto(`photo:${cover.id}`))}" alt="" loading="lazy"><span>${esc(en ? c.nameEn : c.nameZh)}</span></button>`;
    })
    .join("")}</div><button class="choose-backdrop" data-action="open-backdrops"><span aria-hidden="true">🎨</span><span><b>${t("backdrop.link")}</b><small>${t("backdrop.linkHint")}</small></span><i>›</i></button><button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
  dialog.showModal();
}
// Put a scene on the page being written (a new story if today already has one
// when coming from Home).
function useScene(id, fromHome = false) {
  const scene = libraryPhotos().find((item) => item.id === id);
  if (!scene) return;
  if (fromHome || page !== "studio") {
    studioStart = false;
    openStudio(dateKey());
    if (hasDayPageContent(editor) || editor.moments.length) addMomentNow();
  }
  studioTool = null;
  const reference = `photo:${scene.id}`;
  const pageNow = activePage();
  const emptySlot = pageNow.layers.some((layer) => layer.kind === "photo" && !layer.mediaRef);
  // A day page's main picture spot (or a chosen frame) takes the scene, so it
  // sits in the layout instead of floating on top of it.
  if (!emptySlot && isDayPage() && (photoTarget === "main" || (!editor.photo && editor.layoutTemplate !== "text"))) {
    changeEditor((entry) => {
      entry.photo = reference;
    });
  } else addPhotoLayers([{ reference, name: sceneName(scene) }]);
  photoTarget = "layers";
  flushDraft();
  toast(t("scene.added", { name: sceneName(scene) }));
}
// Photo, text, video and sound are equal ways to add something to the paper.
function emptyPaper(page = activePage()) {
  return !isDayPage() && !page.layers?.length && page.layoutTemplate !== "text";
}
function addChoicesHTML(className = "") {
  const item = (action, glyph, label) =>
    `<button class="${className}" data-action="${action}" ${action === "add-sound" ? `aria-expanded="${soundMenu}"` : ""}><span aria-hidden="true">${glyph}</span><b>${t(label)}</b></button>`;
  return item("add-photos", "▣", "add.photo") + item("add-text-layer", "Aa", "add.text") + item("add-video", "▶", "add.video") + item("add-sound", "♫", "add.sound");
}
function studioPage() {
  if (studioStart) return studioStartHTML();
  const dayPage = isDayPage();
  // One compact bar (date · draft state · save) leaves the room to the page.
  return `<header class="studio-bar"><button class="studio-back" data-action="studio-back" aria-label="${t("studio.back")}">${icon("back")}</button><h1 class="visually-hidden">${t("studio.title")}</h1><input class="date-input" type="date" id="editor-date" aria-label="${t("field.date")}" value="${editor.date}"><span class="draft-status" id="draft-status">${draftDirty ? t("正在保存草稿…") : state().drafts[editor.date] ? t("草稿已保存在本机") : t("studio.draftHint")}</span><button class="primary" data-action="save-entry">${t("save")} ${icon("check")}</button></header>${chapterChipsHTML()}${pageModeHTML()}<div class="studio-stage ${studioTool ? "" : "large"}"><div class="canvas-wrap ${dayPage ? "" : "moment-wrap"}" id="canvas-wrap">${canvasHTML()}</div><div class="stage-bar ${studioTool ? "with-size" : ""}"><button data-action="undo" ${history.length ? "" : "disabled"} aria-label="${t("studio.undo")}">${icon("undo")}</button><button data-action="redo" ${future.length ? "" : "disabled"} aria-label="${t("studio.redo")}">${icon("redo")}</button>${emptyPaper() ? "" : addChoicesHTML("stage-add")}${studioTool ? `<button data-action="preview-size" aria-label="${t("studio.previewLarge")}">⤢</button>` : ""}</div>${soundMenu ? `<div class="sound-menu" role="group" aria-label="${t("add.sound")}"><button data-action="add-record">🎙 ${t("add.record")}</button><button data-action="add-audio-file">⤒ ${t("add.audioFile")}</button></div>` : ""}</div>${writeCardHTML()}<div class="studio-footer"><button class="secondary" data-action="save-draft">${t("studio.saveDraft")}</button><span class="export-choice"><button class="primary" data-action="export">${icon("download")} ${t("export.photo")}</button><button class="primary" data-action="export-video">▶ ${t("export.video")}</button></span></div><p class="save-help">${t("studio.help")}</p><div class="tool-dock-wrap" id="tool-menu">${toolMenuHTML()}</div>`;
}

function updateCanvas() {
  if ($("#canvas-wrap")) $("#canvas-wrap").innerHTML = canvasHTML();
  placeLayerBar();
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
  for (const attr of ["id", "data-moment-field", "data-editor-field", "data-inline", "data-inline-layer", "data-publish", "data-community-search", "data-people-search"])
    if (element.hasAttribute(attr)) return `[${attr}="${CSS.escape(element.getAttribute(attr))}"]`;
  return null;
}
function render() {
  const focused = focusKey(document.activeElement);
  const caret = focused ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  const textCaret = focused && document.activeElement.isContentEditable ? caretOffset(document.activeElement) : null;
  const scrollTop = $("#app-scroll").scrollTop;
  releaseLeftScope();
  const signedIn = Account.isSignedIn(account);
  $("#phone").classList.toggle("signed-out", !signedIn);
  // Studio is full-screen (its own ‹ back); the tool row keeps its scroll.
  $("#phone").classList.toggle("in-studio", signedIn && (page === "studio" || page === "note"));
  const dockScroll = $(".tool-dock")?.scrollLeft || 0;
  if (!signedIn) {
    $("#app").innerHTML = loginHTML();
    $("#navigation").innerHTML = "";
    renderTour();
    return;
  }
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
    settings: () => settingsHTML(ctx(), { back: settingsReturn, account, themes: themePickerHTML() }),
    inbox: () => inboxHTML(social(), inboxFilter, ctx(), { icon }),
    note: noteHTML,
  }[page]();
  navigation();
  applyShellLanguage();
  $("#app-scroll").scrollTop = scrollTop;
  if (focused) {
    const again = $(`#app ${focused}`);
    if (again?.dataset.inlineLayer) editTextLayer(again.dataset.inlineLayer);
    else if (again) again.focus({ preventScroll: true });
    if (again && textCaret != null) placeCaret(again, textCaret);
    else if (again) {
      try {
        if (caret[0] != null) again.setSelectionRange(caret[0], caret[1]);
      } catch {}
    }
  }
  if (page === "settings") showMediaUsage();
  pinStageForSheet();
  placeLayerBar();
  const dock = $(".tool-dock");
  if (dock) {
    dock.scrollLeft = dockScroll;
    dock.querySelector('[aria-expanded="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  renderTour();
}

/* ---------- App color theme (this device) ---------- */
const THEME_KEY = "little-days.theme";
function loadTheme() {
  try {
    const id = localStorage.getItem(THEME_KEY);
    return tokens?.themes?.some((theme) => theme.id === id) ? id : "soft";
  } catch {
    return "soft";
  }
}
function applyTheme(id) {
  const theme = tokens?.themes?.find((item) => item.id === id) || { id: "soft" };
  if (theme.id === "soft") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme.id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && theme.swatch?.[0]) meta.content = theme.swatch[0];
}
function themePickerHTML() {
  const current = loadTheme();
  return `<section class="settings-card theme-card"><h2>${t("theme.title")}</h2><p>${t("theme.note")}</p><div class="theme-grid">${(tokens.themes || [])
    .map(
      (theme) =>
        `<button data-action="theme" data-theme-id="${esc(theme.id)}" class="theme-option ${theme.id === current ? "selected" : ""}" aria-pressed="${theme.id === current}"><span class="theme-swatch ${theme.mode === "dark" ? "dark" : ""}" aria-hidden="true">${(theme.swatch || []).map((color) => `<i style="background:${esc(color)}"></i>`).join("")}</span><b>${t("theme." + theme.id)}</b><small>${t("theme." + theme.id + "Hint")}</small></button>`,
    )
    .join("")}</div></section>`;
}

/* ---------- Sign in (this device) and the welcome tour ---------- */

function loginHTML() {
  const avatar = loginAvatar || account?.avatar || "🌷";
  const back = account && !account.signedIn;
  return `<section class="login"><div class="login-art" aria-hidden="true"><span>✿</span><i>📔</i><i>🌷</i><i>📷</i></div><h1 class="login-title">Little Days</h1><p class="login-tag">${t("login.tagline")}</p>${back ? `<p class="login-back">${t("login.welcomeBack", { name: account.name || t("community.me") })}</p>` : ""}<div class="login-form"><span class="small-label">${t("login.avatar")}</span><div class="p-avatars login-avatars">${Account.AVATARS.map((a) => `<button type="button" data-action="login-avatar" data-avatar="${a}" class="${avatar === a ? "selected" : ""}" aria-pressed="${avatar === a}">${a}</button>`).join("")}</div><label class="field">${t("login.name")}<input id="login-name" maxlength="30" autocomplete="nickname" value="${esc(account?.name || "")}" placeholder="${t("login.namePlaceholder")}"></label><button class="primary full-width" data-action="login-local">${t(back ? "login.continue" : "login.start")}</button></div><div class="login-divider"><span>${t("login.or")}</span></div><button class="login-provider" disabled> ${t("login.apple")}<small>${t("login.soon")}</small></button><button class="login-provider" disabled>✉︎ ${t("login.email")}<small>${t("login.soon")}</small></button><p class="login-note">🔒 ${t("login.note")}</p><div class="login-language"><button data-action="login-language" data-language="zh-CN" class="${languageCode() === "en" ? "" : "selected"}">中文</button><button data-action="login-language" data-language="en" class="${languageCode() === "en" ? "selected" : ""}">English</button></div></section>`;
}
function renderTour() {
  const box = $("#tour");
  if (!box) return;
  const show = Account.isSignedIn(account) && !account.onboarded;
  box.hidden = !show;
  if (!show) {
    box.innerHTML = "";
    return;
  }
  const step = Math.max(0, Math.min(Account.TOUR.length - 1, tourStep));
  const item = Account.TOUR[step];
  const last = step === Account.TOUR.length - 1;
  box.innerHTML = `<div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title"><button class="tour-skip text-button" data-action="tour-skip">${t("tour.skip")}</button><div class="tour-icon tour-${item.id}" aria-hidden="true">${item.icon}</div><span class="tour-count">${step + 1} / ${Account.TOUR.length}</span><h2 id="tour-title">${item.id === "welcome" && !account.name ? t("tour.welcome.titleAnon") : t(`tour.${item.id}.title`, { name: account.name })}</h2><p>${t(`tour.${item.id}.body`)}</p>${item.id === "theme" ? `<div class="tour-themes">${(tokens.themes || []).map((theme) => `<button data-action="theme" data-theme-id="${esc(theme.id)}" class="${theme.id === loadTheme() ? "selected" : ""}" aria-pressed="${theme.id === loadTheme()}"><span class="theme-swatch" aria-hidden="true">${(theme.swatch || []).map((c) => `<i style="background:${esc(c)}"></i>`).join("")}</span>${t("theme." + theme.id)}</button>`).join("")}</div>` : ""}<div class="tour-dots" aria-hidden="true">${Account.TOUR.map((_, i) => `<i class="${i === step ? "on" : ""}"></i>`).join("")}</div><div class="tour-actions">${step ? `<button class="secondary" data-action="tour-prev">${t("tour.prev")}</button>` : "<span></span>"}<button class="primary" data-action="tour-next">${t(last ? "tour.done" : "tour.next")}</button></div></div>`;
  if (!box.contains(document.activeElement)) box.querySelector('[data-action="tour-next"]')?.focus({ preventScroll: true });
}
function accountAction(target) {
  const name = target.dataset.action;
  switch (name) {
    case "login-avatar":
      loginAvatar = target.dataset.avatar;
      document.querySelectorAll(".login-avatars button").forEach((b) => {
        b.classList.toggle("selected", b === target);
        b.setAttribute("aria-pressed", String(b === target));
      });
      return true;
    case "login-language":
      setLanguage(target.dataset.language);
      document.documentElement.lang = languageCode();
      render();
      return true;
    case "login-local": {
      const firstTime = !account;
      account = Account.signIn(localStorage, { name: $("#login-name")?.value || "", avatar: loginAvatar || account?.avatar });
      // The demo profile starts with the same name and avatar.
      const demo = social();
      if (!demo.profile.name) {
        Community.updateProfile(demo, { name: account.name, avatar: account.avatar });
        persistSocial();
      }
      tourStep = 0;
      page = "home";
      render();
      $("#app-scroll").scrollTop = 0;
      if (!firstTime) toast(t("login.welcomeToast", { name: account.name || t("community.me") }));
      return true;
    }
    case "tour-next":
      if (tourStep >= Account.TOUR.length - 1) {
        account = Account.finishTour(localStorage);
        renderTour();
        toast(t("tour.finished"));
      } else {
        tourStep += 1;
        renderTour();
      }
      return true;
    case "tour-prev":
      tourStep = Math.max(0, tourStep - 1);
      renderTour();
      return true;
    case "tour-skip":
      account = Account.finishTour(localStorage);
      renderTour();
      return true;
    case "tour-replay":
      account = Account.replayTour(localStorage);
      tourStep = 0;
      renderTour();
      return true;
    case "theme": {
      const id = target.dataset.themeId;
      try {
        localStorage.setItem(THEME_KEY, id);
      } catch {}
      applyTheme(id);
      render();
      toast(t("theme.changed", { name: t("theme." + id) }));
      return true;
    }
    case "inbox-open":
      if (page !== "inbox") inboxReturn = page === "books" && booksView === "profile" ? "profile" : page;
      myExperience();
      page = "inbox";
      render();
      $("#app-scroll").scrollTop = 0;
      return true;
    case "inbox-back": {
      // Opening the center marks everything as seen.
      Community.markInboxRead(social());
      persistSocial();
      if (inboxReturn === "profile") openProfile();
      else navigate(inboxReturn && inboxReturn !== "inbox" ? inboxReturn : "home");
      return true;
    }
    case "inbox-filter":
      inboxFilter = target.dataset.filter;
      render();
      return true;
    case "inbox-read-all":
      Community.markInboxRead(social());
      for (const conversation of social().conversations) conversation.messages.forEach((m) => (m.read = true));
      persistSocial();
      render();
      toast(t("inbox.allRead"));
      return true;
    case "inbox-accept":
    case "inbox-decline":
      if (name === "inbox-accept") Community.acceptFriend(social(), target.dataset.user);
      else Community.declineFriend(social(), target.dataset.user);
      persistSocial();
      render();
      toast(t(name === "inbox-accept" ? "community.accepted" : "community.declined"));
      return true;
    case "showcase": {
      const bookId = target.dataset.book;
      const on = target.dataset.on === "1";
      if (on === Community.isShowcased(social(), bookId)) return true;
      const apply = () => {
        Community.setShowcase(social(), bookId, on);
        persistSocial();
        toast(t(on ? "who.shownToast" : "who.hiddenToast"));
        render();
      };
      if (on) askConfirm(t("who.confirm")).then((ok) => ok && apply());
      else apply();
      return true;
    }
    case "note-done": {
      const saved = target.dataset.keep === "1" || $("#note-title")?.value.trim() || $("#note-body")?.value.trim() ? saveNote() : false;
      if (saved) toast(t("note.saved"));
      navigate(saved ? "home" : noteReturn && noteReturn !== "note" ? noteReturn : "home");
      return true;
    }
    case "studio-back":
      flushDraft();
      navigate(studioReturn && !["studio", "settings"].includes(studioReturn) ? studioReturn : "home");
      return true;
    case "settings-back":
      navigate(settingsReturn && settingsReturn !== "settings" ? settingsReturn : "home");
      return true;
    case "sign-out":
      askConfirm(t("login.signOutConfirm")).then((ok) => {
        if (!ok) return;
        flushDraft();
        account = Account.signOut(localStorage);
        loginAvatar = null;
        page = "home";
        render();
      });
      return true;
  }
  return false;
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
    `<h2>${t(check ? "growth.noteTitle" : "dialog.durationTitle")}</h2><p class="dialog-description">${esc(habit.title)} · ${esc(shortDate(date))}</p><div class="dialog-fields note-paper"><label class="field">${t("growth.detail")}<input name="detail" maxlength="80" placeholder="${t("growth.detailPlaceholder")}" value="${esc(check?.detail || "")}"></label><label class="field">${t(habit.kind === "duration" ? "dialog.durationLabel" : "growth.minutesOptional")}<input name="minutes" type="number" min="${habit.kind === "duration" ? 1 : 0}" max="1440" ${habit.kind === "duration" ? "required" : ""} value="${check ? check.minutes || "" : habit.kind === "duration" ? habit.minutes || 20 : ""}"></label><label class="field">${t("growth.note")}<textarea name="note" maxlength="2000" placeholder="${t("growth.notePlaceholder")}">${esc(check?.note || "")}</textarea></label><div><span class="small-label">${t("studio.mood")}</span><div class="mood-list">${["", ...features.moods].map((m) => `<label class="mood-radio"><input type="radio" name="mood" value="${m}" ${(check?.mood || "") === m ? "checked" : ""}><span>${m || "—"}</span></label>`).join("")}</div></div><div class="check-photo"><span id="check-photo-preview">${photo ? `<img src="${esc(photo)}" alt="">` : ""}</span><button type="button" class="secondary" data-action="check-photo">${t("growth.photo")}</button><button type="button" class="text-button" data-action="check-photo-remove" ${photo ? "" : "hidden"}>${t("photo.remove")}</button></div><label class="check-label"><input type="checkbox" name="shareNote" ${check?.shareNote ? "checked" : ""}> ${t("growth.shareNote")}</label><p class="save-help">${t("growth.privateNote")}</p></div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary">${t(check ? "save" : "dialog.record")}</button></div>`;
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
    // One tap records the usual minutes; ✎ changes them or adds a note.
    store.update((s) => saveCheckReflection(s, habitId, date, { minutes: habit.minutes || 20 }));
    render();
    toast(t("growth.checkedHint"));
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
  toast(existing ? t("这次打卡已取消") : t("growth.checkedHint"));
}
async function action(target) {
  const actionName = target.dataset.action;
  if (accountAction(target)) return;
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
    else {
      render();
      // The day's panel is below the month; bring it into view.
      $(".date-summary")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
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
    booksView = "shelf";
    pulledBook = target.dataset.book;
    flushDraft();
    selectedBook = target.dataset.book;
    bookFilter = { month: "", date: "" };
    page = "books";
    render();
    $("#app-scroll").scrollTop = 0;
  }
  if (actionName === "photo-edit") await reEditPhotoLayer();
  if (actionName === "use-scene") {
    if ($("#scene-dialog")?.open) $("#scene-dialog").close();
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    useScene(target.dataset.scene, target.dataset.from === "home");
  }
  if (actionName === "scene-collection") {
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    openSceneCollection(target.dataset.collection);
  }
  if (actionName === "scene-close") $("#scene-dialog").close();
  if (actionName === "layer-shape") {
    const shape = target.dataset.shape;
    changeTarget((page) => {
      const layer = page.layers.find((item) => item.id === selectedLayer);
      if (!layer) return;
      if (shape === "free") {
        delete layer.shape;
        return;
      }
      layer.shape = shape;
      // Keep roughly the same width; the height follows the shape.
      Object.assign(layer, shapeSize(shape, Math.min(Number(layer.w) || 42, 60)));
    });
  }
  if (actionName === "pull-book") {
    // Tap a spine to pull the book out; tap the pulled one again to open it.
    if (pulledBook === target.dataset.book) {
      selectedBook = pulledBook;
      bookFilter = { month: "", date: "" };
      render();
      $("#app-scroll").scrollTop = 0;
    } else {
      pulledBook = target.dataset.book;
      render();
      $("#app-scroll").scrollTop = 0;
    }
  }
  if (actionName === "put-back") {
    pulledBook = null;
    render();
  }
  if (actionName === "book-write") {
    const book = state().books.find((b) => b.id === target.dataset.book);
    if (!book) return;
    openStudio(dateKey());
    addMomentNow();
    changeTarget((m) => {
      if (m !== editor) m.bookId = book.id;
    });
    setPageMode("note", { quiet: true });
    toast(t("book.writingIn", { name: book.title }));
  }
  if (actionName === "calendar-book") {
    calendarBook = target.dataset.book || "";
    render();
  }
  if (actionName === "shelf-write") {
    const book = target.dataset.book;
    openStudio(dateKey());
    changeEditor((e) => {
      e.bookId = book;
    });
  }
  if (actionName === "books-view") {
    booksView = target.dataset.view === "profile" ? "profile" : "shelf";
    selectedBook = null;
    render();
    $("#app-scroll").scrollTop = 0;
  }
  if (actionName === "open-profile") openProfile();
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
      const removed = e.layers.find((l) => l.id === selectedLayer);
      e.layers = e.layers.filter((l) => l.id !== selectedLayer);
      // A video/sound deleted from the paper goes with its file entry too
      // (unless a copy is still on the page). Undo brings both back.
      if (removed?.clipId && !e.layers.some((l) => l.clipId === removed.clipId))
        e.media = e.media.filter((clip) => clip.id !== removed.clipId);
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
  if (actionName === "add-photos" || actionName === "photo-chooser") {
    soundMenu = false;
    openPhotoChooser(target.dataset.target === "main" ? "main" : "layers");
  }
  if (actionName === "choose-album") {
    $("#choose-dialog").close();
    if (photoTarget === "main") $("#photo-input").click();
    else $("#photos-input").click();
  }
  if (actionName === "choose-close") $("#choose-dialog").close();
  if (actionName === "open-backdrops") {
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    studioTool = "paper";
    sheetTall = true;
    render();
  }
  if (actionName === "backdrop") {
    const reference = target.dataset.backdrop;
    changeTarget((p) => {
      if (/^(scene|photo):[a-z0-9-]+$/.test(reference)) p.backdrop = reference;
      else delete p.backdrop;
    });
  }
  if (actionName === "sheet-grow") {
    sheetTall = !sheetTall;
    render();
  }
  if (actionName === "add-video") {
    soundMenu = false;
    $("#video-input").click();
  }
  if (actionName === "add-sound") {
    soundMenu = !soundMenu;
    render();
  }
  if (actionName === "add-audio-file") {
    soundMenu = false;
    render();
    $("#audio-input").click();
  }
  if (actionName === "add-record") {
    // The stop button lives in the sound & video sheet.
    soundMenu = false;
    studioTool = "media";
    render();
    await startRecording();
  }
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
    await exportJournalImage(activePage(), exportOptions());
    toast(t("export.photoDone"));
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
  if (target.dataset?.inline || target.dataset?.inlineLayer) {
    inlineInput(target);
    return;
  }
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
  if (dialogKind === "collab-page") {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    try {
      if (dialogPayload?.pageId)
        Collab.editPage(social(), selectedBook, dialogPayload.pageId, "me", values);
      else Collab.addPage(social(), selectedBook, "me", values);
      persistSocial();
      $("#form-dialog").close();
      toast(t("collab.saved"));
      render();
    } catch (error) {
      toast(t(error.message?.startsWith("collab.") ? error.message : "community.saveFailed"));
    }
    return;
  }
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
  if (layer.kind === "photo" || layer.kind === "video")
    element.style.height = `${layer.h}%`;
  element.style.transform = layerGeometry(layer).match(/transform:(.*)$/)[1];
  const image = element.querySelector(".photo-crop img");
  if (image) image.setAttribute("style", cropStyle(layer));
  placeLayerBar();
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
  if (event.target.closest(".layer-play, .canvas-add-row, .canvas-scene-link, .layer-bar, .photo-placeholder")) return;
  if (event.target.closest('[data-inline], .layer-text[contenteditable="plaintext-only"], .layer-text[contenteditable="true"]')) return;
  // Touching the paper puts the keyboard away so the tools come back.
  if (document.activeElement?.matches?.(TYPING_FIELD)) document.activeElement.blur();
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
    } else if (!isDayPage() && activePage().layoutTemplate === "text" && pointers.size === 1) {
      // A note page: tapping anywhere on the paper starts typing.
      pointers.delete(event.pointerId);
      event.preventDefault();
      focusInline("body");
    }
    return;
  }
  const layer = activePage().layers.find((l) => l.id === element.dataset.layer);
  if (!layer) return;
  const wasSelected = selectedLayer === layer.id;
  if (selectedLayer !== layer.id) {
    if (cropMode) cropMode = false;
    selectedLayer = layer.id;
    // Re-render so handles and controls appear, then keep dragging.
    $("#canvas-wrap").innerHTML = canvasHTML();
    // The 图层 icon appears in the dock; no sheet pops up mid-drag.
    refreshToolMenu();
  }
  const handle = event.target.closest("[data-handle]")?.dataset.handle;
  beginGesture(
    layer,
    cropMode && layer.kind === "photo" ? "crop" : handle || "move",
    event,
  );
  // A second tap on a selected text box types into it, right on the paper.
  // (The rotate knob sits over short boxes; a tap there without turning also types.)
  if (drag) drag.tapToEdit = wasSelected && layer.kind === "text" && handle !== "resize" && !cropMode;
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
    if (layer.kind === "photo" || layer.kind === "video")
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
  const { moved, before, layer, tapToEdit } = drag;
  drag = null;
  if (moved) {
    history.push(before);
    if (history.length > 30) history.shift();
    future = [];
    if (layer.kind === "photo") activePage().layoutEdited = true;
    scheduleDraft();
  }
  render();
  if (!moved && tapToEdit) editTextLayer(layer.id);
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
        coverTemplate: "magazine-jp",
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
  // Profile actions (edit, settings, saved filter…) re-render in place on
  // My Books → 我的主页; anything that opens a feed, chat, work or the
  // publish sheet goes to Community.
  const onProfile = page === "books" && booksView === "profile";
  if (!onProfile || ["tab", "workId", "chatUser", "publish"].some((key) => changes[key])) page = "community";
  render();
}
// Collaborative Journal demo (inside a book's detail page). Demo storage only.
function openCollabPageDialog(item = null) {
  dialogKind = "collab-page";
  dialogPayload = { pageId: item?.id || null };
  $("#dialog-form").innerHTML = `<h2>${t(item ? "collab.editTitle" : "collab.writeTitle")}</h2><p class="dialog-description">${t("collab.demoLabel")} · ${t("collab.dialogNote")}</p><div class="dialog-fields note-paper"><label class="field">${t("collab.pageTitle")}<input name="title" maxlength="80" value="${esc(item?.title || "")}"></label><label class="field">${t("collab.pageBody")}<textarea name="body" maxlength="2000">${esc(item?.body || "")}</textarea></label></div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary">${t("save")}</button></div>`;
  $("#form-dialog").showModal();
}
async function collabAction(target) {
  const name = target.dataset.action;
  if (!name?.startsWith("collab-") || !selectedBook) return false;
  const demo = social();
  const book = selectedBook;
  const user = target.dataset.user;
  const done = (message) => {
    persistSocial();
    if (message) toast(message);
    render();
  };
  try {
    switch (name) {
      case "collab-toggle":
        collabOpen = !collabOpen;
        render();
        break;
      case "collab-invite": {
        const who = $("#collab-invite-user")?.value;
        if (!who) break;
        Collab.invite(demo, book, who, $("#collab-invite-role").value);
        done(t("collab.invited", { name: Community.userById(demo, who)?.name || "" }));
        break;
      }
      case "collab-accept":
        Collab.simulateAccept(demo, book, user);
        done(t("collab.accepted", { name: Community.userById(demo, user)?.name || "" }));
        break;
      case "collab-cancel-invite":
        Collab.cancelInvite(demo, book, user);
        done();
        break;
      case "collab-remove":
      case "collab-leave": {
        const left = name === "collab-leave";
        const who = Community.userById(demo, user)?.name || "";
        if (!left && !(await askConfirm(t("collab.removeConfirm", { name: who })))) break;
        Collab.removeMember(demo, book, user, { left });
        done(t(left ? "collab.leftToast" : "collab.removed", { name: who }));
        break;
      }
      case "collab-write":
        openCollabPageDialog();
        break;
      case "collab-edit-page":
        openCollabPageDialog(Collab.collabFor(demo, book).pages.find((p) => p.id === target.dataset.page));
        break;
      case "collab-conflict":
        Collab.simulateConflict(demo, book, target.dataset.page);
        done();
        break;
      case "collab-resolve":
        Collab.resolveConflict(demo, book, target.dataset.choice);
        done(t("collab.resolved"));
        break;
      case "collab-restore":
        if (!(await askConfirm(t("collab.restoreConfirm")))) break;
        Collab.restoreVersion(demo, book, target.dataset.version);
        done(t("collab.restored"));
        break;
      default:
        return false;
    }
  } catch (error) {
    toast(t(error.message?.startsWith("collab.") || error.message?.startsWith("community.") ? error.message : "community.saveFailed"));
  }
  return true;
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
        if (page === "books") render();
        else openProfile();
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
        openCommunity({ chatUser: null, chatMenu: false, shareOpen: false });
        break;
      case "community-chat-menu":
        openCommunity({ chatMenu: !communityView.chatMenu });
        break;
      case "community-share-toggle":
        openCommunity({ shareOpen: !communityView.shareOpen });
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
        openProfile();
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
        communityView = { ...communityView, tab: "discover", editProfile: false, savedType: "" };
        openCommunity({ workId: null, chatUser: null, publish: null });
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
// Where a new clip lands: on a day page it avoids the fixed title and words.
function clipSpot(page, entry, clip) {
  // Clips of this kind already on the page (the new clip may already be listed).
  const n = page.media.filter((item) => item.kind === clip.kind && item.id !== clip.id).length;
  if (page !== entry) return { y: clip.kind === "video" ? 58 : Math.min(92, 82 + (n % 2) * 8) };
  return clip.kind === "video"
    ? { x: 70, y: 44, w: 40, h: 21, rotation: 4 }
    : { x: 50, y: n % 2 ? 84 : 93, w: 56 };
}
function exportOptions() {
  const page = activePage();
  return {
    resolvePhoto: safePhoto,
    catalog,
    fontFamily,
    dayPage: isDayPage(),
    date: editor.date,
    suffix: isDayPage() ? "" : `moment-${editor.moments.indexOf(page) + 1}`,
    growthCard: (layer) => {
      const check = state().checks.find(
        (item) => item.habitId === layer.habitId && item.date === layer.checkDate,
      );
      const habit = state().habits.find((item) => item.id === layer.habitId);
      return {
        title: habit?.title || layer.text,
        facts: [check?.detail, check?.minutes ? `${check.minutes} min` : ""].filter(Boolean).join(" · "),
        note: check?.note || "",
      };
    },
  };
}
// Records the page (moving video + mixed sound) and downloads it.
async function exportPageVideo() {
  if (!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    toast(t("export.videoUnsupported"));
    return;
  }
  busyMedia = true;
  let cancelled = false;
  const dialog = $("#export-dialog");
  $("#export-title").textContent = t("export.title");
  $("#export-cancel").textContent = t("cancel");
  $("#export-progress").style.width = "0%";
  $("#export-time").textContent = t("export.preparing");
  $("#export-cancel").onclick = () => {
    cancelled = true;
    $("#export-time").textContent = t("export.cancelling");
  };
  // Esc behaves like Cancel instead of hiding a running recording.
  dialog.oncancel = (event) => {
    event.preventDefault();
    cancelled = true;
  };
  dialog.showModal();
  try {
    document.querySelectorAll("#app audio, #app video").forEach((element) => element.pause());
    await exportJournalVideo(activePage(), {
      ...exportOptions(),
      isCancelled: () => cancelled,
      onProgress: (seconds, total) => {
        $("#export-progress").style.width = `${Math.min(100, (seconds / total) * 100)}%`;
        $("#export-time").textContent = t("export.recording", {
          now: formatDuration(seconds),
          total: formatDuration(total),
        });
      },
    });
    toast(t("export.videoDone"));
  } catch (error) {
    if (error?.code === "cancelled") toast(t("export.cancelled"));
    else {
      console.warn("Video export failed", error?.name);
      toast(t("export.videoFailed"));
    }
  } finally {
    dialog.close();
    busyMedia = false;
  }
}
function openTool(tool) {
  studioTool = studioTool === tool ? null : tool;
  render();
}
// When a sheet opens, pin the page at the top so it stays visible above it.
let pinnedSheet = null;
function pinStageForSheet() {
  if (page !== "studio" || !studioTool) {
    pinnedSheet = null;
    return;
  }
  if (studioTool === pinnedSheet) return;
  pinnedSheet = studioTool;
  const stage = $(".studio-stage"),
    scroller = $("#app-scroll");
  if (stage && scroller)
    scroller.scrollTop += stage.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}
async function v31Action(target) {
  const name = target.dataset.action;
  const momentId = target.dataset.moment;
  switch (name) {
    case "tool":
      openTool(target.dataset.tool);
      return true;
    case "tool-close":
      openTool(null);
      return true;
    case "layer-play": {
      const element = target.closest(".media-layer")?.querySelector("video,audio");
      if (!element) return true;
      if (element.paused)
        element.play().catch((error) => {
          if (error?.name === "NotAllowedError") return toast(t("media.tapAgain"));
          // iPhones sometimes need the file reloaded before the first play.
          element.load();
          element.play().catch((again) => toast(t(again?.name === "NotSupportedError" ? "media.unsupported" : "media.missing")));
        });
      else element.pause();
      return true;
    }
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
      // Bigger page = close the open sheet; the page then fills the width.
      openTool(null);
      return true;
    case "select-moment":
      selectMoment(momentId);
      return true;
    case "add-moment":
      addMomentNow();
      return true;
    case "home-library":
      // Home → the whole photo library (album, today's picks, collections).
      openStudio(dateKey());
      beginStudio(null);
      openPhotoChooser("layers");
      return true;
    case "quick-moment":
      // Home / Calendar / Day Detail: one tap to start writing a Moment —
      // a note page, so the words are typed straight onto the paper.
      openStudio(target.dataset.date || dateKey());
      addMomentNow();
      setPageMode("note", { quiet: true });
      return true;
    case "page-mode":
      setPageMode(target.dataset.mode);
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
      const hasPhotos =
        Boolean(page.photo) || page.layers.some((layer) => layer.kind === "photo" && layer.mediaRef);
      let force = false;
      if (target.dataset.template === "text" && hasPhotos) {
        if (!(await askConfirm(t("layout.textConfirm")))) return true;
        force = true;
      }
      try {
        changeTarget((entry) => {
          if (entry === editor && !force) freeMainPhoto(entry);
          if (count >= 0)
            applyPageTemplate(entry, count, target.dataset.template, photoRegion(), { force });
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
  if (await collabAction(target)) return true;
  if (await studioStartAction(target)) return true;
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
  if (name === "cover-library-photo") {
    bookDraft = readBookForm();
    bookDraft.coverImage = `photo:${target.dataset.photo}`;
    document.querySelectorAll(".cover-photo-picks button").forEach((b) => b.classList.toggle("selected", b === target));
    refreshBookPreview();
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
    soundMenu = false;
    // The new box is typed into right on the paper (font and colour stay one
    // tap away under 编辑 in the bar above it).
    studioTool = null;
    changeTarget((entry) => {
      const layer = {
        id: id(),
        kind: "text",
        text: t("layer.newText"),
        x: 50,
        // In a free spot, not on top of the words already on the paper.
        y: [60, 78, 40, 18].find((y) => !entry.layers.some((l) => l.kind === "text" && Math.abs((l.y ?? 50) - y) < 12)) ?? 60,
        scale: 1,
        rotation: 0,
        fontId: "handwritten",
        fontSize: 18,
        color: "#6A7059",
        weight: 400,
        spacing: 0,
        align: "left",
      };
      entry.layers.push(layer);
      selectedLayer = layer.id;
    });
    editTextLayer(selectedLayer, true);
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
  if (name === "video-poster" || name === "video-cover") {
    await chooseVideoCover(target.dataset.clip);
    return true;
  }
  if (name === "layer-edit-text") {
    studioTool = "layer";
    render();
    const box = $('[data-layer-text="text"]');
    box?.focus({ preventScroll: true });
    box?.select();
    return true;
  }
  if (name === "remove-media") {
    changeTarget((entry) => {
      entry.media = entry.media.filter(
        (clip) => clip.id !== target.dataset.clip,
      );
      entry.layers = entry.layers.filter((layer) => layer.clipId !== target.dataset.clip);
    });
    return true;
  }
  if (name === "clip-on-page") {
    // Put a clip on the paper, or take it off (the file stays in the list).
    changeTarget((entry) => {
      const clip = entry.media.find((item) => item.id === target.dataset.clip);
      if (!clip) return;
      if (isOnPage(entry, clip.id)) entry.layers = entry.layers.filter((layer) => layer.clipId !== clip.id);
      else {
        const layer = mediaLayer(clip, clipSpot(entry, editor, clip));
        entry.layers.push(layer);
        selectedLayer = layer.id;
      }
    });
    return true;
  }
  if (name === "export-video") {
    await exportPageVideo();
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
  if (target.dataset.showcase) {
    const bookId = target.dataset.showcase;
    const on = target.value === "cover";
    const apply = () => {
      Community.setShowcase(social(), bookId, on);
      persistSocial();
      toast(t(on ? "who.shownToast" : "who.hiddenToast"));
      render();
    };
    if (on) askConfirm(t("who.confirm")).then((ok) => (ok ? apply() : render()));
    else apply();
    return true;
  }
  if (target.dataset.collabRole) {
    Collab.setRole(social(), selectedBook, target.dataset.collabRole, target.value);
    persistSocial();
    toast(t("collab.roleSaved"));
    render();
    return true;
  }
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
// Opens the photo editor for saved originals; returns the pictures to use
// (edited ones are new Blobs, originals kept as sourceRef) or null if cancelled.
async function editPhotos(saved, mode) {
  const items = saved
    .map((item) => ({ ref: item.sourceRef || item.reference, src: safePhoto(item.sourceRef || item.reference), name: item.name, edit: item.edit }))
    .filter((item) => item.src);
  if (!items.length) return null;
  const result = await openPhotoEditor(items, { t, loadImage, mode });
  if (!result) return null;
  const out = [];
  for (const item of result) {
    if (isIdentity(item.edit)) {
      out.push({ reference: item.ref, name: item.name });
      continue;
    }
    const canvas = renderEdited(item.image, item.edit);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image encoding failed"))), "image/jpeg", 0.88),
    );
    const mediaId = await media.put(blob, { kind: "photo", name: item.name, edited: true });
    out.push({ reference: `media:${mediaId}`, name: item.name, sourceRef: item.ref, edit: item.edit });
  }
  return out;
}
async function reEditPhotoLayer() {
  const layer = selectedLayerOf();
  if (layer?.kind !== "photo" || !layer.mediaRef) return;
  busyMedia = true;
  try {
    const [result] =
      (await editPhotos([{ reference: layer.mediaRef, sourceRef: layer.sourceRef, edit: layer.edit, name: layer.text }], "edit")) || [];
    if (!result) return;
    changeTarget((page) => {
      const target = page.layers.find((item) => item.id === layer.id);
      if (!target) return;
      target.mediaRef = result.reference;
      if (result.sourceRef) {
        target.sourceRef = result.sourceRef;
        target.edit = result.edit;
      } else {
        delete target.sourceRef;
        delete target.edit;
      }
    });
    flushDraft();
    toast(t("pe.saved"));
  } catch (error) {
    console.warn("Photo edit failed", error?.name);
    toast(t("media.failed"));
  } finally {
    busyMedia = false;
  }
}
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
    let saved = [];
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
    // New photos for the page open in the photo editor first (skip = as is).
    if (["photos", "replace"].includes(target?.kind)) saved = (await editPhotos(saved, "add")) || saved;
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
      $('[data-action="check-photo-remove"]')?.removeAttribute("hidden");
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
          delete layer.sourceRef;
          delete layer.edit;
          if (saved[0].sourceRef) {
            layer.sourceRef = saved[0].sourceRef;
            layer.edit = saved[0].edit;
          }
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
    if (page.layoutTemplate === "text" && saved.length) noteToLayout(page);
    if (hadSlots && !remaining.length) {
      selectedLayer = null;
      return;
    }
    saved = remaining;
    const existing = page.layers.filter(
      (layer) => layer.kind === "photo",
    ).length;
    const added = saved.map(({ reference, name, sourceRef, edit }, index) =>
      photoLayer(reference, name, {
        ...(sourceRef ? { sourceRef, edit } : {}),
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
      const size = kind === "video" ? { width: element.videoWidth || 0, height: element.videoHeight || 0 } : {};
      finish();
      resolve({ duration, ...size });
    };
    element.onerror = () => {
      element.onerror = null;
      finish(new Error("Unsupported media"));
    };
    element.src = url;
  });
}
// Pick a frame (or upload a picture) as a video's cover.
async function chooseVideoCover(clipId) {
  const page = activePage();
  const clip = page.media.find((item) => item.id === clipId);
  if (!clip) return;
  const src = media.resolve(clip.source);
  if (!src) {
    toast(t("media.loading"));
    return;
  }
  const result = await openPosterPicker({ t, src, duration: clip.duration, poster: media.resolve(clip.poster || "") });
  if (!result) return;
  if (result.upload) return chooseAttachment({ kind: "poster", clip: clipId });
  if (result.error) return toast(t("poster.failed"));
  const posterId = await media.put(result.blob, { kind: "photo", name: `${clip.name} cover` });
  changeTarget((entry) => {
    const item = entry.media.find((c) => c.id === clipId);
    if (item) item.poster = `media:${posterId}`;
  });
  flushDraft();
  toast(t("poster.saved"));
}
async function autoCover(mediaId, duration) {
  try {
    const url = media.resolve(`media:${mediaId}`);
    if (!url) return "";
    const blob = await frameAt(url, Math.min(1, (duration || 2) * 0.25));
    return `media:${await media.put(blob, { kind: "photo", name: "cover" })}`;
  } catch {
    return "";
  }
}
async function attachClip(blob, kind, name, duration = 0, options = {}) {
  const mediaId = await media.put(blob, { kind, name, duration }, "studio");
  // Videos get a first cover right away (changeable later).
  const poster = kind === "video" ? await autoCover(mediaId, duration) : "";
  const targetId = options.targetId ?? activeMomentId;
  changeEditor((entry) => {
    const page = (targetId && findMoment(entry, targetId)) || entry;
    const clip = {
      id: id(),
      kind,
      name,
      mime: blob.type,
      size: blob.size,
      duration,
      source: `media:${mediaId}`,
      poster,
      ...(options.origin ? { origin: options.origin } : {}),
      ...(options.width && options.height ? { width: options.width, height: options.height } : {}),
    };
    page.media.push(clip);
    // New clips go straight onto the paper, like photos; a video keeps its
    // own orientation (portrait phone videos stand upright).
    const spot = clipSpot(page, entry, clip);
    if (kind === "video") {
      const shape = shapeForSize(clip.width, clip.height);
      Object.assign(spot, { shape }, shapeSize(shape, shape === "landscape" ? spot.w : undefined));
    }
    page.layers.push(mediaLayer(clip, spot));
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
    await attachClip(file, kind, file.name, metadata.duration, { width: metadata.width, height: metadata.height });
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
  // Colors come from tokens.css / themes.css (generated from the shared
  // design tokens); only the chosen theme is applied here.
  applyTheme(loadTheme());
  store = new Store(localStorage, responses[2]);
  account = Account.loadAccount(localStorage);
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
// Clips on the paper show their own playing state.
for (const type of ["play", "pause", "ended"])
  document.addEventListener(
    type,
    (event) => {
      const layer = event.target.closest?.(".media-layer");
      if (layer) layer.classList.toggle("playing", type === "play");
    },
    true,
  );

// ---------- Typing on a phone: the keyboard must never cover the options ----------
// While a text field has focus on a touch screen, the menu and tool icons step
// aside and an open panel sits right above the keyboard (its height comes from
// visualViewport where the browser reports it; otherwise the upper half).
const TYPING_FIELD = 'textarea, input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="file"]):not([type="date"]):not([type="time"]), [contenteditable="plaintext-only"], [contenteditable="true"]';
let typingTimer;
function updateVisibleArea() {
  const vv = window.visualViewport;
  const root = document.documentElement;
  if (!vv) return;
  const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  root.style.setProperty("--vv-top", `${Math.round(vv.offsetTop)}px`);
  if (keyboard > 80) root.style.setProperty("--vv-h", `${Math.round(vv.height)}px`);
  else root.style.removeProperty("--vv-h");
}
function keepFieldInView() {
  const field = document.activeElement;
  if (!field?.matches?.(TYPING_FIELD)) return;
  updateVisibleArea();
  requestAnimationFrame(() => {
    // Words on the paper: the paper is already pinned in view.
    if (field.closest(".studio-stage")) return;
    // Inside a panel only the panel scrolls; the page behind stays put.
    const sheet = field.closest(".tool-sheet");
    if (!sheet) return field.scrollIntoView({ block: "center" });
    const box = field.getBoundingClientRect(),
      area = sheet.getBoundingClientRect();
    if (box.top < area.top + 48 || box.bottom > area.bottom) sheet.scrollTop += box.top - area.top - 56;
  });
}
document.addEventListener("focusin", (event) => {
  if (!event.target.matches?.(TYPING_FIELD) || !matchMedia("(pointer: coarse)").matches) return;
  clearTimeout(typingTimer);
  document.body.classList.add("typing");
  document.body.classList.toggle("typing-sheet", Boolean(event.target.closest(".tool-sheet")));
  setTimeout(keepFieldInView, 250);
});
document.addEventListener("focusout", () => {
  // Moving from one field to the next keeps typing mode on.
  typingTimer = setTimeout(() => {
    if (document.activeElement?.matches?.(TYPING_FIELD)) return;
    document.body.classList.remove("typing", "typing-sheet");
  }, 120);
});
window.visualViewport?.addEventListener("resize", keepFieldInView);
window.visualViewport?.addEventListener("scroll", updateVisibleArea);

// A picture that can't be shown (file missing on this device or a format the
// browser can't read) gets a soft placeholder instead of the broken-image icon.
document.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (img?.tagName === "IMG" && img.closest?.(".photo-crop")) img.closest(".photo-crop").classList.add("broken");
  },
  true,
);

// Pull a panel's grabber up for more room, down to make it smaller or close it.
let sheetDrag = null;
document.addEventListener("pointerdown", (event) => {
  const grip = event.target.closest(".sheet-grabber, .sheet-head");
  if (!grip || event.target.closest(".sheet-close")) return;
  sheetDrag = { y: event.clientY, moved: false };
});
document.addEventListener("pointermove", (event) => {
  if (sheetDrag && Math.abs(event.clientY - sheetDrag.y) > 8) sheetDrag.moved = true;
});
document.addEventListener("pointerup", (event) => {
  if (!sheetDrag) return;
  const dy = event.clientY - sheetDrag.y;
  const moved = sheetDrag.moved;
  sheetDrag = null;
  if (!moved || page !== "studio") return;
  if (dy < -30 && !sheetTall) {
    sheetTall = true;
    render();
  } else if (dy > 30) {
    if (sheetTall) sheetTall = false;
    else studioTool = null;
    render();
  }
});
