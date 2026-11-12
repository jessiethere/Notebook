"""Captain's Playroom pictures, from the owner's own files (2026-11-11/12).

Usage: python3 tools/make_captain_anim.py   (needs Pillow and numpy)

Sources (provided by the product owner on 2026-11-11; kept unchanged in
docs/brand/captain-anim/):
  LD-captain-lemon-yarn-sit.webp  lemon hat, sitting by a pink yarn ball (still)
  LD-captain-lemon-hug.gif        lemon hat, hugging the yarn and giggling (6 × 180 ms)
  LD-captain-lemon-play.gif       lemon hat + a green bandana — NOT used: the owner
                                  decided (2026-11-12) Captain keeps the usual look
                                  (no bandana) until it is a look of its own

Output (Resources/Keepers/, registered in library.json "keeperPlay"):
  LD-keeper-cat-lemon-play-idle.jpg  the still with its yarn ball (and the
      ball's string) lifted off: the ball becomes its own piece so it can be
      dragged. The paper under it is filled by a smooth diffusion from the
      surrounding pixels (the hind paw behind the ball was out of focus and
      stays a soft blur). Colour-matched to the hug frames' paper.
  LD-keeper-yarn-ball.png            the ball itself, transparent, soft edge.
  LD-keeper-cat-lemon-hug-anim.jpg   the six hug frames side by side (played
      with CSS steps(); Reduce Motion shows one frame).

Nothing is redrawn: every pixel comes from the owner's art. The GIF frames
keep their own cream paper (a cut-out of 256-colour frames left nicks on the
pale paws — not good enough).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/brand/captain-anim"
OUT = ROOT / "Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Keepers"
SIZE = 400  # px per frame (square); the originals are 412–506 px
QUALITY = 88
RETIRED = ["LD-keeper-cat-lemon-sit.jpg", "LD-keeper-cat-lemon-play-anim.jpg"]


def gif_frames(path):
    im = Image.open(path)
    out = []
    for i in range(getattr(im, "n_frames", 1)):
        im.seek(i)
        out.append((im.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS), im.info.get("duration", 100)))
    return out


def grow(mask, px):
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(px * 2 + 1))
    return np.asarray(m) > 0


def lift_ball(path, paper):
    """The still without its ball, the ball on its own, and where it was (in %)."""
    im = np.asarray(Image.open(path).convert("RGB")).astype(float)
    H, W, _ = im.shape
    R, G, B = im[..., 0], im[..., 1], im[..., 2]
    yy, xx = np.mgrid[0:H, 0:W]
    # The pink yarn in the lower right (the paw pads are further left).
    yarn = (R - G > 45) & (R > 150) & (xx >= W * 0.6) & (yy >= H * 0.65)
    ys, xs = np.nonzero(yarn & (xx < W * 0.88))
    # Top / bottom / left edges of the ball are clean (the string leaves on the right).
    r = (ys.max() - ys.min()) / 2
    cx, cy = xs.min() + r, (ys.min() + ys.max()) / 2
    d = np.hypot(xx - cx, yy - cy)
    disc = d <= r + 1.5
    string = yarn & ~disc
    shadow = (((xx - cx) / (r * 1.05)) ** 2 + ((yy - (cy + r * 0.92)) / (r * 0.22)) ** 2) <= 1
    lum = 0.3 * R + 0.59 * G + 0.11 * B
    stray = (xx >= cx - r * 0.72) & (yy >= cy - r * 1.25) & (yy <= cy + r * 1.25) & ((lum < 228) | (R - G > 25))
    hole = grow(disc, 4) | grow(string, 4) | shadow | grow(stray, 2)
    fill = im.copy()
    fill[hole] = im[~hole & grow(hole, 4)].mean(axis=0)
    for _ in range(3000):  # harmonic fill: relax the hole from its border
        avg = (np.roll(fill, 1, 0) + np.roll(fill, -1, 0) + np.roll(fill, 1, 1) + np.roll(fill, -1, 1)) / 4
        fill[hole] = avg[hole]
    fill[hole] += np.random.default_rng(7).normal(0, 0.8, (int(hole.sum()), 3))  # the paper's grain
    # Match the paper to the hug frames (one gain per channel, from the corners).
    corners = np.array([im[4, 4], im[4, W - 5], im[H - 5, 4], im[H - 5, W - 5]]).mean(axis=0)
    gain = np.array(paper) / corners
    still = Image.fromarray(np.clip(fill * gain, 0, 255).astype(np.uint8)).resize((SIZE, SIZE), Image.LANCZOS)
    alpha = np.clip((r - 1.0 - d) / 1.5, 0, 1)
    pad = 2
    x0, x1 = int(cx - r - pad), int(cx + r + pad + 1)
    y0, y1 = int(cy - r - pad), int(cy + r + pad + 1)
    ball = Image.fromarray(np.dstack([np.clip(im * gain, 0, 255), alpha * 255]).astype(np.uint8)[y0:y1, x0:x1], "RGBA")
    k = SIZE / W
    ball = ball.resize((round(ball.width * k), round(ball.height * k)), Image.LANCZOS)
    where = {"x": round(cx / W * 100, 1), "y": round(cy / H * 100, 1), "d": round(2 * r / W * 100, 1)}
    return still, ball, where


if __name__ == "__main__":
    hug = gif_frames(SRC / "LD-captain-lemon-hug.gif")
    first = np.asarray(hug[0][0]).astype(float)
    paper = np.array([first[4, 4], first[4, -5], first[-5, 4], first[-5, -5]]).mean(axis=0)
    still, ball, where = lift_ball(SRC / "LD-captain-lemon-yarn-sit.webp", paper)
    still.save(OUT / "LD-keeper-cat-lemon-play-idle.jpg", quality=QUALITY, optimize=True, progressive=True)
    ball.save(OUT / "LD-keeper-yarn-ball.png", optimize=True)
    sheet = Image.new("RGB", (SIZE * len(hug), SIZE))
    for i, (f, _) in enumerate(hug):
        sheet.paste(f, (i * SIZE, 0))
    sheet.save(OUT / "LD-keeper-cat-lemon-hug-anim.jpg", quality=QUALITY, optimize=True, progressive=True)
    for name in RETIRED:
        (OUT / name).unlink(missing_ok=True)
    print("paper", [round(v) for v in paper], "→ #%02X%02X%02X" % tuple(round(v) for v in paper))
    print("ball home (% of the stage):", where)
    for name in ["LD-keeper-cat-lemon-play-idle.jpg", "LD-keeper-yarn-ball.png", "LD-keeper-cat-lemon-hug-anim.jpg"]:
        print(name, (OUT / name).stat().st_size // 1024, "KB")
    print("hug:", len(hug), "frames,", [d for _, d in hug], "ms")
