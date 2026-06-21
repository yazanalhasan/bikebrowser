#!/usr/bin/env python3
"""Drive the local ComfyUI (SDXL) GPU pipeline to generate game art.

Executive Brain art generation — uses the dual RTX 5090s via ComfyUI's HTTP API
(127.0.0.1:8188). Reusable foundation for the anime-style asset pass.

Usage:
  python scripts/art/comfy_gen.py --prompt "..." --out path.png \
      [--neg "..."] [--w 1024] [--h 1024] [--steps 28] [--cfg 7] [--seed 0] \
      [--ckpt sd_xl_base_1.0.safetensors]

Notes:
- SaveImage writes to ComfyUI/output/; we copy the newest result to --out.
- Standard SDXL txt2img graph; swap --ckpt to an anime checkpoint when present.
"""
import argparse
import json
import shutil
import time
import urllib.request
from pathlib import Path

COMFY = "http://127.0.0.1:8188"
COMFY_OUTPUT = Path(r"C:\AI\ComfyUI\output")


def workflow(args):
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": args.ckpt}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": args.w, "height": args.h, "batch_size": 1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": args.prompt, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": args.neg, "clip": ["4", 1]}},
        "3": {"class_type": "KSampler", "inputs": {
            "seed": args.seed, "steps": args.steps, "cfg": args.cfg,
            "sampler_name": args.sampler, "scheduler": args.scheduler, "denoise": 1.0,
            "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": args.prefix, "images": ["8", 0]}},
    }


def post(path, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(COMFY + path, data=data, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


def get(path):
    return json.loads(urllib.request.urlopen(COMFY + path, timeout=30).read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--neg", default="lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, username, blurry, 3d render, photorealistic, deformed")
    ap.add_argument("--out", required=True)
    ap.add_argument("--w", type=int, default=1024)
    ap.add_argument("--h", type=int, default=1024)
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--cfg", type=float, default=7.0)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--sampler", default="dpmpp_2m")
    ap.add_argument("--scheduler", default="karras")
    ap.add_argument("--ckpt", default="sd_xl_base_1.0.safetensors")
    ap.add_argument("--prefix", default="bb_art")
    args = ap.parse_args()

    before = set(COMFY_OUTPUT.glob("*.png"))
    res = post("/prompt", {"prompt": workflow(args), "client_id": "bb_eb"})
    pid = res["prompt_id"]
    print(f"submitted {pid} (seed {args.seed}, {args.w}x{args.h}, {args.ckpt})")

    for _ in range(180):  # up to ~180s
        hist = get(f"/history/{pid}")
        if pid in hist and hist[pid].get("status", {}).get("completed"):
            break
        time.sleep(1)
    else:
        raise SystemExit("timed out waiting for generation")

    # newest png in output not present before
    after = sorted(COMFY_OUTPUT.glob("*.png"), key=lambda p: p.stat().st_mtime)
    new = [p for p in after if p not in before] or after[-1:]
    if not new:
        raise SystemExit("no output image found")
    src = new[-1]
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(src, out)
    print(f"OK -> {out}  (from {src.name})")


if __name__ == "__main__":
    main()
