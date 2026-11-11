"""Cut Captain (Little Keeper) out of the Captain visual-standard reference.

Usage: python3 tools/extract_captain.py <captain-reference.png> [--out DIR] [--preview DIR]

Source: "参考图 1 · Captain 角色视觉标准" (958x1024), provided and authorised by
the product owner on 2026-11-10. It is the only art standard for Captain.
The reference itself is never shipped; only the cut-outs are.

States cut (V8.0): Normal, Happy, Sleepy (standing, same scale, one canvas,
one baseline) and Peek (head and paws over a card edge).

How (no redrawing — every pixel comes from the reference):
1. Background: the panel is a flat cream (within +-2 levels). Pixels connected
   to the crop border that are near that cream, or are its soft drop shadow
   (a *warm* darkening: red falls least, blue most; grey fur falls evenly or
   towards blue), are background. The baked shadow is dropped on purpose — the
   app adds its own soft shadow, so the picture sits on any page.
2. Only the cat is kept: the largest connected part. Sparkles and "zZ"
   (decorations / lettering) are separate parts and are removed.
3. Fur edges: in a 2-pixel band around the outline, alpha is estimated from
   the pixel, the local background and the nearby fur colour
   (C = a*F + (1-a)*B), and the colour is "decontaminated" (the cream is taken
   out), so fur tips stay soft without a light halo on dark pages.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Keepers"

# Boxes in the 958x1024 reference (x0, y0, x1, y1).
STANDING = {
    "normal": (50, 88, 252, 364),
    "happy": (271, 88, 490, 364),
    "sleepy": (497, 88, 685, 364),
}
PEEK_BOX = (205, 426, 547, 730)
PEEK_EDGE = 708  # the reference card's top edge (y)


def grow(region, passable):
    while True:
        g = region.copy()
        g[1:] |= region[:-1]
        g[:-1] |= region[1:]
        g[:, 1:] |= region[:, :-1]
        g[:, :-1] |= region[:, 1:]
        g &= passable
        if (g == region).all():
            return region
        region = g


def dilate(mask, r=1):
    out = mask.copy()
    for _ in range(r):
        m = out.copy()
        m[1:] |= out[:-1]
        m[:-1] |= out[1:]
        m[:, 1:] |= out[:, :-1]
        m[:, :-1] |= out[:, 1:]
        out = m
    return out


def components(mask):
    """Label 4-connected components (small images: a simple flood is fine)."""
    labels = np.zeros(mask.shape, int)
    current = 0
    for y, x in zip(*np.nonzero(mask)):
        if labels[y, x]:
            continue
        current += 1
        stack = [(y, x)]
        labels[y, x] = current
        while stack:
            cy, cx = stack.pop()
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not labels[ny, nx]:
                    labels[ny, nx] = current
                    stack.append((ny, nx))
    return labels, current


def box_mean(img, mask, r):
    """Mean of img over mask pixels in a (2r+1)^2 window (via integral images)."""
    h, w = mask.shape
    m = mask.astype(float)
    vals = img * m[..., None] if img.ndim == 3 else img * m

    def window_sum(a):
        pad = np.pad(a, [(r + 1, r)] + [(r + 1, r)] + [(0, 0)] * (a.ndim - 2))
        c = pad.cumsum(0).cumsum(1)
        return c[2 * r + 1:, 2 * r + 1:] - c[:-2 * r - 1, 2 * r + 1:] - c[2 * r + 1:, :-2 * r - 1] + c[:-2 * r - 1, :-2 * r - 1]

    s = window_sum(vals)
    n = window_sum(m)
    return s / np.maximum(n, 1e-6)[..., None] if img.ndim == 3 else s / np.maximum(n, 1e-6), n


def matte(crop, background, keep_below=None):
    """crop: float RGB. background: bool mask of definite background.
    Returns RGBA uint8 with refined fur edges."""
    fg = ~background
    # Only the cat: the largest solid part (drops sparkles and "zZ", which a
    # faint glow can join to the outline), plus its own soft edge.
    bg_colour = np.median(crop[background], axis=0)
    solid = fg & (np.abs(crop - bg_colour).max(axis=2) > 24)
    labels, n = components(solid)
    if n > 1:
        sizes = np.bincount(labels.ravel())[1:]
        main = labels == (int(np.argmax(sizes)) + 1)
        others = solid & ~main
        fg = fg & ~(dilate(others, 4) & ~dilate(main, 1))
        # then keep the cat's own connected piece (pale paws included)
        labels, n = components(fg)
        sizes = np.bincount(labels.ravel())[1:]
        fg = labels == (int(np.argmax(sizes)) + 1)
        background = ~fg
    band = dilate(fg, 2) & dilate(background, 2)
    sure_fg = fg & ~band
    sure_bg = background & ~band
    F, nf = box_mean(crop, sure_fg, 3)
    B, nb = box_mean(crop, sure_bg, 3)
    F2, _ = box_mean(crop, sure_fg, 6)
    B2, _ = box_mean(crop, sure_bg, 6)
    F = np.where((nf > 0)[..., None], F, F2)
    B = np.where((nb > 0)[..., None], B, B2)
    diff = F - B
    alpha_est = ((crop - B) * diff).sum(axis=2) / np.maximum((diff ** 2).sum(axis=2), 1.0)
    alpha_est = np.clip(alpha_est, 0, 1)
    # where fur and background barely differ, trust the hard mask
    weak = (diff ** 2).sum(axis=2) < 400
    alpha = np.where(sure_fg, 1.0, 0.0)
    alpha = np.where(band, np.where(weak, fg.astype(float), alpha_est), alpha)
    # colour: take the background out of edge pixels
    a = np.maximum(alpha, 1e-3)[..., None]
    solved = np.clip((crop - (1 - a) * B) / a, 0, 255)
    mix = np.clip((alpha[..., None] - 0.15) / 0.5, 0, 1)
    colour = np.where(band[..., None], mix * solved + (1 - mix) * F, crop)
    alpha[alpha < 0.04] = 0
    # Small pale fragments on the outline (glow left by the removed sparkles /
    # "zZ", cream pockets by the stem) are not the cat. Paws and eye glints
    # are far larger or inside the outline, so they stay.
    bg_colour = np.median(crop[sure_bg], axis=0)
    pale = (alpha > 0) & (colour.min(axis=2) > 205)
    labels, n = components(pale)
    clear = dilate(alpha == 0, 1)
    for i in range(1, n + 1):
        part = labels == i
        size = int(part.sum())
        if size >= 40:
            continue
        if (part & clear).any():
            alpha[part] = 0
    # Cream pockets enclosed by the stem and leaf (top 22% of the picture only,
    # far from the pale paws): exactly the background colour, so background.
    top = np.arange(alpha.shape[0])[:, None] < alpha.shape[0] * 0.22
    warm_cream = (np.abs(crop - bg_colour).max(axis=2) <= 7) & ((crop[..., 0] - crop[..., 2]) >= (bg_colour[0] - bg_colour[2]) - 6)
    labels, n = components(warm_cream & top & (alpha > 0))
    for i in range(1, n + 1):
        part = labels == i
        if part.sum() >= 4:
            alpha[dilate(part, 1) & (np.abs(crop - bg_colour).max(axis=2) <= 16)] = 0
    out = np.zeros(crop.shape[:2] + (4,), np.uint8)
    out[..., :3] = np.clip(colour, 0, 255).round().astype(np.uint8)
    out[..., 3] = (alpha * 255).round().astype(np.uint8)
    return out


def standing_background(crop):
    h = crop.shape[0]
    bg = np.median(np.concatenate([crop[:3].reshape(-1, 3), crop[:, :3].reshape(-1, 3), crop[:, -3:].reshape(-1, 3)]), axis=0)
    s = crop / bg
    deficit = 1 - s.mean(axis=2)
    warm = s[..., 0] - s[..., 2]
    # The paws are a cooler white than the warm cream: never background.
    cooler = (crop[..., 0] - crop[..., 2]) < (bg[0] - bg[2]) - 6
    near = (np.abs(crop - bg).max(axis=2) <= 7) & ~cooler
    shadow = (np.arange(h)[:, None] > h * 0.88) & (deficit > 0) & (deficit < 0.5) & (warm >= 0.25 * deficit - 0.006) & (warm <= 0.95 * deficit + 0.01) & (s[..., 0] + 0.012 >= s[..., 1]) & (s[..., 1] + 0.012 >= s[..., 2])
    passable = near | shadow
    seed = np.zeros(passable.shape, bool)
    seed[0], seed[-1], seed[:, 0], seed[:, -1] = passable[0], passable[-1], passable[:, 0], passable[:, -1]
    return grow(seed, passable)


def peek_background(crop, edge):
    h, w = crop.shape[:2]
    bg = np.median(crop[:5].reshape(-1, 3), axis=0)
    near = np.abs(crop - bg).max(axis=2) <= 9
    yy, xx = np.mgrid[0:h, 0:w]
    label = (xx < 300 - PEEK_BOX[0]) & (yy < 500 - PEEK_BOX[1])  # the "Peek" caption pill
    passable = (near | label) & (yy < edge)
    seed = np.zeros((h, w), bool)
    seed[0] = passable[0]
    seed[:, 0] |= passable[:, 0]
    seed[:, -1] |= passable[:, -1]
    region = grow(seed, passable)
    # Below the reference card's edge only the grey paws are the cat: the
    # card is brighter or warmer than fur.
    below = yy >= edge - 3
    warmth = crop[..., 0] - crop[..., 2]
    paw = (crop.max(axis=2) < 226) & (warmth < 44)
    region |= below & ~paw
    return region


def trim(rgba):
    ys, xs = np.nonzero(rgba[..., 3] > 0)
    return rgba[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("reference")
    parser.add_argument("--out", default=str(OUT))
    parser.add_argument("--preview", default="")
    args = parser.parse_args()
    src = np.asarray(Image.open(args.reference).convert("RGB")).astype(float)
    if src.shape[:2] != (1024, 958):
        raise SystemExit(f"expected the 958x1024 Captain reference, got {src.shape[1]}x{src.shape[0]}")
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    report = []
    cuts = {}
    for mood, (x0, y0, x1, y1) in STANDING.items():
        crop = src[y0:y1, x0:x1]
        cuts[mood] = trim(matte(crop, standing_background(crop)))
    width = max(c.shape[1] for c in cuts.values()) + 6
    height = max(c.shape[0] for c in cuts.values()) + 6
    for mood, rgba in cuts.items():
        canvas = np.zeros((height, width, 4), np.uint8)
        h, w = rgba.shape[:2]
        top, left = height - h - 3, (width - w) // 2  # same baseline, centred
        canvas[top: top + h, left: left + w] = rgba
        name = f"LD-keeper-cat-lemon-{mood}.png"
        Image.fromarray(canvas, "RGBA").save(out / name, optimize=True)
        report.append({"file": name, "size": [width, height]})
    x0, y0, x1, y1 = PEEK_BOX
    crop = src[y0:y1, x0:x1]
    peek = trim(matte(crop, peek_background(crop, PEEK_EDGE - y0)))
    Image.fromarray(peek, "RGBA").save(out / "LD-keeper-cat-lemon-peek.png", optimize=True)
    report.append({"file": "LD-keeper-cat-lemon-peek.png", "size": [peek.shape[1], peek.shape[0]]})
    print(json.dumps(report))


if __name__ == "__main__":
    main()
