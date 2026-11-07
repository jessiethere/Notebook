import { loadImage, exportJournalImage } from "./js/export.mjs";
import {
  Store,
  dateKey,
  addDays,
  weekStart,
  weeklyCount,
  toggleCheck,
  saveEntry,
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
  new Date(`${key}T12:00:00`).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
const shortDate = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });
const themeIcon = (theme) =>
  ({ Learning: "📖", Fitness: "🌿", Wellness: "☁️", "Creative Life": "🎨" })[
    theme
  ] || "🌱";
const safePhoto = (photo) =>
  typeof photo === "string" &&
  (photo.startsWith("/assets/") ||
    /^data:image\/(jpeg|png|webp);base64,/.test(photo))
    ? photo
    : "";
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
  if ($("#draft-status")) $("#draft-status").textContent = "草稿已保存在本机";
}
function scheduleDraft() {
  draftDirty = true;
  if ($("#draft-status")) $("#draft-status").textContent = "正在保存草稿…";
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try {
      flushDraft();
    } catch {
      toast("保存失败：浏览器空间不足，请先导出图片或备份记录。");
      if ($("#draft-status"))
        $("#draft-status").textContent = "草稿未保存，请勿关闭页面";
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
        `<button class="nav-item ${tab.id === page ? "active" : ""} ${tab.id}" data-action="nav" data-page="${tab.id}" aria-label="${esc(tab.title)} ${esc(tab.subtitle)}" ${tab.id === page ? 'aria-current="page"' : ""}>${icon(tab.symbol)}<span>${esc(tab.title)}</span></button>`,
    )
    .join("");
}
function habitRow(habit, date) {
  const done = state().checks.find(
    (check) => check.habitId === habit.id && check.date === date,
  );
  return `<div class="habit-row"><span class="habit-symbol">${themeIcon(habit.theme)}</span><div class="habit-detail"><strong>${esc(habit.title)}</strong><small>${esc(habit.theme)} · ${habit.kind === "duration" ? `${done?.minutes || habit.minutes} min` : "一点点，也算进步"}</small></div><button class="check-button ${done ? "done" : ""}" data-action="check" data-habit="${esc(habit.id)}" data-date="${date}" aria-label="${done ? "取消" : "完成"} ${esc(habit.title)}" aria-pressed="${Boolean(done)}">${done ? icon("check") : ""}</button></div>`;
}
function bookCard(book) {
  const count = state().entries.filter(
    (entry) => entry.bookId === book.id,
  ).length;
  return `<button class="book-item" data-action="book" data-book="${esc(book.id)}"><div class="book-cover" style="background:var(--${["blush", "sage", "butter", "blue"].includes(book.color) ? book.color : "blush"})">${esc(book.cover)}</div><strong>${esc(book.title)}</strong><small>${esc(book.category)} · ${count} 篇</small></button>`;
}
function home() {
  const entry = todayEntry();
  const completed = state().checks.filter(
    (check) => check.date === dateKey(),
  ).length;
  const englishDate = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
  return `<header class="brand-row"><div><div class="brand-title"><span class="flower">✿</span>Little Days</div><p class="brand-subtitle">手 帐 文 具 店</p></div><button class="icon-button" data-action="nav" data-page="calendar" aria-label="打开日历">${icon("calendar")}</button></header>
  <div class="date-label">${englishDate}</div><h1 class="greeting">今天，也有小美好。<span class="sun">☀</span></h1><p class="subtext">记录生活，也记录一点点变好的自己。</p>
  <section class="hero"><div class="hero-top"><span>✧ &nbsp; TODAY'S LITTLE MOMENT</span><button data-action="edit-today">${entry ? "继续记录" : "开始记录"} ↗</button></div><div class="hero-content"><div class="polaroid">${safePhoto(entry?.photo) ? `<img src="${esc(safePhoto(entry.photo))}" alt="今日手帐照片">` : '<div class="photo-placeholder">📷<span>留下今天的一瞬</span></div>'}</div><div class="hero-copy"><span class="scribble">slow down, feel more.</span><h3>${esc(entry?.title || "为今天，\n留一点位置。")}</h3><p>${esc(entry?.body?.slice(0, 48) || "一张照片，一句心情。\n平凡的日子也值得被收藏。")}</p></div></div><span class="hero-flower">🌼</span>${entry?.isDemo ? '<span class="tiny-demo">示例手帐 · 可编辑</span>' : ""}</section>
  <div class="quick-actions">${[
    ["photo", "添加照片", "quick-photo"],
    ["text", "写点什么", "quick-text"],
    ["smile", "今日心情", "quick-mood"],
    ["leaf", "成长打卡", "quick-growth"],
  ]
    .map(
      ([symbol, label, action]) =>
        `<button class="quick-action" data-action="${action}"><span class="quick-icon">${icon(symbol)}</span>${label}</button>`,
    )
    .join("")}</div>
  <section><div class="section-heading"><div><h2>${icon("leaf")} 今天的小小成长</h2><p class="section-caption">a little better, a little happier.</p></div><button data-action="nav" data-page="growth">${completed}/${state().habits.length} 已完成 &nbsp; ›</button></div><div class="habit-list">${state()
    .habits.slice(0, 3)
    .map((habit) => habitRow(habit, dateKey()))
    .join("")}</div></section>
  <section class="section"><div class="section-heading"><h2>我的手帐本</h2><button data-action="nav" data-page="books">查看全部 ›</button></div><div class="book-grid">${[
    ...state().books,
  ]
    .sort((a, b) => latestBook(b.id).localeCompare(latestBook(a.id)))
    .slice(0, 3)
    .map(bookCard)
    .join("")}</div></section>
  <button class="studio-banner" data-action="edit-today"><div><h3>Journal Studio</h3><p>把今天，拼贴成喜欢的样子 &nbsp; ↗</p></div><span class="sparkles">✧</span></button><p class="home-quote">Collect moments, grow gently.</p>`;
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
  return `<button class="memory-card" data-action="edit-date" data-date="${entry.date}">${safePhoto(entry.photo) ? `<img src="${esc(safePhoto(entry.photo))}" alt="手帐照片">` : '<span class="empty-photo">✿</span>'}<div><strong>${esc(entry.title || "未命名的小日子")} ${esc(entry.mood)}</strong><p>${esc(entry.body?.slice(0, 45) || "点击继续记录")}<br>${shortDate(entry.date)} · ${entry.isDemo ? "示例" : "已保存"}</p></div></button>`;
}
function calendarPage() {
  const year = month.getFullYear(),
    monthIndex = month.getMonth();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const entry = state().entries.find((e) => e.date === selectedDate);
  const checks = state().checks.filter((c) => c.date === selectedDate);
  const cells = Array.from({ length: count }, (_, i) => {
    const key = dateKey(new Date(year, monthIndex, i + 1));
    const recorded = state().entries.find((e) => e.date === key);
    const total = state().checks.filter((c) => c.date === key).length;
    const mark =
      calendarMode === "memory"
        ? safePhoto(recorded?.photo)
          ? `<img src="${esc(safePhoto(recorded.photo))}" alt="有手帐">`
          : esc(recorded?.mood || "")
        : total
          ? `${total} ✦`
          : "";
    return `<button class="day-cell ${key === selectedDate ? "selected" : ""} ${key === dateKey() ? "today" : ""} ${key > dateKey() ? "future" : ""}" data-action="select-date" data-date="${key}" aria-label="${key}${recorded ? " 有手帐" : ""}" aria-pressed="${key === selectedDate}"><span>${i + 1}</span><span class="day-mark">${mark}</span></button>`;
  }).join("");
  return `<header class="page-top"><div><h1 class="page-title">Calendar</h1><p class="page-subtitle">每个日子，都值得被记住。</p></div><button class="icon-button" data-action="calendar-today" aria-label="回到今天">${icon("calendar")}</button></header><div class="segmented"><button data-action="calendar-mode" data-mode="memory" class="${calendarMode === "memory" ? "selected" : ""}">Memory · 生活记忆</button><button data-action="calendar-mode" data-mode="growth" class="${calendarMode === "growth" ? "selected" : ""}">Growth · 成长轨迹</button></div>
  <div class="month-controls"><button data-action="month" data-delta="-1" aria-label="上个月">${icon("back")}</button><h2>${month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><button data-action="month" data-delta="1" aria-label="下个月">${icon("arrow")}</button></div><div class="calendar-grid">${["一", "二", "三", "四", "五", "六", "日"].map((d) => `<span class="weekday">${d}</span>`).join("")}${"<span></span>".repeat(offset)}${cells}</div>
  <section class="date-summary"><div class="section-heading"><h3>${shortDate(selectedDate)} 的${calendarMode === "memory" ? "小日子" : "小成长"}</h3><button data-action="edit-date" data-date="${selectedDate}">${entry ? "编辑记录" : "补记这一天"} ↗</button></div>${
    calendarMode === "memory"
      ? entry
        ? memoryCard(entry)
        : `<div class="empty">这一天的故事，还在等你写下。<br><button class="primary" data-action="edit-date" data-date="${selectedDate}">${icon("plus")} 记录这一天</button></div>`
      : `<p class="subtext">已完成 ${checks.length} 项习惯，与当天手帐共用日期。</p>${state()
          .habits.map((h) => habitRow(h, selectedDate))
          .join("")}`
  }</section><p class="home-quote">Some days become memories. All days become you.</p>`;
}
function growthPage() {
  const today = dateKey(),
    start = weekStart(today);
  const total = state().habits.reduce(
    (sum, h) => sum + Math.min(weeklyCount(state(), h.id, today), h.target),
    0,
  );
  const target = state().habits.reduce((sum, h) => sum + h.target, 0);
  const themes = [...new Set(state().habits.map((h) => h.theme))];
  return `<header class="page-top"><div><h1 class="page-title">Grow gently.</h1><p class="page-subtitle">一点一点，成为更喜欢的自己。</p></div><button class="icon-button" data-action="new-habit" aria-label="添加习惯">${icon("plus")}</button></header><section class="growth-intro"><h2>不赶路，慢慢长大。🌱</h2><p>每一次小小的坚持，都在悄悄发光。</p><div class="progress-track"><span style="width:${target ? Math.min(100, (total / target) * 100) : 0}%"></span></div><div class="progress-caption"><span>本周的小目标</span><span>${total} / ${target} 次</span></div></section>${themes
    .map(
      (theme) =>
        `<div class="theme-header">${esc(theme.toUpperCase())}</div>${state()
          .habits.filter((h) => h.theme === theme)
          .map(
            (h) =>
              `<section class="growth-habit">${habitRow(h, today)}<p class="subtext">每周 ${h.target} 次 · 已完成 ${weeklyCount(state(), h.id, today)} 次</p><div class="week-dots">${Array.from({ length: 7 }, (_, i) => `<span class="${state().checks.some((c) => c.habitId === h.id && c.date === addDays(start, i)) ? "complete" : ""}">${["一", "二", "三", "四", "五", "六", "日"][i]}</span>`).join("")}</div></section>`,
          )
          .join("")}`,
    )
    .join(
      "",
    )}<button class="secondary" style="width:100%;margin-top:10px" data-action="new-habit">＋ 创建我的小习惯</button><section class="milestone"><span>${state().checks.length >= 3 ? "🌼" : "🌱"}</span><h3>${state().checks.length >= 3 ? "第一朵小花，已经盛开" : "每次坚持，都是一颗种子"}</h3><p>累计 ${state().checks.length} 次成长记录${state().checks.length < 3 ? ` · 再记录 ${3 - state().checks.length} 次，点亮第一朵花` : " · 继续收集下一份成长"}<br>打卡会自动出现在对应日期的成长日历里。</p><button class="text-link secondary" style="margin-top:12px" data-action="growth-calendar">查看成长日历</button></section>`;
}
function booksPage() {
  if (selectedBook) {
    const book = state().books.find((b) => b.id === selectedBook);
    const entries = state()
      .entries.filter((e) => e.bookId === selectedBook)
      .sort((a, b) => b.date.localeCompare(a.date));
    return `<button class="back-button" data-action="all-books">${icon("back")} 全部手帐本</button><div class="book-detail-header" style="background:var(--${["blush", "sage", "butter", "blue"].includes(book.color) ? book.color : "blush"})"><div class="cover-emoji">${esc(book.cover)}</div><h2>${esc(book.title)}</h2><p>${esc(book.category)} · ${entries.length} 篇记忆</p></div><button class="primary" style="width:100%" data-action="book-new-entry">${icon("plus")} 记录新的一页</button><p class="journal-list-caption">收藏在这里的小日子</p>${entries.length ? entries.map((e) => `<div class="book-entry">${memoryCard(e)}</div>`).join("") : '<div class="empty">手帐本的第一页，等你来写。</div>'}`;
  }
  return `<header class="page-top"><div><h1 class="page-title">My Books</h1><p class="page-subtitle">给每一种热爱，一本小小的收藏。</p></div><button class="icon-button" data-action="new-book" aria-label="创建手帐本">${icon("plus")}</button></header><div class="book-grid books-full">${state().books.map(bookCard).join("")}</div><button class="secondary" style="width:100%;margin-top:28px" data-action="new-book">＋ 创建一本新手帐</button><p class="home-quote">A home for every little story.</p>`;
}
function canvasHTML() {
  return `<div class="journal-canvas ${esc(editor.template)} font-${esc(editor.font)}" id="journal-canvas"><div class="canvas-photo">${safePhoto(editor.photo) ? `<img src="${esc(safePhoto(editor.photo))}" alt="手帐照片">` : '<div class="photo-placeholder">📷<span>添加一张喜欢的照片</span></div>'}</div><div class="canvas-tape"></div><div class="canvas-title">${esc(editor.title || "今天的小美好")}</div><div class="canvas-body">${esc(editor.body || "写下一点点值得收藏的日常。")}</div><span class="canvas-mood">${esc(editor.mood)}</span>${editor.layers.map((layer) => `<span class="layer ${selectedLayer === layer.id ? "active" : ""}" data-layer="${esc(layer.id)}" style="left:${layer.x}%;top:${layer.y}%;transform:translate(-50%,-50%) scale(${layer.scale}) rotate(${layer.rotation}deg)" role="button" tabindex="0" aria-label="选择贴纸 ${esc(layer.text)}">${esc(layer.text)}</span>`).join("")}</div>`;
}
function layerControls() {
  const layer = editor.layers.find((l) => l.id === selectedLayer);
  return layer
    ? `<div class="layer-controls"><span>已选贴纸 ${esc(layer.text)} · 在纸上拖动，或调整下方参数</span><label>横向位置<input type="range" data-layer-field="x" aria-label="贴纸横向位置" min="5" max="95" value="${layer.x}"></label><label>纵向位置<input type="range" data-layer-field="y" aria-label="贴纸纵向位置" min="5" max="95" value="${layer.y}"></label><label>大小<input type="range" data-layer-field="scale" aria-label="贴纸大小" min="0.5" max="2" step="0.05" value="${layer.scale}"></label><label>旋转<input type="range" data-layer-field="rotation" aria-label="贴纸旋转" min="-180" max="180" value="${layer.rotation}"></label><div class="layer-buttons"><button data-action="layer-back">移到下层</button><button data-action="layer-front">移到上层</button><button data-action="layer-delete">删除贴纸</button></div></div>`
    : "";
}
function studioPage() {
  return `<header class="page-top studio-heading"><div><h1 class="page-title">Journal Studio</h1><p class="page-subtitle">让今天，成为一张喜欢的手帐。</p></div><button class="primary" data-action="save-entry">保存 ${icon("check")}</button></header><div class="section-heading"><input class="date-input" type="date" id="editor-date" aria-label="手帐日期" value="${editor.date}"><span class="badge">${state().checks.filter((c) => c.date === editor.date).length} 项成长已关联</span></div><div class="segmented"><button data-action="editor-mode" data-mode="quick" class="${editorMode === "quick" ? "selected" : ""}">✧ Quick Create</button><button data-action="editor-mode" data-mode="creative" class="${editorMode === "creative" ? "selected" : ""}">✿ Creative Mode</button></div><div class="draft-status" id="draft-status">${state().drafts[editor.date] ? "已恢复本机草稿" : "改动将自动保存为草稿"}</div><div class="canvas-wrap" id="canvas-wrap">${canvasHTML()}</div><div class="editor-actions"><button data-action="upload">${icon("photo")} ${editor.photo ? "替换照片" : "添加照片"}</button><button data-action="undo" ${history.length ? "" : "disabled"} aria-label="撤销">${icon("undo")} 撤销</button><button data-action="redo" ${future.length ? "" : "disabled"} aria-label="重做">${icon("redo")} 重做</button></div>
  <div class="editor-form"><label class="field">给今天取个名字<input id="entry-title" data-editor-field="title" placeholder="今天的小美好" maxlength="70" value="${esc(editor.title)}"></label><label class="field">写点什么<textarea id="entry-body" data-editor-field="body" maxlength="2000" placeholder="收集一个小小的瞬间…">${esc(editor.body)}</textarea></label><div class="field-row"><label class="field">放进手帐本<select data-editor-field="bookId" aria-label="手帐本">${state()
    .books.map(
      (b) =>
        `<option value="${esc(b.id)}" ${b.id === editor.bookId ? "selected" : ""}>${esc(b.title)}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="field">字体<select data-editor-field="font" aria-label="字体">${[
    ["serif", "温柔宋体"],
    ["rounded", "可爱圆体"],
    ["system", "简约黑体"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${editor.font === v ? "selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></label></div><div><span class="small-label">今天的心情</span><div class="mood-list">${features.moods.map((m) => `<button data-action="mood" data-mood="${m}" class="${editor.mood === m ? "selected" : ""}" aria-label="心情 ${m}" aria-pressed="${editor.mood === m}">${m}</button>`).join("")}</div></div><div><span class="small-label">纸张与模板</span><div class="segmented" style="margin-top:9px">${features.templates.map((t) => `<button data-action="template" data-template="${t.id}" class="${editor.template === t.id ? "selected" : ""}">${t.title}</button>`).join("")}</div></div></div>
  ${editorMode === "creative" ? `<section class="material-panel"><h3>小小素材铺 · 贴纸</h3><div class="segmented">${features.templates.map((t) => `<button data-action="material-style" data-style="${t.id}" class="${materialStyle === t.id ? "selected" : ""}">${t.title}</button>`).join("")}</div><div class="sticker-grid">${features.stickers[materialStyle].map((s) => `<button data-action="sticker" data-sticker="${esc(s)}" aria-label="添加贴纸 ${esc(s)}">${esc(s)}</button>`).join("")}</div>${layerControls()}</section>` : '<p class="save-help">选一张照片，写一句心情，即可自动排版。</p>'}<div class="studio-footer"><button class="secondary" data-action="save-draft">保存草稿</button><button class="primary" data-action="export">${icon("download")} 导出图片</button></div><p class="save-help">照片与草稿只保存在此浏览器，尚未同步到 iPhone。<br>贴纸可拖动；照片自由裁切与变换将在下一阶段加入。</p>`;
}
function updateCanvas() {
  if ($("#canvas-wrap")) $("#canvas-wrap").innerHTML = canvasHTML();
  const undo = document.querySelector('[data-action="undo"]');
  const redo = document.querySelector('[data-action="redo"]');
  if (undo) undo.disabled = history.length === 0;
  if (redo) redo.disabled = future.length === 0;
}
function render() {
  const scrollTop = $("#app-scroll").scrollTop;
  $("#app").innerHTML = {
    home,
    calendar: calendarPage,
    growth: growthPage,
    books: booksPage,
    studio: studioPage,
  }[page]();
  navigation();
  $("#app-scroll").scrollTop = scrollTop;
}
function openDialog(kind, payload = null) {
  dialogKind = kind;
  dialogPayload = payload;
  let title, description, fields;
  if (kind === "habit") {
    title = "Plant a little habit";
    description = "为喜欢的自己，种下一颗小种子。主题可以自定义。";
    fields = `<label class="field">习惯名称<input name="title" required maxlength="40" placeholder="例如：练习十分钟法语"></label><label class="field">成长主题<input name="theme" required maxlength="30" list="theme-options" value="Learning"><datalist id="theme-options">${["Fitness", "Learning", "Wellness", "Creative Life"].map((t) => `<option value="${t}">`).join("")}</datalist></label><div class="field-row"><label class="field">记录类型<select name="kind"><option value="completion">完成型</option><option value="duration">时长型</option></select></label><label class="field">每周目标（次）<input name="target" type="number" min="1" max="7" value="3" required></label></div><label class="field">默认时长（分钟，时长型适用）<input name="minutes" type="number" min="1" max="1440" value="20" required></label>`;
  } else if (kind === "duration") {
    title = "A moment for you";
    description = `${payload.habit.title} · ${shortDate(payload.date)}`;
    fields = `<label class="field">今天投入了多少分钟？<input name="minutes" type="number" min="1" max="1440" value="${payload.habit.minutes || 20}" required></label>`;
  } else {
    title = "A new little book";
    description = "给生活的一种热爱，留一本专属手帐。";
    fields = `<label class="field">手帐本名称<input name="title" required maxlength="40" placeholder="例如：周末散步计划"></label><label class="field">主题<input name="category" required maxlength="30" value="Daily Life"></label><div class="field-row"><label class="field">封面图案<select name="cover"><option>🌷</option><option>🏔️</option><option>🥐</option><option>🐰</option><option>🍓</option><option>☕</option></select></label><label class="field">封面颜色<select name="color"><option value="blush">Blush Pink</option><option value="sage">Sage Green</option><option value="butter">Butter Yellow</option><option value="blue">Powder Blue</option></select></label></div>`;
  }
  $("#dialog-form").innerHTML =
    `<h2>${title}</h2><p class="dialog-description">${esc(description)}</p><div class="dialog-fields">${fields}</div><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">取消</button><button type="submit" class="primary">${kind === "duration" ? "记录这次成长" : "创建"}</button></div>`;
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
  toast(existing ? "这次打卡已取消" : "收集到一份小小的成长 🌱");
}
async function action(target) {
  const actionName = target.dataset.action;
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
    toast("草稿已保存，下次从 Studio 继续。");
  }
  if (actionName === "save-entry") {
    if (!editor.title.trim() && !editor.body.trim() && !editor.photo) {
      toast("先留下一张照片，或者写点什么吧。");
      return;
    }
    clearTimeout(draftTimer);
    store.update((s) => saveEntry(s, editor));
    draftDirty = false;
    toast("这一天，已经好好收藏。🌷");
    navigate("home");
  }
  if (actionName === "export") {
    await exportJournalImage(editor);
    toast("手帐图片已导出（基础排版版本）。");
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (target)
    action(target).catch((error) => {
      console.error(error);
      toast("操作未保存，请检查浏览器存储空间后重试。");
    });
});
document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.dataset.editorField) {
    try {
      changeEditor((e) => {
        e[target.dataset.editorField] = target.value;
      }, false);
    } catch {
      toast("编辑失败，请重试。");
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
  if (event.target.id === "editor-date" && event.target.value) {
    try {
      openStudio(event.target.value);
    } catch {
      toast("旧草稿未保存，暂不能切换日期。");
    }
  }
});
$("#dialog-form").addEventListener("submit", (event) => {
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
        ? "成长已记录，也已关联当天日期 🌱"
        : "新的小期待，已准备好。",
    );
  } catch {
    toast("保存失败，请检查本机存储空间。");
  }
});
$("#photo-input").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024)
      throw new Error("请选择小于 20 MB 的图片。");
    const source = URL.createObjectURL(file);
    let image;
    try {
      image = await loadImage(source);
    } finally {
      URL.revokeObjectURL(source);
    }
    const canvas = document.createElement("canvas"),
      factor = Math.min(1, 1000 / Math.max(image.width, image.height));
    canvas.width = Math.round(image.width * factor);
    canvas.height = Math.round(image.height * factor);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg", 0.82);
    changeEditor((e) => {
      e.photo = photo;
    });
    flushDraft();
    toast("照片已加入，也已保存到草稿。");
  } catch (error) {
    toast(
      error.message.includes("20 MB")
        ? error.message
        : "图片未保存，请使用 JPG/PNG 并确认浏览器空间充足。",
    );
  } finally {
    event.target.value = "";
  }
});
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
    flushDraft();
  } catch {
    event.preventDefault();
    event.returnValue = "";
  }
});
async function start() {
  const responses = await Promise.all(
    ["design-tokens", "features", "seed"].map(async (name) => {
      const response = await fetch(`/shared/${name}.json`);
      if (!response.ok) throw new Error("共享配置加载失败");
      return response.json();
    }),
  );
  [tokens, features] = responses;
  for (const [name, color] of Object.entries(tokens.colors))
    document.documentElement.style.setProperty(`--${name}`, color);
  store = new Store(localStorage, responses[2]);
  $("#clock").textContent = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  render();
}
start().catch((error) => {
  $("#app").innerHTML =
    `<div class="error-panel"><h1>文具店暂时没能打开</h1><p>${esc(error.message)}</p><p>请通过 localhost 启动，并允许浏览器本地存储。已有记录不会自动清除。</p></div>`;
});
