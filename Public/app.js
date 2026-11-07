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
  attachmentTarget = null;
const safePhoto = (photo) => media.resolve(photo);
const ctx = () => ({
  catalog,
  tokens,
  media,
  t,
  language: languageCode(),
  locale: locale(),
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
  history = [];
  future = [];
  selectedLayer = null;
  draftDirty = false;
  page = "studio";
  render();
  $("#app-scroll").scrollTop = 0;
}
function navigation() {
  $("#navigation").innerHTML = features.tabs
    .map(
      (tab) =>
        `<button class="nav-item ${tab.id === page ? "active" : ""} ${tab.id}" data-action="nav" data-page="${tab.id}" aria-label="${t("nav." + tab.id)}" ${tab.id === page ? 'aria-current="page"' : ""}>${icon(tab.symbol)}<span>${t("nav." + tab.id)}</span></button>`,
    )
    .join("");
}
function habitRow(habit, date) {
  const done = state().checks.find(
    (check) => check.habitId === habit.id && check.date === date,
  );
  return `<div class="habit-row"><span class="habit-symbol">${themeIcon(habit.theme)}</span><div class="habit-detail"><strong>${esc(habit.title)}</strong><small>${esc(habit.theme)} · ${habit.kind === "duration" ? `${done?.minutes || habit.minutes} min` : t("growth.encourage")}</small></div><button class="check-button ${done ? "done" : ""}" data-action="check" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${t(done ? "habit.cancel" : "habit.complete")} ${esc(habit.title)}" aria-pressed="${Boolean(done)}">${done ? icon("check") : ""}</button></div>`;
}

function bookCard(book) {
  const count = state().entries.filter(
    (entry) => entry.bookId === book.id,
  ).length;
  return `<button class="book-item" data-action="book" data-book="${esc(book.id)}">${coverHTML(book, ctx())}<strong>${esc(book.title)}</strong><small>${esc(book.category)} · ${t("entry.count", { count })}</small></button>`;
}

function home() {
  const entry = todayEntry(),
    completed = state().checks.filter(
      (check) => check.date === dateKey(),
    ).length;
  const date = new Date().toLocaleDateString(locale(), {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return `<header class="brand-row"><div><div class="brand-title"><span class="flower">✿</span>Little Days</div><p class="brand-subtitle">${t("brand.subtitle")}</p></div><div class="header-actions"><button class="icon-button" data-action="nav" data-page="calendar" aria-label="${t("calendar.title")}">${icon("calendar")}</button><button class="icon-button" data-action="nav" data-page="settings" aria-label="${t("settings")}">⚙</button></div></header><div class="date-label">${esc(date)}</div><h1 class="greeting">${t("home.greeting")}<span class="sun">☀</span></h1><p class="subtext">${t("home.subtitle")}</p>
 <section class="hero"><div class="hero-top"><span>✧ &nbsp; TODAY'S LITTLE MOMENT</span><button data-action="edit-today">${t(entry ? "home.continue" : "home.begin")} ↗</button></div><div class="hero-content"><div class="polaroid">${safePhoto(entry?.photo) ? `<img src="${esc(safePhoto(entry.photo))}" alt="${t("photo.alt")}">` : `<div class="photo-placeholder">📷<span>${t("photo.placeholder")}</span></div>`}</div><div class="hero-copy"><span class="scribble">slow down, feel more.</span><h3>${esc(entry?.title || t("home.blankTitle"))}</h3><p>${esc(entry?.body?.slice(0, 48) || t("home.blankBody"))}</p></div></div><span class="hero-flower">🌼</span>${entry?.isDemo ? `<span class="tiny-demo">${t("home.sample")}</span>` : ""}</section>
 <div class="quick-actions">${[
   ["photo", "home.photo", "quick-photo"],
   ["text", "home.text", "quick-text"],
   ["smile", "home.mood", "quick-mood"],
   ["leaf", "home.check", "quick-growth"],
 ]
   .map(
     ([symbol, key, action]) =>
       `<button class="quick-action" data-action="${action}"><span class="quick-icon">${icon(symbol)}</span>${t(key)}</button>`,
   )
   .join("")}</div>
 <section><div class="section-heading"><div><h2>${icon("leaf")} ${t("home.growth")}</h2><p class="section-caption">a little better, a little happier.</p></div><button data-action="nav" data-page="growth">${t("home.completed", { done: completed, total: state().habits.length })} ›</button></div><div class="habit-list">${state()
   .habits.slice(0, 3)
   .map((habit) => habitRow(habit, dateKey()))
   .join(
     "",
   )}</div></section><section class="section"><div class="section-heading"><h2>${t("home.books")}</h2><button data-action="nav" data-page="books">${t("home.allBooks")}</button></div><div class="book-grid">${[
   ...state().books,
 ]
   .sort((a, b) => latestBook(b.id).localeCompare(latestBook(a.id)))
   .slice(0, 3)
   .map(bookCard)
   .join(
     "",
   )}</div></section><button class="studio-banner" data-action="edit-today"><div><h3>Journal Studio</h3><p>${t("home.studio")}</p></div><span class="sparkles">✧</span></button><p class="home-quote">Collect moments, grow gently.</p>`;
}

function latestBook(bookId) {
  return (
    state()
      .entries.filter((e) => e.bookId === bookId)
      .map((e) => e.updatedAt || "")
      .sort()
      .at(-1) || ""
  );
}
function memoryCard(entry) {
  return `<button class="memory-card" data-action="edit-date" data-date="${entry.date}">${safePhoto(entry.photo) ? `<img src="${esc(safePhoto(entry.photo))}" alt="${t("photo.alt")}">` : '<span class="empty-photo">✿</span>'}<div><strong>${esc(entry.title || t("entry.untitled"))} ${esc(entry.mood)}</strong><p>${esc(entry.body?.slice(0, 45) || t("entry.continue"))}<br>${shortDate(entry.date)} · ${t(entry.isDemo ? "entry.sample" : "entry.saved")}${entry.media?.length ? " · ♫ " + entry.media.length : ""}</p></div></button>`;
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
      total = state().checks.filter((c) => c.date === key).length;
    const mark =
      calendarMode === "memory"
        ? safePhoto(recorded?.photo)
          ? `<img src="${esc(safePhoto(recorded.photo))}" alt="${t("calendar.hasEntry")}">`
          : esc(recorded?.mood || "")
        : total
          ? `${total} ✦`
          : "";
    return `<button class="day-cell ${key === selectedDate ? "selected" : ""} ${key === dateKey() ? "today" : ""} ${key > dateKey() ? "future" : ""}" data-action="select-date" data-date="${key}" aria-label="${key}${recorded ? " " + t("calendar.hasEntry") : ""}" aria-pressed="${key === selectedDate}"><span>${new Intl.NumberFormat(locale()).format(i + 1)}</span><span class="day-mark">${mark}</span></button>`;
  }).join("");
  return `<header class="page-top"><div><h1 class="page-title">${t("calendar.title")}</h1><p class="page-subtitle">${t("calendar.subtitle")}</p></div><button class="icon-button" data-action="calendar-today" aria-label="${t("calendar.today")}">${icon("calendar")}</button></header><div class="segmented"><button data-action="calendar-mode" data-mode="memory" class="${calendarMode === "memory" ? "selected" : ""}">${t("calendar.memory")}</button><button data-action="calendar-mode" data-mode="growth" class="${calendarMode === "growth" ? "selected" : ""}">${t("calendar.growth")}</button></div><div class="month-controls"><button data-action="month" data-delta="-1" aria-label="${t("calendar.prev")}">${icon("back")}</button><h2>${month.toLocaleDateString(locale(), { month: "long", year: "numeric" })}</h2><button data-action="month" data-delta="1" aria-label="${t("calendar.next")}">${icon("arrow")}</button></div><div class="calendar-grid">${weekdays.map((d) => `<span class="weekday">${d}</span>`).join("")}${"<span></span>".repeat(offset)}${cells}</div><section class="date-summary"><div class="section-heading"><h3>${t(calendarMode === "memory" ? "calendar.dayTitle" : "calendar.growthTitle", { date: shortDate(selectedDate) })}</h3><button data-action="edit-date" data-date="${selectedDate}">${t(entry ? "calendar.edit" : "calendar.backfill")} ↗</button></div>${
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
              `<section class="growth-habit">${habitRow(h, today)}<p class="subtext">${t("growth.weekCount", { target: h.target, count: weeklyCount(state(), h.id, today) })}</p><div class="week-dots">${Array.from({ length: 7 }, (_, i) => `<span class="${state().checks.some((c) => c.habitId === h.id && c.date === addDays(start, i)) ? "complete" : ""}">${weekdays[i]}</span>`).join("")}</div></section>`,
          )
          .join("")}`,
    )
    .join(
      "",
    )}<button class="secondary full-width" data-action="new-habit">${t("growth.new")}</button><section class="milestone"><span>${state().checks.length >= 3 ? "🌼" : "🌱"}</span><h3>${t(state().checks.length >= 3 ? "growth.flower" : "growth.seed")}</h3><p>${t("growth.milestone", { count: state().checks.length })}${state().checks.length < 3 ? " · " + t("growth.remaining", { count: 3 - state().checks.length }) : ""}<br>${t("growth.linked")}</p><button class="secondary" data-action="growth-calendar">${t("growth.calendar")}</button></section>`;
}

function booksPage() {
  if (selectedBook) {
    const book = state().books.find((b) => b.id === selectedBook),
      entries = state()
        .entries.filter((e) => e.bookId === selectedBook)
        .sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="section-heading"><button class="back-button" data-action="all-books">${icon("back")} ${t("books.all")}</button><button class="secondary" data-action="edit-book" data-book="${esc(book.id)}">${t("edit")}</button></div><div class="book-detail-showcase">${coverHTML(book, ctx())}</div><div class="book-detail-copy"><h2>${esc(book.title)}</h2><p>${esc(book.description || "")}</p><span class="badge">${t("private")} · ${t("entry.count", { count: entries.length })}</span></div><button class="primary full-width" data-action="book-new-entry">${icon("plus")} ${t("books.addPage")}</button><p class="journal-list-caption">${t("books.memories")}</p>${entries.length ? entries.map((e) => `<div class="book-entry">${memoryCard(e)}</div>`).join("") : `<div class="empty">${t("books.empty")}</div>`}`;
  }
  return `<header class="page-top"><div><h1 class="page-title">${t("books.title")}</h1><p class="page-subtitle">${t("books.subtitle")}</p></div><button class="icon-button" data-action="new-book" aria-label="${t("books.new")}">${icon("plus")}</button></header><div class="book-grid books-full">${state().books.map(bookCard).join("")}</div><button class="secondary full-width" data-action="new-book">${t("books.create")}</button><p class="home-quote">A home for every little story.</p>`;
}

function canvasHTML() {
  const textStyle = editor.textStyle || {};
  return `<div class="journal-canvas ${esc(editor.template)}" id="journal-canvas" style="font-family:${esc(fontFamily(editor.font, catalog))}"><div class="canvas-photo">${safePhoto(editor.photo) ? `<img src="${esc(safePhoto(editor.photo))}" alt="${t("photo.alt")}">` : `<div class="photo-placeholder">📷<span>${t("photo.add")}</span></div>`}</div><div class="canvas-tape"></div><div class="canvas-title" style="${esc(textCSS(textStyle, editor.font, 20))}">${esc(editor.title || t("studio.titlePlaceholder"))}</div><div class="canvas-body" style="font-family:${esc(fontFamily(editor.bodyFont || editor.font, catalog))}">${esc(editor.body || t("studio.bodyPlaceholder"))}</div><span class="canvas-mood">${esc(editor.mood)}</span>${editor.layers.map((layer) => layerHTML(layer)).join("")}</div>`;
}

function layerControls() {
  const layer = editor.layers.find((l) => l.id === selectedLayer);
  if (!layer) return "";
  return `<div class="layer-controls"><span>${t("layer.selected")}</span>${[
    ["x", 5, 95, 1, "layer.x"],
    ["y", 5, 95, 1, "layer.y"],
    ["scale", 0.5, 2, 0.05, "layer.size"],
    ["rotation", -180, 180, 1, "layer.rotation"],
  ]
    .map(
      ([field, min, max, step, label]) =>
        `<label>${t(label)}<input type="range" data-layer-field="${field}" aria-label="${t(label)}" min="${min}" max="${max}" step="${step}" value="${layer[field]}"></label>`,
    )
    .join(
      "",
    )}${layer.kind === "text" ? `<label class="field">${t("layer.content")}<textarea data-layer-text="text" maxlength="300">${esc(layer.text)}</textarea></label><label class="field">${t("studio.font")}<select data-layer-text="fontId">${fontOptions(layer.fontId || editor.font)}</select></label><label>${t("studio.size")}<input data-layer-text="fontSize" type="range" min="10" max="50" value="${layer.fontSize || 16}"></label><label>${t("studio.weight")}<input data-layer-text="weight" type="range" min="100" max="900" step="100" value="${layer.weight || 400}"></label><label>${t("studio.spacing")}<input data-layer-text="spacing" type="range" min="0" max="5" step=".5" value="${layer.spacing || 0}"></label><label>${t("studio.textColor")}<input data-layer-text="color" type="color" value="${layer.color || "#2F2A26"}"></label><label>${t("layer.align")}<select data-layer-text="align">${["left", "center", "right"].map((a) => `<option value="${a}" ${(layer.align || "left") === a ? "selected" : ""}>${t("layer." + a)}</option>`).join("")}</select></label>` : ""}<div class="layer-buttons"><button data-action="layer-back">${t("layer.back")}</button><button data-action="layer-front">${t("layer.front")}</button><button data-action="layer-copy">${t("copy")}</button><button data-action="layer-delete">${t("delete")}</button></div></div>`;
}

function studioPage() {
  const book = state().books.find((b) => b.id === editor.bookId),
    style = editor.textStyle || {},
    categories = [...new Set(catalog.stickers.map((s) => s.category))];
  return `<header class="page-top studio-heading"><div><h1 class="page-title">${t("studio.title")}</h1><p class="page-subtitle">${t("studio.subtitle")}</p></div><button class="primary" data-action="save-entry">${t("save")} ${icon("check")}</button></header><div class="section-heading"><input class="date-input" type="date" id="editor-date" aria-label="${t("field.date")}" value="${editor.date}"><span class="badge">${t("studio.linked", { count: state().checks.filter((c) => c.date === editor.date).length })}</span></div><div class="segmented"><button data-action="editor-mode" data-mode="quick" class="${editorMode === "quick" ? "selected" : ""}">${t("studio.quick")}</button><button data-action="editor-mode" data-mode="creative" class="${editorMode === "creative" ? "selected" : ""}">${t("studio.creative")}</button></div><div class="draft-status" id="draft-status">${draftDirty ? t("正在保存草稿…") : state().drafts[editor.date] ? t("草稿已保存在本机") : t("studio.draftHint")}</div><div class="canvas-wrap" id="canvas-wrap">${canvasHTML()}</div><div class="editor-actions"><button data-action="upload">${icon("photo")} ${t(editor.photo ? "studio.replacePhoto" : "studio.addPhoto")}</button><button data-action="undo" ${history.length ? "" : "disabled"} aria-label="${t("studio.undo")}">${icon("undo")} ${t("studio.undo")}</button><button data-action="redo" ${future.length ? "" : "disabled"} aria-label="${t("studio.redo")}">${icon("redo")} ${t("studio.redo")}</button></div>
 <div class="editor-form"><label class="field">${t("studio.titleLabel")}<input id="entry-title" data-editor-field="title" placeholder="${t("studio.titlePlaceholder")}" maxlength="70" value="${esc(editor.title)}"></label><label class="field">${t("studio.bodyLabel")}<textarea id="entry-body" data-editor-field="body" maxlength="2000" placeholder="${t("studio.bodyPlaceholder")}">${esc(editor.body)}</textarea></label><label class="field">${t("studio.book")}<select data-editor-field="bookId" aria-label="${t("studio.book")}">${state()
   .books.map(
     (b) =>
       `<option value="${esc(b.id)}" ${b.id === editor.bookId ? "selected" : ""}>${esc(b.title)}</option>`,
   )
   .join(
     "",
   )}</select></label><label class="field">${t("studio.font")}<select data-editor-field="font" aria-label="${t("studio.font")}">${fontOptions(editor.font)}</select></label><div class="font-preview" style="font-family:${esc(fontFamily(editor.font, catalog))}">Little moments, 美好小日子。<small>${t("studio.fontPreview")}</small></div><label class="field">${t("studio.bodyFont")}<select data-editor-field="bodyFont">${fontOptions(editor.bodyFont || editor.font)}</select></label><div class="text-tools"><label>${t("studio.size")}<input data-text-style="size" type="range" min="12" max="40" value="${style.size || 20}"></label><label>${t("studio.textColor")}<input data-text-style="color" type="color" value="${style.color || "#2F2A26"}"></label><label>${t("studio.weight")}<input data-text-style="weight" type="range" min="100" max="900" step="100" value="${style.weight || 400}"></label><label>${t("studio.spacing")}<input data-text-style="spacing" type="range" min="0" max="5" step=".5" value="${style.spacing || 0}"></label></div><div><span class="small-label">${t("studio.mood")}</span><div class="mood-list">${features.moods.map((m) => `<button data-action="mood" data-mood="${m}" class="${editor.mood === m ? "selected" : ""}" aria-label="${t("studio.moodLabel", { mood: m })}" aria-pressed="${editor.mood === m}">${m}</button>`).join("")}</div></div><div><span class="small-label">${t("studio.paper")}</span><div class="segmented">${features.templates.map((template) => `<button data-action="template" data-template="${template.id}" class="${editor.template === template.id ? "selected" : ""}">${t("template." + template.id)}</button>`).join("")}</div></div></div>${customFieldsHTML(book, editor, ctx())}
 ${
   editorMode === "creative"
     ? `<section class="material-panel"><h3>${t("studio.materials")}</h3><div class="material-categories">${categories.map((category) => `<button data-action="material-category" data-category="${category}" class="${materialCategory === category ? "selected" : ""}">${t("category." + category)}</button>`).join("")}</div><div class="art-sticker-grid">${catalog.stickers
         .filter((s) => s.category === materialCategory)
         .map(
           (s) =>
             `<button data-action="asset-sticker" data-sticker="${s.id}" aria-label="${esc(languageCode() === "en" ? s.nameEn : s.nameZh)}"><img src="/library/stickers/${s.file}" alt=""><span>${esc(languageCode() === "en" ? s.nameEn : s.nameZh)}</span></button>`,
         )
         .join(
           "",
         )}</div><div class="editor-actions"><button data-action="add-text-layer">${t("studio.textBox")}</button><button data-action="collage-photo">${t("studio.collagePhoto")}</button></div>${layerControls()}</section>`
     : `<p class="save-help">${t("studio.quickHelp")}</p>`
 }${mediaPanelHTML(editor, ctx(), Boolean(recorder))}<div class="studio-footer"><button class="secondary" data-action="save-draft">${t("studio.saveDraft")}</button><button class="primary" data-action="export">${icon("download")} ${t("studio.export")}</button></div><p class="save-help">${t("studio.help")}</p>`;
}

function updateCanvas() {
  if ($("#canvas-wrap")) $("#canvas-wrap").innerHTML = canvasHTML();
  if ($(".font-preview"))
    $(".font-preview").style.fontFamily = fontFamily(editor.font, catalog);
  const undo = document.querySelector('[data-action="undo"]');
  const redo = document.querySelector('[data-action="redo"]');
  if (undo) undo.disabled = history.length === 0;
  if (redo) redo.disabled = future.length === 0;
}
function layerHTML(layer) {
  const image =
    layer.kind === "photo"
      ? safePhoto(layer.mediaRef)
      : layer.assetId
        ? stickerURL(layer.assetId, catalog)
        : "";
  return `<span class="layer ${image ? "art-layer" : ""} ${layer.kind === "text" ? "text-layer" : ""} ${selectedLayer === layer.id ? "active" : ""}" data-layer="${esc(layer.id)}" style="left:${Number(layer.x)}%;top:${Number(layer.y)}%;transform:translate(-50%,-50%) scale(${Number(layer.scale)}) rotate(${Number(layer.rotation)}deg);${layer.kind === "text" ? esc(textCSS({ size: layer.fontSize, color: layer.color, weight: layer.weight, spacing: layer.spacing }, layer.fontId || editor.font, 16)) + `;text-align:${["left", "center", "right"].includes(layer.align) ? layer.align : "left"}` : ""}" role="button" tabindex="0" aria-label="${esc(layer.text || t("layer.selected"))}">${image ? `<img src="${esc(image)}" alt="">` : esc(layer.text)}</span>`;
}

function textCSS(style, fontId, defaultSize) {
  const size = Math.max(10, Math.min(60, Number(style.size) || defaultSize)),
    color = /^#[0-9a-f]{6}$/i.test(style.color || "") ? style.color : "#2F2A26",
    weight = Math.max(100, Math.min(900, Number(style.weight) || 400)),
    spacing = Math.max(-2, Math.min(8, Number(style.spacing) || 0));
  return `font-family:${fontFamily(fontId, catalog)};font-size:${size / 3.2}cqw;color:${color};font-weight:${weight};letter-spacing:${spacing}px`;
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

function render() {
  const scrollTop = $("#app-scroll").scrollTop;
  $("#app").innerHTML = {
    home,
    calendar: calendarPage,
    growth: growthPage,
    books: booksPage,
    studio: studioPage,
    settings: () => settingsHTML(ctx()),
  }[page]();
  navigation();
  applyShellLanguage();
  $("#app-scroll").scrollTop = scrollTop;
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
function handleCheck(habitId, date) {
  const habit = state().habits.find((h) => h.id === habitId);
  const existing = state().checks.some(
    (c) => c.habitId === habitId && c.date === date,
  );
  if (!existing && habit.kind === "duration") {
    openDialog("duration", { habit, date });
    return;
  }
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
    ].includes(actionName)
  ) {
    toast(t("media.busy"));
    return;
  }
  if (await v3Action(target)) return;
  if (actionName === "nav") navigate(target.dataset.page);
  if (actionName === "edit-today") openStudio(dateKey());
  if (actionName === "quick-photo") {
    openStudio(dateKey());
    $("#photo-input").click();
  }
  if (actionName === "quick-text") {
    openStudio(dateKey());
    $("#entry-title").focus();
  }
  if (actionName === "quick-mood") {
    openStudio(dateKey());
    $(".mood-list").scrollIntoView({ block: "center", behavior: "smooth" });
  }
  if (actionName === "quick-growth") navigate("growth");
  if (actionName === "check")
    handleCheck(target.dataset.habit, target.dataset.date);
  if (actionName === "new-habit") openDialog("habit");
  if (actionName === "new-book") openDialog("book");
  if (actionName === "close-dialog") $("#form-dialog").close();
  if (actionName === "calendar-mode") {
    calendarMode = target.dataset.mode;
    render();
  }
  if (actionName === "select-date") {
    selectedDate = target.dataset.date;
    render();
  }
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
    changeEditor((e) => {
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
    changeEditor((e) => {
      e.layers = e.layers.filter((l) => l.id !== selectedLayer);
      selectedLayer = null;
    });
  if (actionName === "layer-front" || actionName === "layer-back")
    changeEditor((e) => {
      const layer = e.layers.find((l) => l.id === selectedLayer);
      e.layers = e.layers.filter((l) => l.id !== selectedLayer);
      if (actionName === "layer-front") e.layers.push(layer);
      else e.layers.unshift(layer);
    });
  if (actionName === "undo" && history.length) {
    future.push(structuredClone(editor));
    editor = history.pop();
    selectedLayer = null;
    scheduleDraft();
    render();
  }
  if (actionName === "redo" && future.length) {
    history.push(structuredClone(editor));
    editor = future.pop();
    selectedLayer = null;
    scheduleDraft();
    render();
  }
  if (actionName === "upload") $("#photo-input").click();
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
      !editor.layers.length
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
    await exportJournalImage(editor, {
      resolvePhoto: safePhoto,
      catalog,
      fontFamily,
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
    const layer = editor.layers.find((l) => l.id === selectedLayer);
    if (layer)
      changeEditor((e) => {
        e.layers.find((l) => l.id === selectedLayer)[
          target.dataset.layerField
        ] = Number(target.value);
      }, false);
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
$("#attachment-image-input").addEventListener("change", (event) =>
  handleImageUpload(event, attachmentTarget),
);
$("#video-input").addEventListener("change", (event) =>
  handleMediaUpload(event, "video"),
);
$("#audio-input").addEventListener("change", (event) =>
  handleMediaUpload(event, "audio"),
);
// Pointer capture keeps dragging reliable on both touch screens and a mouse.
let drag;
$("#app").addEventListener("pointerdown", (event) => {
  const target = event.target.closest("[data-layer]");
  if (!target || editorMode !== "creative") return;
  const layer = editor.layers.find((l) => l.id === target.dataset.layer);
  selectedLayer = layer.id;
  const rect = $("#journal-canvas").getBoundingClientRect();
  drag = {
    target,
    layer,
    rect,
    startX: event.clientX,
    startY: event.clientY,
    x: layer.x,
    y: layer.y,
    before: structuredClone(editor),
    moved: false,
  };
  target.classList.add("active");
  target.setPointerCapture(event.pointerId);
  event.preventDefault();
});
$("#app").addEventListener("pointermove", (event) => {
  if (!drag) return;
  const dx = ((event.clientX - drag.startX) / drag.rect.width) * 100,
    dy = ((event.clientY - drag.startY) / drag.rect.height) * 100;
  drag.layer.x = Math.max(5, Math.min(95, drag.x + dx));
  drag.layer.y = Math.max(5, Math.min(95, drag.y + dy));
  drag.target.style.left = `${drag.layer.x}%`;
  drag.target.style.top = `${drag.layer.y}%`;
  drag.moved ||= Math.abs(dx) + Math.abs(dy) > 1;
});
function endDrag() {
  if (!drag) return;
  if (drag.moved) {
    history.push(drag.before);
    if (history.length > 30) history.shift();
    future = [];
    scheduleDraft();
  }
  drag = null;
  render();
}
$("#app").addEventListener("pointerup", endDrag);
$("#app").addEventListener("pointercancel", endDrag);
$("#app").addEventListener("keydown", (event) => {
  const layer = event.target.closest("[data-layer]");
  if (layer && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    selectedLayer = layer.dataset.layer;
    render();
    $(".layer-controls")?.scrollIntoView({ block: "nearest" });
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
    if (!confirm(t("settings.restoreConfirm"))) return;
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
async function v3Action(target) {
  const name = target.dataset.action;
  if (busyMedia) {
    toast(t("media.busy"));
    return true;
  }
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
    changeEditor((entry) => {
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
    changeEditor((entry) => {
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
    changeEditor((entry) => {
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
    changeEditor((entry) => {
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
    changeEditor((entry) => {
      const layer = entry.layers.find((item) => item.id === selectedLayer);
      if (layer)
        layer[key] = ["fontSize", "weight", "spacing"].includes(key)
          ? Number(target.value)
          : target.value;
    }, false);
  }
}
function handleV3Change(event) {
  const target = event.target;
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
async function handleImageUpload(event, target) {
  const files = [...event.target.files];
  if (!files.length) return;
  if (busyMedia) {
    toast(t("media.busy"));
    event.target.value = "";
    return;
  }
  busyMedia = true;
  try {
    for (const file of files.slice(0, target?.kind === "collage" ? 8 : 1)) {
      const blob = await imageBlob(file),
        mediaId = await media.put(blob, { kind: "photo", name: file.name }),
        reference = `media:${mediaId}`;
      if (target?.kind === "cover") {
        bookDraft = readBookForm();
        bookDraft.coverImage = reference;
        refreshBookPreview();
      } else if (target?.kind === "field") {
        changeEditor((entry) => {
          entry.fieldValues[target.field] = reference;
        });
        flushDraft();
      } else if (target?.kind === "poster") {
        changeEditor((entry) => {
          const clip = entry.media.find((item) => item.id === target.clip);
          if (clip) clip.poster = reference;
        });
        flushDraft();
      } else if (target?.kind === "collage") {
        changeEditor((entry) => {
          const layer = {
            id: id(),
            kind: "photo",
            text: file.name,
            mediaRef: reference,
            x: 50,
            y: 40,
            scale: 1,
            rotation: 5,
          };
          entry.layers.push(layer);
          selectedLayer = layer.id;
        });
        flushDraft();
      } else {
        changeEditor((entry) => {
          entry.photo = reference;
        });
        flushDraft();
      }
    }
    toast(t(target?.kind === "cover" ? "media.saved" : "media.savedPhoto"));
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
async function attachClip(blob, kind, name, duration = 0) {
  const mediaId = await media.put(blob, { kind, name, duration });
  changeEditor((entry) => {
    entry.media.push({
      id: id(),
      kind,
      name,
      mime: blob.type,
      size: blob.size,
      duration,
      source: `media:${mediaId}`,
      poster: "",
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
          `${t("media.record")} · ${shortDate(editor.date)}`,
          Math.round((Date.now() - recordingStarted) / 1000),
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
      const response = await fetch(`/shared/${name}.json`);
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
