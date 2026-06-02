# Executive Brain Voice Capability Audit (Phase 4)

Repo: `C:/Users/admin/Documents/executive-brain`. Covers the Phase-4 capability
audit **plus** the requested EB Integration Audit and Voice Workflow Audit.
Evidence `file:line`.

## Verdict
**Executive Brain has NO voice runtime code.** It cannot generate, queue, cache,
manage narration, or manage NPC voices. It has a complete **governance layer**
for voice (MiniMax privileges + capability + playbooks + cultural gate + budget
wiring), but **every runtime path is `plan_only` with no adapter**. MiniMax voice
in EB = **governance-only (design-complete, implementation-absent)**.

## Capability table

| Capability | Exists? | Status | Evidence |
|---|---|---|---|
| Generate voice / TTS | no client | **DESIGN-ONLY** | `capabilities/minimax.yaml:5` (`executor_id: null`), `:48` ("adapter not_yet_implemented"); `executive_privileges.yaml:452-465` (`minimax_voice` `plan_only`) |
| Queue voice | no | **MISSING** | no `voice_queue`/`narration_queue` anywhere (grep: 0) |
| Cache voice / audio | no | **MISSING** | no `voice_cache`/`audio_cache` (grep: 0) |
| Manage narration | no code | **DESIGN-ONLY** | `executive_privileges.yaml:458` (`generate_narration`); `tool_playbooks/minimax_voice.md:18-21` ("runtime TTS stays in `audioLanguageSystem.js`") |
| Manage NPC voices | no code | **DESIGN-ONLY** | `minimax_voice` `generate_npc_voice_reference`; "references only" |
| MiniMax adapter/client | no | **GOVERNANCE-ONLY** | registry has no minimax executor; only env-detection + probes |

## EB Integration Audit — exact gaps

| EB component | Present? | Evidence / gap |
|---|---|---|
| Voice **capability** (yaml) | DESIGN-ONLY | `capabilities/minimax.yaml` describes it; `executor_id: null` |
| Voice **workflow** | **MISSING** | no generate→cache→assign→play→validate workflow exists |
| Voice **playbook** | EXISTS (design) | `tool_playbooks/minimax_voice.md` (+ audio/music/video/animation) |
| Voice **executor** | **MISSING** | `executors/registry.py:17-24` = codex/claude/openclaw/playwright/validator/local_stub only |
| Audio **executor** | **MISSING** | none; only an external probe of BB `scripts/generate-audio.py` (`capability_demo/safe_probes.py:77-83`) — never calls it |
| Narration **executor** | **MISSING** | none |

**MiniMax is recognized only as metadata/routing**, never an API call:
`integrations/api_registry.py:36` (provider metadata), `capability_demo/*`
(existence probes), `budgets/enforcement.py:24` + `missions/value_scoring.py:32`
+ `tools/selection.py:60` + `orchestration/approval.py:38` (treat `minimax` as a
paid tool for gating). A repo-wide grep for an actual client (`api.minimax`,
`MiniMaxClient`, voice/tts classes) → **0 hits in `brain/`**.

## Voice Workflow Audit

| Workflow step | Supported by any EB workflow? |
|---|---|
| generate voice | **MISSING** |
| cache voice | **MISSING** |
| reuse voice | **MISSING** |
| assign voice to NPC | DESIGN-ONLY (playbook describes "voice references"; no workflow) |
| play voice in game | **N/A to EB** — playback is the game's job (browser TTS today) |
| validate voice asset | **MISSING** in EB (the game has an audio-acceptance *hook*, but EB has no audio-asset validator) |

## What EB *does* have that's reusable for voice governance
The **R0 governance primitives shipped this session** map directly onto a voice
pipeline (see `voice_architecture_recommendation.md` and the governance audit in
`voice_gap_analysis.md`):
- `brain/budgets/` — money + **resource** caps (GPU-minutes/wall-clock/storage/
  batch) → governs local-TTS GPU runs and paid MiniMax.
- `brain/recovery/` — stuck-detection (a failing TTS job won't loop forever).
- `brain/assets/promotion.py` — stage→promote/reject requiring validation +
  acceptance + provenance → **exactly** the gate for generated audio assets.
- `brain/missions/value_scoring.py` + `brain/tools/selection.py` — defer paid
  MiniMax until budgets; prefer free/local.

So EB has the **governance to operate** a voice pipeline, but **none of the voice
*execution*** (no executor, no workflow, no cache/queue, no client).

## Exact gaps to close (for a later build phase — not now)
1. A **voice/audio executor** in `brain/executors/` (local-TTS subprocess
   adapter; optional MiniMax client behind privilege+budget).
2. A **voice workflow**: normalize → generate (local) → acceptance-validate →
   cache → register to NPC → manifest for the game.
3. A **voice cache/registry** (dirs + speaker/dialogue metadata + manifest).
4. An **audio-asset acceptance validator** (duration/clipping/empty/intelligibility
   via the already-installed whisper + librosa).
