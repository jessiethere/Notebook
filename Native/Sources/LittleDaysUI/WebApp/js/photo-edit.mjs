// Photo editing in the style of photo apps: filters, crop to a ratio, light /
// colour adjustments and a title on the picture. Non-destructive: the
// original Blob is kept (layer.sourceRef) together with the edit settings
// (layer.edit); the edited picture is a new Blob (layer.mediaRef).
//
// The preview uses a CSS filter string; the saved picture applies the SAME
// operations as a colour matrix on the pixels, so it also works where canvas
// `ctx.filter` is unsupported (older Safari / WKWebView).

// Each filter is a list of CSS-filter-like operations.
export const FILTERS = [
  { id: "original", ops: [] },
  { id: "fresh", ops: [["saturate", 1.15], ["brightness", 1.06], ["hue", -6]] },
  { id: "warm", ops: [["sepia", 0.22], ["saturate", 1.2], ["brightness", 1.04]] },
  { id: "cream", ops: [["brightness", 1.1], ["contrast", 0.9], ["saturate", 0.85]] },
  { id: "film", ops: [["contrast", 1.1], ["saturate", 0.85], ["sepia", 0.15]] },
  { id: "cool", ops: [["saturate", 0.9], ["hue", 12], ["brightness", 1.04]] },
  { id: "vintage", ops: [["sepia", 0.45], ["contrast", 0.95], ["brightness", 0.98]] },
  { id: "mono", ops: [["grayscale", 1], ["contrast", 1.1]] },
];
export const RATIOS = [
  { id: "original", value: null },
  { id: "1:1", value: 1 },
  { id: "3:4", value: 3 / 4 },
  { id: "4:3", value: 4 / 3 },
  { id: "9:16", value: 9 / 16 },
  { id: "16:9", value: 16 / 9 },
];
export const TEXT_STYLES = ["handwritten", "label", "tape", "outline"];
export const TEXT_COLORS = ["#FFFFFF", "#2F2A26", "#B07C7C", "#6C7B56", "#E8B04B", "#5B7FA6"];
export const ADJUSTMENTS = ["brightness", "contrast", "saturation", "warmth"];

export function defaultEdit() {
  return {
    filter: "original",
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    ratio: "original",
    zoom: 1,
    x: 50,
    y: 50,
    rotate: 0,
    text: null,
  };
}
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

// Keeps old/foreign values safe to render.
export function normalizeEdit(edit = {}) {
  const base = defaultEdit();
  const out = {
    filter: FILTERS.some((f) => f.id === edit.filter) ? edit.filter : base.filter,
    brightness: clamp(edit.brightness, -50, 50),
    contrast: clamp(edit.contrast, -50, 50),
    saturation: clamp(edit.saturation, -50, 50),
    warmth: clamp(edit.warmth, -50, 50),
    ratio: RATIOS.some((r) => r.id === edit.ratio) ? edit.ratio : base.ratio,
    zoom: clamp(edit.zoom ?? 1, 1, 3),
    x: clamp(edit.x ?? 50, 0, 100),
    y: clamp(edit.y ?? 50, 0, 100),
    rotate: [0, 90, 180, 270].includes(edit.rotate) ? edit.rotate : 0,
    text: null,
  };
  const text = String(edit.text?.value ?? "").slice(0, 60);
  if (text.trim())
    out.text = {
      value: text,
      style: TEXT_STYLES.includes(edit.text.style) ? edit.text.style : "handwritten",
      color: /^#[0-9a-f]{6}$/i.test(edit.text.color || "") ? edit.text.color : "#FFFFFF",
      size: clamp(edit.text.size ?? 9, 4, 18),
      x: clamp(edit.text.x ?? 50, 5, 95),
      y: clamp(edit.text.y ?? 82, 5, 95),
    };
  return out;
}
export function isIdentity(edit) {
  const e = normalizeEdit(edit);
  const d = defaultEdit();
  return Object.keys(d).every((key) => key === "text" ? !e.text : e[key] === d[key]);
}

// Filter + adjustments as one ordered list of operations.
export function operations(edit) {
  const e = normalizeEdit(edit);
  const ops = [...(FILTERS.find((f) => f.id === e.filter)?.ops || [])];
  if (e.brightness) ops.push(["brightness", 1 + e.brightness / 100]);
  if (e.contrast) ops.push(["contrast", 1 + e.contrast / 100]);
  if (e.saturation) ops.push(["saturate", 1 + e.saturation / 100]);
  if (e.warmth > 0) ops.push(["sepia", e.warmth / 150], ["saturate", 1 + e.warmth / 250]);
  if (e.warmth < 0) ops.push(["hue", e.warmth * -0.4], ["saturate", 1 + e.warmth / 300]);
  return ops;
}
export function cssFilter(edit) {
  const name = { hue: "hue-rotate", saturate: "saturate" };
  return (
    operations(edit)
      .map(([op, v]) => `${name[op] || op}(${op === "hue" ? `${v}deg` : v})`)
      .join(" ") || "none"
  );
}

/* ---------- Colour matrix (same maths as the CSS filter spec) ---------- */

// 3x4 affine matrices: rows r,g,b → [m0 m1 m2 offset] on 0..1 values.
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
function opMatrix(op, v) {
  switch (op) {
    case "brightness":
      return [v, 0, 0, 0, 0, v, 0, 0, 0, 0, v, 0];
    case "contrast": {
      const o = 0.5 - 0.5 * v;
      return [v, 0, 0, o, 0, v, 0, o, 0, 0, v, o];
    }
    case "saturate":
      return [
        0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0,
        0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0,
        0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v, 0,
      ];
    case "grayscale": {
      const a = 1 - Math.min(1, v);
      return [
        0.2126 + 0.7874 * a, 0.7152 - 0.7152 * a, 0.0722 - 0.0722 * a, 0,
        0.2126 - 0.2126 * a, 0.7152 + 0.2848 * a, 0.0722 - 0.0722 * a, 0,
        0.2126 - 0.2126 * a, 0.7152 - 0.7152 * a, 0.0722 + 0.9278 * a, 0,
      ];
    }
    case "sepia": {
      const a = 1 - Math.min(1, v);
      return [
        0.393 + 0.607 * a, 0.769 - 0.769 * a, 0.189 - 0.189 * a, 0,
        0.349 - 0.349 * a, 0.686 + 0.314 * a, 0.168 - 0.168 * a, 0,
        0.272 - 0.272 * a, 0.534 - 0.534 * a, 0.131 + 0.869 * a, 0,
      ];
    }
    case "hue": {
      const r = (v * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
      return [
        0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928, 0,
        0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283, 0,
        0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072, 0,
      ];
    }
    default:
      return IDENTITY;
  }
}
// b ∘ a  (apply a first, then b)
function compose(b, a) {
  const out = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = col === 3 ? b[row * 4 + 3] : 0;
      for (let k = 0; k < 3; k++) sum += b[row * 4 + k] * a[k * 4 + col];
      out.push(sum);
    }
  }
  return out;
}
// CSS filters clamp after every function; composing is exact for the
// in-range values these presets produce and close enough otherwise.
export function colorMatrix(edit) {
  return operations(edit).reduce((m, [op, v]) => compose(opMatrix(op, v), m), IDENTITY);
}
export function applyMatrix(data, matrix) {
  const m = matrix;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    data[i] = Math.round(Math.min(1, Math.max(0, m[0] * r + m[1] * g + m[2] * b + m[3])) * 255);
    data[i + 1] = Math.round(Math.min(1, Math.max(0, m[4] * r + m[5] * g + m[6] * b + m[7])) * 255);
    data[i + 2] = Math.round(Math.min(1, Math.max(0, m[8] * r + m[9] * g + m[10] * b + m[11])) * 255);
  }
  return data;
}

/* ---------- Crop ---------- */

// The part of the (rotated) source shown for a ratio, zoom and centre.
export function cropRect(width, height, edit) {
  const e = normalizeEdit(edit);
  const ratio = RATIOS.find((r) => r.id === e.ratio)?.value || width / height;
  let w = width, h = width / ratio;
  if (h > height) {
    h = height;
    w = height * ratio;
  }
  w /= e.zoom;
  h /= e.zoom;
  const cx = (e.x / 100) * width, cy = (e.y / 100) * height;
  const sx = Math.min(width - w, Math.max(0, cx - w / 2));
  const sy = Math.min(height - h, Math.max(0, cy - h / 2));
  return { sx, sy, sw: w, sh: h, ratio: w / h };
}
export function rotatedSize(width, height, rotate) {
  return rotate % 180 ? { width: height, height: width } : { width, height };
}

/* ---------- Rendering (browser only) ---------- */

const FONT = {
  handwritten: '"LD-handwritten", "LD-chinese", serif',
  label: '"LD-minimal-sans", "LD-chinese", system-ui, sans-serif',
  tape: '"LD-handwritten", "LD-chinese", serif',
  outline: '"LD-rounded-cute", "LD-chinese", system-ui, sans-serif',
};
export function textFont(style) {
  return FONT[style] || FONT.handwritten;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function drawTitle(ctx, text, width, height) {
  if (!text) return;
  const size = Math.round((text.size / 100) * width);
  ctx.save();
  ctx.font = `${text.style === "label" ? 600 : 400} ${size}px ${textFont(text.style)}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const x = (text.x / 100) * width, y = (text.y / 100) * height;
  const w = ctx.measureText(text.value).width;
  if (text.style === "label" || text.style === "tape") {
    ctx.fillStyle = text.style === "label" ? "#FFFDF8E6" : "#F3E4C8C0";
    roundRect(ctx, x - w / 2 - size * 0.5, y - size * 0.72, w + size, size * 1.44, text.style === "label" ? size * 0.4 : 2);
    ctx.fill();
  }
  if (text.style === "outline") {
    ctx.lineWidth = Math.max(2, size / 7);
    ctx.strokeStyle = text.color.toUpperCase() === "#FFFFFF" ? "#2F2A26" : "#FFFFFF";
    ctx.strokeText(text.value, x, y);
  } else if (text.style === "handwritten") {
    ctx.shadowColor = "#00000055";
    ctx.shadowBlur = size / 6;
  }
  ctx.fillStyle = text.style === "label" && text.color.toUpperCase() === "#FFFFFF" ? "#2F2A26" : text.color;
  ctx.fillText(text.value, x, y);
  ctx.restore();
}
// Draws the edited picture; returns a canvas (max side `maxSide` px).
export function renderEdited(image, edit, maxSide = 1600) {
  const e = normalizeEdit(edit);
  const { width, height } = rotatedSize(image.width, image.height, e.rotate);
  const rotated = document.createElement("canvas");
  rotated.width = width;
  rotated.height = height;
  const r = rotated.getContext("2d");
  r.translate(width / 2, height / 2);
  r.rotate((e.rotate * Math.PI) / 180);
  r.drawImage(image, -image.width / 2, -image.height / 2);
  const rect = cropRect(width, height, e);
  const factor = Math.min(1, maxSide / Math.max(rect.sw, rect.sh));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(rect.sw * factor));
  out.height = Math.max(1, Math.round(rect.sh * factor));
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(rotated, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, out.width, out.height);
  const ops = operations(e);
  if (ops.length) {
    const pixels = ctx.getImageData(0, 0, out.width, out.height);
    applyMatrix(pixels.data, colorMatrix(e));
    ctx.putImageData(pixels, 0, 0);
  }
  drawTitle(ctx, e.text, out.width, out.height);
  return out;
}
