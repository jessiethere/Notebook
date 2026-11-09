import { MASK_SHAPES, shapePath } from "./shapes.mjs";
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
async function renderJournalCanvas(editor, options = {}) {
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
  const backdropMatch = /^(scene|photo):([a-z0-9-]+)$/.exec(editor.backdrop || "");
  const backdrop = backdropMatch && (backdropMatch[1] === "scene" ? options.catalog?.scenes : options.catalog?.photos)?.find((item) => item.id === backdropMatch[2]);
  if (backdrop) {
    try {
      const image = await loadImage(resolvePhoto(editor.backdrop));
      const ratio = Math.max(1080 / image.width, 1350 / image.height);
      ctx.drawImage(image, (1080 - image.width * ratio) / 2, (1350 - image.height * ratio) / 2, image.width * ratio, image.height * ratio);
    } catch {
      // Keep the plain paper if the background cannot load.
    }
  }
  const darkBackdrop = backdrop?.tone === "dark";
  if (backdrop && (dayPage || editor.layoutTemplate === "text")) {
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
  if (dayPage || editor.layoutTemplate === "text") {
    const titleColor = editor.textStyle?.color || "#2F2A26";
    ctx.fillStyle = darkBackdrop && /^#2f2a26$/i.test(titleColor) ? "#FFFFFF" : titleColor;
    ctx.font = `${editor.textStyle?.weight || 400} ${(editor.textStyle?.size || 16) * 3.375}px ${font}`;
    wrapText(ctx, editor.title || "今天的小美好", 129, 910, 820, 78, 2);
    ctx.fillStyle = darkBackdrop ? "#E9E4F5" : "#998C7A";
    const bodyFont = options.fontFamily
      ? options.fontFamily(editor.bodyFont || editor.font, options.catalog)
      : font;
    ctx.font = `34px ${bodyFont}`;
    wrapText(ctx, editor.body || "", 129, 1110, 820, 58, 3);
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
      ctx.fillStyle = "#FBF8EE";
      ctx.strokeStyle = "#C9D7C1";
      ctx.lineWidth = 3;
      ctx.fillRect(-width / 2, -110, width, 220);
      ctx.strokeRect(-width / 2, -110, width, 220);
      ctx.fillStyle = "#4F5A43";
      ctx.textBaseline = "top";
      ctx.font = `600 40px ${font}`;
      wrapText(
        ctx,
        card?.title || layer.text || "",
        -width / 2 + 30,
        -85,
        width - 60,
        50,
        1,
      );
      ctx.fillStyle = "#8D857B";
      ctx.font = `30px ${font}`;
      wrapText(ctx, card?.facts || "", -width / 2 + 30, -25, width - 60, 40, 1);
      ctx.fillStyle = "#2F2A26";
      wrapText(ctx, card?.note || "", -width / 2 + 30, 20, width - 60, 40, 2);
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
      const family = options.fontFamily
        ? options.fontFamily(layer.fontId || editor.font, options.catalog)
        : font;
      ctx.font = `${layer.weight || 400} ${(layer.fontSize || 16) * 3.375}px ${family}`;
      ctx.fillStyle = layer.color || "#2F2A26";
      ctx.textAlign = layer.align || "left";
      ctx.textBaseline = "top";
      wrapText(ctx, layer.text, -350, -40, 700, (layer.fontSize || 16) * 5, 6);
      ctx.restore();
      continue;
    }
    ctx.font = "140px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(layer.text, 0, 0);
    ctx.restore();
  }
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
// in their frames, and every clip's sound mixed in. Up to 60 seconds.
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
  const duration = Math.min(60, Math.max(4, ...lengths));
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  let audio = null,
    mix = null;
  if (AudioCtx && elements.length) {
    audio = new AudioCtx();
    mix = audio.createMediaStreamDestination();
    for (const { el } of elements) audio.createMediaElementSource(el).connect(mix);
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
    elements.map(({ el }) => {
      el.currentTime = 0;
      return el.play().catch(() => {});
    }),
  );
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
