# Voice Architecture Recommendation (Phase 8)

Recommendation only — **no building, no audio generation** (per directive).
Priorities, in order: **local → offline → cached → budget-free.** The evidence
makes all four achievable here.

## Recommendation: LOCAL-FIRST, offline pre-bake, hybrid fallback

```
                 ┌─────────────────────────────────────────────┐
   Dialogue text │  SpeechNormalization (exists)                │
   + voiceId     │        ↓                                     │
   (exists)      │  LOCAL neural TTS  (XTTS-v2 / F5-TTS)  ← GPU1 │  OFFLINE
                 │        ↓                                     │  PRE-BAKE
                 │  Audio acceptance (whisper + librosa)        │  (free,
                 │        ↓                                     │   cached,
                 │  Voice cache + manifest (per voiceId/line)   │   governed)
                 └─────────────────────────────────────────────┘
                          ↓ cached .ogg/.wav
   Runtime in game:  MusicSystem-style <Audio> playback  (preferred)
                     └─ fallback → browser speechSynthesis (exists, free)
                     └─ special/cinematic only → MiniMax (paid, gated)
```

## Why local, not MiniMax, as the default
| Option | Cost | Offline | Multilingual (es/ar) | Verdict |
|---|---|---|---|---|
| **Local neural TTS** (XTTS-v2/F5) | **free** (resource only) | **yes** | **yes** | ✅ **primary** |
| Browser speechSynthesis | free | yes | unreliable (host voices) | ✅ runtime fallback (keep) |
| MiniMax | **paid**, plan_only, no adapter | no (cloud) | yes | ⚠️ special/cinematic only |

The dual RTX 5090 makes local TTS faster-than-realtime and effectively free
(resource-governed), and **solves the Spanish/Arabic gap** the browser couldn't.
MiniMax stays a paid, governed exception for cinematic narration — never the
default.

## Recommended engines
- **Primary NPC voices: Coqui XTTS-v2** — 17 languages incl. **Spanish + Arabic**,
  voice cloning for *consistent NPC identity* across acts, ~1.8 GB, fast on 5090.
- **Narration / UI / high-volume lines: Piper** (or Kokoro) — ultra-fast, light,
  deterministic; good for the science-narration `ecology_sign`/UI lines.
- **Acceptance: Whisper (already installed)** — transcribe generated audio,
  verify it says the right words in the right language.
- (F5-TTS / E2-TTS are strong alternates to XTTS if cloning quality favors them —
  benchmark when installing.)

## Maximize reuse (do NOT rebuild)
| Reuse | From |
|---|---|
| NPC voice profiles / speaker→voiceId map | `src/game/phaser/audio/NPCVoiceRegistry.js` |
| Pre-TTS normalization (pH, CO2, UTM, fractions) | `SpeechNormalizationSystem.js` |
| Dialogue metadata (speaker/voiceId/lang/emotion/trust) | `data/act1/act1Dialogue.js` |
| Cached-audio playback pattern | `MusicSystem.js` `<Audio>` |
| Event-level acceptance hook | `BIKEBROWSER_AUDIO_AUDIT` (`Act1AudioSystem.js`) |
| Heritage-language data + mastery design | legacy `languages.js` + `languageProgressionSystem.js` (169 terms, 6 regions) |
| Governance (budget/resource/recovery/promotion) | EB `brain/budgets`, `brain/recovery`, `brain/assets/promotion.py` |

## New pieces to build later (NOT now — this is the audit)
1. **EB voice/audio executor** — local-TTS subprocess adapter (XTTS/Piper),
   behind `enforce_executor_privilege` + `check_resource_or_block`.
2. **Voice workflow** — normalize → generate → acceptance-validate → cache →
   register → emit a game-readable manifest.
3. **Voice cache + manifest** — `public/game/audio/voice/<voiceId>/<lineId>.ogg`
   + a JSON manifest keyed by dialogue line; size-capped + checksummed.
4. **Audio-acceptance validator** — whisper (intelligibility/language) + librosa
   (duration/clipping/empty) → feeds `brain/assets/promotion.py` (reject junk).
5. **Game playback switch** — prefer cached voice file; fall back to browser TTS
   if missing (zero-regression, progressive enhancement).

## Governance posture (already mostly in place)
- Local TTS is **budget-free (no money)** but **resource-governed**
  (`gpu_minutes`/`wall_clock`/`max_batch`/`storage_gb`) — operator sets a
  `local_tts` resource budget; autonomous runs can't pin a GPU.
- MiniMax voice stays **blocked until an operator sets a `minimax` usd_limit**.
- Every generated clip passes the **promotion gate** (validation + acceptance +
  provenance) before it reaches production — no junk audio shipped.
- **Cultural-voice gate:** Arabic (`arabic_mentor`) and any voice/likeness with
  cultural identity passes the human CARE review per
  `creative_pipeline_policy.yaml:65-69` — *not* agent-authored.

## Bottom line
Adopt **local-first offline-cached TTS on the idle 5090, governed by R0, with
browser TTS as fallback and MiniMax reserved for paid cinematic exceptions.** It
is local, offline, cached, and budget-free — exactly the stated priorities — and
it reuses essentially all existing substrate.
