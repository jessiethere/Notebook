const safePhoto = (photo) =>
  typeof photo === "string" &&
  (photo.startsWith("/assets/") ||
    /^data:image\/(jpeg|png|webp);base64,/.test(photo))
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
export async function exportJournalImage(editor) {
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
  ctx.save();
  ctx.translate(540, 430);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.fillStyle = "#FFFDFB";
  ctx.fillRect(-400, -310, 800, 635);
  if (safePhoto(editor.photo)) {
    const image = await loadImage(safePhoto(editor.photo));
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
  }
  ctx.restore();
  ctx.fillStyle = editor.template === "cute" ? "#DDBBB3BB" : "#C5CEB1BB";
  ctx.fillRect(405, 90, 270, 65);
  const font =
    editor.font === "serif"
      ? 'Georgia, "Songti SC", SimSun, serif'
      : editor.font === "rounded"
        ? '"Trebuchet MS", "Microsoft YaHei", sans-serif'
        : "sans-serif";
  ctx.fillStyle = "#2F2A26";
  ctx.font = `54px ${font}`;
  wrapText(ctx, editor.title || "今天的小美好", 129, 910, 820, 78, 2);
  ctx.fillStyle = "#998C7A";
  ctx.font = `34px ${font}`;
  wrapText(ctx, editor.body || "", 129, 1110, 820, 58, 3);
  ctx.font = "125px sans-serif";
  ctx.fillText(editor.mood, 875, 820);
  for (const layer of editor.layers) {
    ctx.save();
    ctx.translate((layer.x / 100) * 1080, (layer.y / 100) * 1350);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);
    ctx.font = "140px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(layer.text, 0, 0);
    ctx.restore();
  }
  const link = document.createElement("a");
  link.download = `Little-Days-${editor.date}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
