# Audio/TTS Baseline Report

Date: 2026-05-27

## Current Audio Architecture

The committed `/game-rebuild` Act 1 route currently creates a standalone Phaser game under `src/game/`. Phaser audio is disabled in `src/game/phaser/createGame.js` with `audio: { noAudio: true }`.

The older `/legacy-play` Phaser/React game has a mature audio stack:

- `src/renderer/game/audio/AudioManager.js`
- `src/renderer/game/audio/audioManifest.js`
- `src/renderer/game/audio/useGameAudio.js`
- `src/renderer/game/services/npcSpeech.js`
- `src/renderer/game/systems/languageCoachAssistant.js`

That stack is React-container-oriented and not directly wired into `/game-rebuild`.

## Current TTS Flow

`/game-rebuild` currently has no TTS flow. Dialogue appears visually in `DialogueScene`, backed by `DialogueSystem`, but no speech synthesis, voice profile, speech normalization, or replay controls exist yet.

The legacy `npcSpeech.js` uses the browser Web Speech API and already demonstrates:

- cached browser voice list
- cancel-on-change behavior
- gender/character voice hints
- basic unit normalization

## Current Music Handling

`/game-rebuild` has no active music system. Existing audio assets under `public/game/audio/` include neighborhood, garage, quest, hybrid, and stinger tracks that can be referenced by a future or local Web Audio/HTMLAudio layer.

## Current NPC Voice Handling

`/game-rebuild` dialogue entries currently store:

- `id`
- `speaker`
- `lines`
- objective/notebook/inventory/trust effects
- optional `language`

They do not yet store `voiceId`, speech settings, emotional tone, language tag, or pacing hint.

## Current Normalization Gaps

No `/game-rebuild` speech normalization exists. Required gaps:

- fractions such as `1/2`, `1/4`, `3/4`
- math symbols such as `+`, `-`, `=`, `%`
- units such as `cm3`, `m2`, `deg`, `mg/dL`
- scientific terms such as `pH`, `DNA`, `RNA`, `CO2`, `H2O`
- engineering terms such as `UTM`
- decimal and temperature phrasing

## Browser Audio Issues

Browser audio and Web Speech may require a user gesture before audible playback. `/game-rebuild` needs an explicit unlock/lifecycle model and must degrade safely if speech synthesis or audio playback is unavailable.

## Accessibility Gaps

Current gaps:

- no speech toggle
- no reduced-audio mode
- no replay current dialogue line
- no speech interrupt API
- no audio state inspection
- no voice identity registry
- no subtitle/audio linkage

## Validation Baseline

Commands run:

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js
```

Results:

- Build passed.
- Relevant Playwright tests passed, 2 tests.

## Expected Touched Files

- `docs/game_rebuild/audio_tts_baseline_report.md`
- `docs/game_rebuild/audio_tts_architecture.md`
- `docs/game_rebuild/audio_tts_polish_report.md`
- `src/game/phaser/audio/*`
- `src/game/data/act1/act1Dialogue.js`
- `src/game/phaser/systems/DialogueSystem.js`
- `src/game/phaser/systems/Act1RuntimeSystem.js`
- `src/game/phaser/scenes/DialogueScene.js`
- `src/game/phaser/scenes/NeighborhoodScene.js`
- `tests/e2e/game-rebuild.audio.spec.js`
- `playtest_captures/game_rebuild_audio/*`
