"""Out-of-process XTTS worker — runs INSIDE C:\\AI\\XTTS\\.venv (which has TTS).

The brain interpreter does not import TTS/torch; brain.voice.synthesize invokes
this file with the XTTS venv python and a JSON request on argv. Keeping the heavy
imports here means the rest of the brain stays light and dependency-free.

Request  (argv[1] = path to JSON): {text, out_path, speaker?|speaker_wav?,
                                    language?, gpu_index?, peak_target_dbfs?}
Response (stdout JSON): {ok, file, audio_sec, gen_sec, rtf, peak_vram_gb,
                         peak_dbfs, normalized}
"""
from __future__ import annotations

import json
import os
import sys
import time
import wave


def _load_request() -> dict:
    with open(sys.argv[1], "r", encoding="utf-8") as fh:
        return json.load(fh)


def _peak_normalize(path: str, target_dbfs: float) -> float:
    """Scale 16-bit PCM WAV so its peak sits at target_dbfs. Returns the peak."""
    import audioop

    with wave.open(path, "rb") as w:
        params = w.getparams()
        sw = w.getsampwidth()
        frames = w.readframes(w.getnframes())
    full = float(2 ** (8 * sw - 1))
    peak = audioop.max(frames, sw)
    if peak <= 0:
        return -99.0
    target_amp = full * (10 ** (target_dbfs / 20.0))
    factor = target_amp / peak
    if factor < 1.0:  # only attenuate; never amplify noise
        frames = audioop.mul(frames, sw, factor)
        with wave.open(path, "wb") as w:
            w.setparams(params)
            w.writeframes(frames)
    import math

    return round(20 * math.log10(peak / full), 2)


def main() -> int:
    req = _load_request()
    os.environ.setdefault("COQUI_TOS_AGREED", "1")  # CPML accepted at audit time

    import torch
    from TTS.api import TTS

    gpu = int(req.get("gpu_index", 0))
    device = f"cuda:{gpu}" if torch.cuda.is_available() else "cpu"

    tts = TTS(req.get("model", "tts_models/multilingual/multi-dataset/xtts_v2"))
    tts.to(device)

    out_path = req["out_path"]
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)

    if device.startswith("cuda"):
        torch.cuda.reset_peak_memory_stats(gpu)
        torch.cuda.synchronize(gpu)
    t0 = time.time()
    kwargs = dict(text=req["text"], language=req.get("language", "en"), file_path=out_path)
    if req.get("speaker_wav"):
        kwargs["speaker_wav"] = req["speaker_wav"]
    else:
        kwargs["speaker"] = req["speaker"]
    tts.tts_to_file(**kwargs)
    if device.startswith("cuda"):
        torch.cuda.synchronize(gpu)
    gen_sec = time.time() - t0
    vram = round(torch.cuda.max_memory_allocated(gpu) / 1e9, 2) if device.startswith("cuda") else 0.0

    with wave.open(out_path, "rb") as w:
        audio_sec = w.getnframes() / float(w.getframerate())

    target = req.get("peak_target_dbfs")
    peak_dbfs = _peak_normalize(out_path, float(target)) if target is not None else None

    print(json.dumps({
        "ok": True,
        "file": out_path,
        "audio_sec": round(audio_sec, 2),
        "gen_sec": round(gen_sec, 2),
        "rtf": round(gen_sec / audio_sec, 3) if audio_sec else None,
        "peak_vram_gb": vram,
        "peak_dbfs": peak_dbfs,
        "normalized": target is not None,
        "device": device,
    }))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # surface a structured error to the caller
        print(json.dumps({"ok": False, "error": f"{type(exc).__name__}: {exc}"}))
        sys.exit(1)
