# Registered Quest Reconciliation

Date: 2026-05-26

| Quest | Classification | Player-Facing Decision |
| --- | --- | --- |
| `act1_pre_ride_check` | Fully implemented critical path | Surface in Act 1 |
| `chain_repair` | Fully implemented embodied mechanic | Surface in Act 1 |
| `bridge_quest_5` | Condensed bridge review path | Surface as Act 1 bridge truth |
| `desert_plant_observation` | Partially implemented regional science | Surface as regional intro |
| `test_water_quality` | Partially implemented regional science | Surface as regional intro |
| `copper_rock_id` | Partially implemented regional science/materials | Surface as regional intro |
| `workshop_first_build` | Station-driven workshop synthesis | Surface as Act 1 synthesis |
| `act1_regional_readiness` | Capstone station/review | Surface after prerequisites |
| `bridge_quest_1` | Station-click legacy/mid-arc | Deferred; not required by Act 1 capstone |
| `bridge_quest_2` | Data-only | Marked `deferred_backend_only`; not required by Act 1 capstone |
| `bridge_quest_3` | Material-test station | Deferred/optional bridge material lane |
| `bridge_quest_4` | Station-click build chapter | Deferred; not required by Act 1 capstone |
| `bridge_material_test` | Duplicate/legacy | Deprecated |
| `first_safety_check` | Duplicate/legacy | Deprecated |
| `flat_tire_repair` | Duplicate/legacy | Deprecated; superseded by `act1_pre_ride_check` |
| `water_sample_observation` | Duplicate/legacy | Deprecated |
| `algae_bloom_source` | Side/optional station quest | Not Act 1 critical path |
| `balance_the_flow` | Side/optional river quest | Not Act 1 critical path |
| `river_ecosystem_survey` | Side/optional river quest | Not Act 1 critical path |
| `track_the_animal` | Side/optional desert quest | Not Act 1 critical path |
| `desert_foraging_samples` | Side/optional desert quest | Not Act 1 critical path |
| `desert_water_management` | Side/optional desert quest | Not Act 1 critical path |
| `copper_prospector` | Side/optional mine quest | Not Act 1 critical path |
| `mine_stability_check` | Side/optional mine quest | Not Act 1 critical path |
| `mine_cart_repair` | Side/optional mine quest | Not Act 1 critical path |

## Capstone Truth

`act1_regional_readiness` requires only the surfaced Act 1 truth path:

- `act1_pre_ride_check`
- `chain_repair`
- `bridge_quest_5`
- `desert_plant_observation`
- `test_water_quality`
- `copper_rock_id`
- `workshop_first_build`

This prevents unsurfaced bridge middle chapters from becoming hidden completion promises.
