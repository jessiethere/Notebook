// V10.20 · 裁剪画面: a full-screen crop editor, like a phone's Photos app.
// The crop box stays centred and as large as the screen allows; the photo
// moves and zooms under it:
//   · drag inside the box → move the photo (choose what shows);
//   · pinch (or the slider) → zoom the photo;
//   · drag a corner → resize the box (an edge too, in Free); with a fixed
//     ratio the box keeps its proportions; on release it settles back to
//     the middle;
//   · ratios: 外框 (the frame as it is), 自由, 原比例, 1:1, 3:4, 4:3, 9:16, 16:9;
//   · ↻ turns the picture 90° (non-destructive, done by the app);
//   · 还原 back to the whole frame; 取消 changes nothing; 完成 returns
//     { rect, aspect, frameAspect } and the app applies it as one undo step.
// Nothing here touches the page: the layer's place, turn and order stay.
import * as C from "./crop.mjs";

const RATIO_LABELS = { frame: "crop.ratio.frame", free: "crop.ratio.free", original: "crop.ratio.original" };

export function openCropEditor({ src, imgAspect, layer, t, rotate = null }) {
  let dialog = document.getElementById("crop-editor");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "crop-editor";
    dialog.className = "crop-editor";
    dialog.setAttribute("aria-label", t("crop.title"));
    document.body.appendChild(dialog);
  }
  const box = C.boxAspect(layer);
  const fixed = C.fixedShape(layer);
  let ia = imgAspect;
  let url = src;
  const crop = layer.crop || {};
  // Start from what the frame shows now.
  let rect = crop.rect && Math.abs(Number(crop.aspect) / ia - 1) < 0.02 ? C.clampRect(crop.rect) : C.viewToRect(crop, ia, box);
  let ratio = "frame";
  if (!fixed && crop.rect && Math.abs(C.rectAspect(rect, ia) / box - 1) > 0.015) ratio = "free";
  let rotated = 0;
  const ratioValue = (id) => (id === "frame" ? box : id === "original" ? ia : C.RATIOS.find((r) => r.id === id)?.value || null);
  if (ratio === "frame") rect = C.withRatio(rect, box, ia);

  const chip = (r) => {
    const label = RATIO_LABELS[r.id] ? t(RATIO_LABELS[r.id]) : r.id;
    const off = fixed && r.id !== "frame";
    return `<button type="button" role="radio" data-ce-ratio="${r.id}" aria-checked="${ratio === r.id}" ${off ? "disabled" : ""}>${label}</button>`;
  };
  dialog.innerHTML = `<div class="ce"><header class="ce-top"><button type="button" class="text-button" data-ce="cancel">${t("cancel")}</button><b>${t("crop.title")}</b><button type="button" class="primary" data-ce="done">${t("pe.done")}</button></header><div class="ce-stage" data-ce-stage><img class="ce-img" alt="" draggable="false"><div class="ce-box" data-ce-box><i class="ce-grid v1"></i><i class="ce-grid v2"></i><i class="ce-grid h1"></i><i class="ce-grid h2"></i>${["nw", "ne", "sw", "se"].map((h) => `<span class="ce-h ce-corner ${h}" data-ce-h="${h}"></span>`).join("")}${["n", "e", "s", "w"].map((h) => `<span class="ce-h ce-edge ${h}" data-ce-h="${h}"></span>`).join("")}</div></div><p class="ce-note" aria-live="polite"></p><div class="ce-tools"><div class="ce-ratios" role="radiogroup" aria-label="${t("crop.ratio")}">${C.RATIOS.map(chip).join("")}</div><div class="ce-row">${rotate ? `<button type="button" data-ce="rotate" aria-label="${t("crop.rotate")}">↻ 90°</button>` : ""}<label class="ce-zoom"><span>${t("photo.cropZoom")}</span><input type="range" min="1" max="4" step="0.01" value="1" data-ce-zoom aria-label="${t("photo.cropZoom")}"></label><button type="button" data-ce="reset">${t("crop.reset")}</button></div></div></div>`;
  const stage = dialog.querySelector("[data-ce-stage]");
  const img = dialog.querySelector(".ce-img");
  const boxEl = dialog.querySelector("[data-ce-box]");
  const note = dialog.querySelector(".ce-note");
  const zoomEl = dialog.querySelector("[data-ce-zoom]");
  img.src = url;
  let view = null; // { L, T, W, H, iL, iT, iW, iH } in px (box and image)

  const maxW = (aspect) => Math.min(1, aspect / ia);
  function layout(animate = false) {
    const s = stage.getBoundingClientRect();
    const pad = 28;
    const a = C.rectAspect(rect, ia);
    let W = s.width - pad * 2,
      H = W / a;
    if (H > s.height - pad * 2) {
      H = s.height - pad * 2;
      W = H * a;
    }
    const L = (s.width - W) / 2,
      T = (s.height - H) / 2;
    const iW = W / rect.w,
      iH = iW / ia;
    view = { L, T, W, H, iL: L - rect.x * iW, iT: T - rect.y * iH, iW, iH };
    paint(animate);
  }
  function paint(animate = false) {
    dialog.classList.toggle("ce-anim", animate);
    Object.assign(img.style, { left: `${view.iL}px`, top: `${view.iT}px`, width: `${view.iW}px`, height: `${view.iH}px` });
    Object.assign(boxEl.style, { left: `${view.L}px`, top: `${view.T}px`, width: `${view.W}px`, height: `${view.H}px` });
    zoomEl.value = String(Math.min(4, Math.max(1, maxW(C.rectAspect(rect, ia)) / rect.w)));
    for (const b of dialog.querySelectorAll("[data-ce-ratio]")) b.setAttribute("aria-checked", String(b.dataset.ceRatio === ratio));
    dialog.querySelector(".ce").dataset.ratio = ratio;
    const a = C.rectAspect(rect, ia);
    note.textContent = fixed ? t("crop.fixedShape") : Math.abs(a / box - 1) > 0.015 ? t("crop.frameWillChange") : "";
  }
  const settle = () => setTimeout(() => dialog.classList.remove("ce-anim"), 220);

  // ---------- gestures ----------
  const pointers = new Map();
  let drag = null;
  const pair = () => {
    const [a, b] = [...pointers.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
  };
  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    stage.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const handle = event.target.closest?.("[data-ce-h]")?.dataset.ceH;
    if (pointers.size === 2) drag = { mode: "pinch", start: { ...rect }, d: pair().d };
    else if (handle) drag = { mode: "handle", h: handle, x: event.clientX, y: event.clientY, v: { ...view }, start: { ...rect } };
    else drag = { mode: "pan", x: event.clientX, y: event.clientY, start: { ...rect } };
  });
  stage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId) || !drag) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (drag.mode === "pan") {
      // The photo follows the finger (the box stays): its part moves the other way.
      rect = C.clampRect({ ...drag.start, x: drag.start.x - (event.clientX - drag.x) / view.iW, y: drag.start.y - (event.clientY - drag.y) / view.iH });
      layout();
    } else if (drag.mode === "pinch" && pointers.size >= 2) {
      zoomTo(drag.start, pair().d / drag.d);
    } else if (drag.mode === "handle") {
      resizeBox(drag, event.clientX - drag.x, event.clientY - drag.y);
    }
  });
  const end = (event) => {
    pointers.delete(event.pointerId);
    if (!drag) return;
    if (drag.mode === "handle") {
      layout(true);
      settle();
    }
    drag = pointers.size === 1 ? { mode: "pan", ...[...pointers.values()][0], start: { ...rect } } : null;
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  // Zoom the photo by `k` around the box's centre (same proportions).
  function zoomTo(start, k) {
    const a = C.rectAspect(start, ia);
    let w = Math.min(maxW(a), Math.max(C.MIN_SIDE, start.w / k));
    let h = (w * ia) / a;
    if (h > 1) {
      h = 1;
      w = a / ia;
    }
    const cx = start.x + start.w / 2,
      cy = start.y + start.h / 2;
    rect = C.clampRect({ x: cx - w / 2, y: cy - h / 2, w, h });
    layout();
  }
  // A corner (or an edge, in Free) moves on the screen; the photo stays put
  // until the finger lifts, then the box settles back to the middle.
  function resizeBox(d, dx, dy) {
    const v = d.v;
    const fixedRatio = ratio === "free" ? null : C.rectAspect(d.start, ia);
    if (d.h.length === 1 && fixedRatio) return; // edges: Free only
    let L = v.L,
      T = v.T,
      R = v.L + v.W,
      B = v.T + v.H;
    if (d.h.includes("w")) L += dx;
    if (d.h.includes("e")) R += dx;
    if (d.h.includes("n")) T += dy;
    if (d.h.includes("s")) B += dy;
    const minPx = C.MIN_SIDE * v.iW;
    // Inside the photo, not smaller than the minimum.
    L = Math.max(v.iL, Math.min(L, R - minPx));
    R = Math.min(v.iL + v.iW, Math.max(R, L + minPx));
    T = Math.max(v.iT, Math.min(T, B - minPx));
    B = Math.min(v.iT + v.iH, Math.max(B, T + minPx));
    if (fixedRatio) {
      // Keep the proportions: the width leads, the height follows from the
      // corner opposite the one held.
      let w = R - L,
        h = w / fixedRatio;
      const room = d.h.includes("n") ? B - v.iT : v.iT + v.iH - T;
      if (h > room) {
        h = room;
        w = h * fixedRatio;
      }
      if (d.h.includes("w")) L = R - w;
      else R = L + w;
      if (d.h.includes("n")) T = B - h;
      else B = T + h;
    }
    rect = C.clampRect({ x: (L - v.iL) / v.iW, y: (T - v.iT) / v.iH, w: (R - L) / v.iW, h: (B - T) / v.iH });
    view = { ...v, L, T, W: R - L, H: B - T };
    paint();
  }

  return new Promise((resolve) => {
    const finish = (result) => {
      resolve(result);
      if (dialog.open) dialog.close();
    };
    dialog.onclick = async (event) => {
      const ratioBtn = event.target.closest?.("[data-ce-ratio]");
      if (ratioBtn && !ratioBtn.disabled) {
        ratio = ratioBtn.dataset.ceRatio;
        const value = ratioValue(ratio);
        if (value) rect = C.withRatio(rect, value, ia);
        layout(true);
        settle();
        return;
      }
      const act = event.target.closest?.("[data-ce]")?.dataset.ce;
      if (act === "cancel") return finish(null);
      if (act === "reset") {
        ratio = "frame";
        rect = C.coverRect(ia, box);
        layout(true);
        settle();
        return;
      }
      if (act === "rotate" && rotate) {
        const button = event.target.closest("[data-ce]");
        button.disabled = true;
        try {
          const next = await rotate();
          if (next) {
            rotated += 1;
            ia = next.aspect;
            url = next.src;
            img.src = url;
            rect = C.rotateRect90(rect);
            const value = ratioValue(ratio);
            if (value) rect = C.withRatio(rect, value, ia);
            layout(true);
            settle();
          }
        } finally {
          button.disabled = false;
        }
        return;
      }
      if (act === "done") {
        const a = C.rectAspect(rect, ia);
        finish({ rect: C.clampRect(rect), aspect: Math.round(ia * 10000) / 10000, frameAspect: !fixed && Math.abs(a / box - 1) > 0.015 ? Math.round(a * 10000) / 10000 : null, rotated });
      }
    };
    zoomEl.oninput = () => {
      const a = C.rectAspect(rect, ia);
      zoomTo(rect, (maxW(a) / Number(zoomEl.value)) ? rect.w / (maxW(a) / Number(zoomEl.value)) : 1);
    };
    dialog.oncancel = (event) => {
      event.preventDefault();
      finish(null);
    };
    dialog.showModal();
    const ready = () => requestAnimationFrame(() => layout());
    if (img.complete && img.naturalWidth) ready();
    else img.onload = ready;
    window.addEventListener("resize", () => dialog.open && layout(), { once: false });
  });
}
