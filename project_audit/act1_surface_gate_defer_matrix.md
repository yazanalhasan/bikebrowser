# Act 1 Surface / Gate / Defer Matrix

Date: 2026-05-18
Owner: Story-Gating-Agent
Authority: `project_audit/act1_completion_task_list.md`
Scope: read-only audit and gating recommendations for Act 1 missions, dialogue, items, NPCs, and arc surfacing.

## Classification Key

- **Surface**: required for Act 1 completion and currently belongs on the guided player path.
- **Gate**: backend content may stay loaded, but should not appear as an Act 1 blocker unless a visible entry point, owner, objective path, and reward readback exist.
- **Defer**: keep as future/post-Act-1 content or flavor; do not count toward Act 1 completion.
- **Backend-only**: data exists for validation, inventory, dialogue, or future hooks, but the current player should not infer an unfinished obligation from it.

## Mission Matrix

| Content | Current Evidence | Classification | Act 1 Recommendation |
| --- | --- | --- | --- |
| `bike_safety_check` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; Mrs. Ramirez and `SafetyCheckStation` are present in `NeighborhoodStreet.tscn`; mission steps match task-list spine. | Surface | Keep mandatory. Continue polishing visible step acknowledgement and reward calmness. |
| `flat_tire_repair` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `TireRepairStation` is instanced in `ZuzuGarage.tscn`; garage layout surfaces wheel, tube, pump, and patch kit props. | Surface | Keep mandatory. Treat tire lever/patch/pump as surfaced through the rig, not as separate inventory obligations. |
| `chain_repair` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `ChainHotspot` and embedded chain rig exist in `ZuzuGarage.tscn`; side-region exits are locked behind `chain_repair`. | Surface | Keep mandatory and preserve as the Act 1 mechanical anchor. Do not dilute with extra chain side objectives. |
| `bridge_quest_5` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `BridgeReviewStation` in `NeighborhoodStreet.tscn` records all four authored objectives. | Surface, with compression risk | Keep mandatory as the current bridge surface. Add no Act 2 scope. If time permits, strengthen local context so the bridge does not feel like missing chapters. |
| `desert_plant_observation` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `RangerNitaNpc` and `PlantObservationStation` are in `DesertTrail.tscn`; station records all four mission objectives. | Surface | Keep mandatory. Ranger Nita needs a memorable guide moment, but no new quest chain is required. |
| `test_water_quality` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `DrMayaNpc` and `WaterQualityStation` are in `SaltRiver.tscn`; station records all five mission objectives. | Surface | Keep mandatory. Emphasize evidence chain: collect, test, compare, report. |
| `copper_rock_id` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `OldMinerPeteNpc` and `CopperEvidenceStation` are in `CopperMine.tscn`; station records all three mission objectives. | Surface | Keep mandatory. Pete should be treated as the mine evidence mentor, not a gateway to broader mine repair content. |
| `workshop_first_build` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `WorkshopBuildStation` in `ZuzuGarage.tscn` records all three mission objectives; Zevon/Jacob/Charlie/Cole/James scenes are instanced in the garage. | Surface | Keep mandatory. The workshop friends are surfaced as a group; individual deeper arcs should remain gated/deferred. |
| `act1_regional_readiness` | In `QuestRegistry.ACT1_GUIDANCE_ORDER`; `Act1CapstoneStation` in `NeighborhoodStreet.tscn`; prerequisites require the eight prior surface quests. | Surface | Keep mandatory capstone. This is the Act 1 completion gate and should remain the boundary before any Act 2 expansion. |
| `bridge_quest_1` | Backend mission only; no dedicated broken-bridge area/hotspots found in current surface. | Gate | Do not count as Act 1 complete blocker. Either fold its emotional context into `bridge_quest_5` copy/scene dressing or gate it for a future bridge expansion. |
| `bridge_quest_2` | Backend mission references Shopkeeper, planks, brackets, rope, and garage deposit path; no complete surfaced loop found. | Gate | Keep out of mandatory Act 1. If reactivated later, it needs Shopkeeper presence, pickups, inventory deposits, and visible material affordances. |
| `bridge_quest_3` | Backend mission references material testing rig and multiple material tests; badge data references it, but current Act 1 surface uses `bridge_quest_5`. | Gate | Do not surface as a hidden Act 1 requirement. Merge the concept into bridge review/capstone unless a material rig becomes playable. |
| `bridge_quest_4` | Backend mission and badge reference bridge build, but current surface only reviews completed bridge knowledge. | Gate | Keep as backend scaffold. Do not require it before `bridge_quest_5` in Act 1 unless the full construction interaction exists. |
| `bridge_material_test` | Standalone bridge-material mission overlaps `bridge_quest_3`; no current player-facing path found. | Defer | Treat as duplicate/future scaffold. Avoid presenting both `bridge_material_test` and `bridge_quest_3` as active Act 1 promises. |
| `first_safety_check` | Backend mission overlaps `bike_safety_check`; existing audit history flags orphan/duplication risk. | Defer | Do not count toward Act 1. Prefer deprecation or migration into `bike_safety_check`; keep one first safety quest in the player promise. |
| `water_sample_observation` | Backend mission overlaps `test_water_quality`; Dr. Maya is surfaced through the mandatory water station. | Defer | Keep out of Act 1 blocker set. Fold any useful observation language into `test_water_quality` rather than adding a second water intro. |
| `algae_bloom_source` | Backend ecology side quest with upstream/runoff scope beyond current Salt River station. | Defer | Good post-Act-1 or optional side content. Do not imply it is unfinished Act 1 critical path. |
| `track_the_animal` | Backend desert side quest with tracking/habitat scope beyond current plant observation station. | Defer | Keep for future ecology expansion. Act 1 only needs plant observation for the current capstone synthesis. |
| `mine_cart_repair` | Backend mine side quest; mine scene has a MineCart prop, but current player path surfaces only copper evidence. | Gate / Defer | Do not include in Act 1 completion. If left visible as a prop, avoid prompts implying repair is required. |

## NPC And Dialogue Matrix

| Character / Group | Current Evidence | Classification | Recommendation |
| --- | --- | --- | --- |
| Mrs. Ramirez | NPC scene in neighborhood; intro dialogue starts `bike_safety_check`; safety station nearby. | Surface | Keep as Act 1 emotional anchor and first safety mentor. |
| Mr. Chen | NPC scene in neighborhood; garage/chain route; bridge and capstone dialogue refs. | Surface | Keep as mechanical/bridge/synthesis anchor. |
| Ranger Nita | NPC scene in desert; intro/expanded dialogue files; plant station owner. | Surface | Give one visible identity beat in existing route; no extra ecology quest required. |
| Dr. Maya | NPC scene in river; intro/expanded dialogue files; water station owner. | Surface | Tie station result to her evidence/comparison voice. |
| Old Miner Pete | NPC scene in mine; intro/expanded dialogue files; copper evidence station owner. | Surface | Keep focused on copper evidence, not mine-cart expansion. |
| Zevon, Jacob, Charlie, Cole, James | NPC scenes instanced in garage; schedules and intro dialogue exist; workshop station refers to factory friends as a group. | Surface-light / Gate | Sufficient for Act 1 group presence. Gate individual crafting arcs until they have distinct player-facing utility. |
| Shopkeeper | Dialogue file exists; referenced by `bridge_quest_2`; no clear scene presence found in current critical path. | Gate | Do not require for Act 1. Only surface if bridge material gathering is explicitly reactivated. |
| Neighbors / neighbor kids | Neighbor dialogue exists; `bridge_quest_5` records `talk_to_neighbors` through station compression. | Surface-light | Accept compressed station handling for Act 1. Add optional ambient presence only if tiny and non-disruptive. |
| Mom, Abuela Rosa, Uncle Karim | Dialogue files exist; no current Act 1 critical station dependency found. | Defer / Flavor | Keep as flavor unless a visible scene interaction is added. Avoid dialogue that implies required unavailable errands. |

## Item And Station Matrix

| Content | Current Evidence | Classification | Recommendation |
| --- | --- | --- | --- |
| Core safety/repair objects: brakes, tires, chain, inner tube, patch kit, tire lever, air pump | Safety station, TireRig, ChainHotspot, garage props, and item registry all support the repair spine. | Surface | Keep as embodied station objects. Do not require separate inventory pickup unless the rig explicitly teaches it. |
| Secondary mechanic items: multi-tool, chain lube, brake pads, spoke, gear cable | Registered and some props exist, but not required by current objectives. | Backend-only / Defer | Keep as environmental texture or future repair content; not Act 1 blockers. |
| Bridge materials: wood plank, metal bracket/strip, rope/fiber, composite concepts | Backend bridge quests and items imply material gathering/testing, but current bridge surface is review-only. | Gate | Use only as capstone/bridge explanation unless bridge gathering/testing becomes fully playable. |
| Copper ore / conductivity evidence | `CopperEvidenceStation`, copper mission, and item registry align. | Surface | Keep as station evidence. No mine-cart repair dependency. |
| Water sample, macroinvertebrate, water test strip, pH chart | `WaterQualityStation`, water mission, and item registry align. | Surface | Keep as evidence chain. `algae_sample` remains deferred unless algae quest is surfaced. |
| Field guide, binoculars, magnifying glass, plant samples | Ranger Nita route and item registry support observation, but no distinct item loop is required. | Surface-light / Backend-only | Use as station flavor for Act 1; reserve deeper tool/inventory loops for later. |
| Regional Travel Sketchbook and Spacecraft Clue Card | Reward items in `act1_regional_readiness.json`; registered in `items.json`. | Surface | Keep as capstone reward and Act 1 boundary. They should tease wider systems, not launch Act 2. |

## Gating Verdict

Act 1 completion should be defined by the nine surfaced quests in `QuestRegistry.ACT1_GUIDANCE_ORDER`, ending at `act1_regional_readiness`.

The backend-loaded extra quests should not expand the Act 1 player promise. The safest gating stance is:

1. Keep `bridge_quest_1` through `bridge_quest_4` and `bridge_material_test` out of required Act 1 until bridge damage, material gathering, testing, and construction are real playable loops.
2. Treat `first_safety_check` as legacy overlap with `bike_safety_check`.
3. Treat `water_sample_observation`, `algae_bloom_source`, `track_the_animal`, and `mine_cart_repair` as future/optional content, not Act 1 debt.
4. Protect `/play` and the current Godot path as canonical; do not use hidden backend breadth as permission to open Act 2.
