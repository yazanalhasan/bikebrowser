# Soundscape Report

## Emotional Target

BikeBrowser should sound warm, safe, tactile, and handmade. The mix should support calm curiosity rather than push the player with loud arcade feedback.

## Neighborhood Soundscape

The neighborhood now layers:

- Existing neighborhood music.
- Soft procedural air.
- Low neighborhood hum.
- Very subtle cricket-like detail.

Intended feeling: dusk suburb, warm exploration, enough life to avoid dead silence.

## Garage Soundscape

The garage now layers:

- Existing garage workshop music.
- Gentle room tone.
- Faint fluorescent-style hum.
- Tiny tool and chain ticks.

Intended feeling: safe creative workshop, calm mechanical focus, not an industrial garage.

## Mechanical Interaction Palette

The current interaction palette is built from the existing stinger assets with cue-specific pitch, volume, and duration settings:

| Cue | Intended Feel |
| --- | --- |
| `chain_inspect` | Dull close contact |
| `pedal_rotate` | Soft rotational tick |
| `chain_align` | Careful metal adjustment |
| `chain_seat` | Satisfying mechanical settle |
| `wheel_spin_success` | Smooth repair confirmation |
| `brake_check` | Short squeeze/contact |
| `tire_press` | Muted pressure touch |
| `chain_roll` | Gentle drivetrain movement |
| `tube_slide` | Low rubber movement |
| `patch_press` | Small adhesive press |
| `pump_air` | Soft pump impulse |
| `dialogue_open` | Warm panel arrival |
| `dialogue_next` | Quiet page touch |
| `dialogue_close` | Soft panel rest |
| `transition_soft` | Spatial handoff cue |
| `soft_reward` | Small encouragement |
| `reward_chime` | Hopeful quest reward |

## Music Transition Tuning

Native music transitions now use:

- Region-specific target volumes.
- Longer fade-ins for emotionally important spaces.
- Sine easing.
- Deeper crossfade dips before a new region bed enters.

The goal is for entering the garage to feel like stepping into a different emotional room.

## Web Fallback Soundscape

The web audio runtime now:

- Keeps procedural region layers for neighborhood, garage, mine, desert, and river.
- Crossfades old layers instead of hard-stopping them.
- Uses lower master gain.
- Provides distinct cue envelopes for repair, dialogue, transition, and reward cues.

## Mix Notes

The mix keeps ambience below the music and interactions below reward sounds. No cue intentionally dominates dialogue/TTS.

Recommended listening order for manual QA:

1. Start in neighborhood and stand still for 30 seconds.
2. Enter garage and listen for fade shape and room-tone change.
3. Run all chain repair steps.
4. Run tire repair steps.
5. Run safety check steps.
6. Trigger dialogue and advance/close it.
7. Complete a reward moment.

## Validation Notes

Headless checks can catch missing scripts, missing files, and runtime validation errors. They cannot prove emotional mix quality. Final approval should include a real listening pass in the Godot editor or an exported build.

Automated checks completed:

- Runtime smoke test passed.
- Neighborhood and garage scene loads passed.
- RuntimeValidator reported 0 errors and 7/7 audio mappings in the checked launches.

Known non-audio caveat:

- `tests/vertical_slice_check.gd` still fails on existing reward-intent assertions for chain and tire quests. The audio pass did not modify quest or reward ownership.
