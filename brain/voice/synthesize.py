"""Brain-side client for the local XTTS voice engine.

`approval_required` is False, so synthesis needs no spend gate. `resource_governed`
is True, so every call passes through a VRAM budget check (`_resource_gate`) before
the isolated XTTS worker is launched. The brain interpreter never imports torch/TTS;
it shells out to the XTTS venv (see config.XTTS_ENV_PYTHON and _xtts_worker.py).
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from . import config


class ResourceGoverned(RuntimeError):
    """Raised when the resource budget refuses a synthesis request."""


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def governance_manifest() -> dict:
    """Full Executive Brain classification for this tool (for audit emit)."""
    return {
        "tool": config.GOVERNANCE["tool"],
        "generated_at": iso_now(),
        "classification": dict(config.GOVERNANCE),
        "engine": {"model": config.MODEL, "env_python": str(config.XTTS_ENV_PYTHON)},
        "resource_budget": dict(config.RESOURCE_BUDGET),
        "characters": dict(config.CHARACTER_VOICES),
    }


def _gpu_free_vram_gb() -> list[float]:
    """Per-GPU free VRAM in GB via nvidia-smi. Empty list if unavailable."""
    try:
        out = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.free", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=15, check=True,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return []
    return [round(int(x.strip()) / 1024, 2) for x in out.splitlines() if x.strip()]


def _resource_gate() -> int:
    """Enforce the resource budget. Returns the GPU index to use, or raises."""
    if not config.GOVERNANCE["resource_governed"]:
        return config.RESOURCE_BUDGET["preferred_gpu_index"]
    free = _gpu_free_vram_gb()
    need = config.RESOURCE_BUDGET["min_free_vram_gb"]
    if not free:
        raise ResourceGoverned("no GPU visible via nvidia-smi; refusing (resource_governed)")
    pref = config.RESOURCE_BUDGET["preferred_gpu_index"]
    # Prefer the configured GPU, else the one with the most free VRAM.
    candidates = sorted(range(len(free)), key=lambda i: free[i], reverse=True)
    chosen = pref if pref < len(free) and free[pref] >= need else candidates[0]
    if free[chosen] < need:
        raise ResourceGoverned(
            f"insufficient free VRAM: best GPU has {free[chosen]} GB, budget needs {need} GB"
        )
    return chosen


def synthesize(
    text: str,
    character: str | None = None,
    out_path: str | Path = "voice_out.wav",
    *,
    speaker: str | None = None,
    speaker_wav: str | Path | None = None,
    language: str = config.DEFAULT_LANGUAGE,
    timeout: int = 300,
) -> dict:
    """Synthesize `text` to `out_path` using the local XTTS engine.

    Provide exactly one voice source: a `character` id (mapped to a studio
    speaker), an explicit `speaker` name, or a `speaker_wav` reference clip.
    Returns the worker's structured result (timings, VRAM, normalized peak).
    """
    if sum(x is not None for x in (character, speaker, speaker_wav)) != 1:
        raise ValueError("provide exactly one of: character, speaker, speaker_wav")

    gpu_index = _resource_gate()  # governance: may raise ResourceGoverned

    request = {
        "text": text,
        "out_path": str(Path(out_path).resolve()),
        "model": config.MODEL,
        "language": language,
        "gpu_index": gpu_index,
        "peak_target_dbfs": config.RESOURCE_BUDGET["peak_target_dbfs"],
    }
    if speaker_wav is not None:
        request["speaker_wav"] = str(Path(speaker_wav).resolve())
    else:
        request["speaker"] = speaker if speaker is not None else config.resolve_character(character)

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as fh:
        json.dump(request, fh)
        req_path = fh.name

    worker = Path(__file__).with_name("_xtts_worker.py")
    proc = subprocess.run(
        [str(config.XTTS_ENV_PYTHON), str(worker), req_path],
        capture_output=True, text=True, timeout=timeout,
    )
    # The worker prints exactly one JSON line on stdout (ok or error).
    line = proc.stdout.strip().splitlines()[-1] if proc.stdout.strip() else ""
    try:
        result = json.loads(line)
    except json.JSONDecodeError:
        raise RuntimeError(
            f"XTTS worker produced no JSON (exit {proc.returncode}):\n{proc.stderr[-2000:]}"
        )
    if not result.get("ok"):
        raise RuntimeError(f"XTTS synthesis failed: {result.get('error')}")
    result["gpu_index"] = gpu_index
    return result


def main(argv: list[str] | None = None) -> int:
    import argparse

    p = argparse.ArgumentParser(prog="python -m brain.voice")
    sub = p.add_subparsers(dest="cmd", required=True)

    say = sub.add_parser("say", help="synthesize text to a wav")
    say.add_argument("character", help=f"one of {sorted(config.CHARACTER_VOICES)}")
    say.add_argument("text")
    say.add_argument("-o", "--out", default="voice_out.wav")
    say.add_argument("--language", default=config.DEFAULT_LANGUAGE)

    sub.add_parser("governance", help="print the Executive Brain classification")

    args = p.parse_args(argv)
    if args.cmd == "governance":
        print(json.dumps(governance_manifest(), indent=2))
        return 0
    try:
        result = synthesize(args.text, character=args.character, out_path=args.out, language=args.language)
    except ResourceGoverned as exc:
        print(json.dumps({"ok": False, "resource_governed": True, "error": str(exc)}, indent=2))
        return 3
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
