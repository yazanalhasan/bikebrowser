# OpenClaw Phaser to Godot Master Audit

Date: 2026-05-20
Workspace: `C:\dev\bikebrowser`
Canonical runtime: `BikeBrowserWorld` Godot project
Reference runtime: Phaser/JS under `src/renderer/game` and `public/layouts`

Primary reference audit:
`project_audit/phaser_to_godot_content_parity_audit_2026-05-20.md`

## Phase 1 Status

Phase 1 inventory complete. Godot is the canonical runtime; Phaser is being used only as a content reference.

## Final Status After Phase 20

Phases 1-20 are complete. The Godot project now includes the high-value Act 1 Phaser-derived content for Copper Mine, Salt River, Desert Trail, and Dry Wash; the reusable interaction primitives are in place; backend bridge diagnostics are fixed; and the required audit/handoff files are updated.

Validation summary:

- 25 missions loaded.
- 8 Godot regions registered.
- 0 quest validation errors.
- 0 runtime validation errors.
- 0 missing scene quest/objective/reward item references in the backend consistency check.
- Godot route smoke test passed 2/2.
- Act 1 route captures loaded Neighborhood, Garage, Dry Wash, Desert Trail, Salt River, Copper Mine, and diagnostics with no browser page errors.

Residual risk: the project still needs a deterministic key/controller playthrough harness or final manual QA pass to prove every interactable objective can be completed continuously from a fresh save.

## Source Files Reviewed

- `src/renderer/game/systems/sceneRegistry.js`
- `src/renderer/game/systems/sideQuestSystem.js`
- `src/renderer/game/data/worldMapData.js`
- `src/renderer/game/scenes/*.js`
- `public/layouts/*.layout.json`
- `BikeBrowserWorld/Data/regions/regions.json`
- `BikeBrowserWorld/Data/missions/*.json`
- `BikeBrowserWorld/Regions/**/*.tscn`
- `BikeBrowserWorld/Systems/**/*.gd`
- `BikeBrowserWorld/Core/**/*.gd`

## Phaser Playable Inventory

| Phaser Scene | Content Type | Important Content Hooks | Godot Status | Phase Action |
|---|---|---|---|---|
| `OverworldScene` / `WorldMapScene` | World navigation | Arizona Desert locations, unlock requirements, travel labels | Godot uses diegetic transitions; no map UI | Review in Phase 15; keep diegetic flow unless Act 1 clarity requires a lightweight map |
| `StreetBlockScene` / `NeighborhoodScene` | Home street | Garage entry, neighbors, quest starters, street interactions | Absorbed into `NeighborhoodStreet.tscn` | Validate labels, gates, spawn points in Phase 15 |
| `ZuzuGarageScene` / `GarageScene` | Workshop hub | Repair stations, workbench, material/lab exits | Strong Godot garage exists | Phase 14 reviewed; existing Garage covers Act 1 workshop needs |
| `MaterialLabScene` | Lab rig | Tensile/density/material testing | No dedicated Godot region | Deferred in Phase 14 as later-act/deeper material science |
| `ThermalRigScene` | Lab rig | Thermal expansion rod tests | No dedicated Godot region | Deferred in Phase 14 as later-act/deeper material science |
| `CopperMineScene` | Regional material scene | surface copper, deep copper, wire spool, conductivity quiz, load challenge, stability beam | Phase 5 migrated content into Godot | Validate backend/UX in Phase 6 |
| `SaltRiverScene` | Regional ecology/water scene | algae, microbial sample, river minerals, flow-rate quiz, food-chain/irrigation flow | Phase 7 migrated content into Godot | Validate backend/UX in Phase 8 |
| `DesertTrailScene` / `DesertForagingScene` | Desert ecology/foraging | yucca, agave, jojoba, creosote, cactus water, water management, plant ratio, heat survival | Phase 9 merged content into `DesertTrail` | Validate backend/UX in Phase 10 |
| `DryWashScene` | Bridge site | broken bridge, build/review flow, bridge quest culmination | Phase 12 added Godot region and bridge stations | Validate backend/UX in Phase 13 |
| `DogParkScene` | Optional ecology | dog park/mud ecology interactions | Missing Godot region | Deferred in Phase 16; ecology folded into Desert/Salt River |
| `LakeEdgeScene` | Optional water edge | shoreline water science | Missing Godot region | Deferred in Phase 16; Salt River covers Act 1 water/ecology |
| `SportsFieldsScene` | Optional physics/social | field physics challenges | Missing Godot region | Deferred in Phase 16; not required for Act 1 |
| `CommunityPoolScene` | Optional water/chemistry | pool water content | Missing Godot region | Deferred in Phase 16; lower priority than Salt River |
| `MountainScene` | Optional mineral/cave | mountain minerals/exploration | Missing Godot region | Deferred in Phase 16; Copper Mine covers Act 1 material/geology |
| `CognitiveQuestScene` / `ExplainerScene` | Micro scenes | focused explainers and cognitive quest surfaces | Not canonical | Fold only useful content into Godot stations/dialogue |

## Phaser Side Quest and Challenge Inventory

| Phaser Hook | Location | Content | Godot Gap |
|---|---|---|---|
| `collect_desert_fibers` | Desert foraging | harvest yucca fiber, agave fiber, jojoba extract; reward `desert_fiber_bundle` | Missing pickups and optional reward wiring |
| `water_management_101` | Desert foraging | 2 liters / 250 ml per hour = 8 hours | Missing reusable quiz/challenge station |
| `collect_copper_samples` | Copper mine | collect surface/deep copper, conductivity question, reward refined ore and wire spool | Missing pickups, quiz, rewards |
| `mine_stability_check` | Copper mine | inspect beam, 450/500 kg = 90%, safety reward | Missing inspectable beam and challenge station |
| `river_ecosystem_survey` | Salt River | observe fish, collect algae, flow-rate question, organic/microbial rewards | Missing ecology pickups/quiz/rewards |
| `balance_the_flow` | Salt River | irrigation channel fractions, valve reward | Missing channel inspectable and fraction challenge |

## Godot Canonical Inventory

| Godot Region | Scene | Status | Known Phase 1 Gap |
|---|---|---|---|
| `boot` | `Regions/Boot/Boot.tscn` | Registered | Needs playability baseline only |
| `neighborhood_street` | `Regions/Neighborhood/NeighborhoodStreet.tscn` | Registered, strong Act 1 hub | Transition/label/gating validation pending |
| `garage` | `Regions/Garage/ZuzuGarage.tscn` | Registered, strong workshop hub | Lab parity review pending |
| `copper_mine` | `Regions/Mine/CopperMine.tscn` | Registered | Missing Phaser optional pickups/challenges |
| `desert_trail` | `Regions/Desert/DesertTrail.tscn` | Registered | Missing foraging/survival content |
| `salt_river` | `Regions/River/SaltRiver.tscn` | Registered | Missing ecology resource/challenge content |
| `system_showcase` | `Regions/SystemShowcase/SystemShowcase.tscn` | Registered demo region | Not Act 1 gameplay |
| `dry_wash` | Missing | Not registered | Required for bridge playability |

## Godot Mission Inventory

Godot has Act 1 mission data for bike safety/pre-ride, chain repair, flat tire repair, bridge quests 1-5, bridge material test, desert plant observation, Salt River water/algae missions, copper rock ID, workshop build, mine cart repair, and regional readiness. Phase 2 must verify which are actually playable through scene interactions instead of only present as JSON.

## System Inventory

Canonical systems found and expected to be reused:

- `RegionRegistry`
- `QuestRegistry`
- `InventoryManager`
- `RewardBridge`
- `EventBus`
- `HudController`
- `DialogController`
- `AudioService`
- `TransitionZone`
- `SaveService`
- `QuestObjectiveStation`
- `TireRepairStation`

## Initial Priority Order

1. Establish current Act 1 baseline and blockers.
2. Add reusable primitives for pickups, inspectables, and quiz/challenge stations.
3. Migrate content into existing Copper Mine, Salt River, and Desert Trail.
4. Add Dry Wash as the missing Act 1 bridge region.
5. Validate complete Act 1 state through backend registries, HUD, inventory, rewards, save/load, and frontend UX.
