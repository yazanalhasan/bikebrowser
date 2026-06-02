# Voice Gap Analysis (Phase 7)

Synthesis across all phases, including the appended **Production Readiness**,
**Asset Pipeline**, **Governance**, and **Acceptance** audits. Status taxonomy:
**IMPLEMENTED / PARTIAL / DESIGN-ONLY / MISSING.**

## Voice Production Readiness — the pipeline, end to end

> Question: can the system run **Text → Voice Generation → Voice Cache → Voice
> Registry → NPC Playback → Acceptance Validation** without human intervention?

| Stage | Status | Evidence / gap |
|---|---|---|
| **Text** (dialogue source) | **IMPLEMENTED** | `data/act1/act1Dialogue.js` (13 nodes/23 lines, speaker+voiceId+language+emotion+trust); legacy `languages.js` (169 terms); `SpeechNormalizationSystem.js` |
| **Voice Generation** | **PARTIAL** | browser `speechSynthesis` works (host-dependent, English-reliable) — `Act1AudioSystem.js:148-221`. **Local neural gen = MISSING** (no TTS engine installed). MiniMax = DESIGN-ONLY (no adapter) |
| **Voice Cache** | **MISSING** | no cache dirs, no cache code; runtime TTS is ephemeral |
| **Voice Registry** | **IMPLEMENTED (game-side)** | `NPCVoiceRegistry.js` (7 profiles), Godot `voice_profiles.json`. **But no *generated-asset* registry/manifest** |
| **NPC Playback** | **PARTIAL** | live browser-TTS playback IMPLEMENTED; **cached-file voice playback path = MISSING** (MusicSystem `<Audio>` pattern exists but unused for voice) |
| **Acceptance Validation** | **PARTIAL** | instrumentation hook `BIKEBROWSER_AUDIO_AUDIT` + `game-rebuild.audio.spec.js` validate *events*, not audio *content*. Content validation MISSING (though whisper+librosa are installed) |

**End-to-end autonomous verdict: NOT POSSIBLE today.** The chain breaks at
Generation (no local engine), Cache (absent), cached-Playback (absent), and
content Acceptance (not wired). Three of six stages are PARTIAL/MISSING.

## Voice Asset Pipeline Audit

| Artifact | Exists? | Evidence |
|---|---|---|
| Voice cache directories | **MISSING** | none in either repo |
| Audio asset directories | **EXIST** | `public/game/audio/music/` (5 tracks); `sfx/`+`ambient/` = empty stubs; legacy `public/game/audio/` (29 files) |
| Narration directories | **MISSING** | none |
| NPC voice registries | **EXIST** | `NPCVoiceRegistry.js`, `BikeBrowserWorld/Data/audio/voice_profiles.json` |
| Speaker metadata | **EXIST** | rate/pitch/lang/gender/voiceHints per NPC |
| Dialogue metadata | **EXIST** | `act1Dialogue.js`: speaker, voiceId, language, emotion, trust, speechEnabled |
| Audio playback systems | **EXIST** | `Act1AudioSystem.js`, `MusicSystem.js` (rebuild); `AudioManager.js` (legacy) |
| Audio acceptance tests | **PARTIAL** | `game-rebuild.audio.spec.js` + Godot voice checks (event/profile level); **no content-level audio validation** |

## Voice Workflow Audit (generate / cache / reuse / assign / play / validate)

| Workflow capability | Status |
|---|---|
| generate voice | **MISSING** (no engine, no executor, no workflow) |
| cache voice | **MISSING** |
| reuse voice | **MISSING** |
| assign voice to NPC | **PARTIAL** (registry maps speaker→profile; no generated-asset assignment) |
| play voice in game | **IMPLEMENTED (browser TTS)** / cached-file **MISSING** |
| validate voice asset | **MISSING** (tools present, not wired) |

No existing workflow in EB or BB performs generate→cache→assign→validate.

## Voice Governance Audit — can local TTS run autonomously safely?

No local TTS is installed yet, but if/when it is, the **R0 governance shipped
this session covers most of it**:

| Control | Status | Evidence / gap |
|---|---|---|
| Resource limits (GPU-min/wall-clock/batch) | **READY, unwired** | `brain/budgets/enforcement.py::check_resource_or_block` exists; needs caps set + wiring into a TTS executor |
| Queue limits | **MISSING** | no voice queue concept anywhere |
| Cache limits | **MISSING** | no cache; `storage_gb` resource cap exists but nothing to apply it to |
| Storage limits | **PARTIAL** | `ResourceBudget.storage_gb` exists; no cache dir governed yet |
| Acceptance validation | **PARTIAL** | whisper+librosa installed; `assets/promotion.py` gate exists; **not wired to audio** |

**Required governance to add (before autonomous voice):** a bounded **voice
queue**, a **cache with size cap + integrity check**, wiring
`check_resource_or_block` into the TTS executor, and an **audio-asset acceptance
validator** feeding `brain/assets/promotion.py` (stage→promote/reject).

## Voice Acceptance Audit — can generated audio be auto-validated?

| Check | Status | Tooling |
|---|---|---|
| Duration | **PARTIAL** (feasible now) | `soundfile`/`librosa` installed; not wired |
| Clipping | **PARTIAL** | `librosa` peak/RMS; not wired |
| Empty output | **PARTIAL** | `soundfile` zero-length/silence; not wired |
| Intelligibility | **PARTIAL** | **whisper installed** → transcribe + compare to source text; not wired |
| Language correctness | **PARTIAL** | whisper language-id; not wired |
| Cache integrity | **MISSING** | no cache to checksum |

**All content checks are FEASIBLE today** with already-installed tools — none is
IMPLEMENTED. This is a wiring task, not a research task.

## Overall: exists / works / partial / design-only / missing

- **WORKS now:** browser-TTS dialogue (English-reliable), music playback,
  NPC voice registry + per-NPC profiles, dialogue + trust + language metadata,
  speech normalization, event-level audio acceptance, player audio controls.
- **PARTIAL:** localized (es/ar) voice (falls back to English), cached-file
  playback path, content-level acceptance (tools present, unwired), storage
  governance.
- **DESIGN-ONLY:** EB voice capability (MiniMax `plan_only`, no adapter),
  narration management, NPC-voice management.
- **MISSING:** local neural TTS engine (not installed), voice cache, voice
  queue, EB voice/audio/narration executor, voice workflow, generated-asset
  registry/manifest, audio-content validator wiring.

## The single biggest leverage point
Everything except the **TTS engine + a thin EB voice executor/workflow + cache**
already exists or is one `pip install` away. The hardware (dual idle RTX 5090),
frameworks (torch+CUDA+whisper+librosa), game substrate (registry/normalization/
dialogue/playback/acceptance-hook), and governance (R0 budgets/resource/recovery/
promotion) are all present. See `voice_architecture_recommendation.md`.
