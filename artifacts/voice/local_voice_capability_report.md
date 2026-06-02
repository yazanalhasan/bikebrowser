# Local Voice Capability Report (Phase 5 + GPU Readiness)

Machine inspection. Evidence from `nvidia-smi`, `nvcc`, and Python probes run
2026-06-02. Reality > assumptions.

## Installed voice/STT/audio stack

| Component | Status | Detail |
|---|---|---|
| **Python** | ✅ | 3.11.9 |
| **PyTorch** | ✅ | `torch 2.8.0+cu129`, `cuda.is_available()=True`, `device_count=2` |
| **onnxruntime** | ⚠️ CPU-only | 1.23.2; providers = `[Azure, CPU]` (**no CUDA EP** installed) |
| **openai-whisper (STT)** | ✅ **installed** | `20250625` + `whisper` on PATH |
| **librosa** | ✅ | 0.10.2 (audio analysis) |
| **soundfile** | ✅ | 0.12.1 (wav I/O) |
| **ffmpeg** | ✅ | on PATH (audio transcode) |
| **ollama** | ⚠️ installed, **not running** | binary present; `:11434` not responding |
| **LM Studio** | ❌ not running | `:1234` not responding |
| **Piper** | ❌ absent | — |
| **Kokoro / Coqui-XTTS / F5-TTS / E2-TTS / Bark / StyleTTS / Tortoise** | ❌ none installed | no packages, no weights |

**Key conclusion:** the **inference foundation is ready** (torch+CUDA, 2 GPUs,
whisper for STT, librosa/soundfile/ffmpeg for analysis). The **only missing piece
for local voice is a TTS engine** — which is a `pip install` away and would run
instantly on this hardware. There is no hardware or framework blocker.

## GPU readiness (per detected GPU)

| GPU | Model | VRAM | Used / Free | Util | Role today |
|---|---|---|---|---|---|
| 0 | **RTX 5090** | 32607 MiB | 7297 / 24891 MiB | 0% | Display + desktop apps (Codex.exe C+G) |
| 1 | **RTX 5090** | 32607 MiB | 513 / 31675 MiB | 0% | **Idle / free** |

- **Driver:** 591.86 · **CUDA (driver):** 13.1 · **CUDA toolkit (nvcc):** 12.9.
- Both GPUs are at **0% utilization** — enormous idle headroom (≈56 GB free VRAM
  combined).

## TTS engine suitability on this hardware

Every viable local TTS model is **tiny** relative to a single 5090's 32 GB. All
fit comfortably; the 5090 (Blackwell) runs them far faster than real time.

| Engine | ~Model size (VRAM) | Multilingual? | Quality | Expected speed on RTX 5090 | Fit |
|---|---|---|---|---|---|
| **Piper** | ~60–120 MB (onnx) | many voices (per-voice) | good, neutral | ~real-time on **CPU**; near-instant (needs onnxruntime-gpu for GPU) | ✅ trivial |
| **Kokoro** | 82M params (~0.3 GB) | en + a few | very good, light | near-instant (>>RT) | ✅ trivial |
| **Coqui XTTS-v2** | ~1.8 GB | **17 langs incl. Spanish + Arabic** + voice cloning | high, expressive | faster-than-RT (est. ~5–15× RTF) | ✅ easy |
| **F5-TTS** | ~1.4 GB | multilingual, cloning | very high | faster-than-RT on 5090 | ✅ easy |
| **E2-TTS** | ~1.4 GB | multilingual | very high | faster-than-RT | ✅ easy |
| **Bark** | ~4–5 GB (all models) | multilingual + nonverbal | high, less controllable | slower (autoregressive), still RT-ish on 5090 | ✅ fits |
| **Whisper (STT, installed)** | large-v3 ~3 GB | 99 langs | high | real-time transcription | ✅ ready now |

> Speed figures are evidence-based *estimates* from model size + a 5090's
> throughput class; they should be confirmed by a one-line benchmark when an
> engine is actually installed. No TTS engine is installed yet, so no measured
> RTF exists.

## Expected concurrent workload
A single 5090 (32 GB) can hold, simultaneously and comfortably:
- one expressive TTS model (XTTS/F5, ~1.5–2 GB) **+** Whisper large-v3 (~3 GB)
  **+** headroom — i.e. **generate and acceptance-validate in the same process**,
  with ~25 GB still free.
- With **two** 5090s, voice generation and ComfyUI/Blender asset generation can
  run **fully in parallel on separate GPUs** (see `voice_gpu_allocation_plan.md`).

## What this means for "fully local voice"
- **Hardware:** more than sufficient (idle dual 5090). ✅
- **Frameworks:** ready (torch+CUDA, whisper, librosa). ✅
- **TTS engine:** **not installed** — the one concrete missing piece. ❌
- **Multilingual win:** XTTS-v2 / F5-TTS run **Spanish and Arabic locally**,
  which the browser TTS could not reliably do — directly enabling the rebuild's
  `spanish_neighbor`/`arabic_mentor` and the legacy heritage-language layer.
