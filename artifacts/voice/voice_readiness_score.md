# Voice Infrastructure Readiness Score (Phase 10)

Evidence-based score, 0–100, across the requested categories, then the two final
questions answered exactly.

## Scorecard

| Category | Score /100 | Basis |
|---|---|---|
| Existing code | **70** | Rich, wired game-side audio/voice/dialogue (~1,300 LOC rebuild + legacy systems); browser TTS + music work |
| Existing models | **10** | **No TTS model installed**; whisper STT present; no voice weights |
| Existing workflows | **15** | No voice workflow anywhere; R0 governance workflows reusable |
| Executive Brain integration | **10** | Governance-only (MiniMax `plan_only`, no adapter); no voice executor/workflow/cache |
| Runtime integration | **65** | Browser TTS + music wired and playing; cached-voice playback path absent |
| Educational narration | **35** | Normalization + dialogue exist; no narration system; legacy coach orphaned |
| Language learning | **40** | Complete legacy design + 169 terms/6 regions — but **orphaned**; rebuild has trust + 2 greetings |
| NPC dialogue | **75** | Dialogue system + voice registry + per-NPC profiles wired (13 nodes/23 lines) |
| Local generation | **20** | Hardware + frameworks ready (dual 5090, torch+CUDA, whisper); **no TTS engine installed** |
| Autonomous generation | **10** | No executor/queue/cache/validator wired; R0 governance primitives exist but unconnected |
| **OVERALL** | **≈ 35 / 100** | Early foundation: strong substrate + exceptional hardware, but the generation/cache/EB-execution layer is absent |

## Final question 1 — "Can BikeBrowser support a fully local voice system today?"

**Not turnkey today — but it is the closest of any option, and only a thin
sprint away.** Out of the box, no: there is no local TTS engine installed, no
voice cache, and the game plays browser TTS (host-dependent) rather than local
neural audio. **However**, everything *around* the engine already exists.

### Exactly how it becomes possible (5 concrete steps)
1. **Install a local TTS engine** — `pip install` XTTS-v2 (or F5-TTS) + Piper;
   runs immediately on the idle RTX 5090 (32 GB free, torch 2.8.0+cu129 ✓).
2. **Add an EB voice executor + workflow** — normalize → generate (GPU1,
   resource-gated) → validate → cache → register. Reuses
   `enforce_executor_privilege` + `check_resource_or_block`.
3. **Create the voice cache + manifest** —
   `public/game/audio/voice/<voiceId>/<lineId>.ogg` + JSON manifest; size-capped,
   checksummed.
4. **Wire audio acceptance** — whisper (intelligibility/language) + librosa
   (duration/clipping/empty) → `brain/assets/promotion.py` gate (reject junk).
5. **Switch game playback** — prefer cached voice file (MusicSystem `<Audio>`
   pattern); fall back to browser TTS if missing (zero-regression).

All five use existing hardware, existing frameworks, and existing substrate
(registry, normalization, dialogue metadata, governance). This is a **wiring
sprint, not a research project** — and it uniquely delivers **local Spanish +
Arabic** voice the browser couldn't.

## Final question 2 — "Can Executive Brain operate a complete local voice production pipeline today?"

**No.** EB today has **governance for voice but no execution of voice.**

### Exactly what is missing in EB
| Missing piece | Have instead |
|---|---|
| Voice/audio **executor** | only codex/claude/openclaw/playwright/validator/local_stub |
| Voice **workflow** (generate→cache→assign→validate) | none |
| Voice **cache + queue** | none (no cache/queue concept anywhere) |
| Audio-asset **validator** wiring | whisper+librosa installed but unconnected; `assets/promotion.py` exists but not fed audio |
| Local TTS **engine** | not installed |
| MiniMax voice **adapter** | `executor_id: null`, "adapter not_yet_implemented", `plan_only` |

### What EB already has (so the gap is bounded)
- Governance fully ready to wrap a voice pipeline: `brain/budgets/` (resource
  caps), `brain/recovery/` (stuck-detection), `brain/assets/promotion.py`
  (junk-asset gate), `brain/missions/value_scoring.py` + `brain/tools/selection.py`
  (defer paid, prefer local), plus the MiniMax privilege/capability/playbook/
  cultural-gate scaffolding.
- The machine: dual RTX 5090, torch+CUDA, whisper, librosa, ffmpeg.

**So EB cannot *operate* a local voice pipeline today, but it can *govern* one —
the missing layer is execution (executor + workflow + cache + validator wiring +
an installed engine), not governance.**

## One-line answer
**Voice readiness ≈ 35/100 — exceptional hardware and a real game-side voice
substrate, governed by the new R0 primitives, but with the local-TTS engine
uninstalled and the EB generation/cache/validation layer unbuilt. A fully local,
offline, cached, budget-free voice system is achievable in a focused wiring
sprint; it is not operational today.**

(Build nothing yet — this is the audit. Next move is your call:
`voice_architecture_recommendation.md` defines the sprint.)
