// Hand drawing on the page (手绘): a full-screen board over the page being
// written. Finger, mouse or Apple Pencil (pressure sets the pen width; once a
// pencil is used, touches from the palm are ignored). The result is a PNG
// trimmed to what was drawn, placed back on the page as a movable picture.
// Nothing is uploaded: the caller keeps the PNG in this device's media store.

export const PAGE_W = 1080;
export const PAGE_H = 1350;
export const DRAW_COLORS = ["#2b2622", "#6f675d", "#7d8e66", "#b5838d", "#d9534f", "#c08b5c", "#e7b93f", "#6d8299", "#8e7cc3", "#ffffff"];
export const DRAW_TOOLS = ["pen", "marker", "pencil", "eraser"];

// The look of each tool at a given size (1–24) and pressure (0–1).
export function brush(tool, size, pressure = 0.5) {
  const s = Math.max(1, Math.min(24, Number(size) || 6));
  const p = Math.max(0.05, Math.min(1, Number(pressure) || 0.5));
  switch (tool) {
    case "marker":
      return { width: s * 4.2, alpha: 0.38, cap: "round" };
    case "pencil":
      return { width: s * 0.9 * (0.6 + p * 0.8), alpha: 0.78, cap: "round" };
    case "eraser":
      return { width: s * 5, alpha: 1, cap: "round", erase: true };
    default:
      return { width: s * 1.6 * (0.45 + p * 1.1), alpha: 1, cap: "round" };
  }
}

// The box (in page pixels) around everything that is not transparent, with a
// little margin; null when the board is empty.
export function inkBounds(data, width, height, pad = 14) {
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++)
      if (data[row + x * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  }
  if (maxX < 0) return null;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// Where a trimmed drawing sits on the page, as a picture layer (percent of
// the page; x / y are the centre).
export function boxToLayer(box) {
  const r = (n) => Math.round(n * 100) / 100;
  return {
    x: r(((box.x + box.w / 2) / PAGE_W) * 100),
    y: r(((box.y + box.h / 2) / PAGE_H) * 100),
    w: r((box.w / PAGE_W) * 100),
    h: r((box.h / PAGE_H) * 100),
  };
}

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

// Opens the board. `background` is the page drawn read-only underneath (HTML);
// `base` an earlier drawing to keep working on ({ src, x, y, w, h, scale,
// rotation } in layer units). Resolves { blob, layer } | { empty: true } | null.
// `confirmDiscard` (optional, async → boolean): asked before 取消 throws away
// strokes that are not on the page yet (V10.46). An earlier drawing being
// edited is never touched by 取消.
// The one-time tip (instead of a note that is always there).
const TIP_KEY = "little-days.drawTip";
function tipSeen() {
  try {
    return localStorage.getItem(TIP_KEY) === "seen";
  } catch {
    return true;
  }
}
function markTip() {
  try {
    localStorage.setItem(TIP_KEY, "seen");
  } catch {}
}
export function openDrawBoard({ dialog, background = "", base = null, t, confirmDiscard = null }) {
  return new Promise((resolve) => {
    let tool = "pen",
      color = DRAW_COLORS[0],
      size = 6,
      strokes = [],
      undone = [],
      // Undo history: a stroke, or a whole clear (so 清空画布 can be undone).
      history = [],
      current = null,
      penSeen = false,
      baseImage = null,
      finished = false;
    const swatch = (c) => `<button type="button" data-draw-color="${c}" style="--swatch:${c}" aria-label="${c}" aria-pressed="${c === color}" class="${c === color ? "selected" : ""}"></button>`;
    const toolButton = (id) => `<button type="button" data-draw-tool="${id}" aria-pressed="${id === tool}" class="${id === tool ? "selected" : ""}"><i class="draw-glyph draw-${id}" aria-hidden="true"></i><span>${t("draw." + id)}</span></button>`;
    // V10.57: a quiet close (×) on the left, 手绘 in the middle, 完成 on the
    // right; compact tools with their names; colours in one small row; size
    // with a live dot; undo / redo as matching icons; 清空画布 in ··· (asks
    // first, and can be undone). The long note is now a one-time tip.
    const icon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
    const UNDO = icon('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>');
    const REDO = icon('<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>');
    const tip = !tipSeen() ? `<p class="draw-tip" role="note"><span>${t("draw.tip")}</span><button type="button" data-draw="tip-ok" aria-label="${t("draw.tipOk")}">×</button></p>` : "";
    dialog.innerHTML = `<div class="draw-sheet"><header class="draw-top"><button type="button" class="draw-cancel draw-x" data-draw="cancel" aria-label="${t("cancel")}">×</button><b>${t("draw.title")}</b><button type="button" class="primary small" data-draw="done">${t("draw.done")}</button></header><div class="draw-stage"><div class="draw-page"><div class="draw-under" aria-hidden="true">${background}</div><canvas class="draw-canvas" width="${PAGE_W}" height="${PAGE_H}" aria-label="${t("draw.canvas")}"></canvas><canvas class="draw-live" width="${PAGE_W}" height="${PAGE_H}" aria-hidden="true"></canvas></div></div><div class="draw-tools">${tip}<div class="draw-pens" role="group" aria-label="${t("draw.tools")}">${DRAW_TOOLS.map(toolButton).join("")}</div><div class="draw-colors" role="group" aria-label="${t("draw.colors")}">${DRAW_COLORS.map(swatch).join("")}</div><div class="draw-row"><label class="draw-size"><span>${t("draw.size")}</span><input type="range" min="1" max="24" step="1" value="${size}" data-draw-size aria-label="${t("draw.size")}"><i class="draw-dot" aria-hidden="true"></i></label><span class="draw-history"><button type="button" class="draw-icon" data-draw="undo" aria-label="${t("studio.undo")}">${UNDO}</button><button type="button" class="draw-icon" data-draw="redo" aria-label="${t("studio.redo")}">${REDO}</button><button type="button" class="draw-icon draw-more" data-draw="more" aria-label="${t("draw.more")}" aria-haspopup="menu" aria-expanded="false">···</button></span></div><div class="draw-menu" role="menu" hidden><button type="button" role="menuitem" class="danger-text" data-draw="clear">${t("draw.clearAll")}</button></div></div><div class="draw-ask" hidden></div></div>`;
    const board = dialog.querySelector(".draw-canvas"),
      live = dialog.querySelector(".draw-live"),
      ctx = board.getContext("2d"),
      liveCtx = live.getContext("2d");
    const sync = () => {
      dialog.querySelectorAll("[data-draw-tool]").forEach((el) => {
        const on = el.dataset.drawTool === tool;
        el.classList.toggle("selected", on);
        el.setAttribute("aria-pressed", String(on));
      });
      dialog.querySelectorAll("[data-draw-color]").forEach((el) => {
        const on = el.dataset.drawColor === color;
        el.classList.toggle("selected", on);
        el.setAttribute("aria-pressed", String(on));
      });
      dialog.querySelector('[data-draw="undo"]').disabled = !history.length;
      dialog.querySelector('[data-draw="redo"]').disabled = !undone.length;
      dialog.querySelector('[data-draw="clear"]').disabled = !strokes.length && !baseImage;
      const dot = dialog.querySelector(".draw-dot");
      if (dot) {
        const px = Math.max(3, Math.min(28, Math.round(brush(tool === "eraser" ? "pen" : tool, size, 0.5).width / 2.4)));
        dot.style.setProperty("--dot", `${px}px`);
        dot.style.setProperty("--ink", tool === "eraser" ? "#ffffff" : color);
        dot.classList.toggle("eraser", tool === "eraser");
      }
    };
    const drawBase = () => {
      if (!baseImage || !base) return;
      const w = ((Number(base.w) || 40) / 100) * PAGE_W * (Number(base.scale) || 1),
        h = ((Number(base.h) || 30) / 100) * PAGE_H * (Number(base.scale) || 1);
      ctx.save();
      ctx.translate(((Number(base.x) || 50) / 100) * PAGE_W, ((Number(base.y) || 50) / 100) * PAGE_H);
      ctx.rotate(((Number(base.rotation) || 0) * Math.PI) / 180);
      ctx.drawImage(baseImage, -w / 2, -h / 2, w, h);
      ctx.restore();
    };
    // One stroke onto a context: varying widths are drawn segment by segment;
    // a marker is one path, so its see-through ink stays even.
    const paint = (target, stroke) => {
      const pts = stroke.points;
      if (!pts.length) return;
      target.save();
      const look = brush(stroke.tool, stroke.size, pts[0].p);
      target.globalCompositeOperation = look.erase ? "destination-out" : "source-over";
      target.strokeStyle = look.erase ? "#000" : stroke.color;
      target.fillStyle = target.strokeStyle;
      target.lineCap = target.lineJoin = "round";
      target.globalAlpha = look.alpha;
      if (pts.length === 1) {
        target.beginPath();
        target.arc(pts[0].x, pts[0].y, look.width / 2, 0, Math.PI * 2);
        target.fill();
      } else if (stroke.tool === "marker" || stroke.tool === "eraser") {
        target.lineWidth = look.width;
        target.beginPath();
        target.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2,
            my = (pts[i].y + pts[i + 1].y) / 2;
          target.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        target.lineTo(pts.at(-1).x, pts.at(-1).y);
        target.stroke();
      } else {
        // Pressure changes the width along the way.
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1],
            b = pts[i];
          target.lineWidth = brush(stroke.tool, stroke.size, (a.p + b.p) / 2).width;
          target.beginPath();
          target.moveTo(a.x, a.y);
          target.lineTo(b.x, b.y);
          target.stroke();
        }
      }
      target.restore();
    };
    const redraw = () => {
      ctx.clearRect(0, 0, PAGE_W, PAGE_H);
      drawBase();
      strokes.forEach((stroke) => paint(ctx, stroke));
      sync();
    };
    const point = (event) => {
      const rect = board.getBoundingClientRect();
      const pressure = event.pointerType === "pen" ? event.pressure || 0.5 : 0.5;
      return {
        x: Math.round(((event.clientX - rect.left) / rect.width) * PAGE_W * 10) / 10,
        y: Math.round(((event.clientY - rect.top) / rect.height) * PAGE_H * 10) / 10,
        p: Math.round(pressure * 100) / 100,
      };
    };
    const showLive = () => {
      liveCtx.clearRect(0, 0, PAGE_W, PAGE_H);
      if (current && current.tool !== "eraser") paint(liveCtx, current);
    };
    board.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "pen") penSeen = true;
      // Palm rejection: with a pencil in use, fingers do not draw.
      if (current || (penSeen && event.pointerType === "touch")) return;
      event.preventDefault();
      try {
        board.setPointerCapture(event.pointerId);
      } catch {
        // Not every pointer can be captured; drawing still follows it.
      }
      current = { tool, color, size, points: [point(event)], pointerId: event.pointerId };
      if (tool === "eraser") paint(ctx, current);
      else showLive();
    });
    board.addEventListener("pointermove", (event) => {
      if (!current || event.pointerId !== current.pointerId) return;
      event.preventDefault();
      const events = event.getCoalescedEvents?.() || [event];
      for (const item of events.length ? events : [event]) current.points.push(point(item));
      if (current.points.length > 4000) current.points.splice(1, current.points.length - 4000);
      if (tool === "eraser") {
        redraw();
        paint(ctx, current);
      } else showLive();
    });
    const end = (event) => {
      if (!current || event.pointerId !== current.pointerId) return;
      const { pointerId, ...stroke } = current;
      current = null;
      strokes.push(stroke);
      history.push({ kind: "stroke" });
      undone = [];
      liveCtx.clearRect(0, 0, PAGE_W, PAGE_H);
      redraw();
    };
    board.addEventListener("pointerup", end);
    board.addEventListener("pointercancel", end);
    const finish = async (result) => {
      if (finished) return;
      finished = true;
      dialog.close();
      dialog.innerHTML = "";
      resolve(result);
    };
    // A question inside the board (no system dialog): 保存 / 放弃 / 继续画,
    // or 清空 / 取消. Resolves with the chosen button's value.
    const ask = (message, choices) =>
      new Promise((answer) => {
        const box = dialog.querySelector(".draw-ask");
        box.innerHTML = `<div class="draw-ask-card" role="alertdialog" aria-modal="true" aria-label="${message}"><p>${message}</p>${choices.map((c) => `<button type="button" class="${c.cls || "secondary"}" data-draw-answer="${c.value}">${c.label}</button>`).join("")}</div>`;
        box.hidden = false;
        box.onclick = (event) => {
          const el = event.target.closest("[data-draw-answer]");
          if (!el) return;
          event.stopPropagation();
          box.hidden = true;
          box.innerHTML = "";
          answer(el.dataset.drawAnswer);
        };
        box.querySelector(".primary, button")?.focus();
      });
    // ×: nothing new → closes at once; new strokes → 保存 / 放弃修改 / 继续画.
    let asking = false;
    const cancel = async () => {
      if (finished || asking) return;
      if (strokes.length || current || history.some((h) => h.kind === "clear")) {
        asking = true;
        const choice = await ask(t("draw.leaveAsk"), [
          { value: "save", label: t("draw.leaveSave"), cls: "primary" },
          { value: "discard", label: t("draw.leaveDiscard"), cls: "secondary danger-text" },
          { value: "stay", label: t("draw.leaveStay"), cls: "text-button" },
        ]);
        asking = false;
        if (choice === "save") return done();
        if (choice !== "discard") return;
      }
      finish(null);
    };
    void confirmDiscard;
    dialog.onclick = async (event) => {
      const el = event.target.closest("button");
      if (!el) return;
      if (el.dataset.drawTool) tool = el.dataset.drawTool;
      if (el.dataset.drawColor) {
        color = el.dataset.drawColor;
        if (tool === "eraser") tool = "pen";
      }
      const name = el.dataset.draw;
      const menu = dialog.querySelector(".draw-menu");
      if (name !== "more" && menu && !menu.hidden) {
        menu.hidden = true;
        dialog.querySelector('[data-draw="more"]').setAttribute("aria-expanded", "false");
      }
      if (name === "more") {
        menu.hidden = !menu.hidden;
        el.setAttribute("aria-expanded", String(!menu.hidden));
        return;
      }
      if (name === "tip-ok") {
        markTip();
        el.closest(".draw-tip")?.remove();
        return;
      }
      if (name === "undo" && history.length) {
        const step = history.pop();
        if (step.kind === "clear") {
          strokes = step.strokes;
          baseImage = step.baseImage;
        } else step.stroke = strokes.pop();
        undone.push(step);
      }
      if (name === "redo" && undone.length) {
        const step = undone.pop();
        if (step.kind === "clear") {
          step.strokes = strokes;
          step.baseImage = baseImage;
          strokes = [];
          baseImage = null;
        } else strokes.push(step.stroke);
        history.push(step);
      }
      if (name === "clear") {
        if (!strokes.length && !baseImage) return;
        const sure = await ask(t("draw.clearAsk"), [
          { value: "clear", label: t("draw.clearAll"), cls: "primary danger-fill" },
          { value: "keep", label: t("cancel"), cls: "secondary" },
        ]);
        if (sure !== "clear") return;
        history.push({ kind: "clear", strokes, baseImage });
        undone = [];
        strokes = [];
        baseImage = null;
      }
      if (name === "cancel") return cancel();
      if (name === "done") return done();
      redraw();
    };
    // 完成: the ink on the board becomes the drawing (nothing new → as it was).
    const done = async () => {
      {
        if (!strokes.length && base && baseImage) return finish(null);
        const bounds = inkBounds(ctx.getImageData(0, 0, PAGE_W, PAGE_H).data, PAGE_W, PAGE_H);
        if (!bounds) return finish(base ? { empty: true } : null);
        const out = document.createElement("canvas");
        out.width = bounds.w;
        out.height = bounds.h;
        out.getContext("2d").drawImage(board, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
        const blob = await new Promise((done) => out.toBlob(done, "image/png"));
        return finish(blob ? { blob, layer: boxToLayer(bounds) } : null);
      }
    };
    dialog.oninput = (event) => {
      if (event.target.matches("[data-draw-size]")) {
        size = Number(event.target.value) || 6;
        sync();
      }
    };
    dialog.oncancel = (event) => {
      event.preventDefault();
      const box = dialog.querySelector(".draw-ask");
      if (box && !box.hidden) return box.querySelector('[data-draw-answer="stay"], [data-draw-answer="keep"]')?.click();
      cancel();
    };
    dialog.showModal();
    sync();
    if (base?.src)
      loadImage(base.src)
        .then((image) => {
          baseImage = image;
          redraw();
        })
        .catch(() => {});
  });
}
