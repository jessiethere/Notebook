// Shapes for photos and videos on the paper: landscape, portrait, square,
// round, arch, heart and film. Used by the editor (CSS), the reading view and
// the PNG / video export (canvas paths), so all three always match.
export const SHAPES = ["landscape", "portrait", "square", "circle", "arch", "heart", "film"];
// Shapes that cut the picture itself (no white border around it).
export const MASK_SHAPES = ["circle", "arch", "heart"];
export const SHAPE_ASPECT = {
  landscape: 16 / 9,
  portrait: 9 / 16,
  square: 1,
  circle: 1,
  arch: 3 / 4,
  heart: 1,
  film: 4 / 3,
};
export const SHAPE_WIDTH = { landscape: 58, portrait: 32, square: 42, circle: 42, arch: 36, heart: 44, film: 56 };
// The paper is 4:5, layer w is % of its width and h % of its height.
const PAPER_RATIO = 0.8;
const round = (value) => Math.round(value * 10) / 10;

export function isShape(shape) {
  return SHAPES.includes(shape);
}
// Width/height (in % of the paper) that give a shape its true proportions.
export function shapeSize(shape, width = SHAPE_WIDTH[shape]) {
  const aspect = SHAPE_ASPECT[shape];
  if (!aspect) return null;
  let w = Number(width) || SHAPE_WIDTH[shape] || 40;
  let h = (w * PAPER_RATIO) / aspect;
  const maxH = 66;
  if (h > maxH) {
    h = maxH;
    w = (h * aspect) / PAPER_RATIO;
  }
  return { w: round(w), h: round(h) };
}
// A clip's own orientation decides how it first lands on the paper.
export function shapeForSize(width, height) {
  if (!width || !height) return "landscape";
  const ratio = width / height;
  return ratio < 0.85 ? "portrait" : ratio > 1.18 ? "landscape" : "square";
}

// Heart in a unit box (also used as the CSS mask, viewBox 0 0 100 100).
const HEART = [
  [0.5, 0.92],
  [0.12, 0.66, 0, 0.38, 0.18, 0.18],
  [0.33, 0.03, 0.5, 0.12, 0.5, 0.28],
  [0.5, 0.12, 0.67, 0.03, 0.82, 0.18],
  [1, 0.38, 0.88, 0.66, 0.5, 0.92],
];
export const HEART_SVG_PATH = `M${HEART[0].map((v) => v * 100).join(" ")} ${HEART.slice(1)
  .map((c) => `C${c.map((v) => v * 100).join(" ")}`)
  .join(" ")}Z`;

export function shapePath(ctx, shape, x, y, w, h) {
  ctx.beginPath();
  if (shape === "circle") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (shape === "arch") {
    const r = Math.min(w / 2, h);
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arc(x + w / 2, y + r, w / 2, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  } else if (shape === "heart") {
    ctx.moveTo(x + HEART[0][0] * w, y + HEART[0][1] * h);
    for (const c of HEART.slice(1))
      ctx.bezierCurveTo(x + c[0] * w, y + c[1] * h, x + c[2] * w, y + c[3] * h, x + c[4] * w, y + c[5] * h);
    ctx.closePath();
  } else ctx.rect(x, y, w, h);
}
