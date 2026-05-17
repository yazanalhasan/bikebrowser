# Voice Identity Stabilization Plan

## Purpose

Live playtesting exposed a systemic emotional-audio issue: `AudioService` gives Mr. Chen a special TTS treatment and sends every other speaker through one generic fallback. This makes non-Mr. Chen NPCs acoustically collapse into the same identity.

This plan defines the smallest safe voice identity layer needed to make NPCs feel emotionally familiar without turning the game into a voice acting system.

## Current Findings

Current hardcoded logic:

- Native TTS: `AudioService._speak_native()` uses `speaker == "Mr. Chen"` to choose pitch and rate.
- Web TTS: the embedded `BikeBrowserAudio.speak()` uses `speaker === "Mr. Chen"` to choose pitch and rate.
- Everyone else receives the same fallback values.

Current NPC metadata:

- `BikeBrowserWorld/Data/npcs/` contains only `mr_chen.json`.
- Mrs. Ramirez and the other active NPCs do not have NPC profile files.
- Some dialogue files include per-line `voice` keys, but the current runtime TTS path does not use them as voice identity profiles.

Current active dialogue speakers:

- Mr. Chen
- Mrs. Ramirez
- Ranger Nita
- Dr. Maya
- Old Miner Pete
- Zevon
- Jacob
- Charlie
- Cole
- James

## Problem Classification

This is not a TTS engine failure, gameplay failure, dialogue architecture failure, or quest system failure.

Classification:

- Type: missing voice identity abstraction
- Severity: P3 emotional consistency issue
- Scope: systemic across all non-Mr. Chen NPCs
- Risk if ignored: NPC humanization feels visually present but acoustically generic
- Risk if overcorrected: voices become exaggerated, cartoonish, or distracting

## Minimal Implementation Shape

Add one small data-driven profile file:

`BikeBrowserWorld/Data/audio/voice_profiles.json`

The file should map normalized speaker names or NPC ids to restrained TTS settings:

- `pitch`
- `rate`
- optional `voiceHint`
- optional `tone`

`AudioService.speak(text, speaker)` should resolve a profile before speaking.

Native and web TTS should use the same pitch/rate profile values. If a browser or platform exposes voice selection later, `voiceHint` can guide selection without being required for correctness.

## Proposed Current Profiles

Keep differences subtle:

- Mr. Chen: lower, slower, thoughtful
- Mrs. Ramirez: warm, practical, lightly energetic
- Ranger Nita: calm outdoors energy
- Dr. Maya: measured and thoughtful
- Old Miner Pete: older, grounded, unhurried
- Zevon: warm, slightly curious
- Jacob: steady, practical
- Charlie: bright but not excitable
- Cole: calm, direct
- James: measured, workshop-focused

## What Must Not Change

Do not touch:

- `QuestRegistry`
- `RewardBridge`
- `EventBus`
- save systems
- dialogue architecture
- quest data
- scene layouts
- gameplay systems

Avoid:

- voice acting pipelines
- emotional state engines
- per-line performance systems
- large NPC database redesigns
- exaggerated pitch/rate shifts

## Minimal Fix Dispatch

Recommended implementation ownership:

- Lane 7 audio immersion: profile resolution and TTS pitch/rate mapping
- Lane 8 NPC humanization: review profile tone names only
- Lane 9 integration: validate restraint and whole-game coverage

Recommended file scope:

- Add `BikeBrowserWorld/Data/audio/voice_profiles.json`
- Update `BikeBrowserWorld/Core/AudioService/AudioService.gd` minimally
- Add one focused validation test under `BikeBrowserWorld/tests/`
- Update the live issue report after implementation

## Validation Strategy

Required validation:

- Mrs. Ramirez resolves to a different profile than Mr. Chen.
- Every current active dialogue speaker resolves to either a specific profile or the intentional fallback.
- Native and web TTS paths use the same profile values.
- Unknown speakers use a calm fallback, not an exaggerated default.
- Existing vertical slice validation still passes.
- Runtime repair smoke still passes.

Suggested focused test:

- `voice_identity_profile_check.gd`

Assertions:

- `AudioService` can load voice profiles.
- `resolve_voice_profile("Mrs. Ramirez") != resolve_voice_profile("Mr. Chen")`
- all current dialogue speakers resolve to a profile dictionary with numeric `pitch` and `rate`
- pitch and rate remain inside restrained bounds

## Merge Guidance

This is safe for a narrow integration pass after planning approval because it does not require architecture churn. It should remain blocked from broader audio expansion until the minimal profile layer is validated.

Merge readiness:

- Status: READY_FOR_NARROW_IMPLEMENTATION
- Merge risk: medium-low because `AudioService` is core audio infrastructure
- Emotional risk: medium if values are overdone
- Required constraint: no new audio spectacle, no per-line dramatization

## Success Criteria

The pass succeeds when:

- Mrs. Ramirez no longer sounds like the generic fallback.
- Non-Mr. Chen NPCs have subtle acoustic identities.
- Unknown future speakers remain calm and grounded.
- The voice system feels data-driven but tiny.
- The first 15 minutes feel warmer and more human without becoming busier.
