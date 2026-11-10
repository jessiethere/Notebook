"""Cut the Little Keeper character sheet into one transparent PNG per character.

Usage: python3 tools/extract_keepers.py <sheet.png> [--out DIR] [--preview PNG]
       python3 tools/extract_keepers.py --captain <captain-reference.png> [--out DIR]

The sheet (provided and authorised by the product owner, 2026-11-10) shows
3 animals x 6 outfits/expressions on a flat cream background. Each character
is cut out separately (never the whole sheet as one asset):

* background = pixels connected to the crop's border that look like the cream
  background or its soft warm shadow, and are NOT brighter than it — the white
  Westie / bunny fur is a few levels brighter than the cream, so it is kept;
* the shadow under each character becomes a semi-transparent warm shadow, so
  it still sits naturally on any light page;
* ``--captain`` cuts two poses out of the Captain visual-standard reference
  (参考图 1, provided 2026-11-10, 958x1024): "Surprised / 惊喜" (used as
  Excited; the sheet's open-eyed lemon pose is what this reference calls
  "Normal", so it is saved as neutral) and "Peek / 探头": head and paws over a
  card edge. Above the edge the cream background is removed; below it only
  the grey paws stay (the card itself is darker-warm or brighter than fur),
  so the app's own Today card can take the card's place;
* every character gets the same canvas size, centred, standing on the same
  baseline, so they can replace each other without layout jumps.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Keepers"

# Reading order on the sheet: row 1 then row 2, left to right.
NAMES = [
    "bunny-sprout-neutral", "bunny-sprout-happy", "bunny-sprout-encouraging",
    "cat-lemon-neutral", "cat-lemon-happy", "cat-lemon-sleepy",
    "westie-sprout-neutral", "westie-sprout-happy", "westie-sprout-excited",
    "bunny-flower-neutral", "bunny-sleepy-happy", "bunny-strawberry-encouraging",
    "cat-beanie-neutral", "cat-sleepy-happy", "cat-frog-excited",
    "westie-beret-neutral", "westie-aviator-happy", "westie-bear-sleepy",
]
SHADOW_SPAN = np.array([150.0, 175.0, 193.0])  # background minus the full shadow colour


def segments(profile, gap):
    runs, start, quiet = [], None, 0
    for i, on in enumerate(profile):
        if on:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet > gap:
                runs.append((start, i - quiet + 1))
                start, quiet = None, 0
    if start is not None:
        runs.append((start, len(profile)))
    return runs


def character_boxes(rgb, bg):
    ink = (np.abs(rgb - bg).max(axis=2) > 8)
    rows = segments(ink.sum(axis=1) > 2, gap=20)
    rows = [r for r in rows if r[1] - r[0] > 120]
    boxes = []
    for y0, y1 in rows:
        band = ink[y0:y1]
        cols = segments(band.sum(axis=0) > 1, gap=4)
        big = [c for c in cols if c[1] - c[0] > 90]
        # small pieces (hearts, sparkles, "zZ") join the nearest character
        groups = [list(c) for c in big]
        for c in cols:
            if c in big:
                continue
            centre = (c[0] + c[1]) / 2
            nearest = min(groups, key=lambda g: abs((g[0] + g[1]) / 2 - centre))
            nearest[0], nearest[1] = min(nearest[0], c[0]), max(nearest[1], c[1])
        for x0, x1 in groups:
            boxes.append((x0, y0, x1, y1))
    return boxes


def matte(crop, bg):
    rgb = crop.astype(float)
    d = bg - rgb
    h = rgb.shape[0]
    brighter = ((rgb - bg) >= 2).sum(axis=2) >= 2
    a = d / SHADOW_SPAN
    a_mean = a.mean(axis=2)
    spread = a.max(axis=2) - a.min(axis=2)
    # The cream itself (and its faint edge blend): anywhere.
    near_bg = ~brighter & (np.abs(d).max(axis=2) <= 7)
    # The soft shadow: only near the feet, and only with the shadow's warm
    # tint (blue drops more than red) — fur and paws are neutral or cool.
    warm = (d[..., 2] >= 1.05 * d[..., 0]) & (d[..., 1] >= 0.95 * d[..., 0])
    feet = np.zeros(a_mean.shape, bool)
    feet[int(h * 0.9):, :] = True
    shadow_like = feet & ~brighter & warm & (a_mean < 0.85) & (spread < 0.06 + 0.12 * np.clip(a_mean, 0, 1))
    passable = near_bg | shadow_like
    region = np.zeros(passable.shape, bool)
    region[0, :] = passable[0, :]
    region[-1, :] = passable[-1, :]
    region[:, 0] |= passable[:, 0]
    region[:, -1] |= passable[:, -1]
    region = flood(region, passable)
    out = np.zeros(crop.shape[:2] + (4,), np.uint8)
    out[..., :3] = crop
    out[..., 3] = 255
    shadow_rgb = np.clip(bg - SHADOW_SPAN, 0, 255).astype(np.uint8)
    alpha = np.clip(a_mean, 0, 1)
    out[region, :3] = shadow_rgb
    out[region, 3] = (alpha[region] * 255).round().astype(np.uint8)
    # A soft 2-pixel edge: pixels touching the background that are still
    # close to the cream fade with that closeness (no light halo on dark pages).
    edge = np.zeros(region.shape, bool)
    for _ in range(2):
        grown = region | edge
        ring = np.zeros(region.shape, bool)
        ring[1:, :] |= grown[:-1, :]
        ring[:-1, :] |= grown[1:, :]
        ring[:, 1:] |= grown[:, :-1]
        ring[:, :-1] |= grown[:, 1:]
        edge |= ring & ~grown
    dist = np.sqrt((d ** 2).sum(axis=2))
    soft = edge & (dist < 36)
    out[soft, 3] = np.minimum(out[soft, 3], (np.clip(dist[soft] / 36, 0.25, 1) * 255).astype(np.uint8))
    return out


SURPRISED_BOX = (690, 92, 925, 362)  # 4th figure of the reference's top row
PEEK_BOX = (205, 426, 547, 728)  # in the 958x1024 reference: cat only, no sparkles
PEEK_EDGE = 708  # the reference card's top edge


def flood(region, passable):
    while True:
        grown = region.copy()
        grown[1:, :] |= region[:-1, :]
        grown[:-1, :] |= region[1:, :]
        grown[:, 1:] |= region[:, :-1]
        grown[:, :-1] |= region[:, 1:]
        grown &= passable
        if (grown == region).all():
            return region
        region = grown


def captain(path, out):
    src = np.asarray(Image.open(path).convert("RGB")).astype(float)
    if src.shape[:2] != (1024, 958):
        raise SystemExit(f"expected the 958x1024 Captain reference, got {src.shape[1]}x{src.shape[0]}")
    # Surprised: same matte as the sheet, same canvas and baseline as the others.
    x0, y0, x1, y1 = SURPRISED_BOX
    crop = src[y0:y1, x0:x1]
    bg = np.median(np.concatenate([crop[:4].reshape(-1, 3), crop[:, :4].reshape(-1, 3)]), axis=0)
    rgba = matte(crop.astype(np.uint8), bg)
    ys, xs = np.nonzero(rgba[..., 3] > 6)
    rgba = rgba[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
    ref = Path(out) / "LD-keeper-bunny-sprout-neutral.png"
    width, height = Image.open(ref).size if ref.exists() else (233, 309)
    canvas = np.zeros((height, width, 4), np.uint8)
    h, w = rgba.shape[:2]
    top, left = height - h - 4, (width - w) // 2
    canvas[top: top + h, left: left + w] = rgba
    Image.fromarray(canvas, "RGBA").save(Path(out) / "LD-keeper-cat-lemon-excited.png", optimize=True)
    print(json.dumps({"name": "cat-lemon-excited", "size": [width, height]}))
    x0, y0, x1, y1 = PEEK_BOX
    crop = src[y0:y1, x0:x1]
    h, w = crop.shape[:2]
    bg = np.median(crop[:6].reshape(-1, 3), axis=0)
    edge = PEEK_EDGE - y0
    d = bg - crop
    near = np.abs(d).max(axis=2) <= 9
    yy, xx = np.mgrid[0:h, 0:w]
    label = (xx + x0 < 300) & (yy + y0 < 500)  # the "Peek" caption pill, never the cat
    passable = near | label
    passable[edge:] = False
    region = np.zeros((h, w), bool)
    region[0] = near[0]
    region[:edge, 0] |= near[:edge, 0]
    region[:edge, -1] |= near[:edge, -1]
    region = flood(region, passable)
    alpha = np.where(region, 0.0, 1.0)
    below = yy >= edge - 4
    warmth = crop[..., 0] - crop[..., 2]
    paw = np.minimum(np.clip((238 - crop.max(axis=2)) / 22, 0, 1), np.clip((52 - warmth) / 14, 0, 1))
    alpha[below] = np.minimum(alpha[below], paw[below])
    ring = np.zeros((h, w), bool)
    ring[1:] |= region[:-1]
    ring[:-1] |= region[1:]
    ring[:, 1:] |= region[:, :-1]
    ring[:, :-1] |= region[:, 1:]
    ring &= ~region
    dist = np.sqrt((d ** 2).sum(axis=2))
    alpha[ring] = np.minimum(alpha[ring], np.clip(dist[ring] / 40, 0.3, 1))
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., :3] = crop.astype(np.uint8)
    rgba[..., 3] = (alpha * 255).round().astype(np.uint8)
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    rgba = rgba[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
    target = Path(out) / "LD-keeper-cat-lemon-peek.png"
    Image.fromarray(rgba, "RGBA").save(target, optimize=True)
    print(json.dumps({"name": "cat-lemon-peek", "size": [rgba.shape[1], rgba.shape[0]]}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("sheet", nargs="?")
    parser.add_argument("--out", default=str(OUT))
    parser.add_argument("--preview", default="")
    parser.add_argument("--captain", default="")
    args = parser.parse_args()
    if args.captain:
        captain(args.captain, args.out)
        return
    if not args.sheet:
        parser.error("give the character sheet, or --captain with the Captain reference")
    sheet = np.asarray(Image.open(args.sheet).convert("RGB")).astype(float)
    bg = np.median(np.concatenate([sheet[:4].reshape(-1, 3), sheet[-4:].reshape(-1, 3)]), axis=0)
    boxes = character_boxes(sheet, bg)
    if len(boxes) != len(NAMES):
        raise SystemExit(f"expected {len(NAMES)} characters, found {len(boxes)}: {boxes}")
    cut = []
    for (x0, y0, x1, y1), name in zip(boxes, NAMES):
        pad = 8
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
        x1, y1 = min(sheet.shape[1], x1 + pad), min(sheet.shape[0], y1 + pad)
        rgba = matte(sheet[y0:y1, x0:x1].astype(np.uint8), bg)
        ys, xs = np.nonzero(rgba[..., 3] > 6)
        rgba = rgba[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
        cut.append((name, rgba))
    width = max(r.shape[1] for _, r in cut) + 8
    height = max(r.shape[0] for _, r in cut) + 8
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    report = []
    for name, rgba in cut:
        canvas = np.zeros((height, width, 4), np.uint8)
        h, w = rgba.shape[:2]
        top, left = height - h - 4, (width - w) // 2  # same baseline, centred
        canvas[top: top + h, left: left + w] = rgba
        Image.fromarray(canvas, "RGBA").save(out / f"LD-keeper-{name}.png", optimize=True)
        report.append({"name": name, "size": [width, height]})
    if args.preview:
        tiles = [Image.open(out / f"LD-keeper-{n}.png") for n in NAMES]
        sheet_out = Image.new("RGBA", (width * 9, height * 4), (0, 0, 0, 0))
        for i, tile in enumerate(tiles):
            for j, colour in enumerate([(255, 253, 248, 255), (58, 52, 48, 255)]):
                x, y = (i % 9) * width, ((i // 9) * 2 + j) * height
                sheet_out.paste(Image.new("RGBA", (width, height), colour), (x, y))
                sheet_out.alpha_composite(tile, (x, y))
        sheet_out.save(args.preview)
    print(json.dumps(report[:1] + [{"count": len(report)}]))


if __name__ == "__main__":
    main()
