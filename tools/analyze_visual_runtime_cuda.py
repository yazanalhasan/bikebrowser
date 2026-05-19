import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
import torch


def load_image(path: Path, device: torch.device) -> torch.Tensor:
    image = Image.open(path).convert("RGB")
    arr = np.asarray(image, dtype=np.float32) / 255.0
    return torch.from_numpy(arr).to(device)


def image_metrics(path: Path, device: torch.device) -> dict:
    img = load_image(path, device)
    h, w, _ = img.shape
    flat = img.reshape(-1, 3)

    mean = flat.mean(dim=0)
    std = flat.std(dim=0)
    luminance = (flat[:, 0] * 0.2126 + flat[:, 1] * 0.7152 + flat[:, 2] * 0.0722)
    contrast = luminance.std()

    # Find pixels materially different from the border median. This catches
    # portrait letterboxing / empty margins without needing game-specific masks.
    border = torch.cat([img[0, :, :], img[-1, :, :], img[:, 0, :], img[:, -1, :]], dim=0)
    bg = border.median(dim=0).values
    delta = torch.linalg.vector_norm(img - bg, dim=2)
    active = delta > 0.08
    active_ratio = active.float().mean().item()

    if bool(active.any().item()):
        ys, xs = torch.where(active)
        x0, x1 = int(xs.min().item()), int(xs.max().item())
        y0, y1 = int(ys.min().item()), int(ys.max().item())
        bbox_area_ratio = ((x1 - x0 + 1) * (y1 - y0 + 1)) / float(w * h)
        top_margin = y0 / h
        bottom_margin = (h - y1 - 1) / h
        left_margin = x0 / w
        right_margin = (w - x1 - 1) / w
    else:
        x0 = y0 = 0
        x1 = w - 1
        y1 = h - 1
        bbox_area_ratio = 0.0
        top_margin = bottom_margin = left_margin = right_margin = 1.0

    # Downsampled embedding for similarity clustering.
    small = torch.nn.functional.interpolate(
        img.permute(2, 0, 1).unsqueeze(0),
        size=(32, 32),
        mode="bilinear",
        align_corners=False,
    ).flatten()
    small = small / (small.norm() + 1e-8)

    return {
        "file": str(path).replace("\\", "/"),
        "width": w,
        "height": h,
        "mean_rgb": [round(float(v), 4) for v in mean.detach().cpu()],
        "std_rgb": [round(float(v), 4) for v in std.detach().cpu()],
        "luminance_contrast": round(float(contrast.detach().cpu()), 4),
        "active_pixel_ratio": round(active_ratio, 4),
        "active_bbox_ratio": round(float(bbox_area_ratio), 4),
        "active_bbox": [x0, y0, x1, y1],
        "margins": {
            "top": round(float(top_margin), 4),
            "bottom": round(float(bottom_margin), 4),
            "left": round(float(left_margin), 4),
            "right": round(float(right_margin), 4),
        },
        "_embedding": small.detach().cpu(),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="project_audit/visual_runtime_screens")
    parser.add_argument("--output", default="project_audit/visual_runtime_analysis.json")
    args = parser.parse_args()

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    paths = sorted(Path(args.input_dir).glob("*.png"))

    metrics = [image_metrics(path, device) for path in paths]
    embeddings = torch.stack([m.pop("_embedding") for m in metrics]) if metrics else torch.empty((0, 1))

    similar_pairs = []
    if len(metrics) > 1:
        sim = embeddings @ embeddings.T
        for i in range(len(metrics)):
            for j in range(i + 1, len(metrics)):
                score = float(sim[i, j].item())
                if score >= 0.985:
                    similar_pairs.append({
                        "a": metrics[i]["file"],
                        "b": metrics[j]["file"],
                        "similarity": round(score, 4),
                    })

    findings = []
    for m in metrics:
        name = Path(m["file"]).name
        if m["active_pixel_ratio"] < 0.08:
            findings.append({"severity": "high", "file": m["file"], "issue": "very low active-pixel ratio; likely blank or mostly empty"})
        if "__play" in name or "__godot" in name:
            margins = m["margins"]
            if margins["top"] > 0.25 or margins["bottom"] > 0.25:
                findings.append({"severity": "medium", "file": m["file"], "issue": "large vertical inactive margin around game content"})
            if m["luminance_contrast"] < 0.08:
                findings.append({"severity": "medium", "file": m["file"], "issue": "low contrast may reduce mechanic-eye readability"})

    report = {
        "device": str(device),
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "image_count": len(metrics),
        "metrics": metrics,
        "similar_pairs": similar_pairs[:100],
        "findings": findings,
    }

    Path(args.output).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({
        "device": report["device"],
        "cuda_available": report["cuda_available"],
        "gpu_name": report["gpu_name"],
        "image_count": report["image_count"],
        "finding_count": len(findings),
        "output": args.output,
    }, indent=2))


if __name__ == "__main__":
    main()

