// Shared journal canvas + media renderer. Journal Studio (editable) and the
// Calendar Day Detail (read-only) use the same markup so they never diverge.
import { fontFamily, stickerURL } from "./library.mjs";
import { escapeHTML as esc } from "./personal-ui.mjs";
import { isShape } from "./shapes.mjs";
import { captionFit } from "./story-style.mjs";
import { boundText } from "./scrapbook-layout.mjs";

// A long one-line caption gets smaller (and may wrap to two lines).
const captionClass = (text) => {
  const fit = captionFit(text);
  return fit.lines > 1 ? "fit-two" : fit.factor < 1 ? "fit-small" : "";
};

const num = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
// Paper styles (ids come from shared features.json templates).
export const PAPERS = ["minimal", "cute", "vintage", "grid", "lined", "kraft", "gingham", "berry", "watercolor"];
export const formatDuration = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0
    ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`
    : "0:00";

export function textCSS(style, fontId, defaultSize, catalog, fallbackColor = "#2F2A26") {
  const size = clamp(Number(style.size) || defaultSize, 10, 60),
    color = /^#[0-9a-f]{6}$/i.test(style.color || "") ? style.color : fallbackColor,
    weight = clamp(Number(style.weight) || 400, 100, 900),
    spacing = clamp(Number(style.spacing) || 0, -2, 8);
  return `font-family:${fontFamily(fontId, catalog)};font-size:${size / 3.2}cqw;color:${color};font-weight:${weight};letter-spacing:${spacing}px${alignCSS(style)}`;
}
// Alignment chosen for a page's title or words (V10.1; optional).
export function alignCSS(style) {
  return ["left", "center", "right"].includes(style?.align) ? `;text-align:${style.align}` : "";
}

// Size / colour chosen in the type bar for a page's title or words (only
// what was chosen; otherwise the page's own look stays).
export function styleExtra(style = {}) {
  let css = "";
  const size = Number(style?.size);
  if (size >= 10 && size <= 60) css += `;font-size:${size / 3.2}cqw`;
  if (/^#[0-9a-f]{6}$/i.test(style?.color || "")) css += `;color:${style.color}`;
  return css + alignCSS(style);
}
export function cropOf(layer) {
  const crop = layer.crop || {};
  return {
    x: clamp(num(crop.x, 50), 0, 100),
    y: clamp(num(crop.y, 50), 0, 100),
    zoom: clamp(num(crop.zoom, 1), 1, 4),
  };
}
export function cropStyle(layer) {
  const crop = cropOf(layer);
  return `object-position:${crop.x}% ${crop.y}%;transform:scale(${crop.zoom});transform-origin:${crop.x}% ${crop.y}%`;
}

// Geometry only, so live gestures can update style without a full render.
export function layerGeometry(layer) {
  let size = "";
  if (layer.kind === "photo" || layer.kind === "video")
    size = `width:${clamp(num(layer.w, 42), 4, 120)}%;height:${clamp(num(layer.h, 34), 4, 120)}%;`;
  else if (
    layer.w != null &&
    ["text", "growth", "audio"].includes(layer.kind)
  )
    size = `width:${clamp(num(layer.w, 60), 10, 100)}%;`;
  return `left:${num(layer.x, 50)}%;top:${num(layer.y, 50)}%;${size}transform:translate(-50%,-50%) scale(${num(layer.scale, 1)}) rotate(${num(layer.rotation, 0)}deg)`;
}

const themeIcon = (theme) =>
  ({ Learning: "📖", Fitness: "🌿", Wellness: "☁️", "Creative Life": "🎨" })[
    theme
  ] || "🌱";

export function growthCardInner(check, habit, ctx, layer = {}) {
  const { t } = ctx;
  if (!check || !habit)
    return `<span class="growth-card faded"><b>🌱 ${esc(layer.text || t("growth.cardMissingTitle"))}</b><small>${t("growth.cardMissing")}</small></span>`;
  const facts = [
    check.detail,
    check.minutes ? t("growth.minutes", { count: check.minutes }) : "",
  ].filter(Boolean);
  return `<span class="growth-card"><span class="growth-card-top"><span class="growth-check" aria-hidden="true"></span><b>${esc(habit.title)}</b>${check.mood ? `<i>${esc(check.mood)}</i>` : ""}</span>${facts.length ? `<small>${esc(facts.join(" · "))}</small>` : ""}${check.note ? `<span class="growth-card-note">${esc(check.note)}</span>` : ""}</span>`;
}

export function layerHTML(layer, ctx, options = {}) {
  const { catalog, media, t, state } = ctx;
  const readOnly = Boolean(options.readOnly),
    selected = !readOnly && options.selectedId === layer.id;
  const defaultFont = options.defaultFont || "serif";
  let classes = "layer",
    inner = "",
    extraStyle = "",
    attrs = "";
  if (layer.kind === "photo") {
    const src = media.resolve(layer.mediaRef);
    const frame = ["polaroid", "border", "rounded", "bare"].includes(
      layer.frame,
    )
      ? layer.frame
      : "border";
    // An empty frame from a template: shown while editing, hidden when reading.
    if (!layer.mediaRef && readOnly) return "";
    const empty = !layer.mediaRef;
    classes += ` art-layer photo-layer frame-${layer.drawing ? "bare drawing-layer" : frame}${isShape(layer.shape) && !layer.drawing ? ` shape-${layer.shape}` : ""}${empty ? " empty-slot" : ""}${options.cropMode && selected ? " cropping" : ""}`;
    inner = `<span class="photo-crop">${src ? `<img src="${esc(src)}" alt="" style="${cropStyle(layer)}" draggable="false">` : empty ? `<span class="photo-slot">＋<small>${t("photo.slot")}</small></span>` : `<span class="photo-missing">📷</span>`}</span>${layer.tape ? '<i class="photo-tape" aria-hidden="true"></i>' : ""}`;
    if (readOnly && src)
      attrs = ` data-action="zoom-photo" data-src="${esc(src)}" role="button" tabindex="0" aria-label="${t("day.zoomPhoto")}"`;
  } else if (layer.kind === "video" || layer.kind === "audio") {
    // A clip on the paper: plays right here, in the editor and when reading.
    const clip = (options.page?.media || []).find((item) => item.id === layer.clipId);
    if (!clip)
      return readOnly
        ? ""
        : `<span class="layer media-layer missing" data-layer="${esc(layer.id)}" style="${esc(layerGeometry(layer))}">${t("media.missing")}</span>`;
    const src = media.resolve(clip.source);
    const poster = media.resolve(clip.poster || "");
    classes += ` media-layer ${layer.kind}-layer${layer.kind === "video" && isShape(layer.shape) ? ` shape-${layer.shape}` : ""}`;
    const play = src
      ? `<button type="button" class="layer-play" data-action="layer-play" aria-label="${t("media.play")} ${esc(clip.name)}"><span class="ld-play-icon" aria-hidden="true"></span></button>`
      : `<span class="layer-loading">${t("media.loading")}</span>`;
    inner =
      layer.kind === "video"
        ? `<span class="video-frame">${src ? `<video src="${esc(src)}" ${poster ? `poster="${esc(poster)}"` : ""} playsinline preload="metadata"></video>` : ""}${play}</span>`
        : `<span class="audio-ticket">${play}<span class="audio-copy"><b>${esc(clip.name)}</b><span class="audio-wave" aria-hidden="true">${"<i></i>".repeat(12)}</span></span>${src ? `<audio src="${esc(src)}" preload="metadata"></audio>` : ""}</span>`;
  } else if (layer.kind === "growth") {
    classes += " growth-layer";
    const check = state?.checks.find(
      (item) => item.habitId === layer.habitId && item.date === layer.checkDate,
    );
    const habit = state?.habits.find((item) => item.id === layer.habitId);
    inner = growthCardInner(check, habit, ctx, layer);
  } else {
    const image = layer.assetId ? stickerURL(layer.assetId, catalog) : "";
    if (image) {
      classes += " art-layer";
      inner = `<img src="${esc(image)}" alt="" draggable="false">`;
    } else if (layer.kind === "text") {
      // A text bound to a Moment's own words (Quick Create V2) shows them, so
      // editing the words anywhere updates the page; empty ones hide when reading.
      const words = layer.bind ? boundText(layer, options.page) : layer.text;
      if (layer.bind && !words && readOnly) return "";
      classes += ` text-layer${layer.bind ? " bound-text" : ""}${layer.chip ? " chip-text" : ""}`;
      extraStyle = `;${textCSS({ size: layer.fontSize, color: layer.color, weight: layer.weight, spacing: layer.spacing }, layer.fontId || defaultFont, 16, catalog)};text-align:${["left", "center", "right"].includes(layer.align) ? layer.align : "left"}${/^#[0-9a-f]{6}$/i.test(layer.chip || "") ? `;--chip:${layer.chip}` : ""}`;
      inner = `<span class="layer-text" data-inline-layer="${esc(layer.id)}"${layer.bind && !words ? ` data-placeholder="${esc(t("story.linePlaceholder"))}"` : ""}>${esc(words)}</span>`;
    } else inner = esc(layer.text);
  }
  if (selected) {
    classes += " active";
    inner += `<i class="layer-handle handle-resize" data-handle="resize" aria-hidden="true"></i><i class="layer-handle handle-rotate" data-handle="rotate" aria-hidden="true"></i>`;
  }
  const interactive = readOnly
    ? attrs
    : ` data-layer="${esc(layer.id)}" role="button" tabindex="0" aria-label="${esc(layer.kind === "photo" ? t("layer.photo") : layer.text || t("layer.selected"))}"`;
  return `<span class="${classes}"${interactive} style="${esc(layerGeometry(layer) + extraStyle)}">${inner}</span>`;
}

// The page's background picture, if it has one: original artwork
// ("scene:<id>", library.json "scenes") or a library photo ("photo:<id>").
export function backdropOf(page, ctx) {
  const match = /^(scene|photo|media):([a-z0-9-]+)$/i.exec(page?.backdrop || "");
  if (!match) return null;
  const [reference, kind, id] = match;
  // My own photo (kept in this device's media store) can be a background too.
  if (kind === "media") {
    const src = ctx.media.resolve(reference);
    return src ? { id, kind, src, dark: false } : null;
  }
  const item = (kind === "scene" ? ctx.catalog?.scenes : ctx.catalog?.photos)?.find((entry) => entry.id === id);
  if (!item) return null;
  return { id, kind, src: ctx.media.resolve(reference), dark: item.tone === "dark" };
}

// page: an Entry (day page) or a Moment. Day pages keep the legacy fixed
// main photo/title/body; Moments are a free canvas with the text outside.
export function canvasHTML(page, ctx, options = {}) {
  const { catalog, media, t } = ctx;
  const readOnly = Boolean(options.readOnly),
    dayPage = options.dayPage !== false,
    font = page.font || "serif",
    textStyle = page.textStyle || {};
  const template = PAPERS.includes(page.template)
    ? page.template
    : "minimal";
  // A page background (gradient, pattern, sky ...) covers the paper; the words
  // sit on a frosted card so they stay easy to read.
  const backdrop = backdropOf(page, ctx);
  const designed = page.layoutTemplate === "scrapbook" || (dayPage && page.layoutTemplate === "timeline");
  const veil = backdrop && !designed && (dayPage || page.layoutTemplate === "text") ? `<div class="backdrop-veil" aria-hidden="true"></div>` : "";
  // Editable words on the paper: tap and type, like a note.
  const inline = (field, placeholder, max) =>
    `contenteditable="plaintext-only" spellcheck="false" role="textbox" aria-multiline="${field === "body"}" data-inline="${field}" data-max="${max}" data-placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"`;
  let fixed = "";
  if (page.layoutTemplate === "scrapbook" || (dayPage && page.layoutTemplate === "timeline"))
    // Today's story cover: time, a photo and a line per Moment, all layers.
    fixed = veil;
  else if (dayPage) {
    const photo = media.resolve(page.photo);
    const showPhoto = photo || (!readOnly && page.layoutTemplate !== "text");
    const titleText = readOnly
      ? `<div class="canvas-title" style="${esc(textCSS(backdrop?.dark && /^#2f2a26$/i.test(textStyle.color || "") ? { ...textStyle, color: "" } : textStyle, font, 20, catalog, backdrop?.dark ? "#FFFFFF" : "#2F2A26"))}">${esc(page.title || "")}</div><div class="canvas-body" style="font-family:${esc(fontFamily(page.bodyFont || font, catalog))}">${esc(page.body || "")}</div>`
      : `<div class="canvas-title" ${inline("title", t("studio.titlePlaceholder"), 70)} style="${esc(textCSS(backdrop?.dark && /^#2f2a26$/i.test(textStyle.color || "") ? { ...textStyle, color: "" } : textStyle, font, 20, catalog, backdrop?.dark ? "#FFFFFF" : "#2F2A26"))}">${esc(page.title || "")}</div><div class="canvas-body" ${inline("body", t("studio.bodyPlaceholder"), 2000)} style="font-family:${esc(fontFamily(page.bodyFont || font, catalog))}${esc(styleExtra(page.bodyStyle))}">${esc(page.body || "")}</div>`;
    fixed = `${showPhoto ? `<div class="canvas-photo"${readOnly && photo ? ` data-action="zoom-photo" data-src="${esc(photo)}" role="button" tabindex="0" aria-label="${t("day.zoomPhoto")}"` : ""}>${photo ? `<img src="${esc(photo)}" alt="${t("photo.alt")}">` : `<div class="photo-placeholder"${readOnly ? "" : ` data-action="photo-chooser" data-target="main" role="button" tabindex="0"`}>📷<span>${t(page.layers?.some((l) => l.kind === "photo") ? "photo.mainOptional" : "photo.add")}</span></div>`}</div><div class="canvas-tape"></div>` : ""}${veil}${titleText}<span class="canvas-mood">${esc(page.mood || "")}</span>`;
  } else if (page.layoutTemplate === "text")
    // Text-only Moment: the title and words are set on the paper itself.
    fixed = `${veil}<div class="canvas-title" ${readOnly ? "" : inline("title", t("moment.titlePlaceholder"), 70)} style="font-family:${esc(fontFamily(font, catalog))}${esc(styleExtra(page.textStyle))}">${esc(page.title || "")}</div><div class="canvas-body" ${readOnly ? "" : inline("body", t("note.bodyPlaceholder"), 4000)} style="font-family:${esc(fontFamily(page.bodyFont || font, catalog))}${esc(styleExtra(page.bodyStyle))}">${esc(page.body || "")}</div>${page.mood ? `<span class="canvas-mood">${esc(page.mood)}</span>` : ""}`;
  else if (!dayPage && page.layoutTemplate === "smart")
    // Photos in their own shapes, one line underneath (on a frosted label).
    fixed = readOnly && !page.title ? "" : `<div class="line-strip smart-caption ${page.title ? "" : "empty"}"><div class="line-title ${captionClass(page.title)}" ${readOnly ? "" : inline("title", t("line.placeholder"), 70)} style="font-family:${esc(fontFamily(font, catalog))}${esc(styleExtra(page.textStyle))}">${esc(page.title || "")}</div></div>`;
  else if (!dayPage && page.layoutTemplate === "line")
    // Photo + one line: the photo is the page, one sentence on a frosted strip.
    fixed = `${!backdrop && !readOnly ? `<button class="line-pick" data-action="line-photo"><span aria-hidden="true">＋</span>${t("line.pickPhoto")}</button>` : ""}<div class="line-strip"><div class="line-title" ${readOnly ? "" : inline("title", t("line.placeholder"), 70)} style="font-family:${esc(fontFamily(font, catalog))}${esc(styleExtra(page.textStyle))}">${esc(page.title || "")}</div>${page.body ? `<div class="line-body" style="font-family:${esc(fontFamily(page.bodyFont || font, catalog))}">${esc(page.body)}</div>` : ""}</div>`;
  else if (!readOnly && !page.layers?.length)
    // Tap the empty paper to add something: the same four equal choices.
    fixed = `<div class="canvas-empty-hint canvas-add">${options.addChoices ? "" : `<span>✿</span><p>${t("moment.canvasHint")}</p>`}${options.addChoices ? options.addChoices : ""}</div>`;
  const classes = [
    "journal-canvas",
    template,
    dayPage ? "day-canvas" : "moment-canvas",
    dayPage && page.layoutTemplate === "timeline" ? "timeline-cover" : "",
    page.layoutTemplate === "scrapbook" ? `scrapbook-page style-${page.layoutStyle || "editorial"}` : "",
    page.layoutTemplate === "text" ? "text-only" : "",
    !dayPage && page.layoutTemplate === "line" ? "line-page" : "",
    !dayPage && page.layoutTemplate === "smart" ? "smart-page" : "",
    backdrop ? "has-backdrop" : "",
    backdrop?.dark ? "dark-backdrop" : "",
    readOnly ? "read-only" : "",
    !readOnly && options.selectedId ? "has-selection" : "",
  ]
    .filter(Boolean)
    .join(" ");
  // Library backgrounds fill the page; my own photo is shown whole (nothing
  // cut off) over a soft, blurred copy of itself.
  const own = backdrop?.kind === "media";
  const ownPhoto = own ? `<div class="backdrop-fill" aria-hidden="true" style="background-image:url('${esc(backdrop.src)}')"></div><img class="backdrop-whole" src="${esc(backdrop.src)}" alt="">` : "";
  return `<div class="${classes}${own ? " own-backdrop" : ""}" ${readOnly ? "" : 'id="journal-canvas"'} style="font-family:${esc(fontFamily(font, catalog))}${backdrop && !own ? `;background-image:url('${esc(backdrop.src)}')` : ""}">${ownPhoto}${fixed}${(page.layers || []).map((layer) => layerHTML(layer, ctx, { ...options, page, defaultFont: font })).join("")}</div>`;
}

// One media card for edit and read modes. Audio uses a designed player that
// drives a real <audio> element; video keeps native controls for fullscreen.
export function mediaCardHTML(clip, ctx, options = {}) {
  const { media, t } = ctx;
  const editable = Boolean(options.editable);
  const src = media.resolve(clip.source);
  const poster = media.resolve(clip.poster || "");
  const ref = typeof clip.source === "string" ? clip.source.slice(6) : "";
  const loading = !src && !ctx.mediaReady?.(ref);
  const recorded =
    clip.origin === "recording" || /录音|Voice note/i.test(clip.name || "");
  const label =
    clip.kind === "video"
      ? t("media.kindVideo")
      : recorded
        ? t("media.kindVoice")
        : t("media.kindAudio");
  let body;
  if (!src)
    body = `<p class="subtext media-state">${t(loading ? "media.loading" : "media.missing")}</p>`;
  else if (clip.kind === "video")
    body = `<video controls playsinline preload="metadata" src="${esc(src)}" ${poster ? `poster="${esc(poster)}"` : ""}></video>`;
  else
    body = `<div class="ld-player" data-player data-duration="${num(clip.duration, 0)}"><button type="button" class="ld-play" data-action="player-toggle" aria-label="${t("media.play")}" data-label-play="${t("media.play")}" data-label-pause="${t("media.pause")}"><span class="ld-play-icon" aria-hidden="true"></span></button><div class="ld-player-track"><input type="range" class="ld-seek" data-player-seek min="0" max="1000" step="1" value="0" aria-label="${t("media.progress")}"><div class="ld-time"><span class="ld-current">0:00</span><span class="media-duration">${formatDuration(clip.duration)}</span></div></div><span class="ld-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><audio preload="metadata" src="${esc(src)}"></audio></div>`;
  const size =
    Number(clip.size || 0) > 0
      ? new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 1 }).format(
          clip.size / 1024 / 1024,
        ) + " MB"
      : "";
  return `<article class="media-card ${clip.kind}-card ${editable ? "" : "read-card"}" data-clip="${esc(clip.id)}"><div class="media-card-title"><span>${clip.kind === "video" ? "◈" : recorded ? "🎙" : "♫"}</span><strong>${esc(clip.name)}</strong><em class="media-kind">${label}</em>${editable ? `<button data-action="remove-media" data-clip="${esc(clip.id)}" aria-label="${t("media.remove")}">×</button>` : ""}</div>${body}<div class="media-card-foot"><small>${editable ? t("media.saved") + " · " : ""}<span class="media-duration">${formatDuration(clip.duration)}</span>${size ? " · " + size : ""}</small>${editable && clip.kind === "video" ? `<button data-action="video-poster" data-clip="${esc(clip.id)}">${t("media.poster")}</button>` : ""}${editable ? `<button data-action="clip-on-page" data-clip="${esc(clip.id)}" aria-pressed="${Boolean(options.onPage)}">${t(options.onPage ? "media.offPage" : "media.onPage")}</button>` : ""}</div></article>`;
}
