# Voice GPU Allocation Plan (Phase 6)

Two GPUs are available — **confirmed: 2× RTX 5090, 32 GB each** (not a generic
pair). This plan is evidence-based on the actual hardware and on the fact that
voice is best done as an **offline pre-bake** (the game plays cached audio /
browser TTS at runtime; the GPUs are for *generation*, not per-frame inference).

## Current state (measured)
| GPU | VRAM | Free | Util | Bound to |
|---|---|---|---|---|
| 0 | 32 GB | 24.9 GB | 0% | Display + desktop apps (Codex.exe) |
| 1 | 32 GB | 31.7 GB | 0% | nothing (idle) |

Both idle; ≈56 GB free VRAM combined. CUDA 13.1 driver / 12.9 toolkit; torch
2.8.0+cu129 sees both.

## Recommended allocation

**Principle:** keep the *display* GPU (0) responsive for the desktop; put heavy
generation on the *clean* GPU (1). Because both are 32 GB, neither voice nor
ComfyUI/Blender is VRAM-constrained — the split is about **contention and
thermals**, not capacity.

### Plan A — default (recommended)
```
GPU 1 (clean, 31.7 GB free)  →  PRIMARY GENERATION
    • Local TTS batch generation (XTTS-v2 / F5-TTS)   ~2 GB
    • Whisper acceptance transcription                ~3 GB
    • leaves ~26 GB headroom
GPU 0 (display, desktop apps) →  SECONDARY / ASSET
    • ComfyUI / Blender asset generation (when running)
    • keep desktop responsive; avoid co-locating heavy TTS here
```
Rationale: voice generation is bursty and latency-tolerant (offline); isolating
it on the clean GPU avoids stutter on the desktop and lets ComfyUI/Blender use
GPU 0 without fighting the TTS process.

### Plan B — parallel asset+voice sprint (both busy)
```
GPU 1  →  ComfyUI / Blender heavy asset batches   (largest VRAM consumer)
GPU 0  →  Local TTS batch + Whisper               (TTS is light, ~5 GB total)
```
Use when an asset-generation sprint is the priority and voice is a side job;
TTS's small footprint coexists with the desktop on GPU 0.

### Why not "GPU0 runtime TTS / GPU1 ComfyUI" (the example)
Runtime TTS is **not needed** — the game uses browser `speechSynthesis` at
runtime and would play **pre-baked cached files** for neural voice. So there is
no per-frame GPU TTS load to pin to a GPU. The GPUs serve **offline generation**
(voice pre-bake + ComfyUI/Blender), which is what Plan A/B allocate.

## Governance (ties to R0 resource budgets)
All GPU generation runs under `brain/budgets/` resource caps
(`check_resource_or_block`): `gpu_minutes`, `wall_clock_seconds`, `max_batch`.
Recommended initial caps for an authorized voice run (operator sets in
`memory/procedural/project_budgets.yaml`):
```yaml
resources:
  local_tts:  { gpu_minutes: 60,  wall_clock_seconds: 3600, max_batch: 64, storage_gb: 5 }
  comfyui:    { gpu_minutes: 90,  wall_clock_seconds: 5400, max_batch: 16, storage_gb: 20 }
  blender:    { gpu_minutes: 120, wall_clock_seconds: 7200, max_batch: 8,  storage_gb: 20 }
```
(`local_tts` is free of money cost but must still be resource-governed so an
autonomous batch can't pin a GPU indefinitely — exactly what R0.2 enforces.)

## Concurrency summary
- A 5090 holds **TTS + Whisper together** with ~25 GB to spare → generate and
  validate in one pass.
- Two 5090s → **voice and ComfyUI/Blender fully parallel**.
- Thermals/power: 575–600 W caps per card; serialize *within* a card, parallelize
  *across* cards. The R0 wall-clock caps bound run length.
