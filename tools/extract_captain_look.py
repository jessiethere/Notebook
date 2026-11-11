"""Cut the "Captain with a yarn ball" look out of the owner's picture.

Usage: python3 tools/extract_captain_look.py [--preview DIR]

Source: docs/brand/LD-captain-natural-yarn-original.png (941x1672), Captain
without a hat, holding a pink ball of yarn — provided by the product owner.
It is the second approved picture of Captain (after the Captain Character
Reference used by tools/extract_captain.py). Nothing is redrawn: every pixel
of the cut-out comes from the picture; the backdrop, the floor shadow and the
small decorations (heart, sparkles) are removed, the yarn and its thread stay.

Output: Resources/Keepers/LD-keeper-cat-yarn-happy.png (one pose).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

import extract_captain as X

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/brand/LD-captain-natural-yarn-original.png"
OUT = ROOT / "Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Keepers/LD-keeper-cat-yarn-happy.png"
BOX = (150, 540, 850, 1260)  # the cat, the yarn and its thread
PAWS = ((285, 1035, 405, 1188), (605, 1035, 735, 1186))  # the two pale hind paws
LOOP = (733, 1150)  # a point of backdrop inside the heart-shaped loop of yarn
WIDTH = 320  # shipped width in pixels (shown at 64-110 px)


def cut():
    crop = np.asarray(Image.open(SOURCE).convert("RGB").crop(BOX)).astype(float)
    h, w = crop.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w]
    # The backdrop is a soft gradient: a plane fitted to the border pixels.
    border = np.zeros((h, w), bool)
    border[:6] = border[-6:] = True
    border[:, :6] = border[:, -6:] = True
    A = np.c_[xs[border], ys[border], np.ones(border.sum())]
    full = np.c_[xs.ravel(), ys.ravel(), np.ones(h * w)]
    plane = np.stack([(full @ np.linalg.lstsq(A, crop[..., c][border], rcond=None)[0]).reshape(h, w) for c in range(3)], axis=2)
    s = crop / plane
    deficit = 1 - s.mean(axis=2)
    warm = s[..., 0] - s[..., 2]
    near = np.abs(crop - plane).max(axis=2) <= 9
    paws = np.zeros((h, w), bool)
    for x0, y0, x1, y1 in PAWS:
        paws[max(0, y0 - BOX[1]):y1 - BOX[1], max(0, x0 - BOX[0]):x1 - BOX[0]] = True
    # The floor shadow is a warm darkening below the cat; the pale paws never are.
    shadowy = (deficit > 0) & (deficit < 0.24) & (warm >= 0.2 * deficit - 0.008) & (warm <= 1.0 * deficit + 0.012) & ~paws
    passable = near | (shadowy & (ys > h * 0.83))
    seed = np.zeros((h, w), bool)
    seed[0], seed[-1], seed[:, 0], seed[:, -1] = passable[0], passable[-1], passable[:, 0], passable[:, -1]
    background = X.grow(seed, passable)
    pocket = np.zeros((h, w), bool)
    pocket[LOOP[1] - BOX[1], LOOP[0] - BOX[0]] = True
    background |= X.grow(pocket, np.abs(crop - plane).max(axis=2) <= 12)
    out = X.matte(crop, background)
    # What is left of the shadow under the cat (enclosed, so the flood missed
    # it): pale and warm, below the paws — never the grey fur or the pink thread.
    left = (ys >= 600) & ~paws & (crop.min(axis=2) > 140) & ((crop[..., 0] - crop[..., 1]) < 55)
    out[left, 3] = 0
    # Pin-holes inside the picture (not connected to the outside) are filled back in.
    labels, n = X.components(out[..., 3] == 0)
    for i in range(1, n + 1):
        part = labels == i
        if part.sum() < 12 and not (part[0].any() or part[-1].any() or part[:, 0].any() or part[:, -1].any()):
            out[part, 3] = 255
    image = Image.fromarray(out, "RGBA")
    image = image.crop(image.getbbox())
    return image.resize((WIDTH, round(image.height * WIDTH / image.width)), Image.LANCZOS)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", default="")
    args = parser.parse_args()
    image = cut()
    image.save(OUT, optimize=True)
    print(f"{OUT.name}: {image.size[0]}x{image.size[1]}, {OUT.stat().st_size // 1024} KB")
    if args.preview:
        for name, colour in (("light", (255, 252, 246)), ("dark", (60, 52, 46))):
            page = Image.new("RGBA", (image.width + 60, image.height + 60), colour + (255,))
            page.alpha_composite(image, (30, 30))
            page.convert("RGB").save(Path(args.preview) / f"yarn-{name}.png")


if __name__ == "__main__":
    main()
