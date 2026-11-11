// The photo editor sheet: filters · crop · adjust · title, one or many photos.
// Uses its own data-pe-* attributes so the app's click dispatcher ignores it.
import { escapeHTML as esc } from "./personal-ui.mjs";
import * as PE from "./photo-edit.mjs";

const TABS = ["filter", "crop", "adjust", "text"];

export function openPhotoEditor(items, options) {
  const { t, loadImage, mode = "add" } = options;
  const dialog = document.getElementById("photo-editor");
  const state = {
    index: 0,
    tab: "filter",
    items: items.map((item) => ({ ...item, edit: PE.normalizeEdit(item.edit), image: null, rotatedURL: "", rotatedFor: null })),
  };
  const current = () => state.items[state.index];
  let drag = null;

  async function prepare(item) {
    if (!item.image) item.image = await loadImage(item.src);
    const rotate = item.edit.rotate;
    if (!rotate) return { url: item.src, width: item.image.width, height: item.image.height };
    if (item.rotatedFor !== rotate) {
      if (item.rotatedURL) URL.revokeObjectURL(item.rotatedURL);
      const size = PE.rotatedSize(item.image.width, item.image.height, rotate);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      ctx.translate(size.width / 2, size.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.drawImage(item.image, -item.image.width / 2, -item.image.height / 2);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      item.rotatedURL = URL.createObjectURL(blob);
      item.rotatedFor = rotate;
    }
    const size = PE.rotatedSize(item.image.width, item.image.height, rotate);
    return { url: item.rotatedURL, ...size };
  }

  function frameStyle(view, edit) {
    const rect = PE.cropRect(view.width, view.height, edit);
    return {
      frame: `width:min(100%, calc(var(--pe-stage) * ${rect.ratio.toFixed(4)}));aspect-ratio:${rect.sw.toFixed(2)} / ${rect.sh.toFixed(2)}`,
      image: `width:${((view.width / rect.sw) * 100).toFixed(3)}%;left:${((-rect.sx / rect.sw) * 100).toFixed(3)}%;top:${((-rect.sy / rect.sh) * 100).toFixed(3)}%;filter:${PE.cssFilter(edit)}`,
    };
  }
  function textHTML(edit) {
    const x = edit.text;
    if (!x) return "";
    return `<span class="pe-text ${x.style}" data-pe-drag="text" style="left:${x.x}%;top:${x.y}%;font-size:${x.size}cqw;color:${x.style === "label" && x.color.toUpperCase() === "#FFFFFF" ? "#2F2A26" : x.color};font-family:${PE.textFont(x.style)}">${esc(x.value)}</span>`;
  }

  function controlsHTML(item) {
    const e = item.edit;
    if (state.tab === "filter")
      return `<div class="pe-filters">${PE.FILTERS.map((f) => `<button data-pe-action="filter" data-filter="${f.id}" class="${e.filter === f.id ? "selected" : ""}" aria-pressed="${e.filter === f.id}"><img src="${esc(item.src)}" alt="" style="filter:${PE.cssFilter({ filter: f.id })}"><span>${t("pe.filter." + f.id)}</span></button>`).join("")}</div>`;
    if (state.tab === "crop")
      return `<div class="pe-chips">${PE.RATIOS.map((r) => `<button data-pe-action="ratio" data-ratio="${r.id}" class="${e.ratio === r.id ? "selected" : ""}" aria-pressed="${e.ratio === r.id}">${r.id === "original" ? t("pe.ratio.original") : r.id}</button>`).join("")}</div><label class="pe-slider">${t("pe.zoom")}<input type="range" data-pe="zoom" min="1" max="3" step="0.05" value="${e.zoom}"></label><div class="pe-row"><button class="secondary" data-pe-action="rotate">⟳ ${t("pe.rotate")}</button><button class="text-button" data-pe-action="crop-reset">${t("pe.reset")}</button></div><p class="pe-hint">${t("pe.cropHint")}</p>`;
    if (state.tab === "adjust")
      return `${PE.ADJUSTMENTS.map((key) => `<label class="pe-slider">${t("pe.adjust." + key)}<input type="range" data-pe="${key}" min="-50" max="50" step="1" value="${e[key]}"><output>${e[key] > 0 ? "+" : ""}${e[key]}</output></label>`).join("")}<div class="pe-row"><button class="text-button" data-pe-action="adjust-reset">${t("pe.reset")}</button></div>`;
    const x = e.text || { value: "", style: "handwritten", color: "#FFFFFF", size: 9 };
    return `<label class="field pe-title-field">${t("pe.title")}<input data-pe-text="value" maxlength="60" value="${esc(x.value)}" placeholder="${t("pe.titlePlaceholder")}"></label><div class="pe-chips">${PE.TEXT_STYLES.map((s) => `<button data-pe-action="text-style" data-style="${s}" class="${x.style === s ? "selected" : ""}" aria-pressed="${x.style === s}">${t("pe.textStyle." + s)}</button>`).join("")}</div><div class="pe-colors">${PE.TEXT_COLORS.map((c) => `<button data-pe-action="text-color" data-color="${c}" class="${x.color.toUpperCase() === c ? "selected" : ""}" style="--swatch:${c}" aria-label="${c}"></button>`).join("")}</div><label class="pe-slider">${t("pe.textSize")}<input type="range" data-pe-text="size" min="4" max="18" step="0.5" value="${x.size}"></label><div class="pe-row">${e.text ? `<button class="text-button" data-pe-action="text-remove">${t("pe.textRemove")}</button>` : ""}<span class="pe-hint">${t("pe.textHint")}</span></div>`;
  }

  async function render() {
    const item = current();
    const view = await prepare(item);
    const style = frameStyle(view, item.edit);
    const strip =
      state.items.length > 1
        ? `<div class="pe-strip">${state.items.map((it, i) => `<button data-pe-action="pick" data-index="${i}" class="${i === state.index ? "selected" : ""}" aria-label="${i + 1}"><img src="${esc(it.src)}" alt="" style="filter:${PE.cssFilter(it.edit)}">${PE.isIdentity(it.edit) ? "" : "<i>✓</i>"}</button>`).join("")}</div>`
        : "";
    dialog.innerHTML = `<div class="pe-sheet"><header class="pe-top"><button class="text-button" data-pe-action="cancel">${t(mode === "add" ? "pe.skip" : "cancel")}</button><b>${t("pe.heading")}${state.items.length > 1 ? ` ${state.index + 1}/${state.items.length}` : ""}</b><button class="primary" data-pe-action="done">${t("pe.done")}</button></header><div class="pe-stage"><div class="pe-frame" data-pe-drag="image" style="${style.frame}"><img class="pe-image" src="${esc(view.url)}" alt="" draggable="false" style="${style.image}">${textHTML(item.edit)}</div></div>${strip}<nav class="pe-tabs" role="tablist">${TABS.map((tab) => `<button role="tab" data-pe-action="tab" data-tab="${tab}" aria-selected="${state.tab === tab}">${t("pe.tab." + tab)}</button>`).join("")}</nav><div class="pe-controls">${controlsHTML(item)}</div></div>`;
  }
  // Light update while a slider or drag is moving (keeps the control alive).
  async function refreshPreview() {
    const item = current();
    const view = await prepare(item);
    const style = frameStyle(view, item.edit);
    const frame = dialog.querySelector(".pe-frame");
    if (!frame) return;
    frame.setAttribute("style", style.frame);
    const img = frame.querySelector(".pe-image");
    img.setAttribute("style", style.image);
    if (img.getAttribute("src") !== view.url) img.src = view.url;
    frame.querySelector(".pe-text")?.remove();
    frame.insertAdjacentHTML("beforeend", textHTML(item.edit));
    dialog.querySelectorAll("[data-pe] + output").forEach((out) => {
      const v = item.edit[out.previousElementSibling.dataset.pe];
      out.textContent = `${v > 0 ? "+" : ""}${v}`;
    });
  }
  const set = (changes) => {
    const item = current();
    item.edit = PE.normalizeEdit({ ...item.edit, ...changes });
  };
  const setText = (changes) => {
    const item = current();
    const base = item.edit.text || { value: "", style: "handwritten", color: "#FFFFFF", size: 9, x: 50, y: 82 };
    item.edit = PE.normalizeEdit({ ...item.edit, text: { ...base, ...changes } });
  };

  return new Promise((resolve) => {
    const finish = async (result) => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("input", onInput);
      dialog.removeEventListener("change", onChange);
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("cancel", onCancel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dialog.close();
      for (const item of state.items) if (item.rotatedURL) URL.revokeObjectURL(item.rotatedURL);
      resolve(result);
    };
    const onCancel = (event) => {
      event.preventDefault();
      finish(null);
    };
    const onClick = async (event) => {
      const button = event.target.closest("[data-pe-action]");
      if (!button) return;
      const name = button.dataset.peAction;
      if (name === "cancel") return finish(null);
      if (name === "done") {
        button.disabled = true;
        button.textContent = t("pe.saving");
        // Text fonts must be ready before they are drawn on the canvas.
        await Promise.all(
          state.items
            .filter((item) => item.edit.text)
            .map((item) => document.fonts?.load(`40px ${PE.textFont(item.edit.text.style)}`, item.edit.text.value).catch(() => {})),
        );
        return finish(state.items.map((item) => ({ ...item, edit: PE.normalizeEdit(item.edit) })));
      }
      if (name === "tab") state.tab = button.dataset.tab;
      if (name === "pick") state.index = Number(button.dataset.index);
      if (name === "filter") set({ filter: button.dataset.filter });
      if (name === "ratio") set({ ratio: button.dataset.ratio, zoom: 1, x: 50, y: 50 });
      if (name === "rotate") set({ rotate: (current().edit.rotate + 90) % 360, x: 50, y: 50 });
      if (name === "crop-reset") set({ ratio: "original", zoom: 1, x: 50, y: 50, rotate: 0 });
      if (name === "adjust-reset") set({ brightness: 0, contrast: 0, saturation: 0, warmth: 0 });
      if (name === "text-style") setText({ style: button.dataset.style, value: current().edit.text?.value || t("pe.titleDefault") });
      if (name === "text-color") setText({ color: button.dataset.color, value: current().edit.text?.value || t("pe.titleDefault") });
      if (name === "text-remove") set({ text: null });
      await render();
    };
    const onInput = (event) => {
      const el = event.target;
      if (el.dataset.pe) set({ [el.dataset.pe]: Number(el.value) });
      else if (el.dataset.peText === "value") setText({ value: el.value });
      else if (el.dataset.peText === "size") setText({ size: Number(el.value) });
      else return;
      refreshPreview();
    };
    const onChange = (event) => {
      if (event.target.dataset.peText === "value") render().then(() => dialog.querySelector('[data-pe-text="value"]')?.focus());
    };
    // Drag the picture to choose what the crop shows; drag the title to place it.
    const onDown = (event) => {
      const target = event.target.closest("[data-pe-drag]");
      if (!target) return;
      const frame = dialog.querySelector(".pe-frame");
      const box = frame.getBoundingClientRect();
      const kind = target.dataset.peDrag === "text" ? "text" : "image";
      drag = { kind, box, startX: event.clientX, startY: event.clientY, edit: structuredClone(current().edit) };
      event.preventDefault();
    };
    const onMove = async (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
      if (drag.kind === "text") {
        setText({ x: drag.edit.text.x + (dx / drag.box.width) * 100, y: drag.edit.text.y + (dy / drag.box.height) * 100 });
      } else {
        const view = await prepare(current());
        const rect = PE.cropRect(view.width, view.height, drag.edit);
        set({
          x: drag.edit.x - (dx / drag.box.width) * (rect.sw / view.width) * 100,
          y: drag.edit.y - (dy / drag.box.height) * (rect.sh / view.height) * 100,
        });
        // Keep the centre where the crop can actually reach.
        const real = PE.cropRect(view.width, view.height, current().edit);
        set({ x: ((real.sx + real.sw / 2) / view.width) * 100, y: ((real.sy + real.sh / 2) / view.height) * 100 });
      }
      refreshPreview();
    };
    const onUp = () => {
      drag = null;
    };
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("input", onInput);
    dialog.addEventListener("change", onChange);
    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("cancel", onCancel);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    render().then(() => dialog.showModal());
  });
}
