import { MASK_SHAPES, shapePath } from "./shapes.mjs";
import { captionFit } from "./story-style.mjs";
import { boundText, boundMarks } from "./scrapbook-layout.mjs";
import { runsOf } from "./rich-text.mjs";
const safePhoto = (photo) =>
  typeof photo !== "string"
    ? ""
    : /^\/assets\/[a-z0-9-]+\.jpg$/i.test(photo)
      ? photo.slice(1)
      : /^data:image\/(jpeg|png|webp);base64,/.test(photo)
        ? photo
        : "";
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片无法读取"));
    image.src = source;
  });
}
// Alignment chosen for a page's title / words (V10.1): where the text starts
// inside its box; without a choice the page's own alignment stays.
function alignIn(ctx, style, left, width, fallbackX) {
  const align = ["left", "center", "right"].includes(style?.align) ? style.align : null;
  if (!align) return fallbackX;
  ctx.textAlign = align;
  return align === "left" ? left : align === "right" ? left + width : left + width / 2;
}
function wrapText(ctx, text, x, y, width, lineHeight, maxLines) {
  let line = "",
    row = 0;
  for (const char of text) {
    if (char === "\n" || ctx.measureText(line + char).width > width) {
      ctx.fillText(line, x, y + row * lineHeight);
      line = "";
      row++;
      if (row >= maxLines) return;
    }
    if (char !== "\n") line += char;
  }
  if (row < maxLines) ctx.fillText(line, x, y + row * lineHeight);
}
// The same wrapping for words with bold / italic / underline / strikethrough
// on parts of them (V10.6). Without marks it is exactly wrapText. Each piece
// is measured and drawn in its own face; lines are placed by ctx.textAlign.
function wrapRich(ctx, text, marks, x, y, width, lineHeight, maxLines) {
  if (!Array.isArray(marks) || !marks.length) return wrapText(ctx, text, x, y, width, lineHeight, maxLines);
  const base = ctx.font;
  const match = /^(?:(italic|oblique)\s+)?(?:(\d{3}|bold|normal)\s+)?(\d+(?:\.\d+)?)px\s+(.+)$/.exec(base.trim());
  if (!match) return wrapText(ctx, text, x, y, width, lineHeight, maxLines);
  const size = Number(match[3]);
  const fontOf = (run) => `${run.italic || match[1] ? "italic " : ""}${run.bold ? 700 : match[2] || 400} ${size}px ${match[4]}`;
  // Characters with their look, cut into lines.
  const lines = [[]];
  let lineWidth = 0;
  for (const run of runsOf(text, marks)) {
    ctx.font = fontOf(run);
    for (const char of run.text) {
      const w = char === "\n" ? 0 : ctx.measureText(char).width;
      if (char === "\n" || (lineWidth + w > width && lines[lines.length - 1].length)) {
        lines.push([]);
        lineWidth = 0;
      }
      if (char !== "\n") {
        lines[lines.length - 1].push({ char, run, w });
        lineWidth += w;
      }
    }
  }
  const align = ctx.textAlign;
  const baseline = ctx.textBaseline;
  // Where the underline / strike sit, from the text's baseline setting.
  const middle = baseline === "middle" ? 0 : baseline === "top" || baseline === "hanging" ? size * 0.5 : -size * 0.32;
  const thick = Math.max(2, size * 0.06);
  ctx.textAlign = "left";
  lines.slice(0, maxLines).forEach((line, row) => {
    const total = line.reduce((sum, item) => sum + item.w, 0);
    let cx = align === "center" ? x - total / 2 : align === "right" || align === "end" ? x - total : x;
    const cy = y + row * lineHeight;
    let k = 0;
    while (k < line.length) {
      let end = k + 1;
      while (end < line.length && line[end].run === line[k].run) end++;
      const piece = line.slice(k, end);
      const w = piece.reduce((sum, item) => sum + item.w, 0);
      const run = piece[0].run;
      ctx.font = fontOf(run);
      ctx.fillText(piece.map((item) => item.char).join(""), cx, cy);
      if (run.underline) ctx.fillRect(cx, cy + middle + size * 0.52, w, thick);
      if (run.strike) ctx.fillRect(cx, cy + middle - thick / 2 + size * 0.04, w, thick);
      cx += w;
      k = end;
    }
  });
  ctx.font = base;
  ctx.textAlign = align;
}
// Draws a photo layer with its relative size, crop (object-position + zoom)
// and frame, matching the DOM canvas closely.
// Shadow + cut-out for round / arch / heart pictures (no white border).
function drawMasked(ctx, shape, w, h, draw) {
  ctx.save();
  ctx.shadowColor = "rgba(93,73,60,.22)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#3F3A33";
  shapePath(ctx, shape, -w / 2, -h / 2, w, h);
  ctx.fill();
  ctx.restore();
  ctx.save();
  shapePath(ctx, shape, -w / 2, -h / 2, w, h);
  ctx.clip();
  draw(-w / 2, -h / 2, w, h);
  ctx.restore();
}
function drawCover(ctx, source, sw, sh, x, y, w, h, px = 0.5, py = 0.5, zoom = 1) {
  const cover = Math.max(w / sw, h / sh) * zoom;
  ctx.drawImage(source, x + (w - sw * cover) * px, y + (h - sh * cover) * py, sw * cover, sh * cover);
}
function drawPhotoLayer(ctx, image, layer) {
  const w = ((Number(layer.w) || 42) / 100) * 1080,
    h = ((Number(layer.h) || 34) / 100) * 1350;
  if (MASK_SHAPES.includes(layer.shape)) {
    const crop = layer.crop || {};
    drawMasked(ctx, layer.shape, w, h, (x, y, dw, dh) =>
      drawCover(ctx, image, image.width, image.height, x, y, dw, dh, (Number(crop.x ?? 50) || 0) / 100, (Number(crop.y ?? 50) || 0) / 100, Math.max(1, Number(crop.zoom) || 1)),
    );
    return;
  }
  const frame = layer.frame || "border";
  const pad =
    frame === "bare" || frame === "rounded"
      ? 0
      : frame === "polaroid"
        ? 18
        : 10;
  const bottom = frame === "polaroid" ? 54 : pad;
  if (pad) {
    ctx.fillStyle = "#FFFDF8";
    ctx.shadowColor = "rgba(93,73,60,.18)";
    ctx.shadowBlur = 10;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.shadowBlur = 0;
  }
  const iw = w - pad * 2,
    ih = h - pad - bottom,
    crop = layer.crop || {},
    zoom = Math.max(1, Number(crop.zoom) || 1),
    px = (Number(crop.x ?? 50) || 0) / 100,
    py = (Number(crop.y ?? 50) || 0) / 100;
  const cover = Math.max(iw / image.width, ih / image.height) * zoom;
  const dw = image.width * cover,
    dh = image.height * cover;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-w / 2 + pad, -h / 2 + pad, iw, ih);
  ctx.clip();
  ctx.drawImage(
    image,
    -w / 2 + pad + (iw - dw) * px,
    -h / 2 + pad + (ih - dh) * py,
    dw,
    dh,
  );
  ctx.restore();
  if (layer.tape) {
    ctx.fillStyle = "rgba(225,185,178,.75)";
    ctx.save();
    ctx.translate(0, -h / 2);
    ctx.rotate((-5 * Math.PI) / 180);
    ctx.fillRect(-w * 0.18, -16, w * 0.36, 32);
    ctx.restore();
  }
}
// Paper patterns for the V3.1+ paper styles (matches styles.css).
function drawPaper(ctx, template) {
  const lines = (color, step, vertical) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let p = step; p < (vertical ? 1080 : 1350); p += step) {
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(p, 0);
        ctx.lineTo(p, 1350);
      } else {
        ctx.moveTo(0, p);
        ctx.lineTo(1080, p);
      }
      ctx.stroke();
    }
  };
  if (template === "grid") {
    lines("#E7E1D3", 54, false);
    lines("#E7E1D3", 54, true);
  } else if (template === "lined") {
    lines("#DCE3EC", 68, false);
    ctx.strokeStyle = "#EBC4BE";
    ctx.beginPath();
    ctx.moveTo(110, 0);
    ctx.lineTo(110, 1350);
    ctx.stroke();
  } else if (template === "kraft") {
    ctx.fillStyle = "rgba(120,90,50,.08)";
    for (let i = 0; i < 2600; i++)
      ctx.fillRect((i * 397) % 1080, (i * 613) % 1350, 3, 2);
  } else if (template === "gingham") {
    ctx.fillStyle = "rgba(232,180,170,.22)";
    for (let p = 0; p < 1350; p += 90) ctx.fillRect(0, p, 1080, 45);
    for (let p = 0; p < 1080; p += 90) ctx.fillRect(p, 0, 45, 1350);
  } else if (template === "berry") {
    ctx.fillStyle = "#F0C9C9";
    for (let x = 30; x < 1080; x += 90)
      for (let y = 30; y < 1350; y += 90) {
        ctx.beginPath();
        ctx.arc(x + ((y / 90) % 2) * 45, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (template === "watercolor") {
    for (const [x, y, r, c] of [
      [180, 200, 420, "rgba(232,207,207,.45)"],
      [920, 1150, 480, "rgba(201,215,193,.45)"],
      [900, 260, 300, "rgba(216,227,238,.5)"],
    ]) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1350);
    }
  }
}
export async function renderJournalCanvas(editor, options = {}) {
  const resolvePhoto = options.resolvePhoto || safePhoto;
  const dayPage = options.dayPage !== false;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle =
    {
      vintage: "#EEE6D5",
      cute: "#FFFAF2",
      grid: "#FFFEFA",
      lined: "#FFFDF8",
      kraft: "#D9C3A1",
      gingham: "#FFF9F6",
      berry: "#FFF7F5",
      watercolor: "#FBF8F4",
    }[editor.template] || "#FFFDFA";
  ctx.fillRect(0, 0, 1080, 1350);
  if (editor.template === "cute") {
    ctx.fillStyle = "#E4D5BB";
    for (let x = 0; x < 1080; x += 40)
      for (let y = 0; y < 1350; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  if (editor.template === "vintage") {
    ctx.strokeStyle = "#D8CEB9";
    for (let y = 0; y < 1350; y += 75) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }
  }
  drawPaper(ctx, editor.template);
  const backdropMatch = /^(scene|photo|media):([a-z0-9-]+)$/i.exec(editor.backdrop || "");
  const backdrop =
    backdropMatch &&
    (backdropMatch[1] === "media"
      ? resolvePhoto(editor.backdrop) && { tone: "light" }
      : (backdropMatch[1] === "scene" ? options.catalog?.scenes : options.catalog?.photos)?.find((item) => item.id === backdropMatch[2]));
  if (backdrop) {
    try {
      const image = await loadImage(resolvePhoto(editor.backdrop));
      const ratio = Math.max(1080 / image.width, 1350 / image.height);
      if (backdropMatch[1] === "media") {
        // My own photo: whole, over a soft blurred copy (as on screen).
        ctx.save();
        if ("filter" in ctx) ctx.filter = "blur(36px) saturate(1.1)";
        ctx.drawImage(image, (1080 - image.width * ratio) / 2 - 40, (1350 - image.height * ratio) / 2 - 40, image.width * ratio + 80, image.height * ratio + 80);
        ctx.restore();
        ctx.fillStyle = "rgba(255,253,248,.35)";
        ctx.fillRect(0, 0, 1080, 1350);
        const fit = Math.min(1080 / image.width, 1350 / image.height);
        ctx.drawImage(image, (1080 - image.width * fit) / 2, (1350 - image.height * fit) / 2, image.width * fit, image.height * fit);
      } else ctx.drawImage(image, (1080 - image.width * ratio) / 2, (1350 - image.height * ratio) / 2, image.width * ratio, image.height * ratio);
    } catch {
      // Keep the plain paper if the background cannot load.
    }
  }
  const darkBackdrop = backdrop?.tone === "dark";
  const designed = editor.layoutTemplate === "scrapbook" || (dayPage && editor.layoutTemplate === "timeline");
  if (backdrop && !designed && (dayPage || editor.layoutTemplate === "text")) {
    ctx.fillStyle = darkBackdrop ? "rgba(18,16,30,.58)" : "rgba(255,255,255,.74)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(76, 824, 928, 482, 36);
    else ctx.rect(76, 824, 928, 482);
    ctx.fill();
  }
  if (dayPage && resolvePhoto(editor.photo)) {
    ctx.save();
    ctx.translate(540, 430);
    ctx.rotate((-4 * Math.PI) / 180);
    ctx.fillStyle = "#FFFDFB";
    ctx.fillRect(-400, -310, 800, 635);
    const image = await loadImage(resolvePhoto(editor.photo));
    const ratio = Math.max(760 / image.width, 560 / image.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-380, -290, 760, 560);
    ctx.clip();
    ctx.drawImage(
      image,
      (-image.width * ratio) / 2,
      -10 - (image.height * ratio) / 2,
      image.width * ratio,
      image.height * ratio,
    );
    ctx.restore();
    ctx.restore();
    ctx.fillStyle = editor.template === "cute" ? "#DDBBB3BB" : "#C5CEB1BB";
    ctx.fillRect(405, 90, 270, 65);
  }
  const font = options.fontFamily
    ? options.fontFamily(editor.font, options.catalog)
    : editor.font === "serif"
      ? 'Georgia, "Songti SC", SimSun, serif'
      : editor.font === "rounded"
        ? '"Trebuchet MS", "Microsoft YaHei", sans-serif'
        : "sans-serif";
  await document.fonts.ready;
  if (!dayPage && editor.layoutTemplate === "line") {
    // Photo + one line: one sentence on a frosted strip at the bottom.
    ctx.fillStyle = darkBackdrop ? "rgba(18,16,30,.55)" : "rgba(255,255,255,.8)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(65, 1112, 950, 182, 38);
    else ctx.rect(65, 1112, 950, 182);
    ctx.fill();
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const lineColor = /^#[0-9a-f]{6}$/i.test(editor.textStyle?.color || "") ? editor.textStyle.color : null;
    ctx.fillStyle = darkBackdrop ? "#FFFFFF" : lineColor || "#2F2A26";
    ctx.font = `500 ${Number(editor.textStyle?.size) >= 10 ? Math.min(60, Number(editor.textStyle.size)) * 3.375 * 0.8 : 54}px ${font}`;
    wrapRich(ctx, editor.title || "", editor.titleMarks, alignIn(ctx, editor.textStyle, 110, 860, 540), editor.body ? 1140 : 1165, 860, 66, editor.body ? 1 : 2);
    if (editor.body) {
      ctx.fillStyle = darkBackdrop ? "#E9E4F5" : "#8D857B";
      ctx.font = `34px ${options.fontFamily ? options.fontFamily(editor.bodyFont || editor.font, options.catalog) : font}`;
      ctx.textAlign = "center";
      wrapRich(ctx, editor.body, editor.bodyMarks, alignIn(ctx, editor.bodyStyle, 110, 860, 540), 1218, 860, 44, 1);
    }
    ctx.restore();
  }
  // A timeline cover (today's story) is all layers: no title / words / mood.
  if ((dayPage && !designed) || editor.layoutTemplate === "text") {
    const titleColor = editor.textStyle?.color || "#2F2A26";
    ctx.fillStyle = darkBackdrop && /^#2f2a26$/i.test(titleColor) ? "#FFFFFF" : titleColor;
    ctx.font = `${editor.textStyle?.weight || 400} ${(editor.textStyle?.size || 16) * 3.375}px ${font}`;
    ctx.save();
    wrapRich(ctx, editor.title || "今天的小美好", editor.title ? editor.titleMarks : null, alignIn(ctx, editor.textStyle, 129, 820, 129), 910, 820, 78, 2);
    ctx.restore();
    const bodyColor = /^#[0-9a-f]{6}$/i.test(editor.bodyStyle?.color || "") ? editor.bodyStyle.color : null;
    ctx.fillStyle = bodyColor || (darkBackdrop ? "#E9E4F5" : "#998C7A");
    const bodyFont = options.fontFamily
      ? options.fontFamily(editor.bodyFont || editor.font, options.catalog)
      : font;
    const bodySize = Number(editor.bodyStyle?.size) >= 10 ? Math.min(60, Number(editor.bodyStyle.size)) * 3.375 : 34;
    ctx.font = `${bodySize}px ${bodyFont}`;
    ctx.save();
    wrapRich(ctx, editor.body || "", editor.bodyMarks, alignIn(ctx, editor.bodyStyle, 129, 820, 129), 1110, 820, 58, 3);
    ctx.restore();
    ctx.font = "125px sans-serif";
    ctx.fillText(editor.mood || "", 875, 820);
  }
  for (const layer of editor.layers) {
    if (layer.kind === "photo" && !layer.mediaRef) continue; // empty template frame
    ctx.save();
    ctx.translate((layer.x / 100) * 1080, (layer.y / 100) * 1350);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);
    if (layer.kind === "video" || layer.kind === "audio") {
      const clip = (editor.media || []).find((item) => item.id === layer.clipId);
      if (clip && layer.kind === "audio") drawAudioTicket(ctx, layer, clip.name, font);
      // Video frames are drawn live by the video export.
      if (clip && layer.kind === "video" && !options.skipVideo)
        drawVideoLayer(ctx, await videoStill(resolvePhoto(clip.source), resolvePhoto(clip.poster || "")), layer);
      ctx.restore();
      continue;
    }
    const asset =
      layer.assetId &&
      options.catalog?.stickers.find((item) => item.id === layer.assetId);
    const source = asset
      ? `library/stickers/${asset.file}`
      : layer.kind === "photo"
        ? resolvePhoto(layer.mediaRef)
        : "";
    if (source && layer.kind === "photo" && layer.w != null) {
      drawPhotoLayer(ctx, await loadImage(source), layer);
      ctx.restore();
      continue;
    }
    if (layer.kind === "growth") {
      const card = options.growthCard?.(layer);
      const width = ((Number(layer.w) || 62) / 100) * 1080;
      const height = card?.note ? 200 : 140;
      // A soft label with a check (like the page): tint, rounded, no border.
      ctx.fillStyle = "rgba(232,237,222,.92)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-width / 2, -height / 2, width, height, 26);
      else ctx.rect(-width / 2, -height / 2, width, height);
      ctx.fill();
      ctx.fillStyle = "rgba(225,185,178,.7)";
      ctx.fillRect(-width / 2 + 24, -height / 2 - 14, 90, 28);
      ctx.fillStyle = "#7D8E66";
      ctx.beginPath();
      ctx.arc(-width / 2 + 52, -height / 2 + 48, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-width / 2 + 43, -height / 2 + 48);
      ctx.lineTo(-width / 2 + 50, -height / 2 + 56);
      ctx.lineTo(-width / 2 + 62, -height / 2 + 40);
      ctx.stroke();
      ctx.fillStyle = "#3F4A35";
      ctx.textBaseline = "top";
      ctx.font = `600 38px ${font}`;
      wrapText(ctx, card?.title || layer.text || "", -width / 2 + 88, -height / 2 + 26, width - 120, 48, 1);
      ctx.fillStyle = "#7A7166";
      ctx.font = `30px ${font}`;
      wrapText(ctx, card?.facts || "", -width / 2 + 88, -height / 2 + 78, width - 120, 40, 1);
      ctx.fillStyle = "#2F2A26";
      wrapText(ctx, card?.note || "", -width / 2 + 34, -height / 2 + 124, width - 68, 40, 2);
      ctx.restore();
      continue;
    }
    if (source) {
      const image = await loadImage(source);
      const size = layer.kind === "photo" ? 450 : 184;
      if (layer.kind === "photo") {
        ctx.fillStyle = "#FFFDF8";
        ctx.fillRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 40);
        const side = Math.min(image.width, image.height);
        ctx.drawImage(
          image,
          (image.width - side) / 2,
          (image.height - side) / 2,
          side,
          side,
          -size / 2,
          -size / 2,
          size,
          size,
        );
      } else ctx.drawImage(image, -size / 2, -size / 2, size, size);
      ctx.restore();
      continue;
    }
    if (layer.kind === "text") {
      // Words bound to a Moment (Quick Create V2) are read from the page.
      const words = layer.bind ? boundText(layer, editor) : layer.text;
      if (!words) {
        ctx.restore();
        continue;
      }
      const family = options.fontFamily
        ? options.fontFamily(layer.fontId || editor.font, options.catalog)
        : font;
      const size = (layer.fontSize || 16) * 3.375;
      ctx.font = `${layer.weight || 400} ${size}px ${family}`;
      ctx.fillStyle = layer.color || "#2F2A26";
      // The box is the layer's own width (as on screen), aligned inside it.
      const align = ["left", "center", "right"].includes(layer.align) ? layer.align : "left";
      const width = layer.w != null ? (Math.max(10, Math.min(100, Number(layer.w))) / 100) * 1080 : 700;
      ctx.textAlign = align;
      // Centred on the layer's point like on screen, whatever the line count.
      const lineHeight = size * 1.4;
      const lines = Math.min(6, Math.max(1, Math.ceil(ctx.measureText(String(words)).width / width)));
      ctx.textBaseline = "middle";
      if (/^#[0-9a-f]{6}$/i.test(layer.chip || "")) {
        // A small coloured label behind the words (playful time chips).
        const textW = Math.min(width, ctx.measureText(String(words)).width) + size * 0.9;
        const chipX = align === "left" ? -width / 2 - size * 0.45 : align === "right" ? width / 2 - textW + size * 0.45 : -textW / 2;
        const color = ctx.fillStyle;
        ctx.fillStyle = layer.chip;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(chipX, -size * 0.75, textW, size * 1.5, size * 0.75);
        else ctx.rect(chipX, -size * 0.75, textW, size * 1.5);
        ctx.fill();
        ctx.fillStyle = color;
      }
      wrapRich(ctx, words, layer.bind ? boundMarks(layer, editor, words) : layer.marks, align === "left" ? -width / 2 : align === "right" ? width / 2 : 0, layer.w != null ? -((lines - 1) * lineHeight) / 2 : -40, width, lineHeight, 6);
      ctx.restore();
      continue;
    }
    ctx.font = "140px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(layer.text, 0, 0);
    ctx.restore();
  }
  if (!dayPage && editor.layoutTemplate === "smart" && editor.title) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.shadowColor = "rgba(40,30,60,.12)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(65, 1150, 950, 150, 38);
    else ctx.rect(65, 1150, 950, 150);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(editor.textStyle?.color || "") ? editor.textStyle.color : "#2F2A26";
    // Same fit as on screen: long lines get smaller and may use two lines.
    const fit = captionFit(editor.title);
    const base = Number(editor.textStyle?.size) >= 10 ? Math.min(60, Number(editor.textStyle.size)) * 3.375 * 0.8 : 52;
    ctx.font = `500 ${Math.round(base * fit.factor)}px ${font}`;
    wrapRich(ctx, editor.title, editor.titleMarks, alignIn(ctx, editor.textStyle, 110, 860, 540), fit.lines > 1 ? 1172 : 1196, 860, Math.round(64 * fit.factor), fit.lines);
    ctx.restore();
  }
  return options.dayList?.length ? withDayList(canvas, options.dayList, options.dayListTitle) : canvas;
}
// The day's list (habits checked, things done) as a strip under the page, as
// in the flip book: it never covers the page itself.
const LIST_FONT = '"PingFang SC", -apple-system, "Helvetica Neue", "Microsoft YaHei", sans-serif';
export function dayListRows(ctx, items, maxWidth) {
  const rows = [[]];
  let width = 0;
  for (const raw of items.slice(0, 13)) {
    const text = `✓ ${String(raw).slice(0, 40)}`;
    const w = ctx.measureText(text).width + 64;
    if (rows.at(-1).length && width + w > maxWidth) {
      rows.push([]);
      width = 0;
    }
    rows.at(-1).push({ text, w: Math.min(w, maxWidth) });
    width += w + 14;
  }
  return rows;
}
function withDayList(page, items, title = "") {
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `30px ${LIST_FONT}`;
  const rows = dayListRows(measure, items, 1080 - 144);
  const height = 172 + rows.length * 66;
  const canvas = document.createElement("canvas");
  canvas.width = page.width;
  canvas.height = page.height + height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(page, 0, 0);
  ctx.fillStyle = "#FBF6EC";
  ctx.fillRect(0, page.height, canvas.width, height);
  ctx.strokeStyle = "#D9CDB8";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, page.height + 24);
  ctx.lineTo(canvas.width - 48, page.height + 24);
  ctx.stroke();
  ctx.setLineDash([]);
  // A bit of washi tape, like the sticky note on the day page.
  ctx.save();
  ctx.translate(canvas.width / 2, page.height + 24);
  ctx.rotate(-0.03);
  ctx.fillStyle = "rgba(186,200,160,.75)";
  ctx.fillRect(-70, -14, 140, 28);
  ctx.restore();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#2F2A26";
  ctx.font = `600 34px ${LIST_FONT}`;
  ctx.fillText(title || "今日清单", 72, page.height + 82);
  ctx.font = `30px ${LIST_FONT}`;
  rows.forEach((row, r) => {
    let x = 72;
    const y = page.height + 130 + r * 66;
    for (const chip of row) {
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#E2D7C5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, chip.w, 52, 26);
      else ctx.rect(x, y, chip.w, 52);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#4F5D43";
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, chip.w - 18, 52);
      ctx.clip();
      ctx.fillText(chip.text, x + 32, y + 27);
      ctx.restore();
      x += chip.w + 14;
    }
  });
  return canvas;
}
const fileName = (editor, options, ext) =>
  `Little-Days-${editor.date || options.date || "page"}${options.suffix ? "-" + options.suffix : ""}.${ext}`;
function download(href, name) {
  const link = document.createElement("a");
  link.download = name;
  link.href = href;
  link.click();
}
// The first page of a shared book: its cover photo, title and dates.
export async function renderBookTitleCanvas({ title = "", description = "", coverSrc = "", line = "", color = "#7D8E66" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FBF8F1";
  ctx.fillRect(0, 0, 1080, 1350);
  const sans = '"PingFang SC", -apple-system, "Helvetica Neue", "Noto Sans SC", sans-serif';
  ctx.fillStyle = "#9A8F80";
  ctx.font = `600 28px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText("L I T T L E   D A Y S", 540, 120);
  // Cover photo in a soft frame (or the book's colour).
  const box = { x: 150, y: 190, w: 780, h: 700 };
  ctx.save();
  ctx.shadowColor = "rgba(60,45,30,.18)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(box.x - 18, box.y - 18, box.w + 36, box.h + 36);
  ctx.restore();
  let drawn = false;
  if (coverSrc) {
    try {
      const image = await loadImage(coverSrc);
      const ratio = Math.max(box.w / image.width, box.h / image.height);
      const dw = image.width * ratio,
        dh = image.height * ratio;
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();
      ctx.drawImage(image, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
      ctx.restore();
      drawn = true;
    } catch {}
  }
  if (!drawn) {
    ctx.fillStyle = color;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  ctx.fillStyle = "#2B2622";
  ctx.font = `600 66px ${sans}`;
  wrapText(ctx, title, 540, 1010, 900, 80, 2);
  ctx.fillStyle = "#7A7166";
  ctx.font = `32px ${sans}`;
  if (description) wrapText(ctx, description, 540, 1120, 860, 46, 2);
  ctx.fillStyle = "#9A8F80";
  ctx.font = `500 30px ${sans}`;
  ctx.fillText(line, 540, 1260);
  return canvas;
}
// A 9:16 picture for Stories: the page centred on paper, with a small
// "made with Little Days" line at the bottom.
export const STORY = { width: 1080, height: 1920 };
export async function renderStoryCanvas(editor, options = {}) {
  const page = await renderJournalCanvas(editor, options);
  const canvas = document.createElement("canvas");
  canvas.width = STORY.width;
  canvas.height = STORY.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F4EFE6";
  ctx.fillRect(0, 0, STORY.width, STORY.height);
  const w = 960,
    h = (page.height / page.width) * w,
    x = (STORY.width - w) / 2,
    y = (STORY.height - h) / 2 - 40;
  ctx.save();
  ctx.shadowColor = "rgba(60,45,30,.22)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#FFFDF8";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.drawImage(page, x, y, w, h);
  ctx.fillStyle = "#9A8F80";
  ctx.font = '500 30px "PingFang SC", -apple-system, "Helvetica Neue", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("made with Little Days", STORY.width / 2, STORY.height - 110);
  return canvas;
}
// Opens the share sheet with the Story picture where the browser / iOS shell
// can share files; otherwise saves it. Resolves "shared" | "saved" | "cancelled".
export async function shareStory(editor, options = {}) {
  const canvas = await renderStoryCanvas(editor, options);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const name = fileName(editor, { ...options, suffix: "story" }, "png");
  const file = blob && typeof File === "function" ? new File([blob], name, { type: "image/png" }) : null;
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Little Days" });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }
  download(canvas.toDataURL("image/png"), name);
  return "saved";
}
export async function exportJournalImage(editor, options = {}) {
  const canvas = await renderJournalCanvas(editor, options);
  download(canvas.toDataURL("image/png"), fileName(editor, options, "png"));
  return canvas;
}

// A still frame for PNG export: the poster, or a frame from the clip itself.
async function videoStill(src, poster) {
  if (poster) {
    try {
      return await loadImage(poster);
    } catch {}
  }
  if (!src) return null;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = src;
  const ok = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 4000);
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      clearTimeout(timer);
      resolve(true);
    };
    video.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
  });
  return ok ? video : null;
}
function drawVideoLayer(ctx, source, layer) {
  const w = ((Number(layer.w) || 58) / 100) * 1080,
    h = ((Number(layer.h) || 30) / 100) * 1350,
    pad = 10;
  const sw0 = source?.videoWidth || source?.width || 0,
    sh0 = source?.videoHeight || source?.height || 0;
  if (MASK_SHAPES.includes(layer.shape)) {
    drawMasked(ctx, layer.shape, w, h, (x, y, dw, dh) => {
      if (sw0 && sh0) drawCover(ctx, source, sw0, sh0, x, y, dw, dh);
    });
    return;
  }
  if (layer.shape === "film") {
    // A strip of film: dark band with sprocket holes above and below.
    const band = Math.max(18, h * 0.12);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.25)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#26221E";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.fillStyle = "#F6F1E6";
    const hole = band * 0.42;
    for (let x = -w / 2 + hole; x < w / 2 - hole; x += hole * 2.2) {
      ctx.fillRect(x, -h / 2 + (band - hole) / 2, hole, hole);
      ctx.fillRect(x, h / 2 - band + (band - hole) / 2, hole, hole);
    }
    if (sw0 && sh0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2 + band, w, h - band * 2);
      ctx.clip();
      drawCover(ctx, source, sw0, sh0, -w / 2, -h / 2 + band, w, h - band * 2);
      ctx.restore();
    }
    return;
  }
  ctx.fillStyle = "#FFFDF8";
  ctx.shadowColor = "rgba(93,73,60,.2)";
  ctx.shadowBlur = 12;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowBlur = 0;
  const iw = w - pad * 2,
    ih = h - pad * 2;
  ctx.fillStyle = "#3F3A33";
  ctx.fillRect(-iw / 2, -ih / 2, iw, ih);
  const sw = source?.videoWidth || source?.width || 0,
    sh = source?.videoHeight || source?.height || 0;
  if (sw && sh) {
    const cover = Math.max(iw / sw, ih / sh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-iw / 2, -ih / 2, iw, ih);
    ctx.clip();
    ctx.drawImage(source, -sw * cover / 2, -sh * cover / 2, sw * cover, sh * cover);
    ctx.restore();
  }
}
function drawAudioTicket(ctx, layer, name, font) {
  const w = ((Number(layer.w) || 64) / 100) * 1080,
    h = 150;
  ctx.fillStyle = "#F6F1E6";
  ctx.strokeStyle = "#E6DAC5";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect?.(-w / 2, -h / 2, w, h, 40);
  if (!ctx.roundRect) ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7D8D6D";
  ctx.beginPath();
  ctx.arc(-w / 2 + 75, 0, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFDF8";
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 62, -20);
  ctx.lineTo(-w / 2 + 96, 0);
  ctx.lineTo(-w / 2 + 62, 20);
  ctx.fill();
  ctx.fillStyle = "#4D463E";
  ctx.font = `500 34px ${font}`;
  ctx.textBaseline = "middle";
  ctx.fillText(String(name).slice(0, 18), -w / 2 + 140, -22);
  ctx.fillStyle = "#C8B9A3";
  for (let i = 0; i < 14; i++) {
    const bar = 10 + ((i * 37) % 30);
    ctx.fillRect(-w / 2 + 140 + i * 18, 30 - bar / 2, 9, bar);
  }
}

// Records the page as a video: the paper as background, video clips playing
// in their frames, and every clip's sound mixed in. Up to 60 seconds. The
// page's background music (options.music, a URL) loops softly underneath and
// fades out at the end; a page with only music becomes a 15-second video.
export async function exportJournalVideo(editor, options = {}) {
  const resolve = options.resolvePhoto || safePhoto;
  const base = await renderJournalCanvas(editor, { ...options, skipVideo: true });
  const W = 720,
    H = 900,
    scale = W / 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const placed = editor.layers
    .filter((layer) => layer.kind === "video" || layer.kind === "audio")
    .map((layer) => ({ layer, clip: (editor.media || []).find((c) => c.id === layer.clipId) }))
    .filter((item) => item.clip && resolve(item.clip.source));
  const elements = [];
  for (const { layer, clip } of placed) {
    const el = document.createElement(clip.kind === "video" ? "video" : "audio");
    el.preload = "auto";
    el.playsInline = true;
    el.src = resolve(clip.source);
    await new Promise((done) => {
      const timer = setTimeout(done, 5000);
      el.onloadedmetadata = () => {
        clearTimeout(timer);
        done();
      };
      el.onerror = () => {
        clearTimeout(timer);
        done();
      };
    });
    elements.push({ layer, clip, el });
  }
  const lengths = elements.map(({ el, clip }) =>
    Number.isFinite(el.duration) && el.duration > 0 ? el.duration : Number(clip.duration) || 0,
  );
  let music = null;
  if (options.music) {
    music = document.createElement("audio");
    music.preload = "auto";
    music.loop = true;
    music.src = options.music;
    await new Promise((done) => {
      const timer = setTimeout(done, 5000);
      music.oncanplaythrough = music.onerror = () => {
        clearTimeout(timer);
        done();
      };
    });
    if (music.error) music = null;
  }
  const duration = Math.min(60, Math.max(music && !elements.length ? 15 : 4, ...lengths));
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  let audio = null,
    mix = null;
  let musicGain = null;
  if (AudioCtx && (elements.length || music)) {
    audio = new AudioCtx();
    mix = audio.createMediaStreamDestination();
    for (const { el } of elements) audio.createMediaElementSource(el).connect(mix);
    if (music) {
      // Softer under voices and videos; fades out over the last 1.5 s.
      musicGain = audio.createGain();
      const loudness = Number.isFinite(options.musicVolume) ? options.musicVolume / 0.7 : 1;
      const level = Math.min(1, (elements.length ? 0.35 : 0.8) * loudness);
      musicGain.gain.setValueAtTime(level, 0);
      audio.createMediaElementSource(music).connect(musicGain).connect(mix);
      musicGain.level = level;
    }
  }
  const stream = canvas.captureStream(30);
  mix?.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
  const mime =
    ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(
      (type) => globalThis.MediaRecorder?.isTypeSupported(type),
    ) || "";
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 3000000 } : {});
  const chunks = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  const stopped = new Promise((done) => (recorder.onstop = done));
  const draw = () => {
    ctx.drawImage(base, 0, 0, W, H);
    ctx.save();
    ctx.scale(scale, scale);
    for (const { layer, el } of elements) {
      if (layer.kind !== "video") continue;
      ctx.save();
      ctx.translate((layer.x / 100) * 1080, (layer.y / 100) * 1350);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);
      drawVideoLayer(ctx, el.readyState >= 2 ? el : null, layer);
      ctx.restore();
    }
    ctx.restore();
  };
  draw();
  recorder.start(250);
  await audio?.resume();
  await Promise.all(
    [...elements.map(({ el }) => el), ...(musicGain ? [music] : [])].map((el) => {
      el.currentTime = 0;
      return el.play().catch(() => {});
    }),
  );
  if (musicGain) {
    const now = audio.currentTime;
    musicGain.gain.setValueAtTime(musicGain.level, now + Math.max(0, duration - 1.5));
    musicGain.gain.linearRampToValueAtTime(0, now + duration);
  }
  const started = performance.now();
  let cancelled = false;
  await new Promise((done) => {
    const tick = () => {
      draw();
      const seconds = (performance.now() - started) / 1000;
      options.onProgress?.(seconds, duration);
      cancelled = Boolean(options.isCancelled?.());
      if (cancelled || seconds >= duration) done();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  elements.forEach(({ el }) => el.pause());
  music?.pause();
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((track) => track.stop());
  await audio?.close();
  if (cancelled) {
    const error = new Error("export.cancelled");
    error.code = "cancelled";
    throw error;
  }
  const type = recorder.mimeType || mime || "video/webm";
  const blob = new Blob(chunks, { type });
  if (!blob.size) throw new Error("export.videoFailed");
  const url = URL.createObjectURL(blob);
  download(url, fileName(editor, options, type.includes("mp4") ? "mp4" : "webm"));
  setTimeout(() => URL.revokeObjectURL(url), 20000);
  return blob;
}
