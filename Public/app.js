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
  coverPhotoRef,
  MAGAZINE_COVERS,
  bookDialogHTML,
  fieldDefinitionHTML,
  customFieldsHTML,
  mediaPanelHTML,
  settingsHTML,
  fieldLabel,
} from "./js/personal-ui.mjs";
import { loadImage, exportJournalImage, exportJournalVideo, shareStory, renderJournalCanvas, renderBookTitleCanvas } from "./js/export.mjs";
import { bookSharePages, limitPages, dateRange, buildPdf } from "./js/book-share.mjs";
import { photoTime } from "./js/exif.mjs";
import * as AppLock from "./js/app-lock.mjs";
import { MetaStore } from "./js/meta-store.mjs";
import { searchJournal, onThisDay, terms as searchTerms } from "./js/search.mjs";
import * as Keeper from "./js/keeper.mjs";
import { keeperImage, keeperOutfits, DEFAULT_OUTFIT } from "./js/keeper-art.mjs";
import { groupByTime, movePhoto, splitAt, removePhoto, clockLabel, partOfDay, timelineLayers } from "./js/day-story.mjs";
import { kitList, findKit, kitForBook, kitName, applyKit, firstLook, decorate } from "./js/story-style.mjs";
import { STYLES, STYLE_LOOK, styleOf, layoutMoment, layoutDay, heroIndex, fitPhoto } from "./js/scrapbook-layout.mjs";
import { createMusicPlayer, musicTracks, findTrack, trackName, trackMood, clock, dayMusic, bookMusic, pageMusic, musicChipHTML, loadVolume, saveVolume } from "./js/music.mjs";
import {
  backdropOf,
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
import { openDrawBoard } from "./js/draw.mjs";
import { logEvent, readEvents, summarize } from "./js/events.mjs";
import { UPDATES, LATEST, noteFor, hasUnseen, markSeen } from "./js/whats-new.mjs";
import { recordedDays, streakInfo, bestStreak, CELEBRATED_KEY } from "./js/streak.mjs";
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
  framedPhoto,
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
  parseTags,
  moveBookTo,
  removeSamples,
  stepBook,
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
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
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
  inboxFilter = "all",
  inboxReturn = "home",
  studioReturn = "home",
  soundMenu = false,
  account = null,
  loginAvatar = null,
  tourStep = 0,
  settingsReturn = "home",
  booksView = "shelf", // "shelf" (my books) | "our" (books written with friends) | "profile"
  homeBooks = "mine", // Home's books row: "mine" | "our"
  quick = null, // the 记一页 sheet: { book, photo: "" | "today" | "pick" }
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
// Labs: modules paused while we test the core (community, messages, levels,
// decorating, shared books, colour themes, sign-in page). The code and data
// stay; they are hidden unless switched on in Settings (this device only).
const LABS_KEY = "little-days.labs";
function labsOn() {
  try {
    return localStorage.getItem(LABS_KEY) === "1";
  } catch {
    return false;
  }
}
const LAB_PAGES = ["community", "inbox"];
function bell() {
  return labsOn() ? bellHTML(social(), ctx()) : "";
}
function navigate(target) {
  flushDraft();
  readReturn = null;
  quickResult = null;
  if (LAB_PAGES.includes(target) && !labsOn()) target = "home";
  // Back on Home after writing today's first page: the stamp moment.
  if (target === "home") setTimeout(() => maybeCelebrate(), 260);
  if (target === "studio") {
    // The ＋ in the menu asks how to record: photo + one line, just write, or
    // draw — and which journal it goes into.
    openQuickRecord();
    return;
  }
  if (target === "settings" && page !== "settings") settingsReturn = page;
  page = target;
  selectedBook = null;
  render();
  $("#app-scroll").scrollTop = 0;
}
// Editing a page straight from where it is read (the day, or the book page
// by page): saving or ‹ goes back to that same spot.
let readReturn = null;
function returnToReading() {
  const back = readReturn;
  readReturn = null;
  flushDraft();
  quickResult = null;
  page = back.page;
  selectedBook = back.book;
  selectedDate = back.date;
  flipTurn = 0;
  render();
  if (back.page === "day" && back.moment) document.getElementById(`moment-${back.moment}`)?.scrollIntoView({ block: "start" });
}
function openStudio(date = dateKey()) {
  readReturn = null;
  if (page !== "studio" && page !== "settings") studioReturn = page;
  flushDraft();
  selectedDate = date;
  let existing =
    state().drafts[date] ||
    state().entries.find((entry) => entry.date === date);
  // A sample day is only an example: writing on that date starts my own
  // page (the sample goes away when the day is saved).
  if (existing?.isDemo) existing = null;
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
  // There is no separate "day page" to fill in: a day is its pages. An old
  // day page with something on it stays the first page.
  if (!hasDayPageContent(editor) && editor.moments.length) activeMomentId = editor.moments[0].id;
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
  const current = { journey: "books", growth: "books", day: "calendar", inbox: "home" }[page] || page;
  // Growth is not a tab of its own (V6.6): habits are checked on Home's
  // "today" card and kept in the "My habits" book on the shelf.
  $("#navigation").innerHTML = features.tabs
    .filter((tab) => tab.inNav !== false)
    .filter((tab) => labsOn() || !LAB_PAGES.includes(tab.id))
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
  const pages = state().checks.filter((check) => check.habitId === habit.id).length;
  return `<div class="habit-row ${done?.note ? "has-note" : ""}"><button class="habit-symbol habit-book" data-action="habit-journey" data-habit="${esc(habit.id)}" aria-label="${esc(t("journey.open"))} · ${esc(habit.title)}">${themeIcon(habit.theme)}${pages ? `<i class="habit-book-count">${pages}</i>` : ""}</button><div class="habit-detail"><strong>${esc(habit.title)}</strong><small>${esc(presetLabel("theme.habit", habit.theme))} · ${habit.kind === "duration" ? t("minutesShort", { count: done?.minutes || habit.minutes }) : t("growth.encourage")}${done?.detail ? " · " + esc(done.detail) : ""}</small>${done?.note ? `<span class="habit-note">“${esc(done.note.slice(0, 60))}”</span>` : ""}</div><button class="note-button ${done?.note || done?.photo || done?.detail ? "has-note" : ""}" data-action="${done?.note || done?.photo || done?.detail ? "check-view" : "check-note"}" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${t(done?.note ? "growth.editNote" : "growth.addNote")} ${esc(habit.title)}">${icon(done?.photo ? "photo" : "pen")}<span>${t(done?.note || done?.photo || done?.detail ? "growth.noteShort" : "growth.addShort")}</span></button><button class="check-button ${done ? "done" : ""}" data-action="check" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${t(done ? "habit.cancel" : "habit.complete")} ${esc(habit.title)}" aria-pressed="${Boolean(done)}">${done ? icon("check") : ""}</button></div>`;
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

// Home's today card: swipe through what was kept today — every photo put on
// today's pages (one slide each, with its page's line), and the pages that
// are only words — with a dot for each. Tapping one opens the day at that page.
function todayPeekHTML(entry) {
  const pages = [...(hasDayPageContent(entry) ? [entry] : []), ...(entry.moments || [])];
  const date = entry.date || dateKey();
  // Privacy: Home can keep today's photos and words out of sight.
  if (privacyOn("hideToday") && pages.length)
    return `<div class="today-peek-wrap"><button class="today-preview hero-photo peek-slide peek-words peek-private" data-action="open-day" data-date="${esc(date)}" aria-label="${t("home.readToday")}"><span class="peek-paper" aria-hidden="true"></span><span class="today-preview-copy"><b>${t("privacy.hiddenTitle", { count: pages.length })}</b><small>${t("privacy.hiddenHint")}</small></span><span class="today-preview-go hero-go">${t("home.open")} ›</span></button></div>`;
  const isPhoto = (ref) => /^(photo|media):/.test(String(ref || ""));
  const seen = new Set();
  const slides = [];
  for (const p of pages) {
    const layers = p.layers || [];
    const texts = layers.filter((l) => l.kind === "text" && !l.bind && !l.gen && String(l.text || "").trim()).map((l) => String(l.text).trim());
    const title = (p.title || texts[0] || "").trim();
    const words = (p.body || texts.find((x) => x !== title) || "").replace(/\s+/g, " ").trim();
    // Copies on the day spread (gen) are the same photos as the pages': once.
    const refs = [
      ...(isPhoto(p.backdrop) ? [p.backdrop] : []),
      ...(p === entry && entry.photo ? [entry.photo] : []),
      ...layers.filter((l) => l.kind === "photo" && l.mediaRef && !l.drawing && !l.gen).map((l) => l.mediaRef),
    ].filter((ref) => ref && !seen.has(ref) && seen.add(ref));
    // The page's own fonts, so the card reads like the page (V7.6).
    const base = { page: p, title, time: p === entry ? "" : p.time || "", titleFont: fontFamily(p.font || "serif", catalog), bodyFont: fontFamily(p.bodyFont || p.font || "serif", catalog) };
    if (refs.length) refs.forEach((ref, i) => slides.push({ ...base, ref, words: i ? "" : words }));
    else if (title || words) slides.push({ ...base, ref: "", words });
  }
  const shown = slides.slice(0, 12);
  if (!shown.length) return "";
  const n = shown.length;
  const html = shown.map((slide, i) => {
    const src = slide.ref ? safePhoto(slide.ref) : "";
    const kicker = [t("home.today"), n > 1 ? `${i + 1} / ${n}` : "", slide.time, entry.isDemo ? t("home.sample") : ""].filter(Boolean).join(" · ");
    const cls = `${i === 0 ? "today-preview " : ""}hero-photo peek-slide${src ? "" : " peek-words"}`;
    const moment = slide.page === entry ? "" : ` data-moment="${esc(slide.page.id)}"`;
    return `<button class="${cls}" data-action="open-day" data-date="${esc(date)}"${moment} aria-label="${t("home.readToday")} ${i + 1}/${n}">${src ? `<img src="${esc(src)}" alt="${t("photo.alt")}" loading="${i ? "lazy" : "eager"}"><span class="hero-shade" aria-hidden="true"></span>` : `<span class="peek-paper" aria-hidden="true"></span>`}<span class="today-preview-copy"><small class="hero-kicker">${esc(kicker)}</small><b style="font-family:${esc(slide.titleFont)}">${esc(slide.title || t("entry.untitled"))}</b>${slide.words ? `<small class="peek-words-text" style="font-family:${esc(slide.bodyFont)}">${esc(slide.words.slice(0, src ? 60 : 140))}</small>` : ""}</span><span class="today-preview-go hero-go">${t("home.open")} ›</span></button>`;
  });
  const dots = n > 1 ? `<div class="peek-dots" aria-hidden="true">${shown.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : "";
  return `<div class="today-peek-wrap"><div class="today-peek" role="group" aria-label="${t("home.readToday")}">${html.join("")}</div>${dots}</div>`;
}
// The dot under today's card follows the page in view.
document.addEventListener(
  "scroll",
  (event) => {
    const strip = event.target;
    if (!strip?.classList?.contains("today-peek")) return;
    const step = (strip.firstElementChild?.offsetWidth || strip.clientWidth) + 10;
    const index = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4 ? strip.children.length - 1 : Math.round(strip.scrollLeft / Math.max(1, step));
    strip.parentElement?.querySelectorAll(".peek-dots i").forEach((dot, i) => dot.classList.toggle("on", i === index));
  },
  true,
);

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
  const peek = entry ? todayPeekHTML(entry) : "";
  if (peek) hero = peek;
  else if (entry) {
    const backdrop = photo || (scene ? safePhoto(`photo:${scene.id}`) : "");
    const kicker = [t("home.today"), moments.length ? t("day.statMoments", { count: moments.length }) : "", entry.isDemo ? t("home.sample") : ""].filter(Boolean).join(" · ");
    hero = `<button class="today-preview hero-photo" data-action="open-day" data-date="${dateKey()}" aria-label="${t("home.readToday")}">${backdrop ? `<img src="${esc(backdrop)}" alt="${t("photo.alt")}">` : ""}<span class="hero-shade" aria-hidden="true"></span><span class="today-preview-copy"><small class="hero-kicker">${esc(kicker)}</small><b>${esc(entry.title || moments[0]?.title || t("entry.untitled"))}</b><small>${esc((entry.body || moments[0]?.body || "").replace(/\s+/g, " ").slice(0, 60))}</small></span><span class="today-preview-go hero-go">${t("home.open")} ›</span></button>`;
  } else if (scene)
    hero = `<button class="today-scene hero-photo" data-action="quick-open" data-way="photo" data-photo="today" data-scene="${esc(scene.id)}"><img src="${esc(safePhoto(`photo:${scene.id}`))}" alt=""><span class="hero-shade" aria-hidden="true"></span><span class="hero-copy-block"><small class="hero-kicker">${t("scene.ofDay")} · ${esc(sceneName(scene))}</small><b>${t("home.prompt")}</b><em>${t("scene.useIt")} ›</em></span></button>`;
  else hero = `<p class="today-blank">${t("home.blankBody")}</p>`;
  // The journals, in the same order as on the shelf: open one, or add a page
  // straight into it (a fitness, plants or family journal each keeps its own).
  const ourBooks = state().books.filter(isOurBook);
  const shown = homeBooks === "our" ? ourBooks : state().books;
  const books = `<section class="home-section home-books"><div class="section-heading"><div><h2>${t("home.books")}</h2><small>${t("home.booksHint")}</small></div><button data-action="nav" data-page="books">${t("home.shelf")} ›</button></div>${labsOn() ? `<div class="home-book-tabs" role="tablist"><button role="tab" data-action="home-books" data-view="mine" aria-selected="${homeBooks !== "our"}">${t("books.mine")}</button><button role="tab" data-action="home-books" data-view="our" aria-selected="${homeBooks === "our"}">${t("books.ours")}${ourBooks.length ? ` · ${ourBooks.length}` : ""}</button></div>` : ""}${homeBooks === "our" && !ourBooks.length ? `<p class="save-help our-empty">${t("books.oursEmpty")}</p>` : ""}<div class="home-book-row">${shown
    .map((book) => {
      const count = bookEntryCount(state(), book.id);
      return `<article class="home-book"><button class="home-book-cover" data-action="book" data-book="${esc(book.id)}" aria-label="${esc(book.title)}">${coverHTML(book, ctx())}</button><b>${esc(book.title)}</b><small>${esc(presetLabel("category", book.category))} · ${t("entry.count", { count })}</small><button class="home-book-write" data-action="book-write" data-book="${esc(book.id)}">${icon("plus")} ${t("home.writeIn")}</button></article>`;
    })
    .join("")}${homeBooks === "our" ? "" : `<button class="home-book-new" data-action="new-book">${icon("plus")}<span>${t("home.newBook")}</span></button>`}</div></section>`;
  return `<div class="home-mag"><header class="home-top"><div class="masthead"><div class="brand-title">Little Days<svg class="brand-sprout" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22v-9"/><path d="M12 13c-1-4-4-6-8-6 0 4 3 6 8 6Z"/><path d="M12 11c1-4 4-6 8-6 0 4-3 6-8 6Z"/></svg></div><p class="brand-tag">${t("home.tagline")}</p>${streakChipHTML()}</div><span class="home-actions"><button class="icon-button" data-action="open-search" aria-label="${t("search.open")}">${icon("search")}</button>${bell()}<button class="icon-button settings-gear" data-action="nav" data-page="settings" aria-label="${hasUnseen() ? t("news.dotLabel", { version: LATEST }) : t("settings")}">${icon("gear")}${hasUnseen() ? `<i class="news-dot" aria-hidden="true"></i>` : ""}</button></span></header>
 ${backupNudgeHTML()}<section class="hero today-card">${keeperPerchHTML()}<div class="story-start-card"><i class="nb-rings" aria-hidden="true"><b></b><b></b></i><div class="today-head">${greetingHTML(weekday, day)}<span class="today-date-chip">${icon("calendar")}${esc(new Date().toLocaleDateString(locale(), { month: "short", day: "numeric", weekday: "short" }))}</span></div>${keeperInviteHTML()}<h1 class="today-prompt">${t("story.prompt")}</h1><p>${t("story.promptHint")}</p><div class="story-start-row today-tiles"><button class="story-photos today-tile featured" data-action="today-photos">${tileArt("photo")}<b>${t("tile.photo")}</b></button><button class="today-tile" data-action="today-write" title="${t("story.justWriteHint")}">${tileArt("write")}<b>${t("story.justWrite")}</b></button><button class="today-tile" data-action="today-draw">${tileArt("draw")}<b>${t("tile.draw")}</b></button><button class="today-tile moment-cta" data-action="quick-open" data-photo="">${tileArt("more")}<b>${t("tile.more")}</b></button></div><small>${t("story.noSetup")}</small><button class="text-button backfill-link" data-action="backfill" data-date="${addDays(dateKey(), -1)}">${t("story.backfill")} ›</button></div>${todayListHTML()}${hero}</section>${memoryHTML()}
 ${books}<p class="home-quote">Collect moments, grow gently.</p></div>`;
}
// ---------- Today: habits and (Labs) things to do, on Home ----------
// Growth merged into the day (V6.6): check a habit with one tap here; what
// was done shows on that day's page as "today's list"; the habit book on the
// shelf keeps the journey, stats and reflections.
const MAX_PLANS = 8;
function plansOf(date) {
  return (state().plans?.[date] || []).filter((p) => p && typeof p.text === "string");
}
function todayListHTML() {
  const today = dateKey();
  const habits = state().habits;
  const done = state().checks.filter((check) => check.date === today).length;
  const items = plansOf(today);
  const yesterday = plansOf(addDays(today, -1)).filter((p) => !p.done);
  const list = items.length
    ? `<ul>${items
        .map((p) => `<li class="${p.done ? "done" : ""}"><button class="plan-check" data-action="plan-toggle" data-plan="${esc(p.id)}" aria-pressed="${p.done}" aria-label="${esc(p.text)}">${p.done ? "✓" : ""}</button><span>${esc(p.text)}</span><button class="plan-remove" data-action="plan-remove" data-plan="${esc(p.id)}" aria-label="${t("plan.remove")}">×</button></li>`)
        .join("")}</ul>`
    : "";
  const add = items.length < MAX_PLANS ? `<div class="plan-add"><input type="text" maxlength="60" data-plan-input placeholder="${t("plan.placeholder")}" aria-label="${t("plan.placeholder")}"><button data-action="plan-add">${t("plan.add")}</button></div>` : "";
  const carry = yesterday.length && !items.length ? `<button class="text-button plan-carry" data-action="plan-carry">${t("plan.carry", { count: yesterday.length })}</button>` : "";
  // Habits live in "My habits" on the shelf; Home keeps one line to them.
  const habitsLink = `<button class="today-habits-link" data-action="nav" data-page="growth"><span>${t("habits.book")}</span><small>${habits.length ? t("home.completed", { done, total: habits.length }) : t("habits.none")}</small><i aria-hidden="true">›</i></button>`;
  return `<section class="today-list today-planner" aria-label="${t("plan.title")}"><div class="section-heading"><div><h2>${t("plan.title")}</h2><small>${t("plan.hint")}</small></div></div><div class="today-plans${items.length ? "" : " empty"}">${list}${add}${carry}</div>${habitsLink}</section>`;
}
function savePlans(date, change) {
  store.update((next) => {
    next.plans ||= {};
    const list = (next.plans[date] ||= []);
    change(list);
    next.plans[date] = list.slice(0, MAX_PLANS);
    if (!next.plans[date].length) delete next.plans[date];
  });
  render();
}
function addPlan() {
  const input = document.querySelector("[data-plan-input]");
  const text = (input?.value || "").trim().slice(0, 60);
  if (!text) return input?.focus();
  savePlans(dateKey(), (list) => list.length < MAX_PLANS && list.push({ id: id(), text, done: false }));
  logEvent("plan_add", {});
  document.querySelector("[data-plan-input]")?.focus();
}
// The day's list: the habits checked and the things done that day (shown on
// the day page, the flip book and drawn under the page in exports).
function dayListItems(date) {
  return [
    ...state().checks.filter((c) => c.date === date).map((c) => state().habits.find((h) => h.id === c.habitId)?.title).filter(Boolean),
    ...plansOf(date).filter((p) => p.done).map((p) => p.text),
  ];
}
// The shelf's habit book: a cover that opens the growth journey.
function habitBookHTML() {
  const habits = state().habits;
  const week = state().checks.filter((c) => c.date >= weekStart(dateKey())).length;
  return `<button class="habit-book shelf-habit-book" data-action="nav" data-page="growth"><span class="habit-book-cover" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 19c9 0 14-6 14-14C10 5 5 10 5 19zM5 19c3-5 6-8 10-10"/></svg><i>My Habits</i></span><span class="habit-book-copy"><b>${t("habits.book")}</b><small>${t("habits.bookCount", { count: habits.length, week })}</small><small>${t("habits.bookHint")}</small></span><em>${t("habits.open")} ›</em></button>`;
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
  const top = `<header class="page-top"><div><h1 class="page-title">${t("calendar.title")}</h1><p class="page-subtitle">${t("calendar.subtitle")}</p></div><span class="page-top-actions"><button class="icon-button" data-action="open-search" aria-label="${t("search.open")}">${icon("search")}</button><button class="icon-button" data-action="calendar-today" aria-label="${t("calendar.today")}">${icon("calendar")}</button></span></header>`;
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
      return `<section class="growth-habit compact">${habitRow(h, today)}<div class="growth-habit-foot"><div class="week-dots" aria-label="${esc(t("growth.weekCount", { target: h.target, count }))}">${Array.from({ length: 7 }, (_, i) => `<span class="${state().checks.some((c) => c.habitId === h.id && c.date === addDays(start, i)) ? "complete" : ""}">${weekdays[i]}</span>`).join("")}</div><span class="growth-habit-count">${count}/${h.target}</span><button class="habit-more" data-action="habit-menu" data-habit="${esc(h.id)}" aria-label="${esc(t("habit.manage"))} · ${esc(h.title)}">✎ ${t("habit.manageShort")}</button><button class="journey-chip" data-action="habit-journey" data-habit="${esc(h.id)}" aria-label="${esc(t("journey.open"))} · ${esc(h.title)}">${t("journey.chip", { count: pages })} ›</button></div></section>`;
    })
    .join("");
  return `<header class="page-top"><div><button class="back-button" data-action="nav" data-page="books">${icon("back")} ${t("books.title")}</button><h1 class="page-title">${t("habits.book")}</h1><p class="page-subtitle">${t("growth.subtitle")}</p></div><button class="icon-button" data-action="new-habit" aria-label="${t("growth.add")}">${icon("plus")}</button></header>${summary}${cards || `<div class="empty">${t("growth.none")}<br><button class="primary" data-action="new-habit">${t("growth.new")}</button></div>`}${reflectionsHTML(today)}${checkHistoryHTML()}`;
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
// ---------- Read a book like a book: one page at a time ----------
// The cover first, then every page in date order; swipe, ‹ ›, or the arrow
// keys turn the page. The list view stays the other choice (remembered).
// ---------- Background music ----------
// Original soft loops a page can keep. They play while a day is read or a
// book is flipped (never while writing), one at a time.
const music = createMusicPlayer({ volume: loadVolume() });
let musicPaused = false,
  musicContext = "";
music.onChange(syncMusicChips);
function syncMusicChips() {
  const current = music.current(),
    playing = music.playing();
  document.querySelectorAll('[data-action="music-toggle"]').forEach((chip) => {
    const on = chip.dataset.music === current && playing;
    chip.classList.toggle("playing", on);
    chip.setAttribute("aria-pressed", String(on));
    const glyph = chip.querySelector("i");
    if (glyph) glyph.textContent = on ? "❚❚" : "▶";
  });
  document.querySelectorAll("[data-music-preview]").forEach((button) => {
    const on = button.dataset.musicPreview === current && playing;
    button.classList.toggle("playing", on);
    button.textContent = on ? "❚❚" : "▶";
    button.setAttribute("aria-label", t(on ? "music.stopPreview" : "music.preview"));
  });
}
function musicSheetOpen() {
  return Boolean(document.querySelector("#choose-dialog[open] .music-sheet"));
}
// What should be playing for the view on screen.
function syncMusic() {
  if (musicSheetOpen()) return;
  let wanted = "",
    keep = false,
    context = page;
  const books = state().books;
  if (page === "day") {
    const entry = state().entries.find((e) => e.date === selectedDate) || state().drafts[selectedDate];
    wanted = dayMusic(entry, books);
    context = `day:${selectedDate}`;
  } else if (page === "books" && selectedBook) {
    // The book's own music; a page that has its own plays that instead.
    wanted = bookMusic(books, selectedBook);
    if (bookView === "flip" && flipIndex > 0) {
      const turned = flipPages(selectedBook)[flipIndex - 1];
      wanted = (turned?.moment || turned?.entry)?.music || wanted;
      keep = true; // a page without music keeps what is playing going
    }
    context = `book:${selectedBook}`;
  }
  if (context !== musicContext) {
    musicContext = context;
    musicPaused = false;
  }
  const track = findTrack(catalog, wanted);
  if (track) {
    if (!musicPaused && music.current() !== track.id) music.play(track);
  } else if (!keep || !music.current()) music.stop();
  syncMusicChips();
}
function toggleMusic(id) {
  const track = findTrack(catalog, id);
  if (!track) return;
  if (music.current() === id && music.playing()) {
    music.pause();
    musicPaused = true;
    syncMusicChips();
  } else {
    musicPaused = false;
    music.play(track);
  }
}
// target "page" (the page being written) or "book" (the open book).
function openMusicSheet(target = "page") {
  const dialog = $("#choose-dialog");
  const book = target === "book" ? state().books.find((b) => b.id === selectedBook) : null;
  const chosen = (book ? book.music : activePage()?.music) || "";
  const rows = musicTracks(catalog)
    .map((track) => {
      const name = trackName(track, languageCode());
      const on = track.id === chosen;
      return `<li class="music-row ${on ? "chosen" : ""}"><button type="button" class="music-preview" data-action="music-preview" data-music="${esc(track.id)}" data-music-preview="${esc(track.id)}" aria-label="${t("music.preview")}">▶</button><span class="music-info"><b>${esc(name)}</b><small>${esc(trackMood(track, languageCode()))} · ${clock(track.seconds)}</small></span><button type="button" class="${on ? "secondary" : "primary"} music-pick" data-action="music-pick" data-music="${esc(track.id)}" ${on ? 'aria-current="true"' : ""}>${t(on ? "music.chosen" : "music.use")}</button></li>`;
    })
    .join("");
  const volume = Math.round(music.volume() * 100);
  dialog.innerHTML = `<div class="choose-sheet music-sheet" data-target="${target}"><div class="choose-grabber" aria-hidden="true"></div><h2>♫ ${t(book ? "music.bookTitle" : "music.title")}</h2><p class="save-help">${book ? t("music.bookHint", { name: esc(book.title) }) : t("music.hint")}</p><label class="music-volume"><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" step="5" value="${volume}" data-music-volume aria-label="${t("music.volume")}"><span aria-hidden="true">🔊</span><output>${volume}%</output></label><ul class="music-list">${rows}</ul><p class="music-note-line">${t("music.original")}</p>${chosen ? `<button class="text-button music-none" data-action="music-none">${t("music.none")}</button>` : ""}<button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
  if (!dialog.open) dialog.showModal();
  syncMusicChips();
}
function chooseMusic(id) {
  const track = findTrack(catalog, id);
  const forBook = document.querySelector(".music-sheet")?.dataset.target === "book";
  if (forBook) {
    store.update((next) => {
      const book = next.books.find((b) => b.id === selectedBook);
      if (!book) return;
      if (track) book.music = track.id;
      else delete book.music;
    });
    musicContext = ""; // play the new choice straight away
  } else
    changeTarget((p) => {
      if (track) p.music = track.id;
      else delete p.music;
    });
  music.stop();
  if ($("#choose-dialog")?.open) $("#choose-dialog").close();
  if (forBook) render();
  toast(track ? t(forBook ? "music.bookAdded" : "music.added", { name: trackName(track, languageCode()) }) : t(forBook ? "music.bookRemoved" : "music.removed"));
}
function bookMusicHTML(book) {
  const track = findTrack(catalog, book.music);
  return `<div class="book-music">${track ? musicChipHTML(track, ctx()) : `<span class="book-music-label">♫ ${t("music.bookTitle")}</span>`}<button type="button" class="text-button" data-action="music-sheet" data-target="book">${t(track ? "music.change" : "music.bookAdd")} ›</button></div>`;
}
function studioMusicHTML() {
  const track = findTrack(catalog, activePage()?.music);
  return track ? `<div class="studio-music"><button type="button" class="music-chip" data-action="music-sheet"><span class="music-note" aria-hidden="true">♫</span><span class="music-name">${esc(trackName(track, languageCode()))}</span><i aria-hidden="true">${t("music.change")}</i></button></div>` : "";
}

const BOOK_VIEW_KEY = "little-days.book-view";
// Privacy choices on this device (Settings → Privacy). Both start "private":
// the day's list stays out of exports and shared PDFs; Home may hide today.
const PRIVACY_KEYS = { shareList: "little-days.share-list", hideToday: "little-days.hide-today" };
function privacyOn(name) {
  try {
    return localStorage.getItem(PRIVACY_KEYS[name]) === "1";
  } catch {
    return false;
  }
}
function setPrivacy(name, on) {
  try {
    localStorage.setItem(PRIVACY_KEYS[name], on ? "1" : "0");
  } catch {}
}
// ---------- Hi, name — today is … (V7.7) ----------
function greetingHTML(weekday, day) {
  const name = (account?.name || "").trim();
  const text = name ? t("home.greeting", { name, weekday }) : t("home.greetingAnon", { weekday });
  return `<button class="home-greeting" data-action="greeting-name" aria-label="${t("home.greetingEdit")}"><span>${esc(text)}</span></button>`;
}
function openNameSheet() {
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet name-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("home.nameTitle")}</h2><p class="save-help">${t("home.nameHint")}</p><input class="name-input" data-greeting-name maxlength="20" autocomplete="nickname" value="${esc(account?.name || "")}" placeholder="${t("login.namePlaceholder")}"><button class="primary full-width" data-action="greeting-save">${t("save")}</button><button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector("[data-greeting-name]")?.focus();
}

// ---------- Little Keeper (V7.7) ----------
// An optional little companion who lives in the journal (js/keeper.mjs for
// the rules, js/keeper-art.mjs picks the picture: since V7.9 the approved
// 3D character art, as image assets — never redrawn in SVG/CSS). Off until chosen; existing
// journals only see one gentle invitation. Turning it off deletes nothing.
// Replies are made on this device; no secure AI service is connected, so
// nothing is ever sent (the service refuses a remote call without consent).
const keeperService = Keeper.createFeedbackService({ remote: null });
let keeperDraft = null; // the onboarding choices
let keeperLine = ""; // a line shown after a tap (not saved)
let keeperTaps = 0;
let keeperChat = []; // this sheet's lines only; never saved
const keeperNow = () => Keeper.normalizeKeeper(state().keeper);
function saveKeeper(change) {
  store.update((s) => {
    const k = Keeper.normalizeKeeper(s.keeper);
    change(k);
    s.keeper = k;
  });
}
function keeperGrowth() {
  const config = Keeper.keeperConfig(features);
  const { total, reasons } = Keeper.growthPoints(state(), keeperNow(), config);
  return { ...Keeper.stageFor(total, config), total, reasons };
}
function keeperArt(mood = "idle", { follow = true, cls = "" } = {}) {
  const k = keeperNow();
  const name = Keeper.keeperName(k, languageCode());
  return `<span class="keeper mood-${mood} ${cls}" ${follow ? "data-keeper-follow" : ""}>${keeperImage(catalog, { animal: k.animal, outfit: k.outfit, mood, label: name })}</span>`;
}
function keeperInviteHTML() {
  const k = keeperNow();
  if (k.enabled || k.invite === "dismissed") return "";
  return `<div class="keeper-invite"><span class="keeper" data-keeper-follow>${keeperImage(catalog, { animal: "cat", mood: "happy", label: "" })}</span><div><b>${t("keeper.invite.title")}</b><small>${t("keeper.invite.body")}</small><span class="keeper-invite-actions"><button class="secondary" data-action="keeper-onboard">${t("keeper.invite.yes")}</button><button class="text-button" data-action="keeper-invite-dismiss">${t("keeper.invite.later")}</button></span></div></div>`;
}
// Perched on the top edge of today's notebook card, paws over the edge.
function keeperPerchHTML() {
  const k = keeperNow();
  if (!k.enabled) return "";
  const name = Keeper.keeperName(k, languageCode());
  const growth = keeperGrowth();
  const grew = growth.index > k.lastStage;
  if (grew) setTimeout(() => saveKeeper((x) => (x.lastStage = growth.index)), 0);
  const memory = Keeper.modeAllows(k, "proactive") && Keeper.modeAllows(k, "memories") ? onThisDay(state(), dateKey())[0] : null;
  const prompt = Keeper.todayPrompt({ hour: new Date().getHours(), keptToday: keptToday(), keeper: k, memory });
  const line = grew ? t("keeper.grew", { stage: t("keeper.stage." + growth.id) }) : keeperLine || (prompt ? t(prompt.key, { ...prompt.values, name }) : "");
  const hour = new Date().getHours();
  const mood = grew ? "happy" : hour >= 22 || hour < 6 ? "sleepy" : "peek";
  return `<div class="keeper-home keeper-perch">${line ? `<p class="keeper-bubble" role="status"><b>${esc(name)}</b>${esc(line)}</p>` : ""}<button class="keeper-tap" data-action="keeper-tap" aria-label="${esc(t("keeper.tapLabel", { name }))}">${keeperArt(mood)}</button></div>`;
}
// Small soft illustrations for Home's four ways to start.
function tileArt(kind) {
  const art = {
    photo: `<rect x="9" y="11" width="30" height="27" rx="3" fill="#fff" stroke="#E2D6C3"/><rect x="12" y="14" width="24" height="17" rx="2" fill="#BFDCEB"/><circle cx="30" cy="19" r="3" fill="#F7D46A"/><path d="M12 31l7-8 6 6 4-3 7 5v0H12Z" fill="#8FB57E"/><rect x="18" y="8" width="12" height="5" rx="1" fill="#E9D9B8" opacity=".9"/>`,
    write: `<path d="M8 14q8-4 16 0v24q-8-4-16 0Z" fill="#FBF3E2" stroke="#D9C7A8"/><path d="M24 14q8-4 16 0v24q-8-4-16 0Z" fill="#FFF9EE" stroke="#D9C7A8"/><path d="M12 20h8M12 25h8M28 20h8M28 25h6" stroke="#CBB89A" stroke-width="1.4" stroke-linecap="round"/><rect x="31" y="4" width="5" height="26" rx="2" transform="rotate(35 33 17)" fill="#F2CD5C"/><rect x="31" y="2" width="5" height="5" rx="1.5" transform="rotate(35 33 17)" fill="#F1A7B5"/>`,
    draw: `<path d="M24 8c9 0 16 6 16 14 0 5-4 6-7 6-3 0-4 2-4 4 0 3-2 6-6 6-8 0-15-7-15-15S15 8 24 8Z" fill="#FFF1D6" stroke="#E2C9A0"/><circle cx="16" cy="18" r="3" fill="#F1A7B5"/><circle cx="24" cy="14" r="3" fill="#F7D46A"/><circle cx="32" cy="18" r="3" fill="#8FB57E"/><circle cx="17" cy="27" r="3" fill="#9EC6E0"/>`,
    more: `<path d="M24 8l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#F7D46A" stroke="#E5B93A"/><circle cx="36" cy="32" r="3.4" fill="#F1A7B5"/><circle cx="12" cy="34" r="2.6" fill="#8FB57E"/>`,
  }[kind];
  return `<svg class="tile-art" viewBox="0 0 48 44" aria-hidden="true">${art}</svg>`;
}
function keeperMiniHTML() {
  const k = keeperNow();
  return k.enabled ? `<span class="keeper-mini" aria-hidden="true">${keeperArt("idle", { follow: false })}</span>` : "";
}
// While typing on the paper, it writes quietly too.
document.addEventListener("focusin", (event) => {
  const mini = $(".keeper-mini");
  if (!mini || !event.target.closest?.("#journal-canvas, .write-card")) return;
  if (!mini.classList.contains("writing")) {
    mini.classList.add("writing");
    mini.innerHTML = keeperArt("quiet", { follow: false });
  }
});
document.addEventListener("focusout", () => {
  setTimeout(() => {
    const mini = $(".keeper-mini");
    if (!mini || document.activeElement?.closest?.("#journal-canvas, .write-card")) return;
    mini.classList.remove("writing");
    mini.innerHTML = keeperArt("idle", { follow: false });
  }, 0);
});
// After Save: a little stamp on the notebook (never covers anything to tap).
function keeperStamp() {
  if (!keeperNow().enabled) return;
  const stamp = document.createElement("div");
  stamp.className = "keeper-stamp";
  stamp.setAttribute("aria-hidden", "true");
  stamp.innerHTML = `${keeperArt("happy", { follow: false })}<i class="keeper-stamp-mark">✓</i>`;
  ($("#phone") || document.body).append(stamp);
  setTimeout(() => stamp.remove(), 2400);
}
function keeperAskHTML(date, momentId) {
  const k = keeperNow();
  if (!Keeper.modeAllows(k, "feedback")) return "";
  return `<button class="keeper-ask" data-action="keeper-feedback" data-date="${esc(date)}" data-moment="${esc(momentId)}"><span class="keeper-ask-art" aria-hidden="true">${keeperArt("encouraging", { follow: false })}</span>${t("keeper.ask", { name: Keeper.keeperName(k, languageCode()) })}</button>`;
}
function keeperShelfHTML(books) {
  const k = keeperNow();
  if (!k.enabled) return "";
  const line = keeperLine && page === "books" ? keeperLine : "";
  return `<div class="keeper-shelf"><button class="keeper-tap" data-action="keeper-shelf-tap" aria-label="${esc(t("keeper.tapLabel", { name: Keeper.keeperName(k, languageCode()) }))}">${keeperArt("idle")}</button>${line ? `<p class="keeper-bubble" role="status">${esc(line)}${Keeper.modeAllows(k, "chat") ? ` <button class="text-button" data-action="open-search">${t("keeper.shelf.find")} ›</button>` : ""}</p>` : ""}</div>`;
}
function pageWords(date, momentId) {
  const entry = state().entries.find((e) => e.date === date) || state().drafts[date];
  const page = momentId ? entry?.moments?.find((m) => m.id === momentId) : entry;
  if (!page) return "";
  return [page.title, page.body, ...(page.layers || []).filter((l) => l.kind === "text" && !l.gen).map((l) => l.text)].filter(Boolean).join("\n");
}
async function openKeeperFeedback(date, momentId) {
  const k = keeperNow();
  const name = Keeper.keeperName(k, languageCode());
  const reply = await keeperService.respond({ text: pageWords(date, momentId), language: languageCode(), seed: Math.floor(Math.random() * 1000) }, k);
  if (!reply) return;
  saveKeeper((x) => (x.recent = [...x.recent, ...(reply.used || [])].slice(-12)));
  logEvent("keeper_feedback", { kind: reply.source });
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet keeper-sheet"><div class="choose-grabber" aria-hidden="true"></div><div class="keeper-sheet-head">${keeperArt("encouraging")}<b>${esc(name)}</b></div><p class="keeper-reply">${esc(reply.text)}${reply.tone ? ` <span class="keeper-tone">${esc(reply.tone)}</span>` : ""}</p><p class="save-help keeper-local">🔒 ${t("keeper.localNote")}</p><button class="choose-cancel" data-action="choose-close">${t("keeper.thanks")}</button></div>`;
  if (!dialog.open) dialog.showModal();
}
function openKeeperChat() {
  const k = keeperNow();
  const name = Keeper.keeperName(k, languageCode());
  const growth = keeperGrowth();
  if (!keeperChat.length) keeperChat = [{ who: "keeper", text: t("keeper.chat.hello", { name }) }];
  const lines = keeperChat.map((m) => `<p class="keeper-msg ${m.who}">${esc(m.text)}${m.open ? ` <button class="text-button" data-action="open-day" data-date="${esc(m.open.date)}"${m.open.momentId ? ` data-moment="${esc(m.open.momentId)}"` : ""}>${t("keeper.chat.open")} ›</button>` : ""}</p>`).join("");
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet keeper-sheet keeper-chat"><div class="choose-grabber" aria-hidden="true"></div><div class="keeper-sheet-head">${keeperArt("idle")}<span><b>${esc(name)}</b><small>${esc(t("keeper.stage." + growth.id))}</small></span></div><div class="keeper-msgs" aria-live="polite">${lines}</div><div class="keeper-chips"><button data-action="keeper-chat" data-intent="memory">${t("keeper.chip.memory")}</button><button data-action="keeper-chat" data-intent="week">${t("keeper.chip.week")}</button><button data-action="keeper-chat" data-intent="shelf">${t("keeper.chip.shelf")}</button></div><div class="keeper-say"><input data-keeper-say maxlength="120" placeholder="${esc(t("keeper.chat.placeholder", { name }))}"><button class="secondary" data-action="keeper-say">${t("keeper.chat.send")}</button></div><p class="save-help keeper-local">🔒 ${t(Keeper.modeAllows(k, "memories") ? "keeper.chat.privacyOn" : "keeper.chat.privacyOff")}</p><button class="choose-cancel" data-action="choose-close">${t("close")}</button></div>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".keeper-msgs")?.lastElementChild?.scrollIntoView({ block: "nearest" });
}
function keeperAnswer(intent, said = "") {
  const k = keeperNow();
  if (said) keeperChat.push({ who: "me", text: said });
  else keeperChat.push({ who: "me", text: t("keeper.chip." + intent) });
  const answer = Keeper.localChat(said ? "hello" : intent, { state: state(), keeper: k, language: languageCode(), today: dateKey(), seed: Math.floor(Math.random() * 1000) });
  const values = { ...(answer.values || {}), name: Keeper.keeperName(k, languageCode()) };
  if (values.date) values.date = friendlyDate(values.date);
  keeperChat.push({ who: "keeper", text: t(said ? "keeper.chat.heard" : answer.key, values), open: answer.open || null });
  keeperChat = keeperChat.slice(-12);
  openKeeperChat();
}
function openKeeperOnboarding() {
  const k = keeperNow();
  keeperDraft ||= { animal: k.animal, name: k.name, mode: k.mode };
  const d = keeperDraft;
  const animals = Keeper.ANIMALS.map((a) => `<button class="keeper-choice ${d.animal === a ? "selected" : ""}" data-action="keeper-pick-animal" data-animal="${a}" aria-pressed="${d.animal === a}"><span class="keeper">${keeperImage(catalog, { animal: a, mood: d.animal === a ? "happy" : "idle", label: "" })}</span><b>${t("keeper.animal." + a)}</b><small>${t("keeper.animal." + a + "Hint")}</small></button>`).join("");
  const modes = Keeper.MODES.map((m) => `<button class="keeper-mode ${d.mode === m ? "selected" : ""}" data-action="keeper-pick-mode" data-mode="${m}" aria-pressed="${d.mode === m}"><b>${t("keeper.mode." + m)}</b><small>${t("keeper.mode." + m + "Hint")}</small></button>`).join("");
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet keeper-onboard"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("keeper.onboard.title")}</h2><p class="save-help">${t("keeper.onboard.body")}</p><h3>${t("keeper.onboard.animal")}</h3><div class="keeper-animals">${animals}</div><h3>${t("keeper.onboard.name")}</h3><input class="name-input" data-keeper-name maxlength="12" value="${esc(d.name)}" placeholder="${esc(Keeper.defaultName(d.animal, languageCode()))}"><h3>${t("keeper.onboard.mode")}</h3><div class="keeper-modes">${modes}</div><p class="save-help keeper-local">🔒 ${t("keeper.onboard.privacy")}</p><button class="primary full-width" data-action="keeper-start">${t("keeper.onboard.start")}</button><button class="choose-cancel" data-action="keeper-onboard-later">${t("keeper.invite.later")}</button></div>`;
  if (!dialog.open) dialog.showModal();
}
// Hats from the character art. Only the default hat has several expressions.
function keeperOutfitHTML(k) {
  const outfits = keeperOutfits(catalog, k.animal);
  if (outfits.length < 2) return "";
  const wearing = k.outfit || DEFAULT_OUTFIT[k.animal];
  const items = outfits.map((o) => `<button data-action="keeper-set" data-key="outfit" data-value="${o}" class="${wearing === o ? "selected" : ""}" aria-pressed="${wearing === o}"><span class="keeper">${keeperImage(catalog, { animal: k.animal, outfit: o, mood: "idle", label: "" })}</span><small>${t("keeper.outfit." + o)}</small></button>`).join("");
  return `<div class="keeper-seg"><span>${t("keeper.settings.outfit")}</span><div class="keeper-outfits">${items}</div><small class="keeper-mode-hint">${t("keeper.settings.outfitNote")}</small></div>`;
}
function keeperSettingsHTML() {
  const k = keeperNow();
  if (!k.enabled) return `<section class="settings-card keeper-card"><h2>Little Keeper</h2><p>${t("keeper.settings.offNote")}</p><button class="secondary" data-action="keeper-onboard">${t("keeper.invite.yes")}</button></section>`;
  const name = Keeper.keeperName(k, languageCode());
  const g = keeperGrowth();
  const config = Keeper.keeperConfig(features);
  const leaves = config.stages.map((_, i) => `<i class="${i <= g.index ? "on" : ""}"></i>`).join("");
  const row = (key, on, hint, enabled = true) => `<button class="privacy-row" data-action="keeper-toggle" data-key="${key}" role="switch" aria-checked="${on}" ${enabled ? "" : "disabled"}><span><b>${t("keeper.settings." + key)}</b><small>${hint}</small></span><i class="switch ${on ? "on" : ""}" aria-hidden="true"></i></button>`;
  const interactive = k.mode === "interactive";
  return `<section class="settings-card keeper-card"><h2>Little Keeper</h2><div class="keeper-profile">${keeperArt("idle")}<span><b>${esc(name)}</b><small>${esc(t("keeper.stage." + g.id))} · ${esc(t("keeper.settings.days", { count: g.reasons.days }))}</small><span class="keeper-leaves" aria-hidden="true">${leaves}</span></span></div><p class="save-help">${t("keeper.settings.growthNote")}</p><label class="keeper-name-edit">${t("keeper.onboard.name")}<input data-keeper-rename maxlength="12" value="${esc(k.name)}" placeholder="${esc(Keeper.defaultName(k.animal, languageCode()))}"></label><div class="keeper-seg"><span>${t("keeper.onboard.animal")}</span><div class="segmented">${Keeper.ANIMALS.map((a) => `<button data-action="keeper-set" data-key="animal" data-value="${a}" class="${k.animal === a ? "selected" : ""}" aria-pressed="${k.animal === a}">${t("keeper.animal." + a)}</button>`).join("")}</div></div>${keeperOutfitHTML(k)}<div class="keeper-seg"><span>${t("keeper.onboard.mode")}</span><div class="segmented">${Keeper.MODES.map((m) => `<button data-action="keeper-set" data-key="mode" data-value="${m}" class="${k.mode === m ? "selected" : ""}" aria-pressed="${k.mode === m}">${t("keeper.mode." + m)}</button>`).join("")}</div><small class="keeper-mode-hint">${t("keeper.mode." + k.mode + "Hint")}</small></div>${row("allowMemories", k.allowMemories, interactive ? t("keeper.settings.allowMemoriesHint") : t("keeper.settings.interactiveOnly"), interactive)}${row("proactive", k.proactive, interactive ? t("keeper.settings.proactiveHint") : t("keeper.settings.interactiveOnly"), interactive)}${row("aiConsent", false, t("keeper.settings.aiConsentHint"), false)}<button class="secondary keeper-off" data-action="keeper-disable">${t("keeper.settings.turnOff")}</button><p class="save-help">${t("keeper.settings.offKeeps")}</p></section>`;
}
document.addEventListener("change", (event) => {
  if (!event.target.matches?.("[data-keeper-rename]")) return;
  saveKeeper((k) => (k.name = event.target.value.trim().slice(0, 12)));
  render();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  if (event.target.matches?.("[data-keeper-say]")) {
    event.preventDefault();
    $('[data-action="keeper-say"]')?.click();
  }
  if (event.target.matches?.("[data-greeting-name]")) {
    event.preventDefault();
    $('[data-action="greeting-save"]')?.click();
  }
});
// The whole picture leans a little toward your finger or pointer.
let keeperFollowFrame = 0;
document.addEventListener("pointermove", (event) => {
  if (keeperFollowFrame) return;
  keeperFollowFrame = requestAnimationFrame(() => {
    keeperFollowFrame = 0;
    for (const el of document.querySelectorAll("[data-keeper-follow]")) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const dx = event.clientX - (r.left + r.width / 2), dy = event.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < 420;
      el.style.setProperty("--tilt", near ? `${Math.max(-3, Math.min(3, dx / 40))}deg` : "0deg");
    }
  });
});
let keeperBack = 0;
function keeperBounce(target) {
  const el = target.closest?.(".keeper-tap")?.querySelector(".keeper") || target.querySelector?.(".keeper");
  if (!el) return;
  el.classList.remove("boing");
  void el.offsetWidth;
  el.classList.add("boing");
  // A short happy / excited face from the character art, then back.
  const img = el.querySelector(".keeper-img");
  if (!img || img.dataset.mood === "peek") return;
  const k = keeperNow();
  const before = img.outerHTML;
  el.innerHTML = keeperImage(catalog, { animal: k.animal, outfit: k.outfit, mood: keeperTaps % 2 ? "excited" : "happy", label: img.alt });
  clearTimeout(keeperBack);
  keeperBack = setTimeout(() => el.isConnected && (el.innerHTML = before), 1600);
}

// ---------- Search and "On this day" (V7.6) ----------
let searchQuery = "";
let searchReturn = "home";
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Escaped text with the searched words marked.
function marked(text, words) {
  const safe = esc(text || "");
  if (!words.length) return safe;
  const pattern = new RegExp(`(${words.map((w) => escapeRegExp(esc(w))).join("|")})`, "gi");
  return safe.replace(pattern, "<mark>$1</mark>");
}
function searchResultsHTML() {
  const words = searchTerms(searchQuery);
  if (!words.length) return `<p class="search-hint">${t("search.hint")}</p>`;
  const { pages, books, total } = searchJournal(state(), searchQuery);
  if (!pages.length && !books.length) return `<p class="search-empty">${t("search.none", { query: esc(searchQuery.trim()) })}</p>`;
  const bookRows = books.length
    ? `<h3 class="search-group">${t("search.books")}</h3><div class="search-books">${books.map((book) => `<button data-action="book" data-book="${esc(book.id)}"><span class="search-book-cover">${coverHTML(book, ctx())}</span><span><b>${marked(book.title, words)}</b>${book.tags?.length ? `<small>${marked(book.tags.map((x) => "#" + x).join(" "), words)}</small>` : ""}</span></button>`).join("")}</div>`
    : "";
  const bookName = (id) => state().books.find((b) => b.id === id)?.title || "";
  const rows = pages
    .map((hit) => {
      const src = hit.photo ? safePhoto(hit.photo) : "";
      const when = [new Date(`${hit.date}T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "short", day: "numeric" }), hit.time, hit.kind === "list" ? "" : bookName(hit.bookId)].filter(Boolean).join(" · ");
      return `<button class="search-hit" data-action="open-day" data-date="${esc(hit.date)}"${hit.momentId ? ` data-moment="${esc(hit.momentId)}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : `<span class="search-hit-mark" aria-hidden="true">${hit.kind === "list" ? "✓" : "Aa"}</span>`}<span><small>${esc(when)}</small><b>${hit.title ? marked(hit.title, words) : esc(t(hit.kind === "list" ? "day.checklist" : "entry.untitled"))}</b>${hit.snippet && hit.snippet !== hit.title ? `<em>${marked(hit.snippet, words)}</em>` : ""}</span></button>`;
    })
    .join("");
  return `${bookRows}${pages.length ? `<h3 class="search-group">${t("search.pages", { count: total })}</h3>${rows}` : ""}`;
}
function searchPageHTML() {
  return `<section class="search-page"><header class="search-top"><button class="back-button" data-action="search-back">${icon("back")} ${t("back")}</button></header><label class="search-box">${icon("search")}<input type="search" data-search-input enterkeyhint="search" autocomplete="off" maxlength="60" placeholder="${t("search.placeholder")}" value="${esc(searchQuery)}" aria-label="${t("search.open")}"></label><div id="search-results" aria-live="polite">${searchResultsHTML()}</div></section>`;
}
function openSearch() {
  if (page !== "search") searchReturn = page;
  page = "search";
  render();
  $("#app-scroll").scrollTop = 0;
  $("[data-search-input]")?.focus();
}
document.addEventListener("input", (event) => {
  if (event.target.matches?.("[data-tag-search]")) {
    const q = event.target.value.trim().toLocaleLowerCase();
    for (const b of document.querySelectorAll(".shelf-tags-all button")) b.hidden = Boolean(q) && !b.dataset.tag.toLocaleLowerCase().includes(q);
    return;
  }
  if (!event.target.matches?.("[data-search-input]")) return;
  searchQuery = event.target.value;
  const box = $("#search-results");
  if (box) box.innerHTML = searchResultsHTML();
});
// "On this day": a day kept on this date in an earlier year (or, for a young
// journal, the same day last month). Hidden for today with ×, and with
// "Hide today on Home" on.
const MEMORY_DISMISS_KEY = "little-days.memory-dismissed";
function memoryHTML() {
  if (privacyOn("hideToday") || readKey(MEMORY_DISMISS_KEY) === dateKey()) return "";
  const [first, ...more] = onThisDay(state(), dateKey());
  if (!first) return "";
  const label = first.years ? t("memory.yearsAgo", { count: first.years }) : t("memory.monthAgo");
  const src = first.photo ? safePhoto(first.photo) : "";
  const others = more.length ? `<div class="memory-more">${more.slice(0, 4).map((m) => `<button data-action="open-day" data-date="${esc(m.date)}">${t("memory.yearsAgo", { count: m.years })}</button>`).join("")}</div>` : "";
  return `<section class="memory-card" aria-label="${esc(label)}"><div class="section-heading"><div><h2>${esc(label)}</h2><small>${esc(new Date(`${first.date}T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric", weekday: "short" }))}</small></div><button class="memory-close" data-action="memory-dismiss" aria-label="${t("memory.dismiss")}">×</button></div><button class="memory-open ${src ? "has-photo" : ""}" data-action="open-day" data-revisit="1" data-date="${esc(first.date)}"${first.momentId ? ` data-moment="${esc(first.momentId)}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}<span><b>${esc(first.title || t("entry.untitled"))}</b>${first.words ? `<small>${esc(first.words)}</small>` : ""}<i>${t("memory.open", { count: first.pages })} ›</i></span></button>${others}</section>`;
}
// ---------- A gentle daily reminder (V7.6) ----------
// The iPhone app schedules local notifications (nothing goes online): the
// next 14 days at the chosen time, skipping today once something is kept;
// refreshed whenever the app opens or a page is saved. Off in one tap, here
// or from the notification itself.
const REMINDER_KEY = "little-days.reminder";
const reminderBridge = () => window.webkit?.messageHandlers?.littleDaysReminder || null;
function readReminder() {
  try {
    const r = JSON.parse(localStorage.getItem(REMINDER_KEY) || "null");
    return { on: Boolean(r?.on), time: /^\d{2}:\d{2}$/.test(r?.time || "") ? r.time : "21:00" };
  } catch {
    return { on: false, time: "21:00" };
  }
}
let reminderNote = "";
function saveReminder(next) {
  writeKey(REMINDER_KEY, JSON.stringify(next));
  syncReminder();
}
function keptToday() {
  const today = state().entries.find((e) => e.date === dateKey()) || state().drafts[dateKey()];
  return Boolean(today && !today.isDemo && (hasDayPageContent(today) || today.moments?.some((m) => !m.isDemo)));
}
// Tell the iPhone app what to schedule (it does nothing on the Web).
function syncReminder() {
  const bridge = reminderBridge();
  if (!bridge) return;
  const { on, time } = readReminder();
  const [hour, minute] = time.split(":").map(Number);
  try {
    bridge.postMessage({ type: "schedule", on, hour, minute, skipToday: keptToday(), title: "Little Days", body: t("reminder.body"), offTitle: t("reminder.offAction") });
  } catch {}
}
// From the iPhone app: scheduling result, a tap on a reminder, or "turn off".
window.littleDaysReminderResult = (result) => {
  reminderNote = result?.ok === false ? t(result.reason === "denied" ? "reminder.denied" : "reminder.failed") : "";
  if (page === "settings") render();
};
window.littleDaysFromReminder = () => {
  if (isLocked()) return; // after unlocking, the sheet is one tap away
  if (page === "studio" || page === "story") return;
  openQuickRecord({});
};
window.littleDaysReminderTurnedOff = () => {
  saveReminder({ ...readReminder(), on: false });
  toast(t("reminder.turnedOff"));
  if (page === "settings") render();
};
function reminderSectionHTML() {
  const { on, time } = readReminder();
  const app = Boolean(reminderBridge());
  return `<section class="settings-card reminder-card"><h2>${t("reminder.title")}</h2><p>${t("reminder.note")}</p><button class="privacy-row" data-action="reminder-toggle" role="switch" aria-checked="${on && app}" ${app ? "" : "disabled"}><span><b>${t("reminder.toggle")}</b><small>${esc(t("reminder.preview", { body: t("reminder.body") }))}</small></span><i class="switch ${on && app ? "on" : ""}" aria-hidden="true"></i></button>${on && app ? `<label class="reminder-time">${t("reminder.at")}<input type="time" data-reminder-time value="${esc(time)}"></label>` : ""}${app ? "" : `<p class="reminder-web">${t("reminder.appOnly")}</p>`}${reminderNote ? `<p class="reminder-warn" role="status">${esc(reminderNote)}</p>` : ""}</section>`;
}
document.addEventListener("change", (event) => {
  if (!event.target.matches?.("[data-reminder-time]")) return;
  const time = event.target.value;
  if (/^\d{2}:\d{2}$/.test(time)) {
    saveReminder({ ...readReminder(), time });
    toast(t("reminder.setAt", { time }));
  }
});
// ---------- Backup reminder (V7.5) ----------
// Everything lives only on this device, so a backup is the only copy that
// survives a lost phone or a deleted app. A quiet nudge on Home once there is
// something worth keeping and no backup for two weeks; "later" waits a week.
const BACKUP_AT_KEY = "little-days.last-backup";
const BACKUP_SNOOZE_KEY = "little-days.backup-snooze";
const readKey = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};
const writeKey = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
function ownDays() {
  return state().entries.filter((e) => !e.isDemo && (hasDayPageContent(e) || e.moments?.some((m) => !m.isDemo))).length;
}
function backupDue() {
  const last = readKey(BACKUP_AT_KEY).slice(0, 10);
  const snooze = readKey(BACKUP_SNOOZE_KEY).slice(0, 10);
  if (snooze && snooze > dateKey()) return null;
  if (ownDays() < 3) return null;
  if (!last) return { days: null };
  const days = daysBetween(last, dateKey());
  return days >= 14 ? { days } : null;
}
function backupNudgeHTML() {
  const due = backupDue();
  if (!due) return "";
  const text = due.days == null ? t("backup.never", { count: ownDays() }) : t("backup.since", { days: due.days });
  return `<div class="backup-nudge" role="status"><span class="backup-nudge-text">${esc(text)}</span><button class="backup-nudge-go" data-action="backup">${t("backup.now")} ›</button><button class="backup-nudge-later" data-action="backup-later" aria-label="${t("backup.later")}">×</button></div>`;
}
function backupWhenHTML() {
  const last = readKey(BACKUP_AT_KEY).slice(0, 10);
  if (!last) return `<p class="backup-when">${t("backup.whenNever")}</p>`;
  const days = daysBetween(last, dateKey());
  return `<p class="backup-when">${t("backup.when", { date: friendlyDate(last), days })}</p>`;
}
function privacySectionHTML() {
  const row = (name) => {
    const on = privacyOn(name);
    return `<button class="privacy-row" data-action="privacy-toggle" data-privacy="${name}" role="switch" aria-checked="${on}"><span><b>${t("privacy." + name)}</b><small>${t("privacy." + name + "Hint")}</small></span><i class="switch ${on ? "on" : ""}" aria-hidden="true"></i></button>`;
  };
  return `<section class="settings-card privacy-card"><h2>${t("privacy.title")}</h2><ul class="privacy-facts"><li>${t("privacy.factDevice")}</li><li>${t("privacy.factPhotos")}</li><li>${t("privacy.factNothingSent")}</li><li>${t("privacy.factDemo")}</li></ul>${lockRowsHTML()}${row("hideToday")}${row("shareList")}</section>`;
}

/* ---------- App lock (V7.4): passcode, Face ID in the iPhone app ---------- */
// The passcode is kept only as a salted SHA-256 (js/app-lock.mjs). While
// locked, the page underneath is inert and covered by a top-layer dialog.
const LOCK_TRIES_KEY = "little-days.lock-tries"; // wrong tries survive a reload
const savedTries = (() => {
  try {
    const x = JSON.parse(localStorage.getItem(LOCK_TRIES_KEY) || "{}");
    return { failures: Number(x.failures) || 0, lastFailAt: Number(x.lastFailAt) || 0 };
  } catch {
    return { failures: 0, lastFailAt: 0 };
  }
})();
let lockUI = { mode: "", entry: "", first: "", ...savedTries, message: "", forgot: false };
function saveTries() {
  try {
    if (lockUI.failures) localStorage.setItem(LOCK_TRIES_KEY, JSON.stringify({ failures: lockUI.failures, lastFailAt: lockUI.lastFailAt }));
    else localStorage.removeItem(LOCK_TRIES_KEY);
  } catch {}
}
let hiddenAt = 0;
// "faceID" / "touchID" in the iPhone app (set by the shell at start), else "".
const shellBiometry = () => (window.webkit?.messageHandlers?.littleDaysLock ? window.littleDaysBiometry || document.documentElement.dataset.biometric || "" : "");
function lockRowsHTML() {
  const lock = AppLock.readLock();
  const bio = shellBiometry();
  const main = `<button class="privacy-row" data-action="lock-toggle" role="switch" aria-checked="${Boolean(lock)}"><span><b>${t("lock.title")}</b><small>${t(lock ? "lock.onHint" : "lock.offHint")}</small></span><i class="switch ${lock ? "on" : ""}" aria-hidden="true"></i></button>`;
  if (!lock) return main;
  const grace = `<div class="lock-grace"><span>${t("lock.after")}</span><div class="segmented">${AppLock.GRACE_CHOICES.map((sec) => `<button data-action="lock-grace" data-grace="${sec}" class="${lock.grace === sec ? "selected" : ""}" aria-pressed="${lock.grace === sec}">${t("lock.after" + sec)}</button>`).join("")}</div></div>`;
  const face = bio
    ? `<button class="privacy-row" data-action="lock-biometric" role="switch" aria-checked="${Boolean(lock.biometric)}"><span><b>${t(bio === "touchID" ? "lock.touchID" : "lock.faceID")}</b><small>${t("lock.biometricHint")}</small></span><i class="switch ${lock.biometric ? "on" : ""}" aria-hidden="true"></i></button>`
    : "";
  return `${main}${grace}${face}<button class="text-button lock-change" data-action="lock-change">${t("lock.change")}</button>`;
}
// Tell the iPhone app whether the lock is on (it then covers the app switcher).
function tellShellLock() {
  try {
    window.webkit?.messageHandlers?.littleDaysLock?.postMessage({ type: "state", on: Boolean(AppLock.readLock()) });
  } catch {}
}
function lockDialog() {
  let dialog = $("#lock-screen");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "lock-screen";
    dialog.className = "lock-screen";
    dialog.setAttribute("aria-labelledby", "lock-title");
    // Esc never skips the lock (only setting / changing it can be cancelled).
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (lockUI.mode !== "unlock") hideLock();
    });
    document.body.append(dialog);
  }
  return dialog;
}
// mode: unlock | set | confirm | off | change
function showLock(mode) {
  lockUI = { ...lockUI, mode, entry: "", first: mode === "confirm" ? lockUI.first : "", message: "", forgot: false };
  const dialog = lockDialog();
  renderLock();
  if (!dialog.open) dialog.showModal();
  $("#phone")?.setAttribute("inert", "");
  if (mode === "unlock" && AppLock.readLock()?.biometric && shellBiometry()) askBiometric();
}
function hideLock() {
  const dialog = $("#lock-screen");
  if (dialog?.open) dialog.close();
  $("#phone")?.removeAttribute("inert");
  lockUI = { ...lockUI, mode: "", entry: "", first: "", message: "", forgot: false };
}
const isLocked = () => lockUI.mode === "unlock" && Boolean($("#lock-screen")?.open);
function renderLock() {
  const dialog = lockDialog();
  const { mode, entry, message } = lockUI;
  const title = { unlock: "lock.enter", set: "lock.setNew", confirm: "lock.again", off: "lock.enterToOff", change: "lock.enterOld" }[mode] || "lock.enter";
  const pause = AppLock.pauseLeft(lockUI.failures, lockUI.lastFailAt);
  const dots = Array.from({ length: AppLock.PIN_LENGTH }, (_, i) => `<i class="${i < entry.length ? "on" : ""}"></i>`).join("");
  const bio = mode === "unlock" && AppLock.readLock()?.biometric && shellBiometry();
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", bio ? "bio" : "", "0", "back"]
    .map((k) => (k ? `<button type="button" data-lock-key="${k}" ${pause && /\d/.test(k) ? "disabled" : ""} aria-label="${k === "back" ? t("lock.delete") : k === "bio" ? t(shellBiometry() === "touchID" ? "lock.touchID" : "lock.faceID") : k}">${k === "back" ? "⌫" : k === "bio" ? t("lock.useBiometric") : k}</button>` : `<span></span>`))
    .join("");
  const foot =
    mode === "unlock"
      ? `<button type="button" class="text-button" data-lock-key="forgot">${t("lock.forgot")}</button>${lockUI.forgot ? `<p class="lock-forgot">${t("lock.forgotText")}</p>` : ""}`
      : `<button type="button" class="text-button" data-lock-key="cancel">${t("cancel")}</button>`;
  dialog.innerHTML = `<div class="lock-inner" tabindex="-1" autofocus><div class="brand-title lock-brand">Little Days</div><h2 id="lock-title">${t(title)}</h2><div class="lock-dots ${message ? "shake" : ""}" aria-hidden="true">${dots}</div><p class="lock-message" role="status">${esc(pause ? t("lock.pause", { seconds: pause }) : message)}</p><div class="lock-keys">${keys}</div>${foot}</div>`;
  if (pause) setTimeout(() => lockUI.mode && renderLock(), 1000);
}
function askBiometric() {
  try {
    window.webkit.messageHandlers.littleDaysLock.postMessage({ type: "unlock", reason: t("lock.biometricReason") });
  } catch {}
}
// Called by the iPhone app after Face ID / Touch ID.
window.littleDaysBiometricResult = (ok) => {
  if (ok && lockUI.mode === "unlock") hideLock();
};
function lockDigit(key) {
  if (AppLock.pauseLeft(lockUI.failures, lockUI.lastFailAt)) return;
  if (key === "back") lockUI.entry = lockUI.entry.slice(0, -1);
  else if (/^\d$/.test(key) && lockUI.entry.length < AppLock.PIN_LENGTH) lockUI.entry += key;
  lockUI.message = "";
  if (lockUI.entry.length < AppLock.PIN_LENGTH) return renderLock();
  const pin = lockUI.entry;
  const lock = AppLock.readLock();
  const mode = lockUI.mode;
  if (mode === "set") {
    lockUI.first = pin;
    return showLock("confirm");
  }
  if (mode === "confirm") {
    if (pin !== lockUI.first) {
      lockUI.first = "";
      showLock("set");
      lockUI.message = t("lock.mismatch");
      return renderLock();
    }
    AppLock.saveLock(AppLock.makeLock(pin, { grace: lock?.grace ?? 60, biometric: Boolean(shellBiometry()) && (lock ? lock.biometric : true) }));
    logEvent("lock_set", {});
    tellShellLock();
    hideLock();
    toast(t(lock ? "lock.changed" : "lock.turnedOn"));
    return render();
  }
  // unlock / off / change: the current passcode first.
  if (!AppLock.checkPin(lock, pin)) {
    // After a pause has run out, the next wrong try starts a fresh pause.
    if (lockUI.failures >= AppLock.MAX_TRIES) lockUI.failures = AppLock.MAX_TRIES - 1;
    lockUI.failures += 1;
    lockUI.lastFailAt = Date.now();
    saveTries();
    lockUI.entry = "";
    lockUI.message = t("lock.wrong");
    return renderLock();
  }
  lockUI.failures = 0;
  saveTries();
  if (mode === "unlock") return hideLock();
  if (mode === "change") return showLock("set");
  if (mode === "off") {
    AppLock.saveLock(null);
    logEvent("lock_off", {});
    tellShellLock();
    hideLock();
    toast(t("lock.turnedOff"));
    render();
  }
}
document.addEventListener("click", (event) => {
  const key = event.target.closest?.("#lock-screen [data-lock-key]")?.dataset.lockKey;
  if (!key) return;
  if (key === "cancel") return hideLock();
  if (key === "forgot") {
    lockUI.forgot = !lockUI.forgot;
    return renderLock();
  }
  if (key === "bio") return askBiometric();
  lockDigit(key);
});
document.addEventListener("keydown", (event) => {
  if (!$("#lock-screen")?.open) return;
  if (/^\d$/.test(event.key)) lockDigit(event.key);
  else if (event.key === "Backspace") lockDigit("back");
  else return;
  event.preventDefault();
});
// Away for a while (another app, the phone locked): lock again on return.
document.addEventListener("visibilitychange", () => {
  const lock = AppLock.readLock();
  if (!lock) return;
  if (document.visibilityState === "hidden") {
    hiddenAt = Date.now();
    // "Immediately": lock now, so the app switcher never shows the journal.
    if (lock.grace === 0 && !isLocked()) showLock("unlock");
  } else if (hiddenAt && !isLocked() && lockUI.mode !== "set" && lockUI.mode !== "confirm" && AppLock.shouldRelock(lock, (Date.now() - hiddenAt) / 1000)) showLock("unlock");
});
const chosenBookView = () => {
  try {
    return localStorage.getItem(BOOK_VIEW_KEY) === "flip" ? "flip" : "list";
  } catch {
    return "list";
  }
};
let bookView = chosenBookView();
let flipIndex = 0,
  flipTurn = 0,
  flipBookId = null;
function flipPages(bookId) {
  return bookSharePages(state(), bookId, { includeDemo: true });
}
function flipBookHTML(book) {
  const pages = flipPages(book.id);
  if (flipBookId !== book.id) {
    flipBookId = book.id;
    flipIndex = 0;
  }
  const total = pages.length + 1;
  flipIndex = Math.max(0, Math.min(total - 1, flipIndex));
  const range = dateRange(pages);
  const when = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric" });
  let body;
  if (flipIndex === 0)
    body = `<div class="flip-cover">${coverHTML(book, ctx())}<h3>${esc(book.title)}</h3>${book.description ? `<p>${esc(book.description)}</p>` : ""}<small>${range ? `${range.from === range.to ? when(range.from) : `${when(range.from)} – ${when(range.to)}`} · ` : ""}${t("bookShare.pages", { count: pages.length })}</small>${pages.length ? `<span class="flip-start">${t("flip.start")} ›</span>` : `<span class="save-help">${t("books.empty")}</span>`}</div>`;
  else {
    const { date, entry, moment } = pages[flipIndex - 1];
    // The day's list (habits checked, things done) on its first page.
    const firstOfDay = flipIndex === 1 || pages[flipIndex - 2].date !== date;
    const listed = firstOfDay ? dayListItems(date) : [];
    const checklist = listed.length ? `<p class="flip-checklist"><b>${t("day.checklist")}</b>${listed.map((x) => `<span>✓ ${esc(x)}</span>`).join("")}</p>` : "";
    const page = moment || entry;
    const demo = entry.isDemo || moment?.isDemo;
    body = `<header class="flip-head"><span>${esc(when(date))}${moment?.time ? ` · ${esc(moment.time)}` : ""}</span>${demo ? `<span class="badge">${t("entry.sample")}</span>` : ""}${musicChipHTML(findTrack(catalog, page.music || book.music), ctx())}</header>${page.title && !["line", "smart", "text"].includes(page.layoutTemplate) && moment ? `<h3 class="flip-title">${esc(page.title)}</h3>` : ""}<div class="flip-canvas">${sharedCanvasHTML(page, ctx(), { readOnly: true, dayPage: !moment })}</div>${checklist}<div class="flip-actions">${demo ? "" : `<button class="flip-edit" data-action="read-edit" data-date="${esc(date)}" data-moment="${esc(moment?.id || "")}">✎ ${t("read.edit")}</button>`}<button class="text-button flip-open" data-action="open-day" data-date="${esc(date)}">${t("flip.openDay")} ›</button></div>${demo ? "" : keeperAskHTML(date, moment?.id || "")}`;
  }
  const turn = flipTurn > 0 ? "turn-next" : flipTurn < 0 ? "turn-prev" : "";
  flipTurn = 0;
  return `<section class="flip-book" aria-roledescription="book"><div class="flip-stage" data-flip-stage><article class="flip-page ${flipIndex === 0 ? "is-cover" : ""} ${turn}" aria-live="polite">${body}</article></div><nav class="flip-nav" aria-label="${t("flip.label")}"><button data-action="flip" data-dir="-1" ${flipIndex === 0 ? "disabled" : ""} aria-label="${t("journey.prev")}">‹</button><span>${t("journey.pageOf", { page: flipIndex + 1, total })}</span><button data-action="flip" data-dir="1" ${flipIndex >= total - 1 ? "disabled" : ""} aria-label="${t("journey.next")}">›</button></nav><p class="save-help flip-hint">${t("flip.hint")}</p></section>`;
}
function turnPage(dir) {
  if (!selectedBook || bookView !== "flip" || !dir) return;
  const total = flipPages(selectedBook).length + 1;
  const next = Math.max(0, Math.min(total - 1, flipIndex + dir));
  if (next === flipIndex) return;
  flipIndex = next;
  flipTurn = dir;
  render();
}
// Swipe to turn (a mostly sideways move); arrow keys on a keyboard.
let flipSwipe = null;
document.addEventListener("pointerdown", (event) => {
  if (event.target.closest?.("[data-flip-stage]")) flipSwipe = { x: event.clientX, y: event.clientY };
});
document.addEventListener("pointerup", (event) => {
  if (!flipSwipe) return;
  const dx = event.clientX - flipSwipe.x,
    dy = event.clientY - flipSwipe.y;
  flipSwipe = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) turnPage(dx < 0 ? 1 : -1);
});
document.addEventListener("keydown", (event) => {
  if (page !== "books" || !selectedBook || bookView !== "flip" || event.target.closest?.("input, textarea, select, [contenteditable]")) return;
  if (event.key === "ArrowRight") turnPage(1);
  if (event.key === "ArrowLeft") turnPage(-1);
});
function booksPage() {
  if (selectedBook) {
    const book = state().books.find((b) => b.id === selectedBook),
      entries = bookPages(state(), selectedBook),
      days = bookDays(state(), selectedBook, bookFilter),
      months = bookMonths(state(), selectedBook);
    const filtered = bookFilter.month || bookFilter.date;
    return `<div class="section-heading"><button class="back-button" data-action="all-books">${icon("back")} ${t("books.all")}</button><button class="secondary" data-action="edit-book" data-book="${esc(book.id)}">${t("edit")}</button></div><div class="book-detail-showcase">${coverHTML(book, ctx())}</div><div class="book-detail-copy"><h2>${esc(book.title)}</h2><p>${esc(book.description || "")}</p>${book.tags?.length ? `<div class="book-tags">${book.tags.map((tag) => `<button data-action="shelf-tag" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join("")}</div>` : ""}<span class="badge">${t("private")} · ${t("entry.count", { count: entries.length })}</span></div>${labsOn() ? collabSectionHTML(social(), book, ctx(), collabOpen) : ""}<button class="primary full-width" data-action="book-new-entry">${icon("plus")} ${t("books.addPage")}</button><button class="secondary full-width book-share" data-action="book-share" data-book="${esc(book.id)}">${t("bookShare.button")}</button><p class="save-help book-share-help">${t("bookShare.help")}</p>${bookMusicHTML(book)}<div class="book-view-switch" role="tablist" aria-label="${t("flip.label")}"><button role="tab" data-action="book-view" data-view="list" aria-selected="${bookView !== "flip"}">${t("flip.list")}</button><button role="tab" data-action="book-view" data-view="flip" aria-selected="${bookView === "flip"}">${t("flip.flip")}</button></div>${bookView === "flip" ? flipBookHTML(book) : `<div class="book-filter"><p class="journal-list-caption">${t("books.memories")}</p><div class="book-filter-row"><select data-book-filter="month" aria-label="${t("books.month")}"><option value="">${t("books.allMonths")}</option>${months.map((m) => `<option value="${m}" ${bookFilter.month === m ? "selected" : ""}>${esc(new Date(`${m}-01T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long" }))}</option>`).join("")}</select><input type="date" data-book-filter="date" aria-label="${t("books.pickDate")}" value="${esc(bookFilter.date)}">${filtered ? `<button class="text-button" data-action="book-filter-clear">${t("books.clearFilter")}</button>` : ""}</div></div>${
      days.length
        ? `<div class="day-covers">${days.map(dayCoverHTML).join("")}</div>`
        : `<div class="empty">${t(filtered ? "books.noMatch" : "books.empty")}</div>`
    }`}`;
  }
  if (booksView === "profile")
    return `<header class="page-top"><div><button class="back-button" data-action="books-view" data-view="shelf">${icon("back")} ${t("books.title")}</button><h1 class="page-title">${t("me.title")}</h1><p class="page-subtitle">${t("me.subtitle")}</p></div>${bell()}</header><div class="demo-banner"><b>${t("community.demoLabel")}</b>${t("me.demoNote")}</div>${profileHTML(social(), communityView, ctx(), state().books, myExperience())}`;
  const ours = booksView === "our";
  const switcher = `<div class="shelf-switch" role="tablist" aria-label="${t("books.title")}"><button role="tab" data-action="books-view" data-view="shelf" aria-selected="${!ours}">${t("books.mine")}</button><button role="tab" data-action="books-view" data-view="our" aria-selected="${ours}">${t("books.ours")}</button></div>`;
  const all = ours ? state().books.filter(isOurBook) : state().books;
  // V7.6 book tags: filter the shelf by a tag.
  const tags = [...new Map(all.flatMap((b) => b.tags || []).map((tag) => [tag.toLocaleLowerCase(), tag])).values()];
  if (shelfTag && !tags.some((tag) => tag.toLocaleLowerCase() === shelfTag.toLocaleLowerCase())) shelfTag = "";
  const list = shelfTag ? all.filter((b) => (b.tags || []).some((tag) => tag.toLocaleLowerCase() === shelfTag.toLocaleLowerCase())) : all;
  // Many tags: the 3 most used (and the chosen one), the rest behind "More", with a search.
  const used = (tag) => all.filter((b) => (b.tags || []).some((x) => x.toLocaleLowerCase() === tag.toLocaleLowerCase())).length;
  const ranked = [...tags].sort((a, b) => used(b) - used(a) || tags.indexOf(a) - tags.indexOf(b));
  const top = ranked.slice(0, 3);
  if (shelfTag && !top.some((tag) => tag.toLocaleLowerCase() === shelfTag.toLocaleLowerCase())) top.push(ranked.find((tag) => tag.toLocaleLowerCase() === shelfTag.toLocaleLowerCase()));
  const chip = (tag) => `<button data-action="shelf-tag" data-tag="${esc(tag)}" aria-pressed="${shelfTag.toLocaleLowerCase() === tag.toLocaleLowerCase()}">#${esc(tag)}</button>`;
  const rest = ranked.filter((tag) => !top.includes(tag));
  const more = rest.length ? `<button class="shelf-tags-more" data-action="shelf-tags-more" aria-expanded="${shelfTagsOpen}">${t(shelfTagsOpen ? "books.tagsLess" : "books.tagsMore", { count: rest.length })}</button>` : "";
  const panel = rest.length && shelfTagsOpen ? `<div class="shelf-tags-panel"><input type="search" data-tag-search maxlength="20" placeholder="${t("books.tagsSearch")}" aria-label="${t("books.tagsSearch")}"><div class="shelf-tags-all">${rest.map(chip).join("")}</div></div>` : "";
  const tagRow = tags.length ? `<div class="shelf-tags" role="group" aria-label="${t("books.tags")}"><button data-action="shelf-tag" data-tag="" aria-pressed="${!shelfTag}">${t("books.allTags")}</button>${top.map(chip).join("")}${more}</div>${panel}` : "";
  return `<header class="page-top"><div><h1 class="page-title">${t("books.title")}</h1><p class="page-subtitle">${t("books.subtitle")}</p></div><span class="page-top-actions">${labsOn() ? `<button class="me-chip" data-action="books-view" data-view="profile" aria-label="${t("me.tab")}">${t("me.tab")} ›</button>` : ""}<button class="icon-button" data-action="new-book" aria-label="${t("books.new")}">${icon("plus")}</button></span></header>${labsOn() ? switcher : ""}${tagRow}${ours ? "" : keeperShelfHTML(all)}${ours && !list.length ? `<div class="empty our-empty">${t("books.oursEmpty")}</div>` : shelfHTML(list, !ours)}${ours ? "" : habitBookHTML()}${ours ? "" : suggestedBooksHTML()}<p class="home-quote">A home for every little story.</p>`;
}

// Books written together with friends (the collaborative demo): at least one
// friend has joined. Read only (nothing is created by asking).
let shelfTag = "";
let shelfTagsOpen = false;
function isOurBook(book) {
  return (social().collab?.[book.id]?.members || []).some((member) => member.status === "active");
}
// A bookshelf: spines stand on wooden planks; tap one to pull it out.
function shelfHTML(books = state().books, canAdd = true) {
  const pulled = books.find((book) => book.id === pulledBook);
  const spine = (book, index) => {
    const count = bookEntryCount(state(), book.id);
    // Magazine covers stand on the shelf as magazine spines: the cover photo
    // under a dark veil, the title in bold white, the issue number below.
    if (MAGAZINE_COVERS.includes(book.coverTemplate)) {
      const photo = safePhoto(coverPhotoRef(book, catalog));
      return `<button class="spine mag-spine h${index % 4} ${pulled?.id === book.id ? "pulled" : ""}" data-action="pull-book" data-book="${esc(book.id)}" aria-pressed="${pulled?.id === book.id}" aria-label="${esc(book.title)} · ${t("entry.count", { count })}" style="--spine:${coverColor(book, tokens)}">${photo ? `<img class="spine-photo" src="${esc(photo)}" alt="" loading="lazy">` : ""}<span class="spine-brand">LD</span><span class="spine-title ${/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(book.title || "") ? "" : "latin"}" style="--n:${Math.max(5, [...String(book.title || "")].length)}">${esc(book.title)}</span><small>NO.${String(count).padStart(2, "0")}</small></button>`;
    }
    const sticker = book.coverDecoration && book.coverDecoration !== "none" ? stickerURL(book.coverDecoration, catalog) : "";
    return `<button class="spine h${index % 4} ${pulled?.id === book.id ? "pulled" : ""}" data-action="pull-book" data-book="${esc(book.id)}" aria-pressed="${pulled?.id === book.id}" aria-label="${esc(book.title)} · ${t("entry.count", { count })}" style="--spine:${coverColor(book, tokens)};font-family:${esc(fontFamily(book.coverFont || "elegant", catalog))}">${sticker ? `<img src="${esc(sticker)}" alt="">` : "<i></i>"}<span class="spine-title">${esc(book.title)}</span><small>${count}</small></button>`;
  };
  const items = [...books.map(spine), ...(canAdd ? [`<button class="spine add" data-action="new-book" aria-label="${t("books.create")}"><span>＋</span></button>`] : [])];
  const rows = [];
  for (let i = 0; i < items.length; i += 5) rows.push(items.slice(i, i + 5));
  const stage = pulled
    ? (() => {
        const count = bookEntryCount(state(), pulled.id);
        const shown = Community.isShowcased(social(), pulled.id);
        return `<section class="pulled-book" aria-live="polite">${coverHTML(pulled, ctx())}<div class="pulled-copy"><small>${esc(presetLabel("category", pulled.category || ""))}</small><h2>${esc(pulled.title)}</h2>${pulled.description ? `<p>${esc(pulled.description)}</p>` : ""}<span class="badge">${shown ? `🖼 ${t("who.coverShown")}` : `🔒 ${t("private")}`} · ${t("entry.count", { count })}</span><div class="pulled-actions"><button class="primary" data-action="book" data-book="${esc(pulled.id)}">${t("shelf.open")} ›</button><button class="secondary" data-action="shelf-write" data-book="${esc(pulled.id)}">✎ ${t("shelf.write")}</button></div><div class="shelf-move" role="group" aria-label="${t("shelf.moveLabel")}"><button class="text-button" data-action="book-step" data-book="${esc(pulled.id)}" data-dir="-1" ${state().books[0]?.id === pulled.id ? "disabled" : ""}>‹ ${t("shelf.moveEarlier")}</button><button class="text-button" data-action="put-back">${t("shelf.putBack")}</button><button class="text-button" data-action="book-step" data-book="${esc(pulled.id)}" data-dir="1" ${state().books.at(-1)?.id === pulled.id ? "disabled" : ""}>${t("shelf.moveLater")} ›</button></div></div></section>`;
      })()
    : `<p class="shelf-hint">${t("shelf.hint")}</p>`;
  return `${stage}<div class="bookshelf">${rows.map((row) => `<div class="shelf-row"><div class="shelf-books">${row.join("")}</div><div class="shelf-plank"></div></div>`).join("")}</div>`;
}
// ---------- Drag a spine to reorder the shelf ----------
// Mouse / pen: press and move. Touch: hold a moment, then drag (a quick
// swipe still scrolls the page). Dropping puts the book before or after the
// spine under the finger; Home lists the books in the same order.
let shelfDrag = null;
function spineAt(x, y, except) {
  let best = null;
  for (const el of document.querySelectorAll(".bookshelf .spine[data-book]")) {
    if (el.dataset.book === except) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    const d = Math.hypot((x - cx) / Math.max(r.width, 1), ((y - cy) / Math.max(r.height, 1)) * 2.2);
    if (!best || d < best.d) best = { el, d, after: x > cx };
  }
  return best;
}
function startShelfDrag() {
  if (!shelfDrag || shelfDrag.active) return;
  shelfDrag.active = true;
  shelfDrag.el.classList.add("dragging");
  document.querySelector(".bookshelf")?.classList.add("reordering");
}
function endShelfDrag(drop) {
  const drag = shelfDrag;
  shelfDrag = null;
  if (!drag) return;
  clearTimeout(drag.timer);
  document.querySelectorAll(".bookshelf .drop-before, .bookshelf .drop-after").forEach((el) => el.classList.remove("drop-before", "drop-after"));
  document.querySelector(".bookshelf")?.classList.remove("reordering");
  drag.el.classList.remove("dragging");
  drag.el.style.transform = "";
  if (!drag.active) return;
  // The click that follows a drag must not pull the book out.
  suppressShelfUntil = Date.now() + 350;
  if (drop && drag.target) {
    let moved = false;
    store.update((next) => (moved = moveBookTo(next, drag.id, drag.target.id, drag.target.after)));
    if (moved) {
      logEvent("book_reorder", { kind: "drag" });
      toast(t("shelf.moved"));
    }
  }
  render();
}
let suppressShelfUntil = 0;
document.addEventListener(
  "click",
  (event) => {
    if (Date.now() < suppressShelfUntil && event.target.closest?.(".bookshelf")) {
      event.preventDefault();
      event.stopPropagation();
      suppressShelfUntil = 0;
    }
  },
  true,
);
document.addEventListener("pointerdown", (event) => {
  // A new press is a new gesture: only the click right after a drop is eaten.
  suppressShelfUntil = 0;
  const el = event.target.closest?.(".bookshelf .spine[data-book]");
  if (!el || page !== "books" || event.button > 0) return;
  shelfDrag = { id: el.dataset.book, el, x: event.clientX, y: event.clientY, pointerId: event.pointerId, touch: event.pointerType === "touch", active: false, target: null };
  // Touch: a short hold starts the drag, so swiping the page still scrolls.
  if (shelfDrag.touch) shelfDrag.timer = setTimeout(startShelfDrag, 280);
});
document.addEventListener("pointermove", (event) => {
  if (!shelfDrag || event.pointerId !== shelfDrag.pointerId) return;
  const dx = event.clientX - shelfDrag.x,
    dy = event.clientY - shelfDrag.y;
  if (!shelfDrag.active) {
    if (shelfDrag.touch) {
      // Moved before the hold finished: it is a scroll, not a drag.
      if (Math.hypot(dx, dy) > 8) endShelfDrag(false);
      return;
    }
    if (Math.hypot(dx, dy) < 6) return;
    startShelfDrag();
  }
  event.preventDefault();
  shelfDrag.el.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-8, Math.min(8, dx / 12))}deg) scale(1.06)`;
  const hit = spineAt(event.clientX, event.clientY, shelfDrag.id);
  document.querySelectorAll(".bookshelf .drop-before, .bookshelf .drop-after").forEach((el) => el.classList.remove("drop-before", "drop-after"));
  shelfDrag.target = hit ? { id: hit.el.dataset.book, after: hit.after } : null;
  if (hit) hit.el.classList.add(hit.after ? "drop-after" : "drop-before");
});
document.addEventListener("pointerup", (event) => {
  if (shelfDrag && event.pointerId === shelfDrag.pointerId) endShelfDrag(true);
});
document.addEventListener("pointercancel", (event) => {
  if (shelfDrag && event.pointerId === shelfDrag.pointerId) endShelfDrag(false);
});
// While a spine is held, the page must not scroll under the finger (iOS).
document.addEventListener(
  "touchmove",
  (event) => {
    if (shelfDrag?.active) event.preventDefault();
  },
  { passive: false },
);
function openProfile() {
  page = "books";
  booksView = "profile";
  selectedBook = null;
  communityView = { ...communityView, publish: null, workId: null, userId: null };
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
    layer.drawing
      ? b("draw-edit", `✎ ${t("draw.again")}`)
      : layer.kind === "photo" && layer.mediaRef
      ? b("photo-edit", `✨ ${t("pe.open")}`) + b("replace-photo", `↺ ${t("photo.replaceShort")}`)
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
  const photos = page.layers.filter(framedPhoto).length,
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
  // The cover sums up the day in one line (optional); each page keeps one
  // thing that happened. They sit side by side, cover first.
  const hasCover = hasDayPageContent(editor);
  const cover = `<button class="chapter-chip cover-chip ${activeMomentId ? "" : "active"} ${hasCover ? "" : "empty"}" data-action="select-moment" data-moment="" aria-pressed="${!activeMomentId}">${pageThumbHTML(editor, true)}<span class="chip-text"><small>${t("day.cover")}</small><b>${esc(editor.title || t("cover.empty"))}</b></span></button>`;
  return `<div class="strip-head"><span>${t("strip.summary", { count: moments.length })}</span>${moments.length ? `<button class="text-button" data-action="pages-manage">${t("pages.manageLong")}</button>` : ""}</div><nav class="chapter-chips page-strip" aria-label="${t("moment.title")}">${cover}<span class="strip-divider" aria-hidden="true"></span>${moments
    .map(
      (moment, index) =>
        `<span class="chapter-chip-wrap"><button class="chapter-chip ${moment.id === activeMomentId ? "active" : ""}" data-action="select-moment" data-moment="${esc(moment.id)}" aria-pressed="${moment.id === activeMomentId}">${pageThumbHTML(moment)}<span class="chip-text"><small>${t("moment.chapter", { number: String(index + 1).padStart(2, "0") })}${moment.time ? " · " + esc(moment.time) : ""}</small><b data-chapter-label="${esc(moment.id)}">${esc(moment.title || t("moment.untitled"))}</b></span>${badges(moment)}</button>${moment.id === activeMomentId ? `<button class="chip-delete" data-action="moment-delete" aria-label="${t("write.deleteStory")}">×</button>` : ""}</span>`,
    )
    .join("")}<button class="chapter-chip add" data-action="add-moment">＋ ${t("moment.addShort")}</button></nav>`;
}
// A small picture of a page for the strip and the "整理" sheet.
function pageThumbHTML(p, cover = false) {
  const framed = p.layers?.find((l) => framedPhoto(l) && l.mediaRef);
  const drawing = p.layers?.find((l) => l.drawing && l.mediaRef);
  const src = backdropOf(p, ctx())?.src || (cover ? safePhoto(p.photo) : "") || (framed ? safePhoto(framed.mediaRef) : "") || "";
  if (src) return `<span class="page-thumb" aria-hidden="true"><img src="${esc(src)}" alt=""></span>`;
  if (drawing) return `<span class="page-thumb drawn" aria-hidden="true"><img src="${esc(safePhoto(drawing.mediaRef))}" alt=""></span>`;
  return `<span class="page-thumb lines ${cover ? "cover" : ""}" aria-hidden="true"><i></i><i></i><i></i></span>`;
}
// 整理这一天: the cover and the pages in order — move up / down, delete.
function openPagesManage() {
  renderPagesManage();
  const dialog = $("#choose-dialog");
  if (!dialog.open) dialog.showModal();
}
function renderPagesManage() {
  const moments = editor.moments || [];
  const book = (id) => state().books.find((b) => b.id === id)?.title || "";
  const hasCover = hasDayPageContent(editor);
  $("#choose-dialog").innerHTML = `<div class="choose-sheet pages-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("pages.title")}</h2><p class="save-help">${t("pages.help")}</p><ul class="pages-list"><li class="pages-row cover-row">${pageThumbHTML(editor, true)}<button class="pages-open" data-action="pages-open" data-moment=""><small>${t("day.cover")}</small><b>${esc(editor.title || t("cover.empty"))}</b></button>${hasCover ? `<button class="pages-del" data-action="day-page-clear">${t("pages.clearCover")}</button>` : ""}</li>${moments
    .map(
      (m, i) =>
        `<li class="pages-row">${pageThumbHTML(m)}<button class="pages-open" data-action="pages-open" data-moment="${esc(m.id)}"><small>${t("moment.chapter", { number: String(i + 1).padStart(2, "0") })}${m.time ? " · " + esc(m.time) : ""}${book(m.bookId) ? " · " + esc(book(m.bookId)) : ""}</small><b>${esc(m.title || t("moment.untitled"))}</b></button><span class="pages-move"><button data-action="page-move" data-moment="${esc(m.id)}" data-dir="-1" aria-label="${t("pages.up")}" ${i ? "" : "disabled"}>↑</button><button data-action="page-move" data-moment="${esc(m.id)}" data-dir="1" aria-label="${t("pages.down")}" ${i < moments.length - 1 ? "" : "disabled"}>↓</button></span><button class="pages-del" data-action="page-remove" data-moment="${esc(m.id)}" aria-label="${t("write.deleteStory")}">${t("delete")}</button></li>`,
    )
    .join("")}</ul><button class="primary full-width" data-action="choose-close">${t("pages.done")}</button></div>`;
}
async function removePage(momentId) {
  const moment = findMoment(editor, momentId);
  if (!moment) return;
  if (hasMomentContent(moment) && !(await askConfirm(t("moment.deleteConfirm")))) return;
  changeEditor((entry) => removeMoment(entry, momentId), false);
  if (activeMomentId === momentId || !findMoment(editor, activeMomentId))
    activeMomentId = !hasDayPageContent(editor) && editor.moments.length ? editor.moments.at(-1).id : null;
  selectedLayer = null;
  render();
  toast(t("moment.deleted"));
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
  const filled = page.layers.filter((layer) => framedPhoto(layer) && layer.mediaRef).length +
    (isDayPage() && editor.photo ? 1 : 0);
  const slots = page.layers.filter(framedPhoto).length;
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
  const smart = filled ? `<button class="smart-option ${page.layoutTemplate === "smart" && !page.layoutEdited ? "selected" : ""}" data-action="apply-smart"><b>${t("layout.smart")}</b><small>${t("layout.smartHint")}</small></button>` : "";
  return `${smart}<span class="small-label">${t("layout.step1")}</span><div class="count-options">${counts}</div><span class="small-label">${t("layout.step2")}</span><div class="layout-options">${options}</div><p class="save-help">${t(count === 0 ? "layout.textHelp" : "layout.slotHelp")}</p>`;
}
// Writing comes first: the words of this page are always open under the
// preview; styling lives in the menu below ("装饰这一页").
// ---------- Typing right on the paper ----------
// Two ways to make a story page: 随手写 (a note: the title and words are on the
// paper, tap and type) and 自由排版 (photos, text boxes and stickers placed
// freely; the boxes below the paper are its name and a caption).
function pageModeOf(page = activePage()) {
  return page.layoutTemplate === "text" ? "note" : ["line", "smart"].includes(page.layoutTemplate) ? "line" : "layout";
}
function pageModeHTML() {
  if (isDayPage()) return "";
  const mode = pageModeOf();
  const b = (id, glyph) =>
    `<button data-action="page-mode" data-mode="${id}" class="${mode === id ? "selected" : ""}" aria-pressed="${mode === id}">${glyph}<span>${t("mode." + id)}</span></button>`;
  return `<div class="page-mode three" role="group" aria-label="${t("mode.label")}">${b("line", icon("photo"))}${b("note", icon("pen"))}${b("layout", '<i class="mode-grid" aria-hidden="true"></i>')}<button class="page-draw" data-action="draw-new">${'<i class="draw-glyph draw-pen" aria-hidden="true"></i>'}<span>${t("draw.short")}</span></button></div>`;
}
// One line above the paper: which journal this page goes into, its time, and
// deleting it (a story) or removing the day page.
function pageBarHTML() {
  const options = (current) => state().books.map((b) => `<option value="${esc(b.id)}" ${current === b.id ? "selected" : ""}>${esc(b.title)}</option>`).join("");
  if (isDayPage())
    return `<p class="cover-hint">${t("cover.hint")}</p><div class="page-bar"><label class="write-book">${t("write.inBook")}<select data-day-book aria-label="${t("write.inBook")}">${options(editor.bookId)}</select></label>${hasDayPageContent(editor) ? `<button class="write-delete" data-action="day-page-clear">${t("write.clearDay")}</button>` : ""}</div>`;
  const page = activePage();
  return `<div class="page-bar"><label class="write-book">${t("write.inBook")}<select data-moment-field="bookId" aria-label="${t("write.inBook")}">${options(page.bookId || editor.bookId)}</select></label><input type="time" class="write-time" data-moment-field="time" value="${esc(page.time || "")}" aria-label="${t("moment.time")}"><button class="write-delete" data-action="moment-delete">${t("write.deleteStory")}</button></div>`;
}
// A note page becomes a free layout: what was written on the paper stays on
// it as text boxes (the title also stays the page's name in the contents).
function noteToLayout(page) {
  const fromSmart = page.layoutTemplate === "smart";
  page.layoutTemplate = null;
  if (fromSmart) {
    const line = (page.title || "").trim();
    if (line) page.layers.push({ id: id(), kind: "text", text: line.slice(0, 500), x: 50, y: 90, w: 84, scale: 1, rotation: 0, fontId: page.font || "serif", fontSize: 18, color: "#2F2A26", weight: 500, spacing: 0, align: "center" });
    page.layoutEdited = true;
    return;
  }
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
  const now = pageModeOf();
  if (now === mode) {
    if (mode === "note") focusInline(activePage().title ? "body" : "title");
    if (mode === "line") activePage().backdrop || activePage().layoutTemplate === "smart" ? focusInline("title") : openPhotoChooser("line");
    return;
  }
  changeTarget((p) => {
    if (p === editor) return;
    if (mode === "note") p.layoutTemplate = "text";
    else if (mode === "line") p.layoutTemplate = "line";
    else noteToLayout(p);
  });
  if (!quiet) toast(t("mode." + mode + "On"));
  if (mode === "note") focusInline(activePage().title ? "body" : "title");
  if (mode === "line") {
    // The photo is the page: pick one first when there is none yet.
    if (!activePage().backdrop) openPhotoChooser("line");
    else focusInline("title");
  }
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
// ---------- Type bar: tap words on the paper, change their look right there ----------
// Shown while a title, the words or a text box on the paper is being typed
// in. Buttons keep the caret where it is (no re-render): the change is made
// on the page and on the text on screen together, and it can be undone.
const TYPE_FONTS = [
  ["hei", "黑体", "Sans"],
  ["song", "宋体", "Serif"],
  ["kai", "楷体", "Kai"],
  ["zh-wenkai", "文楷", "WenKai"],
  ["zh-kuaile", "快乐体", "KuaiLe"],
  ["zh-xiaowei", "小薇", "XiaoWei"],
  ["handwritten", "Caveat", "Caveat"],
];
const TYPE_COLORS = ["#2B2622", "#6F675D", "#7D8E66", "#B5838D", "#6D8299", "#C08B5C"];
let typeTarget = null; // { kind: "title" | "body" | "layer", id? }
function typeBarHTML() {
  const en = languageCode() === "en";
  return `<div class="type-bar" id="type-bar" hidden role="toolbar" aria-label="${t("type.label")}"><div class="type-fonts">${TYPE_FONTS.map(([id, zh, enName]) => `<button type="button" data-type-font="${id}" style="font-family:${esc(fontFamily(id, catalog))}">${en ? enName : zh}</button>`).join("")}</div><div class="type-row"><button type="button" data-type-size="-2" aria-label="${t("type.smaller")}">A−</button><button type="button" data-type-size="2" aria-label="${t("type.bigger")}">A+</button><span class="type-colors">${TYPE_COLORS.map((c) => `<button type="button" data-type-color="${c}" style="--swatch:${c}" aria-label="${c}"></button>`).join("")}</span></div></div>`;
}
function typeTargetOf(el) {
  if (!el?.closest?.("#journal-canvas")) return null;
  if (el.dataset.inlineLayer) return { kind: "layer", id: el.dataset.inlineLayer };
  if (el.dataset.inline === "title" || el.dataset.inline === "body") return { kind: el.dataset.inline };
  return null;
}
function syncTypeBar() {
  const bar = $("#type-bar");
  if (!bar || !typeTarget) return;
  const p = activePage();
  const layer = typeTarget.kind === "layer" ? p.layers.find((l) => l.id === typeTarget.id) : null;
  const font = layer ? layer.fontId || p.font : typeTarget.kind === "body" ? p.bodyFont || p.font : p.font;
  bar.querySelectorAll("[data-type-font]").forEach((b) => b.classList.toggle("selected", b.dataset.typeFont === (font || "serif")));
  const style = layer ? { color: layer.color } : typeTarget.kind === "title" ? p.textStyle : p.bodyStyle;
  bar.querySelectorAll("[data-type-color]").forEach((b) => b.classList.toggle("selected", (style?.color || "").toLowerCase() === b.dataset.typeColor.toLowerCase()));
}
document.addEventListener("focusin", (event) => {
  const target = typeTargetOf(event.target);
  const bar = $("#type-bar");
  if (!bar) return;
  if (target) {
    typeTarget = target;
    bar.hidden = false;
    syncTypeBar();
  }
});
document.addEventListener("focusout", (event) => {
  if (!typeTargetOf(event.target)) return;
  // Tapping the bar keeps the caret (see pointerdown below); anything else hides it.
  setTimeout(() => {
    if (!typeTargetOf(document.activeElement) && $("#type-bar")) {
      $("#type-bar").hidden = true;
      typeTarget = null;
    }
  }, 0);
});
document.addEventListener("pointerdown", (event) => {
  if (event.target.closest?.("#type-bar")) event.preventDefault();
});
document.addEventListener("click", (event) => {
  const button = event.target.closest?.("#type-bar button");
  if (!button || !typeTarget) return;
  const focused = document.activeElement;
  const p = activePage();
  const canvas = $("#journal-canvas");
  const width = canvas?.getBoundingClientRect().width || 1;
  const currentSize = (el) => (parseFloat(getComputedStyle(el).fontSize) / width) * 100 * 3.2;
  const layerEl = typeTarget.kind === "layer" ? canvas?.querySelector(`[data-layer="${CSS.escape(typeTarget.id)}"]`) : null;
  const textEl = typeTarget.kind === "layer" ? layerEl : canvas?.querySelector(`[data-inline="${typeTarget.kind}"]`);
  if (!textEl) return;
  if (button.dataset.typeFont) {
    const id = button.dataset.typeFont;
    inlineChange(() => {
      const page = activePage();
      if (typeTarget.kind === "layer") {
        const layer = page.layers.find((l) => l.id === typeTarget.id);
        if (layer) layer.fontId = id;
      } else if (typeTarget.kind === "body") page.bodyFont = id;
      else {
        // Only the title changes: the words keep the font they had.
        page.bodyFont ||= page.font || "serif";
        page.font = id;
      }
    });
    textEl.style.fontFamily = fontFamily(id, catalog);
  }
  if (button.dataset.typeSize) {
    const next = Math.round(Math.min(60, Math.max(10, currentSize(textEl) + Number(button.dataset.typeSize))));
    inlineChange(() => {
      const page = activePage();
      if (typeTarget.kind === "layer") {
        const layer = page.layers.find((l) => l.id === typeTarget.id);
        if (layer) layer.fontSize = next;
      } else if (typeTarget.kind === "title") page.textStyle = { ...(page.textStyle || {}), size: next };
      else page.bodyStyle = { ...(page.bodyStyle || {}), size: next };
    });
    textEl.style.fontSize = `${next / 3.2}cqw`;
  }
  if (button.dataset.typeColor) {
    const color = button.dataset.typeColor;
    inlineChange(() => {
      const page = activePage();
      if (typeTarget.kind === "layer") {
        const layer = page.layers.find((l) => l.id === typeTarget.id);
        if (layer) layer.color = color;
      } else if (typeTarget.kind === "title") page.textStyle = { ...(page.textStyle || {}), color };
      else page.bodyStyle = { ...(page.bodyStyle || {}), color };
    });
    textEl.style.color = color;
  }
  inlineTyping = false; // each tap on the bar is its own undo step
  syncTypeBar();
  if (focused && focused !== document.activeElement) focused.focus({ preventScroll: true });
});
function inlineChange(change) {
  if (!inlineTyping) {
    history.push(structuredClone(editor));
    if (history.length > 30) history.shift();
    future = [];
    inlineTyping = true;
    // The page is not re-drawn while typing (the caret stays), so turn the
    // undo button on here: typing on the paper can be undone at once.
    document.querySelectorAll('[data-action="undo"]').forEach((b) => (b.disabled = false));
    document.querySelectorAll('[data-action="redo"]').forEach((b) => (b.disabled = true));
  }
  change(editor);
  scheduleDraft();
}
function inlineInput(target) {
  const text = target.innerText.replace(/\n$/, "");
  if (target.dataset.inlineLayer) {
    const layerId = target.dataset.inlineLayer;
    inlineChange(() => {
      const page = activePage();
      const layer = page.layers.find((l) => l.id === layerId);
      if (!layer) return;
      if (layer.bind) {
        // Words bound to a Moment: edit the Moment itself (one source of truth).
        const source = layer.of ? findMoment(editor, layer.of) : page;
        if (source) source[layer.bind === "time" ? "time" : "title"] = text.slice(0, layer.bind === "time" ? 12 : 70);
      } else layer.text = text.slice(0, 500);
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
    if (label) label.textContent = moment.title || t("moment.untitled");
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
  // The cover's title and words are typed on the paper itself (V6.7): the
  // card that repeated them under the paper confused people, so it is gone.
  if (isDayPage()) return "";
  const index = editor.moments.indexOf(page);
  const head = `<div class="write-head"><b>${t("moment.chapter", { number: String(index + 1).padStart(2, "0") })}</b></div>`;
  const tags = `<input class="write-tags" data-moment-field="tags" maxlength="200" placeholder="${t("moment.tagsPlaceholder")}" value="${esc(page.tags.join(", "))}" aria-label="${t("moment.tags")}">`;
  // A note or a photo + one line page: the words are on the paper itself.
  if (["text", "line", "smart"].includes(page.layoutTemplate)) return "";
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
  );
  // Video and sound are added with 视频 / 声音 under the paper; the dock only
  // lists what this page already has (players, cover, record more).
  if (counts.videos || counts.audios || recorder || studioTool === "media")
    tools.push({
      id: "media",
      icon: "♫",
      label: "tool.media",
      value: counts.videos || counts.audios ? [counts.videos ? t("day.statVideos", { count: counts.videos }) : "", counts.audios ? t("day.statAudios", { count: counts.audios }) : ""].filter(Boolean).join(" · ") : t("tool.none"),
      body: () => mediaPanelHTML(page, ctx(), Boolean(recorder)),
    });
  if (checks.length)
    tools.push({
      id: "growth",
      icon: "🌱",
      label: "tool.growth",
      value: t("day.statGrowth", { count: checks.length }),
      body: () => growthPanelHTML(),
    });
  if (dayPage && book?.fields?.length)
    tools.push({
      id: "book",
      icon: "☑",
      label: "tool.fields",
      value: book.title,
      body: () => customFieldsHTML(book, editor, ctx()),
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
// 记一页: one quick way to start a page — pick the journal, with or without a
// photo (today's photo, or one from the album / library), then write.
const QUICK_BOOK_KEY = "little-days.quick-book";
function lastQuickBook() {
  try {
    const id = localStorage.getItem(QUICK_BOOK_KEY);
    return state().books.some((b) => b.id === id) ? id : "";
  } catch {
    return "";
  }
}
const QUICK_WAY_KEY = "little-days.quick-way";
const QUICK_WAYS = ["photo", "write", "draw"];
function lastQuickWay() {
  try {
    const way = localStorage.getItem(QUICK_WAY_KEY);
    return QUICK_WAYS.includes(way) ? way : "";
  } catch {
    return "";
  }
}
let quickOpenedAt = 0,
  quickTaps = 0;
function openQuickRecord({ way = "", photo = "", book = "", date = "" } = {}) {
  quickOpenedAt = Date.now();
  quickTaps = 0;
  logEvent("quick_open", { way });
  if ($("#choose-dialog")?.open) $("#choose-dialog").close();
  quick = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateKey(),
    book: state().books.some((b) => b.id === book) ? book : lastQuickBook() || todayEntry()?.bookId || state().books[0]?.id || "daily",
    way: QUICK_WAYS.includes(way) ? way : lastQuickWay() || "write",
    photo: photo || "mine",
  };
  renderQuickRecord();
  $("#choose-dialog").showModal();
}
function quickWayArt(way) {
  const scene = todayScene();
  if (way === "photo")
    return scene ? `<img src="${esc(safePhoto(`photo:${scene.id}`))}" alt=""><i class="way-line" aria-hidden="true"></i>` : `<span class="way-icon">${icon("photo")}</span>`;
  if (way === "write") return `<span class="way-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
  return `<svg class="way-squiggle" viewBox="0 0 64 48" aria-hidden="true"><path d="M6 34c8-20 16-22 20-10s10 14 16 0 12-14 16-6"/><circle cx="50" cy="12" r="5"/></svg>`;
}
function renderQuickRecord() {
  const scene = todayScene();
  const today = state().drafts[quick.date] || state().entries.find((e) => e.date === quick.date);
  const pages = today ? (hasDayPageContent(today) ? 1 : 0) + (today.moments?.length || 0) : 0;
  const way = (id) =>
    `<button class="quick-way way-${id} ${quick.way === id ? "selected" : ""}" data-action="quick-way" data-way="${id}" aria-pressed="${quick.way === id}"><span class="way-art">${quickWayArt(id)}</span><b>${t("way." + id)}</b><small>${t("way." + id + "Hint")}</small></button>`;
  const opt = (value, inner, label) =>
    `<button data-action="quick-photo" data-photo="${value}" class="${quick.photo === value ? "selected" : ""}" aria-pressed="${quick.photo === value}" aria-label="${esc(label)}">${inner}</button>`;
  const photos =
    quick.way === "photo"
      ? `<h3>${t("quick.photo")}</h3><div class="quick-photos">${opt("mine", `<span class="quick-none">${icon("photo")}</span><span>${t("quick.mine")}</span>`, t("quick.mine"))}${scene ? opt("today", `<img src="${esc(safePhoto(`photo:${scene.id}`))}" alt=""><span>${t("quick.today")}</span>`, t("quick.today")) : ""}${opt("pick", `<span class="quick-none">${icon("book")}</span><span>${t("quick.pick")}</span>`, t("quick.pick"))}</div>`
      : "";
  // 图库: the library right here — tap a photo, then write its line.
  const library =
    quick.way === "photo" && quick.photo === "pick"
      ? `<div class="quick-library" role="group" aria-label="${t("quick.pick")}">${libraryPhotos()
          .map((p) => `<button class="${quick.lib === p.id ? "selected" : ""}" data-action="quick-lib" data-photo-id="${esc(p.id)}" aria-pressed="${quick.lib === p.id}" aria-label="${esc(sceneName(p))}"><img src="${esc(safePhoto(`photo:${p.id}`))}" alt="" loading="lazy"></button>`)
          .join("")}</div>`
      : "";
  $("#choose-dialog").innerHTML = `<div class="choose-sheet quick-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${quick.date === dateKey() ? t("quick.title") : t("quick.titleDate", { date: friendlyDate(quick.date) })}</h2><div class="quick-ways" role="group" aria-label="${t("quick.title")}">${QUICK_WAYS.map(way).join("")}</div>${photos}${library}<h3>${t("quick.book")}</h3><div class="quick-books">${state()
    .books.map((book) => `<button data-action="quick-book" data-book="${esc(book.id)}" class="${quick.book === book.id ? "selected" : ""}" aria-pressed="${quick.book === book.id}">${coverHTML(book, ctx())}<span>${esc(book.title)}</span></button>`)
    .join("")}</div><button class="primary full-width quick-start" data-action="quick-start">${t(quick.way === "photo" && quick.photo === "mine" ? "quick.start.pick" : quick.way === "photo" && quick.photo === "pick" ? (quick.lib ? "quick.start.lib" : "quick.start.libPick") : "quick.start." + quick.way)}</button>${pages ? `<button class="quick-continue" data-action="quick-continue">${t("quick.continue", { count: pages })} ›</button>` : ""}<div class="quick-more"><span>${t("quick.more")}</span><button data-action="quick-more" data-more="layout">${t("mode.layout")}</button><button data-action="quick-more" data-more="video">${t("add.video")}</button><button data-action="quick-more" data-more="voice">${t("add.sound")}</button></div><button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
}
// Every record is a new page of today, in the chosen journal.
function startPage(book, date = dateKey()) {
  try {
    localStorage.setItem(QUICK_BOOK_KEY, book);
  } catch {}
  if ($("#choose-dialog")?.open) $("#choose-dialog").close();
  openStudio(date);
  addMomentNow();
  changeTarget((m) => {
    if (m !== editor) m.bookId = book;
  }, false);
  return state().books.find((b) => b.id === book)?.title || "";
}
let lastQuick = null; // the sheet's choices, to go back to them on cancel
async function startQuickRecord() {
  const { book, way, photo, date, lib } = quick;
  if (way === "photo" && photo === "pick" && !lib) return toast(t("quick.libFirst"));
  lastQuick = { ...quick };
  const scene = todayScene();
  try {
    localStorage.setItem(QUICK_WAY_KEY, way);
  } catch {}
  quick = null;
  if (way === "photo" && photo === "mine") {
    // My own photos: the picker opens over the page I'm on. Only when photos
    // are chosen does a page start, so Cancel leaves me where I was (Home, or
    // the sheet I came from) and no empty page is left behind.
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    chooseAttachment({ kind: "quick", book, date });
    return;
  }
  const name = startPage(book, date);
  if (way === "photo") {
    changeTarget((m) => {
      m.layoutTemplate = "line";
      if (photo === "today" && scene) m.backdrop = `photo:${scene.id}`;
    });
    if (photo === "today" && scene) focusInline("title");
    else if (photo === "pick" && lib) {
      // The library photo chosen in the sheet becomes the page.
      changeTarget((m) => {
        m.layoutTemplate = "line";
        m.backdrop = `photo:${lib}`;
      });
      focusInline("title");
    } else openPhotoChooser("line");
  } else if (way === "draw") {
    render();
    await drawOnPage();
  } else setPageMode("note", { quiet: true });
  toast(t("book.writingIn", { name }));
}
// ---------- Quick Create V2: today's story ----------
// Pick photos → they are grouped into Moments by when they were taken → a
// designed draft right away (a day spread when there are several Moments,
// plus one page per Moment), in one of three styles. Words are optional and
// added right in the preview; groups can be adjusted; "Customize" opens the
// same pages in the studio. Pages edited by hand are never re-laid-out
// without asking.
let story = null; // { date, book, style, step: preview|group, groups, selected, made, index }
function startStory(groups) {
  const empty = activeMomentId;
  const book = activePage()?.bookId || editor.bookId || "daily";
  if (empty && !hasMomentContent(findMoment(editor, empty) || {})) changeEditor((e) => removeMoment(e, empty), false);
  activeMomentId = null;
  quickResult = null;
  // Forgot yesterday? Photos taken on another day go to that day (only when
  // the photos themselves say when they were taken, and not in the future).
  let moved = "";
  const shotDay = photoDay(groups);
  if (shotDay && shotDay !== editor.date && editor.date === dateKey()) {
    flushDraft();
    openStudio(shotDay);
    moved = shotDay;
  }
  story = { date: editor.date, book, style: "editorial", step: "preview", groups, selected: null, made: null, index: 0 };
  page = "story";
  // No "a new page is open" note here: the story makes its own pages.
  clearTimeout(toastTimer);
  $("#toast").classList.remove("visible");
  logEvent("story_start", { photos: groups.reduce((n, g) => n + g.items.length, 0), moments: groups.length, otherDay: Boolean(moved) });
  makeStory();
  if (moved) toast(t("story.datedFromPhotos", { date: friendlyDate(moved) }));
}
// The day most photos were taken (EXIF only), if clearly one day (≥ 60%).
function photoDay(groups) {
  const days = new Map();
  let timed = 0;
  for (const g of groups)
    for (const item of g.items) {
      if (!item.exif || !Number.isFinite(item.time)) continue;
      const d = new Date(item.time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.set(key, (days.get(key) || 0) + 1);
      timed++;
    }
  if (!timed) return "";
  const [best, count] = [...days.entries()].sort((a, b) => b[1] - a[1])[0];
  return count / timed >= 0.6 && best <= dateKey() ? best : "";
}
// Put the story on another day (the date picker in the preview).
function moveStoryTo(date) {
  if (!story || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date === story.date || date > dateKey()) return render();
  undoStory();
  flushDraft();
  const keep = story;
  openStudio(date);
  story = keep;
  story.date = editor.date;
  page = "story";
  makeStory();
  logEvent("story_date", {});
}
const storyPhoto = (item) => safePhoto(item.reference);
function storyTimeLabel(group) {
  const part = partOfDay(group.start);
  return [clockLabel(group.start), part ? t("story.part." + part) : ""].filter(Boolean).join(" ") || t("story.noTime");
}
function storyPages() {
  const made = story?.made;
  if (!made) return [];
  const pages = made.cover ? [{ cover: true, page: editor, label: t("day.cover") }] : [];
  for (const momentId of made.ids) {
    const moment = findMoment(editor, momentId);
    if (moment) pages.push({ cover: false, page: moment, label: moment.time || t("story.page") });
  }
  return pages;
}
// The Moments a page shows: the whole day on the spread, else its own.
function storyMomentsOf(current) {
  if (!current) return [];
  return current.cover ? story.made.ids.map((momentId) => findMoment(editor, momentId)).filter(Boolean) : [current.page];
}
const visualLayers = (page) => page.layers.filter((l) => !l.gen && !l.deco && !l.drawing && ((l.kind === "photo" && l.mediaRef) || l.kind === "video"));
const layerAspect = (l) => l.aspect || (l.w && l.h ? (l.w / l.h) * 0.8 : 1);
// Lay out one page in the story's style (its own variant), replacing only
// what the engine made before; the user's own stickers / text stay.
function layoutStoryPage(target, isCover) {
  const style = styleOf(target.layoutStyle || story.style);
  const variant = Number(target.layoutVariant) || 0;
  const look = STYLE_LOOK[style];
  let result;
  if (isCover) {
    const moments = story.made.ids
      .map((momentId) => findMoment(target, momentId))
      .filter(Boolean)
      .map((m) => {
        const photos = visualLayers(m).filter((l) => l.kind === "photo");
        const hero = photos[heroIndex(photos.map((l) => ({ aspect: layerAspect(l) })))];
        return hero ? { id: m.id, time: m.time, title: m.title, photo: { reference: hero.mediaRef, name: hero.text, aspect: layerAspect(hero) } } : null;
      })
      .filter(Boolean);
    const date = new Date(`${story.date}T12:00:00`);
    result = layoutDay(moments, style, variant, {
      dateSmall: date.toLocaleDateString(locale(), { weekday: "long" }),
      dateBig: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      issue: `NO. ${String(date.getDate()).padStart(2, "0")} · ${date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} ${date.getFullYear()}`,
      more: (n) => t("story.more", { count: n }),
      makeId: id,
    });
    target.layers = target.layers.filter((l) => !l.gen && !l.deco).concat(result.layers);
  } else {
    const visuals = visualLayers(target);
    const audio = target.layers.filter((l) => l.kind === "audio");
    const day = new Date(`${story.date}T12:00:00`);
    const folio = `LITTLE DAYS · NO. ${String(day.getDate()).padStart(2, "0")}`;
    result = layoutMoment({ visuals: visuals.map((l) => ({ id: l.id, aspect: layerAspect(l) })), audio: audio.map((l) => ({ id: l.id })), title: target.title, time: target.time, folio }, style, variant);
    target.layers = target.layers.filter((l) => !l.gen && !l.deco);
    for (const layer of target.layers) if (result.place[layer.id]) Object.assign(layer, result.place[layer.id]);
    target.layers.push(...result.layers.map((l) => ({ id: id(), ...l })));
  }
  target.layoutTemplate = "scrapbook";
  target.layoutStyle = style;
  target.template = result.paper;
  if (result.backdrop) target.backdrop = result.backdrop;
  else if (/^scene:color-/.test(target.backdrop || "")) delete target.backdrop;
  decorate(target, { stickers: look.stickers }, { seed: variant + (isCover ? 1 : 0), max: look.deco, makeId: id });
  target.layoutEdited = false;
}
// Lay out every page of the story (or only `which`); pages edited by hand
// stay unless `force`.
function layoutStory({ which = null, force = false } = {}) {
  changeEditor((entry) => {
    for (const p of storyPages()) {
      if (which && !which.includes(p.cover ? "cover" : p.page.id)) continue;
      const target = p.cover ? entry : findMoment(entry, p.page.id);
      if (!target || (target.layoutEdited && !force)) continue;
      layoutStoryPage(target, p.cover);
    }
  }, false);
}
function undoStory() {
  const made = story?.made;
  if (!made) return;
  changeEditor((entry) => {
    for (const momentId of made.ids) removeMoment(entry, momentId);
    if (made.cover) {
      entry.layers = [];
      for (const key of ["layoutTemplate", "layoutVariant", "layoutStyle", "backdrop"]) delete entry[key];
    }
  }, false);
  story.made = null;
}
function makeStory() {
  undoStory();
  const ids = [];
  for (const group of story.groups) {
    let created;
    changeEditor((entry) => {
      created = createMoment(entry, { time: clockLabel(group.start) });
      created.bookId = story.book;
      created.title = (group.line || "").trim().slice(0, 70);
      created.layoutTemplate = "scrapbook";
      created.layoutStyle = story.style;
      created.layoutVariant = 0;
      if (Number.isFinite(group.start)) created.capturedAt = new Date(group.start).toISOString();
      for (const item of group.items) created.layers.push(photoLayer(item.reference, item.name, item.aspect ? { aspect: Math.round(item.aspect * 1000) / 1000 } : {}));
      entry.moments.push(created);
    }, false);
    ids.push(created.id);
  }
  // A day spread, only when there are several Moments and the cover is empty.
  story.made = { ids, cover: ids.length >= 2 && !hasDayPageContent(editor) };
  if (story.made.cover)
    changeEditor((entry) => {
      entry.layoutTemplate = "scrapbook";
      entry.layoutStyle = story.style;
      entry.layoutVariant = 0;
      entry.bookId = story.book;
    }, false);
  layoutStory({ force: true });
  story.step = "preview";
  story.index = 0;
  flushDraft();
  logEvent("story_made", { moments: ids.length, cover: story.made.cover, style: story.style });
  render();
  $("#app-scroll").scrollTop = 0;
}
const STYLE_ICONS = {
  editorial: '<svg viewBox="0 0 40 50" aria-hidden="true"><rect x="5" y="5" width="30" height="22" rx="1"/><path d="M5 33h22M5 38h16"/></svg>',
  cozy: '<svg viewBox="0 0 40 50" aria-hidden="true"><g transform="rotate(-6 14 18)"><rect x="4" y="6" width="18" height="22" rx="1"/></g><g transform="rotate(6 27 30)"><rect x="18" y="18" width="18" height="22" rx="1"/></g></svg>',
  playful: '<svg viewBox="0 0 40 50" aria-hidden="true"><rect x="4" y="8" width="20" height="16" rx="1"/><circle cx="29" cy="30" r="8"/><rect x="8" y="30" width="12" height="14" rx="1"/></svg>',
};
function storyPage() {
  if (!story || !editor) return "";
  const back = `<button class="studio-back story-back" data-action="story-back" aria-label="${t("studio.back")}">${icon("back")}</button>`;
  const total = story.groups.reduce((n, g) => n + g.items.length, 0);
  if (story.step === "group") {
    const cards = story.groups
      .map((group, g) => `${g ? `<div class="story-split" aria-hidden="true"><span></span>${t("story.splitHere")}<span></span></div>` : ""}<section class="story-group tone-${partOfDay(group.start) || "none"}"><header><b>${esc(storyTimeLabel(group))}</b><small>${t("story.photos", { count: group.items.length })}</small></header><div class="story-thumbs">${group.items
        .map((item, i) => {
          const on = story.selected?.g === g && story.selected?.i === i;
          return `<button class="story-thumb ${on ? "selected" : ""}" data-action="story-photo" data-g="${g}" data-i="${i}" aria-pressed="${on}" aria-label="${esc(item.name || t("photo.alt"))}"><img src="${esc(storyPhoto(item))}" alt=""></button>`;
        })
        .join("")}</div></section>`)
      .join("");
    const sel = story.selected;
    const bar = sel
      ? `<div class="story-photo-bar" role="group" aria-label="${t("story.photoActions")}"><button data-action="story-move" data-dir="-1">‹ ${t("story.toPrev")}</button><button data-action="story-move" data-dir="1">${t("story.toNext")} ›</button>${sel.i > 0 ? `<button data-action="story-split">${t("story.split")}</button>` : ""}<button class="danger-text" data-action="story-remove">${t("story.remove")}</button></div>`
      : "";
    return `<header class="story-bar">${back}<h1>${t("story.photosTitle", { count: total })}</h1><span></span></header><p class="story-intro">${t("story.groupHint", { count: story.groups.length })}</p><div class="story-groups">${cards}</div>${bar}<div class="story-foot"><button class="primary full-width" data-action="story-regroup">${t("story.regroupDone")}</button></div>`;
  }
  const pages = storyPages();
  story.index = Math.max(0, Math.min(pages.length - 1, story.index));
  const current = pages[story.index];
  const tabs = pages.length > 1 ? `<div class="story-tabs" role="tablist" aria-label="${t("story.pages")}">${pages.map((p, i) => `<button role="tab" data-action="story-page" data-index="${i}" aria-selected="${i === story.index}">${esc(p.label)}</button>`).join("")}</div>` : "";
  const styles = STYLES.map((s) => `<button data-action="story-style" data-style="${s}" aria-pressed="${s === story.style}">${STYLE_ICONS[s]}<b>${t("story.style." + s)}</b></button>`).join("");
  const words = storyMomentsOf(current).some((m) => (m.title || "").trim());
  const books = state().books.map((b) => `<option value="${esc(b.id)}" ${b.id === story.book ? "selected" : ""}>${esc(b.title)}</option>`).join("");
  const title = story.date === dateKey() ? t("story.previewTitle") : t("story.previewTitleDay", { date: friendlyDate(story.date) });
  return `<header class="story-bar">${back}<h1>${esc(title)}</h1><span></span></header><div class="story-where"><label class="story-book"><span>${t("story.into")}</span><select data-story-book aria-label="${t("story.into")}">${books}</select></label><label class="story-day"><span>${t("story.day")}</span><input type="date" data-story-date value="${esc(story.date)}" max="${dateKey()}" aria-label="${t("story.day")}"></label></div>${tabs}<button class="story-canvas" data-action="story-text" aria-label="${t("story.addWords")}">${current ? sharedCanvasHTML(current.page, ctx(), { readOnly: true, dayPage: current.cover }) : ""}</button><div class="story-styles" role="group" aria-label="${t("story.styleLabel")}">${styles}</div><div class="story-tools"><button data-action="story-shuffle">↻ ${t("story.relayout")}</button><button data-action="story-text">Aa ${t(words ? "story.editWords" : "story.addWords")}</button>${total > 1 ? `<button data-action="story-group">${t("story.regroup")}</button>` : ""}</div><div class="story-actions"><button class="secondary" data-action="story-adjust">✎ ${t("story.customize")}</button><button class="primary" data-action="story-save">${t("save")}</button></div>`;
}
// Words for the Moments on this page, in a small sheet (all optional).
function openStoryText() {
  const current = storyPages()[story.index];
  const moments = storyMomentsOf(current);
  if (!moments.length) return;
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet story-text-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("story.wordsTitle")}</h2><p class="save-help">${t("story.wordsHint")}</p>${moments
    .map((m) => `<label class="story-word"><span>${esc(m.time || t("story.page"))}</span><input type="text" maxlength="70" data-story-word="${esc(m.id)}" value="${esc(m.title || "")}" placeholder="${t("story.linePlaceholder")}"></label>`)
    .join("")}<button class="primary full-width" data-action="story-text-done">${t("pages.done")}</button></div>`;
  dialog.showModal();
  dialog.querySelector("input")?.focus();
}
async function saveStoryText() {
  const inputs = [...document.querySelectorAll("[data-story-word]")];
  const changed = [];
  changeEditor((entry) => {
    for (const input of inputs) {
      const m = findMoment(entry, input.dataset.storyWord);
      const value = input.value.trim().slice(0, 70);
      if (m && (m.title || "") !== value) {
        m.title = value;
        m.updatedAt = new Date().toISOString();
        changed.push(m.id);
        const group = story.groups[story.made.ids.indexOf(m.id)];
        if (group) group.line = value;
      }
    }
  }, false);
  $("#choose-dialog").close();
  if (!changed.length) return render();
  // Words take room: lay out those pages again (and the day spread), except
  // pages edited by hand, which keep their places (the words still show).
  layoutStory({ which: [...changed, "cover"] });
  flushDraft();
  logEvent("story_words", { count: changed.length });
  render();
}
function finishStory() {
  const { book, date } = story;
  clearTimeout(draftTimer);
  store.update((s) => saveEntry(s, editor));
  draftDirty = false;
  syncReminder();
  logEvent("story_saved", { moments: story.made?.ids.length || 0, style: story.style });
  // The same "page done" record as before, for the 30-day test (no content).
  if (quickSession) {
    const made = (story.made?.ids || []).map((momentId) => findMoment(editor, momentId)).filter(Boolean);
    logEvent("page_done", {
      ms: Date.now() - quickSession.started,
      taps: quickSession.taps,
      shuffles: quickSession.shuffles,
      photos: made.reduce((n, m) => n + visualLayers(m).length, 0),
      moments: made.length,
      line: made.some((m) => (m.title || "").trim()),
      style: story.style,
    });
    quickSession = null;
  }
  story = null;
  readReturn = null;
  // Straight into the book, page by page, at the first page of this day.
  page = "books";
  selectedBook = book;
  bookView = "flip";
  flipBookId = book;
  const at = flipPages(book).findIndex((p) => p.date === date);
  flipIndex = at >= 0 ? at + 1 : 0;
  flipTurn = 0;
  render();
  $("#app-scroll").scrollTop = 0;
  document.querySelector(".flip-book")?.scrollIntoView({ block: "start" });
  toast(t("story.saved", { name: state().books.find((b) => b.id === book)?.title || "" }));
}
// After Save: see what I just made — the book opens at that page (turn the
// pages, or go Home from the menu), not straight back to Home.
function showSavedPage() {
  const saved = activePage();
  const momentId = saved && saved !== editor ? saved.id : null;
  const date = editor.date;
  const book = (saved && saved.bookId) || editor.bookId || state().books[0]?.id || "daily";
  flushDraft();
  quickResult = null;
  const pages = flipPages(book);
  let at = pages.findIndex((p) => p.date === date && (momentId ? p.moment?.id === momentId : !p.moment));
  if (at < 0) at = pages.findIndex((p) => p.date === date);
  if (at < 0) return navigate("home");
  page = "books";
  selectedBook = book;
  bookView = "flip";
  flipBookId = book;
  flipIndex = at + 1;
  flipTurn = 0;
  render();
  $("#app-scroll").scrollTop = 0;
  document.querySelector(".flip-book")?.scrollIntoView({ block: "start" });
  keeperStamp();
  // Today's first page: the stamp moment, right here on the page just made.
  setTimeout(() => maybeCelebrate(true), 260);
}
async function storyAction(actionName, target) {
  if (!story) return;
  const sel = story.selected;
  if (actionName === "story-back") {
    if (story.step === "group") return storyAction("story-regroup", target);
    if (!(await askConfirm(t("story.discard")))) return;
    undoStory();
    flushDraft();
    story = null;
    navigate("home");
    return;
  }
  if (actionName === "story-group") {
    story.step = "group";
    story.selected = null;
  }
  if (actionName === "story-regroup") {
    // Words already written stay with their Moment (by its first photo).
    const lines = new Map();
    for (const [i, momentId] of (story.made?.ids || []).entries()) {
      const m = findMoment(editor, momentId);
      const first = story.groups[i]?.items[0]?.reference;
      if (m?.title && first) lines.set(first, m.title);
    }
    story.groups = story.groups.map((g) => ({ ...g, line: lines.get(g.items[0]?.reference) || "" }));
    story.selected = null;
    return makeStory();
  }
  if (actionName === "story-photo") {
    const g = Number(target.dataset.g),
      i = Number(target.dataset.i);
    story.selected = sel?.g === g && sel?.i === i ? null : { g, i };
  }
  if (actionName === "story-move" && sel) {
    story.groups = movePhoto(story.groups, sel.g, sel.i, Number(target.dataset.dir));
    story.selected = null;
  }
  if (actionName === "story-split" && sel) {
    story.groups = splitAt(story.groups, sel.g, sel.i);
    story.selected = null;
  }
  if (actionName === "story-remove" && sel) {
    const left = removePhoto(story.groups, sel.g, sel.i);
    if (!left.length) return toast(t("story.keepOne"));
    story.groups = left;
    story.selected = null;
  }
  if (actionName === "story-page") story.index = Number(target.dataset.index) || 0;
  if (actionName === "story-text") return openStoryText();
  if (actionName === "story-text-done") return saveStoryText();
  if (actionName === "story-style") {
    const next = styleOf(target.dataset.style);
    if (next === story.style) return;
    const edited = storyPages().filter((p) => p.page.layoutEdited).length;
    // Pages adjusted by hand are only changed when the person says so.
    const force = edited ? await askConfirm(t("story.styleConfirm", { count: edited })) : false;
    story.style = next;
    changeEditor((entry) => {
      for (const p of storyPages()) {
        const target2 = p.cover ? entry : findMoment(entry, p.page.id);
        if (target2 && (!target2.layoutEdited || force)) target2.layoutStyle = next;
      }
    }, false);
    layoutStory({ force });
    flushDraft();
    logEvent("story_style", { style: next, kept: force ? 0 : edited });
  }
  if (actionName === "story-shuffle") {
    const current = storyPages()[story.index];
    if (!current) return;
    if (current.page.layoutEdited && !(await askConfirm(t("story.relayoutConfirm")))) return;
    changeEditor((entry) => {
      const target2 = current.cover ? entry : findMoment(entry, current.page.id);
      if (target2) target2.layoutVariant = ((Number(target2.layoutVariant) || 0) + 1) % 3;
    }, false);
    layoutStory({ which: [current.cover ? "cover" : current.page.id], force: true });
    flushDraft();
    if (quickSession) quickSession.shuffles++;
    logEvent("story_relayout", { style: story.style });
  }
  if (actionName === "story-adjust") {
    const current = storyPages()[story.index];
    if (!current) return;
    page = "studio";
    selectMoment(current.cover ? null : current.page.id);
    readReturn = { page: "story", book: selectedBook, date: selectedDate, moment: "" };
    render();
    $("#app-scroll").scrollTop = 0;
    return;
  }
  if (actionName === "story-save") return finishStory();
  render();
}

// ---------- Quick Create result: shuffle / a line / edit / done ----------
// After picking my photos the page is already laid out; this view keeps only
// four choices so finishing a page takes seconds. "编辑" opens every tool.
let quickResult = null; // the Moment id being finished, while in this view
let quickSession = null; // { started, taps, shuffles } for the test log
function quickResultActive() {
  return Boolean(quickResult && quickResult === activeMomentId && page === "studio" && findMoment(editor, quickResult));
}
function quickPlaced(saved) {
  changeTarget((p) => {
    if (p === editor) return;
    p.layoutTemplate = "smart";
    p.layoutVariant = 0;
    delete p.backdrop;
    for (const item of saved)
      p.layers.push(photoLayer(item.reference, item.name, item.aspect ? { aspect: Math.round(item.aspect * 1000) / 1000 } : {}));
    applyLayout(p, "smart");
    const kit = kitForBook(catalog, state().books.find((b) => b.id === (p.bookId || editor.bookId)));
    if (kit) {
      applyKit(p, kit);
      decorate(p, kit, { caption: Boolean(p.title), makeId: id });
    }
  });
  quickResult = activeMomentId;
  selectedLayer = null;
  studioTool = null;
  flushDraft();
  render();
  logEvent("quick_placed", { photos: saved.length });
}
function quickResultHTML() {
  const pageNow = activePage();
  const variant = (Number(pageNow.layoutVariant) || 0) % 3;
  const book = state().books.find((b) => b.id === (pageNow.bookId || editor.bookId));
  return `<header class="studio-bar"><button class="studio-back" data-action="studio-back" aria-label="${t("studio.back")}">${icon("back")}</button><h1 class="visually-hidden">${t("studio.title")}</h1><span class="quick-result-title">${t("result.title")}</span><button class="primary" data-action="quick-done">${t("result.done")} ${icon("check")}</button></header><p class="quick-result-book">${t("result.inBook", { name: book?.title || "" })}</p><div class="studio-stage large quick-stage"><div class="canvas-wrap moment-wrap" id="canvas-wrap">${canvasHTML()}</div></div><div class="quick-result-bar"><button data-action="smart-shuffle"><span class="shuffle-glyph" aria-hidden="true">↻</span><b>${t("result.shuffle")}</b><small>${variant + 1} / 3</small></button><button data-action="smart-caption"><span aria-hidden="true">Aa</span><b>${t(pageNow.title ? "result.editLine" : "result.addLine")}</b></button><button data-action="music-sheet" class="${pageNow.music ? "has-music" : ""}"><span aria-hidden="true">♫</span><b>${t("music.short")}</b>${pageNow.music ? `<small>${esc(trackName(findTrack(catalog, pageNow.music), languageCode()))}</small>` : ""}</button><button data-action="share-story"><span aria-hidden="true">⇪</span><b>${t("share.story")}</b></button><button data-action="quick-edit"><span aria-hidden="true">✎</span><b>${t("result.edit")}</b></button></div><p class="save-help quick-result-help">${t("result.help")}</p>`;
}
function finishQuickPage() {
  const pageNow = activePage();
  if (quickSession)
    logEvent("page_done", {
      ms: Date.now() - quickSession.started,
      taps: quickSession.taps,
      shuffles: quickSession.shuffles,
      photos: pageNow.layers.filter(framedPhoto).length,
      variant: Number(pageNow.layoutVariant) || 0,
      line: Boolean(pageNow.title),
    });
  quickSession = null;
  quickResult = null;
  clearTimeout(draftTimer);
  store.update((s) => saveEntry(s, editor));
  draftDirty = false;
  const book = state().books.find((b) => b.id === (pageNow.bookId || editor.bookId));
  navigate("home");
  toast(t("result.saved", { name: book?.title || "" }));
}
async function quickMore(kind) {
  const book = quick?.book || state().books[0]?.id || "daily";
  const date = quick?.date || dateKey();
  quick = null;
  startPage(book, date);
  if (kind === "video") {
    studioTool = "media";
    render();
    $("#video-input").click();
  } else if (kind === "voice") {
    studioTool = "media";
    soundMenu = true;
    render();
  } else render();
}
// ---------- Hand drawing (手绘) ----------
// Draw right on the page being written; the drawing is kept as a picture on
// this device and can be drawn on again later.
async function drawOnPage(layerId = null) {
  if (page !== "studio") return;
  const pageNow = activePage();
  const layer = layerId ? pageNow.layers.find((l) => l.id === layerId) : null;
  const under = sharedCanvasHTML({ ...pageNow, layers: pageNow.layers.filter((l) => l.id !== layerId) }, ctx(), { readOnly: true, dayPage: isDayPage() });
  let dialog = $("#draw-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "draw-dialog";
    dialog.className = "draw-dialog";
    dialog.setAttribute("aria-label", t("draw.title"));
    document.body.append(dialog);
  }
  const result = await openDrawBoard({
    dialog,
    background: under,
    base: layer ? { src: safePhoto(layer.mediaRef), x: layer.x, y: layer.y, w: layer.w, h: layer.h, scale: layer.scale, rotation: layer.rotation } : null,
    t,
  });
  if (!result) return;
  if (result.empty) {
    changeTarget((p) => {
      p.layers = p.layers.filter((l) => l.id !== layerId);
    });
    selectedLayer = null;
    render();
    return;
  }
  try {
    const mediaId = await media.put(result.blob, { kind: "photo", name: "drawing" });
    const reference = `media:${mediaId}`;
    let placed;
    changeTarget((p) => {
      const existing = layerId && p.layers.find((l) => l.id === layerId);
      if (existing) {
        Object.assign(existing, result.layer, { mediaRef: reference, scale: 1, rotation: 0, crop: { x: 50, y: 50, zoom: 1 }, frame: "bare", drawing: true });
        placed = existing;
      } else {
        placed = photoLayer(reference, "drawing", { ...result.layer, frame: "bare", drawing: true });
        p.layers.push(placed);
      }
    });
    selectedLayer = null;
    flushDraft();
    render();
    toast(t("draw.saved"));
  } catch (error) {
    console.warn("Drawing could not be saved", error?.name);
    toast(t("media.failed"));
  }
}
// Photo browser (like a poster app): the chosen photo large in its own shape
// on top, the collections as tabs, and a two-column waterfall of photos that
// keep their own shape (landscape / portrait is visible at a glance).
let browse = { collection: "", pick: "" };
function photoShape(photo) {
  if (!photo?.w || !photo?.h) return "";
  return t(photo.w > photo.h * 1.05 ? "photo.landscape" : photo.h > photo.w * 1.05 ? "photo.portrait" : "photo.square");
}
function photoBrowserHTML() {
  const en = languageCode() === "en";
  const collection = sceneCollections().find((c) => c.id === browse.collection) || sceneCollections()[0];
  const list = collectionScenes(collection.id);
  const pick = list.find((p) => p.id === browse.pick) || list[0];
  const today = todayScene();
  const ratio = (p) => (p?.w && p?.h ? `${p.w} / ${p.h}` : "4 / 5");
  return `<div class="pb-sheet"><header class="pb-top"><button class="pb-close" data-action="scene-close" aria-label="${t("close")}">×</button><h2>${esc(en ? collection.nameEn : collection.nameZh)}</h2><button class="pb-use wall-use" data-action="use-scene" data-scene="${esc(pick.id)}">${t("scene.useThis")}</button></header><figure class="pb-preview"><img src="${esc(safePhoto(`photo:${pick.id}`))}" alt="${esc(sceneName(pick))}" style="aspect-ratio:${ratio(pick)}"><figcaption><b>${esc(sceneName(pick))}</b><span>${esc(photoShape(pick))}${pick === today ? ` · ${t("scene.today")}` : ""}</span></figcaption></figure><section class="pb-panel"><nav class="pb-tabs" aria-label="${t("scene.title")}">${sceneCollections()
    .map((c) => `<button data-action="photo-browse" data-collection="${esc(c.id)}" class="${c.id === collection.id ? "selected" : ""}" aria-pressed="${c.id === collection.id}">${esc(en ? c.nameEn : c.nameZh)}</button>`)
    .join("")}</nav><p class="pb-desc">${esc(en ? collection.descEn : collection.descZh)}</p><div class="pb-grid">${list
    .map((p) => `<button class="pb-tile ${p.id === pick.id ? "selected" : ""}" data-action="photo-pick" data-photo="${esc(p.id)}" aria-pressed="${p.id === pick.id}" aria-label="${esc(sceneName(p))} · ${esc(photoShape(p))}"><img src="${esc(safePhoto(`photo:${p.id}`))}" alt="" loading="lazy" style="aspect-ratio:${ratio(p)}"><span>${esc(sceneName(p))}</span></button>`)
    .join("")}</div></section></div>`;
}
function renderPhotoBrowser({ keepScroll = true } = {}) {
  const dialog = $("#scene-dialog");
  const panel = dialog.querySelector(".pb-panel");
  const top = keepScroll && panel ? panel.scrollTop : 0;
  const tabs = dialog.querySelector(".pb-tabs")?.scrollLeft || 0;
  dialog.innerHTML = photoBrowserHTML();
  dialog.querySelector(".pb-panel").scrollTop = top;
  const nav = dialog.querySelector(".pb-tabs");
  nav.scrollLeft = tabs;
  nav.querySelector(".selected")?.scrollIntoView({ block: "nearest", inline: "nearest" });
}
function openSceneCollection(id) {
  if (!sceneCollections().some((item) => item.id === id)) return;
  browse = { collection: id, pick: "" };
  const dialog = $("#scene-dialog");
  dialog.innerHTML = photoBrowserHTML();
  dialog.showModal();
  renderPhotoBrowser({ keepScroll: false });
}
// One place to add a picture: the album, the scene library, or today's pick.
function openPhotoChooser(targetSlot = "layers") {
  photoTarget = targetSlot;
  const en = languageCode() === "en";
  const picks = todayPicks();
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t(targetSlot === "main" ? "choose.mainTitle" : targetSlot === "line" ? "line.chooseTitle" : "choose.title")}</h2><button class="choose-album" data-action="choose-album"><span aria-hidden="true">📷</span><span><b>${t("choose.album")}</b><small>${t(targetSlot === "main" ? "choose.albumOne" : "choose.albumMany")}</small></span><i>›</i></button><h3>${t("choose.picks")}</h3><div class="choose-picks">${picks
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
    openStudio(dateKey());
    if (hasDayPageContent(editor) || editor.moments.length) addMomentNow();
  }
  studioTool = null;
  const reference = `photo:${scene.id}`;
  const pageNow = activePage();
  // Photo + one line: the photo becomes the page itself.
  if (!isDayPage() && (photoTarget === "line" || pageNow.layoutTemplate === "line")) {
    changeTarget((p) => {
      p.backdrop = reference;
      p.layoutTemplate = "line";
    });
    photoTarget = "layers";
    flushDraft();
    focusInline("title");
    return;
  }
  const emptySlot = pageNow.layers.some((layer) => layer.kind === "photo" && !layer.mediaRef);
  // A day page's main picture spot (or a chosen frame) takes the scene, so it
  // sits in the layout instead of floating on top of it.
  if (!emptySlot && isDayPage() && (photoTarget === "main" || (!editor.photo && editor.layoutTemplate !== "text"))) {
    changeEditor((entry) => {
      entry.photo = reference;
    });
  } else addPhotoLayers([{ reference, name: sceneName(scene), aspect: scene.w && scene.h ? scene.w / scene.h : undefined }]);
  photoTarget = "layers";
  flushDraft();
  toast(t("scene.added", { name: sceneName(scene) }));
}
// Photo, text, video and sound are equal ways to add something to the paper.
function emptyPaper(page = activePage()) {
  return !isDayPage() && !page.layers?.length && page.layoutTemplate !== "text" && page.layoutTemplate !== "line";
}
function addChoicesHTML(className = "") {
  const item = (action, glyph, label) =>
    `<button class="${className}" data-action="${action}" ${action === "add-sound" ? `aria-expanded="${soundMenu}"` : ""}><span aria-hidden="true">${glyph}</span><b>${t(label)}</b></button>`;
  return item("add-photos", "▣", "add.photo") + item("add-text-layer", "Aa", "add.text") + (className === "canvas-add-choice" ? item("draw-new", "✎", "draw.short") : "") + item("add-video", "▶", "add.video") + item("add-sound", "♫", "add.sound");
}
function studioPage() {
  const dayPage = isDayPage();
  if (quickResultActive()) return quickResultHTML();
  // One compact bar (date · draft state · save) leaves the room to the page.
  return `<header class="studio-bar"><button class="studio-back" data-action="studio-back" aria-label="${t("studio.back")}">${icon("back")}</button><h1 class="visually-hidden">${t("studio.title")}</h1><input class="date-input" type="date" id="editor-date" aria-label="${t("field.date")}" value="${editor.date}"><span class="draft-status" id="draft-status">${draftDirty ? t("正在保存草稿…") : state().drafts[editor.date] ? t("草稿已保存在本机") : t("studio.draftHint")}</span>${keeperMiniHTML()}<button class="primary" data-action="save-entry">${t("save")} ${icon("check")}</button></header>${chapterChipsHTML()}${pageModeHTML()}${pageBarHTML()}${studioMusicHTML()}<div class="studio-stage ${studioTool ? "" : "large"}"><div class="canvas-wrap ${dayPage ? "" : "moment-wrap"}" id="canvas-wrap">${canvasHTML()}</div>${typeBarHTML()}<div class="stage-bar ${studioTool ? "with-size" : ""}"><button data-action="undo" ${history.length ? "" : "disabled"} aria-label="${t("studio.undo")}">${icon("undo")}</button><button data-action="redo" ${future.length ? "" : "disabled"} aria-label="${t("studio.redo")}">${icon("redo")}</button>${emptyPaper() ? "" : addChoicesHTML("stage-add")}${studioTool ? `<button data-action="preview-size" aria-label="${t("studio.previewLarge")}">⤢</button>` : ""}</div>${soundMenu ? `<div class="sound-menu" role="group" aria-label="${t("add.sound")}"><button data-action="music-sheet">♫ ${t("music.title")}</button><button data-action="add-record">🎙 ${t("add.record")}</button><button data-action="add-audio-file">⤒ ${t("add.audioFile")}</button></div>` : ""}</div>${writeCardHTML()}<div class="studio-footer"><button class="secondary" data-action="save-draft">${t("studio.saveDraft")}</button><span class="export-choice"><button class="secondary" data-action="share-story">⇪ ${t("share.story")}</button><button class="primary" data-action="export">${icon("download")} ${t("export.photo")}</button><button class="primary" data-action="export-video">▶ ${t("export.video")}</button></span></div><p class="save-help">${t("studio.help")}</p><button class="float-save" data-action="save-float" hidden>${icon("check")} ${t("save")}</button><div class="tool-dock-wrap" id="tool-menu">${toolMenuHTML()}</div>`;
}

// Save stays in reach: when the top bar has scrolled away, show the small
// floating Save above the dock.
let saveWatcher = null;
function watchSaveButton() {
  saveWatcher?.disconnect();
  saveWatcher = null;
  const bar = document.querySelector(".studio-bar");
  const floating = document.querySelector(".float-save");
  if (!bar || !floating || !("IntersectionObserver" in window)) return;
  saveWatcher = new IntersectionObserver(([entry]) => (floating.hidden = entry.isIntersecting), { root: $("#app-scroll"), threshold: 0 });
  saveWatcher.observe(bar);
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
    ["hei", t("font.hei")],
    ["song", t("font.song")],
    ["kai", t("font.kai")],
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
  $("#phone").classList.toggle("in-studio", signedIn && (page === "studio" || page === "story"));
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
    story: storyPage,
    day: () => dayDetailHTML(selectedDate, ctx(), { icon, friendlyDate }),
    journey: () =>
      habitJourneyHTML(journeyHabit, journeyPage, ctx(), journeyHelpers()),
    community: () =>
      communityHTML(social(), communityView, state(), ctx(), { icon }),
    settings: () => settingsHTML(ctx(), { back: settingsReturn, account, themes: themePickerHTML(), keeper: keeperSettingsHTML(), news: newsSectionHTML(), reminder: reminderSectionHTML(), privacy: privacySectionHTML(), backupWhen: backupWhenHTML(), labs: labsCardHTML() }),
    inbox: () => inboxHTML(social(), inboxFilter, ctx(), { icon }),
    search: searchPageHTML,
  }[page]();
  navigation();
  applyShellLanguage();
  watchSaveButton();
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
  syncMusic();
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
// ---------- Sharing a book with family (read-only PDF) ----------
// One person keeps the book; partners, parents and grandparents look at it.
// No account or server: the book becomes one PDF for the share sheet.
const SUGGESTED_BOOKS = [
  { preset: "relationship", category: "Relationship", coverTemplate: "magazine-west", coverImage: "photo:beach-sunset", color: "blush" },
  { preset: "parenting", category: "Parenting", coverTemplate: "magazine-jp", coverImage: "photo:balloons", color: "butter" },
];
function suggestedBooksHTML() {
  const missing = SUGGESTED_BOOKS.filter((s) => !state().books.some((b) => b.category === s.category));
  if (!missing.length) return "";
  return `<section class="suggested-books"><h3>${t("suggest.title")}</h3><p class="save-help">${t("suggest.help")}</p><div class="suggested-row">${missing
    .map((s) => {
      const book = { id: `suggest-${s.preset}`, title: t(`suggest.${s.preset}.title`), category: s.category, coverTemplate: s.coverTemplate, coverImage: s.coverImage, color: s.color };
      return `<button class="suggested-book" data-action="book-suggest" data-preset="${s.preset}">${coverHTML(book, ctx())}<b>${esc(book.title)}</b><small>${t(`suggest.${s.preset}.hint`)}</small></button>`;
    })
    .join("")}</div></section>`;
}
function openSuggestedBook(preset) {
  const s = SUGGESTED_BOOKS.find((item) => item.preset === preset);
  if (!s) return;
  openBookDialog();
  bookDraft = { ...bookDraft, title: t(`suggest.${preset}.title`), description: t(`suggest.${preset}.description`), category: s.category, coverTemplate: s.coverTemplate, coverImage: s.coverImage, color: s.color };
  $("#dialog-form").innerHTML = bookDialogHTML(bookDraft, ctx());
}
async function shareBook(bookId) {
  const book = state().books.find((b) => b.id === bookId);
  if (!book || busyMedia) return;
  const all = bookSharePages(state(), bookId);
  if (!all.length) {
    toast(t("bookShare.empty"));
    return;
  }
  const { pages, skipped } = limitPages(all);
  const range = dateRange(pages);
  busyMedia = true;
  let cancelled = false;
  const dialog = $("#export-dialog");
  $("#export-title").textContent = t("bookShare.making", { name: book.title });
  $("#export-cancel").textContent = t("cancel");
  $("#export-progress").style.width = "0%";
  $("#export-time").textContent = "";
  $("#export-cancel").onclick = () => (cancelled = true);
  dialog.oncancel = (event) => {
    event.preventDefault();
    cancelled = true;
  };
  dialog.showModal();
  const jpeg = async (canvas) => {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
  };
  try {
    const when = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "short", day: "numeric" });
    const line = `${range.from === range.to ? when(range.from) : `${when(range.from)} – ${when(range.to)}`} · ${t("bookShare.pages", { count: pages.length })}`;
    const images = [await jpeg(await renderBookTitleCanvas({ title: book.title, description: book.description || "", coverSrc: safePhoto(coverPhotoRef(book, catalog)), line }))];
    for (let i = 0; i < pages.length; i++) {
      if (cancelled) throw Object.assign(new Error("cancelled"), { code: "cancelled" });
      const { date, entry, moment } = pages[i];
      const firstOfDay = i === 0 || pages[i - 1].date !== date;
      const canvas = await renderJournalCanvas(moment || entry, { ...exportOptionsFor(!moment, date, "", firstOfDay), skipVideo: true });
      images.push(await jpeg(canvas));
      $("#export-progress").style.width = `${Math.round(((i + 1) / pages.length) * 100)}%`;
      $("#export-time").textContent = t("bookShare.progress", { now: i + 1, total: pages.length });
    }
    const pdf = buildPdf(images, { title: book.title });
    const name = `Little-Days-${book.title.replace(/[\\/:*?"<>|]+/g, "").slice(0, 40) || "book"}.pdf`;
    const file = new File([pdf], name, { type: "application/pdf" });
    dialog.close();
    let how = "saved";
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: book.title });
        how = "shared";
      } catch (error) {
        how = error?.name === "AbortError" ? "cancelled" : "saved";
      }
    }
    if (how === "saved") {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      // Some browsers drop non-Latin download names; the PDF keeps the title.
      link.download = /^[\w .()-]+\.pdf$/.test(name) ? name : `Little-Days-book-${dateKey()}.pdf`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 30000);
    }
    logEvent("book_share", { pages: pages.length, kind: how });
    if (how === "cancelled") return;
    toast(t(how === "shared" ? "bookShare.shared" : "bookShare.saved", { count: pages.length }) + (skipped ? ` ${t("bookShare.skipped", { count: skipped })}` : ""));
    openContributeQuestion();
  } catch (error) {
    if (error?.code === "cancelled") toast(t("export.cancelled"));
    else {
      console.warn("Book share failed", error?.name);
      toast(t("bookShare.failed"));
    }
  } finally {
    if (dialog.open) dialog.close();
    busyMedia = false;
  }
}
// An honest question (not a feature yet): would family add photos too?
function openContributeQuestion() {
  const dialog = $("#choose-dialog");
  const option = (kind) => `<button class="contribute-option" data-action="contribute-interest" data-kind="${kind}"><b>${t(`contribute.${kind}`)}</b><small>${t(`contribute.${kind}Hint`)}</small></button>`;
  dialog.innerHTML = `<div class="choose-sheet contribute-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("contribute.title")}</h2><p class="save-help">${t("contribute.note")}</p>${option("view")}${option("add")}${option("unsure")}</div>`;
  dialog.showModal();
}
// ---------- A gentle streak and the stamp moment ----------
// Days in a row with a page; one missed day a week is a rest day. After
// today's first page, back on Home, a "Day N" stamp drops onto the page.
function streakNow() {
  return streakInfo(recordedDays(state()), dateKey());
}
function streakChipHTML() {
  const s = streakNow();
  return `<button class="streak-chip ${s.today ? "done" : ""}" data-action="streak-open"><i class="streak-dot" aria-hidden="true"></i>${s.streak ? t("streak.chip", { count: s.streak, week: s.weekCount }) : t("streak.start")}</button>`;
}
function maybeCelebrate(anywhere = false) {
  if ((!anywhere && page !== "home") || document.querySelector("dialog[open]")) return;
  const s = streakNow();
  if (!s.today) return;
  let last = "";
  try {
    last = localStorage.getItem(CELEBRATED_KEY) || "";
  } catch {}
  if (last === dateKey()) return;
  try {
    localStorage.setItem(CELEBRATED_KEY, dateKey());
  } catch {}
  openStreak({ celebrate: true });
  logEvent("celebrate", { pages: s.streak, kind: s.milestone ? "milestone" : "day" });
}
function openStreak({ celebrate = false } = {}) {
  const s = streakNow();
  const best = bestStreak(recordedDays(state()));
  let dialog = $("#streak-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "streak-dialog";
    dialog.className = "streak-dialog";
    dialog.setAttribute("aria-labelledby", "streak-title");
    document.body.append(dialog);
  }
  const weekdays = t("weekdays.short").split(",");
  const message = !s.today ? t(s.streak ? "streak.continue" : "streak.begin", { count: s.streak + 1 }) : s.milestone ? t(`streak.milestone.${s.milestone}`) : s.streak <= 1 ? t("streak.first") : t("streak.keep");
  const confetti = celebrate ? `<div class="streak-confetti" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>` : "";
  dialog.innerHTML = `<div class="streak-card ${celebrate ? "celebrate" : ""} ${s.milestone ? "milestone" : ""}">${confetti}<div class="streak-stamp" aria-hidden="true"><small>${t("streak.stampTop")}</small><b>${s.streak}</b><small>${t("streak.stampBottom")}</small></div><h2 id="streak-title">${s.streak ? t("streak.title", { count: s.streak }) : t("streak.none")}</h2><p class="streak-message">${esc(message)}</p><div class="streak-week" role="img" aria-label="${t("streak.weekLabel", { count: s.weekCount })}">${s.week.map((on, i) => `<span class="${on ? "on" : ""}" style="--i:${i}"><i></i><small>${esc(weekdays[i] || "")}</small></span>`).join("")}</div><p class="streak-meta">${[t("streak.thisWeek", { count: s.weekCount }), s.next ? t("streak.next", { count: s.next - s.streak, goal: s.next }) : "", best > s.streak ? t("streak.best", { count: best }) : ""].filter(Boolean).join(" · ")}</p>${s.restsUsed ? `<p class="save-help">${t("streak.rest")}</p>` : `<p class="save-help">${t("streak.restRule")}</p>`}<button class="primary full-width" data-action="streak-close">${t(s.today ? "streak.ok" : "streak.write")}</button></div>`;
  if (!s.today) dialog.querySelector('[data-action="streak-close"]').dataset.action = "streak-write";
  dialog.showModal();
}
// ---------- Reading a day: rename, edit or delete a page in place ----------
function readCopies(date) {
  // The saved day and its draft (if any) both change, so they stay in step.
  return (next) => [next.entries.find((e) => e.date === date), next.drafts[date]].filter(Boolean);
}
function startTitleEdit(el) {
  if (el.isContentEditable) return;
  const { date, moment } = el.dataset;
  const original = el.querySelector(".title-add") ? "" : el.textContent;
  el.textContent = original;
  el.contentEditable = "plaintext-only";
  el.classList.add("editing");
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  getSelection().removeAllRanges();
  getSelection().addRange(range);
  const finish = (keep) => {
    el.removeEventListener("blur", onBlur);
    el.removeEventListener("keydown", onKey);
    const title = el.textContent.replace(/\s+/g, " ").trim().slice(0, 70);
    if (keep && title !== original) {
      store.update((next) => {
        for (const day of readCopies(date)(next)) {
          const page = moment ? findMoment(day, moment) : day;
          if (page) page.title = title;
        }
      });
      toast(t("read.titleSaved"));
    }
    render();
  };
  const onBlur = () => finish(true);
  const onKey = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      el.blur();
    } else if (event.key === "Escape") {
      el.removeEventListener("blur", onBlur);
      finish(false);
    }
  };
  el.addEventListener("blur", onBlur);
  el.addEventListener("keydown", onKey);
}
document.addEventListener("dblclick", (event) => {
  const el = event.target.closest?.("[data-title-edit]");
  if (el && page === "day") startTitleEdit(el);
});
document.addEventListener("click", (event) => {
  // An untitled page: one tap is enough to add a title.
  const el = event.target.closest?.("[data-title-edit].untitled");
  if (el && page === "day") startTitleEdit(el);
});
function openPageMenu(date, momentId) {
  const dialog = $("#choose-dialog");
  const isCover = !momentId;
  dialog.innerHTML = `<div class="choose-sheet page-menu-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t(isCover ? "day.cover" : "read.pageMenu")}</h2><button class="contribute-option" data-action="read-edit" data-date="${esc(date)}" data-moment="${esc(momentId)}"><b>✎ ${t("read.edit")}</b><small>${t("read.editHint")}</small></button>${isCover ? "" : `<button class="contribute-option" data-action="read-rename" data-date="${esc(date)}" data-moment="${esc(momentId)}"><b>Aa ${t("read.rename")}</b><small>${t("read.titleHint")}</small></button>`}<button class="contribute-option danger-option" data-action="read-delete" data-date="${esc(date)}" data-moment="${esc(momentId)}"><b>${t(isCover ? "write.clearDay" : "write.deleteStory")}</b><small>${t("read.deleteHint")}</small></button><button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
  dialog.showModal();
}
async function deleteReadPage(date, momentId) {
  if (!(await askConfirm(t(momentId ? "moment.deleteConfirm" : "write.clearDayConfirm")))) return;
  store.update((next) => {
    for (const day of readCopies(date)(next)) {
      if (momentId) removeMoment(day, momentId);
      else Object.assign(day, { title: "", body: "", photo: "", layers: [], media: [], fieldValues: {} });
    }
  });
  render();
  toast(t(momentId ? "moment.deleted" : "write.dayCleared"));
}
// ---------- What's new (update notes inside the app) ----------
// Settings: the update history (the newest notes shown, the rest a tap away).
// Opening Settings counts as seen, so the dot on the gear goes away.
function newsSectionHTML() {
  const fresh = hasUnseen();
  markSeen();
  const latest = UPDATES[0];
  const note = noteFor(latest, languageCode());
  return `<section class="settings-card news-card"><h2>${t("news.title")}${fresh ? ` <span class="news-new">${t("news.new")}</span>` : ""}</h2><p>${t("news.current", { version: LATEST })}</p><details class="news-latest"${fresh ? " open" : ""}><summary><span class="news-version">V${esc(latest.version)}</span><time>${esc(latest.date)}</time><b>${esc(note.title)}</b></summary><ul>${note.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></details><button class="secondary" data-action="whats-new">${t("news.all")}</button></section>`;
}
function openWhatsNew() {
  const en = languageCode() === "en";
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet news-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("news.title")}</h2>${UPDATES.map((update) => {
    const note = noteFor(update, en ? "en" : "zh");
    return `<section class="news-entry"><header><span class="news-version">V${esc(update.version)}</span><time>${esc(update.date)}</time></header><h3>${esc(note.title)}</h3><ul>${note.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></section>`;
  }).join("")}<button class="primary full-width" data-action="choose-close">${t("news.ok")}</button></div>`;
  if (!dialog.open) dialog.showModal();
  markSeen();
}
function labsCardHTML() {
  const on = labsOn();
  const samples = state().entries.filter((e) => e.isDemo).length;
  const samplesCard = samples ? `<section class="settings-card samples-card"><h2>${t("samples.title")}</h2><p>${t("samples.note", { count: samples })}</p><button class="secondary" data-action="samples-remove">${t("samples.remove")}</button></section>` : "";
  return `${samplesCard}<section class="settings-card labs-card"><h2>${t("labs.title")}</h2><p>${t("labs.note")}</p><button class="${on ? "secondary" : "primary"}" data-action="labs-toggle" aria-pressed="${on}">${t(on ? "labs.turnOff" : "labs.turnOn")}</button></section>`;
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
    case "studio-back":
      flushDraft();
      if (readReturn) {
        returnToReading();
        return true;
      }
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
    // payload.habit: edit that habit (and offer to delete it).
    const h = payload?.habit || null;
    title = t(h ? "habit.edit" : "dialog.habitTitle");
    description = h ? t("habit.editHint") : t("dialog.habitDescription");
    fields = `<label class="field">${t("dialog.habitName")}<input name="title" required maxlength="40" placeholder="${t("dialog.habitPlaceholder")}" value="${esc(h?.title || "")}"></label><label class="field">${t("dialog.theme")}<input name="theme" required maxlength="30" list="theme-options" value="${esc(h?.theme || "Learning")}"><datalist id="theme-options">${["Fitness", "Learning", "Wellness", "Creative Life"].map((theme) => `<option value="${theme}">`).join("")}</datalist></label><div class="field-row"><label class="field">${t("dialog.kind")}<select name="kind"><option value="completion" ${h?.kind === "duration" ? "" : "selected"}>${t("dialog.completion")}</option><option value="duration" ${h?.kind === "duration" ? "selected" : ""}>${t("dialog.duration")}</option></select></label><label class="field">${t("dialog.target")}<input name="target" type="number" min="1" max="7" value="${h?.target || 3}" required></label></div><label class="field">${t("dialog.minutes")}<input name="minutes" type="number" min="1" max="1440" value="${h?.minutes || 20}" required></label>${h ? `<button type="button" class="danger-option habit-delete" data-action="delete-habit" data-habit="${esc(h.id)}">${t("habit.delete")}</button>` : ""}`;
  } else {
    title = t("dialog.durationTitle");
    description = `${payload.habit.title} · ${shortDate(payload.date)}`;
    fields = `<label class="field">${t("dialog.durationLabel")}<input name="minutes" type="number" min="1" max="1440" value="${payload.habit.minutes || 20}" required></label>`;
  }
  $("#dialog-form").innerHTML =
    `<h2>${title}</h2><p class="dialog-description">${esc(description)}</p><div class="dialog-fields">${fields}</div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">${t("cancel")}</button><button type="submit" class="primary">${t(kind === "duration" ? "dialog.record" : kind === "habit" && payload?.habit ? "save" : "create")}</button></div>`;
  $("#form-dialog").showModal();
}
// A written check-in opens as a little page to read first; Edit is inside.
function openCheckView(habitId, date) {
  const habit = state().habits.find((h) => h.id === habitId);
  const check = state().checks.find((c) => c.habitId === habitId && c.date === date);
  if (!habit || !check) return openCheckDialog(habitId, date);
  const photo = safePhoto(check.photo || "");
  const facts = [check.detail, check.minutes ? t("growth.minutes", { count: check.minutes }) : ""].filter(Boolean);
  const total = state().checks.filter((c) => c.habitId === habitId).length;
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet check-view"><div class="choose-grabber" aria-hidden="true"></div><header class="check-view-head"><span class="habit-symbol habit-book" aria-hidden="true">${themeIcon(habit.theme)}</span><div><small>${esc(shortDate(date))}${check.mood ? ` · ${esc(check.mood)}` : ""}</small><h2>${esc(habit.title)}</h2>${facts.length ? `<p class="check-view-facts">${esc(facts.join(" · "))}</p>` : ""}</div></header>${photo ? `<img class="check-view-photo" src="${esc(photo)}" alt="">` : ""}${check.note ? `<p class="check-view-note">${esc(check.note)}</p>` : `<p class="save-help">${t("growth.noNoteYet")}</p>`}<p class="save-help">${t("growth.privateNote")}</p><div class="check-view-actions"><button class="secondary" data-action="check-note" data-habit="${esc(habitId)}" data-date="${esc(date)}">✎ ${t("edit")}</button><button class="primary" data-action="habit-journey" data-habit="${esc(habitId)}">${t("journey.chip", { count: total })} ›</button></div></div>`;
  dialog.showModal();
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
      "save-float",
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
  if (actionName === "habit-menu") {
    // One place for a habit: change it, or delete it (asked first).
    const habit = state().habits.find((h) => h.id === target.dataset.habit);
    if (!habit) return;
    const dialog = $("#choose-dialog");
    dialog.innerHTML = `<div class="choose-sheet habit-menu-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${esc(habit.title)}</h2><button class="contribute-option" data-action="edit-habit" data-habit="${esc(habit.id)}"><b>✎ ${t("habit.edit")}</b><small>${t("habit.editHint")}</small></button><button class="contribute-option danger-option" data-action="delete-habit" data-habit="${esc(habit.id)}"><b>${t("habit.delete")}</b><small>${t("habit.deleteHint")}</small></button><button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
    if (!dialog.open) dialog.showModal();
    return;
  }
  if (actionName === "edit-habit") {
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    const habit = state().habits.find((h) => h.id === target.dataset.habit);
    if (habit) openDialog("habit", { habit });
  }
  if (actionName === "delete-habit") {
    const habit = state().habits.find((h) => h.id === target.dataset.habit);
    if (!habit) return;
    const count = state().checks.filter((c) => c.habitId === habit.id).length;
    $("#form-dialog").close();
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    if (!(await askConfirm(t("habit.deleteConfirm", { name: habit.title, count })))) return;
    // The habit and its check-ins go; check cards placed on pages are removed too.
    store.update((s) => {
      s.habits = s.habits.filter((h) => h.id !== habit.id);
      s.checks = s.checks.filter((c) => c.habitId !== habit.id);
      for (const e of [...s.entries, ...Object.values(s.drafts)])
        for (const p2 of [e, ...(e.moments || [])]) if (p2.layers) p2.layers = p2.layers.filter((l) => !(l.kind === "growth" && l.habitId === habit.id));
    });
    logEvent("habit_delete", {});
    toast(t("habit.deleted", { name: habit.title }));
    render();
  }
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
  if (actionName === "open-day") {
    if (target.dataset.revisit && keeperNow().enabled) saveKeeper((k) => !k.revisits.includes(dateKey()) && k.revisits.push(dateKey()));
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    openDay(target.dataset.date, target.dataset.moment);
  }
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
    // Opening a book from the shelf uses my own list / flip choice (after a
    // save showed the page in flip view).
    bookView = chosenBookView();
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
  if (actionName === "photo-browse") {
    browse = { collection: target.dataset.collection, pick: "" };
    renderPhotoBrowser({ keepScroll: false });
  }
  if (actionName === "photo-pick") {
    browse.pick = target.dataset.photo;
    renderPhotoBrowser();
  }
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
  if (actionName === "backfill") openQuickRecord({ date: target.dataset.date || "" });
  if (actionName === "quick-open") openQuickRecord({ way: target.dataset.way || "", photo: target.dataset.photo || "", date: target.dataset.date || "" });
  if (actionName === "quick-lib" && quick) {
    quick.lib = target.dataset.photoId;
    const scroll = document.querySelector(".quick-library")?.scrollTop || 0;
    renderQuickRecord();
    const grid = document.querySelector(".quick-library");
    if (grid) grid.scrollTop = scroll;
    return;
  }
  if (actionName === "quick-way" && quick) {
    quick.way = target.dataset.way;
    renderQuickRecord();
  }
  if (actionName === "quick-continue") {
    const date = quick?.date || dateKey();
    quick = null;
    $("#choose-dialog").close();
    openStudio(date);
  }
  if (actionName === "quick-more" && quick) await quickMore(target.dataset.more);
  if (actionName === "draw-new") {
    soundMenu = false;
    await drawOnPage();
  }
  if (actionName === "draw-edit" && selectedLayerOf()?.drawing) await drawOnPage(selectedLayer);
  if (actionName === "line-photo") openPhotoChooser("line");
  if (actionName === "smart-shuffle") {
    changeTarget((p) => {
      p.layoutVariant = ((Number(p.layoutVariant) || 0) + 1) % 3;
      applyLayout(p, "smart");
      // Decorations move with the new look (still only in empty corners).
      const kit = p.kit && findKit(catalog, p.kit);
      if (kit) decorate(p, kit, { seed: p.layoutVariant, caption: Boolean(p.title), makeId: id });
    });
    if (quickSession) quickSession.shuffles++;
    logEvent("layout_shuffle", { variant: activePage().layoutVariant });
  }
  if (actionName === "apply-smart") {
    const pageNow = activePage();
    if (pageNow.layoutEdited && !(await askConfirm(t("layout.confirm")))) return;
    changeTarget((p) => {
      if (p === editor) freeMainPhoto(p);
      applyLayout(p, "smart");
    });
    toast(t("layout.applied", { name: t("layout.smart") }));
  }
  if (actionName === "smart-caption") focusInline("title");
  if (actionName === "quick-edit") {
    quickResult = null;
    logEvent("quick_edit");
    render();
  }
  if (actionName === "quick-done") finishQuickPage();
  if (actionName === "book-view") {
    bookView = target.dataset.view === "flip" ? "flip" : "list";
    try {
      localStorage.setItem(BOOK_VIEW_KEY, bookView);
    } catch {}
    flipIndex = 0;
    render();
  }
  if (actionName === "flip") turnPage(Number(target.dataset.dir) || 0);
  if (actionName === "streak-open") openStreak({ celebrate: false });
  if (actionName === "streak-close") $("#streak-dialog")?.close();
  if (actionName === "streak-write") {
    $("#streak-dialog")?.close();
    openQuickRecord();
  }
  if (actionName === "page-menu") openPageMenu(target.dataset.date, target.dataset.moment || "");
  if (actionName === "read-edit") {
    if ($("#choose-dialog").open) $("#choose-dialog").close();
    const momentId = target.dataset.moment || "";
    const from = { page, book: selectedBook, date: selectedDate, moment: momentId };
    openStudio(target.dataset.date);
    selectMoment(momentId || null);
    if (from.page === "day" || from.page === "books") readReturn = { ...from, date: from.page === "day" ? target.dataset.date : from.date };
  }
  if (actionName === "read-rename") {
    $("#choose-dialog").close();
    const el = document.querySelector(`[data-title-edit][data-moment="${CSS.escape(target.dataset.moment || "")}"]`);
    if (el) startTitleEdit(el);
  }
  if (actionName === "read-delete") {
    $("#choose-dialog").close();
    await deleteReadPage(target.dataset.date, target.dataset.moment || "");
  }
  if (actionName === "samples-remove") {
    if (!(await askConfirm(t("samples.confirm")))) return;
    let removed = 0;
    store.update((next) => (removed = removeSamples(next)));
    render();
    toast(t("samples.removed", { count: removed }));
  }
  if (actionName === "book-step") {
    store.update((next) => stepBook(next, target.dataset.book, Number(target.dataset.dir) || 0));
    logEvent("book_reorder", { kind: "step" });
    render();
  }
  if (actionName === "book-share") await shareBook(target.dataset.book);
  if (actionName === "book-suggest") openSuggestedBook(target.dataset.preset);
  if (actionName === "contribute-interest") {
    logEvent("contribute_interest", { kind: target.dataset.kind });
    $("#choose-dialog").close();
    toast(t("bookShare.thanks"));
  }
  if (actionName === "greeting-name") return openNameSheet();
  if (actionName === "greeting-save") {
    const name = ($("[data-greeting-name]")?.value || "").trim().slice(0, 20);
    account = Account.signIn(localStorage, { name, avatar: account?.avatar });
    $("#choose-dialog").close();
    return render();
  }
  if (actionName === "keeper-onboard") {
    keeperDraft = null;
    return openKeeperOnboarding();
  }
  if (actionName === "keeper-invite-dismiss" || actionName === "keeper-onboard-later") {
    if (!keeperNow().enabled) saveKeeper((k) => (k.invite = "dismissed"));
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    return render();
  }
  if (actionName === "keeper-pick-animal" || actionName === "keeper-pick-mode") {
    keeperDraft.name = $("[data-keeper-name]")?.value || keeperDraft.name;
    if (actionName === "keeper-pick-animal") keeperDraft.animal = target.dataset.animal;
    else keeperDraft.mode = target.dataset.mode;
    return openKeeperOnboarding();
  }
  if (actionName === "keeper-start") {
    const d = { ...keeperDraft, name: ($("[data-keeper-name]")?.value || "").trim() };
    const index = keeperGrowth().index;
    saveKeeper((k) => Object.assign(k, { enabled: true, animal: d.animal, name: d.name, mode: d.mode, invite: "shown", lastStage: index, since: k.since || dateKey() }));
    keeperDraft = null;
    keeperLine = "";
    logEvent("keeper_on", { kind: d.mode });
    $("#choose-dialog").close();
    render();
    return toast(t("keeper.hello", { name: Keeper.keeperName(keeperNow(), languageCode()) }));
  }
  if (actionName === "keeper-tap") {
    keeperBounce(target);
    const k = keeperNow();
    if (Keeper.modeAllows(k, "chat")) return openKeeperChat();
    if (!Keeper.modeAllows(k, "invite")) return; // Quiet: just a little bounce
    keeperTaps++;
    keeperLine = t(`keeper.tap.${keeperTaps % 4}`, { name: Keeper.keeperName(k, languageCode()) });
    const bubble = $(".keeper-home .keeper-bubble");
    if (bubble) bubble.lastChild.textContent = keeperLine;
    else render();
    return;
  }
  if (actionName === "keeper-shelf-tap") {
    keeperBounce(target);
    const k = keeperNow();
    if (!Keeper.modeAllows(k, "invite")) return;
    keeperTaps++;
    const books = state().books;
    const lines = [t("keeper.shelf.count", { count: books.length }), t("keeper.shelf.latest", { title: books.at(-1)?.title || "" }), t("keeper.shelf.tidy")];
    keeperLine = lines[keeperTaps % lines.length];
    return render();
  }
  if (actionName === "keeper-feedback") return openKeeperFeedback(target.dataset.date, target.dataset.moment || "");
  if (actionName === "keeper-chat") return keeperAnswer(target.dataset.intent);
  if (actionName === "keeper-say") {
    const said = ($("[data-keeper-say]")?.value || "").trim();
    if (said) keeperAnswer("hello", said);
    return;
  }
  if (actionName === "keeper-set") {
    const { key, value } = target.dataset;
    saveKeeper((k) => {
      if (key === "animal" && Keeper.ANIMALS.includes(value) && value !== k.animal) {
        k.animal = value;
        k.outfit = "";
      }
      if (key === "outfit" && keeperOutfits(catalog, k.animal).includes(value)) k.outfit = value;
      if (key === "mode" && Keeper.MODES.includes(value)) k.mode = value;
    });
    return render();
  }
  if (actionName === "keeper-toggle") {
    const key = target.dataset.key;
    if (!["allowMemories", "proactive"].includes(key)) return; // AI consent waits for a secure service
    saveKeeper((k) => (k[key] = !k[key]));
    return render();
  }
  if (actionName === "keeper-disable") {
    // Off means off: no invitation on Today afterwards (Settings can bring it back).
    saveKeeper((k) => Object.assign(k, { enabled: false, invite: "dismissed" }));
    keeperLine = "";
    logEvent("keeper_off", {});
    toast(t("keeper.turnedOff"));
    return render();
  }
  if (actionName === "reminder-toggle") {
    const r = readReminder();
    saveReminder({ ...r, on: !r.on });
    logEvent("reminder_toggle", { kind: r.on ? "off" : "on" });
    toast(t(r.on ? "reminder.turnedOff" : "reminder.turnedOn", { time: r.time }));
    return render();
  }
  if (actionName === "shelf-tags-more") {
    shelfTagsOpen = !shelfTagsOpen;
    render();
    if (shelfTagsOpen) $("[data-tag-search]")?.focus();
    return;
  }
  if (actionName === "shelf-tag") {
    shelfTag = target.dataset.tag || "";
    shelfTagsOpen = false;
    selectedBook = null;
    page = "books";
    return render();
  }
  if (actionName === "open-search") return openSearch();
  if (actionName === "search-back") {
    page = searchReturn && searchReturn !== "search" ? searchReturn : "home";
    return render();
  }
  if (actionName === "memory-dismiss") {
    writeKey(MEMORY_DISMISS_KEY, dateKey());
    return render();
  }
  if (actionName === "backup-later") {
    writeKey(BACKUP_SNOOZE_KEY, addDays(dateKey(), 7));
    return render();
  }
  if (actionName === "lock-toggle") return showLock(AppLock.readLock() ? "off" : "set");
  if (actionName === "lock-change") return showLock("change");
  if (actionName === "lock-grace") {
    const lock = AppLock.readLock();
    const grace = Number(target.dataset.grace);
    if (lock && AppLock.GRACE_CHOICES.includes(grace)) AppLock.saveLock({ ...lock, grace });
    return render();
  }
  if (actionName === "lock-biometric") {
    const lock = AppLock.readLock();
    if (lock) AppLock.saveLock({ ...lock, biometric: !lock.biometric });
    return render();
  }
  if (actionName === "privacy-toggle") {
    const name = target.dataset.privacy;
    if (!PRIVACY_KEYS[name]) return;
    setPrivacy(name, !privacyOn(name));
    logEvent("privacy_toggle", { kind: name === "hideToday" ? "hide-today" : "share-list" });
    render();
    return;
  }
  if (actionName === "whats-new") {
    openWhatsNew();
  }
  if (actionName === "share-story") {
    // Stories size (9:16); the share sheet where supported, else a download.
    const result = await shareStory(activePage(), exportOptions());
    logEvent(result === "shared" ? "share" : "export", { size: "story", kind: result });
    if (result !== "cancelled") toast(t(result === "shared" ? "share.done" : "share.saved"));
  }
  if (actionName === "labs-toggle") {
    try {
      if (labsOn()) localStorage.removeItem(LABS_KEY);
      else localStorage.setItem(LABS_KEY, "1");
    } catch {}
    if (!labsOn()) {
      homeBooks = "mine";
      if (booksView !== "shelf") booksView = "shelf";
    }
    render();
    toast(t(labsOn() ? "labs.on" : "labs.off"));
  }
  if (actionName === "export-events") {
    // The local test log: what happened and when, no content. Shared only if
    // the tester chooses to send the file.
    const events = readEvents();
    const file = new Blob([JSON.stringify({ app: "Little Days", exported: new Date().toISOString(), summary: summarize(events), events }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `little-days-test-log-${dateKey()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    toast(t("testlog.saved", { count: events.length }));
  }
  if (actionName === "quick-book" && quick) {
    quick.book = target.dataset.book;
    renderQuickRecord();
  }
  if (actionName === "quick-photo" && quick) {
    quick.photo = target.dataset.photo || "";
    renderQuickRecord();
  }
  if (actionName === "quick-start" && quick) {
    quickSession = { started: quickOpenedAt || Date.now(), taps: quickTaps, shuffles: 0 };
    logEvent("quick_start", { way: quick.way, photo: quick.way === "photo" ? quick.photo : "" });
    await startQuickRecord();
  }
  if (actionName === "home-books") {
    homeBooks = target.dataset.view === "our" ? "our" : "mine";
    render();
  }
  if (actionName === "book-write") openQuickRecord({ book: target.dataset.book });
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
    booksView = ["profile", "our"].includes(target.dataset.view) ? target.dataset.view : "shelf";
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
    if (photoTarget === "line") chooseAttachment({ kind: "backdrop" });
    else if (photoTarget === "main") $("#photo-input").click();
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
  if (actionName === "plan-add") return addPlan();
  if (actionName === "plan-toggle")
    return savePlans(dateKey(), (list) => {
      const item = list.find((p) => p.id === target.dataset.plan);
      if (item) item.done = !item.done;
    });
  if (actionName === "plan-remove") return savePlans(dateKey(), (list) => list.splice(list.findIndex((p) => p.id === target.dataset.plan), 1));
  if (actionName === "plan-carry") {
    // Yesterday's unfinished things, only when asked (nothing moves by itself).
    const left = plansOf(addDays(dateKey(), -1)).filter((p) => !p.done);
    return savePlans(dateKey(), (list) => left.forEach((p) => list.length < MAX_PLANS && list.push({ id: id(), text: p.text, done: false })));
  }
  if (actionName === "today-photos" || actionName === "today-write" || actionName === "today-draw") {
    // Home's "what's worth keeping today?": start straight away, no sheet.
    quickOpenedAt = Date.now();
    quickTaps = 1;
    const way = actionName === "today-photos" ? "photo" : actionName === "today-draw" ? "draw" : "write";
    logEvent("quick_open", { way, from: "home" });
    quick = { date: dateKey(), book: lastQuickBook() || todayEntry()?.bookId || state().books[0]?.id || "daily", way, photo: "mine", fromHome: true };
    quickSession = { started: quickOpenedAt, taps: 1, shuffles: 0 };
    await startQuickRecord();
    return;
  }
  if (actionName.startsWith("story-")) {
    await storyAction(actionName, target);
    return;
  }
  if (actionName === "music-sheet") {
    soundMenu = false;
    if (page === "studio") render();
    openMusicSheet(target.dataset.target === "book" ? "book" : "page");
  }
  if (actionName === "music-preview") {
    const track = findTrack(catalog, target.dataset.music);
    if (music.current() === track?.id && music.playing()) {
      music.pause();
      syncMusicChips();
    } else music.play(track);
  }
  if (actionName === "music-pick") chooseMusic(target.dataset.music);
  if (actionName === "music-none") chooseMusic("");
  if (actionName === "music-toggle") toggleMusic(target.dataset.music);
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
  if (actionName === "save-entry" || actionName === "save-float") {
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
    syncReminder();
    toast(t("这一天，已经好好收藏。🌷"));
    if (readReturn?.page === "story" && story) {
      readReturn = null;
      finishStory();
    } else if (readReturn) returnToReading();
    else showSavedPage();
  }
  if (actionName === "export") {
    logEvent("export", { size: "feed" });
    // The day's first page carries the day's list underneath (as in the book).
    const first = activePage() === (hasDayPageContent(editor) ? editor : editor.moments[0] || editor);
    await exportJournalImage(activePage(), { ...exportOptions(), dayList: first && privacyOn("shareList") ? dayListItems(editor.date) : [] });
    toast(t("export.photoDone"));
  }
}

document.addEventListener("click", (event) => {
  // In the story preview the whole page is one target: tap it to add words.
  const target = event.target.closest(".story-canvas") || event.target.closest("[data-action]");
  // Taps from opening the record sheet to finishing a page (test log only).
  if (target) {
    quickTaps++;
    if (quickSession) quickSession.taps++;
  }
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
  if (target.dataset?.storyLine != null && story) {
    const group = story.groups[Number(target.dataset.storyLine)];
    if (group) group.line = target.value.slice(0, 70);
    return;
  }
  if (target.dataset?.musicVolume != null) {
    const value = saveVolume(Number(target.value) / 100);
    music.setVolume(value);
    const out = target.parentElement?.querySelector("output");
    if (out) out.textContent = `${Math.round(value * 100)}%`;
    return;
  }
  if (target.dataset?.inline || target.dataset?.inlineLayer) {
    inlineInput(target);
    return;
  }
  if (target.dataset?.dayBook != null) {
    changeEditor((e) => {
      e.bookId = target.value;
    });
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
  if (event.target.dataset?.storyDate != null && story) {
    moveStoryTo(event.target.value);
    return;
  }
  if (event.target.dataset?.storyBook != null && story) {
    // The whole story goes into the chosen book.
    story.book = event.target.value;
    changeEditor((entry) => {
      for (const momentId of story.made?.ids || []) {
        const m = findMoment(entry, momentId);
        if (m) m.bookId = story.book;
      }
      if (story.made?.cover) entry.bookId = story.book;
    }, false);
    flushDraft();
    return;
  }
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
      if (dialogKind === "book") logEvent("book_create");
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
    if (dialogKind === "habit" && dialogPayload?.habit) {
      // Editing: name, theme, kind and goal; check-ins stay as they are.
      if (!values.title.trim() || !values.theme.trim()) return;
      store.update((s) => {
        const h = s.habits.find((x) => x.id === dialogPayload.habit.id);
        if (!h) return;
        Object.assign(h, { title: values.title.trim(), theme: values.theme.trim(), kind: values.kind, target: Number(values.target), minutes: values.kind === "duration" ? Number(values.minutes) : 0 });
      });
    } else if (dialogKind === "habit") {
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
// Cancelled the photo picker on the way in: nothing was started, so I stay
// where I was. From the "how shall we keep today?" sheet, the sheet comes
// back with the same choices.
$("#attachment-image-input").addEventListener("cancel", () => {
  if (attachmentTarget?.kind !== "quick" || !attachmentTarget.book) return;
  const choices = lastQuick;
  attachmentTarget = null;
  lastQuick = null;
  if (choices && !choices.fromHome) openQuickRecord({ way: choices.way, photo: choices.photo, book: choices.book, date: choices.date });
});
$("#video-input").addEventListener("change", (event) =>
  handleMediaUpload(event, "video"),
);
// Closing the music sheet ends a preview (and resumes what the view plays).
$("#choose-dialog").addEventListener("close", () => syncMusic());
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
    if (layer.kind === "photo" && layer.mediaRef && !layer.drawing) markSwapTarget(event, layer);
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
// Drag a photo onto another photo: they change places. Each takes the
// other's spot (centre, tilt) in its own shape, fitted into that frame.
function swapCandidate(event, layer) {
  const rect = drag?.rect;
  if (!rect) return null;
  const px = ((event.clientX - rect.left) / rect.width) * 100,
    py = ((event.clientY - rect.top) / rect.height) * 100;
  // A small nudge is a move, not a swap (photos in a collage overlap): the
  // photo must travel a real distance and the finger land on the middle of
  // the other photo.
  const travelled = Math.hypot(layer.x - drag.start.x, layer.y - drag.start.y);
  if (travelled < 10) return null;
  const others = activePage().layers.filter((l) => l.id !== layer.id && l.kind === "photo" && l.mediaRef && !l.drawing);
  // The top-most photo under the finger (layers later in the list are on top).
  for (let i = others.length - 1; i >= 0; i--) {
    const o = others[i];
    const w = Number(o.w) || 42,
      h = Number(o.h) || 34;
    if (Math.abs(px - o.x) <= w * 0.32 && Math.abs(py - o.y) <= h * 0.32) return o;
  }
  return null;
}
function markSwapTarget(event, layer) {
  const target = swapCandidate(event, layer);
  const id = target?.id || null;
  if (drag.swapWith === id) return;
  document.querySelectorAll("#journal-canvas .swap-target").forEach((el) => el.classList.remove("swap-target"));
  drag.swapWith = id;
  if (id) layerElement(id)?.classList.add("swap-target");
}
function swapPhotos(a, b, from) {
  const fit = (layer, box) => {
    const aspect = layer.aspect || ((Number(layer.w) || 42) / (Number(layer.h) || 34)) * 0.8;
    const size = fitPhoto(aspect, box.w, box.h, layer.frame || "border");
    return { x: box.x, y: box.y, w: Math.round(size.w * 100) / 100, h: Math.round(size.h * 100) / 100, rotation: box.rotation };
  };
  const spotB = { x: b.x, y: b.y, w: Number(b.w) || 42, h: Number(b.h) || 34, rotation: b.rotation || 0 };
  const spotA = { x: from.x, y: from.y, w: from.w, h: from.h, rotation: from.rotation || 0 };
  Object.assign(a, fit(a, spotB));
  Object.assign(b, fit(b, spotA));
  // The one dropped also takes the other's place in the stacking order.
  const page2 = activePage();
  const ia = page2.layers.indexOf(a),
    ib = page2.layers.indexOf(b);
  if (ia >= 0 && ib >= 0) [page2.layers[ia], page2.layers[ib]] = [page2.layers[ib], page2.layers[ia]];
}
function commitGesture() {
  if (!drag) return;
  const { moved, before, layer, tapToEdit, swapWith, start } = drag;
  drag = null;
  document.querySelectorAll("#journal-canvas .swap-target").forEach((el) => el.classList.remove("swap-target"));
  const other = swapWith && activePage().layers.find((l) => l.id === swapWith);
  if (moved && other) {
    swapPhotos(layer, other, start);
    logEvent("photo_swap", { kind: activePage().layoutTemplate || "free" });
    toast(t("photo.swapped"));
  }
  if (moved) {
    history.push(before);
    if (history.length > 30) history.shift();
    future = [];
    if (layer.kind === "photo") {
      if (!activePage().layoutEdited) logEvent("layout_manual_edit", { kind: activePage().layoutTemplate || "free" });
      activePage().layoutEdited = true;
    }
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
    tags: parseTags(values.tags || ""),
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
  $("#attachment-image-input").multiple = ["collage", "quick"].includes(target.kind);
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
  if (!name?.startsWith("community-") && !name?.startsWith("space-")) return false;
  const demo = social();
  const work = communityView.workId;
  const user = target.dataset.user;
  try {
    switch (name) {
      case "community-tab":
        openCommunity({ tab: target.dataset.tab, workId: null, chatUser: null, publish: null, userId: null });
        $("#app-scroll").scrollTop = 0;
        break;
      case "community-open-work":
        openCommunity({ workId: target.dataset.work, replyTo: null });
        $("#app-scroll").scrollTop = 0;
        break;
      case "community-back":
        openCommunity({ workId: null, userId: null });
        break;
      case "community-open-user":
        if (target.dataset.user && target.dataset.user !== "me") openCommunity({ userId: target.dataset.user, workId: null, chatUser: null, publish: null, tab: communityView.tab || "discover" });
        $("#app-scroll").scrollTop = 0;
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
        openCommunity({ tab: "messages", chatUser: user, workId: null, userId: null });
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
      case "space-avatar":
        Community.updateProfile(demo, { avatarPhoto: `photo:${target.dataset.photo}` });
        persistSocial();
        openCommunity();
        break;
      case "space-avatar-clear":
        Community.updateProfile(demo, { avatarPhoto: "" });
        persistSocial();
        openCommunity();
        break;
      case "space-avatar-upload":
        chooseAttachment({ kind: "avatar" });
        break;
      case "space-dress":
        openCommunity({ dress: !communityView.dress });
        break;
      case "space-shelf":
        openCommunity({ shelfPick: !communityView.shelfPick });
        break;
      case "space-banner":
        Community.updateSpace(demo, { banner: `photo:${target.dataset.photo}` });
        persistSocial();
        openCommunity();
        break;
      case "space-accent":
        Community.updateSpace(demo, { accent: target.dataset.accent });
        persistSocial();
        openCommunity();
        break;
      case "space-dress-tab":
        openCommunity({ dress: true, dressTab: target.dataset.tab });
        break;
      case "space-look":
        Community.updateSpace(demo, { look: target.dataset.look });
        persistSocial();
        openCommunity();
        break;
      case "space-frame":
        Community.updateSpace(demo, { frame: target.dataset.frame });
        persistSocial();
        openCommunity();
        break;
      case "space-layout":
        Community.updateSpace(demo, { layout: target.dataset.layout });
        persistSocial();
        openCommunity();
        break;
      case "space-save":
        Community.updateSpace(demo, { motto: $("#space-motto")?.value || "" });
        persistSocial();
        toast(t("space.saved"));
        openCommunity({ dress: false });
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
  return exportOptionsFor(isDayPage(), editor.date, isDayPage() ? "" : `moment-${editor.moments.indexOf(page) + 1}`);
}
function exportOptionsFor(dayPage, date, suffix = "", withList = false) {
  return {
    // The day's list is private: only with "include it" switched on.
    dayList: withList && privacyOn("shareList") ? dayListItems(date) : [],
    dayListTitle: t("day.checklist"),
    resolvePhoto: safePhoto,
    catalog,
    fontFamily,
    dayPage,
    date,
    suffix,
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
    music.stop();
    const track = findTrack(catalog, pageMusic(activePage(), state().books, editor.bookId));
    await exportJournalVideo(activePage(), {
      ...exportOptions(),
      music: track ? await music.url(track) : "",
      musicVolume: music.volume(),
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
      if ($("#choose-dialog").open) $("#choose-dialog").close();
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
    case "pages-manage":
      if (target.dataset.date) openStudio(target.dataset.date);
      openPagesManage();
      return true;
    case "pages-open":
      $("#choose-dialog").close();
      selectMoment(momentId);
      return true;
    case "page-move":
      changeEditor((entry) => moveMoment(entry, target.dataset.moment, Number(target.dataset.dir) || 0));
      renderPagesManage();
      return true;
    case "page-remove":
      await removePage(target.dataset.moment);
      if ($("#choose-dialog").open) renderPagesManage();
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
    case "day-page-clear": {
      // "I don't want a day page": clear it (the day's stories stay).
      if (!(await askConfirm(t("write.clearDayConfirm")))) return true;
      changeEditor((entry) => {
        entry.title = "";
        entry.body = "";
        entry.photo = "";
        entry.layers = [];
        entry.media = [];
        entry.fieldValues = {};
      });
      selectedLayer = null;
      if (editor.moments.length) selectMoment(editor.moments[0].id);
      if ($("#choose-dialog").open && $("#choose-dialog .pages-sheet")) renderPagesManage();
      toast(t("write.dayCleared"));
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
      selectMoment(!hasDayPageContent(editor) && editor.moments.length ? editor.moments.at(-1).id : null);
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
        Boolean(page.photo) || page.layers.some((layer) => framedPhoto(layer) && layer.mediaRef);
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
          // Each new card sits a little lower and tilts the other way, so
          // several check-ins never land on top of each other.
          x: 50 + (page.layers.filter((l) => l.kind === "growth").length % 2 ? 4 : -2),
          y: Math.min(86, 50 + page.layers.filter((l) => l.kind === "growth").length * 13),
          w: 62,
          scale: 1,
          rotation: page.layers.filter((l) => l.kind === "growth").length % 2 ? 2 : -2,
        };
        page.layers.push(layer);
        selectedLayer = layer.id;
      });
      toast(t("growth.insertedToast"));
      return true;
    }
    case "check-note":
      if ($("#choose-dialog").open) $("#choose-dialog").close();
      openCheckDialog(target.dataset.habit, target.dataset.date);
      return true;
    case "check-view":
      openCheckView(target.dataset.habit, target.dataset.date);
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
    writeKey(BACKUP_AT_KEY, dateKey());
    logEvent("backup", {});
    if (["home", "settings"].includes(page)) {
      render();
      if (page === "settings") showMediaUsage();
    }
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
// The shape (width / height) of each picture we keep, for the smart layout.
const imageAspects = new WeakMap();
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
      (blob) => {
        if (blob) imageAspects.set(blob, canvas.width / canvas.height);
        return blob ? resolve(blob) : reject(new Error("Image encoding failed"));
      },
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
  const multiple = ["photos", "collage", "quick"].includes(target?.kind);
  let failed = 0;
  try {
    let saved = [];
    // Every Blob is written to IndexedDB before any metadata references it.
    for (const file of files.slice(0, multiple ? MAX_PHOTOS_PER_PICK : 1)) {
      try {
        // When it was taken: read before shrinking (re-encoding drops EXIF).
        const shot = target?.kind === "quick" ? await photoTime(file) : null;
        const blob = await imageBlob(file),
          aspect = imageAspects.get(blob),
          mediaId = await media.put(blob, { kind: "photo", name: file.name, aspect });
        saved.push({ reference: `media:${mediaId}`, name: file.name, aspect, time: shot?.time ?? null, exif: shot?.source === "exif" });
      } catch (error) {
        if (!multiple) throw error;
        failed++;
      }
    }
    if (!saved.length) throw new Error(t("media.failed"));
    // New photos for the page open in the photo editor first (skip = as is).
    if (["photos", "replace"].includes(target?.kind)) saved = (await editPhotos(saved, "add")) || saved;
    const [{ reference }] = saved;
    if (target?.kind === "quick") {
      // The page starts only now that photos were chosen (see startQuickRecord).
      if (target.book) startPage(target.book, target.date || dateKey());
      // Quick Create: my photos, laid out in their own shapes; no editor.
      // Taken at different times of the day: today's story (one page each).
      // Quick Create V2: every pick becomes a designed story (one Moment too).
      startStory(groupByTime(saved));
    } else if (target?.kind === "backdrop") {
      // My own photo as the whole page (photo + one line).
      changeTarget((p) => {
        if (p === editor) return;
        p.backdrop = reference;
        p.layoutTemplate = "line";
      });
      flushDraft();
      focusInline("title");
    } else if (target?.kind === "avatar") {
      // My own photo as my avatar (kept in this device's media store).
      Community.updateProfile(social(), { avatarPhoto: reference });
      persistSocial();
      openCommunity();
    } else if (target?.kind === "cover") {
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
          // The new photo takes the old one's place, in its own shape.
          if (saved[0].aspect && !layer.shape && !layer.drawing) {
            const box = fitPhoto(saved[0].aspect, Number(layer.w) || 42, Number(layer.h) || 34, layer.frame || "border");
            layer.aspect = Math.round(saved[0].aspect * 1000) / 1000;
            layer.w = Math.round(box.w * 100) / 100;
            layer.h = Math.round(box.h * 100) / 100;
          }
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
    if (target?.kind !== "quick" || failed) toast(
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
    if ((page.layoutTemplate === "text" || page.layoutTemplate === "line") && saved.length) noteToLayout(page);
    if (hadSlots && !remaining.length) {
      selectedLayer = null;
      return;
    }
    saved = remaining;
    const existing = page.layers.filter(framedPhoto).length;
    const added = saved.map(({ reference, name, sourceRef, edit, aspect }, index) =>
      photoLayer(reference, name, {
        ...(sourceRef ? { sourceRef, edit } : {}),
        ...(aspect ? { aspect: Math.round(aspect * 1000) / 1000 } : {}),
        x: Math.min(85, 30 + ((existing + index) % 6) * 8),
        y: Math.min(80, 22 + ((existing + index) % 6) * 6),
        rotation: [-4, 3, -2, 5, -3, 2][(existing + index) % 6],
      }),
    );
    page.layers.push(...added);
    if (!page.layoutEdited) {
      const total = existing + added.length;
      if (page.layoutTemplate === "smart") applyLayout(page, "smart");
      else applyLayout(page, suggestLayout(total), photoRegion());
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
  // App lock: before anything personal is drawn.
  if (AppLock.readLock()) showLock("unlock");
  tellShellLock();
  // V7.5: the journal itself lives in IndexedDB (room for years of pages);
  // LocalStorage keeps a mirror while it fits.
  const meta = new MetaStore();
  let durableRaw = null;
  try {
    durableRaw = await meta.read();
  } catch (error) {
    console.warn("Journal database unavailable", error?.name);
  }
  store = new Store(localStorage, responses[2], undefined, {
    durableRaw,
    persist: (raw) => meta.write(raw),
    onPersistError: () => toast(t("storage.saveFailed")),
  });
  // Ask the browser / iOS not to clear this app's storage when space runs low.
  navigator.storage?.persist?.().catch(() => {});
  account = Account.loadAccount(localStorage);
  // Without Labs there is no sign-in page or tour: open straight onto Home.
  if (!labsOn() && !Account.isSignedIn(account)) {
    Account.signIn(localStorage, {});
    account = Account.finishTour(localStorage);
  }
  let warning = "";
  try {
    await media.open();
    await media.hydrate(state());
    // My uploaded avatar lives in the media store too (demo profile data).
    const avatarRef = social().profile?.avatarPhoto || "";
    if (avatarRef.startsWith("media:")) await media.acquire([avatarRef.slice(6)], "app");
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
  // The iPhone app: refresh the reminders, and hear about a tapped one.
  syncReminder();
  try {
    reminderBridge()?.postMessage({ type: "ready" });
  } catch {}
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
// Enter adds a thing to do (Home, Labs).
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches?.("[data-plan-input]")) {
    event.preventDefault();
    addPlan();
  }
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
