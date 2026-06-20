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
#
# 2026-06-20: keyed by the *runtime voiceId the game sends* (NPCVoiceRegistry
# profile.voiceId), not just the legacy npc id. Before this, only `narrator` and
# `trader` resolved on the XTTS path — the whole main cast (zuzu, dex,
# garage_mentor, neighbor, arabic_mentor, ...) raised KeyError and silently fell
# back to browser Web Speech. Legacy keys are retained for the `say` CLI. The
# newly-mapped speaker picks are PROVISIONAL — audition them on the GPU box before
# treating them as final (see artifacts/bikebrowser/audio/dex_voice_evaluation.md).
CHARACTER_VOICES: dict[str, str] = {
    # --- runtime voiceIds (what Act1AudioSystem sends as ?voice=) ---
    "narrator": "Royston Min",
    "zuzu": "Daisy Studious",            # provisional: bright, youthful, never baby-talk
    "dex": "Andrew Chipper",             # provisional: youthful, energetic, brash — see dex_voice_evaluation.md
    "garage_mentor": "Kazuhiko Atallah",  # Mr. Chen — calm, grounded mentor
    "neighbor": "Ana Florence",          # Mrs. Ramirez — warm, maternal
    "spanish_neighbor": "Ana Florence",   # same person, Spanish-context lines
    "arabic_mentor": "Suad Qasim",       # provisional: Auntie Mariam — warm, MENA-appropriate (Arabic)
    "ecology_sign": "Royston Min",       # field-guide narration
    "trader": "Craig Gutsy",
    # --- legacy npc-id keys (kept for the `python -m brain.voice say` CLI) ---
    "mr_chen": "Kazuhiko Atallah",
    "mrs_ramirez": "Ana Florence",
}


def resolve_character(character: str) -> str:
    """Map a character id (e.g. 'mrs_ramirez') to its studio speaker name."""
    key = character.strip().lower().replace(" ", "_").replace(".", "")
    if key not in CHARACTER_VOICES:
        raise KeyError(
            f"unknown character {character!r}; known: {sorted(CHARACTER_VOICES)}"
        )
    return CHARACTER_VOICES[key]
