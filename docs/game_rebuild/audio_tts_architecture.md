# Audio/TTS Architecture

Date: 2026-05-27

## Goals

The `/game-rebuild` audio layer supports warm Act 1 storytelling without becoming noisy or scene-hardcoded. Audio remains portable, data-driven, inspectable, and safe under browser autoplay limits.

## Dialogue Audio Pipeline

1. Dialogue data declares speaker, language, voice profile, emotional tone, and pacing hint.
2. `DialogueSystem` resolves the current dialogue line and returns audio metadata.
3. `DialogueScene` displays subtitles and asks the runtime audio system to speak the line.
4. `Act1AudioSystem` resolves the NPC voice profile, normalizes text, cancels any prior utterance, and uses Web Speech when available.
5. If Web Speech is unavailable or disabled, subtitles remain primary and the audio state records the reason.

## TTS Normalization Pipeline

`SpeechNormalizationSystem` runs before `SpeechSynthesisUtterance` creation:

- trims raw dialogue
- applies configurable phrase and symbol rules
- normalizes fractions, units, scientific terms, engineering terms, and measurements
- avoids rewriting ordinary emotional dialogue aggressively

## NPC Voice Registry

`NPCVoiceRegistry` maps speaker identity to voice profile:

- voice id
- speech rate
- pitch
- language routing
- emotional tone
- fallback strategy
- accessibility notes

Actual browser voices vary per machine, so voice distinction is simulated through rate, pitch, language, and profile metadata when exact named voices are unavailable.

## Music State System

`MusicSystem` owns logical music state and optional HTMLAudio playback. Required states:

- neighborhood exploration
- garage/workbench
- bridge/problem discovery
- UTM/testing
- chemistry/ecology exploration
- map unlock/wider world tease

Music should fade between states, remain low volume, and pause/resume with browser focus.

## Ambient Audio System

Ambient state is lightweight:

- neighborhood ambience
- garage ambience
- wash ambience
- desert wind
- subtle night/desert tones

If real ambient assets are unavailable, the system records the intended state and remains silent rather than producing distracting filler.

## Interaction Sounds

Interaction cues are restrained and semantic:

- notebook open/close
- material testing
- bridge confirmation/failure
- trust gain
- map unlock
- chemistry success
- ecology observation

They are routed through the audio system, not hardcoded inside quest data.

## Multilingual Routing

Supported foundation:

- English: `en-US`
- Spanish: `es-US`
- Arabic: `ar`

When localized browser voices are unavailable, the system still records the intended language and falls back to readable subtitle-first behavior.

## Browser Audio Lifecycle

- Audio starts locked.
- User interaction can call `unlockAudio()`.
- Web Speech may work before or after unlock depending on browser.
- Music/ambient playback waits for unlock.
- Visibility changes suspend/resume music.
- Dialogue advance cancels or replaces current speech to prevent overlap.

## Accessibility

Default design:

- subtitles always visible
- speech can be disabled
- reduced audio mode available
- replay current line available
- stop speech available
- audio state inspectable through `window.__GAME__.getAudioState()`

## Future Act 2/3 Scaling

The same pipeline can later support:

- regional mentor voice profiles
- richer multilingual phrase routing
- larger music map
- narration rules for simulation/creation systems
- saved accessibility preferences
- authored audio assets and voiceover if desired
