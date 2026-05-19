# Act 1 Art Asset Inventory

Date: 2026-05-18
Owner: Art-Polish-Agent
Scope: surfaced Act 1 visuals in Godot scenes, assets, and runtime screenshots. `/play` remains the canonical Godot surface. No Act 2 expansion reviewed or added.

## Evidence Reviewed

- Authoritative scope: `project_audit/act1_completion_task_list.md`
- Runtime screenshots: `project_audit/visual_runtime_screens/desktop__play.png`, `mobile__play.png`, `tablet__play.png`, `wide__play.png`
- Prior visual sweep: `project_audit/overnight_visual_ux_sweep.md`
- Godot scenes:
  - `BikeBrowserWorld/Regions/Neighborhood/NeighborhoodStreet.tscn`
  - `BikeBrowserWorld/Regions/Garage/ZuzuGarage.tscn`
  - `BikeBrowserWorld/Regions/Garage/TireRepairStation.tscn`
  - `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn`
  - `BikeBrowserWorld/Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn`
  - `BikeBrowserWorld/Regions/Desert/DesertTrail.tscn`
  - `BikeBrowserWorld/Regions/River/SaltRiver.tscn`
  - `BikeBrowserWorld/Regions/Mine/CopperMine.tscn`
  - Act 1 mentor NPC scenes under `BikeBrowserWorld/Regions/NPCs/`
- Resource integrity check: parsed `res://` references across `.tscn` and `.tres`; no missing referenced resources found.

## Surfaced Act 1 Visual Inventory

| Act 1 surface | Scene or asset evidence | Current art status | Notes |
| --- | --- | --- | --- |
| Neighborhood home route | `NeighborhoodStreet.tscn`; runtime `desktop__play.png` | Pass | Strongest visual surface. Uses high-detail house facades, road/sidewalk panels, character sprites, props, and safety bike art. |
| Mrs. Ramirez / safety check | `MrsRamirezNpc.tscn`; `Assets/Props/Bike/small_safety_check_bike*.png` | Pass | NPC is sprite-backed and bike has dedicated base plus brake/tire/chain overlays. No placeholder replacement needed. |
| Mr. Chen / chain arc | `MrChenNpc.tscn`; `ZuzuGarage.tscn`; `garage_repair_stand_bmx_*.png`; `ChainRigEmbedded.tscn` | Pass with note | Garage uses polished bike-on-stand assets. The embedded chain rig is geometric, but currently reads as a functional teaching diagram rather than broken placeholder art. |
| Flat tire repair | `TireRepairStation.tscn`; `TireRig.tscn`; `Assets/Props/Repair/*.png` | Improved | Tire rig had the clearest placeholder feel. Added existing inner tube, floor pump, and patch kit sprites as contextual Aseprite-style prop art while preserving scripted rig nodes. |
| Workshop first build | `ZuzuGarage.tscn`; lab/garage props | Needs targeted replacement | The station itself still relies on `StationMat`, `Beacon`, and labels. Needs a dedicated workshop build station sprite or compact bench vignette. |
| Ranger Nita / desert plant observation | `DesertTrail.tscn`; `RangerNitaNpc.tscn`; desert prop sprites | Pass with note | NPC and plants are sprite-backed. The interaction station is label/mat/beacon based and should get a field-notebook/binoculars station vignette for final polish. |
| Dr. Maya / water quality | `SaltRiver.tscn`; `DrMayaNpc.tscn`; SaltRiver prop sprites | Pass with note | River, dock, sampling kit, and cattails are sprite-backed. The station should eventually show a test-strip/tray work surface rather than generic mat/beacon. |
| Old Miner Pete / copper evidence | `CopperMine.tscn`; `OldMinerPeteNpc.tscn`; CopperMine prop sprites | Pass with note | Mine entrance, ore, cart, and Pete are sprite-backed. The station should eventually show conductivity-test hardware as an interactable visual cluster. |
| Bridge review / bridge celebration layer | `NeighborhoodStreet.tscn`; Act 1 task list references `bridge_quest_5` | Needs replacement | I did not find a dedicated surfaced bridge structure/celebration art asset in the inspected canonical Act 1 scenes. Current bridge learning appears to be UI/station surfaced, not a visually distinct neighborhood problem. |
| Act 1 capstone | `NeighborhoodStreet.tscn`; `QuestObjectiveStation.gd` station usage | Needs replacement | Capstone surfacing appears station-driven. Needs sketchbook and spacecraft clue card art surfaced in-scene or reward UI to avoid feeling like text-only progression. |

## Visual Quality Risks

| Risk | Severity | Exact replacement need |
| --- | --- | --- |
| Mobile portrait framing leaves large inactive lower margin in `/play` screenshots | Medium | Camera/layout pass for canonical Godot export; not an asset replacement. Prior CUDA metrics show active-pixel ratio around 0.35 on mobile. |
| Generic station visuals repeat across desert, river, mine, workshop, and capstone | Medium | Replace station mat/beacon/label clusters with domain-specific station sprites or small assembled prop vignettes. |
| Bridge arc lacks a strong dedicated visual anchor in inspected scenes | Medium | Add or surface an Act 1 bridge/triangle/neighbor-work visual in the existing neighborhood route without expanding Act 2. |
| Tire rig looked more schematic than surrounding polished art | Low after this pass | Context props added in `TireRig.tscn`; future pass could replace the procedural tire shape with a state-aware tire sprite if needed. |

