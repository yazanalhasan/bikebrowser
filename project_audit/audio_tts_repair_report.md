# Audio/TTS Repair Report

Lane: Audio-TTS-Agent
Scope: Phase 2 audio/TTS reliability only. `/play` remains the canonical Godot route.

## Changes

- `BikeBrowserWorld/Core/AudioService/AudioService.gd`
  - Preserves the existing web unlock path and also hides the browser sound affordance when Godot unlocks audio.
  - Exposes lightweight browser audio runtime state for verification: `window.BikeBrowserAudioState.lastRegion`, `lastCue`, and `lastSpeechStatus`.
  - Logs web TTS requests through `EventBus.log_debug`.
  - Logs browser TTS unavailable/error fallback with clear `console.warn` messages instead of failing silently.

- `public/godot/BikeBrowserWorld/index.html`
  - Adds a calm, non-blocking `Tap or click once to enable sound.` prompt.
  - Keeps pointer/key gestures flowing to Godot while also attempting the browser audio unlock once the web audio runtime exists.

- `BikeBrowserWorld/Localization/TTSCoordinator.gd`
  - Delegates TTS requests to canonical `AudioService.speak`.
  - Keeps a clear warning if `AudioService` is unavailable.

- `BikeBrowserWorld/Data/audio/voice_profiles.json`
  - Adds `Miner Pete` alias for the existing Old Miner Pete profile.
  - Adds calm workshop-friend group profiles while preserving distinct individual workshop friend profiles for Zevon, Jacob, Charlie, Cole, and James.

- `BikeBrowserWorld/tests/audio_unlock_cue_playback_check.gd`
  - New regression covering blocked cue playback before unlock, successful explicit unlock, `audio_unlocked` signal emission, post-unlock cue recording, and region bed request state.

- `BikeBrowserWorld/tests/voice_identity_profile_check.gd`
  - Extends the voice identity gate to require distinct profiles for Mrs. Ramirez, Mr. Chen, Ranger Nita, Dr. Maya, Miner Pete, and workshop friends.

## Verification

- PASS: `godot --headless --path BikeBrowserWorld --script res://tests/audio_unlock_cue_playback_check.gd`
- PASS: `godot --headless --path BikeBrowserWorld --script res://tests/voice_identity_profile_check.gd`
- PASS: `godot --headless --path BikeBrowserWorld --script res://tests/voice_mix_balance_check.gd`
- PASS: `godot --headless --path BikeBrowserWorld --quit`
- PASS: `npx playwright test tests/e2e/godot-prototype.smoke.spec.js --project=chromium`

Known noise: the focused Godot headless tests still print the project’s existing ObjectDB/resource shutdown warnings after exit code 0.

## Notes

- No mechanic rigs, quest learning implementations, Act 2 content, or region expansion files were edited.
- Native Godot continues to use imported MP3 music/stingers and `DisplayServer` TTS when available.
- Browser/exported Godot continues to use procedural Web Audio beds/cues and `speechSynthesis` when available, with clear fallback logging when TTS is unavailable.
