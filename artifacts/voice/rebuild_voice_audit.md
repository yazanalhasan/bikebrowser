# Rebuild Voice Audit (Phase 3)

Tree: `src/game/` (route `/game-rebuild`, ~5k LOC, polished Act-1 slice). All
audio/voice/dialogue lives under `src/game/phaser/`. Evidence `file:line`.
Question per system: works? disabled? missing? intended?

## Summary verdict
The rebuild has a **clean, fully-wired audio/voice/dialogue substrate (~1,300
LOC)** built on **browser `speechSynthesis` + HTML `<Audio>` music**. Voice,
music, dialogue, NPC voice profiles, trust, and language metadata all WORK.
SFX and ambient are **instrumented but silent** (no audio files). It is the
**right spine to attach a real local-TTS pre-bake to** — the registry, the
normalization, the dialogue pipeline, and the acceptance hook already exist.

## Inventory

| System | Path | ~LOC | Status |
|---|---|---|---|
| Act1AudioSystem (orchestrator) | `phaser/audio/Act1AudioSystem.js` | 317 | WORKS |
| MusicSystem | `phaser/audio/MusicSystem.js` | 111 | WORKS (real audio files) |
| NPCVoiceRegistry (7 profiles) | `phaser/audio/NPCVoiceRegistry.js` | 130 | WORKS |
| SpeechNormalizationSystem | `phaser/audio/SpeechNormalizationSystem.js` | 117 | WORKS |
| DialogueSystem | `phaser/systems/DialogueSystem.js` | 48 | WORKS |
| DialogueScene (UI + TTS trigger) | `phaser/scenes/DialogueScene.js` | 84 | WORKS |
| Act1 dialogue data (13 nodes / 23 lines) | `data/act1/act1Dialogue.js` | — | WORKS |
| LanguageSystem | `phaser/systems/LanguageSystem.js` | 32 | WORKS (wired) |
| TrustSystem | `phaser/systems/TrustSystem.js` | 35 | WORKS (wired) |
| Act1RuntimeSystem (wires all) | `phaser/systems/Act1RuntimeSystem.js` | 420 | WORKS |

No Howler, no Web AudioContext SFX engine — music = plain `<Audio>`, voice =
`speechSynthesis`.

## What WORKS (runs in Act 1)
- **Browser TTS for all 13 dialogue nodes / 23 lines**, per-NPC rate/pitch/voice
  selection, science-text normalization (`Act1AudioSystem.js:148-221`,
  `SpeechNormalizationSystem.js`). Live-driven by `DialogueScene.js:59-61`.
- **Music: real file playback**, 6 states, **5 on-disk tracks** in
  `public/game/audio/music/` (e.g. `neighborhood_hybrid_ride.ogg`,
  `garage_warm_oud.ogg`), autoplay-unlock on first input, reduced-volume mode
  (`MusicSystem.js:71-81`).
- **NPCVoiceRegistry** — 7 profiles covering all 4 NPCs: **Zuzu** (default),
  **Mr. Chen** (`garage_mentor`, male en-US), **Mrs. Ramirez** (`neighbor` en-US
  + `spanish_neighbor` es-US), **Auntie Mariam** (`arabic_mentor`, lang `ar`),
  plus `ecology_sign`, `trader` (`NPCVoiceRegistry.js`).
- **TrustSystem + LanguageSystem fully wired** into dialogue effects + save/load
  (`Act1RuntimeSystem.js:123-132`). Spanish/Arabic dialogues grant trust.
- **Player controls:** R = replay voice, M = quiet/reduced-audio
  (`NeighborhoodScene.js:73,81-86`).
- **Audio acceptance hook** `window.BIKEBROWSER_AUDIO_AUDIT`
  (`Act1AudioSystem.js:53-78`) feeds the Brain audio score.

## What is DISABLED (present, off by flag/data)
- Speech skip-paths when `speechEnabled`/`autoSpeak` false (graceful, logged).
- `subtitleMode` setting exists (`:29`) but is **never read** — the dialogue
  panel always draws; the mode value is inert.

## What is MISSING (referenced but absent / no-op)
- **Interaction-cue SFX:** `playInteractionCue()` only *logs* cues; `INTERACTION_
  CUES` is metadata; `public/game/audio/sfx/` holds only `.gitkeep`. **Silent.**
- **Ambient audio:** `setAmbient()` only stores a string; `ambient/` empty. **Silent.**
- **Localized Spanish/Arabic voices:** requested by `spanish_neighbor` (es-US) and
  `arabic_mentor` (ar), but **fall back to English** when host OS lacks those
  voices (audit log: arabic→"Microsoft Mark - English"). Subtitles carry meaning.
- No neural/local TTS; no audio files for voice (all synthesized live).

## What was INTENDED (comments/data)
- Spanish + Arabic voice routing with subtitles (`NPCVoiceRegistry.js` accessibility
  notes); subtitle modes beyond always-on; an SFX/stinger system (empty
  `sfx/`/`stingers/` scaffolding + 2 unreferenced stinger files);
  Trust/Language `carryForward` metadata implies these scale into later acts.

## Audio acceptance dimension — REAL but instrumentation-based
The Brain audio score is **computed from the live audit-hook report**, not
hardcoded (`executive-brain/brain/act1_acceptance/runner.py:238-251`): baseline
20 → **65 if `hookVerified`**, +8 (≥2 music transitions), +7 (≥2 cues), +7 (voice
line fired), +5 (≥1 speech attempt), −10 errors, clamp [20,90]. **Caveat:** the
signal is *instrumentation event counts*, not *perceived sound* — silent
cues/ambient can still earn points, and a headless run with `musicTransitions:0,
speechAttempts:0` still earns the 65 hook baseline. So "audio PASS" today proves
the *pipeline is wired*, not that audio was *heard*. A real local-TTS pipeline +
the proposed acceptance checks (`voice_gap_analysis.md`) would close this gap.

## Reuse implication
Keep this spine. A local-TTS pre-bake should **feed cached audio files into
MusicSystem-style `<Audio>` playback keyed by NPCVoiceRegistry voiceIds**, with
SpeechNormalization applied before generation and the audit hook extended to
verify real audio. Nothing here needs rebuilding.
