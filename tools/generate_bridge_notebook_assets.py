from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "BikeBrowserWorld" / "Assets" / "UI" / "BridgeNotebook" / "source_png"
OUT.mkdir(parents=True, exist_ok=True)

PAPER = (248, 231, 186, 255)
PAPER_DARK = (224, 199, 144, 255)
INK = (50, 37, 26, 255)
GRAPHITE = (82, 77, 68, 255)
WOOD = (156, 91, 43, 255)
BLUE = (48, 111, 141, 255)
ORANGE = (220, 116, 43, 255)
GREEN = (80, 124, 65, 255)
SAND = (184, 133, 78, 255)


def img(name: str, size: tuple[int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def save(image: Image.Image, name: str) -> None:
    image.save(OUT / f"{name}.source.png")


def line(draw: ImageDraw.ImageDraw, a, b, fill=INK, width=3) -> None:
    draw.line([a, b], fill=fill, width=width)


def bridge_beam(draw, box, fill=ORANGE):
    x, y, w, h = box
    line(draw, (x + 8, y + h // 2), (x + w - 8, y + h // 2), fill, 4)
    draw.rectangle([x + 20, y + h // 2, x + 28, y + h - 8], fill=WOOD)
    draw.rectangle([x + w - 28, y + h // 2, x + w - 20, y + h - 8], fill=WOOD)


def bridge_arch(draw, box):
    bridge_beam(draw, box)
    x, y, w, h = box
    pts = []
    for i in range(17):
        p = i / 16
        px = int(x + 12 + (w - 24) * p)
        py = int(y + h - 12 - (1 - abs(p * 2 - 1)) * 38)
        pts.append((px, py))
    draw.line(pts, fill=BLUE, width=3)


def bridge_truss(draw, box):
    x, y, w, h = box
    top = y + 20
    bottom = y + h - 14
    line(draw, (x + 8, top), (x + w - 8, top), ORANGE, 3)
    line(draw, (x + 8, bottom), (x + w - 8, bottom), ORANGE, 3)
    for i in range(5):
        x0 = x + 8 + int((w - 16) * i / 5)
        x1 = x + 8 + int((w - 16) * (i + 1) / 5)
        line(draw, (x0, bottom), (x1, top), BLUE, 2)


def make_paper():
    image, draw = img("paper", (512, 320))
    draw.rectangle([0, 0, 511, 319], fill=PAPER)
    for y in range(18, 320, 18):
        line(draw, (16, y), (496, y), (92, 120, 132, 30), 1)
    for x in range(64, 512, 80):
        line(draw, (x, 12), (x, 308), (150, 103, 54, 18), 1)
    for x in range(0, 512, 23):
        for y in range((x * 7) % 19, 320, 41):
            draw.point((x, y), fill=(90, 64, 38, 40))
    draw.rectangle([0, 0, 511, 319], outline=(92, 55, 24, 80), width=2)
    save(image, "bridge_notebook_paper")


def make_family_cards():
    image, draw = img("families", (768, 256))
    labels = ["BEAM", "ARCH", "FRAME", "CABLE", "SUSPEND", "TRUSS"]
    for i, label in enumerate(labels):
        x = 16 + (i % 3) * 248
        y = 16 + (i // 3) * 112
        draw.rectangle([x, y, x + 216, y + 84], fill=(247, 226, 170, 255), outline=(89, 54, 25, 160), width=2)
        draw.text((x + 12, y + 8), label, fill=INK)
        box = (x + 18, y + 24, 178, 48)
        if label == "ARCH":
            bridge_arch(draw, box)
        elif label == "TRUSS":
            bridge_truss(draw, box)
        else:
            bridge_beam(draw, box)
        if label == "FRAME":
            for n in range(4):
                px = box[0] + 20 + n * 38
                line(draw, (px, box[1] + 24), (px, box[1] + 58), BLUE, 2)
        if label in ["CABLE", "SUSPEND"]:
            mast = (box[0] + box[2] // 2, box[1] + 4)
            line(draw, mast, (mast[0], box[1] + 62), WOOD, 2)
            line(draw, mast, (box[0] + 12, box[1] + 28), BLUE, 2)
            line(draw, mast, (box[0] + box[2] - 12, box[1] + 28), BLUE, 2)
    save(image, "bridge_family_cards")


def make_dry_wash():
    image, draw = img("wash", (384, 216))
    draw.rectangle([0, 0, 383, 215], fill=(236, 210, 158, 255))
    draw.polygon([(0, 130), (138, 86), (150, 216), (0, 216)], fill=SAND)
    draw.polygon([(246, 86), (383, 130), (383, 216), (234, 216)], fill=SAND)
    draw.rectangle([148, 112, 236, 216], fill=(95, 75, 63, 70))
    for x in range(155, 230, 14):
        line(draw, (x, 122), (x + 18, 178), (77, 57, 47, 55), 1)
    save(image, "dry_wash_gap")


def make_frames():
    image, draw = img("frames", (512, 192))
    for offset, rack, label in [(24, 0, "rectangle"), (280, 42, "wobble")]:
        a = (offset + 30, 142)
        b = (offset + 182, 142)
        c = (offset + 182 + rack, 42)
        d = (offset + 30 + rack, 42)
        draw.line([a, b, c, d, a], fill=ORANGE if rack == 0 else (190, 53, 38, 255), width=8)
        draw.text((offset + 48, 156), label, fill=INK)
    save(image, "rectangle_frame_states")


def make_truss_states():
    image, draw = img("truss", (512, 192))
    bridge_truss(draw, (32, 38, 448, 118))
    line(draw, (66, 146), (446, 52), BLUE, 5)
    draw.text((166, 160), "diagonal brace makes triangles", fill=INK)
    save(image, "triangle_truss_states")


def make_load_path():
    image, draw = img("load", (384, 216))
    bridge_truss(draw, (40, 62, 304, 96))
    pts = [(192, 42), (192, 82), (134, 134), (78, 176)]
    for a, b in zip(pts, pts[1:]):
        line(draw, a, b, BLUE, 5)
        draw.polygon([(b[0], b[1]), (b[0] - 8, b[1] - 2), (b[0] - 2, b[1] - 10)], fill=BLUE)
    draw.text((132, 18), "LOAD PATH", fill=INK)
    save(image, "load_path_arrows")


def make_badge():
    image, draw = img("badge", (160, 160))
    draw.ellipse([16, 16, 144, 144], fill=(247, 211, 104, 255), outline=(83, 53, 24, 255), width=4)
    bridge_truss(draw, (36, 52, 88, 42))
    draw.text((42, 108), "TRIANGLES", fill=INK)
    save(image, "bridge_notebook_badge")


def main():
    make_paper()
    make_family_cards()
    make_dry_wash()
    make_frames()
    make_truss_states()
    make_load_path()
    make_badge()
    print(f"Wrote source PNGs to {OUT}")


if __name__ == "__main__":
    main()
