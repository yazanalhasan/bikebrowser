# Authoritative Project State

Date: 2026-05-18
Project: BikeBrowser / BikeBrowserWorld
Canonical route: `/play`

## Current Truth

Act 1 is now a coherent, validated, player-facing Godot route built around warm embodied mechanical learning.

The authoritative Act 1 completion boundary is the nine-quest surfaced spine:

1. `bike_safety_check`
2. `flat_tire_repair`
3. `chain_repair`
4. `bridge_quest_5`
5. `desert_plant_observation`
6. `test_water_quality`
7. `copper_rock_id`
8. `workshop_first_build`
9. `act1_regional_readiness`

`/legacy-play` remains a contained Phaser fallback/tooling surface. `/play3d` remains outside Act 1 scope. Diagnostics remain opt-in.

## Complete

- Modal/dialogue input now blocks movement and world interactions.
- Act 1 station interactions consume input and avoid overlap cascades.
- HUD guidance tracks objective-level Act 1 progression.
- Side routes unlock after drivetrain readiness.
- Bridge review and Act 1 review are gated/labeled as later until ready.
- Domain stations use warmer, quest-specific visuals instead of generic markers.
- TireRig has sprite-backed repair props around the embodied rig.
- Mobile portrait framing is materially improved.
- Capstone validates prerequisites and rewards Systems Thinker, Regional Travel Sketchbook, and Spacecraft Clue Card.
- Build/export/tests are green.

## Deferred / Gated

Backend-loaded but non-blocking Act 1 content:

- `bridge_quest_1` through `bridge_quest_4`
- `bridge_material_test`
- `first_safety_check`
- `water_sample_observation`
- `algae_bloom_source`
- `track_the_animal`
- `mine_cart_repair`

These are future/optional scaffolding unless explicitly given complete player-facing loops.

## Remaining Weakness

The biggest remaining weakness is qualitative first-session comprehension: a real child still needs to prove that the opening safety flow and mechanic-eye interactions are understood without coaching, especially on touch/mobile.

## Validation

Final validation passed across Godot headless checks, build/export, Playwright `/play`, HUD/legacy smoke, browser playthrough smoke, Node mechanics tests, and `git diff --check`.

