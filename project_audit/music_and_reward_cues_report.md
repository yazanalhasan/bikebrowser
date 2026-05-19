# Music and Reward Cues Report

Date: 2026-05-19
Status: COMPLETE

## Summary

Music playback now uses authored tracks in the web `/play` build instead of the previous quiet procedural music oscillator bed. The authored MP3 tracks were converted to Ogg Vorbis for reliable browser playback, imported into Godot, and published beside the web export so `window.BikeBrowserAudio` can stream them through HTML audio after user gesture unlock.

Reward cues are wired through a new canonical `AccomplishmentBus` so Act 1 accomplishment events flow system-wide into `AudioService` and HUD micro-feedback.

## Music Fix

Authoritative region mapping in `BikeBrowserWorld/Core/AudioService/AudioService.gd` now points to Ogg tracks:

- `boot` -> `title_screen.ogg`
- `neighborhood_street` -> `neighborhood_street.ogg`
- `garage` -> `garage_workshop.ogg`
- `copper_mine` -> `copper_mine.ogg`
- `desert_trail` -> `dry_wash_bridge.ogg`
- `salt_river` -> `salt_river.ogg`
- `system_showcase` -> `title_screen.ogg`

The web runtime now:

- waits for first user gesture before playback;
- streams authored `.ogg` tracks via `new Audio(...)`;
- persists through scene changes in the `AudioService` autoload;
- crossfades when the requested track changes;
- exposes inspectable state: `currentTrackUrl`, `musicPlaying`, `oscillatorFallbackDisabled`;
- warns instead of silently re-engaging a procedural music fallback.

Music mix targets remain in the -14 dB to -11 dB range while reward cue SFX tiers play around -6 dB to -4 dB, keeping music roughly 8-10 dB under SFX.

## Reward Cue Fix

Imported supplied cue assets:

- `BikeBrowserWorld/Assets/Audio/Cues/reward_tiny.ogg`
- `BikeBrowserWorld/Assets/Audio/Cues/reward_small.ogg`
- `BikeBrowserWorld/Assets/Audio/Cues/reward_medium.ogg`
- `BikeBrowserWorld/Assets/Audio/Cues/reward_large.ogg`

Tier mapping:

- `reward_tiny` -> objective tick
- `reward_small` -> item, notebook entry, recipe learned, discovery/evidence
- `reward_medium` -> quest completed
- `reward_large` -> Act 1 capstone milestone

`AccomplishmentBus` listens to canonical events:

- `quest_step_completed`
- `quest_completed`
- `inventory_updated`
- `notebook_updated`
- `recipe_feedback`
- `game_event(recipe_learned)`
- `game_event(discovery_unlocked)`

Concrete Act 1 data currently covers 107 accomplishment opportunities from 83 quest objectives, 19 quest completions, 2 reward item grants, and 3 recipe learns, plus dynamic discovery/notebook events as they occur.

Duplicate keys are debounced before sound/HUD feedback. Notebook updates immediately caused by objective and quest completion events are suppressed briefly so the objective tick and quest completion cue do not double-fire.

## Visual Feedback

`HudController` now listens to `accomplishment_feedback` and shows a small fading glyph chip near the HUD:

- objective/check style for tiny objective ticks;
- notebook/recipe style for notebook or recipe updates;
- plus glyph for item additions;
- star glyph for capstone tier.

This is intentionally calm and does not add score popups.

## Validation

Passed:

- `godot_console.exe --headless --path BikeBrowserWorld --script tests/music_reward_cues_check.gd`
- `godot_console.exe --headless --path BikeBrowserWorld --script tests/audio_unlock_cue_playback_check.gd`
- `godot_console.exe --headless --path BikeBrowserWorld --quit`
- `npm run build`
- fresh Godot web export: `Web Single Threaded`
- copied fresh export into `public/godot/BikeBrowserWorld`
- Playwright `/play` music smoke:
  - 6 authored music URLs return `200 audio/ogg`;
  - 4 cue URLs return `200 audio/ogg`;
  - first gesture unlocks audio;
  - `currentTrackUrl` is `/godot/BikeBrowserWorld/Assets/Audio/Music/neighborhood_street.ogg`;
  - browser audio element is unpaused;
  - `currentTime` advances;
  - `oscillatorFallbackDisabled` is true;
  - no authored music/cue playback errors.
- Playwright cue smoke:
  - `reward_tiny` plays through `BikeBrowserAudio.cue(...)`;
  - no cue fallback or playback errors.

Godot headless still reports the project-existing ObjectDB/resource cleanup warnings at process exit, but exits 0 and runtime validation reports 0 errors.

## Files Modified

- `BikeBrowserWorld/Core/AudioService/AudioService.gd`
- `BikeBrowserWorld/Core/EventBus/EventBus.gd`
- `BikeBrowserWorld/Core/AccomplishmentBus/AccomplishmentBus.gd`
- `BikeBrowserWorld/Systems/UI/HudController.gd`
- `BikeBrowserWorld/project.godot`
- `BikeBrowserWorld/tests/music_reward_cues_check.gd`
- `BikeBrowserWorld/Assets/Audio/Cues/*`
- `BikeBrowserWorld/Assets/Audio/Music/*.ogg`
- `public/godot/BikeBrowserWorld/*`
- `public/godot/BikeBrowserWorld/Assets/Audio/*`
