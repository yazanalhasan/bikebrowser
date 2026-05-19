# Act 1 Backend vs Player Path

Date: 2026-05-18
Owner: Story-Gating-Agent
Authority: `project_audit/act1_completion_task_list.md`
Scope: read-only audit of how backend Act 1 content maps to the player-facing route.

## Executive Finding

The player-facing Act 1 path is narrower than the loaded backend graph, and that is currently the correct shape.

The canonical playable path is the nine-quest spine in `QuestRegistry.ACT1_GUIDANCE_ORDER`:

1. `bike_safety_check`
2. `flat_tire_repair`
3. `chain_repair`
4. `bridge_quest_5`
5. `desert_plant_observation`
6. `test_water_quality`
7. `copper_rock_id`
8. `workshop_first_build`
9. `act1_regional_readiness`

The extra backend quests are useful scaffolding, but they should be treated as gated/deferred content until they have visible entry points, scene affordances, objective progression, NPC ownership, and reward surfacing.

## Current Player Path

| Order | Player-Facing Beat | Surface Evidence | Story Function |
| --- | --- | --- | --- |
| 1 | Mrs. Ramirez safety check | `NeighborhoodStreet.tscn` includes `MrsRamirezNpc` and `SafetyCheckStation`; `mrs_ramirez_intro.json` starts `bike_safety_check`. | Establishes neighborhood care, observation, and pre-ride responsibility. |
| 2 | Flat tire repair | `ZuzuGarage.tscn` instances `TireRepairStation`; garage layout includes wheel, tube, pump, and patch kit props. | Turns safety noticing into repair action. |
| 3 | Mr. Chen chain repair | `ZuzuGarage.tscn` includes `ChainHotspot` with embedded chain rig; side-region exits are locked behind `chain_repair`. | Mechanical anchor and road-readiness gate. |
| 4 | Bridge review / celebration | `NeighborhoodStreet.tscn` includes `BridgeReviewStation` bound to `bridge_quest_5`. | Condenses the bridge arc into structural understanding and neighborhood payoff. |
| 5 | Desert plant observation | `DesertTrail.tscn` includes `RangerNitaNpc` and `PlantObservationStation`. | Expands from mechanics into field observation. |
| 6 | Salt River water quality | `SaltRiver.tscn` includes `DrMayaNpc` and `WaterQualityStation`. | Builds evidence-chain thinking: collect, test, compare, report. |
| 7 | Copper evidence | `CopperMine.tscn` includes `OldMinerPeteNpc` and `CopperEvidenceStation`. | Links material evidence to conductivity and future making. |
| 8 | Workshop first build | `ZuzuGarage.tscn` includes workshop friends and `WorkshopBuildStation`. | Synthesizes raw material into a first useful part. |
| 9 | Regional readiness capstone | `NeighborhoodStreet.tscn` includes `Act1CapstoneStation`; `act1_regional_readiness.json` requires the eight prior quests and rewards the sketchbook/clue card. | Closes Act 1 by turning local lessons into wider-region questions. |

## Backend Content Not On The Critical Path

| Backend Content | Why It Is Not Currently Player Path | Gate / Defer Decision |
| --- | --- | --- |
| `bridge_quest_1` to `bridge_quest_4` | These missions describe assessment, material gathering, material testing, and construction, but the current scene surface provides a bridge review station rather than four complete bridge loops. | Gate. Keep backend loaded, but do not require for Act 1 completion. |
| `bridge_material_test` | Overlaps `bridge_quest_3` and implies a material-testing bench not currently used as the Act 1 bridge surface. | Defer or merge conceptually into bridge review/capstone. |
| `first_safety_check` | Duplicates `bike_safety_check` and would confuse the first-session promise. | Defer/deprecate. Keep `bike_safety_check` as the one surfaced safety start. |
| `water_sample_observation` | Overlaps the mandatory `test_water_quality` route but is less complete as an Act 1 synthesis beat. | Defer. Fold useful language into `test_water_quality` if needed. |
| `algae_bloom_source` | Adds upstream runoff investigation beyond the current Salt River evidence station. | Defer as later ecology side content. |
| `track_the_animal` | Adds wildlife tracking beyond current plant observation scope. | Defer as later ecology side content. |
| `mine_cart_repair` | Mine scene has a mine-cart prop, but the current Act 1 mine purpose is copper evidence, not cart repair. | Gate/defer. Avoid prompts that imply a required cart repair. |

## Dialogue And NPC Surfacing

The critical-path mentors are visibly present:

- Mrs. Ramirez: neighborhood safety mentor.
- Mr. Chen: chain, bridge, and capstone systems mentor.
- Ranger Nita: desert observation mentor.
- Dr. Maya: water-quality evidence mentor.
- Old Miner Pete: copper evidence mentor.
- Zevon, Jacob, Charlie, Cole, James: workshop friends present as a group in the garage.

The following are backend/flavor unless their scene presence becomes explicit:

- Shopkeeper, because the current only strong requirement is `bridge_quest_2`, which is gated.
- Mom, Abuela Rosa, Uncle Karim, and neighbor kid dialogue, unless they receive visible interaction paths.
- Individual workshop friend arcs beyond the group `workshop_first_build` station.

## Backend vs Player Risk

The largest story risk is not missing data. It is hidden breadth creating the impression that Act 1 is unfinished.

Specific risks:

- `bridge_quest_5` can feel like a late celebration for work the player did not perform if bridge context is not reinforced in the station, neighborhood dressing, or Mr. Chen dialogue.
- `first_safety_check` and `bike_safety_check` duplicate the same teaching promise; only one should be player-facing.
- Ecology and mine side quests can make the capstone look incomplete if validation/reporting treats every loaded backend mission as Act 1 debt.
- Badge data references bridge quests that are not the current critical path; audits should distinguish backend badge readiness from player-facing completion.

## Recommended Act 1 Gate

Use this as the Act 1 completion boundary:

- Required complete: the nine `ACT1_GUIDANCE_ORDER` quests.
- Required visible mentors: Mrs. Ramirez, Mr. Chen, Ranger Nita, Dr. Maya, Old Miner Pete, and the workshop-friend group.
- Required surfaced reward objects: Regional Travel Sketchbook and Spacecraft Clue Card.
- Explicitly non-blocking for Act 1: `bridge_quest_1`-`bridge_quest_4`, `bridge_material_test`, `first_safety_check`, `water_sample_observation`, `algae_bloom_source`, `track_the_animal`, and `mine_cart_repair`.

## Tiny Safe Patch Recommendation

No data/config patch is necessary from this audit pass.

The next safe implementation patch, if assigned to an implementation owner, would be documentation or validation labeling only: make Act 1 reports and tests refer to the nine-quest surfaced path as the player-facing completion gate, while labeling the remaining loaded missions as gated/deferred backend content.
