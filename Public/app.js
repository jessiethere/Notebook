import { MediaStore, migrateLegacyPhotos, mediaReferences, errName } from "./js/media.mjs";
import * as MediaCheck from "./js/media-check.mjs";
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
  fieldLabel,
} from "./js/personal-ui.mjs";
import { loadImage, exportJournalImage, exportJournalVideo, shareStory, renderJournalCanvas, renderBookTitleCanvas } from "./js/export.mjs";
import { bookSharePages, limitPages, dateRange, buildPdf } from "./js/book-share.mjs";
import { photoTime } from "./js/exif.mjs";
import * as AppLock from "./js/app-lock.mjs";
import { MetaStore } from "./js/meta-store.mjs";
import { decideJournalOpen, hasTraces, RESCUE_KEY } from "./js/journal-open.mjs";
import { isSampleDay, dayOf, dayCounts, bookCounts, visiblePages, isDayCover } from "./js/pages.mjs";
import { searchJournal, onThisDay, terms as searchTerms } from "./js/search.mjs";
import * as Keeper from "./js/keeper.mjs";
import { understand as understandChat, REQUEST_INTENTS } from "./js/keeper-chat.mjs";
import * as Rich from "./js/rich-text.mjs";
import * as Reader from "./js/reader.mjs";
import * as Guide from "./js/studio-guide.mjs";
import * as PM from "./js/profile-mark.mjs";
import * as CaptainAI from "./js/captain-ai.mjs";
import { keeperImage, keeperLooks, DEFAULT_OUTFIT } from "./js/keeper-art.mjs";
import { groupByTime, movePhoto, splitAt, removePhoto, clockLabel, partOfDay, timelineLayers } from "./js/day-story.mjs";
import { kitList, findKit, kitForBook, kitName, applyKit, firstLook, decorate } from "./js/story-style.mjs";
import { STYLES, STYLE_LOOK, styleOf, layoutMoment, layoutDay, heroIndex, fitPhoto, applyType, typeScale, TYPE_SCALES, textBlock, pickFont, PAGE_RATIO, PAIR_KINDS, suggestSplit, suggestTextSplit } from "./js/scrapbook-layout.mjs";
import { createMusicPlayer, musicTracks, findTrack, trackName, trackMood, clock, dayMusic, bookMusic, pageMusic, musicChipHTML, loadVolume, saveVolume } from "./js/music.mjs";
import {
  backdropOf,
  canvasHTML as sharedCanvasHTML,
  layerGeometry,
  cropStyle,
  cropOf,
  formatDuration,
  growthCardInner,
  textCSS,
} from "./js/canvas.mjs";
import { dayDetailHTML } from "./js/day-view.mjs";
import * as PL from "./js/page-label.mjs";
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
import { renderEdited, isIdentity, normalizeEdit } from "./js/photo-edit.mjs";
import { openCropEditor } from "./js/crop-editor.mjs";
import * as Crop from "./js/crop.mjs";
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
  MIRROR_OFF_KEY,
  dateKey,
  addDays,
  weekStart,
  weeklyCount,
  toggleCheck,
  saveEntry,
  entryStatus,
  saveBook,
  parseTags,
  moveBookTo,
  removeSamples,
  stepBook,
  normalizeState,
} from "./js/model.mjs";

// The iOS Swift shell opens index.html?shell=ios (and also injects this marker).
// Development only: ?dev-local-ai=<model> / =off on a page served from this
// computer switches Captain's optional local-model chat (js/captain-ai.mjs).
CaptainAI.applyDevParam(location.search);
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
// V10.21: a picture / clip that fails to load gets one fresh URL from its
// stored bytes; if the bytes are gone it is shown as missing (never faked).
// V10.22: the local log tells the kinds of failure apart —
//   media_url_failed     the page's temporary address stopped working, the
//                        stored data was fine and a new address fixed it
//   media_decode_failed  the stored data is there but will not open
//   media_unreadable     the stored data cannot be read (or is gone)
const mediaTag = (el) => (el instanceof HTMLImageElement ? "photo" : el instanceof HTMLVideoElement ? "video" : "audio");
document.addEventListener(
  "error",
  async (event) => {
    const el = event.target;
    if (!(el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLAudioElement)) return;
    const src = el.getAttribute("src") || "";
    if (!src.startsWith("blob:")) return;
    const id = media.idOfUrl(src);
    if (!id) return;
    const kind = mediaTag(el);
    if (await media.refresh(id)) {
      el.setAttribute("src", media.resolve(`media:${id}`));
      logEvent("media_url_failed", { kind, stage: el.closest("#journal-canvas") ? "studio" : "view" });
    } else {
      el.closest(".photo-layer, .media-layer")?.classList.add("media-broken");
      const record = await media.get(id).catch(() => null);
      const hasData = record?.bytes?.byteLength > 0;
      logEvent(hasData ? "media_decode_failed" : "media_unreadable", { kind, err: el.error ? "mediaerror" + el.error.code : "" });
    }
  },
  true,
);
// Ask the browser to keep this device's journal and media (best effort; on
// iPhone, Safari may still clear sites unused for a long time).
try {
  navigator.storage?.persist?.().catch(() => {});
} catch {}
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
// V10.22: what went wrong with a file goes to the local log (see media-check.mjs).
media.onEvent = (name, data) => logEvent(name, data);
// V10.25: 精确调整 in 图层 stays open / closed as the person left it.
document.addEventListener("toggle", (event) => {
  if (event.target.matches?.("details.layer-precise")) layerPreciseOpen = event.target.open;
}, true);
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
// V10.41 (counts): "12 天 · 28 页" / "12 days · 28 pages" (1 day, 1 page in English).
const pagesLabel = (n) => t(n === 1 ? "count.page" : "count.pages", { count: n });
const daysPagesLabel = (days, pages) => `${t(days === 1 ? "count.day" : "count.days", { count: days })} · ${pagesLabel(pages)}`;
const todayEntry = () =>
  state().entries.find((entry) => entry.date === dateKey() && !isSampleDay(entry));

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
  // V10.21: "已保存" only once every photo / video / sound this day uses is
  // really in this device's media store (not only the page's words).
  confirmMediaSaved();
}
let mediaCheck = 0;
async function confirmMediaSaved() {
  const run = ++mediaCheck;
  const ids = editor ? [...mediaReferences({ entries: [], books: [], checks: [], drafts: { day: editor } })] : [];
  setDraftState("saving");
  let missing = [];
  try {
    missing = ids.length ? await media.missing(ids) : [];
  } catch {
    missing = ids;
  }
  // A2: and the words themselves must be in the journal database, not only
  // on their way there.
  const stored = await store.stored();
  if (run !== mediaCheck) return;
  if (!stored) {
    setDraftState("failed");
    return;
  }
  if (missing.length) {
    setDraftState("failed");
    toast(t("media.notSaved", { count: missing.length }));
    logEvent("media_not_saved", { count: missing.length });
  } else setDraftState("saved");
}
function scheduleDraft() {
  draftDirty = true;
  studioTouched = true;
  setDraftState("saving");
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
      setDraftState("failed");
    }
  }, 450);
}
// The save state at the top of the editor: saved / saving / not saved (tap to
// retry). The long wording stays for screen readers.
let draftState = "saved";
const DRAFT_LONG = { saved: "已保存在本机", saving: "正在保存…", failed: "还没保存下来，请勿关闭页面" };
// Saved is about the device (the words are stored); Draft / Completed is
// about the record (still being made, or finished). Both show at the top.
let studioTouched = false; // something changed since the editor was opened
function editorStatus() {
  const saved = state().entries.find((entry) => entry.date === editor?.date && !entry.isDemo);
  return saved && saved.status !== "draft" ? "completed" : "draft";
}
function editorIsEmpty() {
  return !editor.title.trim() && !editor.body.trim() && !editor.photo && !editor.media.length && !editor.layers.length && !editor.moments.length;
}
// Nothing worth asking about: no cover content and only blank pages.
function editorHasNothing() {
  return !hasDayPageContent(editor) && !editor.moments.some((moment) => hasMomentContent(moment) || moment.backdrop);
}
function draftStatusInner(state = draftState) {
  const status = editor ? editorStatus() : "draft";
  return `<i aria-hidden="true"></i><span class="ds-lines"><span>${t("draft." + state)}</span><small class="ds-status" data-status="${status}">${t("status." + status)}</small></span><span class="visually-hidden">${t(DRAFT_LONG[state])}</span>`;
}
function setDraftState(next) {
  draftState = next;
  const el = $("#draft-status");
  if (!el) return;
  el.dataset.state = next;
  el.disabled = next !== "failed";
  el.innerHTML = draftStatusInner(next);
}
// Try once more to keep the draft; true when it is safely stored.
function retryDraft() {
  try {
    draftDirty = true;
    flushDraft();
    return true;
  } catch {
    setDraftState("failed");
    return false;
  }
}
// A page that has just been opened or set up has nothing to undo.
function resetHistory() {
  history = [];
  future = [];
  document.querySelectorAll('[data-action="undo"], [data-action="redo"]').forEach((button) => (button.disabled = true));
}
function changeEditor(change, redraw = true) {
  history.push(structuredClone(editor));
  if (history.length > 30) history.shift();
  future = [];
  change(editor);
  reconcileMarks(history[history.length - 1], editor);
  scheduleDraft();
  if (redraw) render();
  else updateCanvas();
}
// Words changed through a plain field, a template or a tool (not typed on the
// paper): the formatting stays on the characters it belonged to.
function reconcileMarks(before, after) {
  if (!before || !after) return;
  const pages = (entry) => [entry, ...(entry.moments || [])];
  const fix = (now, was, textKey, marksKey) => {
    const marks = now[marksKey];
    if (!Array.isArray(marks) || !marks.length) return;
    const text = String(now[textKey] ?? ""),
      old = String(was?.[textKey] ?? "");
    // The change set the marks itself (or the words are the same): just keep them tidy.
    if (text === old || JSON.stringify(marks) !== JSON.stringify(was?.[marksKey] || [])) return void Rich.storeMarks(now, marksKey, marks, text.length);
    Rich.storeMarks(now, marksKey, Rich.editMarks(marks, old, text), text.length);
  };
  const old = new Map(pages(before).map((pg, i) => [i === 0 ? "" : pg.id, pg]));
  pages(after).forEach((pg, i) => {
    const was = old.get(i === 0 ? "" : pg.id);
    if (!was) return;
    fix(pg, was, "title", "titleMarks");
    fix(pg, was, "body", "bodyMarks");
    const layers = new Map((was.layers || []).map((layer) => [layer.id, layer]));
    for (const layer of pg.layers || []) if (layer.kind === "text" && layers.has(layer.id)) fix(layer, layers.get(layer.id), "text", "marks");
  });
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
  // B5: Growth (habits, streak) is frozen for now — reachable with Labs on; nothing is deleted.
  if (target === "growth" && !labsOn()) target = "home";
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
  if (back.page === "reader") {
    // The same page (by identity), drawn again with what was just saved.
    selectedDate = back.date;
    return openReader(back.book, back.key || "resume");
  }
  page = back.page;
  selectedBook = back.book;
  selectedDate = back.date;
  flipTurn = 0;
  render();
  if (back.page === "day" && back.moment) document.getElementById(`moment-${back.moment}`)?.scrollIntoView({ block: "start" });
}
function openStudio(date = dateKey()) {
  readReturn = null;
  studioPreview = false;
  studioTouched = false;
  draftState = "saved";
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
        mood: "",
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
    .filter((tab) => labsOn() || !(tab.labs || LAB_PAGES.includes(tab.id)))
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
    ...moments.map((m) => PL.pageLine(m, { t, index: (entry.moments || []).indexOf(m) })),
  ].filter(Boolean);
  const shots = photos
    .map((ref) => safePhoto(ref))
    .filter(Boolean)
    .slice(0, 3);
  const extras = [
    // V10.41 (counts): this day's pages in this book — its own page (if shown) and its Moment pages.
    (moments.length + (day.dayPage ? 1 : 0)) > 1 ? pagesLabel(moments.length + (day.dayPage ? 1 : 0)) : "",
    clips.some((c) => c.kind === "video") ? "◈" : "",
    clips.some((c) => c.kind === "audio") ? "♫" : "",
  ].filter(Boolean);
  // V10.16: a day with several pages in this book shows how many, and a row
  // of its pages: each opens the reader at that page. One page: the card
  // itself opens it. (The pages are the reader's own list — nothing copied.)
  const all = selectedBook ? flipPages(selectedBook) : [];
  const ofDay = all.map((item, i) => ({ item, at: i + 1 })).filter(({ item }) => item.date === day.date);
  const card = `<button class="day-cover" data-action="reader-open" data-book="${esc(selectedBook || "")}" data-date="${day.date}"><span class="day-cover-photos n${shots.length}">${shots.length ? shots.map((src) => `<img src="${esc(src)}" alt="">`).join("") : `<span class="day-cover-mood">${esc(entry.mood || "✿")}</span>`}</span><span class="day-cover-copy"><span class="day-cover-date"><b>${date.getDate()}</b><span>${esc(date.toLocaleDateString(locale(), { month: "short", weekday: "short" }))}</span>${entry.isDemo ? "" : draftTagHTML(day.date)}${entry.mood ? `<i>${esc(entry.mood)}</i>` : ""}</span><strong>${esc(titles[0] || PL.dayLabel(entry, { t }))}</strong>${titles.length > 1 ? `<ul>${titles
    .slice(1, 4)
    .map((title) => `<li>${esc(title)}</li>`)
    .join("")}</ul>` : ""}${extras.length ? `<small>${esc(extras.join(" · "))}</small>` : ""}</span></button>`;
  if (ofDay.length < 2) return card;
  // Not <button>s: a small page can hold its own play button (buttons cannot nest).
  const thumbs = ofDay
    .map(({ item, at }) => {
      const page = item.moment || item.entry;
      const label = [t("reader.pageShort", { n: at }), item.moment?.time || "", String(page.title || "").trim()].filter(Boolean).join(" · ");
      return `<div class="day-page-thumb" role="button" tabindex="0" data-action="reader-open" data-book="${esc(selectedBook)}" data-key="${esc(Reader.keyOf(item))}" aria-label="${esc(label)}"><span class="reader-thumb-paper" inert>${sharedCanvasHTML(page, ctx(), { readOnly: true, dayPage: !item.moment })}</span><small><b>${esc(t("reader.pageShort", { n: at }))}</b>${item.moment?.time ? `<i>${esc(item.moment.time)}</i>` : ""}</small></div>`;
    })
    .join("");
  return `<div class="day-group">${card}<div class="day-pages" role="group" aria-label="${esc(t("day.pagesOf", { date: date.toLocaleDateString(locale(), { month: "long", day: "numeric" }) }))}">${thumbs}</div></div>`;
}
function bookCard(book) {
  const count = bookCounts(state(), book.id).pages, countDays = bookCounts(state(), book.id).days;
  return `<button class="book-item" data-action="book" data-book="${esc(book.id)}">${coverHTML(book, ctx())}<strong>${esc(book.title)}</strong><small>${esc(presetLabel("category", book.category))} · ${pagesLabel(count)}</small></button>`;
}

// ---------- Home · Today's Story (V10.2) ----------
// The day's pages (Moments) are shown together as one arranged spread: photos
// from across the day, the latest page's title and words, and where it is
// kept. This is only a view: each page keeps its own content, time and
// journal, nothing is merged or rewritten, and every page opens on its own.
function storyPagesOf(entry) {
  const isPhoto = (ref) => /^(photo|media):/.test(String(ref || ""));
  const seen = new Set();
  const pages = [...(hasDayPageContent(entry) ? [entry] : []), ...(entry.moments || [])];
  return pages
    .map((p) => {
      const layers = p.layers || [];
      const texts = layers.filter((l) => l.kind === "text" && !l.bind && !l.gen && String(l.text || "").trim()).map((l) => String(l.text).trim());
      const title = (p.title || texts[0] || "").trim();
      const words = (p.body || texts.find((x) => x !== title) || "").replace(/\s+/g, " ").trim();
      const clips = p.media || [];
      const videos = layers.filter((l) => l.kind === "video").map((l) => clips.find((c) => c.id === l.clipId)).filter(Boolean);
      const audios = layers.filter((l) => l.kind === "audio").map((l) => clips.find((c) => c.id === l.clipId)).filter(Boolean);
      // Copies on the day spread (gen) are the same photos as the pages': once.
      const refs = [
        ...(isPhoto(p.backdrop) ? [p.backdrop] : []),
        ...(p === entry && entry.photo ? [entry.photo] : []),
        ...layers.filter((l) => l.kind === "photo" && l.mediaRef && !l.drawing && !l.gen).map((l) => l.mediaRef),
        // A clip's cover picture stands in for a page that is only video.
        ...videos.map((c) => c.poster).filter(isPhoto),
      ].filter((ref) => ref && safePhoto(ref) && !seen.has(ref) && seen.add(ref));
      return { page: p, id: p === entry ? "" : p.id, title, words, time: p === entry ? "" : p.time || "", bookId: p.bookId || entry.bookId || "", refs, videos, audios, titleFont: fontFamily(p.font || "serif", catalog), bodyFont: fontFamily(p.bodyFont || p.font || "serif", catalog) };
    })
    .filter((x) => x.refs.length || x.title || x.words || x.videos.length || x.audios.length);
}
const clipTime = (clip) => {
  const sec = Math.round(Number(clip?.duration) || 0);
  return sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : "";
};
function storyMediaChips(pg) {
  const chip = (glyph, clips, label) => (clips.length ? `<span class="ts-chip">${glyph} ${clipTime(clips[0]) || t(label)}${clips.length > 1 ? ` ×${clips.length}` : ""}</span>` : "");
  return chip("▶", pg.videos, "add.video") + chip("♪", pg.audios, "add.sound");
}
// One day as a card (+ a line for each of its other pages).
function storyCardHTML(entry, { recent = false } = {}) {
  const date = entry.date || dateKey();
  const pages = storyPagesOf(entry);
  if (!pages.length) return "";
  const open = (pg) => `data-action="open-day" data-date="${esc(date)}"${pg?.id ? ` data-moment="${esc(pg.id)}"` : ""}`;
  // Privacy: Home can keep today's photos and words out of sight.
  if (privacyOn("hideToday"))
    return `<article class="ts-card ts-paper ts-private"><button class="ts-open today-preview peek-private" ${open()} aria-label="${t("home.readToday")}"><b class="ts-title">${t("privacy.hiddenTitle", { count: pages.length })}</b><span class="ts-words">${t("privacy.hiddenHint")}</span></button><div class="ts-foot"><span></span><button class="ts-go" ${open()}>${t("ts.open")} →</button></div></article>`;
  // The page with the most to show leads (pictures first, then words); a tie goes to the latest.
  const weight = (x) => x.refs.length * 2 + (x.words ? 1 : 0) + (x.title ? 1 : 0);
  const lead = pages.reduce((best, x) => (weight(x) >= weight(best) ? x : best), pages[0]);
  const others = pages.filter((x) => x !== lead);
  // Pictures from across the day: the lead's first, one from each other page, then the lead's rest.
  const pool = [lead.refs[0], ...others.map((x) => x.refs[0]), ...lead.refs.slice(1), ...others.flatMap((x) => x.refs.slice(1))].filter(Boolean);
  const shown = pool.slice(0, 3);
  const pol = (ref, cls, eager) => `<span class="ts-pol ${cls}"><img src="${esc(safePhoto(ref))}" alt="" width="400" height="500" loading="${eager ? "eager" : "lazy"}" decoding="async"></span>`;
  const photos = shown.length
    ? `<span class="ts-photos" data-n="${shown.length}">${pol(shown[0], "main", !recent)}<i class="ts-tape" aria-hidden="true"></i>${shown[1] ? pol(shown[1], "s1") : ""}${shown[2] ? pol(shown[2], "s2") : ""}${pool.length > 3 ? `<span class="ts-more">+${pool.length - 3}</span>` : ""}${lead.videos.length ? '<span class="ts-play" aria-hidden="true">▶</span>' : ""}</span>`
    : "";
  const d = new Date(`${date}T12:00:00`);
  const dayLabel = `${d.toLocaleDateString(locale(), { month: "short", day: "numeric" })} · ${d.toLocaleDateString(locale(), { weekday: "short" })}`;
  const meta = `<span class="ts-meta"><span>${esc(dayLabel)}${entry.isDemo ? ` · ${t("ts.sample")}` : ""}${entry.isDemo ? "" : draftTagHTML(entry.date)}</span><b>${esc(lead.time)}</b></span>`;
  const chips = storyMediaChips(lead);
  const book = state().books.find((bk) => bk.id === lead.bookId);
  const count = pages.length;
  const card = `<article class="ts-card ${shown.length ? "" : "ts-paper"} ${recent ? "ts-recent" : ""}" data-photos="${pool.length}"><button class="ts-open today-preview" ${open(lead)} aria-label="${t(recent ? "ts.readRecent" : "home.readToday")}">${meta}${photos}<b class="ts-title" style="font-family:${esc(lead.titleFont)}">${esc(lead.title || PL.pageLabel(lead.page, { t, dayPage: lead.page === entry, words: !lead.words }).label)}</b>${lead.words ? `<span class="ts-words" style="font-family:${esc(lead.bodyFont)}">${esc(lead.words.slice(0, 220))}</span>` : ""}${chips ? `<span class="ts-chips">${chips}</span>` : ""}</button><div class="ts-foot">${book ? `<button class="ts-book" data-action="book" data-book="${esc(book.id)}"><small>${t("ts.keptIn")}</small><b>${esc(book.title)}</b></button>` : "<span></span>"}<button class="ts-go" ${open(lead)}>${count > 1 ? `<i>${String(pages.indexOf(lead) + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}</i>` : ""}${t("ts.open")} →</button></div></article>`;
  // Every other page of the day keeps its own line: name, time, journal.
  const row = (pg) => {
    const bk = state().books.find((x) => x.id === pg.bookId);
    const marks = (pg.videos.length ? " ▶" : "") + (pg.audios.length ? " ♪" : "");
    return `<li><button ${open(pg)}><span class="ts-thumb ${pg.refs[0] ? "" : "words"}">${pg.refs[0] ? `<img src="${esc(safePhoto(pg.refs[0]))}" alt="" width="80" height="96" loading="lazy" decoding="async">` : "<i></i><i></i><i></i>"}</span><span class="ts-row-copy"><b style="font-family:${esc(pg.titleFont)}">${esc(pg.title || pg.words || PL.pageLabel(pg.page, { t, dayPage: pg.page === entry }).label)}</b>${!pg.refs[0] && pg.title && pg.words ? `<em style="font-family:${esc(pg.bodyFont)}">${esc(pg.words.slice(0, 80))}</em>` : ""}<small>${esc([pg.time, bk?.title].filter(Boolean).join(" · "))}${marks}</small></span><i class="ts-num">${String(pages.indexOf(pg) + 1).padStart(2, "0")}</i></button></li>`;
  };
  const also = others.length && !recent ? `<ul class="ts-also" aria-label="${t("ts.also")}">${others.slice(0, 3).map(row).join("")}</ul>${others.length > 3 ? `<button class="text-button ts-all" data-action="open-day" data-date="${esc(date)}">${t("ts.all", { count })} ›</button>` : ""}` : "";
  return card + also;
}
// The most recent day the user really kept (never a sample day).
function recentStoryEntry() {
  const today = dateKey();
  return state()
    .entries.filter((e) => e.date < today && !e.isDemo && storyPagesOf(e).length)
    .sort((x, y) => (x.date < y.date ? 1 : -1))[0];
}
function sectionTitleHTML(key, sub, aside = "") {
  return `<div class="hs-head"><h2 class="hs-title ${languageCode()}">${t(key)}${sub ? `<small>${esc(sub)}</small>` : ""}</h2>${aside}</div>`;
}
function todayStoryHTML() {
  const entry = todayEntry();
  const card = entry ? storyCardHTML(entry) : "";
  const count = entry ? dayCounts(state(), entry.date).pages : 0;
  const head = sectionTitleHTML("ts.title", card ? t("ts.sub", { count }) : t("ts.subEmpty"), streakChipHTML());
  if (card) return `<div class="v9-today hs-remember">${head}${card}</div>`;
  // Nothing yet today: a quiet invitation, then the latest real story (if any).
  const scene = todayScene();
  const recent = privacyOn("hideToday") ? null : recentStoryEntry();
  const when = recent ? new Date(`${recent.date}T12:00:00`).toLocaleDateString(locale(), { month: "long", day: "numeric" }) : "";
  return `<div class="v9-today hs-remember">${head}<div class="ts-empty"><i class="ts-ghost" aria-hidden="true"></i><b>${t("ts.emptyTitle")}</b><small>${t("ts.emptyBody")}</small><button class="ts-start" data-action="today-photos">${t("ts.emptyGo")} →</button>${scene ? `<button class="text-button today-scene" data-action="quick-open" data-way="photo" data-photo="today" data-scene="${esc(scene.id)}">${t("ts.sceneGo", { name: sceneName(scene) })} ›</button>` : ""}</div>${recent ? `<p class="ts-recent-head"><span>${t("ts.recent")}</span> · ${esc(when)}</p>${storyCardHTML(recent, { recent: true })}` : ""}</div>`;
}
// ---------- Home · My Library (V10.2) ----------
// The user's own journals on one shelf: the one most recently written in is
// larger (with the only "write a page" link); the others stand beside it.
function bookLastWritten(bookId) {
  let last = "";
  for (const e of state().entries) {
    if (e.isDemo) continue;
    const stamps = [...(e.bookId === bookId && hasDayPageContent(e) ? [e.updatedAt || e.date] : []), ...(e.moments || []).filter((m) => (m.bookId || e.bookId) === bookId).map((m) => m.updatedAt || e.date)];
    for (const stamp of stamps) if (String(stamp) > last) last = String(stamp);
  }
  return last;
}
function homeLibraryHTML() {
  const mine = state().books.filter((bk) => !isOurBook(bk));
  const head = (n) => sectionTitleHTML("lib.title", n ? t("lib.sub", { count: n }) : "", `<button class="hs-aside" data-action="nav" data-page="books">${t("lib.all")} ›</button>`);
  if (!mine.length)
    return `<section class="home-section home-books hs-collect">${head(0)}<div class="lib-empty"><div class="lib-shelf empty" aria-hidden="true"></div><b>${t("lib.emptyTitle")}</b><button class="ts-start home-book-new" data-action="new-book">${t("lib.emptyGo")} →</button></div></section>`;
  const stamped = mine.map((bk, i) => ({ bk, i, last: bookLastWritten(bk.id) }));
  // The one written in most recently leads; the others keep the shelf's order.
  const first = [...stamped].sort((x, y) => (x.last === y.last ? x.i - y.i : x.last < y.last ? 1 : -1))[0];
  const rest = stamped.filter((x) => x !== first);
  const f = first.bk;
  const count = bookCounts(state(), f.id).pages, countDays = bookCounts(state(), f.id).days;
  const day = first.last.slice(0, 10);
  const updated = !day ? "" : day === dateKey() ? t("lib.today") : day === addDays(dateKey(), -1) ? t("lib.yesterday") : t("lib.on", { date: new Date(`${day}T12:00:00`).toLocaleDateString(locale(), { month: "short", day: "numeric" }) });
  const small = rest.slice(0, 2);
  const book = (bk, cls = "") => `<button class="lib-book home-book-cover ${cls}" data-action="book" data-book="${esc(bk.id)}" aria-label="${esc(bk.title)}"><span class="lib-cover">${coverHTML(bk, ctx())}</span></button>`;
  return `<section class="home-section home-books hs-collect">${head(mine.length)}<div class="lib"><div class="lib-shelf home-book"><div class="lib-slot">${book(f, "lib-feature")}</div><div class="lib-side"><div class="lib-now"><small>${t(first.last ? "lib.now" : "lib.start")}</small><b>${esc(f.title)}</b><span>${[daysPagesLabel(countDays, count), updated].filter(Boolean).join(" · ")}</span><button class="lib-write home-book-write" data-action="book-write" data-book="${esc(f.id)}">${t(count ? "lib.write" : "lib.writeFirst")} →</button></div><div class="lib-others">${small.map((x) => book(x.bk)).join("")}${rest.length > 2 ? `<button class="lib-count" data-action="nav" data-page="books" aria-label="${t("lib.all")}">+${rest.length - 2}</button>` : mine.length < 3 ? `<button class="lib-new home-book-new" data-action="new-book" aria-label="${t("home.newBook")}">${icon("plus")}</button>` : ""}</div></div></div>${small.length ? `<div class="lib-names" aria-hidden="true"><span></span><div>${small.map((x) => `<span>${esc(x.bk.title)}</span>`).join("")}</div></div>` : ""}</div></section>`;
}

function home() {
  // Photo-led home, like a magazine page: today's picture large, a row of
  // library photos to start from, then habits and books.
  const entry = todayEntry(),
    completed = state().checks.filter((check) => check.date === dateKey()).length;
  const now = new Date();
  const weekday = now.toLocaleDateString(locale(), { weekday: "long" });
  const day = now.toLocaleDateString(locale(), { month: "long", day: "numeric" });
  const books = homeLibraryHTML();
  return `<div class="home-mag"><header class="home-top"><div class="masthead"><div class="brand-title">Little Days${BRAND_SPROUT}</div></div><span class="home-actions"><button class="icon-button" data-action="open-search" aria-label="${t("search.open")}">${icon("search")}</button>${bell()}<button class="icon-button settings-gear" data-action="nav" data-page="settings" aria-label="${hasUnseen() ? t("news.dotLabel", { version: LATEST }) : t("settings")}">${icon("gear")}${hasUnseen() ? `<i class="news-dot" aria-hidden="true"></i>` : ""}</button></span></header>
 ${backupNudgeHTML()}<section class="hero today-card v9-home"><div class="story-start-card"><div class="v9-masthead"><span class="v9-daynum" aria-hidden="true">${now.getDate()}</span><div class="v9-greet"><small class="v9-kicker">${esc(now.toLocaleDateString(locale(), { month: "long" }))} · ${now.getFullYear()}</small>${greetingHTML(weekday, day)}<h1 class="today-prompt">${t("story.prompt")}</h1></div></div><div class="v9-hero-wrap">${keeperPerchHTML()}<div class="v9-hero"><div class="v9-hero-copy"><small class="v9-kicker v9-sage">Photo Journal</small><h2>${t("tile.photo")}</h2><p>${t("story.promptHint")}</p></div><div class="v9-polaroids" aria-hidden="true"><i class="v9-pol v9-pol-back" style="background-image:url('${esc(safePhoto("photo:brunch"))}')"></i><i class="v9-pol v9-pol-front" style="background-image:url('${esc(safePhoto("photo:latte-art"))}')"><em>${esc(now.toLocaleDateString(locale(), { month: "short", day: "numeric" }))}</em></i><i class="v9-tape"></i></div><button class="story-photos v9-cta" data-action="today-photos">${t("v9.pickPhotos")}<span aria-hidden="true">→</span></button></div></div><div class="story-start-row today-tiles v9-secondary"><button class="today-tile" data-action="today-write" title="${t("story.justWriteHint")}">${v9Icon("write")}<b>${t("story.justWrite")}</b><small>${t("v9.writeHint")}</small></button><button class="today-tile" data-action="today-draw">${v9Icon("draw")}<b>${t("tile.draw")}</b><small>${t("v9.drawHint")}</small></button><button class="today-tile moment-cta" data-action="quick-open" data-photo="">${v9Icon("more")}<b>${t("tile.more")}</b><small>${t("v9.moreHint")}</small></button></div><button class="text-button backfill-link" data-action="backfill" data-date="${addDays(dateKey(), -1)}">${t("story.backfill")} ›</button></div>${keeperInviteHTML()}${todayStoryHTML()}${todayListHTML()}</section>${memoryHTML()}
 ${books}<p class="home-quote hs-colophon">Collect moments, grow gently.</p></div>`;
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
  // B5 (Growth frozen): habits show only with Labs on; the data stays.
  const habits = labsOn() ? state().habits : [];
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
  // Quiet utility (V10.2): one line under today's story; it opens into the
  // list. Folded or open is remembered on this device; the data is untouched.
  const open = plansOpen();
  const left = items.filter((p) => !p.done).length;
  const summary = [items.length ? (left ? t("qu.left", { count: left }) : t("qu.allDone")) : t("qu.none"), habits.length ? `${t("qu.habits")} ${done}/${habits.length}` : ""].filter(Boolean).join(" · ");
  return `<section class="today-list today-planner qu" data-open="${open}" aria-label="${t("qu.title")}"><button class="qu-row" data-action="plans-toggle" aria-expanded="${open}" aria-controls="qu-body"><i class="qu-box" aria-hidden="true"></i><b>${t("qu.title")}</b><small data-qu-summary>${esc(summary)}</small><span class="qu-chev" aria-hidden="true">▾</span></button><div class="qu-body" id="qu-body" ${open ? "" : "hidden"}><p class="qu-hint">${t("plan.hint")}</p><div class="today-plans${items.length ? "" : " empty"}">${list}${add}${carry}</div>${labsOn() ? habitsLink : ""}</div></section>`;
}
const PLANS_OPEN_KEY = "little-days.homePlans";
function plansOpen() {
  try {
    return localStorage.getItem(PLANS_OPEN_KEY) === "open";
  } catch {
    return false;
  }
}
function togglePlans() {
  const open = !plansOpen();
  try {
    localStorage.setItem(PLANS_OPEN_KEY, open ? "open" : "closed");
  } catch {}
  // No re-render: the page keeps its place.
  const section = $(".today-planner.qu");
  if (!section) return;
  section.dataset.open = String(open);
  section.querySelector(".qu-row").setAttribute("aria-expanded", String(open));
  section.querySelector(".qu-body").hidden = !open;
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
  const momentCount = moment ? 0 : dayCounts(state(), entry.date).pages;
  const title = moment
    ? PL.pageLine(moment, { t, index: (entry.moments || []).indexOf(moment) })
    : PL.dayLabel(entry, { t });
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
  // V10.41 (counts): the number on a day is its pages (pages.mjs), as its label says.
  summary.moments = dayCounts(state(), key).pages;
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
    const entry = only ? (only.has(key) ? dayOf(state(), key) : null) : dayOf(state(), key);
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
  // B5: 成长轨迹 is frozen with Growth (Labs); the calendar shows memories.
  if (calendarMode === "growth" && !labsOn()) calendarMode = "memory";
  const year = month.getFullYear(),
    monthIndex = month.getMonth(),
    count = new Date(year, monthIndex + 1, 0).getDate(),
    offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  // V10.41 (S1): a sample day is not one of the person's days here.
  const entry = state().entries.find((e) => e.date === selectedDate && !isSampleDay(e)),
    checks = state().checks.filter((c) => c.date === selectedDate);
  const weekdays =
    languageCode() === "en"
      ? ["M", "T", "W", "T", "F", "S", "S"]
      : ["一", "二", "三", "四", "五", "六", "日"];
  const only = calendarMode === "memory" ? calendarBookDays() : null;
  const cells = Array.from({ length: count }, (_, i) => {
    const key = dateKey(new Date(year, monthIndex, i + 1)),
      recorded = only && !only.has(key) ? null : state().entries.find((e) => e.date === key && !isSampleDay(e)),
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
    return `${top}<div class="segmented"><button data-action="calendar-mode" data-mode="memory">${t("calendar.memory")}</button>${labsOn() ? `<button data-action="calendar-mode" data-mode="growth">${t("calendar.growth")}</button>` : ""}<button data-action="calendar-mode" data-mode="wall" class="selected">${t("calendar.wall")}</button></div>${calendarBookChips()}${calendarWallHTML()}`;
  return `${top}<div class="segmented"><button data-action="calendar-mode" data-mode="memory" class="${calendarMode === "memory" ? "selected" : ""}">${t("calendar.memory")}</button>${labsOn() ? `<button data-action="calendar-mode" data-mode="growth" class="${calendarMode === "growth" ? "selected" : ""}">${t("calendar.growth")}</button>` : ""}<button data-action="calendar-mode" data-mode="wall" class="${calendarMode === "wall" ? "selected" : ""}">${t("calendar.wall")}</button></div>${calendarMode === "memory" ? calendarBookChips() : ""}<div class="month-controls"><button data-action="month" data-delta="-1" aria-label="${t("calendar.prev")}">${icon("back")}</button><h2>${month.toLocaleDateString(locale(), { month: "long", year: "numeric" })}</h2><button data-action="month" data-delta="1" aria-label="${t("calendar.next")}">${icon("arrow")}</button></div><div class="calendar-grid">${weekdays.map((d) => `<span class="weekday">${d}</span>`).join("")}${"<span></span>".repeat(offset)}${cells}</div>${calendarMode === "memory" ? `<div class="calendar-legend" aria-hidden="true"><span><i class="dot-photo"></i>${t("calendar.markPhoto")}</span><span><i class="dot-video"></i>${t("calendar.markVideo")}</span><span><i class="dot-audio"></i>${t("calendar.markAudio")}</span>${labsOn() ? `<span><i class="dot-growth"></i>${t("calendar.markGrowth")}</span>` : ""}<span><b>3</b>${t("calendar.markMoments")}</span></div>` : ""}<section class="date-summary"><div class="section-heading"><h3>${t(calendarMode === "memory" ? "calendar.dayTitle" : "calendar.growthTitle", { date: shortDate(selectedDate) })}</h3><span class="summary-actions">${entry ? `<button data-action="open-day" data-date="${selectedDate}">${t("calendar.read")}</button>` : ""}${entry || calendarMode !== "memory" ? `<button data-action="edit-date" data-date="${selectedDate}">${t(entry ? "calendar.edit" : "calendar.backfill")}</button>` : ""}</span></div>${
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
  musicContext = "",
  musicAsked = ""; // V10.11: the book whose music was asked for (books are silent by default)
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
  // The reader's ♪ shows whether this book's music is really playing.
  const readerButton = document.querySelector(".reader-music");
  if (readerButton && page === "reader") {
    const on = playing && current === readerMusicId();
    readerButton.classList.toggle("on", on);
    readerButton.setAttribute("aria-pressed", String(on));
    readerButton.setAttribute("aria-label", t(on ? "reader.musicOff" : "reader.musicOn"));
  }
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
  } else if ((page === "books" && selectedBook) || page === "reader") {
    // V10.11: a book is silent until its music is asked for (the reader's ♪,
    // or the chip on the book page); a page with its own piece plays that.
    const id = page === "reader" ? readerBook : selectedBook;
    wanted = page === "reader" ? readerMusicId() : bookMusic(books, id);
    keep = page === "reader";
    context = `book:${id}`;
  }
  if (context !== musicContext) {
    musicContext = context;
    musicPaused = false;
    musicAsked = "";
  }
  // V10.11 books, V10.16 a day: silent until its ♪ / music chip is tapped.
  // Moving to another day or book starts silent again (no sound by surprise).
  const silent = (context.startsWith("book:") || context.startsWith("day:")) && musicAsked !== context;
  const track = findTrack(catalog, wanted);
  if (silent) {
    if (music.current() && !musicSheetOpen()) music.stop();
  } else if (track) {
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
    musicAsked = musicContext;
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
    // Choosing a piece for the book is asking for it: it plays straight away.
    musicContext = `book:${selectedBook}`;
    musicAsked = musicContext;
    musicPaused = false;
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
  // B3: the invitation waits until the first page of one's own is kept, and
  // sits under the photo card (the way to start stays in the first screen).
  // (The old sample journal — older test suites only — behaves as before.)
  if (!state().entries.some((e) => !e.isDemo) && readKey("little-days.with-samples") !== "1") return "";
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
  // Home already greets ("Hi! It's …"), so Captain stays quiet unless tapped,
  // it just grew, or the person turned on "speak first" (Interactive).
  const spoken = Keeper.modeAllows(k, "proactive") && prompt ? t(prompt.key, { ...prompt.values, name }) : "";
  const line = keeperLine || (grew ? t("keeper.grew", { stage: t("keeper.stage." + growth.id) }) : spoken);
  const mood = "peek";
  // A small tag beside it opens the same panel as tapping it (not in Quiet mode).
  const entry = Keeper.modeAllows(k, "invite") && !line ? `<button class="keeper-entry" data-action="keeper-panel">${keeperPanelIcon("chat")}${esc(tk("kp.entry", k))}</button>` : "";
  return `<div class="keeper-home keeper-perch">${line ? `<p class="keeper-bubble" role="status"><b>${esc(name)}</b>${esc(line)}</p>` : ""}${entry}<button class="keeper-tap" data-action="keeper-tap" aria-label="${esc(t("keeper.tapLabel", { name }))}">${keeperArt(mood)}</button></div>`;
}
// V9.0 Home: the three secondary ways to start use the same quiet line
// icons as the rest of the app (stationery 3D art is still to be made; no
// emoji or drawn "3D" stand-ins).
function v9Icon(kind) {
  const paths = {
    write: '<path d="M6 4.5h9.5a2 2 0 0 1 2 2V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/><path d="M8.5 4.5V20"/><path d="M11 9h4M11 12.5h4"/>',
    draw: '<path d="M12 4c4.7 0 8 3 8 6.7 0 2.4-1.8 3.3-3.4 3.3-1.4 0-2.1.8-2.1 1.8 0 1.6-1 3.2-3.1 3.2C7 19 4 15.6 4 11.5 4 7.4 7.4 4 12 4Z"/><circle cx="8.5" cy="10" r="1.1"/><circle cx="12" cy="7.6" r="1.1"/><circle cx="15.6" cy="10" r="1.1"/>',
    more: '<path d="M4.5 9.5h15v9a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5Z"/><path d="M3.5 6.5h17v3h-17z"/><path d="M10 13h4"/>',
  }[kind];
  return `<svg class="v9-icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
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
  return `<div class="keeper-shelf"><button class="keeper-tap" data-action="keeper-shelf-tap" aria-label="${esc(t("keeper.tapLabel", { name: Keeper.keeperName(k, languageCode()) }))}">${keeperArt(new Date().getHours() >= 22 || new Date().getHours() < 6 ? "sleepy" : "idle")}</button>${line ? `<p class="keeper-bubble" role="status">${esc(line)}${Keeper.modeAllows(k, "chat") ? ` <button class="text-button" data-action="open-search">${t("keeper.shelf.find")} ›</button>` : ""}</p>` : ""}</div>`;
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
  const entry = state().entries.find((e) => e.date === date) || state().drafts[date];
  const shown = entry ? storyPagesOf(entry) : [];
  const pg = shown.find((x) => x.id === (momentId || "")) || shown[0];
  const facts = { pages: shown.length, pagePhotos: pg?.refs.length || 0, pageMedia: Boolean(pg && (pg.videos.length || pg.audios.length)), pageWordsOnly: Boolean(pg && !pg.refs.length && !pg.videos.length && !pg.audios.length), title: pg?.title || "" };
  const reply = await keeperService.respond({ text: pageWords(date, momentId), language: languageCode(), seed: Math.floor(Math.random() * 1000), facts, say: (key, values) => t(key, values), recentLines: recentKeeperLines().map((x) => x.id) }, k);
  if (!reply) return;
  if (reply.line) rememberKeeperLine(reply.line);
  saveKeeper((x) => (x.recent = [...x.recent, ...(reply.used || [])].slice(-12)));
  logEvent("keeper_feedback", { kind: reply.source });
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet keeper-sheet"><div class="choose-grabber" aria-hidden="true"></div><div class="keeper-sheet-head">${keeperArt("encouraging")}<b>${esc(name)}</b></div><p class="keeper-reply">${esc(reply.text)}</p><p class="save-help keeper-local">🔒 ${t("keeper.localNote")}</p><button class="choose-cancel" data-action="choose-close">${t("keeper.thanks")}</button></div>`;
  if (!dialog.open) dialog.showModal();
}
// ---------- Captain's panel (V10.3) ----------
// Opened by tapping Captain or the small "找 Captain" tag beside it. Everything
// here runs on this device: a line that fits the day, a small chat that only
// knows a few things (and says so), and two real flows — sorting out today's
// pages and looking back at an earlier page. No AI, nothing sent anywhere.
let keeperView = "home"; // home | organize | memory
let keeperMemory = null; // the page being shown in the memory view
let keeperSeen = []; // memory pages shown in this sheet (not repeated)
const KEEPER_LINES_KEY = "little-days.keeperLines";
function recentKeeperLines() {
  try {
    const week = Date.now() - 7 * 86400000;
    return (JSON.parse(localStorage.getItem(KEEPER_LINES_KEY)) || []).filter((x) => x && x.at > week);
  } catch {
    return [];
  }
}
// A line for this moment, not one it used in the last week (while others remain).
function keeperSay(event, facts) {
  const k = keeperNow();
  const recent = recentKeeperLines();
  const line = Keeper.contextLine(event, facts, { recent: recent.map((x) => x.id), seed: Math.floor(Math.random() * 1000) });
  if (!line) return "";
  rememberKeeperLine(line.id);
  return cjkGap(t(line.key, { ...line.values, name: Keeper.keeperName(k, languageCode()) }));
}
function rememberKeeperLine(id) {
  try {
    localStorage.setItem(KEEPER_LINES_KEY, JSON.stringify([...recentKeeperLines().filter((x) => x.id !== id), { id, at: Date.now() }].slice(-40)));
  } catch {}
}
// What Captain may mention about today: counts always; a page's title only
// with "look at earlier pages" switched on (it never quotes a page it was
// not allowed to look at).
const keeperFacts = () => {
  const facts = Keeper.dayFacts(state(), dateKey(), new Date().getHours());
  return Keeper.modeAllows(keeperNow(), "memories") ? facts : { ...facts, title: "" };
};
// "找 Captain" reads better than "找Captain"; a Chinese name needs no gaps.
// V10.18: the gap goes only between a Chinese character and a Latin word —
// never before Chinese punctuation ("戳戳 Captain。", not "Captain 。").
const keeperNameIn = (k) => Keeper.keeperName(k, languageCode());
const cjkGap = (text) => (languageCode() === "en" ? text : String(text).replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2").replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2"));
const tk = (key, k, values = {}) => cjkGap(t(key, { ...values, name: keeperNameIn(k) })).trim();
function keeperShelfFacts() {
  const mine = state().books.filter((bk) => !isOurBook(bk));
  const latest = [...mine].map((bk) => ({ bk, last: bookLastWritten(bk.id) })).sort((x, y) => (x.last < y.last ? 1 : -1))[0];
  return { count: mine.length, untagged: mine.filter((bk) => !(bk.tags || []).length).length, latest: latest?.last ? latest.bk.title : "", title: latest?.last ? latest.bk.title : "" };
}
function keeperPanelIcon(kind) {
  const paths = { organize: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>', memory: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 5v4h4"/><path d="M12 8v4l3 2"/>', write: '<path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13 7 4 4"/>', chat: '<path d="M5 6h14v9H10l-4 3v-3H5Z"/>' };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[kind]}</svg>`;
}
// V10.5 · the composer: a clear Send button beside the field, a draft that
// survives closing the sheet, and a short "thinking" state so a second tap
// cannot send twice. Closing the sheet never sends anything.
const KEEPER_DRAFT_KEY = "little-days.keeperDraft";
let keeperBusy = false; // a line was sent; the reply is on its way
let keeperComposing = false; // the input method is still choosing characters
function keeperUnsent() {
  try {
    return String(localStorage.getItem(KEEPER_DRAFT_KEY) || "").slice(0, 300);
  } catch {
    return "";
  }
}
function keepKeeperUnsent(text) {
  try {
    if (text) localStorage.setItem(KEEPER_DRAFT_KEY, String(text).slice(0, 300));
    else localStorage.removeItem(KEEPER_DRAFT_KEY);
  } catch {}
}
function keeperLinesHTML() {
  const lines = keeperChat.map((m) => `<p class="keeper-msg ${m.who === "me" ? "me" : "them"}${m.local ? " local-ai" : ""}">${esc(m.text)}${m.local ? `<small class="kp-local-ai">${t("kp.localAI")}</small>` : ""}${m.open ? ` <button class="text-button" data-action="open-day" data-date="${esc(m.open.date)}"${m.open.momentId ? ` data-moment="${esc(m.open.momentId)}"` : ""}>${t("keeper.chat.open")} ›</button>` : ""}${m.go ? `<span class="cp-acts in-chat">${m.go.map((g, i) => `<button class="${i ? "secondary" : "primary"}" data-action="cp-go" data-go="${g}">${t(g === "today-photos" ? "cp.photos" : "cp.write")}</button>`).join("")}</span>` : ""}${m.fallback ? `<small class="kp-local-ai">${t("kp.localDown")}</small>` : ""}</p>`).join("");
  return lines + (keeperBusy ? `<p class="keeper-msg them pending" role="status" aria-label="${t("kp.thinking")}"><i></i><i></i><i></i></p>` : "");
}
// The field grows with the words (up to four lines); the button follows the field and the busy state.
function syncKeeperComposer() {
  const field = $("[data-keeper-say]");
  const send = $('.kp-send[data-action="keeper-say"]');
  if (!field || !send) return;
  field.style.height = "auto";
  field.style.height = `${Math.min(field.scrollHeight, 112)}px`;
  send.disabled = keeperBusy || !field.value.trim();
  send.classList.toggle("busy", keeperBusy);
  send.setAttribute("aria-busy", String(keeperBusy));
  send.setAttribute("aria-label", t(keeperBusy ? "kp.sending" : "kp.send"));
}
// New lines without rebuilding the sheet, so the caret (and the keyboard) stay where they are.
function refreshKeeperChat() {
  const dialog = $("#choose-dialog");
  const sheet = dialog?.open ? dialog.querySelector('.kp[data-view="home"]') : null;
  const box = sheet?.querySelector(".keeper-msgs");
  if (!box) return false;
  box.innerHTML = keeperLinesHTML();
  // A conversation gets the room it needs.
  if (keeperChat.length) sheet.classList.remove("quiet");
  scrollKeeperChat();
  syncKeeperComposer();
  return true;
}
// V10.8 · Captain's wardrobe: a hat or a small thing to hold, chosen with one
// tap. No coins, check-ins or unlocking — only looks that have real artwork
// are listed. The same picker is in Settings → 角色与装扮 and in the panel.
function keeperLooksHTML() {
  const k = keeperNow();
  const looks = keeperLooks(catalog, k.animal, languageCode());
  // A look that is no longer in the wardrobe shows as the default one (as the pictures do).
  const wearing = looks.some((look) => look.id === k.outfit) ? k.outfit : DEFAULT_OUTFIT[k.animal] || looks[0]?.id || "";
  const chip = (look) => `<button class="look-chip" data-action="keeper-look" data-look="${esc(look.id)}" aria-pressed="${look.id === wearing}"><span class="look-art">${keeperImage(catalog, { animal: k.animal, outfit: look.id, mood: "idle", label: "" })}</span><b>${esc(look.name)}</b>${look.note ? `<small>${esc(look.note)}</small>` : ""}</button>`;
  const group = (kind) => {
    const items = looks.filter((look) => look.kind === kind);
    return items.length ? `<div class="look-group"><h4>${t("look." + kind)}</h4><div class="look-row">${items.map(chip).join("")}</div></div>` : "";
  };
  return `<div class="keeper-looks" role="group" aria-label="${t("look.title")}">${group("hat")}${group("accessory")}<p class="look-note">${t("look.note")}</p></div>`;
}
// V10.9 · Captain's Corner: one sheet with three ways to be with Captain —
// Chat (ready), Play (needs Captain's real animation: shown as on its way,
// never as a rough stand-in) and Look (the wardrobe). The sheet keeps one
// height (medium, or expanded by pulling it up / tapping its grabber), so
// sending a line never makes it jump.
let kpTall = false;
const CORNER_TABS = ["home", "play", "looks"];
function cornerTabsHTML(view) {
  const tab = (id, key) => `<button role="tab" class="kp-tab" data-action="keeper-view" data-view="${id}" aria-selected="${view === id}">${t(key)}</button>`;
  return `<div class="kp-tabs" role="tablist" aria-label="${t("corner.tabs")}">${tab("home", "corner.chat")}${tab("play", "corner.play")}${tab("looks", "corner.look")}</div>`;
}
// The four shortcuts: full rows until the chat starts, then one compact line.
// V10.35 · Captain's card: one line that fits the moment and at most two
// buttons that really do it. Chosen in this order:
//   1. the most recent of "just made a page" (15 min, the page still there)
//      and "just looked at an older day in the reader" (30 min);
//   2. otherwise today is kept (C) or not yet (A).
// Each state has a few lines; opening Captain again shows the next one.
// Only facts from the journal (the date, the page's name, how many pages);
// nothing made up, no score, no check-in. Kept in memory only.
let captainSaved = null; // { date, momentId, at }: the page just made
let captainRead = null; // { book, key, date, momentId, at }: the page last open in the reader
const captainSeen = {};
const CAPTAIN_LINES = { A: 3, Bnew: 2, Bsaid: 2, C: 2, D: 2 };
const captainLine = (key) => t(`cp.${key}.${(Math.max(0, (captainSeen[key] || 1) - 1) % CAPTAIN_LINES[key]) + 1}`);
function captainCardData() {
  const today = dateKey();
  const entryOf = (d) => dayOf(state(), d);
  const fresh = (x, min) => x && Date.now() - x.at < min * 60000;
  const btn = (label, attrs, primary = false) => `<button class="${primary ? "primary" : "secondary"}" ${attrs}>${label}</button>`;
  const saved = fresh(captainSaved, 15) && captainSaved.date === today && entryOf(today)?.moments?.some((x) => x.id === captainSaved.momentId) ? captainSaved : null;
  const read = fresh(captainRead, 30) && captainRead.date !== today && entryOf(captainRead.date) ? captainRead : null;
  if (read && (!saved || read.at > saved.at)) {
    const e = entryOf(read.date);
    const m = e.moments?.find((x) => x.id === read.momentId);
    const when = new Date(`${read.date}T12:00:00`).toLocaleDateString(locale(), { month: "long", day: "numeric" });
    const label = m ? PL.pageLabel(m, { t }).label : PL.dayLabel(e, { t });
    return { state: "D", key: "D", meta: `${when} · ${label}`, acts: btn(t("cp.readOn"), `data-action="cp-read-on"`, true) };
  }
  if (saved) {
    const m = entryOf(today).moments.find((x) => x.id === saved.momentId);
    const said = String(m.title || "").trim() || PL.pageWords(m) || m.layers?.some((l) => l.kind === "photo" && String(l.caption || "").trim());
    const at = `data-date="${today}" data-moment="${esc(m.id)}"`;
    const look = btn(t("cp.seePage"), `data-action="cp-page" ${at}`);
    return said ? { state: "B", key: "Bsaid", acts: btn(t("cp.keepEditing"), `data-action="read-edit" ${at}`, true) + look } : { state: "B", key: "Bnew", acts: btn(t("cp.addLine"), `data-action="read-edit" ${at}`, true) + look };
  }
  if (keptToday()) {
    const n = (entryOf(today)?.moments || []).length;
    return { state: "C", key: "C", meta: n > 1 ? t("cp.todayPages", { n }) : "", acts: btn(t("cp.openToday"), `data-action="cp-today"`, true) };
  }
  return { state: "A", key: "A", acts: btn(t("cp.photos"), `data-action="cp-go" data-go="today-photos"`, true) + btn(t("cp.write"), `data-action="cp-go" data-go="today-write"`) };
}
function keeperActsHTML() {
  const card = captainCardData();
  return `<section class="cp-card" data-state="${card.state}" aria-label="${t("cp.card")}"><p>${esc(captainLine(card.key))}</p>${card.meta ? `<small class="cp-meta">${esc(card.meta)}</small>` : ""}<div class="cp-acts">${card.acts}</div></section>`;
}
// V10.17 · Captain's Playroom (MVP): a big stage with Captain on it. Tap
// Captain for a happy reaction; drag (or tap) the pink yarn ball to Captain
// to have it caught. Each look plays only its own pictures (library.json
// "keeperPlay"): an action without matching art is simply not offered —
// never borrowed from the other look, never shown as "coming soon".
const PLAY_HINT_KEY = "little-days.play-hint";
function wornLook(k = keeperNow()) {
  const looks = keeperLooks(catalog, k.animal, languageCode());
  return looks.some((look) => look.id === k.outfit) ? k.outfit : DEFAULT_OUTFIT[k.animal] || looks[0]?.id || "";
}
function playSetOf(k = keeperNow()) {
  const wear = wornLook(k);
  return (catalog?.keeperPlay || []).find((p) => p.animal === k.animal && p.outfit === wear) || null;
}
function keeperPlayHTML() {
  const k = keeperNow();
  const set = playSetOf(k);
  if (!set) return `<div class="kp-scroll"><div class="kp-note">${keeperArt("happy")}<p>${esc(tk("play.none", k))}</p></div></div>`;
  const src = (file) => `library/keepers/${esc(file)}`;
  let hinted = true;
  try {
    hinted = localStorage.getItem(PLAY_HINT_KEY) === "1";
  } catch {}
  const h = set.happy;
  const happy = h ? `<div class="pr-anim" aria-hidden="true" style="background-image:url('${src(h.file)}');--pr-n:${h.frames};--pr-time:${h.frames * h.frameMs}ms;--pr-loops:${h.loops || 1};--pr-key:${((h.still || 0) / Math.max(1, h.frames - 1)) * 100}%"></div>` : "";
  const b = set.ball;
  const ball = b ? `<button class="pr-ball" style="--bx:${b.x}%;--by:${b.y}%;--bd:${b.d}%" aria-label="${esc(tk("play.ballLabel", k))}"><i class="pr-ring" aria-hidden="true"></i><img src="${src(b.file)}" alt="" draggable="false"></button>` : "";
  return `<div class="kp-scroll pr-scroll"><div class="pr" data-outfit="${esc(set.outfit)}" data-stage="${esc(set.stage)}"${hinted ? " data-hinted" : ""}><div class="pr-stage"><img class="pr-idle" src="${src(set.idle)}" alt="" draggable="false">${happy}<button class="pr-body" data-action="pr-poke" aria-label="${esc(tk("play.pokeLabel", k))}"></button>${ball}<p class="pr-bubble" aria-live="polite">${esc(tk(b ? "play.invite" : "play.inviteSolo", k))}</p></div><p class="pr-line">${esc(tk(b ? "play.hint" : "play.hintSolo", k))}</p></div></div>`;
}
const prReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function prSay(keys) {
  const bubble = $(".pr .pr-bubble");
  if (!bubble) return;
  bubble.textContent = tk(keys[Math.floor(Math.random() * keys.length)], keeperNow());
  bubble.classList.remove("pop");
  void bubble.offsetWidth;
  bubble.classList.add("pop");
}
// The iPhone app gives a light tap (Swift: LittleDaysHaptics); the web page has none.
function prHaptic() {
  try {
    window.webkit?.messageHandlers?.littleDaysHaptics?.postMessage("light");
  } catch {}
}
function prPlayed(pr) {
  if (pr.hasAttribute("data-hinted")) return;
  pr.setAttribute("data-hinted", "");
  try {
    localStorage.setItem(PLAY_HINT_KEY, "1");
  } catch {}
}
// The happy reaction: the look's own animation (twice), then back to rest.
// A look with no happy animation yet gives a small hop of its own picture.
function prHappy(keys) {
  const pr = $(".pr");
  if (!pr || pr.dataset.busy) return;
  pr.dataset.busy = "1";
  prPlayed(pr);
  prHaptic();
  prSay(keys);
  const anim = pr.querySelector(".pr-anim");
  let over = false;
  const done = () => {
    if (over) return;
    over = true;
    pr.classList.remove("happy", "still", "hop");
    const ball = pr.querySelector(".pr-ball");
    setTimeout(() => {
      if (ball) {
        ball.style.transition = "none";
        ball.style.transform = "";
        void ball.offsetWidth;
        ball.style.transition = "";
        ball.classList.remove("caught");
      }
      delete pr.dataset.busy;
      if (anim) prSay(["play.again1", "play.again2"]);
    }, 240);
  };
  if (!anim) {
    if (!prReduced()) pr.classList.add("hop");
    return setTimeout(done, 900);
  }
  const ms = parseFloat(getComputedStyle(anim).getPropertyValue("--pr-time")) * (Number(getComputedStyle(anim).getPropertyValue("--pr-loops")) || 1);
  if (prReduced()) {
    pr.classList.add("happy", "still");
    return setTimeout(done, 1600);
  }
  pr.classList.add("happy");
  anim.addEventListener("animationend", done, { once: true });
  setTimeout(done, (ms || 2200) + 600); // in case animationend never comes
}
// The ball, dragged: it follows the finger and rolls; let go near Captain's
// paws and Captain catches it; anywhere else it rolls back.
let prDrag = null;
function prBallMove(ball, dx, dy, r, ms = 0) {
  ball.style.transition = ms && !prReduced() ? `transform ${ms}ms cubic-bezier(.3,.7,.35,1)` : "none";
  ball.style.transform = dx || dy ? `translate(${dx}px, ${dy}px) rotate(${dx / r}rad)` : "";
}
function prCatch(ball) {
  ball.classList.add("caught");
  prHappy(["play.caught1", "play.caught2", "play.caught3"]);
}
// A tap (or Enter / Space) on the ball: it rolls over to Captain by itself.
function prToss(ball) {
  const pr = ball.closest(".pr");
  if (!pr || pr.dataset.busy) return;
  const stage = pr.querySelector(".pr-stage").getBoundingClientRect();
  const b = ball.getBoundingClientRect();
  const dx = stage.left + stage.width * 0.47 - (b.left + b.width / 2);
  const dy = stage.top + stage.height * 0.8 - (b.top + b.height / 2);
  pr.dataset.busy = "1";
  prBallMove(ball, dx, dy, b.width / 2, 520);
  setTimeout(() => {
    delete pr.dataset.busy;
    prCatch(ball);
  }, prReduced() ? 0 : 520);
}
document.addEventListener("pointerdown", (event) => {
  const ball = event.target.closest?.(".pr-ball");
  if (!ball || (event.pointerType === "mouse" && event.button !== 0)) return;
  const pr = ball.closest(".pr");
  if (pr.dataset.busy) return;
  event.preventDefault();
  try {
    ball.setPointerCapture(event.pointerId);
  } catch {}
  const b = ball.getBoundingClientRect();
  prDrag = { ball, pr, id: event.pointerId, x0: event.clientX, y0: event.clientY, dx: 0, dy: 0, moved: false, stage: pr.querySelector(".pr-stage").getBoundingClientRect(), home: { x: b.left + b.width / 2, y: b.top + b.height / 2 }, r: b.width / 2 };
  ball.classList.add("held");
});
document.addEventListener("pointermove", (event) => {
  const d = prDrag;
  if (!d || event.pointerId !== d.id) return;
  // Keep the whole ball on the stage.
  const x = Math.min(d.stage.right - d.r, Math.max(d.stage.left + d.r, d.home.x + event.clientX - d.x0));
  const y = Math.min(d.stage.bottom - d.r, Math.max(d.stage.top + d.r, d.home.y + event.clientY - d.y0));
  d.dx = x - d.home.x;
  d.dy = y - d.home.y;
  if (Math.hypot(d.dx, d.dy) > 6) d.moved = true;
  if (d.moved) prBallMove(d.ball, d.dx, d.dy, d.r);
});
const prDrop = (event) => {
  const d = prDrag;
  if (!d || event.pointerId !== d.id) return;
  prDrag = null;
  d.ball.classList.remove("held");
  d.ball.dataset.handled = String(performance.now());
  if (event.type === "pointercancel") return prBallMove(d.ball, 0, 0, d.r, 420);
  if (!d.moved) return prToss(d.ball);
  prPlayed(d.pr);
  const x = (d.home.x + d.dx - d.stage.left) / d.stage.width;
  const y = (d.home.y + d.dy - d.stage.top) / d.stage.height;
  // Captain's paws and lap: the left two thirds, lower half of the stage.
  if (x < 0.64 && y > 0.42) return prCatch(d.ball);
  prBallMove(d.ball, 0, 0, d.r, 480);
  prSay(["play.missed1", "play.missed2"]);
};
document.addEventListener("pointerup", prDrop);
document.addEventListener("pointercancel", prDrop);
// Keyboard (and VoiceOver) activation of the ball: no pointer came first.
document.addEventListener("click", (event) => {
  const ball = event.target.closest?.(".pr-ball");
  if (!ball) return;
  if (performance.now() - Number(ball.dataset.handled || 0) < 600) return;
  prToss(ball);
});
function openKeeperPanel(view = keeperView) {
  const k = keeperNow();
  if (!Keeper.modeAllows(k, "invite")) return;
  keeperView = view;
  const name = Keeper.keeperName(k, languageCode());
  // Opening the panel (not a redraw while it is open) moves that state to its next line.
  if (view === "home" && !$("#choose-dialog")?.open) {
    const key = captainCardData().key;
    captainSeen[key] = (captainSeen[key] || 0) + 1;
  }
  const top = (title) => `<div class="kp-title"><button class="kp-back" data-action="keeper-view" data-view="home" aria-label="${t("kp.back")}">${icon("back")}</button><b>${title}</b><button class="kp-x" data-action="choose-close" aria-label="${t("close")}">×</button></div>`;
  const head = `<div class="kp-head">${keeperArt("idle")}<span><b>${esc(name)}</b></span><button class="kp-x" data-action="choose-close" aria-label="${t("close")}">×</button></div>${cornerTabsHTML(view)}`;
  let body;
  if (view === "looks") body = head + `<div class="kp-scroll"><div class="kp-note">${keeperArt("happy")}<p>${esc(tk("look.say", k))}</p></div>${keeperLooksHTML()}</div>`;
  else if (view === "play") body = head + keeperPlayHTML();
  else if (view === "organize") body = top(t("kp.org.title")) + `<div class="kp-scroll">${keeperOrganizeHTML()}</div>`;
  else if (view === "memory") body = top(t("kp.mem.title")) + `<div class="kp-scroll">${keeperMemoryHTML()}</div>`;
  else {
    const composer = `<div class="keeper-say kp-input"><textarea data-keeper-say rows="1" maxlength="300" enterkeyhint="enter" placeholder="${esc(tk("kp.say", k))}" aria-label="${esc(tk("kp.say", k))}">${esc(keeperUnsent())}</textarea><button class="kp-send" data-action="keeper-say" aria-label="${t("kp.send")}" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6 11.5l6-6 6 6"/></svg><span>${t("kp.send")}</span><i class="kp-spin" aria-hidden="true"></i></button></div>`;
    body = `${head}${keeperActsHTML()}<div class="keeper-msgs" aria-live="polite">${keeperLinesHTML()}</div>${composer}<p class="save-help keeper-local">${t(CaptainAI.devSettings() ? "kp.local" : "kp.simple")}</p>`;
  }
  const dialog = $("#choose-dialog");
  // Still typing (re-drawn while the field has the caret): keep the typing layout.
  const composing = dialog.open && view === "home" && document.activeElement?.matches?.("[data-keeper-say]") && dialog.querySelector(".kp.composing");
  // Play takes the full height: the stage is the point of it.
  dialog.innerHTML = `<div class="choose-sheet keeper-sheet keeper-chat kp corner ${kpTall || view === "play" ? "tall" : ""} ${composing ? "composing" : ""} ${view === "home" && !keeperChat.length && !kpTall ? "quiet" : ""}" data-view="${view}"><button class="choose-grabber kp-grab" data-action="kp-size" aria-label="${t(kpTall ? "corner.shrink" : "corner.expand")}"></button>${body}</div>`;
  if (!dialog.open) dialog.showModal();
  scrollKeeperChat();
  syncKeeperComposer();
}
function scrollKeeperChat() {
  const box = $("#choose-dialog .kp .keeper-msgs");
  if (box) box.scrollTop = box.scrollHeight;
}
const openKeeperChat = () => openKeeperPanel("home");
// Sorting out today: the pages in time order with a few plain observations.
// It only shows them; the journal is not changed.
function keeperOrganizeHTML() {
  const entry = todayEntry();
  const pages = entry && !entry.isDemo ? storyPagesOf(entry) : [];
  if (!pages.length) return `<div class="kp-note">${keeperArt("idle")}<p>${t("kp.org.none")}</p></div><button class="kp-main" data-action="today-photos">${t("kp.org.start")} →</button>`;
  const sorted = [...pages].sort((x, y) => (x.time && y.time ? (x.time < y.time ? -1 : x.time > y.time ? 1 : 0) : 0));
  const photos = pages.reduce((n, x) => n + x.refs.length, 0);
  const media = pages.some((x) => x.videos.length || x.audios.length);
  const most = [...pages].sort((x, y) => y.refs.length - x.refs.length)[0];
  const notes = [sorted.some((x, i) => x !== pages[i]) ? t("kp.org.order") : "", most.refs.length >= 2 && most !== sorted[0] ? t("kp.org.cover", { title: most.title || PL.pageLine(most.page, { t }), photos: most.refs.length }) : ""].filter(Boolean);
  const rows = sorted
    .map((pg, i) => {
      const bk = state().books.find((x) => x.id === pg.bookId);
      return `<li><button data-action="open-day" data-date="${esc(entry.date)}"${pg.id ? ` data-moment="${esc(pg.id)}"` : ""}><i class="ts-num">${String(i + 1).padStart(2, "0")}</i><span class="ts-thumb ${pg.refs[0] ? "" : "words"}">${pg.refs[0] ? `<img src="${esc(safePhoto(pg.refs[0]))}" alt="" width="80" height="96" loading="lazy">` : "<i></i><i></i><i></i>"}</span><span class="ts-row-copy"><b>${esc(pg.title || PL.pageLabel(pg.page, { t, dayPage: pg.page === entry }).label)}</b><small>${esc([pg.time, bk?.title].filter(Boolean).join(" · "))}${pg.videos.length ? " ▶" : ""}${pg.audios.length ? " ♪" : ""}</small></span></button></li>`;
    })
    .join("");
  return `<p class="kp-sum">${t(media ? "kp.org.sumMedia" : "kp.org.sum", { count: pages.length, photos })}</p><ul class="kp-pages">${rows}</ul>${notes.length ? `<div class="kp-note">${keeperArt("idle")}<p>${notes.map(esc).join("<br>")}</p></div>` : ""}<button class="kp-main" data-action="open-day" data-date="${esc(entry.date)}">${t("kp.org.open")} →</button><p class="save-help keeper-local">${t("kp.local")}</p>`;
}
// The page a Captain memory points at (for its display label when untitled).
function memoryPageOf(m) {
  const entry = state().entries.find((x) => x.date === m.date && (!m.momentId || x.moments?.some((p) => p.id === m.momentId)));
  return (m.momentId ? entry?.moments?.find((p) => p.id === m.momentId) : entry) || {};
}
// Looking back: one earlier page, found on this device. It asks once before
// it may look at earlier pages; the choice is kept in Settings.
function keeperMemoryHTML() {
  const k = keeperNow();
  const name = Keeper.keeperName(k, languageCode());
  if (!Keeper.modeAllows(k, "memories")) return `<div class="kp-note">${keeperArt("idle")}<p><b>${esc(tk("kp.mem.ask", k))}</b><br>${t("kp.mem.askBody")}</p></div><button class="kp-main" data-action="keeper-allow-memories">${t("kp.mem.allow")}</button><button class="kp-quiet" data-action="keeper-view" data-view="home">${t("kp.mem.no")}</button>`;
  keeperMemory ||= Keeper.pickMemory(state(), dateKey(), { exclude: keeperSeen, seed: Math.floor(Math.random() * 1000) });
  const m = keeperMemory;
  if (!m) return `<div class="kp-note">${keeperArt("idle")}<p>${t("kp.mem.none")}</p></div>`;
  if (!keeperSeen.includes(m.key)) keeperSeen.push(m.key);
  const bk = state().books.find((x) => x.id === m.bookId);
  const src = m.photo ? safePhoto(m.photo) : "";
  return `<div class="kp-note">${keeperArt("idle")}<p>${t("kp.mem.found")}</p></div><button class="kp-memory" data-action="open-day" data-date="${esc(m.date)}"${m.momentId ? ` data-moment="${esc(m.momentId)}"` : ""}>${src ? `<span class="ts-thumb"><img src="${esc(src)}" alt="" width="80" height="96"></span>` : ""}<span><small>${esc([friendlyDate(m.date), bk?.title].filter(Boolean).join(" · "))}</small><b>${esc(m.title || PL.pageLabel(memoryPageOf(m), { t, words: !m.words }).label)}</b>${m.words ? `<em>${esc(m.words)}</em>` : ""}</span></button><button class="kp-main" data-action="open-day" data-date="${esc(m.date)}"${m.momentId ? ` data-moment="${esc(m.momentId)}"` : ""}>${t("kp.mem.open")} →</button>${m.more ? `<button class="kp-quiet" data-action="keeper-memory-next">${t("kp.mem.next")}</button>` : ""}<p class="save-help keeper-local">${t("kp.local")}</p>`;
}
// The small chat: a few things it really can do; anything else is answered
// honestly instead of with the same sentence every time.
// The few words of the person's own line Captain echoes back ("火锅！…").
let keeperTopic = "";
function keeperAnswer(intent, said = "") {
  if (keeperBusy) return;
  if (said) {
    keeperChat.push({ who: "me", text: said });
    const heard = understandChat(said);
    intent = heard.intent;
    keeperTopic = heard.topic || "";
  } else keeperChat.push({ who: "me", text: t("keeper.chip." + intent) });
  // The line is in the chat: only now is the field emptied (and its draft forgotten).
  keeperBusy = true;
  if (said) {
    keepKeeperUnsent("");
    const field = $("[data-keeper-say]");
    if (field) field.value = "";
  }
  if (!refreshKeeperChat()) openKeeperPanel("home");
  // Development only (V10.13): chat lines may go to a model on this Mac
  // (Ollama, 127.0.0.1). Real features and every failure use the rules below.
  const local = said && CaptainAI.wantsModel(intent) ? CaptainAI.devSettings() : null;
  if (local) {
    askLocalModel(local, said, intent);
    return;
  }
  // Local replies are instant; the short pause shows that the line went and
  // blocks a second send.
  setTimeout(() => keeperReply(intent, Boolean(said)), 420);
}
// Sends only the line just typed and the earlier chat lines that are the
// person's own words or earlier model replies — never a page, a title, a
// photo or a sound (rule replies can name pages, so they are left out). The
// reply is a chat line only; it is never written into the journal.
async function askLocalModel(settings, said, intent) {
  const k = keeperNow();
  const look = keeperLooks(catalog, k.animal, languageCode()).find((item) => item.id === (k.outfit || DEFAULT_OUTFIT[k.animal]));
  const history = keeperChat
    .slice(0, -1)
    .filter((m) => m.who === "me" || m.local)
    .map(({ who, text }) => ({ who, text }));
  try {
    const reply = await CaptainAI.createLocalProvider(settings).reply({ text: said, history, language: languageCode(), name: Keeper.keeperName(k, languageCode()), wearing: look?.name || "" });
    keeperBusy = false;
    keeperChat.push({ who: "keeper", text: reply.text, local: true });
    keeperChat = keeperChat.slice(-12);
    logEvent("keeper_local_ai", { ms: reply.ms });
    const open = Boolean($("#choose-dialog")?.open && $("#choose-dialog .kp"));
    if (open && !refreshKeeperChat()) openKeeperPanel("home");
  } catch {
    logEvent("keeper_local_ai_fallback", {});
    keeperReply(intent, true, true);
  }
}
function keeperReply(intent, typed, fallback = false) {
  keeperBusy = false;
  const k = keeperNow();
  const name = Keeper.keeperName(k, languageCode());
  const open = Boolean($("#choose-dialog")?.open && $("#choose-dialog .kp"));
  if (intent === "organize" || (intent === "memory" && !typed)) {
    keeperChat = keeperChat.slice(-12);
    if (intent === "memory") keeperMemory = null;
    if (open) openKeeperPanel(intent);
    return;
  }
  let reply;
  if (["memory", "week", "shelf"].includes(intent)) {
    const answer = Keeper.localChat(intent, { state: state(), keeper: k, language: languageCode(), today: dateKey(), seed: Math.floor(Math.random() * 1000) });
    const values = { ...(answer.values || {}), name };
    if (values.date) values.date = friendlyDate(values.date);
    reply = { who: "keeper", text: t(answer.key, values), open: answer.open || null };
  } else if (intent === "write") reply = { who: "keeper", text: t("kp.writeHelp"), go: ["today-photos", "today-write"] };
  else {
    // A spoken reply that fits what was meant (a compliment, a finished page,
    // a tired day…). The hat lines need Captain to be wearing one.
    const wearingHat = keeperLooks(catalog, k.animal, languageCode()).find((look) => look.id === (k.outfit || DEFAULT_OUTFIT[k.animal]))?.kind === "hat";
    const event = intent === "hat" && !wearingHat ? "hatOff" : Keeper.LINE_COUNTS[`chat.${intent}`] ? intent : "unknown";
    // A line that echoes what they did needs the words; without them, listen.
    const echo = ["share", "shareHappy"].includes(event);
    reply = { who: "keeper", text: keeperSay(`chat.${echo && !keeperTopic ? "listen" : event}`, echo ? { thing: keeperTopic } : {}) };
  }
  if (fallback) reply.fallback = true;
  keeperChat.push(reply);
  keeperChat = keeperChat.slice(-12);
  // Closed meanwhile: the reply waits in the chat; the sheet is not reopened.
  if (open && !refreshKeeperChat()) openKeeperPanel("home");
}
function openKeeperOnboarding() {
  const k = keeperNow();
  keeperDraft ||= { animal: k.animal, name: k.name, mode: k.mode };
  const d = keeperDraft;
  const intro = `<div class="keeper-intro"><span class="keeper">${keeperImage(catalog, { animal: "cat", mood: "idle", label: "" })}</span><span><b>${t("keeper.animal.cat")}</b><small>${t("keeper.animal.catHint")}</small></span></div>`;
  const modes = Keeper.MODES.map((m) => `<button class="keeper-mode ${d.mode === m ? "selected" : ""}" data-action="keeper-pick-mode" data-mode="${m}" aria-pressed="${d.mode === m}"><b>${t("keeper.mode." + m)}</b><small>${t("keeper.mode." + m + "Hint")}</small></button>`).join("");
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet keeper-onboard"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("keeper.onboard.title")}</h2><p class="save-help">${t("keeper.onboard.body")}</p>${intro}<h3>${t("keeper.onboard.name")}</h3><input class="name-input" data-keeper-name maxlength="12" value="${esc(d.name)}" placeholder="${esc(Keeper.defaultName(d.animal, languageCode()))}"><h3>${t("keeper.onboard.mode")}</h3><div class="keeper-modes">${modes}</div><p class="save-help keeper-local">🔒 ${t("keeper.onboard.privacy")}</p><button class="primary full-width" data-action="keeper-start">${t("keeper.onboard.start")}</button><button class="choose-cancel" data-action="keeper-onboard-later">${t("keeper.invite.later")}</button></div>`;
  if (!dialog.open) dialog.showModal();
}
document.addEventListener("input", (event) => {
  if (!event.target.matches?.("[data-keeper-say]")) return;
  if (event.isComposing === false) keeperComposing = false; // some keyboards skip compositionend
  keepKeeperUnsent(event.target.value);
  syncKeeperComposer();
});
// Tapping Send must not take the caret out of the field (the keyboard would
// close). Only the mouse-down default is held back: holding back touchstart
// would also swallow the tap itself.
document.addEventListener("mousedown", (event) => {
  if (event.target.closest?.(".kp-send") && document.activeElement?.matches?.("[data-keeper-say]")) event.preventDefault();
});
// While the field has the caret on a touch screen the shortcuts step aside.
// They come back a moment after the caret leaves — not at once, or the sheet
// would change shape under the finger that is tapping × or a shortcut.
let keeperFieldTimer;
document.addEventListener("focusin", (event) => {
  if (!event.target.matches?.("[data-keeper-say]") || !matchMedia("(pointer: coarse)").matches) return;
  clearTimeout(keeperFieldTimer);
  event.target.closest(".kp")?.classList.add("composing");
});
document.addEventListener("focusout", (event) => {
  if (!event.target.matches?.("[data-keeper-say]")) return;
  const sheet = event.target.closest(".kp");
  keeperFieldTimer = setTimeout(() => {
    if (!sheet?.contains(document.activeElement) || !document.activeElement.matches("[data-keeper-say]")) {
      sheet?.classList.remove("composing");
      scrollKeeperChat(); // the shortcuts came back: keep the newest line in view
    }
  }, 350);
});
document.addEventListener("compositionstart", (event) => {
  if (event.target.matches?.("[data-keeper-say]")) keeperComposing = true;
});
document.addEventListener("compositionend", (event) => {
  if (event.target.matches?.("[data-keeper-say]")) keeperComposing = false;
});
document.addEventListener("change", (event) => {
  if (!event.target.matches?.("[data-keeper-rename]")) return;
  saveKeeper((k) => (k.name = event.target.value.trim().slice(0, 12)));
  render();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  if (event.target.matches?.("[data-keeper-say]")) {
    // Return is a new line (never "send"); ⌘ / Ctrl + Return sends — but not
    // while the input method is still choosing characters.
    if (event.isComposing || event.keyCode === 229 || keeperComposing) return;
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      $('.kp-send[data-action="keeper-say"]')?.click();
    }
    return;
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
}
// A line said after a tap fades away by itself.
function keeperLineLater() {
  clearTimeout(keeperBack);
  keeperBack = setTimeout(() => {
    keeperLine = "";
    const bubble = $(".keeper-home .keeper-bubble, .keeper-shelf .keeper-bubble");
    if (!bubble) return;
    bubble.classList.add("fading");
    setTimeout(() => bubble.remove(), 400);
  }, 5000);
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
      return `<button class="search-hit" data-action="open-day" data-date="${esc(hit.date)}"${hit.momentId ? ` data-moment="${esc(hit.momentId)}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : `<span class="search-hit-mark" aria-hidden="true">${hit.kind === "list" ? "✓" : "Aa"}</span>`}<span><small>${esc(when)}</small><b>${hit.title ? marked(hit.title, words) : esc(t(hit.kind === "list" ? "day.checklist" : "label.page"))}</b>${hit.snippet && hit.snippet !== hit.title ? `<em>${marked(hit.snippet, words)}</em>` : ""}</span></button>`;
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
  return `<section class="memory-card" aria-label="${esc(label)}"><div class="section-heading"><div><h2>${esc(label)}</h2><small>${esc(new Date(`${first.date}T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric", weekday: "short" }))}</small></div><button class="memory-close" data-action="memory-dismiss" aria-label="${t("memory.dismiss")}">×</button></div><button class="memory-open ${src ? "has-photo" : ""}" data-action="open-day" data-revisit="1" data-date="${esc(first.date)}"${first.momentId ? ` data-moment="${esc(first.momentId)}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}<span><b>${esc(first.title || PL.dayLabel(first.entry, { t }))}</b>${first.words ? `<small>${esc(first.words)}</small>` : ""}<i>${t("memory.open", { count: first.pages })} ›</i></span></button>${others}</section>`;
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
  return Boolean(today && !isSampleDay(today) && (hasDayPageContent(today) || today.moments?.length));
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
// C2: the last backup that was kept but could not include every file.
const BACKUP_PARTIAL_KEY = "little-days.last-backup-partial";
// Where a media file is used: "11月3日" for each day that has it.
function mediaUsedOn(id) {
  const ref = `"media:${id}"`;
  const days = [...state().entries, ...Object.values(state().drafts || {})].filter((e) => JSON.stringify(e).includes(ref)).map((e) => e.date);
  return [...new Set(days)].sort();
}
// C2: which files could not be read; go on without them, or stop.
function backupMissingSheet(missing) {
  const dialog = $("#choose-dialog");
  const kindName = (k) => t(k === "video" ? "backup.kind.video" : k === "audio" ? "backup.kind.audio" : "backup.kind.photo");
  const rows = missing
    .slice(0, 30)
    .map((m) => {
      const days = mediaUsedOn(m.id).map((d) => friendlyDate(d)).join("、");
      return `<li><b>${esc(kindName(m.kind))}</b>${m.name ? ` · ${esc(m.name)}` : ""}<small>${days ? esc(t("backup.usedOn", { days })) : ""}</small></li>`;
    })
    .join("");
  dialog.innerHTML = `<div class="choose-sheet backup-missing" role="alertdialog" aria-labelledby="bm-title"><div class="choose-grabber" aria-hidden="true"></div><h2 id="bm-title">${t("backup.missingTitle", { count: missing.length })}</h2><p class="save-help">${t("backup.missingBody")}</p><ul class="bm-list">${rows}</ul>${missing.length > 30 ? `<p class="save-help">${t("backup.missingMore", { count: missing.length - 30 })}</p>` : ""}<button class="primary full-width" data-bk="go">${t("backup.missingGo", { count: missing.length })}</button><button class="choose-cancel" data-bk="stop">${t("cancel")}</button></div>`;
  if (!dialog.open) dialog.showModal();
  return new Promise((resolve) => {
    const done = (value) => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("close", onClose);
      if (dialog.open) dialog.close();
      resolve(value);
    };
    const onClick = (event) => {
      const b = event.target.closest("[data-bk]");
      if (b) done(b.dataset.bk === "go");
    };
    const onClose = () => done(false);
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("close", onClose);
  });
}
// C3: after the file is handed over, ask whether it was kept.
function backupKeptSheet(backup) {
  const dialog = $("#choose-dialog");
  const partial = !backup.complete;
  dialog.innerHTML = `<div class="choose-sheet backup-kept" role="alertdialog" aria-labelledby="bk-title"><div class="choose-grabber" aria-hidden="true"></div><h2 id="bk-title">${t("backup.keptTitle")}</h2><p class="save-help">${t(partial ? "backup.keptBodyPartial" : "backup.keptBody", { count: backup.missing?.length || 0 })}</p><button class="primary full-width" data-bk="yes">${t("backup.keptYes")}</button><button class="choose-cancel" data-bk="no">${t("backup.keptNo")}</button></div>`;
  if (!dialog.open) dialog.showModal();
  return new Promise((resolve) => {
    const done = (value) => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("close", onClose);
      if (dialog.open) dialog.close();
      resolve(value);
    };
    const onClick = (event) => {
      const b = event.target.closest("[data-bk]");
      if (b) done(b.dataset.bk === "yes");
    };
    const onClose = () => done(false);
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("close", onClose);
  });
}
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
  return state().entries.filter((e) => !isSampleDay(e) && (hasDayPageContent(e) || e.moments?.length)).length;
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
  let partial = null;
  try {
    partial = JSON.parse(readKey(BACKUP_PARTIAL_KEY) || "null");
  } catch {}
  // A newer backup that could not include every file says so.
  if (partial?.date && (!last || partial.date > last)) return `<p class="backup-when partial">${t("backup.whenPartial", { date: friendlyDate(partial.date), count: partial.missing })}${last ? ` ${t("backup.lastComplete", { date: friendlyDate(last) })}` : ""}</p>`;
  if (!last) return `<p class="backup-when">${t("backup.whenNever")}</p>`;
  const days = daysBetween(last, dateKey());
  return `<p class="backup-when">${t("backup.when", { date: friendlyDate(last), days })}</p>`;
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
// A2 · Leaving the app (home screen, app switcher, phone locked, closing the
// tab): keep what is typed now instead of waiting for the next save tick.
// Changes are also kept while editing (a short pause after each change);
// this is the last chance, not the only one. On return the saved state is
// checked again (the database write or a photo may not have finished).
function saveBeforeLeaving(reason) {
  try {
    if (editor && draftDirty) flushDraft();
  } catch (error) {
    setDraftState("failed");
    logEvent("leave_save_failed", { reason, code: error?.code || error?.name || "" });
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveBeforeLeaving("hidden");
  else if (editor && (page === "studio" || story)) confirmMediaSaved();
});
window.addEventListener("pagehide", () => saveBeforeLeaving("pagehide"));
document.addEventListener("freeze", () => saveBeforeLeaving("freeze"));
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
let flipIndex = 0,
  flipTurn = 0;
function flipPages(bookId) {
  // V10.41 (S1): sample days are not part of reading a book.
  return bookSharePages(state(), bookId);
}
// ---------- V10.11 · The full-screen Book Reader ----------
// Opening a book reads it like a book: one page at a time on a full screen
// (the bottom menu hidden), the cover first. The pages are the app's own
// read-only rendering of the real journal (canvasHTML, the same as Studio,
// the day page and the export). Swipe or tap the edges to turn; tap the
// middle to show / hide the controls; double-tap a photo to look at it
// closely; pinch the page to read small words. Media never plays by itself,
// and the book's music stays silent until asked for.
let readerBook = null;
let readerChrome = true;
let readerZoom = { scale: 1, x: 0, y: 0 };
let readerSeenKeys = "";
function readerPages() {
  return readerBook ? flipPages(readerBook) : [];
}
function readerKey() {
  return flipIndex > 0 ? Reader.keyOf(readerPages()[flipIndex - 1]) : Reader.COVER;
}
// Open the reader on a book at a page (by identity) — "resume" uses the last read page.
function openReader(bookId, key = "resume") {
  const book = state().books.find((b) => b.id === bookId);
  if (!book) return;
  flushDraft();
  quickResult = null;
  readerBook = bookId;
  selectedBook = bookId;
  const pages = flipPages(bookId);
  const wanted = key === "resume" ? Reader.savedPosition(bookId) || Reader.COVER : key;
  flipIndex = Reader.positionOf(pages, wanted);
  flipTurn = 0;
  readerChrome = true;
  readerZoom = { scale: 1, x: 0, y: 0 };
  page = "reader";
  render();
}
function closeReader() {
  Reader.savePosition(readerBook, readerKey());
  const at = flipPages(readerBook)[flipIndex];
  if (at?.date) captainRead = { book: readerBook, key: readerKey(), date: at.date, momentId: at.moment?.id || "", at: Date.now() };
  document.querySelectorAll("#app audio, #app video").forEach((m) => m.pause());
  page = "books";
  selectedBook = readerBook;
  render();
  $("#app-scroll").scrollTop = 0;
}
function readerHTML() {
  const book = state().books.find((b) => b.id === readerBook);
  if (!book) {
    page = "books";
    return booksPage();
  }
  const pages = flipPages(book.id);
  const count = pages.length;
  flipIndex = Math.max(0, Math.min(count, flipIndex));
  const when = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric" });
  const turn = flipTurn > 0 ? "turn-next" : flipTurn < 0 ? "turn-prev" : "";
  flipTurn = 0;
  let paper, caption, edit;
  if (flipIndex === 0) {
    const range = dateRange(pages);
    paper = `<article class="flip-page reader-page is-cover ${turn}"><div class="reader-cover">${coverHTML(book, ctx())}<h2>${esc(book.title)}</h2>${book.description ? `<p>${esc(book.description)}</p>` : ""}<small>${range ? `${range.from === range.to ? when(range.from) : `${when(range.from)} – ${when(range.to)}`} · ` : ""}${t("bookShare.pages", { count })}</small>${count ? `<span class="reader-swipe">${t("reader.swipe")}</span>` : `<span class="reader-swipe">${t("reader.empty")}</span>`}</div></article>`;
    caption = "";
    edit = `<button class="reader-edit" data-action="edit-book" data-book="${esc(book.id)}">✎ ${t("reader.editBook")}</button>`;
  } else {
    const { date, entry, moment } = pages[flipIndex - 1];
    const pageData = moment || entry;
    const demo = entry.isDemo || moment?.isDemo;
    paper = `<article class="flip-page reader-page ${turn}"><div class="flip-canvas">${sharedCanvasHTML(pageData, ctx(), { readOnly: true, dayPage: !moment }).replace(/ tabindex="0"/g, ' tabindex="-1"')}</div></article>`;
    const title = pageData.title && !["line", "smart", "text"].includes(pageData.layoutTemplate) && moment ? `<b class="reader-title-line">${esc(pageData.title)}</b>` : "";
    caption = `<div class="reader-caption flip-head"><span>${esc(when(date))}${moment?.time ? ` · ${esc(moment.time)}` : ""}${demo ? ` <span class="badge">${t("entry.sample")}</span>` : draftTagHTML(date)}</span>${title}<button class="reader-full" data-action="reader-full" hidden>${t("reader.full")} ›</button></div>`;
    edit = demo ? "" : `<button class="reader-edit flip-edit" data-action="read-edit" data-date="${esc(date)}" data-moment="${esc(moment?.id || "")}">✎ ${t("reader.edit")}</button>`;
  }
  const track = findTrack(catalog, readerMusicId());
  const playing = track && music.current() === track.id && music.playing();
  const musicBtn = track ? `<button class="reader-music ${playing ? "on" : ""}" data-action="reader-music" aria-pressed="${Boolean(playing)}" aria-label="${t(playing ? "reader.musicOff" : "reader.musicOn")}">${READER_ICONS.music}</button>` : `<span class="reader-music-gap" aria-hidden="true"></span>`;
  const segments = Array.from({ length: count + 1 }, (_, i) => `<i class="${i === 0 ? "cover" : ""} ${i <= flipIndex ? "done" : ""}"></i>`).join("");
  return `<section class="reader ${readerChrome ? "" : "chrome-off"} ${readerZoom.scale > 1 ? "zoomed" : ""}" data-reader aria-roledescription="book" aria-label="${esc(book.title)}">
<header class="reader-top"><button class="reader-round" data-action="reader-back" aria-label="${t("reader.back")}">${icon("back")}</button><div class="reader-name"><small>MY BOOK</small><b>${esc(book.title)}</b></div>${edit}<button class="reader-round" data-action="reader-more" aria-label="${t("reader.more")}">${READER_ICONS.more}</button></header>
<div class="reader-stage" data-flip-stage data-reader-stage>${paper}${caption}</div>
<button class="reader-unzoom" data-action="reader-unzoom" ${readerZoom.scale > 1 ? "" : "hidden"}>${t("reader.unzoom")}</button>
<footer class="reader-bottom"><button class="reader-round" data-action="reader-thumbs" aria-label="${t("reader.thumbs")}">${READER_ICONS.grid}</button><nav class="flip-nav reader-nav" aria-label="${t("reader.label")}"><button data-action="flip" data-dir="-1" ${flipIndex === 0 ? "disabled" : ""} aria-label="${t("journey.prev")}">‹</button><span class="reader-count" aria-live="polite">${esc(Reader.positionLabel(flipIndex, count, t))}</span><button data-action="flip" data-dir="1" ${flipIndex >= count ? "disabled" : ""} aria-label="${t("journey.next")}">›</button></nav>${musicBtn}</footer>
<div class="reader-progress" aria-hidden="true">${segments}</div></section>`;
}
const READER_ICONS = {
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5c2.7-1 5.3-1 8 .8 2.7-1.8 5.3-1.8 8-.8v13c-2.7-1-5.3-1-8 .8-2.7-1.8-5.3-1.8-8-.8Z"/><path d="M12 6.3v13"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
};
// The music for where the reader is: the page's own piece, else the book's.
function readerMusicId() {
  const book = state().books.find((b) => b.id === readerBook);
  if (!book) return "";
  const item = flipIndex > 0 ? readerPages()[flipIndex - 1] : null;
  return (item?.moment || item?.entry)?.music || bookMusic(state().books, book.id) || "";
}
// After drawing: remember the place, load this page's (and the next ones')
// media, and offer "read the full text" where words do not fit the paper.
function afterReaderRender() {
  if (page !== "reader") return;
  Reader.savePosition(readerBook, readerKey());
  const pages = readerPages();
  const near = [flipIndex - 2, flipIndex - 1, flipIndex].map((i) => pages[i]).filter(Boolean);
  const clips = near.flatMap((item) => (item.moment ? item.moment.media || [] : item.entry.media || []));
  const keys = clips.map((clip) => clip.source).join(",");
  if (keys && keys !== readerSeenKeys) {
    readerSeenKeys = keys;
    loadScope("reader", clips);
  }
  const body = document.querySelector(".reader-page .canvas-body");
  const full = $(".reader-full");
  if (full && body) full.hidden = !(body.scrollHeight > body.clientHeight + 2);
  applyReaderZoom();
}
function turnPage(dir) {
  if (page !== "reader" || !dir) return;
  const count = readerPages().length;
  const next = Math.max(0, Math.min(count, flipIndex + dir));
  if (next === flipIndex) return;
  document.querySelectorAll("#app audio, #app video").forEach((m) => m.pause());
  flipIndex = next;
  flipTurn = dir;
  readerZoom = { scale: 1, x: 0, y: 0 };
  render();
}
function goToPosition(at) {
  const dir = at > flipIndex ? 1 : at < flipIndex ? -1 : 0;
  flipIndex = at;
  flipTurn = dir;
  readerZoom = { scale: 1, x: 0, y: 0 };
  render();
}
function applyReaderZoom() {
  const paper = document.querySelector(".reader-page");
  if (!paper) return;
  const { scale, x, y } = readerZoom;
  paper.style.transform = scale > 1 ? `translate(${x}px, ${y}px) scale(${scale})` : "";
  document.querySelector(".reader")?.classList.toggle("zoomed", scale > 1);
  const unzoom = $(".reader-unzoom");
  if (unzoom) unzoom.hidden = scale <= 1;
}
// Gestures on the page. One finger: a mostly sideways move turns the page
// (it follows the finger); a tap on the left / right fifth turns, the
// middle shows / hides the controls; a double tap on a photo looks at it
// closely. Two fingers: zoom the page; then one finger moves it.
// Taps on players and buttons always go to them.
const readerPointers = new Map();
let readerGesture = null,
  readerPinch = null,
  readerTapTimer = 0,
  readerLastTap = null,
  readerClickBlock = 0;
const READER_CONTROLS = 'button, a, input, select, textarea, audio, video, .layer-play, .audio-ticket, .media-layer, [data-action]:not([data-action="zoom-photo"])';
document.addEventListener("pointerdown", (event) => {
  if (page !== "reader" || !event.target.closest?.("[data-reader-stage]") || $("#choose-dialog")?.open || $("#lightbox")?.open) return;
  readerPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const stage = event.target.closest("[data-reader-stage]").getBoundingClientRect();
  if (readerPointers.size === 2) {
    const [a, b] = [...readerPointers.values()];
    readerPinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: readerZoom.scale };
    readerGesture = null;
    return;
  }
  readerGesture = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), mode: null, control: Boolean(event.target.closest(READER_CONTROLS)), edge: event.clientX - stage.left < 16, width: stage.width, left: stage.left, target: event.target, startX: readerZoom.x, startY: readerZoom.y };
});
document.addEventListener("pointermove", (event) => {
  if (page !== "reader" || !readerPointers.has(event.pointerId)) return;
  readerPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (readerPinch && readerPointers.size >= 2) {
    const [a, b] = [...readerPointers.values()];
    readerZoom.scale = Math.max(1, Math.min(3, (readerPinch.scale * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, readerPinch.dist)));
    if (readerZoom.scale === 1) readerZoom = { scale: 1, x: 0, y: 0 };
    applyReaderZoom();
    return;
  }
  const g = readerGesture;
  if (!g || g.id !== event.pointerId) return;
  const dx = event.clientX - g.x,
    dy = event.clientY - g.y;
  if (!g.mode && Math.hypot(dx, dy) > 10) g.mode = readerZoom.scale > 1 ? "pan" : Math.abs(dx) > Math.abs(dy) * 1.4 && !g.edge ? "swipe" : "none";
  const paper = document.querySelector(".reader-page");
  if (g.mode === "pan") {
    readerZoom.x = g.startX + dx;
    readerZoom.y = g.startY + dy;
    applyReaderZoom();
  } else if (g.mode === "swipe" && paper) {
    const count = readerPages().length;
    const blocked = (dx > 0 && flipIndex === 0) || (dx < 0 && flipIndex >= count);
    paper.style.transition = "none";
    paper.style.transform = `translateX(${blocked ? dx * 0.25 : dx}px)`;
  }
});
const endReaderPointer = (event) => {
  if (!readerPointers.has(event.pointerId)) return;
  readerPointers.delete(event.pointerId);
  if (readerPinch) {
    if (readerPointers.size < 2) readerPinch = null;
    readerGesture = null;
    readerClickBlock = performance.now();
    return;
  }
  const g = readerGesture;
  readerGesture = null;
  if (!g || g.id !== event.pointerId || event.type === "pointercancel") return;
  const dx = event.clientX - g.x,
    dt = Math.max(1, performance.now() - g.t);
  const paper = document.querySelector(".reader-page");
  if (g.mode === "swipe") {
    readerClickBlock = performance.now();
    const fast = Math.abs(dx) / dt > 0.5 && Math.abs(dx) > 30;
    if (Math.abs(dx) > g.width * 0.18 || fast) {
      const dir = dx < 0 ? 1 : -1;
      const count = readerPages().length;
      if ((dir > 0 && flipIndex < count) || (dir < 0 && flipIndex > 0)) return turnPage(dir);
    }
    if (paper) {
      paper.style.transition = "transform 200ms ease-out";
      paper.style.transform = "";
    }
    return;
  }
  if (g.mode) {
    readerClickBlock = performance.now();
    return;
  }
  if (g.control) return; // a player, a button: its own click handles it
  // A tap. On a photo, wait a moment for a second tap (look closely).
  const photo = g.target.closest?.(".photo-layer img, .canvas-photo img, .canvas-photo, .photo-layer");
  const photoSrc = photo && (photo.tagName === "IMG" ? photo.currentSrc || photo.src : photo.querySelector("img")?.currentSrc || photo.dataset.src || "");
  const zone = (event.clientX - g.left) / g.width;
  const act = () => {
    if (zone < 0.2) turnPage(-1);
    else if (zone > 0.8) turnPage(1);
    else toggleReaderChrome();
  };
  if (photo) {
    const now = performance.now();
    if (readerLastTap && readerLastTap.src === photoSrc && now - readerLastTap.t < 320) {
      clearTimeout(readerTapTimer);
      readerLastTap = null;
      return openZoomViewer(photoSrc);
    }
    readerLastTap = { src: photoSrc, t: now };
    clearTimeout(readerTapTimer);
    readerTapTimer = setTimeout(() => {
      readerLastTap = null;
      act();
    }, 320);
    return;
  }
  act();
};
document.addEventListener("pointerup", endReaderPointer);
document.addEventListener("pointercancel", endReaderPointer);
// A drag or pinch is not also a click on whatever is under the finger.
document.addEventListener(
  "click",
  (event) => {
    if (page === "reader" && event.target.closest?.("[data-reader-stage]") && performance.now() - readerClickBlock < 350) {
      event.stopPropagation();
      event.preventDefault();
    }
  },
  true,
);
function toggleReaderChrome() {
  readerChrome = !readerChrome;
  document.querySelector(".reader")?.classList.toggle("chrome-off", !readerChrome);
}
document.addEventListener("keydown", (event) => {
  if (page !== "reader" || event.target.closest?.("input, textarea, select, [contenteditable]") || $("#choose-dialog")?.open) return;
  if (event.key === "ArrowRight") turnPage(1);
  if (event.key === "ArrowLeft") turnPage(-1);
  if (event.key === "Escape" && !$("#lightbox")?.open) closeReader();
});
// All pages: the cover and every page, small; tap one to go there.
function openReaderThumbs() {
  const book = state().books.find((b) => b.id === readerBook);
  const pages = readerPages();
  const when = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(locale(), { month: "short", day: "numeric" });
  // Not a <button>: a page can hold its own play button, and buttons cannot nest.
  const item = (at, inner, label, extra = "") => `<div class="reader-thumb ${at === flipIndex ? "current" : ""}" role="button" tabindex="0" data-action="reader-go" data-at="${at}" aria-current="${at === flipIndex}" aria-label="${at ? esc(label) : t("reader.coverEntry")}"><span class="reader-thumb-paper" inert>${inner}</span><small>${label}${extra}</small></div>`;
  const cover = item(0, `<span class="reader-thumb-cover">${coverHTML(book, ctx())}</span>`, t("reader.coverEntry"));
  const rest = pages.map(({ date, entry, moment }, i) => item(i + 1, sharedCanvasHTML(moment || entry, ctx(), { readOnly: true, dayPage: !moment }), `${i + 1} · ${esc(when(date))}`, entry.isDemo || moment?.isDemo ? ` <span class="badge">${t("entry.sample")}</span>` : draftTagHTML(date))).join("");
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet kp reader-sheet"><div class="choose-grabber" aria-hidden="true"></div><div class="kp-title"><span></span><b>${t("reader.thumbs")}</b><button class="kp-x" data-action="choose-close" aria-label="${t("close")}">×</button></div><p class="reader-sheet-note">${t("reader.thumbsHint", { count: pages.length })}</p><div class="reader-thumbs">${cover}${rest}</div></div>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".reader-thumb.current")?.scrollIntoView({ block: "center" });
}
document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches?.(".reader-thumb, .day-page-thumb")) {
    event.preventDefault();
    event.target.click();
  }
});
function openReaderMore() {
  const pages = readerPages();
  const item = flipIndex > 0 ? pages[flipIndex - 1] : null;
  const row = (attrs, label, value = "") => `<button class="s2-more-row" ${attrs}><span><b>${label}</b></span><span class="v">${value}<i class="s2-chev" aria-hidden="true">›</i></span></button>`;
  const listed = item ? dayListItems(item.date) : [];
  const firstOfDay = item && (flipIndex === 1 || pages[flipIndex - 2].date !== item.date);
  const checklist = firstOfDay && listed.length ? `<div class="reader-list flip-checklist"><b>${t("day.checklist")}</b>${listed.map((x) => `<span>✓ ${esc(x)}</span>`).join("")}</div>` : "";
  const track = findTrack(catalog, readerMusicId());
  const demo = item && isSampleDay(item.entry);
  // D3 (V10.44): a day cover can be hidden from reading, and shown again
  // (a display choice only: nothing is deleted).
  const coverRow = item && isDayCover(item.entry) ? row(`data-action="day-cover-toggle" data-date="${esc(item.date)}" data-hide="${item.entry.dayCoverHidden ? "" : "1"}"`, t(item.entry.dayCoverHidden ? "cover.show" : "cover.hide")) : "";
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet kp reader-sheet"><div class="choose-grabber" aria-hidden="true"></div><div class="kp-title"><span></span><b>${item ? esc(Reader.positionLabel(flipIndex, pages.length, t)) : t("reader.more")}</b><button class="kp-x" data-action="choose-close" aria-label="${t("close")}">×</button></div>${checklist}${item ? row(`data-action="open-day" data-date="${esc(item.date)}"`, t("flip.openDay")) : ""}${coverRow}${row('data-action="music-sheet" data-target="book"', t("music.bookTitle"), track ? esc(trackName(track, languageCode())) : "")}${flipIndex > 0 ? row('data-action="reader-go" data-at="0"', t("reader.toCover")) : ""}${item && !demo ? `<div class="reader-keeper">${keeperAskHTML(item.date, item.moment?.id || "")}</div>` : ""}</div>`;
  if (!dialog.open) dialog.showModal();
}
// The whole words of a page that do not fit on the paper (read only; from the journal itself).
function openReaderFullText() {
  const item = readerPages()[flipIndex - 1];
  if (!item) return;
  const pageData = item.moment || item.entry;
  const when = new Date(`${item.date}T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric" });
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet kp reader-sheet reader-text"><div class="choose-grabber" aria-hidden="true"></div><div class="kp-title"><span></span><b>${t("reader.full")}</b><button class="kp-x" data-action="choose-close" aria-label="${t("close")}">×</button></div><small class="reader-text-when">${esc(when)}${item.moment?.time ? ` · ${esc(item.moment.time)}` : ""}</small>${pageData.title ? `<h3>${Rich.richHTML(pageData.title, pageData.titleMarks, esc)}</h3>` : ""}<div class="reader-text-body">${Rich.richHTML(pageData.body || "", pageData.bodyMarks, esc)}</div></div>`;
  if (!dialog.open) dialog.showModal();
}
// Look at a photo closely: pinch or double-tap to zoom, drag to move; closing returns to the page as it was.
let zoomView = { scale: 1, x: 0, y: 0 };
function openZoomViewer(src) {
  if (!src) return;
  zoomView = { scale: 1, x: 0, y: 0 };
  openLightbox(src);
  $("#lightbox").classList.add("zoomable");
  applyZoomView();
}
function applyZoomView() {
  const img = $("#lightbox-image");
  if (img) img.style.transform = zoomView.scale > 1 ? `translate(${zoomView.x}px, ${zoomView.y}px) scale(${zoomView.scale})` : "";
}
const zoomPointers = new Map();
let zoomPinch = null,
  zoomDrag = null,
  zoomLastTap = 0;
$("#lightbox").addEventListener("pointerdown", (event) => {
  if (event.target.id !== "lightbox-image") return;
  zoomPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (zoomPointers.size === 2) {
    const [a, b] = [...zoomPointers.values()];
    zoomPinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: zoomView.scale };
  } else zoomDrag = { x: event.clientX, y: event.clientY, sx: zoomView.x, sy: zoomView.y, moved: false };
  event.preventDefault();
});
$("#lightbox").addEventListener("pointermove", (event) => {
  if (!zoomPointers.has(event.pointerId)) return;
  zoomPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (zoomPinch && zoomPointers.size >= 2) {
    const [a, b] = [...zoomPointers.values()];
    zoomView.scale = Math.max(1, Math.min(4, (zoomPinch.scale * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, zoomPinch.dist)));
    if (zoomView.scale === 1) zoomView = { scale: 1, x: 0, y: 0 };
  } else if (zoomDrag && zoomView.scale > 1) {
    zoomDrag.moved = true;
    zoomView.x = zoomDrag.sx + event.clientX - zoomDrag.x;
    zoomView.y = zoomDrag.sy + event.clientY - zoomDrag.y;
  }
  applyZoomView();
});
const endZoomPointer = (event) => {
  if (!zoomPointers.has(event.pointerId)) return;
  zoomPointers.delete(event.pointerId);
  if (zoomPointers.size < 2) zoomPinch = null;
  if (!zoomPointers.size) {
    const tap = zoomDrag && !zoomDrag.moved;
    zoomDrag = null;
    if (tap) {
      const now = performance.now();
      if (now - zoomLastTap < 320) {
        zoomView = zoomView.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.2, x: 0, y: 0 };
        applyZoomView();
        zoomLastTap = 0;
      } else zoomLastTap = now;
    }
  }
};
$("#lightbox").addEventListener("pointerup", endZoomPointer);
$("#lightbox").addEventListener("pointercancel", endZoomPointer);
$("#lightbox").addEventListener("wheel", (event) => {
  if (!$("#lightbox").classList.contains("zoomable")) return;
  event.preventDefault();
  zoomView.scale = Math.max(1, Math.min(4, zoomView.scale * (event.deltaY < 0 ? 1.15 : 0.87)));
  if (zoomView.scale === 1) zoomView = { scale: 1, x: 0, y: 0 };
  applyZoomView();
}, { passive: false });
$("#lightbox").addEventListener("close", () => {
  $("#lightbox").classList.remove("zoomable");
  zoomView = { scale: 1, x: 0, y: 0 };
  applyZoomView();
});
// The book's main way in: read it (from where I stopped, or from the cover).
function readerEntryHTML(book) {
  const pages = flipPages(book.id);
  const saved = Reader.savedPosition(book.id);
  const at = saved ? Reader.positionOf(pages, saved) : 0;
  const item = at > 0 ? pages[at - 1] : null;
  const title = item ? String((item.moment || item.entry).title || "").trim() : "";
  const main = `<button class="primary full-width reader-start" data-action="reader-open" data-book="${esc(book.id)}">${READER_ICONS.book}<span>${at > 0 ? t("reader.continue", { n: at }) : t("reader.start")}</span></button>`;
  const hint = at > 0 ? `<p class="reader-start-hint">${title ? `${t("reader.last", { title: esc(title) })} · ` : ""}<button class="text-button" data-action="reader-open" data-book="${esc(book.id)}" data-at="cover">${t("reader.fromCover")}</button></p>` : `<p class="reader-start-hint">${t("reader.hint", { count: pages.length })}</p>`;
  return main + hint;
}
// The cover as its own entry in the page list.
function coverEntryHTML(book) {
  return `<button class="day-cover cover-entry" data-action="reader-open" data-book="${esc(book.id)}" data-at="cover"><span class="day-cover-photos n0"><span class="cover-entry-mini">${coverHTML(book, ctx())}</span></span><span class="day-cover-copy"><span class="day-cover-date"><b>${t("reader.coverEntry")}</b></span><strong>${esc(book.title)}</strong><small>${t("reader.coverPos", { count: flipPages(book.id).length })}</small></span></button>`;
}
function booksPage() {
  if (selectedBook) {
    const book = state().books.find((b) => b.id === selectedBook),
      entries = bookPages(state(), selectedBook),
      days = bookDays(state(), selectedBook, bookFilter),
      months = bookMonths(state(), selectedBook);
    const filtered = bookFilter.month || bookFilter.date;
    return `<div class="section-heading"><button class="back-button" data-action="all-books">${icon("back")} ${t("books.all")}</button><button class="secondary" data-action="edit-book" data-book="${esc(book.id)}">${t("edit")}</button></div><button class="book-detail-showcase" data-action="reader-open" data-book="${esc(book.id)}" data-at="cover" aria-label="${t("reader.start")} · ${esc(book.title)}">${coverHTML(book, ctx())}</button><div class="book-detail-copy"><h2>${esc(book.title)}</h2><p>${esc(book.description || "")}</p>${book.tags?.length ? `<div class="book-tags">${book.tags.map((tag) => `<button data-action="shelf-tag" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join("")}</div>` : ""}<span class="badge">${t("private")} · ${daysPagesLabel(bookCounts(state(), book.id).days, bookCounts(state(), book.id).pages)}</span></div>${labsOn() ? collabSectionHTML(social(), book, ctx(), collabOpen) : ""}${readerEntryHTML(book)}<div class="book-actions"><button class="secondary" data-action="book-new-entry">${icon("plus")} ${t("books.addPage")}</button><button class="secondary book-share" data-action="book-share" data-book="${esc(book.id)}">${t("bookShare.button")}</button></div><p class="save-help book-share-help">${t("bookShare.help")}</p>${bookMusicHTML(book)}<div class="book-filter"><p class="journal-list-caption">${t("books.memories")}</p><div class="book-filter-row"><select data-book-filter="month" aria-label="${t("books.month")}"><option value="">${t("books.allMonths")}</option>${months.map((m) => `<option value="${m}" ${bookFilter.month === m ? "selected" : ""}>${esc(new Date(`${m}-01T12:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long" }))}</option>`).join("")}</select><input type="date" data-book-filter="date" aria-label="${t("books.pickDate")}" value="${esc(bookFilter.date)}">${filtered ? `<button class="text-button" data-action="book-filter-clear">${t("books.clearFilter")}</button>` : ""}</div></div>${
      days.length
        ? `<div class="day-covers">${filtered ? "" : coverEntryHTML(book)}${days.map(dayCoverHTML).join("")}</div>`
        : `<div class="empty">${t(filtered ? "books.noMatch" : "books.empty")}</div>`
    }`;
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
  return `<header class="page-top"><div><h1 class="page-title">${t("books.title")}</h1><p class="page-subtitle">${t("books.subtitle")}</p></div><span class="page-top-actions">${labsOn() ? `<button class="me-chip" data-action="books-view" data-view="profile" aria-label="${t("me.tab")}">${t("me.tab")} ›</button>` : ""}<button class="icon-button" data-action="new-book" aria-label="${t("books.new")}">${icon("plus")}</button></span></header>${labsOn() ? switcher : ""}${tagRow}${ours ? "" : keeperShelfHTML(all)}${ours && !list.length ? `<div class="empty our-empty">${t("books.oursEmpty")}</div>` : shelfHTML(list, !ours)}${ours || !labsOn() ? "" : habitBookHTML()}${""/* V10.41 (D1): suggestion cards no longer sit on the shelf */}<p class="home-quote">A home for every little story.</p>`;
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
    const count = bookCounts(state(), book.id).pages, countDays = bookCounts(state(), book.id).days;
    // Magazine covers stand on the shelf as magazine spines: the cover photo
    // under a dark veil, the title in bold white, the issue number below.
    if (MAGAZINE_COVERS.includes(book.coverTemplate)) {
      const photo = safePhoto(coverPhotoRef(book, catalog));
      return `<button class="spine mag-spine h${index % 4} ${pulled?.id === book.id ? "pulled" : ""}" data-action="pull-book" data-book="${esc(book.id)}" aria-pressed="${pulled?.id === book.id}" aria-label="${esc(book.title)} · ${pagesLabel(count)}" style="--spine:${coverColor(book, tokens)}">${photo ? `<img class="spine-photo" src="${esc(photo)}" alt="" loading="lazy">` : ""}<span class="spine-brand">LD</span><span class="spine-title ${/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(book.title || "") ? "" : "latin"}" style="--n:${Math.max(5, [...String(book.title || "")].length)}">${esc(book.title)}</span><small>NO.${String(count).padStart(2, "0")}</small></button>`;
    }
    const sticker = book.coverDecoration && book.coverDecoration !== "none" ? stickerURL(book.coverDecoration, catalog) : "";
    return `<button class="spine h${index % 4} ${pulled?.id === book.id ? "pulled" : ""}" data-action="pull-book" data-book="${esc(book.id)}" aria-pressed="${pulled?.id === book.id}" aria-label="${esc(book.title)} · ${pagesLabel(count)}" style="--spine:${coverColor(book, tokens)};font-family:${esc(fontFamily(book.coverFont || "elegant", catalog))}">${sticker ? `<img src="${esc(sticker)}" alt="">` : "<i></i>"}<span class="spine-title">${esc(book.title)}</span><small>${count}</small></button>`;
  };
  const items = [...books.map(spine), ...(canAdd ? [`<button class="spine add" data-action="new-book" aria-label="${t("books.create")}"><span>＋</span></button>`] : [])];
  const rows = [];
  for (let i = 0; i < items.length; i += 5) rows.push(items.slice(i, i + 5));
  const stage = pulled
    ? (() => {
        const count = bookCounts(state(), pulled.id).pages, countDays = bookCounts(state(), pulled.id).days;
        const shown = Community.isShowcased(social(), pulled.id);
        return `<section class="pulled-book" aria-live="polite">${coverHTML(pulled, ctx())}<div class="pulled-copy"><small>${esc(presetLabel("category", pulled.category || ""))}</small><h2>${esc(pulled.title)}</h2>${pulled.description ? `<p>${esc(pulled.description)}</p>` : ""}<span class="badge">${shown ? `🖼 ${t("who.coverShown")}` : `🔒 ${t("private")}`} · ${daysPagesLabel(countDays, count)}</span><div class="pulled-actions"><button class="primary" data-action="book" data-book="${esc(pulled.id)}">${t("shelf.open")} ›</button><button class="secondary" data-action="shelf-write" data-book="${esc(pulled.id)}">✎ ${t("shelf.write")}</button></div><div class="shelf-move" role="group" aria-label="${t("shelf.moveLabel")}"><button class="text-button" data-action="book-step" data-book="${esc(pulled.id)}" data-dir="-1" ${state().books[0]?.id === pulled.id ? "disabled" : ""}>‹ ${t("shelf.moveEarlier")}</button><button class="text-button" data-action="put-back">${t("shelf.putBack")}</button><button class="text-button" data-action="book-step" data-book="${esc(pulled.id)}" data-dir="1" ${state().books.at(-1)?.id === pulled.id ? "disabled" : ""}>${t("shelf.moveLater")} ›</button></div></div></section>`;
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
// V10.1: the selected item's actions are the bottom row (ctxDockHTML); the
// black bar that floated over the paper is gone.
function layerBarHTML() {
  return "";
}
// ---------- The selected item's frame (V10.12) ----------
// One thin frame over the selected item with two handles that sit OUTSIDE it:
// ↻ above (turn) and ● at a corner (size). The frame is drawn above the paper
// (not inside the item), so the handles keep their size at any zoom, are never
// clipped by the paper or a rounded frame, never cover the words, and their
// touch areas (40 px) never overlap each other. The item itself is the move
// area. While typing in a text box the frame steps aside.
const SEL_ROTATE_GAP = 30; // px from the edge to the ↻ handle
const SEL_CORNER_GAP = 10; // px outside the corner for the ● handle
const SEL_TARGET = 40; // px touch area of a handle
function selFrameHTML() {
  const layer = selectedLayerOf();
  if (!layer || (cropMode && layer.kind === "photo")) return "";
  return `<div class="sel-frame" id="sel-frame" data-sel="${esc(layer.id)}" aria-hidden="true"><i class="sel-stem"></i><i class="layer-handle handle-rotate" data-handle="rotate"></i><i class="layer-handle handle-resize" data-handle="resize"></i></div>`;
}
// Where the selected item is, in px inside #canvas-wrap: centre, size (with
// its zoom) and angle.
const pct = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : 50);
function selGeometry(layer = selectedLayerOf()) {
  const el = layer && layerElement(layer.id);
  const canvas = $("#journal-canvas");
  if (!el || !canvas) return null;
  const scale = Number(layer.scale) || 1;
  return {
    cx: canvas.offsetLeft + canvas.clientLeft + (canvas.clientWidth * pct(layer.x)) / 100,
    cy: canvas.offsetTop + canvas.clientTop + (canvas.clientHeight * pct(layer.y)) / 100,
    w: el.offsetWidth * scale,
    h: el.offsetHeight * scale,
    rotation: Number(layer.rotation) || 0,
    canvas: { left: canvas.offsetLeft, top: canvas.offsetTop, width: canvas.offsetWidth, height: canvas.offsetHeight },
  };
}
// Where the handles go: ↻ above (below if that leaves the paper), ● at the
// first corner that stays on the paper and is well clear of ↻.
function selHandleSpots(g) {
  const rad = (g.rotation * Math.PI) / 180,
    cos = Math.cos(rad),
    sin = Math.sin(rad);
  const toWrap = ([x, y]) => {
    const lx = x - g.w / 2,
      ly = y - g.h / 2;
    return [g.cx + lx * cos - ly * sin, g.cy + lx * sin + ly * cos];
  };
  const room = 16;
  const inside = (spot) => {
    const [x, y] = toWrap(spot);
    return x >= g.canvas.left - room && x <= g.canvas.left + g.canvas.width + room && y >= g.canvas.top - room && y <= g.canvas.top + g.canvas.height + room;
  };
  const rotates = [
    [g.w / 2, -SEL_ROTATE_GAP],
    [g.w / 2, g.h + SEL_ROTATE_GAP],
  ];
  const rotate = rotates.find(inside) || rotates[0];
  const corners = [
    [g.w + SEL_CORNER_GAP, g.h + SEL_CORNER_GAP],
    [-SEL_CORNER_GAP, g.h + SEL_CORNER_GAP],
    [g.w + SEL_CORNER_GAP, -SEL_CORNER_GAP],
    [-SEL_CORNER_GAP, -SEL_CORNER_GAP],
  ];
  const clear = (c) => Math.hypot(c[0] - rotate[0], c[1] - rotate[1]) >= SEL_TARGET + 4;
  const resize = corners.find((c) => inside(c) && clear(c)) || corners.find(clear) || corners[0];
  return { rotate, resize, flipped: rotate[1] > 0 };
}
function placeLayerBar() {
  const frame = $("#sel-frame");
  if (!frame) return;
  const g = selGeometry();
  if (!g) {
    frame.hidden = true;
    return;
  }
  frame.hidden = false;
  Object.assign(frame.style, {
    left: `${g.cx}px`,
    top: `${g.cy}px`,
    width: `${g.w}px`,
    height: `${g.h}px`,
    transform: `translate(-50%, -50%) rotate(${g.rotation}deg)`,
  });
  const spots = selHandleSpots(g);
  const put = (el, [x, y]) => {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  };
  put(frame.querySelector(".handle-rotate"), spots.rotate);
  put(frame.querySelector(".handle-resize"), spots.resize);
  const stem = frame.querySelector(".sel-stem");
  stem.style.left = `${g.w / 2}px`;
  stem.style.top = spots.flipped ? `${g.h}px` : `${-SEL_ROTATE_GAP + 7}px`;
  stem.style.height = `${SEL_ROTATE_GAP - 7}px`;
  frame.classList.toggle("flipped", spots.flipped);
}
function canvasHTML() {
  return layerBarHTML() + sharedCanvasHTML(activePage(), ctx(), {
    selectedId: selectedLayer,
    cropMode,
    dayPage: isDayPage(),
    addChoices: `<button class="canvas-first-photo" data-action="first-photo"><i aria-hidden="true">＋</i><b>${t("canvas.firstPhoto")}</b></button><p class="canvas-first-hint">${t("canvas.firstHint")}</p>`,
  }) + selFrameHTML();
}
function photoRegion() {
  return isDayPage() ? { top: 4, bottom: 60 } : { top: 4, bottom: 96 };
}

let layerPreciseOpen = false;
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
      ? `<label class="field">${t("layer.content")}<textarea data-layer-text="text" maxlength="${WORDS_MAX}">${esc(layer.text)}</textarea></label><label class="field">${t("studio.font")}<select data-layer-text="fontId">${fontOptions(layer.fontId || activePage().font)}</select></label><label>${t("studio.size")}<input data-layer-text="fontSize" type="range" min="10" max="50" value="${layer.fontSize || 16}"></label><label>${t("studio.weight")}<input data-layer-text="weight" type="range" min="100" max="900" step="100" value="${layer.weight || 400}"></label><label>${t("studio.spacing")}<input data-layer-text="spacing" type="range" min="0" max="5" step=".5" value="${layer.spacing || 0}"></label><label>${t("studio.textColor")}<input data-layer-text="color" type="color" value="${layer.color || "#2F2A26"}"></label><label>${t("layer.align")}<select data-layer-text="align">${["left", "center", "right"].map((a) => `<option value="${a}" ${(layer.align || "left") === a ? "selected" : ""}>${t("layer." + a)}</option>`).join("")}</select></label>`
      : "";
  // V10.20: a photo's shape (and frame) has its own sheet; what shows inside
  // it is the crop editor. This sheet keeps place, size, turn and order.
  void shapes;
  void photoTools;
  // V10.25: what 图层 is for comes first (order, copy); exact numbers and a
  // text's words / font (also under 编辑 and 字体) fold away in 精确调整.
  return `<div class="layer-controls"><div class="layer-buttons"><button data-action="layer-forward">${t("layer.forward")}</button><button data-action="layer-backward">${t("layer.backward")}</button><button data-action="layer-front">${t("layer.frontShort")}</button><button data-action="layer-back">${t("layer.back")}</button><button data-action="layer-copy">${t("copy")}</button></div><details class="layer-precise" ${layerPreciseOpen ? "open" : ""}><summary>${t("layer.precise")}</summary>${textTools}<p class="gesture-help">${t(matchMedia("(pointer: coarse)").matches ? "layer.gestureHelpTouch" : "layer.gestureHelp")}</p>${base.map(slider).join("")}</details></div>`;
}

// V10.20 · 形状: the frame's shape first (no scrolling), then its paper edge.
function shapeSheetHTML(layer) {
  const shapes = [...(layer.kind === "photo" ? ["free"] : []), ...SHAPES.filter((s) => layer.kind === "video" || s !== "film")];
  const now = layer.shape || (layer.kind === "video" ? "landscape" : "free");
  const chips = shapes.map((shape) => `<button data-action="layer-shape" data-shape="${shape}" class="${now === shape ? "selected" : ""}" aria-pressed="${now === shape}"><i class="shape-icon shape-icon-${shape}" aria-hidden="true"></i>${t("shape." + shape)}</button>`).join("");
  const frames =
    layer.kind === "photo"
      ? `<div class="shape-frames" role="group" aria-label="${t("photo.frame")}"><span class="small-label">${t("photo.frame")}</span><div class="shape-frame-row"><label class="field">${t("photo.frame")}<select data-layer-text="frame">${PHOTO_FRAMES.map((frame) => `<option value="${frame}" ${(layer.frame || "border") === frame ? "selected" : ""}>${t("frame." + frame)}</option>`).join("")}</select></label><label class="check-label"><input type="checkbox" data-layer-flag="tape" ${layer.tape ? "checked" : ""}> ${t("photo.tape")}</label></div></div>`
      : "";
  return `<div class="shape-sheet"><div class="shape-picker" role="group" aria-label="${t("shape.title")}"><div class="shape-chips">${chips}</div></div><p class="save-help">${t("shape.hint")}</p>${frames}</div>`;
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
  const cover = `<button class="chapter-chip cover-chip ${activeMomentId ? "" : "active"} ${hasCover ? "" : "empty"}" data-action="select-moment" data-moment="" aria-pressed="${!activeMomentId}"><i class="chip-num" aria-hidden="true">${t("strip.coverShort")}</i>${pageThumbHTML(editor, true)}<span class="chip-text"><small>${t("day.cover")}</small><b>${esc(editor.title || t("cover.empty"))}</b></span></button>`;
  // V10.23: while a file is being saved the strip is shown paused (not only a toast after a tap).
  // (only while a video / sound is imported: that flow redraws when it starts and ends)
  const locked = busyMedia && mediaImport && !["done", "failed"].includes(mediaImport.stage);
  return `<nav class="chapter-chips page-strip${locked ? " locked" : ""}" aria-label="${t("moment.title")}"${locked ? ` aria-disabled="true" title="${esc(t("import.busy"))}"` : ""}>${cover}<span class="strip-divider" aria-hidden="true"></span>${moments
    .map(
      (moment, index) =>
        `<span class="chapter-chip-wrap"><button class="chapter-chip ${moment.id === activeMomentId ? "active" : ""}" data-action="select-moment" data-moment="${esc(moment.id)}" aria-pressed="${moment.id === activeMomentId}"><i class="chip-num" aria-hidden="true">${index + 1}</i>${pageThumbHTML(moment)}<span class="chip-text"><small>${t("moment.chapter", { number: String(index + 1).padStart(2, "0") })}${moment.time ? " · " + esc(moment.time) : ""}</small><b data-chapter-label="${esc(moment.id)}">${esc(PL.pageLabel(moment, { t, index }).label)}</b></span>${badges(moment)}</button>${moment.id === activeMomentId ? `<button class="chip-delete" data-action="moment-delete" aria-label="${t("write.deleteStory")}">×</button>` : ""}</span>`,
    )
    .join("")}<button class="chapter-chip add" data-action="add-moment" aria-label="${t("moment.addShort")}"><i class="chip-num" aria-hidden="true">＋</i><span class="chip-text">＋ ${t("moment.addShort")}</span></button></nav>`;
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
        `<li class="pages-row${m.id === activeMomentId ? " current" : ""}">${pageThumbHTML(m)}<button class="pages-open" data-action="pages-open" data-moment="${esc(m.id)}"><small>${t("moment.chapter", { number: String(i + 1).padStart(2, "0") })}${m.time ? " · " + esc(m.time) : ""}${book(m.bookId) ? " · " + esc(book(m.bookId)) : ""}</small><b>${esc(PL.pageLabel(m, { t, index: i }).label)}</b></button><span class="pages-move"><button data-action="page-move" data-moment="${esc(m.id)}" data-dir="-1" aria-label="${t("pages.up")}" ${i ? "" : "disabled"}>↑</button><button data-action="page-move" data-moment="${esc(m.id)}" data-dir="1" aria-label="${t("pages.down")}" ${i < moments.length - 1 ? "" : "disabled"}>↓</button></span><button class="pages-copy" data-action="page-copy" data-moment="${esc(m.id)}" aria-label="${t("pages.copyLabel")}">${t("copy")}</button><button class="pages-del" data-action="page-remove" data-moment="${esc(m.id)}" aria-label="${t("write.deleteStory")}">🗑 ${t("delete")}</button></li>`,
    )
    .join("")}</ul><div class="pages-actions"><button class="secondary" data-action="pages-add">＋ ${t("moment.addShort")}</button><button class="secondary" data-action="pages-details">${t("more.details")}</button></div><button class="text-button pages-more" data-action="pages-more">${t("pages.more")} ›</button><button class="primary full-width" data-action="choose-close">${t("pages.done")}</button></div>`;
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
        `<div class="chapter-item ${moment.id === activeMomentId ? "active" : ""} ${moment.collapsed ? "collapsed" : ""}" data-chapter="${esc(moment.id)}"><button class="chapter-select" data-action="select-moment" data-moment="${esc(moment.id)}" aria-pressed="${moment.id === activeMomentId}"><span class="chapter-index">${String(index + 1).padStart(2, "0")}</span><span class="chapter-copy"><b>${esc(PL.pageLine(moment, { t, index }))}</b><small>${esc(counts(moment) || moment.body?.slice(0, 30) || t("moment.empty"))}</small></span></button><span class="chapter-tools"><button data-action="moment-up" data-moment="${esc(moment.id)}" aria-label="${t("moment.up")}" ${index ? "" : "disabled"}>↑</button><button data-action="moment-down" data-moment="${esc(moment.id)}" aria-label="${t("moment.down")}" ${index < moments.length - 1 ? "" : "disabled"}>↓</button><button data-action="moment-collapse" data-moment="${esc(moment.id)}" aria-expanded="${!moment.collapsed}" aria-label="${t(moment.collapsed ? "moment.expand" : "moment.collapse")}">${moment.collapsed ? "▸" : "▾"}</button></span>${moment.collapsed ? "" : `<div class="chapter-preview">${thumbs(moment)}${moment.body ? `<p>${esc(moment.body.slice(0, 80))}</p>` : ""}</div>`}</div>`,
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
  return `<div class="page-mode three" role="group" aria-label="${t("mode.label")}">${b("line", icon("photo"))}${b("note", icon("pen"))}${b("layout", '<i class="mode-grid" aria-hidden="true"></i>')}</div>`;
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
    if (line) page.layers.push({ id: id(), kind: "text", text: line.slice(0, 500), x: 50, y: 90, w: 84, scale: 1, rotation: 0, fontId: page.font || "serif", fontSize: Number(page.textStyle?.size) >= 10 ? Math.min(60, Number(page.textStyle.size)) : 18, color: /^#[0-9a-f]{6}$/i.test(page.textStyle?.color || "") ? page.textStyle.color : "#2F2A26", weight: 500, spacing: 0, align: ["left", "center", "right"].includes(page.textStyle?.align) ? page.textStyle.align : "center" });
    page.layoutEdited = true;
    return;
  }
  const title = (page.title || "").trim();
  const words = (page.body || "").trim();
  // The look chosen while typing comes along: font, size, colour, alignment.
  const pick = (style, size, color) => ({
    fontSize: Number(style?.size) >= 10 ? Math.min(60, Number(style.size)) : size,
    color: /^#[0-9a-f]{6}$/i.test(style?.color || "") ? style.color : color,
    align: ["left", "center", "right"].includes(style?.align) ? style.align : "left",
  });
  // Bold / italic / underline on parts of the words come along too.
  const marksFor = (raw, text, marks) => {
    const lead = String(raw || "").length - String(raw || "").trimStart().length;
    const kept = Rich.sliceMarks(marks, lead, lead + Math.min(500, text.length));
    return kept.length ? { marks: kept } : {};
  };
  const box = (text, y, fontId, look, marks) => ({ id: id(), kind: "text", text: text.slice(0, 500), x: 50, y, w: 80, scale: 1, rotation: 0, fontId: fontId || "serif", ...look, weight: 400, spacing: 0, ...marks });
  // Where the note had them, so nothing jumps.
  if (title) page.layers.push(box(title, 27, page.font, pick(page.textStyle, 24, "#2F2A26"), marksFor(page.title, title, page.titleMarks)));
  if (words) page.layers.push(box(words, title ? 52 : 40, page.bodyFont || page.font, pick(page.bodyStyle, 15, "#5D554B"), marksFor(page.body, words, page.bodyMarks)));
  page.body = "";
  delete page.bodyMarks;
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
// Text colours (V10.12: + the text box's own sage and a paper white for words
// on a photo). Each has a name for VoiceOver.
const TYPE_COLORS = ["#2B2622", "#6F675D", "#6A7059", "#7D8E66", "#B5838D", "#6D8299", "#C08B5C", "#FFFDF8"];
let typeTarget = null; // { kind: "title" | "body" | "layer", id? }
const rgbHex = (value) => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value || "");
  return m ? "#" + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("") : "";
};
function typeBarHTML() {
  return `<div class="type-bar type-controls" id="type-bar" hidden role="toolbar" aria-label="${t("type.label")}">${typeControlsHTML()}</div>`;
}
function typeTargetOf(el) {
  if (!el?.closest?.("#journal-canvas")) return null;
  if (el.dataset.inlineLayer) return { kind: "layer", id: el.dataset.inlineLayer };
  if (el.dataset.inline === "title" || el.dataset.inline === "body") return { kind: el.dataset.inline };
  return null;
}
// What the controls act on: the field being typed in, or (in the text
// sheet) the selected text box.
function typeTargetFor(controls) {
  if (controls?.classList.contains("type-sheet")) return selectedLayerOf()?.kind === "text" ? { kind: "layer", id: selectedLayer } : null;
  return typeTarget;
}
function syncTypeBar() {
  document.querySelectorAll(".type-controls").forEach((bar) => {
    const target = typeTargetFor(bar);
    if (!target) return;
    const p = activePage();
    const layer = target.kind === "layer" ? p.layers.find((l) => l.id === target.id) : null;
    const font = layer ? layer.fontId || p.font : target.kind === "body" ? p.bodyFont || p.font : p.font;
    bar.querySelectorAll("[data-type-font]").forEach((b) => b.classList.toggle("selected", b.dataset.typeFont === (font || "serif")));
    const style = layer ? { color: layer.color, align: layer.align } : target.kind === "title" ? p.textStyle : p.bodyStyle;
    // The colour now: the saved one, or what the words show (a box keeps the
    // default until a colour is chosen).
    const el0 = layer ? layerElement(layer.id) : $(`#journal-canvas [data-inline="${target.kind}"]`);
    const now = (style?.color || (el0 ? rgbHex(getComputedStyle(el0).color) : "")).toLowerCase();
    bar.querySelectorAll("[data-type-color]").forEach((b) => {
      const on = now === b.dataset.typeColor.toLowerCase();
      b.classList.toggle("selected", on);
      b.setAttribute("aria-pressed", String(on));
    });
    bar.querySelector(".type-color-now")?.style.setProperty("--swatch", now || "#2b2622");
    const el = layer ? layerElement(layer.id) : $(`#journal-canvas [data-inline="${target.kind}"]`);
    const shown = ["left", "center", "right"].includes(style?.align) ? style.align : el ? getComputedStyle(el).textAlign.replace("start", "left").replace("end", "right") : "left";
    bar.querySelectorAll("[data-type-align]").forEach((b) => {
      if (b.dataset.typeAlign === "cycle") {
        b.dataset.now = shown;
        b.firstElementChild.className = `align-glyph ${shown}`;
        b.setAttribute("aria-label", `${t("ctx.align")} · ${t("type.align." + shown)}`);
      } else b.setAttribute("aria-pressed", String(b.dataset.typeAlign === shown));
    });
    // B / I / U / S show the look of the selection (or of what will be typed next).
    const markButtons = bar.querySelectorAll("[data-type-mark]");
    if (markButtons.length) {
      const field = richField(target);
      let look = {};
      if (field && el) {
        const text = String(field.owner[field.textKey] ?? ""),
          marks = field.owner[field.marksKey] || [];
        const live = el.isContentEditable && document.activeElement === el && richSel?.el === el ? richSel : null;
        if (typingLook?.el === el) look = typingLook.look;
        else if (live) look = Rich.lookAt(marks, Math.min(live.start, text.length), Math.min(live.end, text.length), text.length);
        else if (text.length) look = Rich.lookAt(marks, 0, text.length, text.length);
      }
      markButtons.forEach((b) => {
        b.setAttribute("aria-pressed", String(Boolean(look[b.dataset.typeMark])));
        b.disabled = !field;
      });
    }
    // A note's title / words stay where the page puts them; this makes them a free text box.
    const toBox = bar.querySelector(".type-to-box");
    if (toBox) toBox.hidden = target.kind === "layer" || isDayPage() || !["note", "line"].includes(pageModeOf());
  });
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
      $("#type-bar").classList.remove("show-colors");
      typeTarget = null;
    }
  }, 0);
});
document.addEventListener("pointerdown", (event) => {
  // The bar — and B / I / U / S in the text sheet — must not take the caret or the selection.
  if (event.target.closest?.("#type-bar, .type-sheet [data-type-mark]")) event.preventDefault();
});
document.addEventListener("mousedown", (event) => {
  if (event.target.closest?.(".type-controls [data-type-mark]")) event.preventDefault();
});
document.addEventListener("click", (event) => {
  const button = event.target.closest?.(".type-controls button");
  if (!button || button.dataset.action) return;
  if (button.hasAttribute("data-type-colors-open")) {
    const bar = button.closest(".type-controls");
    const open = bar.classList.toggle("show-colors");
    bar.querySelector(".type-color-now")?.setAttribute("aria-expanded", String(open));
    return;
  }
  const sheetTarget = typeTargetFor(button.closest(".type-controls"));
  if (!sheetTarget) return;
  const typeTarget = sheetTarget; // the field being typed in, or the selected text box
  const focused = document.activeElement;
  const p = activePage();
  const canvas = $("#journal-canvas");
  const width = canvas?.getBoundingClientRect().width || 1;
  const currentSize = (el) => (parseFloat(getComputedStyle(el).fontSize) / width) * 100 * 3.2;
  const layerEl = typeTarget.kind === "layer" ? canvas?.querySelector(`[data-layer="${CSS.escape(typeTarget.id)}"]`) : null;
  const textEl = typeTarget.kind === "layer" ? layerEl : canvas?.querySelector(`[data-inline="${typeTarget.kind}"]`);
  if (!textEl) return;
  if (button.dataset.typeMark) {
    applyTypeMark(typeTarget, button.dataset.typeMark);
    syncTypeBar();
    return; // it puts the selection back itself
  }
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
  if (button.dataset.typeAlign) {
    const order = ["left", "center", "right"];
    const align = button.dataset.typeAlign === "cycle" ? order[(order.indexOf(button.dataset.now || "left") + 1) % 3] : button.dataset.typeAlign;
    inlineChange(() => {
      const page = activePage();
      if (typeTarget.kind === "layer") {
        const layer = page.layers.find((l) => l.id === typeTarget.id);
        if (layer) layer.align = align;
      } else if (typeTarget.kind === "title") page.textStyle = { ...(page.textStyle || {}), align };
      else page.bodyStyle = { ...(page.bodyStyle || {}), align };
    });
    textEl.style.textAlign = align;
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
// ---------- Rich text on the paper (V10.6) ----------
// The words are edited where they are (plain-text editing, as before); a
// formatted piece is a <span data-m> inside them, so what is typed next to
// bold words stays bold. The model keeps the plain text plus ranges
// (js/rich-text.mjs); nothing else in a pasted or dropped text is kept.
let richSel = null; // the last selection inside words on the paper: { el, start, end }
let typingLook = null; // B / I / U / S chosen with only a caret: { el, look, offset }
let richBlur = null; // a text box that just lost the caret: { el, at }
let composeBase = null; // the words when the input method started choosing: { el, text }
const RICH_FIELD = "#journal-canvas [data-inline], #journal-canvas [data-inline-layer]";
// Where a target's words and their marks live.
function richField(target, page = activePage()) {
  if (!target) return null;
  if (target.kind === "layer") {
    const layer = page.layers.find((l) => l.id === target.id);
    if (!layer || layer.kind !== "text") return null;
    if (layer.bind) {
      // Shown with a time in front or cut short: the ranges would not fit.
      if (layer.bind !== "title" || layer.prefix || layer.excerpt) return null;
      const source = layer.of ? findMoment(editor, layer.of) : page;
      return source ? { owner: source, textKey: "title", marksKey: "titleMarks" } : null;
    }
    return { owner: layer, textKey: "text", marksKey: "marks" };
  }
  if (target.kind !== "title" && target.kind !== "body") return null;
  return { owner: page, textKey: target.kind, marksKey: target.kind === "title" ? "titleMarks" : "bodyMarks" };
}
function richElement(target) {
  if (!target) return null;
  return target.kind === "layer" ? document.querySelector(`#journal-canvas [data-inline-layer="${CSS.escape(target.id || "")}"]`) : $(`#journal-canvas [data-inline="${target.kind}"]`);
}
function selectionIn(el) {
  const selection = getSelection();
  if (!selection.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null;
  const before = document.createRange();
  before.selectNodeContents(el);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  before.setEnd(range.endContainer, range.endOffset);
  return { start, end: before.toString().length };
}
function selectOffsets(el, start, end) {
  // (Same rule as placeCaret: at a border between two pieces, the piece before.)
  const point = (offset) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let left = offset;
    let node = walker.nextNode();
    while (node && left > node.length) {
      left -= node.length;
      node = walker.nextNode();
    }
    return node ? [node, Math.min(left, node.length)] : null;
  };
  const from = point(start),
    to = point(end);
  const range = document.createRange();
  if (!from || !to) {
    range.selectNodeContents(el);
    range.collapse(false);
  } else {
    range.setStart(from[0], from[1]);
    range.setEnd(to[0], to[1]);
  }
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
// Draws the words with their marks into an element on the paper. While
// typing, a last empty line needs one more line break to show its caret.
function drawRich(el, text, marks) {
  el.innerHTML = Rich.richHTML(text, marks, esc) + (el.isContentEditable && text.endsWith("\n") ? "\n" : "");
}
function applyTypeMark(target, key) {
  const field = richField(target);
  const el = richElement(target);
  if (!field || !el) return toast(t("type.markNotHere"));
  const text = String(field.owner[field.textKey] ?? "");
  const marks = field.owner[field.marksKey] || [];
  // A tap on the sheet can take the caret out of a text box a moment before this runs.
  const justLeft = richBlur?.el === el && performance.now() - richBlur.at < 800;
  const editing = el.isContentEditable || justLeft;
  let sel = editing ? (el.isContentEditable && selectionIn(el)) || (richSel?.el === el ? { start: richSel.start, end: richSel.end } : null) : null;
  if (sel) sel = { start: Math.min(sel.start, sel.end, text.length), end: Math.min(Math.max(sel.start, sel.end), text.length) };
  const backToWords = (from, to) => {
    if (!el.isContentEditable && target.kind === "layer") editTextLayer(target.id);
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    selectOffsets(el, from, to);
    richSel = { el, start: from, end: to };
  };
  if (sel && sel.start === sel.end) {
    // Only a caret: the look is for the words typed next. Nothing changes yet.
    const now = typingLook?.el === el ? typingLook.look : Rich.lookAt(marks, sel.start, sel.end, text.length);
    backToWords(sel.start, sel.end);
    typingLook = { el, look: { ...now, [key]: !now[key] }, offset: sel.start };
    return;
  }
  const [from, to] = sel ? [sel.start, sel.end] : [0, text.length];
  if (to <= from) return;
  const next = Rich.toggleMark(marks, from, to, key, text.length);
  inlineTyping = false; // each tap is its own undo step
  inlineChange(() => {
    const now = richField(target);
    if (now) Rich.storeMarks(now.owner, now.marksKey, next, text.length);
  });
  inlineTyping = false;
  typingLook = null;
  drawRich(el, text, next);
  if (sel) backToWords(from, to);
}
// The marks after words were typed on the paper: read from the spans on
// screen; with B / I / U / S switched on or off at the caret, the new words
// get exactly that look. Returns { marks, caret } (caret set when the words
// have to be drawn again).
function typedMarks(target, field, value, composing) {
  const before = String(field.owner[field.textKey] ?? "");
  const old = field.owner[field.marksKey] || [];
  const look = typingLook?.el === target ? typingLook : null;
  if (!old.length && !look && !target.querySelector("[data-m]")) return { marks: [] };
  const read = Rich.readMarks(target);
  let marks = read.text.replace(/\n$/, "").slice(0, value.length) === value ? Rich.normalizeMarks(read.marks, value.length) : Rich.editMarks(old, before, value);
  let caret = null;
  if (look && !composing) {
    const change = Rich.textChange(before, value);
    if (change.added > 0) {
      const wanted = Rich.applyLook(marks, change.at, change.at + change.added, look.look, value.length);
      if (JSON.stringify(wanted) !== JSON.stringify(marks)) {
        marks = wanted;
        caret = change.at + change.added;
      }
    }
  }
  return { marks, caret };
}
function inlineInput(target, event) {
  const text = target.innerText.replace(/\n$/, "");
  if (text.length > WORDS_MAX) toast(t("sw.full", { max: WORDS_MAX }));
  const composing = Boolean(event?.isComposing) || composeBase?.el === target;
  const redraw = (value, result) => {
    if (result.caret != null) {
      drawRich(target, value, result.marks);
      placeCaret(target, result.caret);
    }
    if (typingLook?.el === target) typingLook.offset = selectionIn(target)?.end ?? typingLook.offset;
  };
  if (target.dataset.inlineLayer) {
    const layerId = target.dataset.inlineLayer;
    let result = null,
      shown = text;
    inlineChange(() => {
      const page = activePage();
      const layer = page.layers.find((l) => l.id === layerId);
      if (!layer) return;
      const field = richField({ kind: "layer", id: layerId }, page);
      if (layer.bind === "caption") {
        // V10.19: a photo's own words live on that photo (found by its id).
        const photo = page.layers.find((l) => l.id === layer.captionOf);
        shown = text.slice(0, WORDS_MAX);
        if (photo) {
          if (shown.trim()) photo.caption = shown;
          else delete photo.caption;
        }
      } else if (layer.bind) {
        // Words bound to a Moment: edit the Moment itself (one source of truth).
        const source = layer.of ? findMoment(editor, layer.of) : page;
        shown = text.slice(0, layer.bind === "time" ? 12 : WORDS_MAX);
        if (field) result = typedMarks(target, field, shown, composing);
        if (source) source[layer.bind === "time" ? "time" : "title"] = shown;
      } else {
        shown = text.slice(0, 500);
        if (field) result = typedMarks(target, field, shown, composing);
        layer.text = shown;
      }
      if (field && result) Rich.storeMarks(field.owner, field.marksKey, result.marks, shown.length);
    });
    if (result) redraw(shown, result);
    const box = $('[data-layer-text="text"]');
    if (box && document.activeElement !== box) box.value = text;
    syncTypeBar();
    return;
  }
  const field = target.dataset.inline;
  const value = text.slice(0, Number(target.dataset.max) || 4000);
  let result = null;
  inlineChange(() => {
    const page = activePage();
    const rich = richField({ kind: field }, page);
    if (rich) result = typedMarks(target, rich, value, composing);
    page[field] = value;
    if (rich && result) Rich.storeMarks(rich.owner, rich.marksKey, result.marks, value.length);
    if (page !== editor) page.updatedAt = new Date().toISOString();
  });
  if (result) redraw(value, result);
  if (isDayPage()) {
    const mirror = $(field === "title" ? "#entry-title" : "#entry-body");
    if (mirror) mirror.value = value;
  } else {
    const moment = activePage();
    const label = document.querySelector(`[data-chapter-label="${CSS.escape(moment.id)}"]`);
    if (label) label.textContent = PL.pageLabel(moment, { t, index: (editor.moments || []).indexOf(moment) }).label;
    refreshStudioTitle();
  }
  syncTypeBar();
}
// The selection inside words on the paper is remembered (a tap on a button
// may take it away for a moment), and the B / I / U / S buttons follow it.
let richSync = 0;
document.addEventListener("selectionchange", () => {
  const selection = getSelection();
  const node = selection.rangeCount ? selection.anchorNode : null;
  const el = (node?.nodeType === 1 ? node : node?.parentElement)?.closest?.(RICH_FIELD);
  if (!el || !el.isContentEditable) return;
  const at = selectionIn(el);
  if (!at) return;
  richSel = { el, ...at };
  // The caret went somewhere else: the look chosen for "what I type next" ends.
  if (typingLook && (typingLook.el !== el || at.start !== at.end || at.end !== typingLook.offset)) typingLook = null;
  cancelAnimationFrame(richSync);
  richSync = requestAnimationFrame(syncTypeBar);
});
// Input methods (Chinese, Japanese…): the words are not redrawn while
// characters are being chosen; the look is applied once they are in.
document.addEventListener("compositionstart", (event) => {
  const el = event.target.closest?.(RICH_FIELD);
  if (!el) return;
  const field = richField(typeTargetOf(el));
  composeBase = { el, text: field ? String(field.owner[field.textKey] ?? "") : "" };
});
document.addEventListener("compositionend", (event) => {
  const el = event.target.closest?.(RICH_FIELD);
  const base = composeBase;
  composeBase = null;
  if (!el || base?.el !== el) return;
  setTimeout(() => {
    const target = typeTargetOf(el);
    const field = richField(target);
    if (!field || typingLook?.el !== el || !el.isConnected) return;
    const value = String(field.owner[field.textKey] ?? "");
    const marks = field.owner[field.marksKey] || [];
    const change = Rich.textChange(base.text, value);
    if (change.added <= 0) return;
    const wanted = Rich.applyLook(marks, change.at, change.at + change.added, typingLook.look, value.length);
    if (JSON.stringify(wanted) === JSON.stringify(marks)) return;
    inlineChange(() => {
      const now = richField(target);
      if (now) Rich.storeMarks(now.owner, now.marksKey, wanted, value.length);
    });
    drawRich(el, value, wanted);
    placeCaret(el, change.at + change.added);
    typingLook.offset = change.at + change.added;
  }, 0);
});
// Pasted or dropped text comes in as plain words only: no outside fonts,
// sizes, colours, links or pictures. It takes the look of where it lands.
for (const type of ["paste", "drop"])
  document.addEventListener(type, (event) => {
    const el = event.target.closest?.(RICH_FIELD);
    if (!el || !el.isContentEditable) return;
    event.preventDefault();
    const data = type === "paste" ? event.clipboardData : event.dataTransfer;
    const plain = String(data?.getData("text/plain") || "").replace(/\r\n?/g, "\n");
    if (!plain) return;
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    document.execCommand("insertText", false, plain);
  });
document.addEventListener("focusout", (event) => {
  const el = event.target;
  if (!el?.dataset || !(el.dataset.inline || el.dataset.inlineLayer)) return;
  inlineTyping = false;
  richBlur = { el, at: performance.now() };
  if (typingLook?.el === el) typingLook = null;
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
  return `<section class="write-card moment" aria-label="${t("write.title")}">${head}<label class="write-label">${t("write.pageName")}</label><input class="write-title" data-moment-field="title" maxlength="${WORDS_MAX}" placeholder="${t("moment.titlePlaceholder")}" value="${esc(page.title)}" aria-label="${t("moment.titleLabel")}"><label class="write-label">${t("write.caption")}</label><textarea class="write-body" data-moment-field="body" maxlength="4000" placeholder="${t("moment.bodyPlaceholder")}" aria-label="${t("moment.bodyLabel")}">${esc(page.body)}</textarea><p class="write-tip">${icon("text")} ${t("write.layoutTip")}</p>${tags}</section>`;
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
  const chosen = selectedLayerOf();
  if (chosen && (chosen.kind === "photo" || chosen.kind === "video") && !chosen.drawing)
    tools.push({ id: "shape", icon: "◐", label: "shape.title", value: t("shape." + (chosen.shape || (chosen.kind === "video" ? "landscape" : "free"))), body: () => shapeSheetHTML(chosen) });
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
        `${backdropHTML(page)}<div class="scene-head paper-head"><b>${t("paper.title")}</b></div><div class="paper-grid">${features.templates.map((template) => `<button data-action="${paperAction}" data-template="${template.id}" class="paper-option ${!/^(scene|photo):/.test(page.backdrop || "") && page.template === template.id ? "selected" : ""}" aria-pressed="${!/^(scene|photo):/.test(page.backdrop || "") && page.template === template.id}"><span class="paper-swatch journal-canvas ${template.id}" aria-hidden="true"></span>${t("template." + template.id)}</button>`).join("")}</div>`,
    },
    {
      id: "mood",
      icon: "☺",
      label: "tool.mood",
      value: page.mood ? `${page.mood} ${moodName(page.mood)}` : t("tool.none"),
      body: () => moodPickerHTML(page) || `<p class="save-help">${t("mood.coverNote")}</p>`,
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
          .join("")}</div><div class="editor-actions"><button data-action="collage-photo">${t("studio.collagePhoto")}</button></div>`,
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
    value: pagesLabel(editor.moments.length + (hasDayPageContent(editor) ? 1 : 0)),
    body: () => chaptersOutlineHTML(),
  });
  return tools;
}
// Decoration tools live in a small icon dock at the bottom of the screen;
// tapping one opens a bottom sheet so the page itself keeps the space.
// More: every other tool, in one sheet. A tile opens that tool in the same
// sheet (‹ comes back here).
const MORE_LABELS = { photos: "more.photos", media: "more.media" };
function moreSheetHTML(tools) {
  // V10.25 · three groups instead of a flat grid: 页面外观 · 媒体与创作 ·
  // 页面管理. Each tile is the one way into its tool (目录 and 页面管理 are
  // one 页面目录 now; photos are added with 照片 below, so 本页照片 is gone).
  const tile = (attrs, name, label, cls = "") => `<button class="more-tile ${cls}" ${attrs}><span class="more-icon">${svIcon(name)}</span><small>${label}</small></button>`;
  const toolTile = (toolId, label, cls = "dock-btn") => (tools.some((tool) => tool.id === toolId) ? tile(`data-action="tool" data-tool="${toolId}"`, toolId, label, cls) : "");
  const group = (title, tiles, extra = "") => (tiles ? `<section class="more-group"><h4>${title}</h4><div class="more-grid">${tiles}</div>${extra}</section>` : "");
  const sound = soundMenu ? `<div class="sound-menu" role="group" aria-label="${t("add.sound")}"><button data-action="music-sheet">♫ ${t("music.title")}</button><button data-action="add-record">🎙 ${t("add.record")}</button><button data-action="add-audio-file">⤒ ${t("add.audioFile")}</button></div>` : "";
  const mode = isDayPage() ? "" : `<div class="more-mode"><b>${t("more.mode")}</b>${pageModeHTML()}</div>`;
  const look = toolTile("paper", t("tool.paper")) + toolTile("layout", t("dock.layout")) + toolTile("font", t("more.pageFont"));
  const make =
    tile('data-action="draw-new"', "draw", t("draw.short"), "page-draw accent") +
    tile('data-action="add-video"', "video", t("add.video")) +
    tile(`data-action="add-sound" aria-expanded="${soundMenu}"`, "sound", t("more.audio")) +
    tile('data-action="music-sheet"', "sound", t("music.short")) +
    toolTile("media", t("more.media"));
  const pages =
    tile('data-action="tool" data-tool="details"', "details", t("more.details"), "dock-btn") +
    (isDayPage() ? "" : tile('data-action="mood-open"', "mood", t("dock.mood"), "dock-btn")) +
    tile('data-action="open-pages"', "pages", t("more.toc")) +
    tile('data-action="guide-open"', "guide", t("more.guide")) +
    (labsOn() ? toolTile("growth", t("dock.growth")) : "") +
    toolTile("book", t("dock.book"));
  // (换一种写法 is rarely changed: it goes last, so 媒体与创作 shows without scrolling)
  return `${group(t("more.groupLook"), look)}${group(t("more.groupMake"), make, sound + studioMusicHTML())}${group(t("more.groupPages"), pages)}${mode}`;
}
// Page details: date, journal, time, name, caption, tags, delete.
// V10.24 · Mood is optional memory metadata for one page (a Moment): it is
// chosen in 页面信息 (More → 心情 opens the same place), can be changed or
// cleared, and is never drawn on the paper. The stored values stay the five
// emoji (☀️ 🌷 ☁️ 🌧️ ✨); only their names are shown. The cover (the whole day)
// has no mood picker any more: older days keep what they have.
const MOOD_NAMES = { "☀️": "happy", "🌷": "warm", "☁️": "calm", "🌧️": "low", "✨": "excited" };
function moodName(mood) {
  const key = MOOD_NAMES[mood];
  return key ? t("mood." + key) : "";
}
function moodPickerHTML(page = activePage()) {
  if (isDayPage()) return "";
  const now = page.mood || "";
  const stamp = (m) => `<button class="mood-stamp mood-${MOOD_NAMES[m] || "other"}" data-action="moment-mood" data-mood="${esc(m)}" aria-pressed="${now === m}"><i aria-hidden="true">${esc(m)}</i><span>${esc(moodName(m) || m)}</span></button>`;
  return `<section class="mood-picker" id="mood-picker" aria-label="${t("tool.mood")}"><div class="mood-head"><b>${t("tool.mood")}</b><small>${t("mood.hint")}</small></div><div class="mood-stamps">${features.moods.map(stamp).join("")}<button class="mood-stamp mood-clear" data-action="moment-mood-clear" ${now ? "" : "disabled"}><i aria-hidden="true">—</i><span>${t("mood.clear")}</span></button></div></section>`;
}
function detailsSheetHTML() {
  return `${moodPickerHTML()}<label class="details-date">${t("field.date")}<input class="date-input" type="date" id="editor-date" aria-label="${t("field.date")}" value="${editor.date}"></label>${pageBarHTML()}${writeCardHTML()}<p class="save-help">${t("studio.help")}</p>`;
}
// With something selected, the bottom row is that item's tools: × (back to
// the four tools) and only what applies to a photo / text / sticker / clip.
// Copy and the stacking order are in 图层; font, colour and alignment in the
// text sheet.
let textTab = "font";
function ctxKind(layer) {
  if (layer.drawing) return "drawing";
  if (layer.kind === "photo") return "photo";
  if (layer.kind === "text") return "text";
  if (layer.kind === "video") return "video";
  if (layer.kind === "audio") return "audio";
  if (layer.kind === "growth") return "growth";
  return "sticker";
}
function ctxDockHTML(tool) {
  const layer = selectedLayerOf();
  const kind = ctxKind(layer);
  const on = (id, tab) => studioTool === id && (!tab || textTab === tab);
  const style = (tab, name, label) => tool(`data-action="text-style" data-tab="${tab}" aria-expanded="${on("textstyle", tab)}"`, name, t(label), on("textstyle", tab) ? "open" : "");
  const own =
    kind === "photo" && layer.mediaRef
      ? // V10.20: shape (the frame) · crop (what shows inside) · adjust · replace.
        tool(`data-action="tool" data-tool="shape" aria-expanded="${on("shape")}"`, "shape", t("shape.title"), `dock-btn ${on("shape") ? "open" : ""}`) + tool('data-action="crop-open"', "crop", t("crop.tool")) + tool('data-action="photo-edit"', "adjust", t("ctx.adjust")) + tool('data-action="replace-photo"', "replace", t("photo.replaceShort"))
      : kind === "text"
        ? tool('data-action="ctx-edit-text"', "pen", t("edit")) + style("font", "font", "ctx.font") + style("color", "color", "ctx.color") + style("align", "align", "ctx.align")
        : kind === "video"
          ? // V10.23: 播放 · 换封面 · 形状 (frame) — the cover and the frame are separate things.
            tool('data-action="ctx-play"', "play", t("media.play")) + tool(`data-action="video-cover" data-clip="${esc(layer.clipId)}"`, "photo", t("poster.change")) + tool(`data-action="tool" data-tool="shape" aria-expanded="${on("shape")}"`, "shape", t("shape.title"), `dock-btn ${on("shape") ? "open" : ""}`)
          : kind === "drawing"
            ? tool('data-action="draw-edit"', "draw", t("draw.again"))
            : kind === "sticker" && layer.assetId
              ? tool(`data-action="sticker-swap" aria-expanded="${studioTool === "stickers"}"`, "stickers", t("sticker.swap"), studioTool === "stickers" ? "open" : "")
              : "";
  // V10.25: ← 返回 leaves this item's tools (the item stays where it is); the
  // line above names what is selected. × only ever closes a sheet.
  return `<p class="ctx-caption" aria-hidden="true"><i></i>${t("ctx." + kind)}<span>· ${t("ctx.selected")}</span></p><nav class="tool-dock sv-tools ctx" data-ctx="${kind}" aria-label="${t("ctx.selectedLabel", { kind: t("ctx." + kind) })}"><button class="sv-tool ctx-back" data-action="layer-deselect" aria-label="${t("ctx.backLabel")}"><span class="ctx-arrow" aria-hidden="true">${svIcon("backArrow")}</span><small>${t("ctx.back")}</small></button><i class="ctx-rule" aria-hidden="true"></i>${own}${tool(`data-action="tool" data-tool="layer" aria-expanded="${on("layer")}"`, "layer", t("ctx.layer"), `dock-btn ${on("layer") ? "open" : ""}`)}${tool('data-action="layer-delete"', "trash", t(kind === "video" || kind === "audio" ? "media.removeShort" : "delete"), "danger")}</nav>`;
}
// Font · size · colour · alignment for the selected text box (the same
// controls as the bar that shows while typing).
function typeControlsHTML(only) {
  const en = languageCode() === "en";
  const fonts = `<div class="type-fonts">${TYPE_FONTS.map(([id, zh, enName]) => `<button type="button" data-type-font="${id}" style="font-family:${esc(fontFamily(id, catalog))}">${en ? enName : zh}</button>`).join("")}</div>`;
  const size = `<button type="button" data-type-size="-2" aria-label="${t("type.smaller")}">A−</button><button type="button" data-type-size="2" aria-label="${t("type.bigger")}">A+</button>`;
  const colors = `<span class="type-colors" role="group" aria-label="${t("ctx.color")}">${TYPE_COLORS.map((c) => `<button type="button" data-type-color="${c}" style="--swatch:${c}" aria-pressed="false" aria-label="${t("type.colour." + c.slice(1).toLowerCase())}"></button>`).join("")}</span>`;
  const align = `<span class="type-align" role="group" aria-label="${t("ctx.align")}">${["left", "center", "right"].map((a) => `<button type="button" data-type-align="${a}" aria-label="${t("type.align." + a)}"><i class="align-glyph ${a}" aria-hidden="true"></i></button>`).join("")}</span>`;
  // B / I / U / S: on the selected words; with only a caret, on what is typed
  // next; on a text box that is selected but not being typed in, on all of it.
  const mark = (key, glyph) => `<button type="button" data-type-mark="${key}" aria-pressed="false" aria-label="${t("type.mark." + key)}"><span class="mark-glyph ${key}" aria-hidden="true">${glyph}</span></button>`;
  const marks = `<span class="type-marks" role="group" aria-label="${t("type.marks")}">${mark("bold", "B")}${mark("italic", "I")}${mark("underline", "U")}${mark("strike", "S")}</span>`;
  if (only === "font") return `${fonts}<div class="type-row">${size}${marks}</div>`;
  if (only === "color") return `<div class="type-row">${colors}</div>`;
  if (only === "align") return `<div class="type-row">${align}</div>`;
  // While typing the bar stays two rows: 转为自由文字框 leads the font row (a
  // note's title / words only) and one button steps through the alignments.
  const toBox = `<button type="button" class="type-to-box" data-action="text-to-box" hidden>${t("type.toBox")}</button>`;
  const cycle = `<button type="button" class="type-align-cycle" data-type-align="cycle" aria-label="${t("ctx.align")}"><i class="align-glyph left" aria-hidden="true"></i></button>`;
  // V10.12: squeezed in after B I U S the colours shrank to slivers on a
  // 375–390 px phone and could not be tapped. Now one dot shows the colour in
  // use; tapping it turns this row into the colours (‹ goes back), so the bar
  // keeps its height above the keyboard.
  const colorNow = `<button type="button" class="type-color-now" data-type-colors-open aria-expanded="false" aria-label="${t("ctx.color")}"><i aria-hidden="true"></i></button>`;
  const colorBack = `<button type="button" class="type-color-back" data-type-colors-open aria-label="${t("more.back")}">‹</button>`;
  return `${fonts.replace('<div class="type-fonts">', '<div class="type-fonts">' + toBox)}<div class="type-row type-main-row">${size}${marks}${cycle}${colorNow}</div><div class="type-row type-color-row">${colorBack}${colors}</div>`;
}
function textStyleSheetHTML() {
  return `<div class="type-controls type-sheet" data-tab="${textTab}">${typeControlsHTML(textTab)}</div>`;
}
// V10.25: the selected item's options open as a compact strip above its tools
// (the paper stays big); page-level tools keep the taller sheet.
const STRIP_TOOLS = ["shape", "layer", "textstyle"];
// The bottom of the editor: an open sheet (if any) above one row of tools.
function toolMenuHTML() {
  const tools = studioTools();
  const sheets = [
    ...tools,
    { id: "more", icon: "", label: "tool.more", value: "", body: () => moreSheetHTML(tools) },
    { id: "details", icon: "", label: "tool.details", value: isDayPage() ? t("day.cover") : activePage().title || t("label.titleOptional"), body: detailsSheetHTML },
  ];
  if (selectedLayerOf()?.kind === "text") sheets.push({ id: "textstyle", icon: "", label: "ctx." + textTab, value: "", body: textStyleSheetHTML });
  if (studioTool && !sheets.some((tool) => tool.id === studioTool)) studioTool = null;
  const open = sheets.find((tool) => tool.id === studioTool);
  const back = open && !["more", "stickers", "layer", "textstyle", "shape"].includes(open.id) ? `<button class="sheet-back" data-action="tool" data-tool="more" aria-label="${t("more.back")}">${icon("back")}</button>` : "";
  const sheet = open
    ? `<section class="tool-sheet open ${sheetTall ? "tall" : ""} ${STRIP_TOOLS.includes(open.id) ? "strip" : ""}" data-tool-row="${open.id}" aria-label="${t(open.label)}"><button class="sheet-grabber" data-action="sheet-grow" aria-label="${t(sheetTall ? "sheet.shrink" : "sheet.grow")}"><i></i></button><div class="sheet-head">${back}<b>${t(open.label)}</b><span class="tool-value" data-tool-value="${open.id}">${esc(open.value)}</span><button class="tool-head sheet-close" data-action="tool-close" aria-label="${t("close")}">×</button></div><div class="tool-body">${open.body()}</div></section>`
    : "";
  const tool = (attrs, name, label, cls = "") => `<button class="sv-tool ${cls}" ${attrs}>${svIcon(name)}<small>${label}</small></button>`;
  const photosHere = activePage().layers.filter(framedPhoto).length;
  if (layoutHint && (studioTool || photosHere < 2)) layoutHint = false;
  const hint = layoutHint ? `<div class="layout-hint" role="group"><button data-action="layout-hint-open">${svIcon("layout")}<span>${t("layout.hint", { count: photosHere })}</span><i aria-hidden="true">›</i></button><button class="layout-hint-x" data-action="layout-hint-close" aria-label="${t("layout.hintClose")}">×</button></div>` : "";
  if (selectedLayerOf()) return sheet + hint + ctxDockHTML(tool);
  const moreOpen = Boolean(studioTool) && studioTool !== "stickers";
  const dock = `<nav class="tool-dock sv-tools" aria-label="${t("write.decorate")}">${tool('data-action="add-photos"', "photo", t("add.photo"))}${tool('data-action="add-text-layer"', "text", t("sv.text"))}${tool(`data-action="tool" data-tool="stickers" aria-expanded="${studioTool === "stickers"}"`, "stickers", t("dock.stickers"), `dock-btn ${studioTool === "stickers" ? "open" : ""}`)}${tool(`data-action="tool" data-tool="more" aria-expanded="${moreOpen}"`, "more", t("dock.more"), `dock-btn ${moreOpen ? "open" : ""}`)}</nav>`;
  return sheet + hint + dock;
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
  syncStripHeight();
}
// V10.25: the paper makes room for the strip that is really open (its own
// height), not for the tallest one.
function syncStripHeight() {
  const strip = document.querySelector(".tool-sheet.strip");
  const root = document.documentElement;
  if (strip) root.style.setProperty("--strip-h", `${Math.ceil(strip.getBoundingClientRect().height)}px`);
  else root.style.removeProperty("--strip-h");
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
// V10.32 · The other ways (video, sound, free layout): a compact row right
// under the three, on the first screen — lighter than the photo card, never
// hidden. Choosing one shows its own short note and Start button instead of
// the photo options; the book and date stay. They are not remembered as the
// default way (only the three are).
const QUICK_ALSO = ["video", "voice", "layout"];
const QUICK_ALSO_LABEL = { video: "add.video", voice: "add.sound", layout: "mode.layout" };
const QUICK_ALSO_GLYPH = { video: "▶", voice: "♪", layout: "▦" };
function quickAlsoHTML() {
  return `<div class="quick-also" role="group" aria-label="${t("quick.also")}"><span>${t("quick.also")}</span>${QUICK_ALSO.map((w) => `<button data-action="quick-way" data-way="${w}" aria-pressed="${quick.way === w}"><i aria-hidden="true">${QUICK_ALSO_GLYPH[w]}</i>${t(QUICK_ALSO_LABEL[w])}</button>`).join("")}</div>`;
}
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
    way: QUICK_WAYS.includes(way) ? way : lastQuickWay() || "photo",
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
  $("#choose-dialog").innerHTML = `<div class="choose-sheet quick-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${quick.date === dateKey() ? t("quick.title") : t("quick.titleDate", { date: friendlyDate(quick.date) })}</h2><div class="quick-ways" role="group" aria-label="${t("quick.title")}">${QUICK_WAYS.map(way).join("")}</div>${quickAlsoHTML()}${photos}${QUICK_ALSO.includes(quick.way) ? `<p class="quick-also-say">${t("quick.say." + quick.way)}</p>` : ""}${library}<h3>${t("quick.book")}</h3><div class="quick-books">${state()
    .books.map((book) => `<button data-action="quick-book" data-book="${esc(book.id)}" class="${quick.book === book.id ? "selected" : ""}" aria-pressed="${quick.book === book.id}">${coverHTML(book, ctx())}<span>${esc(book.title)}</span></button>`)
    .join("")}</div><button class="primary full-width quick-start" data-action="${QUICK_ALSO.includes(quick.way) ? "quick-more" : "quick-start"}" data-more="${QUICK_ALSO.includes(quick.way) ? quick.way : ""}">${QUICK_ALSO.includes(quick.way) ? t("quick.start." + quick.way) : t(quick.way === "photo" && quick.photo === "mine" ? "quick.start.pick" : quick.way === "photo" && quick.photo === "pick" ? (quick.lib ? "quick.start.lib" : "quick.start.libPick") : "quick.start." + quick.way)}</button>${pages ? `<button class="quick-continue" data-action="quick-continue">${t("quick.continue", { count: pages })} ›</button>` : ""}<button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
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
  resetHistory(); // setting the page up is not a step to undo
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
// ---------- V10.33 (L1) · Words measured in their real font ----------
// The layout engine asks how tall some words will be; they are rendered off
// screen exactly as the page renders them (same font, size, weight, width
// and line height, on a 1000 px wide page) and measured. While a font the
// words need is still loading the answer is "not known yet" (null): the
// engine then counts lines on the safe side, and the story's pages are laid
// out again once the font has arrived.
const MEASURE_PAGE = 1000;
let measureHost = null;
let measureBox = null;
const measuredWords = new Map();
let fontsWaiting = 0;
function measureWords(text, size, width, fontId, weight = 400) {
  if (typeof document === "undefined" || !document.body) return null;
  const family = fontFamily(fontId, catalog);
  const px = (Math.min(60, Math.max(10, size)) / 3.2) * (MEASURE_PAGE / 100);
  const spec = `${weight} ${px}px ${family}`;
  try {
    if (document.fonts && !document.fonts.check(spec, text)) {
      fontsWaiting++;
      document.fonts
        .load(spec, text)
        .catch(() => {})
        .finally(() => {
          if (--fontsWaiting === 0) fontsArrived();
        });
      return null;
    }
  } catch {
    return null;
  }
  const key = `${fontId}|${weight}|${size}|${width}|${text}`;
  if (measuredWords.has(key)) return measuredWords.get(key);
  if (!measureHost) {
    measureHost = document.createElement("div");
    measureHost.className = "journal-canvas scrapbook-page measure-host";
    measureHost.setAttribute("aria-hidden", "true");
    measureHost.style.cssText = `position:fixed;left:-${MEASURE_PAGE * 3}px;top:0;width:${MEASURE_PAGE}px;visibility:hidden;pointer-events:none;box-shadow:none`;
    measureBox = document.createElement("div");
    measureBox.className = "layer text-layer";
    measureHost.appendChild(measureBox);
    document.body.appendChild(measureHost);
  }
  measureBox.style.cssText = `left:0;top:0;transform:none;width:${width}%;${textCSS({ size, weight }, fontId, 16, catalog)}`;
  measureBox.innerHTML = `<span class="layer-text">${esc(text)}</span>`;
  const height = (measureBox.offsetHeight / (MEASURE_PAGE / PAGE_RATIO)) * 100;
  if (measuredWords.size > 3000) measuredWords.clear();
  measuredWords.set(key, height);
  return height;
}
// A font arrived: the story being made is laid out again with the real
// measure (pages arranged by hand keep their places).
function fontsArrived() {
  measuredWords.clear();
  if (!story?.made || page !== "story" && !$(".story-canvas")) return;
  layoutStory({});
  flushDraft();
  refreshStoryCanvas();
}
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
        // S4-B: a photo the person chose for the cover (from the day or Photos) for this Moment.
        const own = target.coverPhotos?.[m.id];
        if (own?.reference) return { id: m.id, time: m.time, title: m.title, photo: { reference: own.reference, name: own.name || "", aspect: Number(own.aspect) || 1 } };
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
    applyType(result.layers, target.typeStyle);
    target.layers = target.layers.filter((l) => !l.gen && !l.deco).concat(result.layers);
  } else {
    const visuals = visualLayers(target);
    const audio = target.layers.filter((l) => l.kind === "audio");
    const day = new Date(`${story.date}T12:00:00`);
    const folio = `LITTLE DAYS · NO. ${String(day.getDate()).padStart(2, "0")}`;
    // V10.19: each photo's own words (on the photo layer, by its id) are laid
    // out right by that photo; the page's quick type comes along.
    result = layoutMoment({ visuals: visuals.map((l) => ({ id: l.id, aspect: layerAspect(l), caption: l.kind === "photo" ? l.caption || "" : "" })), audio: audio.map((l) => ({ id: l.id })), title: target.title, time: target.time, folio, type: target.typeStyle, measure: measureWords }, style, variant);
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
  // V10.34: how this page did against the quality rules (kept on the story while it is made, not in the data).
  if (!isCover && story && result.quality && editor && findMoment(editor, target.id) === target) (story.quality ||= {})[target.id] = result.quality;
  return result;
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
      for (const key of ["layoutTemplate", "layoutVariant", "layoutStyle", "backdrop", "coverPhotos"]) delete entry[key];
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
      // A3: the words exactly as written (a long text continued over pages joins back to the same text).
      created.title = String(group.line || "").trim() ? group.line : "";
      created.layoutTemplate = "scrapbook";
      created.layoutStyle = story.style;
      created.layoutVariant = 0;
      if (Number.isFinite(group.start)) created.capturedAt = new Date(group.start).toISOString();
      for (const item of group.items) created.layers.push(photoLayer(item.reference, item.name, { ...(item.aspect ? { aspect: Math.round(item.aspect * 1000) / 1000 } : {}), ...(item.caption ? { caption: item.caption } : {}) }));
      if (group.typeStyle) created.typeStyle = { ...group.typeStyle };
      entry.moments.push(created);
    }, false);
    ids.push(created.id);
  }
  // S4-A (V10.44): no day cover unless the person adds one (＋ 封面（可选）);
  // a cover they added stays when the photos are regrouped.
  story.made = { ids, cover: Boolean(story.wantCover) && ids.length >= 1 && !hasDayPageContent(editor) };
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
  story.panel = null;
  story.pick = null;
  story.notice = null;
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
      .map((group, g) => `${g ? `<div class="story-split" aria-hidden="true"><span></span>${t("story.splitHere")}<span></span></div>` : ""}<section class="story-group tone-${partOfDay(group.start) || "none"}"><header><b>${esc(storyTimeLabel(group))}</b><small>${group.items.length ? t("story.photos", { count: group.items.length }) : t("story.wordsOnly")}</small></header>${group.items.length ? "" : `<p class="story-words-only">${esc(String(group.line || "").slice(0, 120))}${[...String(group.line || "")].length > 120 ? "…" : ""}</p>`}<div class="story-thumbs">${group.items
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
  // S4-B: a day cover only when asked for (a dashed tab after the pages).
  const canAddCover = !story.made.cover && !hasDayPageContent(editor);
  const tabs = pages.length > 1 || canAddCover ? `<div class="story-tabs" role="tablist" aria-label="${t("story.pages")}">${pages.map((p, i) => `<button role="tab" data-action="story-page" data-index="${i}" aria-selected="${i === story.index}">${esc(p.label)}</button>`).join("")}${canAddCover ? `<button class="story-cover-add" data-action="story-cover-add">＋ ${t("cover.addOptional")}</button>` : ""}</div>` : "";
  const books = state().books.map((b) => `<option value="${esc(b.id)}" ${b.id === story.book ? "selected" : ""}>${esc(b.title)}</option>`).join("");
  const title = story.date === dateKey() ? t("story.previewTitle") : t("story.previewTitleDay", { date: friendlyDate(story.date) });
  // V10.29 · Quick Edit: every quick change happens right here — change a
  // photo, write, change the layout or style — and Save. 自定义 (free moving,
  // layers…) is at the top right for when it is wanted.
  const tool = (panel, glyph, label) => `<button data-action="story-panel" data-panel="${panel}" aria-pressed="${story.panel === panel}"><span class="qe-glyph" aria-hidden="true">${glyph}</span><b>${t(label)}</b></button>`;
  const bar = `<div class="story-actions qe-bar">${storyPanelHTML(current, total)}<div class="qe-tools" role="group" aria-label="${t("story.styleLabel")}">${tool("photo", "⇄", "qe.photo")}<button data-action="story-text"><span class="qe-glyph" aria-hidden="true">Aa</span><b>${t("qe.words")}</b></button>${tool("layout", "▦", "qe.layout")}<button class="primary qe-save" data-action="story-save">${t("save")}</button></div></div>`;
  return `<header class="story-bar">${back}<h1>${esc(title)}</h1><button class="story-custom" data-action="story-adjust">${t("story.customize")}</button></header><div class="story-where"><label class="story-book"><span>${t("story.into")}</span><select data-story-book aria-label="${t("story.into")}">${books}</select></label><label class="story-day"><span>${t("story.day")}</span><input type="date" data-story-date value="${esc(story.date)}" max="${dateKey()}" aria-label="${t("story.day")}"></label></div>${tabs}<button class="story-canvas" data-action="story-tap" aria-label="${t("story.addWords")}">${current ? sharedCanvasHTML(current.page, ctx(), { readOnly: true, dayPage: current.cover }) : ""}${storyRingHTML(current)}</button>${bar}`;
}
// ---------- V10.29 · Quick Edit: change a photo, change the layout ----------
// 写文字 (and a tap beside the photos) opens the page's own line (整体); on
// the day spread, the Moment last written for.
function storyLineTarget() {
  const moments = storyMomentsOf(storyPages()[story.index]);
  if (!moments.length) return null;
  const momentId = moments.some((m) => m.id === storyWords?.momentId) ? storyWords.momentId : moments[0].id;
  return { momentId, target: "moment" };
}
// The photos of the page in view (on the day spread: every Moment's), in
// order, numbered as the person sees them ("第 2 张").
function storyPhotoChoices(current) {
  return storyMomentsOf(current).flatMap((m) => storyPhotosOf(m).map((p) => ({ m, p }))).map((c, i) => ({ ...c, n: i + 1 }));
}
function storyPicked(current) {
  const choices = storyPhotoChoices(current);
  const pick = story.pick && choices.find((c) => c.m.id === story.pick.momentId && c.p.id === story.pick.layerId);
  return pick || choices[0] || null;
}
// The chosen photo, outlined on the page (on the spread: its copy there).
function storyRingHTML(current) {
  if (!current || story.panel !== "photo") return "";
  const pick = storyPicked(current);
  if (!pick) return "";
  const page = current.cover ? editor : current.page;
  const layer = current.cover ? page.layers.find((l) => l.gen && l.mediaRef === pick.p.mediaRef) : page.layers.find((l) => l.id === pick.p.id);
  if (!layer) return "";
  const n = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const w = n(layer.w, 40) * n(layer.scale, 1),
    h = n(layer.h, 30) * n(layer.scale, 1);
  return `<i class="qe-ring" aria-hidden="true" style="left:${n(layer.x, 50) - w / 2}%;top:${n(layer.y, 50) - h / 2}%;width:${w}%;height:${h}%;transform:rotate(${n(layer.rotation, 0)}deg)"><b>${t("qe.nth", { n: pick.n })}</b></i>`;
}
// What the page looks like with layout `variant` (worked out on a copy).
function storyVariantPreview(current, variant) {
  const copy = structuredClone(current.cover ? editor : findMoment(editor, current.page.id));
  copy.layoutVariant = variant;
  copy.layoutEdited = false;
  const result = layoutStoryPage(copy, current.cover);
  const html = sharedCanvasHTML(copy, ctx(), { readOnly: true, dayPage: current.cover }).replace(/ data-action="[^"]*"/g, "").replace(/ tabindex="0"/g, ' tabindex="-1"');
  return { html, kind: result?.arrangement || "", options: result?.quality?.options ?? 3 };
}
// The arrangement a Moment page gets with `variant` ("" when not a pair).
function storyArrangement(moment, variant = moment.layoutVariant) {
  const copy = structuredClone(moment);
  copy.layoutVariant = Number(variant) || 0;
  return layoutStoryPage(copy, false)?.arrangement || "";
}
// ---------- V10.34 (L3) · Too much for one page: suggest a split ----------
// Only when no arrangement of this page passes the quality rules. The
// person sees the page as it is and the pages it would become, and decides;
// nothing is added on its own. Every photo, word and line is kept, in order.
function storySplitFor(current) {
  if (!current || current.cover) return null;
  const q = story.quality?.[current.page.id];
  if (!q || q.ok) return null;
  const m = findMoment(editor, current.page.id);
  if (!m || m.layoutEdited) return null;
  const photos = visualLayers(m);
  const sig = JSON.stringify([photos.map((l) => [l.id, l.mediaRef, l.caption || ""]), m.title || "", m.layoutStyle, m.typeStyle || null]);
  story.splits ||= {};
  if (story.splits[m.id]?.sig !== sig) {
    const day = new Date(`${story.date}T12:00:00`);
    const input = { visuals: photos.map((l) => ({ id: l.id, aspect: layerAspect(l), caption: l.kind === "photo" ? l.caption || "" : "" })), audio: m.layers.filter((l) => l.kind === "audio").map((l) => ({ id: l.id })), title: m.title, time: m.time, folio: `LITTLE DAYS · NO. ${String(day.getDate()).padStart(2, "0")}`, type: m.typeStyle, measure: measureWords };
    const style = styleOf(m.layoutStyle || story.style);
    // The photos over more pages first; when the words are what does not
    // fit (A3), the words continue on the pages after (cut between sentences).
    const parts = suggestSplit(input, style);
    const byText = parts ? null : suggestTextSplit(input, style);
    story.splits[m.id] = { sig, parts: parts || byText?.parts || null, texts: byText?.texts || null };
  }
  const found = story.splits[m.id];
  return found.parts ? { m, parts: found.parts, texts: found.texts } : null;
}
function storySplitHTML(current, { force = false } = {}) {
  if (story.panel && !force) return "";
  const s = storySplitFor(current);
  if (!s || (story.keepOne?.[s.m.id] && !force)) return "";
  const mini = (page) => `<span class="qe-mini">${sharedCanvasHTML(page, ctx(), { readOnly: true }).replace(/ data-action="[^"]*"/g, "").replace(/ tabindex="0"/g, ' tabindex="-1"')}</span>`;
  const pages = s.parts.map((ids, i) => {
    const copy = structuredClone(s.m);
    copy.layers = copy.layers.filter((l) => !l.gen && !l.deco && !(visualLayers(s.m).some((v) => v.id === l.id) && !ids.includes(l.id)) && !(l.kind === "audio" && i > 0));
    if (s.texts) copy.title = s.texts[i];
    else if (i > 0) copy.title = "";
    copy.layoutVariant = 0;
    copy.layoutEdited = false;
    layoutStoryPage(copy, false);
    return `<figure>${mini(copy)}<figcaption>${ids.length ? t("qe.split.page", { n: i + 1, count: ids.length }) : t("qe.split.wordsPage", { n: i + 1 })}</figcaption></figure>`;
  });
  const n = s.parts.length;
  return `<section class="qe-panel qe-split" aria-label="${esc(t("qe.split.title", { n }))}"><header><span><b>${t("qe.split.title", { n })}</b><small>${t(s.texts ? "qe.split.wordsHint" : "qe.split.hint")}</small></span></header><div class="qe-split-pages"><figure class="now">${mini(s.m)}<figcaption>${t("qe.split.now")}</figcaption></figure>${pages.join("")}</div><div class="qe-row"><button class="secondary" data-action="story-keep-one">${t("qe.split.keep")}</button><button class="primary" data-action="story-split-pages">${t("qe.split.do", { n })}</button></div><p class="qe-hint">${t(s.texts ? "qe.split.keepWordsNote" : "qe.split.keepNote")}</p></section>`;
}
function storyPanelHTML(current, total) {
  const notice = (story.notice ? `<div class="qe-notice" role="status"><span>${esc(story.notice.text)}</span>${story.notice.undo ? `<button data-action="story-undo">${t("qe.undo")}</button>` : ""}${story.notice.coverUndo ? `<button data-action="story-cover-remove">${t("cover.dontWant")}</button>` : ""}</div>` : "") + storySplitHTML(current);
  if (!current || !story.panel) return notice;
  const done = `<button class="qe-done" data-action="story-panel" data-panel="">${t("qe.done")}</button>`;
  if (story.panel === "photo") {
    const choices = storyPhotoChoices(current);
    const pick = storyPicked(current);
    if (!pick) return notice;
    const hand = Boolean(pick.m.layoutEdited);
    const thumbs = choices
      .map((c) => `<button data-action="story-pick" data-moment="${esc(c.m.id)}" data-layer="${esc(c.p.id)}" aria-pressed="${c === pick || (c.m.id === pick.m.id && c.p.id === pick.p.id)}" aria-label="${esc(t("qe.nth", { n: c.n }))}"><img src="${esc(safePhoto(c.p.mediaRef))}" alt=""><b aria-hidden="true">${c.n}</b>${(c.p.caption || "").trim() ? '<i class="sw-dot" aria-hidden="true"></i>' : ""}</button>`)
      .join("");
    return `${notice}<section class="qe-panel qe-photo" aria-label="${t("qe.photoTitle")}"><header><span><b>${t("qe.photoTitle")}</b><small>${t("qe.photoHint")}</small></span>${done}</header><div class="qe-thumbs">${thumbs}</div><p class="qe-hint">${t(hand ? "qe.photoKeepHand" : "qe.photoKeep")}</p><div class="qe-row"><button class="secondary" data-action="story-words-photo">Aa ${t("qe.wordsFor")}</button><button class="primary" data-action="story-replace">${t("qe.replace")}</button></div></section>`;
  }
  const target = current.cover ? editor : findMoment(editor, current.page.id);
  const hand = Boolean(target?.layoutEdited);
  const now = (Number(target?.layoutVariant) || 0) % 3;
  // V10.33: only layouts that pass the quality rules are offered, never the same page twice.
  const first = storyVariantPreview(current, 0);
  const count = current.cover ? 3 : Math.max(1, Math.min(3, first.options || 1));
  const variants = [...Array(count).keys()]
    .map((v) => {
      const { html, kind } = v === 0 ? first : storyVariantPreview(current, v);
      const name = PAIR_KINDS.includes(kind) ? t(`qe.kind.${kind}`) : t("qe.layoutN", { n: v + 1 });
      const on = !hand && v === now % count;
      return `<button data-action="story-layout" data-variant="${v}" data-kind="${kind}" aria-pressed="${on}"><span class="qe-mini" aria-hidden="true">${html}</span><b>${esc(name)}</b><small>${on ? t("qe.current") : v === 0 ? t("qe.recommended") : "&nbsp;"}</small></button>`;
    })
    .join("");
  const styles = STYLES.map((s) => `<button data-action="story-style" data-style="${s}" aria-pressed="${s === styleOf(target?.layoutStyle || story.style)}">${STYLE_ICONS[s]}<b>${t("story.style." + s)}</b></button>`).join("");
  return `${notice}<section class="qe-panel qe-layout" aria-label="${t("qe.layoutTitle")}"><header><span><b>${t("qe.layoutTitle")}</b><small>${t(hand ? "qe.layoutHand" : "qe.layoutHint")}</small></span>${done}</header><div class="qe-variants">${variants}</div><div class="story-styles qe-styles" role="group" aria-label="${t("story.styleLabel")}">${styles}</div>${current.cover ? `<button class="qe-regroup" data-action="story-cover-remove">${t("cover.remove")}</button>` : ""}${storySplitFor(current) ? `<button class="qe-regroup" data-action="story-split-show">${t("qe.split.do", { n: storySplitFor(current).parts.length })}</button>` : ""}${total > 1 ? `<button class="qe-regroup" data-action="story-group">${t("qe.regroup")}</button>` : ""}</section>`;
}
// Keep the chosen photo in view above the Quick Edit panel.
function revealStoryPick() {
  requestAnimationFrame(() => {
    const ring = $(".story-canvas .qe-ring"),
      bar = $(".qe-bar"),
      scroll = $("#app-scroll");
    if (!ring || !bar || !scroll) return;
    const r = ring.getBoundingClientRect(),
      limit = bar.getBoundingClientRect().top - 8;
    if (r.bottom > limit || r.top < 60) scroll.scrollBy({ top: r.top - Math.max(64, (limit - r.height) / 2), behavior: "smooth" });
  });
}
const COVER_FIELDS = ["layers", "template", "backdrop", "layoutStyle", "layoutVariant", "layoutEdited", "layoutTemplate", "typeStyle"];
// Replace one photo, from Quick Edit. Only that photo layer changes: its
// id stays, so its words (caption, by the layer id) stay with it; the page's
// line, type and style stay. A page arranged by hand keeps every place (the
// new photo fits the old one's box); otherwise the page is laid out again
// in the same style and, for a pair, the same arrangement. One step back.
function storyReplacePhoto(target, item) {
  if (!story?.made) return;
  const before = findMoment(editor, target.momentId);
  const old = before?.layers.find((l) => l.id === target.layerId);
  if (!old) return;
  const oldRef = old.mediaRef;
  const kept = Boolean((old.caption || "").trim());
  const n = storyPhotoChoices(storyPages()[story.index]).find((c) => c.p.id === old.id)?.n || 1;
  const undo = { momentId: before.id, moment: structuredClone(before), cover: story.made.cover ? Object.fromEntries(COVER_FIELDS.map((k) => [k, structuredClone(editor[k])])) : null, groups: structuredClone(story.groups) };
  // V10.34: the story's photo groups follow too, so regrouping or splitting keeps the new photo.
  const g = story.made.ids.indexOf(before.id);
  const slot = storyPhotosOf(before).findIndex((l) => l.id === old.id);
  if (g >= 0 && slot >= 0 && story.groups[g]?.items[slot]?.reference === oldRef) story.groups[g].items[slot] = { ...story.groups[g].items[slot], reference: item.reference, name: item.name || story.groups[g].items[slot].name, ...(item.aspect ? { aspect: item.aspect } : {}) };
  const hand = Boolean(before.layoutEdited);
  const keepKind = hand ? "" : storyArrangement(before);
  const fitInto = (layer, aspect) => {
    if (!aspect || layer.shape || layer.drawing) return;
    const box = fitPhoto(aspect, Number(layer.w) || 42, Number(layer.h) || 34, layer.frame || "bare");
    layer.w = Math.round(box.w * 100) / 100;
    layer.h = Math.round(box.h * 100) / 100;
  };
  changeEditor((entry) => {
    const m = findMoment(entry, target.momentId);
    const layer = m?.layers.find((l) => l.id === target.layerId);
    if (!layer) return;
    layer.mediaRef = item.reference;
    layer.text = item.name || layer.text;
    layer.crop = { x: 50, y: 50, zoom: 1 };
    delete layer.sourceRef;
    delete layer.edit;
    // S3: a photo reused from elsewhere keeps its original for re-editing.
    if (item.sourceRef) {
      layer.sourceRef = item.sourceRef;
      if (item.edit) layer.edit = structuredClone(item.edit);
    }
    if (item.aspect) layer.aspect = Math.round(item.aspect * 1000) / 1000;
    if (hand) fitInto(layer, item.aspect);
    // The day spread's copy of it shows the new photo too.
    for (const copy of entry.layers || [])
      if (copy.gen && copy.mediaRef === oldRef) {
        copy.mediaRef = item.reference;
        if (item.aspect) copy.aspect = layer.aspect;
        if (entry.layoutEdited) fitInto(copy, item.aspect);
      }
    m.updatedAt = new Date().toISOString();
    if (keepKind) {
      const v = [0, 1, 2].find((x) => storyArrangement(m, x) === keepKind);
      if (v != null) m.layoutVariant = v;
    }
  }, false);
  layoutStory({ which: [target.momentId, "cover"] });
  flushDraft();
  story.notice = { text: kept ? t("qe.replacedKept", { n }) : t("qe.replaced"), undo };
  logEvent("qe_replace", { kept, hand });
}
// ---------- S4-B (V10.44) · A day cover only when the person adds one ----------
function storyAddCover() {
  if (!story?.made || story.made.cover || hasDayPageContent(editor)) return;
  story.wantCover = true;
  story.made.cover = true;
  changeEditor((entry) => {
    entry.layoutTemplate = "scrapbook";
    entry.layoutStyle = story.style;
    entry.layoutVariant = 0;
    entry.bookId = story.book;
  }, false);
  layoutStory({ which: ["cover"], force: true });
  story.index = 0;
  story.panel = null;
  story.notice = { text: t("cover.added"), coverUndo: true };
  flushDraft();
  logEvent("day_cover_add", {});
}
function storyRemoveCover() {
  if (!story?.made?.cover) return;
  story.wantCover = false;
  story.made.cover = false;
  changeEditor((entry) => {
    entry.layers = entry.layers.filter((l) => !l.gen && !l.deco);
    for (const key of ["layoutTemplate", "layoutVariant", "layoutStyle", "backdrop", "coverPhotos", "layoutEdited"]) delete entry[key];
  }, false);
  story.index = 0;
  story.panel = null;
  story.notice = { text: t("cover.removed") };
  flushDraft();
  logEvent("day_cover_remove", {});
}
// The cover's photo for one Moment: from the day, the book or Photos. Only
// the cover changes; the Moment page keeps its photo.
function storyCoverPhoto(momentId, item) {
  if (!story?.made?.cover) return;
  changeEditor((entry) => {
    entry.coverPhotos = { ...(entry.coverPhotos || {}), [momentId]: { reference: item.reference, name: item.name || "", aspect: Math.round((Number(item.aspect) || 1) * 1000) / 1000 } };
  }, false);
  layoutStory({ which: ["cover"] });
  story.notice = { text: t("cover.photoChanged") };
  flushDraft();
}
function storyUndoReplace() {
  const undo = story?.notice?.undo;
  if (!undo) return;
  changeEditor((entry) => {
    const i = entry.moments.findIndex((m) => m.id === undo.momentId);
    if (i >= 0) entry.moments[i] = structuredClone(undo.moment);
    if (undo.cover)
      for (const [k, v] of Object.entries(undo.cover)) {
        if (v === undefined) delete entry[k];
        else entry[k] = structuredClone(v);
      }
  }, false);
  if (undo.groups) story.groups = undo.groups;
  flushDraft();
  story.notice = null;
  logEvent("qe_undo", {});
  toast(t("qe.undone"));
}
document.addEventListener("input", (event) => {
  if (event.target.matches?.("[data-sw-text]") && story) storyWordsInput(event.target);
});
// Where the magazine page was tapped (in % of the paper), to open that photo's words.
document.addEventListener(
  "pointerdown",
  (event) => {
    const box = event.target.closest?.(".story-canvas");
    const paper = box?.firstElementChild;
    if (!paper) return;
    const r = paper.getBoundingClientRect();
    window.__storyTapAt = { x: ((event.clientX - r.left) / r.width) * 100, y: ((event.clientY - r.top) / r.height) * 100 };
  },
  true,
);
// ---------- V10.19 · Words, photo by photo, and quick type ----------
// One sheet, no nesting: the Moment's own line or one photo's line at a
// time (its real thumbnail, "照片 2 / 3"), and a compact row of type for
// this page. Every keystroke is kept on the spot (the photo's words live on
// that photo layer, found by its id), so switching photos loses nothing; the
// magazine page behind updates as you type.
let storyWords = null; // { momentId, target: "moment" | <photo layer id> }
let swTypeOpen = false; // V10.29: fonts and colours stay folded until asked for
document.addEventListener("toggle", (event) => {
  if (event.target.matches?.(".sw-more")) swTypeOpen = event.target.open;
}, true);
let storyWordsTimer = 0;
// A3 · Words are never cut to fit. WORDS_MAX is only a safety net (the same
// as a page's body text); near it the count shows, and at it the person is
// told, instead of typing that silently goes nowhere.
const WORDS_MAX = 4000;
function wordsCountHTML(value) {
  const n = [...String(value || "")].length;
  if (n < WORDS_MAX - 400) return `<small class="sw-count" aria-live="polite" hidden></small>`;
  return `<small class="sw-count ${n >= WORDS_MAX ? "full" : ""}" aria-live="polite">${n >= WORDS_MAX ? esc(t("sw.full", { max: WORDS_MAX })) : `${n} / ${WORDS_MAX}`}</small>`;
}
const storyPhotosOf = (m) => (m?.layers || []).filter((l) => l.kind === "photo" && l.mediaRef && !l.gen && !l.drawing && !l.deco);
function storyTypePage() {
  const current = storyPages()[story.index];
  return current ? (current.cover ? editor : findMoment(editor, current.page.id)) : null;
}
function storyWordsHTML() {
  const current = storyPages()[story.index];
  const moments = storyMomentsOf(current);
  if (!storyWords || !moments.some((m) => m.id === storyWords.momentId)) storyWords = { momentId: moments[0]?.id, target: "moment" };
  const m = moments.find((x) => x.id === storyWords.momentId);
  const photos = storyPhotosOf(m);
  if (storyWords.target !== "moment" && !photos.some((p) => p.id === storyWords.target)) storyWords.target = "moment";
  const target = storyWords.target;
  const said = (text) => Boolean(String(text || "").trim());
  const momentTabs =
    moments.length > 1
      ? `<div class="sw-moments" role="tablist" aria-label="${t("sw.moments")}">${moments.map((x) => `<button role="tab" data-action="sw-moment" data-moment="${esc(x.id)}" aria-selected="${x.id === m.id}">${esc(x.time || t("story.page"))}<small>${t("story.photos", { count: storyPhotosOf(x).length })}</small></button>`).join("")}</div>`
      : "";
  const items = [
    `<button class="sw-item sw-all" role="tab" data-action="sw-target" data-target="moment" aria-selected="${target === "moment"}" aria-label="${esc(t("sw.whole") + (said(m.title) ? ` · ${t("sw.written")}` : ""))}"><span class="sw-glyph" aria-hidden="true">Aa</span><small>${t("sw.wholeShort")}</small>${said(m.title) ? '<i class="sw-dot" aria-hidden="true"></i>' : ""}</button>`,
    ...photos.map((p, i) => `<button class="sw-item" role="tab" data-action="sw-target" data-target="${esc(p.id)}" aria-selected="${target === p.id}" aria-label="${esc(t("sw.photoOf", { n: i + 1, count: photos.length }) + (said(p.caption) ? ` · ${t("sw.written")}` : ""))}"><img src="${esc(safePhoto(p.mediaRef))}" alt=""><b class="sw-num" aria-hidden="true">${i + 1}</b>${said(p.caption) ? '<i class="sw-dot" aria-hidden="true"></i>' : ""}</button>`),
  ].join("");
  const photo = photos.find((p) => p.id === target);
  const index = photo ? photos.indexOf(photo) : -1;
  const value = photo ? photo.caption || "" : m.title || "";
  // A3: no small cap — long words become body text, and a page that can't
  // hold them suggests another page. The limit is only a safety net, and
  // the count shows when it comes near.
  const max = WORDS_MAX;
  const now = photo
    ? `<img src="${esc(safePhoto(photo.mediaRef))}" alt=""><span><b>${t("sw.photoOf", { n: index + 1, count: photos.length })}</b><small>${t("sw.photoHint")}</small></span>`
    : `<span class="sw-glyph" aria-hidden="true">Aa</span><span><b>${t("sw.whole")}</b><small>${t("sw.wholeHint")}</small></span>`;
  return `${momentTabs}<div class="sw-strip" role="tablist" aria-label="${t("sw.strip")}">${items}</div><div class="sw-edit"><div class="sw-now">${now}</div><textarea data-sw-text rows="2" maxlength="${max}" placeholder="${esc(photo ? t("sw.photoPlaceholder") : t("story.linePlaceholder"))}" aria-label="${esc(photo ? t("sw.photoOf", { n: index + 1, count: photos.length }) : t("sw.whole"))}">${esc(value)}</textarea>${wordsCountHTML(value)}</div><p class="sw-optional">${t("qe.optional")}</p><details class="sw-more" ${swTypeOpen ? "open" : ""}><summary>${t("qe.typeMore")}</summary>${storyTypeHTML()}</details>`;
}
// The type for this page: the same fonts and colours as Journal Studio.
function storyTypeHTML() {
  const type = storyTypePage()?.typeStyle || {};
  const en = languageCode() === "en";
  const fonts = TYPE_FONTS.map(([fid, zh, enName]) => `<button type="button" data-action="sw-font" data-font="${fid}" aria-pressed="${type.fontId === fid}" style="font-family:${esc(fontFamily(fid, catalog))}">${en ? enName : zh}</button>`).join("");
  const scale = typeScale(type);
  const colors = TYPE_COLORS.filter((c) => c !== "#FFFDF8").map((c) => `<button type="button" data-action="sw-color" data-color="${c}" style="--swatch:${c}" aria-pressed="${(type.color || "").toUpperCase() === c}" aria-label="${t("type.colour." + c.slice(1).toLowerCase())}"></button>`).join("");
  const align = ["left", "center", "right"].map((a) => `<button type="button" data-action="sw-align" data-align="${a}" aria-pressed="${type.align === a}" aria-label="${t("type.align." + a)}"><i class="align-glyph ${a}" aria-hidden="true"></i></button>`).join("");
  return `<div class="sw-type" role="group" aria-label="${t("sw.type")}"><div class="sw-fonts"><button type="button" data-action="sw-font" data-font="" aria-pressed="${!type.fontId}">${t("sw.fontAuto")}</button>${fonts}</div><div class="sw-row"><button type="button" data-action="sw-size" data-dir="-1" aria-label="${t("type.smaller")}" ${scale <= TYPE_SCALES[0] ? "disabled" : ""}>A−</button><button type="button" data-action="sw-size" data-dir="1" aria-label="${t("type.bigger")}" ${scale >= TYPE_SCALES.at(-1) ? "disabled" : ""}>A+</button><button type="button" class="sw-bold" data-action="sw-bold" aria-pressed="${Boolean(type.bold)}" aria-label="${t("type.mark.bold")}"><b>B</b></button><span class="sw-align">${align}</span></div><div class="sw-colors" role="group" aria-label="${t("ctx.color")}">${colors}</div></div>`;
}
function openStoryText(target = null) {
  const current = storyPages()[story.index];
  const moments = storyMomentsOf(current);
  if (!moments.length) return;
  if (target) storyWords = target;
  else if (!storyWords || !moments.some((m) => m.id === storyWords.momentId)) storyWords = { momentId: moments[0].id, target: "moment" };
  const dialog = $("#choose-dialog");
  dialog.classList.add("see-through");
  dialog.innerHTML = `<div class="choose-sheet story-text-sheet sw"><div class="choose-grabber" aria-hidden="true"></div><div class="sw-head"><h2>${t("sw.title")}</h2><button class="sw-done" data-action="story-text-done">${t("pages.done")}</button></div><div class="sw-body">${storyWordsHTML()}</div></div>`;
  if (!dialog.open) dialog.showModal();
  dialog.addEventListener("close", () => dialog.classList.remove("see-through"), { once: true });
  // V10.29: ready to type at once (in the same tap, so iOS shows the keyboard).
  const field = dialog.querySelector("[data-sw-text]");
  if (field) {
    field.focus({ preventScroll: true });
    field.setSelectionRange(field.value.length, field.value.length);
  }
  revealStoryTarget();
}
function refreshStoryWords(focus = false) {
  const body = $("#choose-dialog .sw-body");
  if (!body) return;
  body.innerHTML = storyWordsHTML();
  if (focus) body.querySelector("[data-sw-text]")?.focus();
  revealStoryTarget();
}
// Keep the photo being written for (or the page's line) in view above the sheet.
function revealStoryTarget() {
  const scroll = $("#app-scroll"),
    canvas = $(".story-canvas");
  if (!scroll || !canvas || !storyWords) return;
  const current = storyPages()[story.index];
  const page = current?.cover ? editor : current?.page;
  const layer = (page?.layers || []).find((l) => (storyWords.target === "moment" ? l.bind === "title" && (!l.of || l.of === storyWords.momentId) : l.id === storyWords.target || (l.gen && l.mediaRef && l.mediaRef === findMoment(editor, storyWords.momentId)?.layers.find((p) => p.id === storyWords.target)?.mediaRef)));
  const rect = canvas.getBoundingClientRect();
  const y = layer ? rect.top + (rect.height * (Number(layer.y) || 50)) / 100 : rect.top;
  const sheetTop = $("#choose-dialog .sw")?.getBoundingClientRect().top || innerHeight * 0.55;
  const room = sheetTop - 12;
  if (y < 70 || y > room) scroll.scrollBy({ top: y - Math.max(90, room * 0.45), behavior: "smooth" });
}
// Typed words: kept at once on the Moment / photo; the page follows shortly.
function storyWordsInput(field) {
  const value = field.value;
  const count = $("#choose-dialog .sw-count");
  if (count) count.outerHTML = wordsCountHTML(value);
  const { momentId, target } = storyWords;
  const m = findMoment(editor, momentId);
  if (!m) return;
  if (target === "moment") {
    m.title = value;
    const group = story.groups[story.made.ids.indexOf(momentId)];
    if (group) group.line = value.trim();
  } else {
    const photo = m.layers.find((l) => l.id === target);
    if (!photo) return;
    if (value.trim()) photo.caption = value;
    else delete photo.caption;
  }
  m.updatedAt = new Date().toISOString();
  scheduleDraft();
  // The little dot on the thumbnail follows what is written.
  const item = $(`#choose-dialog .sw-item[data-target="${CSS.escape(target)}"]`);
  if (item) {
    const dot = item.querySelector(".sw-dot");
    if (value.trim() && !dot) item.insertAdjacentHTML("beforeend", '<i class="sw-dot" aria-hidden="true"></i>');
    if (!value.trim() && dot) dot.remove();
  }
  clearTimeout(storyWordsTimer);
  storyWordsTimer = setTimeout(() => relayoutStoryWords([momentId]), 260);
}
// Lay the touched pages out again (words take room) and redraw the preview.
// Pages arranged by hand keep their places; a photo's new words are put
// under it there.
function relayoutStoryWords(momentIds = []) {
  if (!story?.made) return;
  changeEditor((entry) => {
    for (const momentId of momentIds) {
      const m = findMoment(entry, momentId);
      if (m?.layoutEdited) addMissingCaptions(m);
    }
  }, false);
  layoutStory({ which: [...momentIds, "cover"] });
  flushDraft();
  refreshStoryCanvas();
}
function refreshStoryCanvas() {
  const current = storyPages()[story.index];
  const canvas = $(".story-canvas");
  if (canvas && current) canvas.innerHTML = sharedCanvasHTML(current.page, ctx(), { readOnly: true, dayPage: current.cover });
}
// A page arranged by hand: a photo that got words but has no line on the
// page yet gets one right under it (nothing else moves).
function addMissingCaptions(page) {
  const look = STYLE_LOOK[styleOf(page.layoutStyle)];
  for (const photo of storyPhotosOf(page)) {
    if (!(photo.caption || "").trim() || page.layers.some((l) => l.bind === "caption" && l.captionOf === photo.id)) continue;
    const w = Math.min(86, Math.max(26, Number(photo.w) || 40));
    const size = 10.5 * typeScale(page.typeStyle);
    const h = textBlock(photo.caption, size, w).height;
    const y = Math.min(99 - h / 2, (Number(photo.y) || 50) + (Number(photo.h) || 30) / 2 + 1.2 + h / 2);
    const layer = { id: id(), kind: "text", bind: "caption", captionOf: photo.id, text: photo.caption, x: Number(photo.x) || 50, y, w, scale: 1, rotation: 0, fontId: pickFont(photo.caption, look), fontSize: size, color: look.muted, weight: 400, spacing: 0, align: "center" };
    applyType([layer], page.typeStyle);
    page.layers.push(layer);
  }
}
// Quick type: changes this page's typeStyle and the words already on it.
function storyType(change) {
  const current = storyPages()[story.index];
  if (!current) return;
  const key = current.cover ? "cover" : current.page.id;
  let before = null;
  changeEditor((entry) => {
    const target = current.cover ? entry : findMoment(entry, current.page.id);
    if (!target) return;
    before = { ...(target.typeStyle || {}) };
    const next = change({ ...before });
    for (const k of Object.keys(next)) if (next[k] == null || next[k] === "") delete next[k];
    target.typeStyle = next;
    // Pages arranged by hand keep their places: only the words' look changes.
    if (target.layoutEdited) {
      applyType(target.layers, next);
      if (typeScale(next) !== typeScale(before)) for (const l of target.layers) if (l.kind === "text" && ["title", "caption"].includes(l.bind)) l.fontSize = Math.round(((Number(l.fontSize) || 14) * typeScale(next)) / typeScale(before) * 10) / 10;
      if (next.bold == null && before.bold != null) for (const l of target.layers) if (l.kind === "text" && ["title", "caption"].includes(l.bind)) l.weight = l.bind === "title" ? 500 : 400;
    }
  }, false);
  layoutStory({ which: [key] });
  flushDraft();
  refreshStoryCanvas();
  const tools = $("#choose-dialog .sw-type");
  if (tools) tools.outerHTML = storyTypeHTML();
  logEvent("story_type", {});
}
async function saveStoryText() {
  clearTimeout(storyWordsTimer);
  const ids = storyWords?.momentId ? [storyWords.momentId] : [];
  $("#choose-dialog").close();
  relayoutStoryWords(ids);
  logEvent("story_words", { photos: storyMomentsOf(storyPages()[story.index]).reduce((n, m) => n + storyPhotosOf(m).filter((p) => (p.caption || "").trim()).length, 0) });
  render();
}
function finishStory() {
  const { book, date } = story;
  const lastId = story.made?.ids?.at(-1);
  if (lastId) captainSaved = { date, momentId: lastId, at: Date.now() };
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
  // Straight into the book, in the reader, at the first page of this day.
  const pagesNow = flipPages(book);
  const first = pagesNow.find((p) => p.date === date);
  openReader(book, first ? Reader.keyOf(first) : Reader.COVER);
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
  // V10.11: the new page opens in the reader (‹ there goes to the book).
  openReader(book, Reader.keyOf(pages[at]));
  keeperStamp();
  // Today's first page: the stamp moment, right here on the page just made.
  setTimeout(() => maybeCelebrate(true), 260);
}
async function storyAction(actionName, target) {
  if (!story) return;
  const sel = story.selected;
  // The "replaced · undo" note stays only until the next change.
  if (!["story-undo", "story-panel", "story-pick", "story-tap", "story-keep-one", "story-split-show"].includes(actionName)) story.notice = null;
  if (actionName === "story-keep-one") {
    const current = storyPages()[story.index];
    (story.keepOne ||= {})[current.page.id] = true;
    logEvent("qe_keep_one", {});
    toast(t("qe.split.kept"));
    render();
    return;
  }
  if (actionName === "story-split-show") {
    const current = storyPages()[story.index];
    if (story.keepOne) delete story.keepOne[current.page.id];
    story.panel = null;
    render();
    return;
  }
  if (actionName === "story-split-pages") {
    // The same as 调整照片分组 → 从这里分开, done for the person: the page's
    // photo group is cut where the suggestion says. Words go with their photos
    // (by the photo), the line stays on the first page, every new page keeps
    // the page's type.
    const current = storyPages()[story.index];
    const s = storySplitFor(current);
    const g = story.made.ids.indexOf(current?.page.id);
    if (!s || g < 0) return;
    const type = s.m.typeStyle ? { ...s.m.typeStyle } : null;
    // Every page keeps the words it has now (by its place, before the cut).
    story.groups = story.groups.map((group, k) => ({ ...group, line: findMoment(editor, story.made.ids[k])?.title ?? group.line, keepLine: true }));
    if (s.texts) {
      // A3: the words continue on the pages after the photos. The photos go
      // where the suggestion put them; a page of only words has no photos.
      const refOf = new Map(visualLayers(s.m).map((l) => [l.id, l.mediaRef]));
      const group = story.groups[g];
      const pages = s.parts.map((ids, i) => ({ ...group, items: group.items.filter((item) => ids.some((lid) => refOf.get(lid) === item.reference)), line: s.texts[i], typeStyle: type, keepLine: true, ...(ids.length ? {} : { wordsOnly: true }) }));
      story.groups.splice(g, 1, ...pages);
      logEvent("qe_split", { pages: s.parts.length, words: true });
      return storyAction("story-regroup", target);
    }
    let at = g;
    for (const part of s.parts.slice(0, -1)) {
      story.groups = splitAt(story.groups, at, part.length);
      at++;
    }
    for (let k = g; k <= at; k++) if (story.groups[k]) story.groups[k].typeStyle = type;
    // The new pages start without a line of their own (the line stays on the first).
    story.groups = story.groups.map((group) => ({ ...group, line: group.line || "", keepLine: true }));
    logEvent("qe_split", { pages: s.parts.length });
    return storyAction("story-regroup", target);
  }
  if (actionName === "story-tap") {
    // Tap a photo on the page: choose it (to change it, or write for it);
    // tap anywhere else: write.
    const current = storyPages()[story.index];
    const at = window.__storyTapAt;
    window.__storyTapAt = null;
    const page = current?.cover ? editor : current?.page;
    const hit = at && page ? [...(page.layers || [])].reverse().find((l) => l.kind === "photo" && l.mediaRef && !l.drawing && Math.abs(at.x - Number(l.x)) <= (Number(l.w) * (Number(l.scale) || 1)) / 2 && Math.abs(at.y - Number(l.y)) <= ((Number(l.h) || 30) * (Number(l.scale) || 1)) / 2) : null;
    const choice = hit && storyPhotoChoices(current).find((c) => c.p.id === hit.id || c.p.mediaRef === hit.mediaRef);
    if (!choice) return openStoryText(storyLineTarget());
    story.panel = "photo";
    story.pick = { momentId: choice.m.id, layerId: choice.p.id };
    render();
    revealStoryPick();
    return;
  }
  if (actionName === "story-panel") {
    const next = target.dataset.panel || null;
    story.panel = story.panel === next ? null : next;
    render();
    if (story.panel === "photo") revealStoryPick();
    return;
  }
  if (actionName === "story-pick") {
    story.pick = { momentId: target.dataset.moment, layerId: target.dataset.layer };
    render();
    revealStoryPick();
    return;
  }
  if (actionName === "story-words-photo") {
    const pick = storyPicked(storyPages()[story.index]);
    return pick ? openStoryText({ momentId: pick.m.id, target: pick.p.id }) : openStoryText();
  }
  if (actionName === "story-replace") {
    const pick = storyPicked(storyPages()[story.index]);
    // On the day cover the choice is the cover's own (the Moment page keeps its photo).
    const onCover = storyPages()[story.index]?.cover;
    if (pick) openPhotoSource({ mode: "story", target: onCover ? { kind: "story-cover", momentId: pick.m.id } : { kind: "story-replace", momentId: pick.m.id, layerId: pick.p.id }, n: pick.n, ref: pick.p.mediaRef });
    return;
  }
  if (actionName === "story-cover-add") {
    storyAddCover();
    return render();
  }
  if (actionName === "story-cover-remove") {
    storyRemoveCover();
    return render();
  }
  if (actionName === "story-undo") {
    storyUndoReplace();
    render();
    return;
  }
  if (actionName === "story-layout") {
    const current = storyPages()[story.index];
    if (!current) return;
    const v = Number(target.dataset.variant) || 0;
    const page2 = current.cover ? editor : findMoment(editor, current.page.id);
    if (!page2) return;
    if (!page2.layoutEdited && (Number(page2.layoutVariant) || 0) % 3 === v) return;
    if (page2.layoutEdited && !(await askConfirm(t("story.relayoutConfirm")))) return;
    changeEditor((entry) => {
      const target2 = current.cover ? entry : findMoment(entry, current.page.id);
      if (target2) target2.layoutVariant = v;
    }, false);
    layoutStory({ which: [current.cover ? "cover" : current.page.id], force: true });
    flushDraft();
    if (quickSession) quickSession.shuffles++;
    logEvent("story_relayout", { style: story.style, variant: v, kind: target.dataset.kind || "" });
  }
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
    // V10.19: each photo's own words go with that photo (its media id — the
    // photo itself, not its time or its place in the row); the page's type
    // stays with the Moment of its first photo.
    const captions = new Map();
    const types = new Map();
    for (const momentId of story.made?.ids || []) {
      const m = findMoment(editor, momentId);
      for (const l of m?.layers || []) if (l.kind === "photo" && l.mediaRef && (l.caption || "").trim()) captions.set(l.mediaRef, l.caption);
      const first = (m?.layers || []).find((l) => l.kind === "photo" && l.mediaRef && !l.gen);
      if (m?.typeStyle && first) types.set(first.mediaRef, m.typeStyle);
    }
    story.groups = story.groups.map(({ keepLine, ...g }) => ({ ...g, line: keepLine || !g.items.length ? g.line || "" : lines.get(g.items[0]?.reference) || "", typeStyle: (keepLine && g.typeStyle) || types.get(g.items[0]?.reference) || g.typeStyle || null, items: g.items.map((item) => ({ ...item, caption: captions.get(item.reference) || "" })) }));
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
  if (actionName === "story-page") {
    story.index = Number(target.dataset.index) || 0;
    story.pick = null;
  }
  if (actionName === "story-text") return openStoryText(storyLineTarget());
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
// ---------- Journal Studio shell (V10.0 · Phase A) ----------
// Three states share one layout: the top bar (back · page name → pages ·
// save state · preview · done), the paper, undo / redo and the page switcher
// under it, and one row of tools at the bottom (photo · text · stickers ·
// more). Everything else opens in the bottom sheet.
let studioPreview = false;
const SV_ICONS = {
  backArrow: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  play: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.8v6.4l5.2-3.2z"/>',
  shape: '<rect x="3.5" y="9" width="10" height="10" rx="2"/><circle cx="15" cy="9" r="5.5"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3 3-2.5 5 4"/>',
  text: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
  stickers: '<path d="M5 4.5h14a.5.5 0 0 1 .5.5v9l-5.5 5.5H5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5Z"/><path d="M14 19.5V15a1 1 0 0 1 1-1h4.5"/><path d="M9 10.5c.8 1.2 1.8 1.8 3 1.8s2.2-.6 3-1.8"/>',
  more: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  paper: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9h16M4 14h16"/>',
  layout: '<rect x="4" y="4" width="7" height="9" rx="1.5"/><rect x="13" y="4" width="7" height="5" rx="1.5"/><rect x="13" y="11" width="7" height="9" rx="1.5"/><rect x="4" y="15" width="7" height="5" rx="1.5"/>',
  font: '<path d="M5 19 10.5 5h1L17 19M7.5 14h7"/><path d="M19.5 12v7"/>',
  video: '<rect x="3.5" y="6" width="12" height="12" rx="2.5"/><path d="m15.5 10.5 5-3v9l-5-3"/>',
  sound: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  mood: '<circle cx="12" cy="12" r="8"/><path d="M9 14.5c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5M9.5 10h.01M14.5 10h.01"/>',
  photos: '<rect x="3.5" y="7" width="13" height="11" rx="2"/><path d="M7 7V5.5a1 1 0 0 1 1-1h11.5a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1h-3"/>',
  media: '<path d="M5 9v6M9 6v12M13 9v6M17 4v16M21 10v4"/>',
  growth: '<path d="M12 21v-9"/><path d="M12 13c-1-4-4-6-8-6 0 4 3 6 8 6Z"/><path d="M12 11c1-4 4-6 8-6 0 4-3 6-8 6Z"/>',
  book: '<path d="M6 4.5h10.5A1.5 1.5 0 0 1 18 6v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/><path d="m9 10 2 2 4-4"/>',
  layer: '<path d="m12 4 8 4.5-8 4.5-8-4.5L12 4Z"/><path d="m4 13 8 4.5 8-4.5"/>',
  pages: '<rect x="4" y="5" width="9" height="12" rx="1.5"/><path d="M8 20h10a1.5 1.5 0 0 0 1.5-1.5V8"/>',
  details: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>',
  chapters: '<path d="M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01"/>',
  draw: '<path d="M4 20c2 0 3-1 3-3l9.5-9.5a2.1 2.1 0 0 1 3 3L10 20H4Z"/><path d="m14.5 9.5 3 3"/>',
  replace: '<path d="M4 9a8 8 0 0 1 14-3l2 2"/><path d="M20 4v4h-4"/><path d="M20 15a8 8 0 0 1-14 3l-2-2"/><path d="M4 20v-4h4"/>',
  crop: '<path d="M7 3v14h14"/><path d="M3 7h14v14"/>',
  adjust: '<path d="M5 7h8M17 7h2M5 17h2M11 17h8"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  pen: '<path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13 7 4 4"/>',
  color: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  align: '<path d="M4 6h16M4 10.5h10M4 15h16M4 19.5h10"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  guide: '<path d="M9.5 12V5.8a1.4 1.4 0 0 1 2.8 0V11"/><path d="M12.3 10.5V9.2a1.4 1.4 0 0 1 2.8 0v1.6"/><path d="M15.1 11v-.6a1.4 1.4 0 0 1 2.8 0V15a6 6 0 0 1-6 6h-.6a5 5 0 0 1-4-2l-2.6-3.6a1.4 1.4 0 0 1 2.2-1.8L9.5 15"/><path d="M6 6.5 4.5 5M6.5 3.5 6 2M9.5 2.5 10 1"/>',
};
const svIcon = (name) => `<svg class="sv-icon" viewBox="0 0 24 24" aria-hidden="true">${SV_ICONS[name] || SV_ICONS.more}</svg>`;
function studioTitleHTML() {
  const moments = editor.moments || [];
  const day = isDayPage();
  const current = activePage();
  const name = day ? t("day.cover") : current.title || studioDateLabel();
  const count = day ? t("studio.coverOf", { count: moments.length }) : t("studio.pageOf", { n: moments.indexOf(current) + 1, count: moments.length });
  return `<button class="sv-title" data-action="pages-manage" aria-label="${t("pages.title")}"><b data-studio-title>${esc(name)}</b><small>${esc(count)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></small></button>`;
}
function refreshStudioTitle() {
  const el = document.querySelector("[data-studio-title]");
  if (el && !isDayPage()) el.textContent = activePage().title || studioDateLabel();
}
// V10.27: a page without a title is named by its day in the editor's top bar
// ("11月12日"; the page number is right under it) — never "未命名的一页".
function studioDateLabel() {
  return new Date(`${editor?.date || dateKey()}T12:00:00`).toLocaleDateString(locale(), { month: "long", day: "numeric" });
}
function studioPage() {
  const dayPage = isDayPage();
  if (quickResultActive()) return quickResultHTML();
  const paper = `<div class="canvas-wrap ${dayPage ? "" : "moment-wrap"}" id="canvas-wrap">${canvasHTML()}</div>`;
  // Preview: the page as it will be kept, with sharing and export.
  if (studioPreview)
    return `<header class="studio-bar sv-top"><button class="studio-back" data-action="studio-preview" aria-label="${t("studio.previewBack")}">${icon("back")}</button><div class="sv-title static"><b>${t("studio.preview")}</b><small>${t("studio.previewHint")}</small></div><button class="primary" data-action="save-entry">${t("studio.done")}</button></header><div class="studio-stage large previewing">${paper}</div><div class="tool-dock-wrap"><nav class="sv-export" aria-label="${t("studio.preview")}"><button data-action="share-story"><span aria-hidden="true">⇪</span><b>${t("share.story")}</b></button><button data-action="export">${icon("download")}<b>${t("export.photo")}</b></button><button data-action="export-video"><span aria-hidden="true">▶</span><b>${t("export.video")}</b></button></nav></div>`;
  const status = draftDirty && draftState !== "failed" ? "saving" : draftState;
  return `<header class="studio-bar sv-top"><button class="studio-back" data-action="studio-back" aria-label="${t("studio.back")}">${icon("back")}</button><h1 class="visually-hidden">${t("studio.title")}</h1>${studioTitleHTML()}<button class="draft-status" id="draft-status" data-action="draft-retry" data-state="${status}" ${status === "failed" ? "" : "disabled"}>${draftStatusInner(status)}</button><button class="sv-preview" data-action="studio-preview" aria-label="${t("studio.preview")}">${svIcon("eye")}</button><button class="primary" data-action="save-entry">${t("studio.done")}</button></header><div class="studio-stage ${!studioTool ? "large" : STRIP_TOOLS.includes(studioTool) ? "large strip-open" : ""}">${paper}${importCardHTML()}${typeBarHTML()}<div class="stage-bar"><button data-action="undo" ${history.length ? "" : "disabled"} aria-label="${t("studio.undo")}">${icon("undo")}</button><button data-action="redo" ${future.length ? "" : "disabled"} aria-label="${t("studio.redo")}">${icon("redo")}</button>${chapterChipsHTML()}</div></div><div class="tool-dock-wrap" id="tool-menu">${toolMenuHTML()}</div>`;
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
  if (scopedPage === "reader" && page !== "reader") readerSeenKeys = "";
  scopedPage = ["studio", "day", "reader"].includes(page) ? page : null;
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
  // The reader is full-screen too: no bottom menu.
  $("#phone").classList.toggle("in-reader", signedIn && page === "reader");
  // The Studio shell sizes the paper from the room it really has.
  $("#phone").classList.toggle("sv", signedIn && page === "studio" && !quickResultActive());
  if (settingsSheet && page === "settings" && $("#choose-dialog").open && $("#choose-dialog .s2-sheet")) {
    const field = document.activeElement?.matches?.("[data-profile-name], [data-keeper-rename]") ? document.activeElement : null;
    if (!field) $("#choose-dialog .s2-sheet").innerHTML = `<div class="choose-grabber" aria-hidden="true"></div>${settingsSheetHTML(settingsSheet)}`;
  }
  $("#phone").style.setProperty("--studio-h", $("#app-scroll").clientHeight + "px");
  const dockScroll = $(".tool-dock")?.scrollLeft || 0;
  // V10.20: a sheet re-drawn for the same tool keeps its place; a different
  // tool always opens at its top (its main controls first, no scrolling).
  const sheetBefore = $(".tool-sheet");
  const sheetKeep = sheetBefore ? { id: sheetBefore.dataset.toolRow, top: sheetBefore.scrollTop } : null;
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
    reader: readerHTML,
    studio: studioPage,
    story: storyPage,
    day: () => dayDetailHTML(selectedDate, ctx(), { icon, friendlyDate }),
    journey: () =>
      habitJourneyHTML(journeyHabit, journeyPage, ctx(), journeyHelpers()),
    community: () =>
      communityHTML(social(), communityView, state(), ctx(), { icon }),
    settings: settingsPageHTML,
    inbox: () => inboxHTML(social(), inboxFilter, ctx(), { icon }),
    search: searchPageHTML,
  }[page]();
  navigation();
  applyShellLanguage();
  watchSaveButton();
  $("#app-scroll").scrollTop = scrollTop;
  const sheetNow = $(".tool-sheet");
  if (sheetNow) sheetNow.scrollTop = sheetKeep && sheetKeep.id === sheetNow.dataset.toolRow ? sheetKeep.top : 0;
  syncStripHeight();
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
  afterReaderRender();
  pinStageForSheet();
  placeLayerBar();
  if (page === "studio") maybeStartGuide();
  if (guideStep != null) placeGuide();
  else if (page !== "studio") hideDoubleTapTip();
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
  if (!labsOn()) return "";
  const s = streakNow();
  return `<button class="streak-chip ${s.today ? "done" : ""}" data-action="streak-open"><i class="streak-dot" aria-hidden="true"></i>${s.streak ? t("streak.chip", { count: s.streak, week: s.weekCount }) : t("streak.start")}</button>`;
}
function maybeCelebrate(anywhere = false) {
  // B4 (frozen for now): no streak stamp popping up on its own; with Labs on it works as before.
  if (!labsOn()) return;
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
    const title = el.textContent.replace(/\s+/g, " ").trim();
    // A3: nothing cut; an unchanged title is never rewritten (its line breaks stay).
    if (keep && title !== original.replace(/\s+/g, " ").trim()) {
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
  dialog.innerHTML = `<div class="choose-sheet page-menu-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t(isCover ? "day.cover" : "read.pageMenu")}</h2><button class="contribute-option" data-action="read-edit" data-date="${esc(date)}" data-moment="${esc(momentId)}"><b>✎ ${t("read.edit")}</b><small>${t("read.editHint")}</small></button>${isCover && isDayCover(dayOf(state(), date) || {}) ? `<button class="contribute-option" data-action="day-cover-toggle" data-date="${esc(date)}" data-hide="1"><b>${t("cover.hide")}</b><small>${t("cover.hideHint")}</small></button>` : ""}${isCover ? "" : `<button class="contribute-option" data-action="read-rename" data-date="${esc(date)}" data-moment="${esc(momentId)}"><b>Aa ${t("read.rename")}</b><small>${t("read.titleHint")}</small></button>`}<button class="contribute-option danger-option" data-action="read-delete" data-date="${esc(date)}" data-moment="${esc(momentId)}"><b>${t(isCover ? "write.clearDay" : "write.deleteStory")}</b><small>${t("read.deleteHint")}</small></button><button class="choose-cancel" data-action="choose-close">${t("cancel")}</button></div>`;
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
function openWhatsNew() {
  const en = languageCode() === "en";
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet news-sheet"><div class="choose-grabber" aria-hidden="true"></div><h2>${t("news.title")}</h2>${UPDATES.map((update) => {
    const note = noteFor(update, en ? "en" : "zh");
    // A few notes come with something to try (only actions known here).
    const tryIt = update.action === "rich-demo" && note.action ? `<button class="news-action" data-action="rich-demo">${esc(note.action)} ›</button>` : "";
    return `<section class="news-entry"><header><span class="news-version">V${esc(update.version)}</span><time>${esc(update.date)}</time></header><h3>${esc(note.title)}</h3><ul>${note.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>${tryIt}</section>`;
  }).join("")}<button class="primary full-width" data-action="choose-close">${t("news.ok")}</button></div>`;
  if (!dialog.open) dialog.showModal();
  markSeen();
}
// ---------- Settings V2 (V10.4): the last pages of the journal ----------
// A personal space, the Keeper, look & preferences, data & privacy, then
// about & more. Groups are titles, air and hairlines — no stack of cards.
// Every control keeps its old data-action; details open in a bottom sheet.
let settingsSheet = ""; // which detail sheet is open (re-drawn after a change)
// The default personal mark before a name is chosen: a small sprout in sage
// line art (the same sprout as on the Little Days wordmark). Not an emoji.
function settingsPageHTML() {
  const en = languageCode() === "en";
  const title = (key, aside = "") => `<div class="s2-h"><h2 class="${en ? "en" : "zh"}">${t(key)}</h2>${aside}</div>`;
  const toggle = (attrs, on, name, hint, disabled = false) => `<button class="privacy-row s2-toggle" ${attrs} role="switch" aria-checked="${Boolean(on)}" ${disabled ? "disabled" : ""}><span><b>${name}</b>${hint ? `<small>${hint}</small>` : ""}</span><i class="switch ${on ? "on" : ""}" aria-hidden="true"></i></button>`;
  const more = (attrs, name, value = "", dot = false) => `<button class="s2-more-row" ${attrs}><span><b>${name}</b>${dot ? '<i class="s2-dot" aria-hidden="true"></i>' : ""}</span><span class="v">${value}<i class="s2-chev" aria-hidden="true">›</i></span></button>`;
  // -- My Little Days: this device's own space (there is no cloud account).
  const name = String(account?.name || "").trim();
  // V10.16: the personal mark (js/profile-mark.mjs) — the sprout when nothing
  // was chosen, a monogram of the name, or an emoji chosen before (kept).
  const me = `<section class="s2-me account-card"><span class="s2-avatar pm-host">${profileMarkHTML(account?.avatar, name, 68)}</span><div><small class="s2-kicker">My Little Days</small><b class="s2-name ${/[㐀-鿿]/.test(name || (en ? "" : "名")) ? "zh" : ""}">${esc(name || t("s2.myWorld"))}</b><p>${t("s2.localSpace")}</p><button class="s2-link" data-action="settings-sheet" data-sheet="profile">${t(name ? "s2.editProfile" : "s2.nameWorld")} ›</button></div></section>`;
  // -- Little Keeper: a preview and the companion mode; the rest is in its sheet.
  const k = keeperNow();
  let keeper;
  if (!k.enabled) keeper = `<section class="s2-sec keeper-card">${title("s2.keeper")}<div class="s2-row"><span><b>${t("keeper.invite.title")}</b><small>${t("keeper.settings.offNote")}</small></span><button class="s2-link" data-action="keeper-onboard">${t("keeper.invite.yes")} ›</button></div></section>`;
  else {
    const g = keeperGrowth();
    keeper = `<section class="s2-sec keeper-card">${title("s2.keeper", `<small>${esc(t("keeper.settings.days", { count: g.reasons.days }))}</small>`)}<div class="s2-keeper">${keeperArt("idle")}<span><b>${esc(Keeper.keeperName(k, languageCode()))}</b><small>${esc(t("s2.keeperLine", { mode: t("keeper.mode." + k.mode), stage: t("keeper.stage." + g.id) }))}</small></span><span class="s2-keeper-links"><button class="s2-link" data-action="settings-sheet" data-sheet="keeper">${t("s2.keeperManage")} ›</button>${Keeper.modeAllows(k, "invite") ? `<button class="s2-link s2-play" data-action="keeper-panel">${esc(tk("s2.keeperPlay", k))} ›</button>` : ""}</span></div><div class="s2-seg" role="group" aria-label="${t("keeper.onboard.mode")}">${Keeper.MODES.map((m) => `<button data-action="keeper-set" data-key="mode" data-value="${m}" class="${k.mode === m ? "selected" : ""}" aria-pressed="${k.mode === m}">${t("keeper.mode." + m)}</button>`).join("")}<button data-action="keeper-disable" aria-pressed="false">${t("s2.keeperOff")}</button></div><p class="s2-hint keeper-mode-hint">${t("keeper.mode." + k.mode + "Hint")} ${t("s2.keeperWhere")}</p></section>`;
  }
  // -- Look & preferences.
  const current = loadTheme();
  const palette = `<div class="theme-grid s2-pal" role="group" aria-label="${t("theme.title")}">${(tokens.themes || []).map((theme) => `<button data-action="theme" data-theme-id="${esc(theme.id)}" class="theme-option ${theme.id === current ? "selected" : ""}" aria-pressed="${theme.id === current}"><span class="theme-swatch ${theme.mode === "dark" ? "dark" : ""}" aria-hidden="true">${(theme.swatch || []).map((color) => `<i style="background:${esc(color)}"></i>`).join("")}</span><b>${t("theme." + theme.id)}</b></button>`).join("")}</div>`;
  const language = languageCode() === "en" ? "en" : "zh-CN";
  const reminder = readReminder();
  const app = Boolean(reminderBridge());
  const look = `<section class="s2-sec theme-card">${title("s2.look")}<div class="s2-row stack"><span><b>${t("theme.title")}</b><small>${t("theme.note")}</small></span>${palette}</div><div class="s2-row"><span><b>${t("language")}</b><small>${t("settings.contentNote")}</small></span><div class="s2-seg s2-lang"><button data-action="language" data-language="zh-CN" class="${language === "zh-CN" ? "selected" : ""}" aria-pressed="${language === "zh-CN"}">中文</button><button data-action="language" data-language="en" class="${language === "en" ? "selected" : ""}" aria-pressed="${language === "en"}">English</button></div></div><div class="reminder-card">${toggle('data-action="reminder-toggle"', reminder.on && app, t("reminder.toggle"), app ? t("reminder.note") : t("reminder.appOnly"), !app)}${reminder.on && app ? `<label class="reminder-time s2-row">${t("reminder.at")}<input type="time" data-reminder-time value="${esc(reminder.time)}"></label>` : ""}${reminderNote ? `<p class="reminder-warn" role="status">${esc(reminderNote)}</p>` : ""}</div></section>`;
  // -- Data & privacy.
  const privacyRow = (id) => toggle(`data-action="privacy-toggle" data-privacy="${id}"`, privacyOn(id), t("privacy." + id), t("s2." + id + "Short"));
  // V10.10: backup first and easy to find; one short line each; the full
  // notes (what a backup holds, size limits) stay in 隐私说明.
  const data = `<section class="s2-sec privacy-card">${title("s2.data")}<div class="s2-row stack s2-backup"><span><b>${t("s2.backup")}</b><small>${t("s2.backupShort")}</small></span>${backupWhenHTML()}<div class="s2-btns"><button class="primary-outline" data-action="backup">${t("settings.backup")}</button><button data-action="restore-backup">${t("settings.restore")}</button></div><p id="media-usage" class="s2-usage" role="status"></p></div>${more('data-action="media-check"', t("check.title"), t("check.short"))}${lockRowsHTML()}${privacyRow("hideToday")}${privacyRow("shareList")}${toggle('data-action="keeper-toggle" data-key="aiConsent"', false, `${t("s2.ai")}<i class="s2-tag">${t("s2.aiNot")}</i>`, t("s2.aiShort"), true)}${more('data-action="settings-sheet" data-sheet="privacy"', t("s2.privacyNotes"))}</section>`;
  // -- About & more.
  const samples = state().entries.filter((e) => e.isDemo).length;
  const about = `<section class="s2-sec s2-about">${title("s2.about")}${more('data-action="whats-new"', t("news.title"), `V${esc(LATEST)}`, hasUnseen())}${more('data-action="tour-replay"', t("s2.tour"), t("s2.tourAgain"))}${more('data-action="settings-sheet" data-sheet="licenses"', t("settings.licenses"))}${samples ? more('data-action="settings-sheet" data-sheet="samples"', t("samples.title"), t("s2.sampleDays", { count: samples })) : ""}${more('data-action="settings-sheet" data-sheet="testlog"', t("testlog.title"))}${more('data-action="settings-sheet" data-sheet="labs"', t("labs.title"), t(labsOn() ? "s2.on" : "s2.off"))}${labsOn() && account ? more('data-action="sign-out"', t("s2.welcome"), t("s2.dataKept")) : ""}</section>`;
  return `<div class="s2"><div class="settings-nav s2-nav"><button class="back-button" data-action="settings-back">‹ ${t("settings.back")}</button><span>${t("s2.kicker")}</span><i aria-hidden="true"></i></div><h1 class="page-title visually-hidden">${t("settings.title")}</h1>${me}${keeper}${look}${data}${about}<p class="s2-foot">Little Days<small>V${esc(LATEST)} · ${t("settings.subtitle")}</small></p></div>`;
}
// One personal mark (Settings header, the editor, the welcome page).
function profileMarkHTML(avatar, name, size, label = "") {
  return PM.markHTML(PM.markOf(avatar, name, { language: languageCode() }), { size, label });
}
// The editor: a small name card that shows the result as it is typed, the
// name, and the marks — five monograms of the name's first letter and the
// sprout. An emoji chosen before V10.16 stays, offered as "现在的头像".
function profileSheetHTML(head) {
  const saved = account?.avatar || PM.UNSET;
  const legacy = !PM.isPickable(saved) && saved !== PM.UNSET && PM.markOf(saved, "").kind === "emoji" ? saved : "";
  const picked = profileDraft?.avatar ?? (saved === PM.UNSET ? PM.SPROUT : saved);
  const name = profileDraft?.name ?? account?.name ?? "";
  const choice = (value, label) =>
    `<button class="pf-choice" data-action="profile-avatar" data-avatar="${esc(value)}" aria-pressed="${picked === value}" aria-label="${esc(label)}">${profileMarkHTML(value, name, 48)}</button>`;
  const monos = PM.MONOGRAMS.map((value) => choice(value, t("pf.style." + value.slice(5)))).join("");
  // The sprout (the default) and an emoji chosen before: two small pills at the top.
  const pill = (value, label, cls) => `<button class="pf-choice pf-pill ${cls}" data-action="profile-avatar" data-avatar="${esc(value)}" aria-pressed="${picked === value}">${profileMarkHTML(value, name, 36)}<span>${label}</span></button>`;
  const pills = `<div class="pf-pills">${pill(PM.SPROUT, t("pf.sproutDefault"), "pf-sprout")}${legacy ? pill(legacy, t("pf.current"), "pf-legacy") : ""}</div>`;
  const card = `<div class="pf-card" aria-hidden="true"><i class="pf-tape"></i><span class="pf-card-mark">${profileMarkHTML(picked, name, 64)}</span><span class="pf-card-copy"><small>My Little Days</small><b class="pf-card-name ${name.trim() ? "" : "empty"} ${/[\u3400-\u9fff]/.test(name || (languageCode() === "en" ? "" : "名")) ? "zh" : ""}">${esc(name.trim() || t("s2.myWorld"))}</b><i class="pf-rule"></i></span></div>`;
  return `${head("pf.title")}${card}<p class="pf-sub">${t("pf.sub")}</p><label class="s2-field pf-name">${t("pf.nameLabel")}<input data-profile-name maxlength="30" value="${esc(name)}" placeholder="${esc(t("pf.namePlaceholder"))}" autocomplete="nickname"></label><div class="pf-marks"><p class="s2-field-label">${t("pf.marks")}</p>${pills}<p class="pf-group-label">${t("pf.monograms")}</p><div class="pf-row" role="group" aria-label="${t("pf.monograms")}">${monos}</div></div><div class="pf-foot"><p class="s2-hint">${t("pf.local")}</p><button class="kp-main" data-action="profile-save">${t("s2.save")}</button></div>`;
}
// The detail sheets: profile, Keeper details, privacy notes, licences, samples, test log, labs.
function settingsSheetHTML(kind) {
  const head = (key) => `<div class="kp-title"><span></span><b>${t(key)}</b><button class="kp-x" data-action="choose-close" aria-label="${t("close")}">×</button></div>`;
  if (kind === "profile") return profileSheetHTML(head);
  if (kind === "keeper") {
    const k = keeperNow();
    if (!k.enabled) return `${head("s2.keeperManage")}<p class="s2-hint">${t("keeper.settings.offNote")}</p>`;
    const g = keeperGrowth();
    const config = Keeper.keeperConfig(features);
    const leaves = config.stages.map((_, i) => `<i class="${i <= g.index ? "on" : ""}"></i>`).join("");
    const row = (key, on, hint, enabled = true) => `<button class="privacy-row s2-toggle" data-action="keeper-toggle" data-key="${key}" role="switch" aria-checked="${on}" ${enabled ? "" : "disabled"}><span><b>${t("keeper.settings." + key)}</b><small>${hint}</small></span><i class="switch ${on ? "on" : ""}" aria-hidden="true"></i></button>`;
    const quiet = k.mode === "quiet", interactive = k.mode === "interactive";
    return `${head("s2.keeperManage")}<div class="keeper-profile">${keeperArt("idle")}<span><b>${esc(Keeper.keeperName(k, languageCode()))}</b><small>${esc(t("keeper.stage." + g.id))} · ${esc(t("keeper.settings.days", { count: g.reasons.days }))}</small><span class="keeper-leaves" aria-hidden="true">${leaves}</span></span></div>${keeperLooksHTML()}<label class="s2-field keeper-name-edit">${t("keeper.onboard.name")}<input data-keeper-rename maxlength="12" value="${esc(k.name)}" placeholder="${esc(Keeper.defaultName(k.animal, languageCode()))}"></label>${row("allowMemories", k.allowMemories, quiet ? t("s2.notInQuiet") : t("keeper.settings.allowMemoriesHint"), !quiet)}${row("proactive", k.proactive, interactive ? t("keeper.settings.proactiveHint") : t("keeper.settings.interactiveOnly"), interactive)}<p class="s2-hint">${t("keeper.settings.growthNote")}</p><button class="kp-quiet keeper-off" data-action="keeper-disable">${t("keeper.settings.turnOff")}</button><p class="s2-hint">${t("keeper.settings.offKeeps")}</p>`;
  }
  if (kind === "privacy") return `${head("s2.privacyNotes")}<ul class="privacy-facts"><li>${t("privacy.factDevice")}</li><li>${t("privacy.factPhotos")}</li><li>${t("privacy.factNothingSent")}</li><li>${t("privacy.factDemo")}</li><li>${t("settings.backupNote")}</li><li>${t("privacy.hideTodayHint")}</li><li>${t("privacy.shareListHint")}</li><li>${t("s2.aiNote")}</li></ul>`;
  if (kind === "licenses") return `${head("settings.licenses")}<p class="s2-hint">${t("settings.licensesNote")}</p><p class="s2-hint">${t("settings.systemFonts")}</p><div class="s2-links">${catalog.fonts.map((font) => `<a href="library/fonts/${font.license}" target="_blank" rel="noopener">${esc(font.name)} · SIL OFL 1.1 ↗</a>`).join("")}<a href="library/stickers/LittleDays-Original-Assets.txt" target="_blank" rel="noopener">Little Days Original Artwork ↗</a></div>`;
  if (kind === "samples") {
    // V10.41 (D2): samples stay in storage but out of books, Calendar and
    // reading; they are looked at only here, each day marked 示例.
    const days = state().entries.filter((e) => isSampleDay(e)).sort((a, b) => b.date.localeCompare(a.date));
    const samples = days.length;
    const list = days
      .map((e) => {
        const first = [e, ...(e.moments || [])].find((p) => (p.title || "").trim());
        return `<button class="samples-day" data-action="open-day" data-date="${esc(e.date)}"><span class="badge">${t("entry.sample")}</span><b>${esc(friendlyDate(e.date))}</b><small>${esc(first?.title || "")}</small><i aria-hidden="true">›</i></button>`;
      })
      .join("");
    return `${head("samples.title")}<div class="samples-card"><p class="s2-hint">${t(samples ? "samples.noteKept" : "samples.none", { count: samples })}</p>${samples ? `<h3 class="samples-h">${t("samples.view")}</h3><div class="samples-list">${list}</div><button class="kp-quiet" data-action="samples-remove">${t("samples.remove")}</button>` : ""}</div>`;
  }
  if (kind === "testlog") return `${head("testlog.title")}<div class="test-log"><p class="s2-hint">${t("testlog.note")}</p><button class="kp-main" data-action="export-events">${t("testlog.export")}</button></div>`;
  if (kind === "labs") {
    const on = labsOn();
    return `${head("labs.title")}<div class="labs-card"><p class="s2-hint">${t("labs.note")}</p><button class="kp-main" data-action="labs-toggle" aria-pressed="${on}">${t(on ? "labs.turnOff" : "labs.turnOn")}</button></div>`;
  }
  return "";
}
let profileDraft = null; // name / avatar being edited in the profile sheet
document.addEventListener("input", (event) => {
  if (!event.target.matches?.("[data-profile-name]")) return;
  const name = event.target.value;
  const card = $("#choose-dialog .pf-card-name");
  if (card) {
    card.textContent = name.trim() || t("s2.myWorld");
    card.classList.toggle("empty", !name.trim());
    card.classList.toggle("zh", /[\u3400-\u9fff]/.test(name || (languageCode() === "en" ? "" : "名")));
  }
  const letter = PM.initialOf(name);
  document.querySelectorAll("#choose-dialog .pmark .pm-letter").forEach((el) => {
    el.textContent = letter || (languageCode() === "en" ? "A" : "名");
    const mark = el.parentElement;
    mark.classList.toggle("pm-sample", !letter);
    mark.classList.toggle("pm-wide", /[\u2e80-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/.test(el.textContent));
  });
});
function openSettingsSheet(kind) {
  const body = settingsSheetHTML(kind);
  if (!body) return;
  settingsSheet = kind;
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet kp s2-sheet" data-sheet="${esc(kind)}"><div class="choose-grabber" aria-hidden="true"></div>${body}</div>`;
  if (!dialog.open) dialog.showModal();
}
// The sheet closes (button, backdrop or Esc): forget which one it was.
document.addEventListener(
  "close",
  (event) => {
    if (event.target?.id === "choose-dialog") {
      settingsSheet = "";
      profileDraft = null;
    }
  },
  true,
);

/* ---------- Sign in (this device) and the welcome tour ---------- */

// The sprout beside the Little Days wordmark (Home, the welcome page).
const BRAND_SPROUT = '<svg class="brand-sprout" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22v-9"/><path d="M12 13c-1-4-4-6-8-6 0 4 3 6 8 6Z"/><path d="M12 11c1-4 4-6 8-6 0 4-3 6-8 6Z"/></svg>';
function loginHTML() {
  // V10.16: the same profile record as Settings; no picker here (the mark is
  // chosen in Settings → 编辑资料). Shows the mark there is now.
  const back = account && !account.signedIn;
  return `<section class="login"><div class="login-brand"><img class="login-icon" src="icons/icon-192.png" alt="" width="88" height="88"><h1 class="brand-title login-title">Little Days${BRAND_SPROUT}</h1></div><p class="login-tag">${t("login.tagline")}</p>${back ? `<p class="login-back">${t("login.welcomeBack", { name: account.name || t("community.me") })}</p>` : ""}<div class="login-form"><div class="login-me">${profileMarkHTML(account?.avatar, account?.name || "", 56)}<small>${t("login.markLater")}</small></div><label class="field">${t("login.name")}<input id="login-name" maxlength="30" autocomplete="nickname" value="${esc(account?.name || "")}" placeholder="${t("login.namePlaceholder")}"></label><button class="primary full-width" data-action="login-local">${t(back ? "login.continue" : "login.start")}</button></div><div class="login-labs" role="group" aria-label="${t("login.labsOnly")}"><span class="login-labs-tag">${t("login.labsOnly")}</span><button class="login-provider" disabled> ${t("login.apple")}<small>${t("login.soon")}</small></button><button class="login-provider" disabled>✉︎ ${t("login.email")}<small>${t("login.soon")}</small></button></div><p class="login-note">🔒 ${t("login.note")}</p><div class="login-language"><button data-action="login-language" data-language="zh-CN" class="${languageCode() === "en" ? "" : "selected"}">中文</button><button data-action="login-language" data-language="en" class="${languageCode() === "en" ? "selected" : ""}">English</button></div></section>`;
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
// ---------- Journal Studio · the three-step guide (V10.12) ----------
// A small card and a ring around the real thing on the paper: 1 move,
// 2 double-tap to type, 3 the handles. It never blocks the paper (only the
// card takes taps), never changes the page, can be skipped, and opens by
// itself once — for someone new (js/studio-guide.mjs). 更多 → 操作指南 opens it
// again. A one-time "双击即可编辑" tip points at the first text box selected.
let guideStep = null; // 0, 1, 2 while open
let guideAutoChecked = false;
let guideTipTimer = null;
function guideTarget() {
  const step = Guide.STEPS[guideStep];
  return Guide.stepTarget(step, activePage()?.layers || [], selectedLayer);
}
function guideTargetEl(target) {
  if (target.kind === "layer") return layerElement(target.id);
  if (target.kind === "addText") return document.querySelector('.tool-dock [data-action="add-text-layer"]') || $("#journal-canvas");
  if (target.kind === "dock") return document.querySelector(".tool-dock.sv-tools:not(.ctx)") || document.querySelector(".tool-dock") || $("#journal-canvas");
  if (target.kind === "more") return document.querySelector('.tool-dock [data-tool="more"]') || $("#journal-canvas");
  return $("#journal-canvas");
}
function guideDemoHTML(id) {
  // Little drawings of the real gestures (the handles look like the real ones).
  if (id === "move") return `<span class="sg-demo-box"></span><i class="sg-demo-finger"></i>`;
  if (id === "type") return `<span class="sg-demo-words">Aa<i class="sg-demo-caret"></i></span><i class="sg-demo-finger tap2"></i>`;
  if (id === "add") return `<span class="sg-demo-words">＋</span>`;
  if (id === "more") return `<span class="sg-demo-words">•••</span>`;
  return `<span class="sg-demo-box framed"><i class="sg-demo-stem"></i><i class="sg-demo-rotate"></i><i class="sg-demo-size"></i></span>`;
}
function openGuide() {
  if (page !== "studio" || quickResultActive()) return;
  hideDoubleTapTip();
  if (document.activeElement?.matches?.(TYPING_FIELD)) document.activeElement.blur();
  guideStep = 0;
  logEvent("studio_guide_open", {});
  placeGuide();
}
function closeGuide(outcome) {
  if (guideStep == null) return;
  Guide.finishTour(outcome);
  logEvent("studio_guide_" + (outcome === "done" ? "done" : "skip"), { step: guideStep + 1 });
  guideStep = null;
  clearInterval(guideFollow);
  $("#studio-guide")?.remove();
}
function placeGuide() {
  const open = guideStep != null;
  if (open && (page !== "studio" || studioPreview || quickResultActive())) {
    // Leaving the editor mid-way counts as skipping (it will not reopen by itself).
    closeGuide("skipped");
    return;
  }
  if (!open) return;
  const step = Guide.STEPS[guideStep];
  const target = guideTarget();
  const copy = Guide.stepCopy(step, target);
  const last = guideStep === Guide.STEPS.length - 1;
  let box = $("#studio-guide");
  if (!box) {
    box = document.createElement("div");
    box.id = "studio-guide";
    box.className = "sg";
    $("#phone").append(box);
  }
  box.dataset.step = step.id;
  box.innerHTML = `<div class="sg-ring" aria-hidden="true"></div><section class="sg-card" role="dialog" aria-modal="false" aria-labelledby="sg-title" aria-describedby="sg-body"><div class="sg-head"><span class="sg-count">${t("guide.count", { n: guideStep + 1, count: Guide.STEPS.length })}</span><button type="button" class="sg-skip" data-action="guide-skip">${t("guide.skip")}</button></div><div class="sg-row"><div class="sg-demo ${step.id}" aria-hidden="true">${guideDemoHTML(step.id)}</div><div class="sg-copy"><b id="sg-title">${t(copy.title)}</b><p id="sg-body">${t(copy.body)}</p></div></div><div class="sg-actions"><span class="sg-dots" aria-hidden="true">${Guide.STEPS.map((_, i) => `<i class="${i === guideStep ? "on" : ""}"></i>`).join("")}</span>${guideStep ? `<button type="button" class="secondary" data-action="guide-prev">${t("guide.prev")}</button>` : ""}<button type="button" class="primary" data-action="guide-next">${t(last ? "guide.done" : "guide.next")}</button></div></section>`;
  positionGuide();
  const card = box.querySelector(".sg-card");
  if (!box.contains(document.activeElement)) card.querySelector('[data-action="guide-next"]')?.focus({ preventScroll: true });
  // The page can still settle after the guide opens (in the iPhone shell the
  // paper moved ~35 px once the safe area and the sticky stage applied), so
  // the ring follows its target while the guide is open.
  clearInterval(guideFollow);
  guideFollow = setInterval(() => (guideStep == null ? clearInterval(guideFollow) : positionGuide()), 250);
}
let guideFollow = null;
// The ring goes around the real item; the card sits on the other half of the
// screen so it never covers what it points at. Measured from the guide layer
// itself (its containing block).
function positionGuide() {
  const box = $("#studio-guide");
  if (!box || guideStep == null) return;
  const target = guideTarget();
  const phone = box.getBoundingClientRect();
  const el = guideTargetEl(target);
  const ring = box.querySelector(".sg-ring");
  const card = box.querySelector(".sg-card");
  if (el) {
    const r = el.getBoundingClientRect();
    const pad = target.kind === "paper" ? 4 : 8;
    Object.assign(ring.style, { left: `${r.left - phone.left - pad}px`, top: `${r.top - phone.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    ring.classList.toggle("round", target.kind === "addText");
    ring.hidden = false;
    const middle = r.top + r.height / 2 - phone.top;
    const below = target.kind === "paper" || middle < phone.height * 0.5;
    card.classList.toggle("at-bottom", below);
    card.classList.toggle("at-top", !below);
    // Pointing at the whole paper: the card sits over the tool row, not on the paper.
    card.classList.toggle("over-dock", target.kind === "paper");
  } else ring.hidden = true;
}
function guideAction(name) {
  if (name === "guide-open") {
    if (studioTool === "more") studioTool = null;
    render();
    openGuide();
    return true;
  }
  if (guideStep == null) return name.startsWith("guide-");
  if (name === "guide-skip") closeGuide("skipped");
  else if (name === "guide-prev") {
    guideStep = Math.max(0, guideStep - 1);
    placeGuide();
  } else if (name === "guide-next") {
    if (guideStep >= Guide.STEPS.length - 1) closeGuide("done");
    else {
      guideStep += 1;
      placeGuide();
    }
  } else return false;
  return true;
}
// The first time someone opens the editor (and has no pages of their own).
function maybeStartGuide() {
  if (guideAutoChecked || page !== "studio" || quickResultActive() || studioPreview) return;
  guideAutoChecked = true;
  if (!Guide.shouldAutoStart(Guide.loadGuide(), state())) return;
  setTimeout(() => {
    if (page === "studio" && guideStep == null && !$("#choose-dialog")?.open && !$("#photo-editor")?.open) openGuide();
  }, 500);
}
function noteGuide(tip) {
  Guide.markTip(tip);
  hideDoubleTapTip();
}
function hideDoubleTapTip() {
  clearTimeout(guideTipTimer);
  guideTipTimer = null;
  $("#dbl-tip")?.remove();
}
// The first text box someone selects: a small "双击即可编辑" pointing at it.
// (Waits a moment: the first tap of a double tap must not flash it.)
function showDoubleTapTip(layer) {
  if (guideStep != null || Guide.tipSeen(Guide.loadGuide(), "dblTap")) return;
  clearTimeout(guideTipTimer);
  guideTipTimer = setTimeout(() => {
    if (page !== "studio" || selectedLayer !== layer.id || layerElement(layer.id)?.classList.contains("editing")) return;
    const el = layerElement(layer.id);
    if (!el) return;
    Guide.markTip("dblTap");
    const r = el.getBoundingClientRect();
    const tip = document.createElement("div");
    tip.id = "dbl-tip";
    tip.className = "dbl-tip";
    tip.setAttribute("role", "status");
    tip.textContent = t("guide.tip.dblTap");
    $("#phone").append(tip);
    // Measured from the tip's own containing block (see placeGuide).
    const phone = (tip.offsetParent || $("#phone")).getBoundingClientRect();
    // Under the box (the ↻ handle is above it), or above when there is no room.
    const room = phone.bottom - r.bottom;
    const below = room > 120;
    tip.classList.toggle("above", !below);
    tip.style.left = `${Math.max(12, Math.min(phone.width - 12 - tip.offsetWidth, r.left - phone.left + r.width / 2 - tip.offsetWidth / 2))}px`;
    tip.style.top = below ? `${r.bottom - phone.top + 22}px` : `${r.top - phone.top - tip.offsetHeight - 46}px`;
    tip.style.setProperty("--arrow-x", `${r.left - phone.left + r.width / 2 - parseFloat(tip.style.left)}px`);
    guideTipTimer = setTimeout(hideDoubleTapTip, 4200);
  }, DOUBLE_TAP_MS + 60);
}
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest?.("#dbl-tip")) hideDoubleTapTip();
}, true);
window.addEventListener("resize", () => {
  placeLayerBar();
  if (guideStep != null) placeGuide();
});
function accountAction(target) {
  const name = target.dataset.action;
  switch (name) {
    case "login-language":
      setLanguage(target.dataset.language);
      document.documentElement.lang = languageCode();
      render();
      return true;
    case "login-local": {
      const firstTime = !account;
      account = Account.signIn(localStorage, { name: $("#login-name")?.value || "", avatar: account?.avatar });
      // The demo profile starts with the same name (and an emoji avatar, if the
      // account has one — the demo keeps its own emoji set).
      const demo = social();
      if (!demo.profile.name) {
        Community.updateProfile(demo, { name: account.name, ...(Community.AVATARS.includes(account.avatar) ? { avatar: account.avatar } : {}) });
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
    case "guide-open":
    case "guide-skip":
    case "guide-prev":
    case "guide-next":
      return guideAction(name);
    case "media-check":
      openMediaCheck();
      return true;
    case "media-check-copy":
      copyMediaCheck();
      return true;
    case "settings-sheet":
      profileDraft = null;
      openSettingsSheet(target.dataset.sheet);
      return true;
    case "profile-avatar": {
      profileDraft = { name: $("[data-profile-name]")?.value ?? account?.name ?? "", avatar: target.dataset.avatar || PM.SPROUT };
      const scroll = $("#choose-dialog .s2-sheet")?.scrollTop || 0;
      openSettingsSheet("profile");
      const sheet = $("#choose-dialog .s2-sheet");
      if (sheet) sheet.scrollTop = scroll;
      return true;
    }
    case "profile-save": {
      // Only this device's record changes (name, avatar); journals are untouched.
      const name = ($("[data-profile-name]")?.value ?? "").trim().slice(0, 30);
      const avatar = profileDraft ? profileDraft.avatar : account?.avatar || PM.UNSET;
      try {
        account = Account.signIn(localStorage, { name, avatar });
      } catch {
        // Storage full or blocked: the sheet stays as it is; nothing is lost.
        toast(t("pf.saveFailed"));
        return true;
      }
      profileDraft = null;
      $("#choose-dialog").close();
      render();
      toast(t("s2.profileSaved"));
      return true;
    }
    case "tour-replay":
      if ($("#choose-dialog").open) $("#choose-dialog").close();
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
    case "studio-back": {
      // Leaving the editor (never asked when switching pages, selecting
      // words or opening a tool — only here).
      try {
        draftDirty = draftDirty || draftState === "failed";
        flushDraft();
      } catch {
        // The changes could not be stored: stay, unless the user chooses to go.
        setDraftState("failed");
        askConfirm(t("studio.leaveUnsaved")).then((ok) => ok && leaveStudio());
        return true;
      }
      // Back to the story being put together (it has its own finishing step): no question here.
      if (readReturn?.page === "story" && story) {
        leaveStudio();
        return true;
      }
      // A finished record that was only looked at: just go.
      // Nothing written on a new record: go, and leave no empty draft behind.
      const kept = state().entries.some((entry) => entry.date === editor.date && !entry.isDemo);
      if (editorHasNothing() && !kept) {
        if (state().drafts[editor.date]) {
          try {
            store.update((s) => void delete s.drafts[editor.date]);
          } catch {}
        }
        draftDirty = false;
        leaveStudio();
      } else if (editorStatus() === "completed" && !studioTouched) leaveStudio();
      else openExitSheet();
      return true;
    }
    case "studio-draft-exit": {
      // 保存草稿: the whole record (cover + every page) is kept as it is and
      // marked Draft; then the editor closes. A failed save never leaves.
      if ($("#choose-dialog")?.open) $("#choose-dialog").close();
      clearTimeout(draftTimer);
      setDraftState("saving");
      try {
        store.update((s) => saveEntry(s, editor, "draft"));
      } catch (error) {
        setDraftState("failed");
        toast(t(error?.code === "stale-state" ? "error.conflict" : "exit.draftFailed"));
        return true;
      }
      draftDirty = false;
      setDraftState("saved");
      rememberDraftPage();
      logEvent("draft_kept", { pages: editor.moments.length });
      toast(t("exit.draftKept"));
      leaveStudio();
      return true;
    }
    case "draft-continue": {
      // Back into a draft where it was left: the same page of the same record.
      const date = target.dataset.date;
      const from = { page, book: selectedBook, date: selectedDate };
      openStudio(date);
      const last = draftPageFor(date);
      selectMoment(last && editor.moments.some((moment) => moment.id === last) ? last : activeMomentId);
      if (from.page === "day" || from.page === "books") readReturn = { ...from, moment: "", date: from.page === "day" ? date : from.date };
      return true;
    }
    case "settings-back":
      navigate(settingsReturn && settingsReturn !== "settings" ? settingsReturn : "home");
      return true;
    case "sign-out":
      askConfirm(t("login.signOutConfirm")).then((ok) => {
        if (!ok) return;
        flushDraft();
        account = Account.signOut(localStorage);
        page = "home";
        render();
      });
      return true;
  }
  return false;
}

function leaveStudio() {
  studioPreview = false;
  if (readReturn) returnToReading();
  else navigate(studioReturn && !["studio", "settings"].includes(studioReturn) ? studioReturn : "home");
}
// The question asked on the way out. Closing it (继续编辑, ×, pulling it
// down) changes nothing: the paper, the selected item and the caret stay.
function openExitSheet() {
  const status = editorStatus();
  const pages = (hasDayPageContent(editor) ? 1 : 0) + editor.moments.length;
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet kp exit-sheet" data-status="${status}"><div class="choose-grabber" aria-hidden="true"></div><div class="kp-title"><span></span><b>${t("exit.title")}</b><button class="kp-x" data-action="choose-close" aria-label="${t("exit.keepEditing")}">×</button></div><p class="exit-note">${t(status === "completed" ? "exit.noteCompleted" : "exit.note", { count: pages })}</p><button class="exit-choice primary" data-action="save-entry"><b>${t("exit.complete")}</b><small>${t("exit.completeHint")}</small></button><button class="exit-choice" data-action="studio-draft-exit"><b>${t("exit.draft")}</b><small>${t("exit.draftHint")}</small></button><button class="exit-stay" data-action="choose-close">${t("exit.keepEditing")}</button></div>`;
  if (!dialog.open) dialog.showModal();
}
// V10.22 · 检查照片和视频: a read-only check (nothing is written, converted,
// deleted or sent). The report has no names or words, so it can be copied.
let mediaCheckReport = "";
async function openMediaCheck() {
  const dialog = $("#choose-dialog");
  dialog.innerHTML = `<div class="choose-sheet kp media-check" role="document"><div class="choose-grabber" aria-hidden="true"></div><div class="kp-title"><span></span><b>${t("check.title")}</b><button class="kp-x" data-action="choose-close" aria-label="${t("close")}">×</button></div><p class="check-note">${t("check.hint")}</p><div class="check-body" aria-live="polite"><p class="check-running">${t("check.running")}</p></div></div>`;
  if (!dialog.open) dialog.showModal();
  const body = dialog.querySelector(".check-body");
  let env, result;
  try {
    env = await MediaCheck.environment();
    result = await MediaCheck.inspectMedia(media, state());
  } catch (error) {
    body.innerHTML = `<p class="check-bad">${t("check.failed")} · ${esc(String(error?.name || error))}</p>`;
    return;
  }
  const events = readEvents().filter((e) => MediaCheck.MEDIA_EVENTS.test(e.e)).slice(-40);
  mediaCheckReport = MediaCheck.reportText({ env, result, events, version: UPDATES[0].version });
  if (!body.isConnected) return;
  const row = (label, value, bad = false) => `<div class="check-row${bad ? " bad" : ""}"><span>${label}</span><b>${esc(String(value))}</b></div>`;
  const yesNo = (v) => (v == null ? "?" : t(v ? "check.yes" : "check.no"));
  const mb = (n) => (n == null ? "?" : `${(n / 1024 / 1024).toFixed(1)} MB`);
  const envHTML = `<h3>${t("check.env")}</h3>${row(t("check.browser"), `${env.browser} · ${env.engine} · ${env.platform}`)}${row(t("check.address"), env.address)}${row(t("check.embedded"), env.embedded ? `${t("check.yes")}${env.parent ? " · " + env.parent : ""}` : t("check.no"))}${row(t("check.persisted"), yesNo(env.persisted), env.persisted === false)}${row(t("check.space"), `${mb(env.usage)} / ${mb(env.quota)}`)}${row("IndexedDB · localStorage", `${env.idb} · ${env.localStorage}`, env.idb !== "ok" || env.localStorage !== "ok")}`;
  const counts = result.counts;
  const problems = result.items.filter((i) => i.status !== "ok");
  const mediaHTML = `<h3>${t("check.media")}</h3>${result.referenced || problems.length ? `${row(t("check.used"), result.referenced)}${row(t("check.stored"), result.stored)}${MediaCheck.STATUSES.map((s) => row(t("check.s." + s), counts[s], s !== "ok" && s !== "unchecked" && counts[s] > 0)).join("")}${result.legacy ? row(t("check.legacy"), result.legacy) : ""}${result.unused ? row(t("check.unused"), result.unused) : ""}` : `<p class="check-note">${t("check.none")}</p>`}${problems.length ? `<ul class="check-list">${problems.slice(0, 60).map((i) => `<li><b>${t("check.s." + i.status)}</b> · ${t(i.kind === "video" ? "media.kindVideo" : i.kind === "audio" || i.kind === "clip" ? "check.clip" : "check.photo")} · ${esc(i.date || "")}${i.page ? " · " + t("check.page", { n: i.page }) : ""}${i.draft ? " · " + t("check.draft") : ""}${i.err ? ` · <code>${esc(i.err)}</code>` : ""}</li>`).join("")}</ul>` : ""}`;
  const eventsHTML = `<h3>${t("check.events")}</h3>${events.length ? `<ul class="check-list">${events.slice(-12).reverse().map((e) => `<li>${esc(new Date(e.t).toLocaleString(locale(), { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }))} · ${t("check.e." + e.e) || esc(e.e)}${e.kind ? " · " + esc(e.kind) : ""}${e.stage ? " · " + esc(e.stage) : ""}${e.err ? ` · <code>${esc(e.err)}</code>` : ""}</li>`).join("")}</ul>` : `<p class="check-note">${t("check.noEvents")}</p>`}`;
  body.innerHTML = `${mediaHTML}${envHTML}${eventsHTML}<button class="primary full-width" data-action="media-check-copy">${t("check.copy")}</button><textarea class="check-text" readonly aria-label="${t("check.copy")}" hidden></textarea>`;
  logEvent("media_check", { count: problems.length });
}
async function copyMediaCheck() {
  const area = $("#choose-dialog .check-text");
  try {
    await navigator.clipboard.writeText(mediaCheckReport);
    toast(t("check.copied"));
  } catch {
    // Some web views refuse the clipboard: show the text to select instead.
    if (area) {
      area.hidden = false;
      area.value = mediaCheckReport;
      area.focus();
      area.select();
    }
    toast(t("check.selectToCopy"));
  }
}
// Which page of a draft was open when it was put away (this device only).
const DRAFT_PAGE_KEY = "little-days.draft-page";
function rememberDraftPage() {
  try {
    localStorage.setItem(DRAFT_PAGE_KEY, JSON.stringify({ date: editor.date, moment: activeMomentId || "" }));
  } catch {}
}
function draftPageFor(date) {
  try {
    const last = JSON.parse(localStorage.getItem(DRAFT_PAGE_KEY));
    return last?.date === date ? last.moment || null : null;
  } catch {
    return null;
  }
}
// A quiet tag for a day still being made (lists, cards, the page reader).
function draftTagHTML(date) {
  return entryStatus(state(), date) === "draft" ? `<span class="draft-tag">${t("status.draft")}</span>` : "";
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
  // A tile in More that starts something (video, drawing, pages…) closes the sheet.
  if (page === "studio" && studioTool === "more" && target.closest?.(".more-grid") && !["tool", "add-sound"].includes(actionName)) {
    studioTool = null;
    soundMenu = false;
    render();
  }
  if (accountAction(target)) return;
  if (photoSourceAction(actionName, target)) return;
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
    toast(t(mediaImport && busyMedia ? "import.busy" : "media.busy"));
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
  // V10.27: a page in the day's list opens the reader at that page (its own
  // journal); a page that is only a draft is not in the reader yet, so the
  // list scrolls to it on the day page instead.
  if (actionName === "read-page") {
    const entry = state().entries.find((item) => item.date === target.dataset.date && item.moments?.some((m) => m.id === target.dataset.moment));
    const moment = entry?.moments.find((m) => m.id === target.dataset.moment);
    const bookId = moment ? moment.bookId || entry.bookId : "";
    if (bookId && flipPages(bookId).some((p) => p.date === entry.date && p.moment?.id === moment.id)) return openReader(bookId, `${entry.date}|${moment.id}`);
    document.getElementById(`moment-${target.dataset.moment}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    return;
  }
  if (actionName === "jump-moment")
    document
      .getElementById(`moment-${target.dataset.moment}`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  // In the reader one tap turns / shows the controls; a photo opens on a double tap there.
  if (actionName === "zoom-photo" && !(page === "reader" && target.closest("[data-reader-stage]"))) openLightbox(target.dataset.src);
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
  if (actionName === "flip") turnPage(Number(target.dataset.dir) || 0);
  if (actionName === "reader-open") {
    const bookId = target.dataset.book || selectedBook;
    const pages = flipPages(bookId);
    // A page of a day (the row under a day with several pages): that page.
    if (target.dataset.key) return openReader(bookId, target.dataset.key);
    if (target.dataset.date) {
      const first = pages.find((p) => p.date === target.dataset.date);
      return openReader(bookId, first ? Reader.keyOf(first) : Reader.COVER);
    }
    return openReader(bookId, target.dataset.at === "cover" ? Reader.COVER : "resume");
  }
  if (actionName === "reader-back") return closeReader();
  if (actionName === "reader-thumbs") return openReaderThumbs();
  if (actionName === "reader-more") return openReaderMore();
  if (actionName === "reader-full") return openReaderFullText();
  if (actionName === "reader-go") {
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    return goToPosition(Math.max(0, Math.min(readerPages().length, Number(target.dataset.at) || 0)));
  }
  if (actionName === "reader-unzoom") {
    readerZoom = { scale: 1, x: 0, y: 0 };
    return applyReaderZoom();
  }
  if (actionName === "reader-music") {
    const track = findTrack(catalog, readerMusicId());
    if (!track) return;
    if (music.current() === track.id && music.playing()) {
      music.pause();
      musicPaused = true;
    } else {
      musicPaused = false;
      musicAsked = `book:${readerBook}`;
      music.play(track);
    }
    syncMusicChips();
    return;
  }
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
    const from = { page, book: page === "reader" ? readerBook : selectedBook, date: selectedDate, moment: momentId, key: page === "reader" ? readerKey() : "" };
    if (from.page === "reader") Reader.savePosition(readerBook, from.key);
    openStudio(target.dataset.date);
    selectMoment(momentId || null);
    if (from.page === "day" || from.page === "books" || from.page === "reader") readReturn = { ...from, date: from.page === "day" ? target.dataset.date : from.date };
  }
  if (actionName === "day-cover-toggle") {
    const date = target.dataset.date;
    const hide = target.dataset.hide === "1";
    if ($("#choose-dialog").open) $("#choose-dialog").close();
    const key = page === "reader" ? readerKey() : "";
    store.update((next) => {
      for (const day of readCopies(date)(next)) {
        if (hide) day.dayCoverHidden = true;
        else delete day.dayCoverHidden;
      }
    });
    if (page === "reader") {
      // Stay on this day: on its first page that is still shown.
      const pages = readerPages();
      const same = pages.findIndex((p) => Reader.keyOf(p) === key);
      const first = pages.findIndex((p) => p.date === date);
      flipIndex = (same >= 0 ? same : first >= 0 ? first : 0) + (same >= 0 || first >= 0 ? 1 : 0);
    }
    render();
    toast(t(hide ? "cover.hidden" : "cover.shown"));
    logEvent(hide ? "day_cover_hide" : "day_cover_show", {});
    return;
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
  if (actionName === "rich-demo") return addRichDemoPage();
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
    if (!Keeper.modeAllows(k, "invite")) return; // Quiet: just a little bounce
    keeperChat = [];
    return openKeeperPanel("home");
  }
  if (actionName === "keeper-panel") {
    keeperChat = [];
    return openKeeperPanel("home");
  }
  if (actionName === "keeper-view") return openKeeperPanel(target.dataset.view || "home");
  if (actionName === "pr-poke") return prHappy(["play.poke1", "play.poke2", "play.poke3"]);
  if (actionName === "kp-size") {
    kpTall = !kpTall;
    const sheet = $("#choose-dialog .kp");
    sheet?.classList.toggle("tall", kpTall);
    target.setAttribute("aria-label", t(kpTall ? "corner.shrink" : "corner.expand"));
    scrollKeeperChat();
    return;
  }
  // Captain's card: each button does what it says (the same actions as Home
  // and the reader), after the panel closes.
  if (actionName === "cp-go") {
    $("#choose-dialog").close();
    const go = document.createElement("button");
    go.dataset.action = target.dataset.go === "today-write" ? "today-write" : "today-photos";
    return action(go);
  }
  if (actionName === "cp-page") {
    $("#choose-dialog").close();
    const go = document.createElement("button");
    Object.assign(go.dataset, { action: "read-page", date: target.dataset.date, moment: target.dataset.moment });
    return action(go);
  }
  if (actionName === "cp-today") {
    $("#choose-dialog").close();
    const d = dateKey();
    const e = state().entries.find((x) => x.date === d);
    const book = e?.moments?.find((m) => m.bookId)?.bookId || e?.bookId || state().books[0]?.id;
    const first = flipPages(book).find((p) => p.date === d);
    return openReader(book, first ? Reader.keyOf(first) : Reader.COVER);
  }
  if (actionName === "cp-read-on" && captainRead) {
    $("#choose-dialog").close();
    return openReader(captainRead.book, captainRead.key);
  }
  if (actionName === "keeper-do") {
    const what = target.dataset.do;
    if (what === "organize") return openKeeperPanel("organize");
    if (what === "memory") {
      keeperMemory = null;
      return openKeeperPanel("memory");
    }
    if (what === "write") {
      keeperChat.push({ who: "keeper", text: t("kp.writeLater") });
      return openKeeperPanel("home");
    }
    $("[data-keeper-say]")?.focus();
    return;
  }
  if (actionName === "keeper-memory-next") {
    keeperMemory = null;
    return openKeeperPanel("memory");
  }
  if (actionName === "keeper-allow-memories") {
    saveKeeper((x) => (x.allowMemories = true));
    keeperMemory = null;
    return openKeeperPanel("memory");
  }
  if (actionName === "keeper-shelf-tap") {
    keeperBounce(target);
    const k = keeperNow();
    if (!Keeper.modeAllows(k, "invite")) return;
    keeperLine = keeperSay("shelf", keeperShelfFacts());
    render();
    keeperLineLater();
    return;
  }
  if (actionName === "keeper-feedback") return openKeeperFeedback(target.dataset.date, target.dataset.moment || "");
  if (actionName === "keeper-chat") return keeperAnswer(target.dataset.intent);
  if (actionName === "keeper-say") {
    if (keeperBusy || keeperComposing) return;
    const said = ($("[data-keeper-say]")?.value || "").trim().slice(0, 300);
    const typing = Boolean($(".kp.composing"));
    if (said) keeperAnswer("unknown", said);
    // Still typing: the caret goes back to the field so the next line can follow.
    if (said && typing) $("[data-keeper-say]")?.focus();
    return;
  }
  if (actionName === "keeper-look") {
    const look = target.dataset.look || "";
    const k = keeperNow();
    if (!keeperLooks(catalog, k.animal, languageCode()).some((item) => item.id === look)) return;
    saveKeeper((x) => (x.outfit = look === DEFAULT_OUTFIT[x.animal] ? "" : look));
    logEvent("keeper_look", { kind: look });
    render();
    // The open picker (panel or Settings sheet) shows the new choice.
    if ($("#choose-dialog")?.open && $("#choose-dialog .kp[data-view]")) openKeeperPanel("looks");
    else if ($("#choose-dialog")?.open && settingsSheet === "keeper") openSettingsSheet("keeper");
    return;
  }
  if (actionName === "keeper-set") {
    const { key, value } = target.dataset;
    saveKeeper((k) => {
      if (key === "animal" && Keeper.ANIMALS.includes(value) && value !== k.animal) {
        k.animal = value;
        k.outfit = "";
      }
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
    // Opening the notes is what marks them read (the dots on the row and on Home's gear go).
    const fresh = hasUnseen();
    markSeen();
    if (fresh && page === "settings") render();
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
      // V10.24: a paper replaces a library background (your own photo stays: it is the page's picture).
      if (/^(scene|photo):/.test(e.backdrop || "")) delete e.backdrop;
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
    // V10.24: one background per page — a picture / gradient / pattern
    // replaces the paper (it goes back to plain, not kept underneath).
    const reference = target.dataset.backdrop;
    changeTarget((p) => {
      if (/^(scene|photo):[a-z0-9-]+$/.test(reference)) {
        p.backdrop = reference;
        p.template = "minimal";
      } else delete p.backdrop;
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
  if (actionName === "plans-toggle") return togglePlans();
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
  // V10.19 · the words sheet of the magazine view.
  if (actionName.startsWith("sw-") && story) {
    if (actionName === "sw-moment" || actionName === "sw-target") {
      clearTimeout(storyWordsTimer);
      const leaving = storyWords?.momentId;
      if (actionName === "sw-moment") storyWords = { momentId: target.dataset.moment, target: "moment" };
      else storyWords = { ...storyWords, target: target.dataset.target };
      if (leaving) relayoutStoryWords([leaving]);
      return refreshStoryWords(true);
    }
    if (actionName === "sw-font") return storyType((x) => ({ ...x, fontId: target.dataset.font || null }));
    if (actionName === "sw-color") return storyType((x) => ({ ...x, color: x.color === target.dataset.color ? null : target.dataset.color }));
    if (actionName === "sw-align") return storyType((x) => ({ ...x, align: x.align === target.dataset.align ? null : target.dataset.align }));
    if (actionName === "sw-bold") return storyType((x) => ({ ...x, bold: x.bold ? null : true }));
    if (actionName === "sw-size")
      return storyType((x) => {
        const at = TYPE_SCALES.indexOf(typeScale(x));
        const next = TYPE_SCALES[Math.max(0, Math.min(TYPE_SCALES.length - 1, at + Number(target.dataset.dir)))];
        return { ...x, scale: next === 1 ? null : next };
      });
    return;
  }
  if (actionName === "music-sheet") {
    soundMenu = false;
    if (studioTool === "more") studioTool = null;
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
    if (studioTool === "more") studioTool = null;
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
    // 完成 at the top right and 完成手帐 in the leaving sheet are this one
    // step: save everything, mark the record Completed, show the finished page.
    if ($("#choose-dialog")?.open) $("#choose-dialog").close();
    if (editorIsEmpty()) {
      toast(t("先留下一张照片，或者写点什么吧。"));
      return;
    }
    clearTimeout(draftTimer);
    setDraftState("saving");
    try {
      store.update((s) => saveEntry(s, editor, "completed"));
    } catch (error) {
      // Nothing is lost: the page stays open, and Done can be tried again.
      setDraftState("failed");
      toast(t(error?.code === "stale-state" ? "error.conflict" : "studio.saveFailed"));
      return;
    }
    draftDirty = false;
    setDraftState("saved");
    // Captain's card: a page of today just finished in the editor counts as "just made".
    if (activeMomentId && editor.date === dateKey()) captainSaved = { date: editor.date, momentId: activeMomentId, at: Date.now() };
    studioPreview = false;
    studioTool = null;
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
    if (group) group.line = target.value;
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
    inlineInput(target, event);
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
      label.textContent = PL.pageLabel(moment, { t, index: (editor.moments || []).indexOf(moment) }).label;
    refreshStudioTitle();
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
// How far a finger may wander before a touch becomes a drag (V10.12). Below
// it a touch is a tap: it selects, or (twice, quickly) starts typing — a
// finger always wobbles a few pixels, and 2 px made every tap a tiny move.
const DRAG_SLOP = { touch: 8, pen: 6, mouse: 4 };
const DOUBLE_TAP_MS = 400;
let lastTap = null; // { id, at, x, y } — the last tap on a text box
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
    // Handles are deliberate: they follow at once. A move waits for the slop.
    slop: mode === "move" || mode === "crop" ? DRAG_SLOP[event.pointerType] ?? DRAG_SLOP.touch : 0,
  };
  if (mode === "rotate" || mode === "resize") {
    // The item's real centre on screen (its angle does not move it).
    const element = layerElement(layer.id)?.getBoundingClientRect();
    if (!element) return;
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
    drag.local0 = localVector(event, drag.center, layer.rotation);
  }
  if (mode === "pinch") Object.assign(drag, twoPointerMetrics());
}
// A point relative to the item's centre, in the item's own (unturned) axes.
function localVector(point, center, rotation) {
  const rad = (-(Number(rotation) || 0) * Math.PI) / 180;
  const dx = point.clientX - center.x,
    dy = point.clientY - center.y;
  return { x: dx * Math.cos(rad) - dy * Math.sin(rad), y: dx * Math.sin(rad) + dy * Math.cos(rad) };
}
$("#app").addEventListener("pointerdown", (event) => {
  if (page !== "studio") return;
  // The ↻ and ● handles of the selected item (drawn above the paper).
  const frameHandle = event.target.closest("#sel-frame [data-handle]");
  if (frameHandle) {
    const layer = selectedLayerOf();
    if (!layer) return;
    if (document.activeElement?.matches?.(TYPING_FIELD)) document.activeElement.blur();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    beginGesture(layer, frameHandle.dataset.handle, event);
    try {
      frameHandle.setPointerCapture(event.pointerId);
    } catch {}
    event.preventDefault();
    return;
  }
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
  if (selectedLayer !== layer.id) {
    if (cropMode) cropMode = false;
    selectedLayer = layer.id;
    // Re-render so the frame and controls appear, then keep dragging.
    $("#canvas-wrap").innerHTML = canvasHTML();
    placeLayerBar();
    // The 图层 icon appears in the dock; no sheet pops up mid-drag.
    refreshToolMenu();
  }
  // Touching the item itself always moves it (the handles are outside it).
  beginGesture(layer, cropMode && layer.kind === "photo" ? "crop" : "move", event);
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
  if (!drag.moved) {
    // Still a tap until the finger really travels.
    if (drag.mode !== "pinch" && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < drag.slop) return;
    drag.moved = true;
  }
  const dx = ((event.clientX - drag.startX) / rect.width) * 100,
    dy = ((event.clientY - drag.startY) / rect.height) * 100;
  if (drag.mode === "move") {
    layer.x = Math.max(0, Math.min(100, start.x + dx));
    layer.y = Math.max(0, Math.min(100, start.y + dy));
    if (layer.kind === "photo" && layer.mediaRef && !layer.drawing) markSwapTarget(event, layer);
  } else if (drag.mode === "resize" && drag.local0) {
    // Measured along the item's own axes, so a turned item resizes the same
    // way: a photo / video frame stretches (width and height), anything else
    // (words, stickers, check-ins, sound) grows or shrinks as a whole.
    const now = localVector(event, drag.center, start.rotation);
    if (layer.kind === "photo" || layer.kind === "video") {
      const fx = Math.abs(now.x) / Math.max(12, Math.abs(drag.local0.x)),
        fy = Math.abs(now.y) / Math.max(12, Math.abs(drag.local0.y));
      layer.w = Math.round(Math.max(8, Math.min(100, start.w * fx)) * 10) / 10;
      layer.h = Math.round(Math.max(8, Math.min(100, start.h * fy)) * 10) / 10;
    } else {
      const f = Math.hypot(now.x, now.y) / Math.max(12, Math.hypot(drag.local0.x, drag.local0.y));
      layer.scale = Math.round(Math.max(0.3, Math.min(3, (start.scale || 1) * f)) * 100) / 100;
    }
  } else if (drag.mode === "rotate" && drag.center) {
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
  const { moved, before, layer, swapWith, start, mode, startX, startY } = drag;
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
  // A tap selects; two quick taps on a text box start typing in it (with the
  // keyboard: this runs inside the touch's own pointerup).
  if (moved || mode !== "move" || layer.kind !== "text") {
    lastTap = null;
    return;
  }
  const now = performance.now();
  const twice = lastTap && lastTap.id === layer.id && now - lastTap.at < DOUBLE_TAP_MS && Math.hypot(startX - lastTap.x, startY - lastTap.y) < 32;
  lastTap = twice ? null : { id: layer.id, at: now, x: startX, y: startY };
  if (twice) {
    editTextLayer(layer.id);
    noteGuide("dblTap");
  } else showDoubleTapTip(layer);
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
  // Typing inside a text box: Space, Return and the arrows belong to the words.
  if (event.target.isContentEditable) return;
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
// ---------- S3 (V10.43) · Use a photo already in Little Days ----------
// Replacing a photo first offers the photos already imported: this page,
// this day, this book (read only when that tab is opened), then the photo
// library. Choosing one copies its reference into the chosen place: the
// photo it came from stays where it is, nothing is imported or saved again,
// and the words under the replaced place stay (they belong to that place).
let photoSource = null; // { mode: "story" | "studio", target, n, ref, scope }
const sourcePhotosOf = (page) => (page?.layers || []).filter((l) => l.kind === "photo" && l.mediaRef && !l.gen && !l.drawing && !l.deco);
const sourceItem = (l) => ({ reference: l.mediaRef, name: l.text || "", aspect: Number(l.aspect) || 0, ...(l.sourceRef ? { sourceRef: l.sourceRef, edit: l.edit } : {}) });
function photoSourceGroups(scope) {
  const groups = [];
  const seen = new Set();
  const add = (label, layers) => {
    const items = [];
    for (const l of layers) {
      if (seen.has(l.mediaRef)) continue;
      seen.add(l.mediaRef);
      items.push(l);
    }
    if (items.length) groups.push({ label, items });
  };
  if (scope === "page") {
    const photos = photoSource.mode === "story" ? storyPhotoChoices(storyPages()[story.index]).map((c) => c.p) : sourcePhotosOf(activePage());
    // Numbered as on the page: no de-duplication across the page itself.
    return [{ label: "", items: photos, numbered: true }];
  }
  if (scope === "day") {
    const pages = [editor, ...(editor?.moments || [])];
    pages.forEach((pg, i) => add(pg === editor ? t("ps.dayPage") : pg.time || t("ps.pageN", { n: i }), sourcePhotosOf(pg)));
    return groups;
  }
  // This book: the book being written in, newest days first (60 photos at most).
  const bookId = photoSource.mode === "story" ? story?.book : activePage()?.bookId || editor?.bookId;
  add(friendlyDate(editor.date), [editor, ...(editor.moments || [])].flatMap(sourcePhotosOf));
  const byDate = new Map();
  for (const p of visiblePages(state(), { bookId })) if (p.date !== editor.date) byDate.set(p.date, [...(byDate.get(p.date) || []), ...sourcePhotosOf(p.moment || p.entry)]);
  for (const date of [...byDate.keys()].sort().reverse()) {
    if (seen.size >= 60) break;
    add(friendlyDate(date), byDate.get(date));
  }
  return groups;
}
function photoSourceHTML() {
  const scope = photoSource.scope;
  const tab = (id) => `<button role="tab" data-action="ps-scope" data-scope="${id}" aria-selected="${scope === id}">${t("ps.scope." + id)}</button>`;
  const groups = photoSourceGroups(scope);
  const thumb = (l, i, numbered) => {
    const self = l.mediaRef === photoSource.ref && (scope !== "page" || i + 1 === photoSource.n);
    return `<button class="ps-thumb ${self ? "self" : ""}" data-action="ps-pick" data-ref="${esc(l.mediaRef)}" data-layer="${esc(l.id)}" ${self ? 'disabled aria-disabled="true"' : ""} aria-label="${esc(self ? t("ps.current") : numbered ? t("qe.nth", { n: i + 1 }) : t("ps.usePhoto"))}"><img src="${esc(safePhoto(l.mediaRef))}" alt="">${numbered ? `<em>${i + 1}${self ? ` · ${t("ps.now")}` : ""}</em>` : self ? `<em>${t("ps.now")}</em>` : ""}</button>`;
  };
  const body = groups.some((g) => g.items.length)
    ? groups.map((g) => `${g.label ? `<p class="ps-group">${esc(g.label)}</p>` : ""}<div class="ps-grid">${g.items.map((l, i) => thumb(l, i, g.numbered)).join("")}</div>`).join("")
    : `<p class="ps-empty">${t("ps.empty")}</p>`;
  return `<div class="choose-sheet ps-sheet" role="dialog" aria-labelledby="ps-title"><div class="choose-grabber" aria-hidden="true"></div><div class="ps-head"><h2 id="ps-title">${t("ps.title", { n: photoSource.n })}</h2><button class="ps-done" data-action="ps-close">${t("cancel")}</button></div><div class="ps-tabs" role="tablist">${tab("page")}${tab("day")}${tab("book")}</div><div class="ps-body">${body}</div><p class="ps-hint">${t("ps.hint")}</p><button class="secondary full-width ps-album" data-action="ps-album">＋ ${t("ps.album")}</button></div>`;
}
function openPhotoSource(options) {
  photoSource = { scope: "page", ...options };
  const dialog = $("#choose-dialog");
  // See-through, like 写文字: the outlined place stays visible above the sheet.
  dialog.classList.add("see-through");
  dialog.innerHTML = photoSourceHTML();
  if (!dialog.open) dialog.showModal();
  dialog.addEventListener("close", () => { photoSource = null; dialog.classList.remove("see-through"); }, { once: true });
  if (options.mode === "story") revealStoryPick();
}
function photoSourceAction(name, target) {
  if (!photoSource) return false;
  if (name === "ps-close") {
    $("#choose-dialog").close();
    return true;
  }
  if (name === "ps-scope") {
    photoSource.scope = target.dataset.scope;
    $("#choose-dialog").innerHTML = photoSourceHTML();
    return true;
  }
  if (name === "ps-album") {
    const { target: into } = photoSource;
    $("#choose-dialog").close();
    chooseAttachment(into);
    return true;
  }
  if (name === "ps-pick") {
    const all = [editor, ...(editor?.moments || []), ...visiblePages(state()).map((p) => p.moment || p.entry)];
    const layer = all.flatMap(sourcePhotosOf).find((l) => l.id === target.dataset.layer && l.mediaRef === target.dataset.ref) || all.flatMap(sourcePhotosOf).find((l) => l.mediaRef === target.dataset.ref);
    if (!layer) return true;
    const { mode, target: into } = photoSource;
    $("#choose-dialog").close();
    if (mode === "story" && into.kind === "story-cover") {
      storyCoverPhoto(into.momentId, sourceItem(layer));
      render();
    } else if (mode === "story") {
      storyReplacePhoto(into, sourceItem(layer));
      render();
      revealStoryPick();
    } else {
      studioReplacePhoto(into.layer, sourceItem(layer));
      toast(t("ps.replacedStudio"));
    }
    logEvent("photo_reuse", { mode, scope: photoSource?.scope || "" });
    return true;
  }
  return false;
}
// Studio: the chosen photo takes the old one's place, in the old one's box
// and shape; the place's words (caption) stay with it. One undo step.
function studioReplacePhoto(layerId, item) {
  changeTarget((entry) => {
    const layer = entry.layers.find((l) => l.id === layerId);
    if (!layer) return;
    layer.mediaRef = item.reference;
    layer.text = item.name || layer.text;
    layer.crop = { x: 50, y: 50, zoom: 1 };
    if (item.aspect && !layer.shape && !layer.drawing) {
      const box = fitPhoto(item.aspect, Number(layer.w) || 42, Number(layer.h) || 34, layer.frame || "border");
      layer.aspect = Math.round(item.aspect * 1000) / 1000;
      layer.w = Math.round(box.w * 100) / 100;
      layer.h = Math.round(box.h * 100) / 100;
    }
    delete layer.sourceRef;
    delete layer.edit;
    if (item.sourceRef) {
      layer.sourceRef = item.sourceRef;
      if (item.edit) layer.edit = structuredClone(item.edit);
    }
  });
  flushDraft();
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
// Undo belongs to the page in view. Moving to another page forgets the
// earlier steps, so undo can never change a page that is not on screen;
// `keepStep` keeps the one step that caused the move (deleting a page or
// clearing the cover), so that step can still be undone. A new page starts
// with nothing to undo.
function selectMoment(momentId, keepStep = false) {
  if ((momentId || null) !== activeMomentId) {
    history = keepStep ? history.slice(-1) : [];
    future = [];
  }
  activeMomentId = momentId || null;
  templateCount = null;
  selectedLayer = null;
  cropMode = false;
  if (studioTool === "layer") studioTool = null;
  // A Moment with audio/video opens its players straight away.
  const page = activePage();
  if (!studioTool && page.media?.length) studioTool = "media";
  render();
  $(".chapter-chips .chapter-chip.active")?.scrollIntoView({ block: "nearest", inline: "center" });
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
  selectMoment(created.id); // a new page starts with nothing to undo
  $('[data-moment-field="title"]')?.focus();
  toast(t("moment.added"));
}
// V10.6: a real page to try the text formatting on — one text box with
// plain, bold, italic and underlined words. Only added when asked for (from
// the update notes); it is an ordinary page of today, editable and deletable.
function addRichDemoPage() {
  if ($("#choose-dialog")?.open) $("#choose-dialog").close();
  openStudio(dateKey());
  const en = languageCode() === "en";
  const text = en
    ? "Thinking about whether to buy a laptop today.\nPlain words, bold words, italic words and underlined words can share one text box — even bold and underlined together."
    : "今天在思考要不要买电脑。\n普通的字、加粗的字、斜体的字、带下划线的字，可以放在同一个文本框里——也可以又粗又带下划线。";
  const looks = en
    ? [["buy a laptop", { bold: true }], ["bold words", { bold: true }], ["italic words", { italic: true }], ["underlined words", { underline: true }], ["bold and underlined together", { bold: true, underline: true }]]
    : [["买电脑", { bold: true }], ["加粗的字", { bold: true }], ["斜体的字", { italic: true }], ["带下划线的字", { underline: true }], ["又粗又带下划线", { bold: true, underline: true }]];
  const marks = Rich.normalizeMarks(
    looks.map(([words, look]) => ({ start: text.indexOf(words), end: text.indexOf(words) + words.length, ...look })).filter((mark) => mark.start >= 0),
    text.length,
  );
  const how = en ? "Tap the text twice, select a few words, then B / I / U / S." : "双击上面的文字，选中几个字，再点 B / I / U / S。";
  let created;
  changeEditor((entry) => {
    const now = new Date();
    created = createMoment(entry, { time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, title: t("rich.demoTitle") });
    const box = (words, y, size, color, extra = {}) => ({ id: id(), kind: "text", text: words, x: 50, y, w: 82, scale: 1, rotation: 0, fontId: "hei", fontSize: size, color, align: "left", weight: 400, spacing: 0, ...extra });
    created.layers.push(box(text, 42, 17, "#2B2622", { marks }), box(how, 74, 12, "#6F675D"));
    entry.moments.push(created);
  }, false);
  studioTool = null;
  selectMoment(created.id);
  toast(t("rich.demoAdded"));
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
  // …just under the top bar, which stays in place.
  const bar = $(".studio-bar.sv-top");
  if (stage && scroller)
    scroller.scrollTop += stage.getBoundingClientRect().top - scroller.getBoundingClientRect().top - (bar ? bar.offsetHeight : 0);
}
async function v31Action(target) {
  const name = target.dataset.action;
  const momentId = target.dataset.moment;
  switch (name) {
    case "tool":
      if (target.dataset.tool !== "more") soundMenu = false;
      openTool(target.dataset.tool);
      return true;
    case "first-photo":
      soundMenu = false;
      openPhotoChooser("layers");
      return true;
    case "studio-preview":
      studioPreview = !studioPreview;
      selectedLayer = null;
      cropMode = false;
      studioTool = null;
      soundMenu = false;
      render();
      return true;
    case "open-pages":
      openPagesManage();
      return true;
    case "pages-add":
      $("#choose-dialog").close();
      addMomentNow();
      return true;
    case "pages-details":
      $("#choose-dialog").close();
      studioTool = "details";
      render();
      return true;
    case "draft-retry":
      toast(t(retryDraft() ? "draft.retryOk" : "draft.retryFailed"));
      return true;
    case "open-background":
      // 背景 under the paper: the same panel as the dock's 背景 (tap again closes).
      openTool(studioTool === "paper" ? null : "paper");
      return true;
    case "tool-close":
      openTool(null);
      return true;
    case "import-retry":
      runImport();
      return true;
    case "import-dismiss":
      if (mediaImport?.thumb) URL.revokeObjectURL(mediaImport.thumb);
      mediaImport = null;
      refreshImportCard();
      render();
      return true;
    case "ctx-play":
    case "layer-play": {
      // From the selected video's tools (V10.23) or the play button on the paper.
      const element = name === "ctx-play" ? document.querySelector(`#journal-canvas [data-layer="${CSS.escape(selectedLayer || "")}"] :is(video,audio)`) : target.closest(".media-layer")?.querySelector("video,audio");
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
    case "pages-more":
      // V10.25: the older 目录 sheet (save one page, fold, …) — from 页面目录.
      $("#choose-dialog").close();
      studioTool = "chapters";
      render();
      return true;
    case "page-copy": {
      // V10.25: 页面目录 also copies a page (it used to be only in 目录).
      changeEditor((entry) => duplicateMoment(entry, target.dataset.moment), false);
      renderPagesManage();
      toast(t("pages.copied"));
      return true;
    }
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
    case "text-to-box":
      // 转为自由文字框 (typing bar): the same as choosing 自由排版.
      setPageMode("layout");
      return true;
    case "page-mode":
      // Chosen from More: the sheet steps aside so the paper shows the change.
      if (studioTool === "more") studioTool = null;
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
      if (editor.moments.length) selectMoment(editor.moments[0].id, true);
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
      selectMoment(!hasDayPageContent(editor) && editor.moments.length ? editor.moments.at(-1).id : null, true);
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
    case "moment-mood-clear":
      changeTarget((moment) => {
        if (moment !== editor) moment.mood = "";
      });
      return true;
    case "mood-open":
      // More → 心情: the same picker, in 页面信息.
      studioTool = "details";
      render();
      document.querySelector("#mood-picker")?.scrollIntoView({ block: "start" });
      return true;
    case "moment-mood":
      changeTarget((moment) => {
        if (moment !== editor)
          moment.mood =
            moment.mood === target.dataset.mood ? "" : target.dataset.mood;
      });
      return true;
    case "moment-template":
      changeTarget((moment) => {
        if (moment !== editor) {
          moment.template = target.dataset.template;
          if (/^(scene|photo):/.test(moment.backdrop || "")) delete moment.backdrop;
        }
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
    case "crop-open":
      studioTool = null;
      openCropFor();
      return true;
    case "layout-hint-open":
      layoutHint = false;
      openTool("layout");
      return true;
    case "layout-hint-close":
      layoutHint = false;
      render();
      return true;
    case "ctx-crop":
      // 裁剪 in the bottom row: crop mode with its sliders in the layer sheet.
      cropMode = !cropMode;
      studioTool = cropMode ? "layer" : null;
      render();
      $(".crop-sliders")?.scrollIntoView({ block: "nearest" });
      return true;
    case "layer-deselect":
      selectedLayer = null;
      cropMode = false;
      if (["layer", "textstyle"].includes(studioTool)) studioTool = null;
      render();
      return true;
    case "text-style":
      // Font / colour / alignment share one small sheet; tapping the open one closes it.
      if (studioTool === "textstyle" && textTab === target.dataset.tab) studioTool = null;
      else {
        textTab = target.dataset.tab;
        studioTool = "textstyle";
      }
      render();
      syncTypeBar();
      return true;
    case "ctx-edit-text":
      // Type right on the paper.
      if (["layer", "textstyle"].includes(studioTool)) studioTool = null;
      render();
      editTextLayer(selectedLayer);
      return true;
    case "replace-photo":
      if (selectedLayerOf()?.kind === "photo") {
        const photos = sourcePhotosOf(activePage());
        openPhotoSource({ mode: "studio", target: { kind: "replace", layer: selectedLayer }, n: photos.findIndex((l) => l.id === selectedLayer) + 1 || 1, ref: selectedLayerOf().mediaRef });
      }
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
    toast(t(mediaImport ? "import.busy" : "media.busy"));
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
  if (name === "sticker-swap") {
    // V10.25 · 换一个: pick another sticker for the selected one (same place, size and turn).
    studioTool = studioTool === "stickers" ? null : "stickers";
    render();
    return true;
  }
  if (name === "asset-sticker") {
    const asset = catalog.stickers.find((s) => s.id === target.dataset.sticker);
    const swap = selectedLayerOf();
    if (swap?.assetId && swap.kind !== "photo" && !swap.drawing) {
      changeTarget((entry) => {
        const layer = entry.layers.find((l) => l.id === swap.id);
        if (!layer) return;
        layer.assetId = asset.id;
        layer.text = languageCode() === "en" ? asset.nameEn : asset.nameZh;
      });
      toast(t("sticker.swapped"));
      return true;
    }
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
    layerPreciseOpen = true;
    render();
    const box = $('[data-layer-text="text"]');
    box?.focus({ preventScroll: true });
    box?.select();
    return true;
  }
  if (name === "remove-media-ask") {
    // V10.23 · 从页面移除: off this page (paper and list). Undo brings it back;
    // the file itself stays on this device.
    if (!(await askConfirm(t("media.removeConfirm")))) return true;
    const clipId = target.dataset.clip;
    changeTarget((entry) => {
      entry.media = entry.media.filter((clip) => clip.id !== clipId);
      entry.layers = entry.layers.filter((layer) => layer.clipId !== clipId);
    });
    flushDraft();
    toast(t("media.removed"));
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
    // C2: a file that can't be read is listed, and left out only when the
    // person chooses to — the file then says it is incomplete.
    let backup;
    try {
      backup = await media.backup(state());
    } catch (error) {
      if (error.code !== "backup-missing") throw error;
      if (!(await backupMissingSheet(error.missing))) return true;
      backup = await media.backup(state(), { allowMissing: true });
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `Little-Days-Backup-${dateKey()}${backup.complete ? "" : "-incomplete"}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    logEvent("backup", { complete: backup.complete, missing: backup.missing?.length || 0 });
    // C3: the file was only handed over (download / share sheet, which can be
    // cancelled): it counts as a backup once the person says it is kept.
    if (await backupKeptSheet(backup)) {
      if (backup.complete) {
        writeKey(BACKUP_AT_KEY, dateKey());
        toast(t("settings.backupDone"));
      } else {
        writeKey(BACKUP_PARTIAL_KEY, JSON.stringify({ date: dateKey(), missing: backup.missing.length }));
        toast(t("backup.partialKept", { count: backup.missing.length }));
      }
      logEvent("backup_kept", { complete: backup.complete });
    }
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
async function editPhotos(saved, mode, tabs = null) {
  const items = saved
    .map((item) => ({ ref: item.sourceRef || item.reference, src: safePhoto(item.sourceRef || item.reference), name: item.name, edit: item.edit }))
    .filter((item) => item.src);
  if (!items.length) return null;
  const result = await openPhotoEditor(items, { t, loadImage, mode, ...(tabs ? { tabs } : {}) });
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
// V10.20 · 裁剪画面: the full-screen crop editor for the selected photo.
// Applied as one undo step; the layer's place, turn and order stay; its frame
// changes only when a different ratio was chosen (the editor says so first).
async function openCropFor() {
  const layer = selectedLayerOf();
  if (layer?.kind !== "photo" || !layer.mediaRef || busyMedia) return;
  let image;
  try {
    image = await loadImage(safePhoto(layer.mediaRef));
  } catch {
    return toast(t("media.missing"));
  }
  // Turning 90° re-draws the picture from its untouched original (as 调整
  // does); nothing is kept unless 完成 is pressed.
  let pending = null;
  const rotate = async () => {
    const source = pending?.sourceRef || layer.sourceRef || layer.mediaRef;
    const edit = normalizeEdit(pending?.edit || layer.edit || {});
    edit.rotate = (edit.rotate + 90) % 360;
    const original = await loadImage(safePhoto(source));
    let reference = source,
      aspect = original.width / original.height;
    if (!isIdentity(edit)) {
      const canvas = renderEdited(original, edit);
      const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image encoding failed"))), "image/jpeg", 0.88));
      reference = `media:${await media.put(blob, { kind: "photo", name: layer.text, edited: true })}`;
      aspect = canvas.width / canvas.height;
    }
    pending = { reference, sourceRef: isIdentity(edit) ? null : source, edit: isIdentity(edit) ? null : edit, aspect };
    return { src: safePhoto(reference), aspect };
  };
  const result = await openCropEditor({ src: safePhoto(layer.mediaRef), imgAspect: image.width / image.height, layer: structuredClone(layer), t, rotate });
  if (!result) return;
  changeTarget((page) => {
    const target = page.layers.find((item) => item.id === layer.id);
    if (!target) return;
    if (pending) {
      target.mediaRef = pending.reference;
      if (pending.sourceRef) {
        target.sourceRef = pending.sourceRef;
        target.edit = pending.edit;
      } else {
        delete target.sourceRef;
        delete target.edit;
      }
      target.aspect = Math.round(pending.aspect * 1000) / 1000;
    }
    if (result.frameAspect) {
      Object.assign(target, Crop.frameFor(target, result.frameAspect));
      page.layoutEdited = true;
    }
    target.crop = { ...Crop.rectToView(result.rect, result.aspect, Crop.boxAspect(target)), rect: result.rect, aspect: result.aspect };
  });
  flushDraft();
  logEvent("photo_crop", { frame: Boolean(result.frameAspect), rotated: result.rotated || 0 });
  toast(t("crop.saved"));
}
async function reEditPhotoLayer() {
  const layer = selectedLayerOf();
  if (layer?.kind !== "photo" || !layer.mediaRef) return;
  busyMedia = true;
  try {
    const [result] =
      (await editPhotos([{ reference: layer.mediaRef, sourceRef: layer.sourceRef, edit: layer.edit, name: layer.text }], "edit", ["filter", "adjust", "text"])) || [];
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
    } else if (target?.kind === "story-cover") {
      storyCoverPhoto(target.momentId, saved[0]);
      render();
    } else if (target?.kind === "story-replace") {
      storyReplacePhoto(target, saved[0]);
      render();
      revealStoryPick();
    } else if (target?.kind === "replace") {
      studioReplacePhoto(target.layer, { reference, name: saved[0].name, aspect: saved[0].aspect, sourceRef: saved[0].sourceRef, edit: saved[0].edit });
    } else if (multiple) {
      addPhotoLayers(saved);
      flushDraft();
    } else {
      changeEditor((entry) => {
        entry.photo = reference;
      });
      flushDraft();
    }
    // V10.24: photos added to the page in Studio need no "added" message — they are
    // right there on the paper (the message also covered its top); failures still say so.
    if (failed || !(["quick", "story-replace", "story-cover"].includes(target?.kind) || (page === "studio" && ["photos", "replace"].includes(target?.kind)))) toast(
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
let layoutHint = false; // V10.20: "try a layout" after adding several photos (ignorable)
function addPhotoLayers(saved) {
  // V10.20: adding photos never opens Layout by itself. One photo is simply
  // selected (its own tools: shape, crop, adjust…); with several, a small
  // "try a layout" chip offers the arrangements and can be ignored.
  studioTool = null;
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
    const total = existing + added.length;
    if (!page.layoutEdited) {
      if (page.layoutTemplate === "smart") applyLayout(page, "smart");
      else applyLayout(page, suggestLayout(total), photoRegion());
    }
    selectedLayer = added.length === 1 ? added[0].id : null;
    layoutHint = total >= 2;
  });
}
async function mediaMetadata(file, kind) {
  return new Promise((resolve, reject) => {
    const element = document.createElement(
        kind === "video" ? "video" : "audio",
      ),
      url = URL.createObjectURL(file);
    // V10.26 (P0): say which way it failed — no metadata within 10 s, or the
    // media element's own error code (MediaError 1–4) — in the local log.
    const timer = setTimeout(
      () => finish(Object.assign(new Error("Unsupported media"), { code: "media-timeout" })),
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
      finish(Object.assign(new Error("Unsupported media"), { code: `media-err-${element.error?.code || 0}` }));
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
  options.onStage?.("write");
  const mediaId = await media.put(blob, { kind, name, duration }, "studio");
  // Videos get a first cover right away (changeable later).
  options.onStage?.("cover");
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
// V10.23 · Importing a video / sound file from this device: every step is
// shown on the page (import → read, with real progress → save to this device
// → cover → saved / failed), the file stays in memory until it is really
// saved (so a failure can be retried), and switching pages is shown as
// paused before anyone taps it. Nothing is uploaded anywhere.
let mediaImport = null;
const IMPORT_LIMIT = { video: 50, audio: 20 };
function importCardHTML() {
  const job = mediaImport;
  if (!job || page !== "studio") return "";
  const mb = (n) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(n / 1024 / 1024) + " MB";
  const meta = [job.duration ? formatClock(job.duration) : "", job.size ? mb(job.size) : ""].filter(Boolean).join(" · ");
  const pct = job.stage === "read" && job.progress != null ? Math.round(job.progress * 100) : null;
  const label = job.stage === "read" ? t("import.read", { pct: pct ?? 0 }) : t("import." + job.stage);
  const bar = ["done", "failed"].includes(job.stage) ? "" : `<div class="ic-bar ${pct == null ? "indeterminate" : ""}" role="progressbar" aria-label="${esc(label)}" ${pct == null ? "" : `aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"`}><i style="${pct == null ? "" : `width:${pct}%`}"></i></div>`;
  const note = job.stage === "failed" ? `${t("import.failedNote")}${job.err ? ` <code>${esc(job.err)}</code>` : ""}` : job.stage === "done" ? t("import.doneNote") : t("import.lockNote");
  const actions = job.stage === "failed" ? `<div class="ic-actions"><button class="primary" data-action="import-retry">${t("import.retry")}</button><button class="text-button" data-action="import-dismiss">${t(job.kind === "video" ? "import.dismissVideo" : "import.dismissAudio")}</button></div>` : "";
  return `<div class="import-card" data-stage="${job.stage}" role="status" aria-live="polite"><span class="ic-thumb">${job.thumb ? `<img src="${esc(job.thumb)}" alt="">` : `<i aria-hidden="true">${job.kind === "video" ? "▶" : "♫"}</i>`}</span><span class="ic-main"><b>${t(job.kind === "video" ? "import.titleVideo" : "import.titleAudio")}</b><small>${esc(meta)}</small><span class="ic-stage">${label}</span>${bar}<span class="ic-note">${note}</span>${actions}</span></div>`;
}
function formatClock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function refreshImportCard() {
  const html = importCardHTML();
  const old = document.querySelector(".import-card");
  if (old && html) old.outerHTML = html;
  else if (old) old.remove();
  else if (html) document.querySelector(".studio-stage")?.insertAdjacentHTML("beforeend", html);
}
function setImport(changes) {
  if (!mediaImport) return;
  Object.assign(mediaImport, changes);
  refreshImportCard();
}
// The file's bytes with real progress (FileReader reports it as it reads).
function readWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("read"));
    reader.readAsArrayBuffer(file);
  });
}
async function handleMediaUpload(event, kind) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  if (busyMedia || recorder) {
    toast(t(mediaImport ? "import.busy" : "media.busy"));
    return;
  }
  if (mediaImport?.stage === "failed" && mediaImport.thumb) URL.revokeObjectURL(mediaImport.thumb);
  mediaImport = { file, kind, size: file.size, duration: 0, stage: "import", progress: null, thumb: "", err: "", targetId: activeMomentId, started: Date.now() };
  await runImport();
}
async function runImport() {
  const job = mediaImport;
  if (!job) return;
  const { file, kind } = job;
  busyMedia = true;
  setDraftState("saving");
  Object.assign(job, { stage: "import", progress: null, err: "" });
  render();
  let stage = "import";
  try {
    if (!file.type.startsWith(kind + "/")) throw Object.assign(new Error("type"), { code: "unsupported" });
    if (file.size > IMPORT_LIMIT[kind] * 1024 * 1024) throw Object.assign(new Error("size"), { code: "too-big" });
    const metadata = await mediaMetadata(file, kind);
    job.duration = metadata.duration;
    if (kind === "video" && !job.thumb) {
      // A first look at the video while it is being saved (not stored).
      const url = URL.createObjectURL(file);
      try {
        job.thumb = URL.createObjectURL(await frameAt(url, Math.min(1, (metadata.duration || 2) * 0.25), 360));
      } catch {}
      URL.revokeObjectURL(url);
    }
    stage = "read";
    setImport({ stage, progress: 0 });
    const bytes = await readWithProgress(file, (progress) => setImport({ progress }));
    await attachClip(new Blob([bytes], { type: file.type }), kind, file.name, metadata.duration, {
      width: metadata.width,
      height: metadata.height,
      targetId: job.targetId,
      onStage: (next) => {
        stage = next;
        setImport({ stage: next, progress: null });
      },
    });
    logEvent("media_import", { kind, stage: "done", size: Math.round(file.size / 1024 / 1024), ms: Date.now() - job.started });
    busyMedia = false;
    setImport({ stage: "done" });
    render();
    setTimeout(() => {
      if (mediaImport === job && job.stage === "done") {
        if (job.thumb) URL.revokeObjectURL(job.thumb);
        mediaImport = null;
        refreshImportCard();
      }
    }, 2600);
  } catch (error) {
    busyMedia = false;
    const err = error?.code === "too-big" || error?.code === "unsupported" ? error.code : errName(error);
    logEvent("media_import_failed", { kind, stage, err, size: Math.round(file.size / 1024 / 1024) });
    setImport({ stage: "failed", err });
    render();
    // Nothing of it was added to the page: the page's own state stays as it was.
    confirmMediaSaved();
    toast(t(err === "too-big" ? (kind === "video" ? "import.tooBigVideo" : "import.tooBigAudio") : err === "unsupported" ? "media.unsupported" : "import.failedToast"));
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
    // A page's own video or sound pauses the book's music (one sound at a time).
    if (page === "reader" && event.target.matches?.("#app audio, #app video") && music.playing()) {
      music.pause();
      musicPaused = true;
      const button = $(".reader-music");
      if (button) {
        button.classList.remove("on");
        button.setAttribute("aria-pressed", "false");
      }
    }
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
  // B2: the very first start (no language chosen, no sign of earlier use)
  // follows the device's language; anyone already using the app keeps the
  // language they had (Chinese was the default), so an update never switches it.
  try {
    if (localStorage.getItem("little-days.language") == null) {
      const used = hasTraces(localStorage) || localStorage.getItem("little-days.v1") != null;
      const device = String(navigator.languages?.[0] || navigator.language || "").toLowerCase();
      localStorage.setItem("little-days.language", used || device.startsWith("zh") ? "zh-CN" : "en");
    }
  } catch {}
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
  let durableRaw = null,
    durableError = false;
  try {
    durableRaw = await meta.read();
  } catch (error) {
    durableError = true;
    console.warn("Journal database unavailable", error?.name);
  }
  // A1: a blank journal only for a real first start. A journal that exists
  // but cannot be read now stops here, before anything is drawn or written.
  const mirrorOff = localStorage.getItem(MIRROR_OFF_KEY) === "off";
  const decision = decideJournalOpen({
    local: mirrorOff ? null : localStorage.getItem("little-days.v1"),
    durable: durableRaw,
    durableError,
    mirrorOff,
    traces: hasTraces(localStorage),
  });
  let useDurable = false;
  if (decision.kind === "blocked") {
    const choice = await showJournalRescue(decision, meta);
    if (choice !== "earlier" && choice !== "new") return;
    useDurable = choice === "earlier";
  }
  const volatile = decision.kind === "new" && decision.volatile;
  // B1: a new journal starts empty — no sample pages, days or habits mixed
  // into one's own books, calendar and page counts. Journals that already
  // have samples keep them (Settings → 示例 removes the untouched ones), and
  // no new samples are added to them. ("little-days.with-samples" = "1" keeps
  // the old sample journal, for the older test suites.)
  const withSamples = localStorage.getItem("little-days.with-samples") === "1";
  // The three starting books are named in the interface language when the
  // journal is new (preset names, not the person's words; existing books keep theirs).
  // V10.41 (D1): one empty book, 我的手帐 / My Journal (the preset "daily"
  // book's look and id, so every page has a home without asking first).
  // It can be renamed, given another cover or deleted like any book.
  const startBooks = [{ ...responses[2].books[0], title: t("book.default.mine") }];
  const journalSeed = withSamples ? responses[2] : { ...responses[2], books: startBooks, journals: [], sampleDays: [], habits: [] };
  store = new Store(localStorage, journalSeed, undefined, {
    durableRaw,
    useDurable,
    // IndexedDB could not open on a first start: keep LocalStorage only, so a
    // later start that can read IndexedDB never meets a blank copy there.
    persist: volatile ? null : (raw) => meta.write(raw),
    onPersistError: () => {
      toast(t("storage.saveFailed"));
      // The editor says so too, and offers to try again.
      if (page === "studio") setDraftState("failed");
    },
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
// A1 recovery panel: says what happened, keeps every copy, and offers only
// ways on that cannot lose anything. Resolves "earlier" when the person
// goes on with the earlier complete copy (after the damaged one was kept).
function showJournalRescue(decision, meta) {
  const reason = decision.reason;
  const app = $("#app");
  logEvent("journal-blocked", { reason });
  return new Promise((resolve) => {
    const draw = (note = "") => {
      app.innerHTML = `<section class="error-panel rescue-panel" role="alert" data-rescue="${esc(reason)}">
        <h1>${esc(t("rescue.title"))}</h1>
        <p>${esc(t(`rescue.${reason}`))}</p>
        <p class="rescue-safe">${esc(t("rescue.safe"))}</p>
        ${decision.earlier ? `<p>${esc(t("rescue.earlierFound", { pages: decision.earlierPages ?? 0 }))}</p>` : ""}
        <div class="rescue-actions">
          <button class="primary" data-rescue-act="retry">${esc(t("rescue.retry"))}</button>
          ${decision.copies.length ? `<button data-rescue-act="save">${esc(t("rescue.saveCopy"))}</button>` : ""}
          ${decision.earlier ? `<button data-rescue-act="earlier">${esc(t("rescue.useEarlier"))}</button>` : ""}
          ${reason === "missing" ? `<button data-rescue-act="new">${esc(t("rescue.startNew"))}</button>` : ""}
        </div>
        ${note ? `<p class="rescue-note">${esc(note)}</p>` : ""}
      </section>`;
    };
    draw();
    app.addEventListener("click", async function onClick(event) {
      const act = event.target.closest("[data-rescue-act]")?.dataset.rescueAct;
      if (!act) return;
      if (act === "retry") location.reload();
      if (act === "save") {
        const blob = new Blob(
          [JSON.stringify({ kind: "little-days-journal-copies", reason, savedAt: new Date().toISOString(), copies: decision.copies })],
          { type: "application/json" },
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Little-Days-Journal-Copy-${dateKey()}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        draw(t("rescue.saved"));
      }
      if (act === "new") {
        // Only offered when the database opened and holds no journal at all:
        // there is nothing a new journal could overwrite.
        if (!(await askConfirm(t("rescue.startNewConfirm")))) return;
        app.removeEventListener("click", onClick);
        resolve("new");
      }
      if (act === "earlier") {
        if (!(await askConfirm(t("rescue.earlierConfirm")))) return;
        // Keep the damaged newest copy in the journal database first; only
        // when that worked does the app go on with the earlier copy.
        const damaged = decision.copies.find((copy) => copy.source === "local")?.text;
        try {
          await meta.write(JSON.stringify({ keptAt: new Date().toISOString(), reason, text: damaged }), RESCUE_KEY);
        } catch {
          draw(t("rescue.keepFailed"));
          return;
        }
        app.removeEventListener("click", onClick);
        resolve("earlier");
      }
    });
  });
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
  // How much of the bottom the keyboard covers (a bottom sheet lifts by this much).
  if (keyboard > 80) root.style.setProperty("--kb", `${Math.round(keyboard)}px`);
  else root.style.removeProperty("--kb");
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
  typingFocusAt = performance.now();
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
// iPhone: closing the keyboard (or tapping elsewhere) can leave the caret in
// the field, which kept the tool row hidden for good. Leave typing mode when
// the keyboard closes, and on a tap outside the field.
let keyboardSeen = false;
let typingFocusAt = 0; // when a field last took the caret
function leaveTyping() {
  if (!document.body.classList.contains("typing")) return;
  keyboardSeen = false;
  const field = document.activeElement;
  if (field?.matches?.(TYPING_FIELD)) field.blur();
  clearTimeout(typingTimer);
  document.body.classList.remove("typing", "typing-sheet");
}
window.visualViewport?.addEventListener("resize", () => {
  const vv = window.visualViewport;
  const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  if (keyboard > 80) keyboardSeen = true;
  else if (keyboardSeen) leaveTyping();
});
document.addEventListener(
  "click",
  (event) => {
    if (!document.body.classList.contains("typing")) return;
    // The text style bar and an open panel work on the caret: keep it.
    // The paper places the caret itself (a tap on blank paper starts typing).
    if (event.target.closest?.(`${TYPING_FIELD}, #journal-canvas, #type-bar, .type-bar, .tool-sheet, .kp-input, label`)) return;
    // The tap that put the caret in a panel's field moves that panel above the
    // keyboard, so its click can land on what is now under the finger: that
    // tap is not "a tap elsewhere".
    if (performance.now() - typingFocusAt < 600) return;
    leaveTyping();
  },
  true,
);
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

// A bottom sheet (Captain's panel, Settings sheets, …) follows the finger
// when its grabber or header is pulled down, and closes past a short way.
// Closing this way is the same as ×: nothing is sent, a draft is kept.
let sheetPull = null;
let sheetPullClick = 0; // a drag on the grabber is not also a tap on it
document.addEventListener("pointerdown", (event) => {
  const dialog = event.target.closest?.("#choose-dialog[open]");
  if (!dialog || !event.target.closest(".choose-grabber, .kp-head, .kp-title")) return;
  if (event.target.closest("button:not(.choose-grabber), input, textarea, a")) return;
  sheetPull = { y: event.clientY, dialog, dy: 0, raw: 0 };
});
document.addEventListener("pointermove", (event) => {
  if (!sheetPull) return;
  sheetPull.raw = event.clientY - sheetPull.y;
  sheetPull.dy = Math.max(0, sheetPull.raw);
  sheetPull.dialog.style.transition = "none";
  sheetPull.dialog.style.transform = `translateY(${sheetPull.dy}px)`;
});
const endSheetPull = () => {
  if (!sheetPull) return;
  const { dialog, dy, raw } = sheetPull;
  sheetPull = null;
  dialog.style.transition = "";
  dialog.style.transform = "";
  if (Math.abs(raw) > 8) sheetPullClick = performance.now();
  const corner = dialog.querySelector(".kp.corner");
  // Captain's Corner: pull up for more room; pull down to the medium height, then to close.
  if (corner && raw < -40) {
    kpTall = true;
    corner.classList.add("tall");
    return scrollKeeperChat();
  }
  if (corner && dy > 70 && corner.classList.contains("tall")) {
    kpTall = false;
    corner.classList.remove("tall");
    return scrollKeeperChat();
  }
  if (dy > 70 && dialog.open) dialog.close();
};
document.addEventListener("pointerup", endSheetPull);
document.addEventListener("pointercancel", endSheetPull);
document.addEventListener(
  "click",
  (event) => {
    if (event.target.closest?.(".choose-grabber") && performance.now() - sheetPullClick < 400) {
      event.stopPropagation();
      event.preventDefault();
    }
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
