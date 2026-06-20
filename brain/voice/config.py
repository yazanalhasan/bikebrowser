"""Governance + configuration for the local XTTS voice engine.

Classification (Executive Brain):
    tool: xtts
    cost_class: local_ai          # consumes GPU/VRAM/RAM/storage, NOT dollars
    approval_required: false      # local inference needs no spend approval
    resource_governed: true       # but IS subject to a VRAM/concurrency budget
    paid: false

See artifacts/governance/xtts_feasibility_audit.md for the full audit.
"""
from __future__ import annotations

from pathlib import Path

# --- Executive Brain classification (single source of truth) ---
GOVERNANCE: dict = {
    "tool": "xtts",
    "cost_class": "local_ai",
    "approval_required": False,
    "resource_governed": True,
    "paid": False,
    # Licensing is a hard, recorded fact so it cannot be forgotten downstream.
    "code_license": "MPL-2.0",
    "weights_license": "CPML (Coqui Public Model License)",
    "commercial_use": "RESTRICTED",  # XTTS-v2 weights are non-commercial
}

# --- Engine / environment (isolated venv; NOT the brain interpreter) ---
XTTS_ENV_PYTHON = Path(r"C:\AI\XTTS\.venv\Scripts\python.exe")
MODEL = "tts_models/multilingual/multi-dataset/xtts_v2"
DEFAULT_LANGUAGE = "en"
SAMPLE_RATE = 24000

# --- Resource budget enforced because resource_governed is True ---
RESOURCE_BUDGET: dict = {
    "min_free_vram_gb": 3.0,   # refuse if a GPU cannot offer this much free VRAM
    "expected_vram_gb": 2.1,   # measured peak per generation (see benchmark)
    "max_concurrent": 1,       # single-flight; one synthesis at a time
    "preferred_gpu_index": 1,  # pin to GPU 1 (GPU 0 often busy with ComfyUI/etc.)
    "peak_target_dbfs": -1.0,  # normalize output to -1 dBFS (XTTS clips at 0 dBFS)
}

# --- Character -> built-in XTTS studio speaker mapping ---
# Validated 2026-06-05. Replace a value with a path to reference audio to clone
# a real voice instead of using a built-in speaker (see synthesize.synthesize).
CHARACTER_VOICES: dict[str, str] = {
    "narrator": "Royston Min",
    "mr_chen": "Kazuhiko Atallah",
    "mrs_ramirez": "Ana Florence",
    "trader": "Craig Gutsy",
}


def resolve_character(character: str) -> str:
    """Map a character id (e.g. 'mrs_ramirez') to its studio speaker name."""
    key = character.strip().lower().replace(" ", "_").replace(".", "")
    if key not in CHARACTER_VOICES:
        raise KeyError(
            f"unknown character {character!r}; known: {sorted(CHARACTER_VOICES)}"
        )
    return CHARACTER_VOICES[key]
