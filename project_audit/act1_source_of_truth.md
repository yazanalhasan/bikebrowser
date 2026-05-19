# Act 1 Source Of Truth

Date: 2026-05-18
Workspace: `C:\dev\bikebrowser`
Authority: `project_audit/act1_completion_task_list.md`

## Act 1 Completion Boundary

Act 1 completion is the nine-quest surfaced spine defined by `QuestRegistry.ACT1_GUIDANCE_ORDER`:

1. `bike_safety_check`
2. `flat_tire_repair`
3. `chain_repair`
4. `bridge_quest_5`
5. `desert_plant_observation`
6. `test_water_quality`
7. `copper_rock_id`
8. `workshop_first_build`
9. `act1_regional_readiness`

This is the player-facing definition of complete Act 1. The runtime may load broader backend content, but those quests are not Act 1 blockers unless they receive clear scene entry, NPC ownership, objective progression, reward surfacing, and validation coverage.

## Runtime Shape

Current baseline runtime validation reports:

- 19 loaded missions.
- 25 dialogue files.
- 7 regions.
- 7/7 audio mappings.
- 56 registered items from `BikeBrowserWorld/Data/items/items.json`.

Godot headless validation is green. The known ObjectDB/resource cleanup warnings still print after successful exits and are not currently blocking Act 1 completion.

## Canonical Arc

The intended Act 1 experience is:

1. Neighborhood arrival and Mrs. Ramirez safety introduction.
2. Brake/safety check around the neighborhood bike.
3. Tire repair in the garage.
4. Mr. Chen handoff and chain repair.
5. Bridge/material systems introduction through the bridge review.
6. Regional science/material excursions: desert plants, Salt River water, copper evidence.
7. Workshop synthesis/build with the garage friend group.
8. Act 1 readiness review.
9. Regional Travel Sketchbook and Spacecraft Clue Card reward.

The emotional and learning identity is warm embodied mechanical learning: tactile repair, visible force transfer, mechanic-eye interaction, calm pacing, neighborhood warmth, systems understanding, and engineering curiosity.

## Surfaced Characters

Required surfaced mentors:

- Mrs. Ramirez: safety and tire-care neighborhood anchor.
- Mr. Chen: chain repair, mechanical causality, bridge/systems synthesis.
- Ranger Nita: desert plant observation.
- Dr. Maya: Salt River evidence and water-quality testing.
- Old Miner Pete / Miner Pete: copper evidence and conductivity.
- Zevon, Jacob, Charlie, Cole, James: garage workshop friend group for first build.

Surface-light or flavor-only until explicitly wired:

- Shopkeeper.
- Neighbors / neighbor kids.
- Mom.
- Abuela Rosa.
- Uncle Karim.

## Surfaced Stations And Routes

Canonical surfaced stations:

- `SafetyCheckStation` / safety check bike in the neighborhood.
- `TireRepairStation` / TireRig in the garage.
- `ChainHotspot` / ChainRig in the garage.
- `BridgeReviewStation` in the neighborhood.
- `PlantObservationStation` in the desert.
- `WaterQualityStation` at Salt River.
- `CopperEvidenceStation` in the mine.
- `WorkshopBuildStation` in the garage.
- `Act1CapstoneStation` in the neighborhood.

Canonical route exits:

- Neighborhood to garage.
- Neighborhood to desert, mine, and river after drivetrain readiness.
- Return paths back to the neighborhood/garage loop.

## Surfaced Rewards

The Act 1 boundary reward is `act1_regional_readiness`:

- Badge: Systems Thinker.
- Items: Regional Travel Sketchbook and Spacecraft Clue Card.

These rewards should land as curiosity and readiness, not as Act 2 launch or lore overload.

## Gated Or Deferred Backend Content

Loaded but not player-facing blockers:

- `bridge_quest_1`
- `bridge_quest_2`
- `bridge_quest_3`
- `bridge_quest_4`
- `bridge_material_test`
- `first_safety_check`
- `water_sample_observation`
- `algae_bloom_source`
- `track_the_animal`
- `mine_cart_repair`

These should be gated, deferred, or folded into current surfaced stations until each has a complete player-facing loop. They should not appear as hidden obligations in HUD guidance, capstone requirements, playtest instructions, or Act 1 completion reporting.

## Validation Source Of Truth

Required baseline gates:

- `npm run build`
- Godot boot / RuntimeValidator.
- `runtime_repair_smoke.gd`
- `vertical_slice_check.gd`
- `brake_rig_state_check.gd`
- `chain_rig_state_check.gd`
- `tire_rig_state_check.gd`
- `chain_hotspot_embodied_check.gd`
- `interaction_overlap_check.gd`
- `act1_player_path_check.gd`
- Playwright `/play` smoke.
- Playwright `/legacy-play` smoke.
- `tools/export-godot-web.ps1`.

Act 1 is not complete just because these pass. They are the minimum safety net for continued critical-path, art, UX, telemetry, and playtest-readiness work.

