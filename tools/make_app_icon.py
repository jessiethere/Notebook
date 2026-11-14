"""Build the Capiday app icons from the approved official icon artwork.

Usage: python3 tools/make_app_icon.py [docs/brand/capiday-app-icon-original.png]

Source (2026-11-14): the Capiday icon provided by the product owner after the
rename (docs/brand/capiday-app-icon-original.png, 1254x1254: Captain peeking
over a cream journal plaque, lemon hat, flower paper clip, "Capiday" wordmark,
sprout). Same layout as the earlier "Little Days V1 Official App Icon"
(docs/brand/LD-app-icon-original.png, 2026-11-10, kept for history), so the
same tile measurements apply. The artwork is
used as it is — nothing is redrawn or regenerated.

The supplied picture (1254x1254) shows the icon as a rounded tile (about
992x1056, corner radius ~290 px) on a cream margin with a drop shadow. iOS
draws its own icon shape, so the icon file must be an opaque square without
pre-rounded corners:

1. Take the whole tile (nothing is cropped away: leaf, sparkles, paper clip,
   wordmark and sprout all stay at their original positions and scale).
2. Make it square (1056x1056): the narrow side strips, the corner wedges
   outside the tile's own (rounder than iOS) corners and the tile's thin
   highlight / shadow rim (22 px) are filled with the colour found 28 px
   inside the tile, softened (Gaussian 6 px) and feathered over 6 px. These
   areas are plain blurred background or plaque edge; the leaf, sparkles,
   paper clip, wordmark, sprout and stitching are all further in.
3. Resize once, with Lanczos, from that master to every size (no repeated
   resampling or lossy compression).

Outputs:
- Native/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png (opaque RGB)
- Public/icons/apple-touch-icon.png (180, opaque — iOS "Add to Home Screen")
- Public/icons/icon-192.png, Public/icons/favicon-32.png (the tile's own
  rounded shape on transparency, for browser tabs where nothing masks it)
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/brand/capiday-app-icon-original.png"
APPICON = ROOT / "Native/App/Assets.xcassets/AppIcon.appiconset"
WEB = ROOT / "Public/icons"

TILE = (121, 96, 1112, 1152)  # left, top, right, bottom of the tile in the 1254x1254 source
RADIUS = 290  # the tile's own corner radius (measured along each corner's diagonal)
KEEP_INSET = 22  # the tile's highlight / shadow rim is replaced as well
FILL_FROM = 28  # where the fill colour is sampled, inside the tile


def rounded_sdf(X, Y, inset):
    """Signed distance to the tile's rounded rectangle shrunk by `inset` (negative inside)."""
    left, top, right, bottom = TILE
    mx, my = (left + right) / 2, (top + bottom - 1) / 2
    hx, hy = (right - left) / 2 - inset, (bottom - 1 - top) / 2 - inset
    r = RADIUS - inset
    qx = np.abs(X - mx) - hx + r
    qy = np.abs(Y - my) - hy + r
    outside = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2)
    return outside + np.minimum(np.maximum(qx, qy), 0) - r


def nearest_inside(X, Y, inset):
    left, top, right, bottom = TILE
    lo_x, hi_x = left + inset, right - inset
    lo_y, hi_y = top + inset, bottom - 1 - inset
    r = RADIUS - inset
    cx = np.clip(X, lo_x + r, hi_x - r)
    cy = np.clip(Y, lo_y + r, hi_y - r)
    vx, vy = X - cx, Y - cy
    dist = np.sqrt(vx ** 2 + vy ** 2)
    scale = np.where(dist > r, r / np.maximum(dist, 1e-6), 1.0)
    px = np.clip(np.round(cx + vx * scale).astype(int), lo_x, hi_x)
    py = np.clip(np.round(cy + vy * scale).astype(int), lo_y, hi_y)
    return px, py


def square_master(src):
    a = np.asarray(src.convert("RGB")).astype(np.uint8)
    left, top, right, bottom = TILE
    n = bottom - top
    x0 = left - (n - (right - left + 1)) // 2  # source x of the square's first column
    ys, xs = np.mgrid[0:n, 0:n]
    X = (xs + x0).astype(float)
    Y = (ys + top).astype(float)
    original = a[np.clip(Y.astype(int), 0, a.shape[0] - 1), np.clip(X.astype(int), 0, a.shape[1] - 1)].astype(float)
    # Fill: the colour a little inside the tile, softened so no texture streaks.
    px, py = nearest_inside(X, Y, FILL_FROM)
    fill = np.asarray(Image.fromarray(a[py, px], "RGB").filter(ImageFilter.GaussianBlur(6))).astype(float)
    # Keep the artwork inside the tile (minus its edge rim); blend over 6 px.
    w = np.clip((rounded_sdf(X, Y, KEEP_INSET) + 3) / 6, 0, 1)[..., None]
    out = original * (1 - w) + fill * w
    return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGB")


def rounded_alpha(size):
    # the tile's own shape for browser icons (radius ~ RADIUS / tile height)
    n = size * 4
    r = RADIUS / (TILE[3] - TILE[1]) * n
    ys, xs = np.mgrid[0:n, 0:n] + 0.5
    cx = np.clip(xs, r, n - r)
    cy = np.clip(ys, r, n - r)
    inside = ((xs - cx) ** 2 + (ys - cy) ** 2) <= r * r
    return Image.fromarray((inside * 255).astype(np.uint8), "L").resize((size, size), Image.LANCZOS)


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE
    src = Image.open(source)
    if src.size != (1254, 1254):
        raise SystemExit(f"expected the 1254x1254 official icon artwork, got {src.size[0]}x{src.size[1]}")
    master = square_master(src)
    APPICON.mkdir(parents=True, exist_ok=True)
    WEB.mkdir(parents=True, exist_ok=True)
    master.resize((1024, 1024), Image.LANCZOS).save(APPICON / "AppIcon-1024.png", optimize=True)
    master.resize((180, 180), Image.LANCZOS).save(WEB / "apple-touch-icon.png", optimize=True)
    for size, name in [(192, "icon-192.png"), (32, "favicon-32.png")]:
        icon = master.resize((size, size), Image.LANCZOS).convert("RGBA")
        icon.putalpha(rounded_alpha(size))
        icon.save(WEB / name, optimize=True)
    (APPICON / "Contents.json").write_text(json.dumps({
        "images": [{"filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}],
        "info": {"author": "xcode", "version": 1},
    }, indent=2) + "\n")
    (APPICON.parent / "Contents.json").write_text(json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2) + "\n")
    print(json.dumps({"master": master.size, "ios": "AppIcon-1024.png", "web": ["apple-touch-icon.png 180", "icon-192.png", "favicon-32.png"]}))


if __name__ == "__main__":
    main()
