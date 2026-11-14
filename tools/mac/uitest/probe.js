// Debug-only probe for tools/mac/uitest (via -LittleDaysCheck): publishes the page state as an
// accessibility label "LDSTATE:{json}" that the UI test reads. Reads only.
const ev = { down: 0, up: 0, cancel: 0, appUp: 0, log: [] };
const rec = (s) => { ev.log.push(s); if (ev.log.length > 40) ev.log.shift(); };
document.addEventListener("pointerdown", (e) => { ev.down++; rec(`d${e.pointerId}:${e.pointerType}:${e.target.closest?.("[data-layer]") ? "L" : e.target.closest?.("#journal-canvas") ? "C" : e.target.closest?.("dialog") ? "D" : "-"}`); }, true);
document.addEventListener("pointerup", (e) => { ev.up++; rec(`u${e.pointerId}`); }, true);
document.addEventListener("pointercancel", (e) => { ev.cancel++; rec(`c${e.pointerId}`); }, true);
document.querySelector("#app").addEventListener("pointerup", () => ev.appUp++);
const box = document.createElement("div");
box.setAttribute("role", "img");
box.style.cssText = "position:fixed;left:0;top:0;width:4px;height:4px;opacity:0.02;pointer-events:none;z-index:2147483647";
document.documentElement.append(box);
const r = (sel) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return b.width ? [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] : null; };
const tick = () => {
  const host = document.querySelector("dialog[open]") || document.documentElement;
  if (box.parentNode !== host) host.append(box);
  let saved = -1, draftDrawings = -1;
  try { const s = JSON.parse(localStorage.getItem("little-days.v1") || "null"); const all = (e) => [e, ...(e.moments || [])].flatMap((p) => p.layers || []).filter((l) => l.drawing).length; saved = (s?.entries || []).reduce((n, e) => n + all(e), 0); draftDrawings = Object.values(s?.drafts || {}).reduce((n, e) => n + all(e), 0); } catch {}
  const st = { dlg: document.querySelector("dialog[open]")?.id || "", studio: !!document.querySelector(".studio-bar"), reader: !!document.querySelector(".reader-count, .reader-page"), ctx: document.querySelector(".tool-dock.ctx")?.dataset.ctx || "", sel: document.querySelector("#journal-canvas [data-layer].selected") ? 1 : 0,
    canvas: r("#journal-canvas"), drawing: r("#journal-canvas .drawing-layer"), drawCanvas: r("#draw-dialog[open] .draw-canvas"), drawDone: r('#draw-dialog[open] [data-draw="done"]'), skip: r(".sg-skip"), save: r('[data-action="save-entry"]'), again: r('[data-action="draw-edit"]'),
    text: r("#journal-canvas [data-layer] .layer-text"), back: r('.tool-dock.ctx [data-action="layer-deselect"]'), addText: r('.tool-dock:not(.ctx) [data-action="add-text-layer"]'),
    more: r('.tool-dock:not(.ctx) [data-tool="more"]'), drawNew: r('[data-action="draw-new"]'), drawCancel: r('#draw-dialog[open] [data-draw="cancel"]'),
    confirmOk: r("#confirm-dialog[open] #confirm-ok"), openDay: r('[data-action="open-day"]'),
    drawTile: r('[data-action="today-draw"]'), pagesManage: r('[data-action="pages-manage"]'), pageRemove: r('#choose-dialog[open] [data-action="page-remove"]'),
    editDate: r('.day-detail-top [data-action="edit-date"]'), navCal: r('#navigation [data-page="calendar"]'), navHome: r('#navigation [data-page="home"]'), readerBack: r('[data-action="reader-back"]'),
    todayCell: r('[data-action="select-date"].today'), restore: r('.summary-actions [data-action="day-restore"]'), calendar: !!document.querySelector(".calendar-grid"),
    navBooks: r('#navigation [data-page="books"]'), shelfSpine: r('[data-action="pull-book"]'), shelfBook: r('[data-action="book"]'), bookMusic: r('.book-music [data-action="music-sheet"]'),
    musicPreview: r('#choose-dialog[open] [data-action="music-preview"]'), musicVolume: r('#choose-dialog[open] [data-music-volume]'),
    bgmPlaying: !!(document.querySelector("#background-music") && !document.querySelector("#background-music").paused), bgmGain: document.querySelector("#background-music")?.dataset.gain || "",
    volOut: document.querySelector("#choose-dialog[open] .music-volume output")?.textContent || "",
    confirmText: document.querySelector("#confirm-dialog[open] #confirm-message")?.textContent || "",
    dayInk: [...document.querySelectorAll(".chapter-canvas .drawing-layer img")].filter((i) => i.complete && i.naturalWidth > 0).length,
    saved, draftDrawings, down: ev.down, up: ev.up, cancel: ev.cancel, appUp: ev.appUp, log: ev.log.slice(-8).join(" ") };
  box.setAttribute("aria-label", "LDSTATE:" + JSON.stringify(st));
};
setInterval(tick, 200); tick();
return "probe on";
