#!/usr/bin/env python3
"""Split a front+back turnaround generation into two transparent game sprites.

SDXL "character reference" generations come out as a front view (left) + back view
(right). We split down the middle, rembg each half, trim, and resize — giving
<name>_front.png (faces down/left/right) and <name>_back.png (faces up).

  C:\\AI\\ComfyUI\\venv\\Scripts\\python.exe scripts/art/cutout_dual.py <in.png> <front.png> <back.png> [max_h]
"""
import sys
from pathlib import Path

from PIL import Image
from rembg import remove, new_session

SESSION = new_session("u2net")


def one(img, dst, max_h):
    out = remove(img, session=SESSION)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    w, h = out.size
    if h > max_h:
        out = out.resize((max(1, round(w * max_h / h)), max_h), Image.LANCZOS)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    out.save(dst)
    print(f"  -> {dst} ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    src, front, back = sys.argv[1], sys.argv[2], sys.argv[3]
    max_h = int(sys.argv[4]) if len(sys.argv) > 4 else 300
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    print(Path(src).name)
    one(img.crop((0, 0, w // 2, h)), front, max_h)
    one(img.crop((w // 2, 0, w, h)), back, max_h)
