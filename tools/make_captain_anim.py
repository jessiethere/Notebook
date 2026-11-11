"""Captain's play animations, from the owner's own files (2026-11-11).

Usage: python3 tools/make_captain_anim.py

Sources (provided by the product owner on 2026-11-11; kept unchanged in
docs/brand/captain-anim/):
  LD-captain-lemon-yarn-sit.webp  lemon hat, sitting by the yarn (the still)
  LD-captain-lemon-hug.gif        lemon hat, hugging the yarn and giggling (6 × 180 ms)
  LD-captain-lemon-play.gif       lemon hat + green bandana, batting the yarn, a
                                  little heart, then hugging it (9 × 150 ms)

Nothing is cut out or redrawn: each frame keeps its own cream backdrop and is
shown as a small rounded "stage" in the app (a cut-out of 256-colour GIF
frames left nicks on the pale paws and a floor rim on dark pages — not good
enough). The frames are laid side by side in one JPEG sprite, played with
CSS steps(); Reduce Motion shows one chosen frame instead.

Output (Resources/Keepers/): LD-keeper-cat-lemon-sit.jpg,
LD-keeper-cat-lemon-hug-anim.jpg, LD-keeper-cat-lemon-play-anim.jpg.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/brand/captain-anim"
OUT = ROOT / "Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Keepers"
SIZE = 400  # px per frame (square); the originals are 412–506 px
QUALITY = 88


def frames(path):
    im = Image.open(path)
    out = []
    for i in range(getattr(im, "n_frames", 1)):
        im.seek(i)
        out.append((im.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS), im.info.get("duration", 100)))
    return out


def sprite(src, name):
    fr = frames(SRC / src)
    sheet = Image.new("RGB", (SIZE * len(fr), SIZE))
    for i, (f, _) in enumerate(fr):
        sheet.paste(f, (i * SIZE, 0))
    sheet.save(OUT / name, quality=QUALITY, optimize=True, progressive=True)
    print(f"{name}: {len(fr)} frames × {SIZE}px, {[d for _, d in fr]} ms, {(OUT / name).stat().st_size // 1024} KB")


if __name__ == "__main__":
    still = frames(SRC / "LD-captain-lemon-yarn-sit.webp")[0][0]
    still.save(OUT / "LD-keeper-cat-lemon-sit.jpg", quality=QUALITY, optimize=True, progressive=True)
    print("LD-keeper-cat-lemon-sit.jpg", (OUT / "LD-keeper-cat-lemon-sit.jpg").stat().st_size // 1024, "KB")
    sprite("LD-captain-lemon-hug.gif", "LD-keeper-cat-lemon-hug-anim.jpg")
    sprite("LD-captain-lemon-play.gif", "LD-keeper-cat-lemon-play-anim.jpg")
