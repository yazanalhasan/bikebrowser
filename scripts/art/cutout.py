#!/usr/bin/env python3
"""Background-remove a generated character into a clean transparent game sprite.

Uses rembg (u2net) to isolate the character, trims to the content bounding box,
and resizes to a target height. Output is RGBA PNG ready as a world sprite.

Run with the ComfyUI venv python (has rembg/onnxruntime):
  C:\\AI\\ComfyUI\\venv\\Scripts\\python.exe scripts/art/cutout.py <in.png> <out.png> [max_h]
"""
import sys
from pathlib import Path

from PIL import Image
from rembg import remove, new_session

SESSION = new_session("u2net")  # downloads u2net.onnx on first use


def cutout(src, dst, max_h=320):
    img = Image.open(src).convert("RGBA")
    out = remove(img, session=SESSION)  # RGBA, background alpha=0
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    w, h = out.size
    if h > max_h:
        out = out.resize((max(1, round(w * max_h / h)), max_h), Image.LANCZOS)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    out.save(dst)
    print(f"cutout -> {dst}  ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    max_h = int(sys.argv[3]) if len(sys.argv) > 3 else 320
    cutout(src, dst, max_h)
