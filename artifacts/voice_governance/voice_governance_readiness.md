# Voice Governance Readiness — Sprint V1 result

Outcome of the Voice Governance Sprint: converting voice from **DESIGN ONLY** to
**IMPLEMENTED** in Executive Brain (`C:/Users/admin/Documents/executive-brain/
brain/voice/`) **without generating any production audio.** The entire execution
path exists and is gated; generation is disabled by design.

## Definition of done — MET
Executive Brain can answer **"generate this voice"** end-to-end:
`VoiceExecutor.plan(request)` returns a complete `VoicePlan` (voice_id, language,
engine, cache key, cache path, cache-hit, every gate decision) and
`generate(request)` walks registry → cache → queue → privilege → budget →
(recovery-guarded adapter) → validation → promotion → manifest — **but no audio
is produced.** `VOICE_GENERATION_ENABLED` is `False` and both adapters raise
`GenerationDisabled`. Verified by `tests/test_voice_governance.py` (16 tests):
`plan`/`generate` create **no `.ogg` file**, manifest status is
`generation_disabled`, adapters are unavailable and refuse.

## Scorecard

| Area | Status | Score /5 | Evidence |
|---|---|---|---|
| **Registry** | IMPLEMENTED | 5 | `voice_registry.py` — 7 profiles (all Act-1 NPCs), superset of game-side `NPCVoiceRegistry.js`; cultural_gate on es/ar |
| **Cache** | IMPLEMENTED | 5 | `voice_cache.py` — content-addressed (`hash(profile+speaker+text)`), `cache/audio/{dialogue,npc,notebook,tutorial,discovery}`, reuse-on-hit, checksum |
| **Manifest** | IMPLEMENTED | 5 | `voice_manifest.py` — `voice_manifest.json` keyed by line_id (speaker/text/voice_id/language/status/cache_path/engine/duration/checksum) |
| **Executor** | IMPLEMENTED | 5 | `voice_executor.py` — plan + full generate path; generation gated off; integrates all 4 gates |
| **Validation** | IMPLEMENTED + STUBS | 4 | `voice_validation.py` — duration/empty/clipping/cache-integrity (real, via soundfile); intelligibility + language **stubbed** (Whisper future) |
| **Promotion** | INTEGRATED | 4 | executor calls `brain/assets/promotion.py` validate→promote/reject in the generation branch (reachable when enabled) |
| **Budget** | INTEGRATED | 5 | `check_resource_or_block(project,'local_tts', gpu_minutes=…)` — fail-closed; no `local_tts` budget set ⇒ blocked (safe default) |
| **Recovery** | INTEGRATED | 5 | `RecoveryGuard` wraps the adapter call (no infinite retry) in the generation branch |

**Tests:** `tests/test_voice_governance.py` — **16 passing**. Full EB suite green.

## Governance integration (voice obeys all gates)
- **Privileges:** executor calls `enforce_executor_privilege("voice","execute")`
  — `voice` is unmapped ⇒ **fail-closed** (real generation refused) by design.
  Enabling later = register a `voice_local` privilege at `governed_execute`.
- **Budgets (resource):** `local_tts` is money-free but **resource-governed**
  (GPU-minutes/wall-clock/storage/batch). No budget set ⇒ blocked. Operator
  authorizes by adding `resources.local_tts` to `project_budgets.yaml`.
- **Recovery:** failing synthesis is bounded by the 2-fail→consult→escalate
  guard — a stuck TTS job can't loop.
- **Promotion:** generated clips must pass validation + acceptance + provenance
  before reaching production (junk-audio gate).
- **Queue:** bounded (`max_length=200`), fail-closed when full.
- **Cultural gate:** `arabic_mentor` (Auntie Mariam) + `spanish_neighbor` carry
  `cultural_gate=True` → hard stop for human CARE review before any generation.

## GPU plan (resource-governance integration)
```
GPU0  →  Gameplay / runtime (display + desktop apps)   — keep responsive
GPU1  →  Voice generation (XTTS-v2 / Piper) + Whisper   — dedicated compute
```
- The executor stamps `gpu="GPU1"` on every plan.
- Recommended `project_budgets.yaml` entry (operator sets when enabling):
  ```yaml
  resources:
    local_tts: { gpu_minutes: 60, wall_clock_seconds: 3600, max_batch: 64, storage_gb: 5 }
  ```
- Until that entry exists, `check_resource_or_block` blocks `local_tts`
  (fail-closed) — so even flipping `VOICE_GENERATION_ENABLED` can't run unbounded.

## Adapters (interface-only — engines NOT installed)
- `adapters/xtts.py` (XTTS-v2, primary, multilingual incl. es/ar + cloning) and
  `adapters/piper.py` (fast narration/UI). Both: `available()==False`,
  `synthesize()` raises `GenerationDisabled`. Real call sites are written but
  commented/guarded. Install hints included.

## What is intentionally NOT done (the gated next steps)
1. **Install XTTS-v2 + Piper** (operator-gated; `pip install TTS` / `piper-tts`).
2. **Flip `EXECUTIVE_BRAIN_ENABLE_VOICE_GEN=1`** + register the `voice_local`
   privilege at `governed_execute` + set the `local_tts` resource budget.
3. **Generate sample NPC audio** (one line) → must pass validation.
4. **Wire Whisper** into `validate_intelligibility`/`validate_language`.
5. **Scale to full production** only after samples pass.

## Verdict
**Voice Governance Sprint V1 PASSES.** Voice is now **IMPLEMENTED (governance-
only)** in Executive Brain: the complete execution path exists, every gate is
integrated and fail-closed, and **no audio is or can be generated** without an
explicit operator-gated enable. Readiness to *operate* a local voice pipeline
moves from ≈10/100 (autonomous generation) to a fully-built, disabled-by-design
path awaiting engine install + sign-off.
