# Act 1 Audio/TTS Polish Report

Date: 2026-05-27

## Summary

The `/game-rebuild` Act 1 experience now has a portable, data-driven audio/TTS substrate. Speech is routed through a normalization layer before browser TTS, NPCs have distinct voice profiles, dialogue lines carry voice/language metadata, and the runtime exposes debug/test hooks for speech, music, ambience, interaction cues, and accessibility settings.

This pass keeps audio out of scene-specific quest logic. Scenes only request dialogue or lightweight cues; the systems own normalization, voice routing, music state, and audio state inspection.

## Systems Added

- `src/game/phaser/audio/SpeechNormalizationSystem.js`
- `src/game/phaser/audio/NPCVoiceRegistry.js`
- `src/game/phaser/audio/MusicSystem.js`
- `src/game/phaser/audio/Act1AudioSystem.js`

Runtime integrations:

- `DialogueSystem` now returns voice, language, emotional tone, pacing, and speech-enabled metadata.
- `DialogueScene` auto-speaks dialogue lines through the registry audio system and stops speech when dialogue closes.
- `Act1RuntimeSystem` owns `Act1AudioSystem`, routes feedback kinds to restrained interaction cues, and exposes audio debug hooks on `window.__GAME__`.
- `NeighborhoodScene` initializes the neighborhood music/ambient state and plays notebook open/close cues.
- `DebugDiagnosticSystem` validates audio system availability, voice registry coverage, and speech normalization.

## Speech Normalization

Covered normalization includes:

- Fractions: `1/2`, `1/4`, `3/4`
- Math/symbols: `+`, `=`, mathematical `x`, `%`
- Units: `cm3`, `m2`, `deg`, `deg F`, `mg/dL`
- Science terms: `pH`, `DNA`, `RNA`, `CO2`, `H2O`
- Engineering terms: `UTM`
- Decimals in measurements, including `98.6 deg F`

The system supports contextual options for spelling chemical formulas and acronyms when future lessons need literal formula reading instead of conversational names.

## NPC Voice Mapping

Current voice profiles:

- Zuzu: bright, curious, grounded
- Mr. Chen: calm, slower mentor voice
- Mrs. Ramirez: warm neighbor voice
- Spanish-speaking Mrs. Ramirez context: Spanish-language routing profile
- Auntie Mariam: gentle Arabic-language mentor profile
- Desert Helper Sign / Bridge Sign / Map Gate: field-guide narration profile
- Local Trader: concise practical adult voice

Where browser voices are limited, distinction is simulated through rate, pitch, language tag, cadence, and metadata. Subtitles remain primary and always readable.

## Music, Ambient, And Interaction Audio

Music states are defined for:

- neighborhood exploration
- garage/workbench
- bridge/problem discovery
- UTM/testing
- chemistry/ecology exploration
- map unlock/wider-world tease

Ambient state is scaffolded for the neighborhood and future area-specific ambience. Interaction cues are intentionally restrained and currently logged for notebook, material test, bridge confirmation/error, trust gain, map unlock, chemistry success, and ecology observation.

## Accessibility

Implemented accessibility hooks:

- speech enable/disable
- auto-speak enable/disable
- reduced-audio mode
- subtitle mode setting
- speech-rate multiplier
- speech interrupt/stop support
- replay-last-speech hook
- audio state inspection via `window.__GAME__.getAudioState()`

Debug hooks:

- `window.__GAME__.speakLine(text, voiceId)`
- `window.__GAME__.stopSpeech()`
- `window.__GAME__.replaySpeech()`
- `window.__GAME__.unlockAudio()`
- `window.__GAME__.setAudioSettings(settings)`
- `window.__GAME__.transitionMusic(state)`
- `window.__GAME__.playInteractionCue(cueId)`
- `window.__GAME__.normalizeSpeech(text)`
- `window.__GAME__.getVoiceProfile(speakerOrVoiceId)`
- `window.__GAME__.getAudioState()`

## Tests Added

Added `tests/e2e/game-rebuild.audio.spec.js`.

Coverage:

- speech normalization for fractions, symbols, science terms, units, and UTM language
- distinct NPC voice profile routing
- dialogue speech pipeline and no chaotic overlap errors
- music/ambient/cue state tracking
- audio accessibility settings
- save/load speech safety
- audio-state screenshots

## Captures

Created:

- `playtest_captures/game_rebuild_audio/01_spanish_dialogue_tts.png`
- `playtest_captures/game_rebuild_audio/02_map_unlock_audio_state.png`

Audio itself was not recorded in this pass; the browser TTS substrate and audio states are validated through runtime hooks and Playwright assertions.

## Validation

Commands run:

```powershell
npm run build
npm run test:e2e -- game-rebuild.audio.spec.js
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js game-rebuild.audio.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_audio
```

Results:

- Build: passed
- Audio Playwright suite: 5 passed
- Full Act 1 regression suite with audio: 12 passed
- CUDA visual QA over audio captures: 2 images, 0 findings

## Remaining Limitations

- Browser Web Speech voices vary by platform, so voice identity is deterministic in routing/settings but not guaranteed to sound identical across machines.
- Music and interaction cues are architected and stateful, but this pass does not add final authored audio assets.
- No direct video/audio recording was added; future capture can use FFmpeg or browser media capture once final audio assets exist.
- Multilingual support is foundational. Spanish and Arabic routing exists, but deeper cultural/linguistic expansion still needs human-authored briefs.

## Act 2/3 Scaling Notes

The current architecture can scale by adding:

- more voice profiles in `NPCVoiceRegistry`
- localized dialogue metadata in Act data files
- authored music/ambient assets in `MusicSystem`
- accessibility presets for speech-heavy scenes
- validation for new scientific notation before spoken lessons ship

The key rule remains: dialogue data chooses voice/language intent, and audio systems decide how to render it.
