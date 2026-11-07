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
function drawPhotoLayer(ctx, image, layer) {
  const w = ((Number(layer.w) || 42) / 100) * 1080,
    h = ((Number(layer.h) || 34) / 100) * 1350;
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
export async function exportJournalImage(editor, options = {}) {
  const resolvePhoto = options.resolvePhoto || safePhoto;
  const dayPage = options.dayPage !== false;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle =
    editor.template === "vintage"
      ? "#EEE6D5"
      : editor.template === "cute"
        ? "#FFFAF2"
        : "#FFFDFA";
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
  if (dayPage) {
    ctx.fillStyle = editor.textStyle?.color || "#2F2A26";
    ctx.font = `${editor.textStyle?.weight || 400} ${(editor.textStyle?.size || 16) * 3.375}px ${font}`;
    wrapText(ctx, editor.title || "今天的小美好", 129, 910, 820, 78, 2);
    ctx.fillStyle = "#998C7A";
    const bodyFont = options.fontFamily
      ? options.fontFamily(editor.bodyFont || editor.font, options.catalog)
      : font;
    ctx.font = `34px ${bodyFont}`;
    wrapText(ctx, editor.body || "", 129, 1110, 820, 58, 3);
    ctx.font = "125px sans-serif";
    ctx.fillText(editor.mood || "", 875, 820);
  }
  for (const layer of editor.layers) {
    ctx.save();
    ctx.translate((layer.x / 100) * 1080, (layer.y / 100) * 1350);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);
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
  const link = document.createElement("a");
  link.download = `Little-Days-${editor.date || options.date || "page"}${options.suffix ? "-" + options.suffix : ""}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
