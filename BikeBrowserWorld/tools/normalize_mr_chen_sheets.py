from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MR_CHEN_DIR = ROOT / "Assets" / "Characters" / "NPCs" / "MrChen"
FRAME = 96
SHEETS = [
    "MrChen_idle.png",
    "MrChen_talk.png",
    "MrChen_repair.png",
    "MrChen_point.png",
]


def is_subject(pixel):
    r, g, b, a = pixel
    if a <= 10:
        return False
    return not (r > 210 and b > 210 and g < 100)


def frame_bbox(frame):
    pixels = frame.load()
    xs = []
    ys = []
    for y in range(FRAME):
        for x in range(FRAME):
            if is_subject(pixels[x, y]):
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def normalize_sheet(path):
    source = Image.open(path).convert("RGBA")
    result = Image.new("RGBA", (FRAME * 4, FRAME * 4), (255, 0, 255, 0))

    for row in range(4):
        row_boxes = []
        for col in range(4):
            cell = source.crop((col * FRAME, row * FRAME, (col + 1) * FRAME, (row + 1) * FRAME))
            box = frame_bbox(cell)
            row_boxes.append(box)

        bottoms = [box[3] for box in row_boxes if box]
        target_bottom = min(90, max(bottoms) if bottoms else 88)

        for col in range(4):
            cell = source.crop((col * FRAME, row * FRAME, (col + 1) * FRAME, (row + 1) * FRAME))
            box = row_boxes[col]
            if not box:
                continue

            crop = cell.crop((box[0], box[1], box[2] + 1, box[3] + 1))
            width = crop.width
            height = crop.height
            dest_x = int(round((FRAME - width) / 2))
            dest_y = int(round(target_bottom - height + 1))
            dest_y = max(2, min(dest_y, FRAME - height - 2))
            result.alpha_composite(crop, (dest_x + col * FRAME, dest_y + row * FRAME))

    path.with_suffix(".pre_normalize.png").write_bytes(path.read_bytes())
    result.save(path)


def main():
    for sheet in SHEETS:
        normalize_sheet(MR_CHEN_DIR / sheet)
        print(f"Normalized {sheet}")


if __name__ == "__main__":
    main()
