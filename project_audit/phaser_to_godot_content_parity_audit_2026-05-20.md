# Phaser to Godot Content Parity Audit

Date: 2026-05-20

## Executive Summary

The Godot version is the canonical final runtime and is already stronger than Phaser in the first-loop production layer: it has real pixel-art props, authored NPC scenes, a canonical region registry, unified HUD/notebook/reward/inventory services, and purpose-built Act 1 stations. Phaser, however, still contains a large amount of useful content design that has not been reincorporated into Godot.

The biggest gap is not the Copper Mine alone. It is systemic: Phaser has optional resource pickups, embedded quiz/challenge nodes, side-quest offers, and several explorable locations that either do not exist in Godot or exist only as a single Act 1 objective station.

Recommendation: do not port Phaser architecture wholesale. Port its content as data and small Godot interaction components that attach to the existing canonical systems.

## Source Inventories

### Phaser Playable Scene Registry

Source: `src/renderer/game/systems/sceneRegistry.js`

Registered Phaser scenes:

- `OverworldScene`
- `ZuzuGarageScene`
- `MaterialLabScene`
- `ThermalRigScene`
- `StreetBlockScene`
- `DogParkScene`
- `LakeEdgeScene`
- `SportsFieldsScene`
- `CommunityPoolScene`
- `DesertTrailScene`
- `MountainScene`
- `WorldMapScene`
- `DesertForagingScene`
- `CopperMineScene`
- `SaltRiverScene`
- `DryWashScene`

Other scene files exist for overlays/editor/runtime helpers: `CognitiveQuestScene`, `ExplainerScene`, `GarageScene`, `LayoutEditorOverlayScene`, `LabRigBase`, `BaseSubScene`, `LocalSceneBase`.

### Godot Canonical Region Registry

Source: `BikeBrowserWorld/Data/regions/regions.json`

Registered Godot regions:

- `boot`
- `neighborhood_street`
- `garage`
- `copper_mine`
- `desert_trail`
- `salt_river`
- `system_showcase`

## High-Level Parity

| Area | Phaser Status | Godot Status | Gap |
|---|---|---|---|
| Neighborhood/street | `StreetBlockScene`, `NeighborhoodScene`, `OverworldScene` | `NeighborhoodStreet.tscn` | Godot has absorbed and improved the main neighborhood; Phaser world/overworld structure is not canonical. |
| Garage | `ZuzuGarageScene`, `GarageScene`, lab exits | `ZuzuGarage.tscn`, repair stations, NPC workshop crew | Godot is richer visually and more canonical, but Phaser has lab entry concepts still missing. |
| Copper mine | Full sub-scene with resources, challenges, side quests | Region exists with one Act 1 quest station | Godot lacks Phaser's optional copper pickups, mine-safety math, structural side quest, and conductivity challenge variety. |
| Desert trail/foraging | `DesertTrailScene` and separate `DesertForagingScene` | `DesertTrail.tscn` with plant observation station | Godot has the Act 1 station, but lacks the resource-harvesting loop and optional survival/math side quests. |
| Salt River | Full sub-scene with resources, wildlife/channels, challenges, side quests | Region exists with water quality station | Godot lacks Phaser's resource pickups, river ecology side quest, flow/fraction challenges, and animated ecology details. |
| Dry Wash bridge site | Full bridge construction scene | Missions exist; no region in registry | High-value missing location. Phaser has the bridge build culmination that Godot currently lacks as a playable scene. |
| Mountain | Full scene | No Godot region | Missing. Useful mainly for later cave/mineral progression; overlaps with copper sample legacy issue. |
| Dog park | Full scene | No Godot region | Missing optional ecology/plant content. Some plant content can be folded into desert trail instead. |
| Lake edge | Full scene | No Godot region | Missing, but partly redundant with Salt River for water/shoreline ideas. |
| Sports fields | Full scene | No Godot region | Missing optional physics/social space. Lower priority for Act 1. |
| Community pool | Full scene | No Godot region | Missing optional water/chemistry space. Lower priority than Salt River. |
| Material lab | Full tensile/density lab scene | No dedicated Godot region | Important if bridge/material testing remains central. |
| Thermal lab | Full thermal expansion lab scene | No dedicated Godot region | Important for later material/thermal quests; not required for copper mine parity. |
| World map | `WorldMapScene` plus `worldMapData.js` | Region transitions directly from neighborhood | Godot lacks map UI/location selection. Direct diegetic exits may be better for final Act 1. |

## Copper Mine Detailed Comparison

### Godot Current

Files:

- `BikeBrowserWorld/Regions/Mine/CopperMine.tscn`
- `BikeBrowserWorld/Data/layouts/copper_mine.json`
- `BikeBrowserWorld/Data/missions/copper_rock_id.json`
- `BikeBrowserWorld/Systems/Interactions/QuestObjectiveStation.gd`

Current Godot mine content:

- Pixel-art mine entrance, ore chunks, mine cart.
- Old Miner Pete NPC instance.
- `CopperEvidenceStation` with `quest_id = "copper_rock_id"`.
- Objectives: `find_copper_rock`, `test_conductivity`, `report_to_pete`.
- HUD/notebook/reward integration through `QuestRegistry`, `RewardBridge`, `InventoryManager`.

### Phaser Extra Content Worth Using

Files:

- `src/renderer/game/scenes/CopperMineScene.js`
- `src/renderer/game/systems/sideQuestSystem.js`
- `public/layouts/copper-mine.layout.json`

Useful Phaser content not yet in Godot:

- Resource pickups:
  - `surface_copper`
  - `deep_copper`
  - `wire_spool`
- Optional side quests:
  - `collect_copper_samples`: collect surface/deep copper, answer conductivity question, reward refined copper/wire/knowledge.
  - `mine_stability_check`: inspect beam, calculate load percentage, reward safety helmet/structural knowledge.
- Embedded challenges:
  - Conductivity ratio: aluminum 37M vs copper 59M siemens/meter, about 0.6 or 63%.
  - Mine cart load: 200 kg capacity / 12.5 kg chunks = 16 chunks.
  - Shaft depth: distance = 5 * time^2, 2 seconds = 20 meters.
- Visual affordances:
  - Support beams.
  - Lanterns.
  - Rock walls/rubble.
  - Copper veins and sparkles.
  - Mine cart as collision/teaching prop, not only decoration.

### Copper Mine Recommendation

Add a reusable Godot `FieldResourcePickup` or `EvidencePickupStation` component and a small `ChallengeStation` component rather than hard-coding this only into `CopperMine.tscn`.

First mine additions:

- Make `OreA` grant/record `surface_copper` or `copper_ore`.
- Make `OreB` grant/record `deep_copper`.
- Add `WireSpool` using existing `Assets/Props/CopperMine/wire_spool.png`.
- Add `BeamInspectionStation` using `timber_support_beam.png` and the 90% load-capacity prompt.
- Add `ConductivityChallengeStation` using `conductivity_test_station.png`.
- Add mine lantern/support/rubble props from `Assets/Props/CopperMine`.

Godot already has better assets than Phaser here, so this is mostly interaction/data migration.

## Region-by-Region Missing Content

### Desert Trail / Desert Foraging

Godot current:

- `BikeBrowserWorld/Regions/Desert/DesertTrail.tscn`
- `desert_plant_observation` mission via `PlantObservationStation.gd`.
- Ranger Nita, barrel cactus, agave, mesquite, trail marker.

Phaser content to consider:

- From `DesertForagingScene.js`:
  - Resources: `yucca_fiber`, `agave_fiber`, `jojoba_extract`, `creosote_resin`, `cactus_water`.
  - Challenges: Water Math, Plant Ratio, Heat Math.
  - Side quests: `collect_desert_fibers`, `water_management_101`.
- From `DesertTrailScene.js`:
  - Scavenge spot with bottle caps/rusty gear/colorful stones.
  - Old crate with bolts/chain link.
  - Trail marker text for north/east/shortcut paths.
  - Branching path geometry and living desert details.

Recommendation:

- Fold the foraging resources into the existing Godot `desert_trail` region.
- Add optional gather nodes around the `PlantObservationStation`.
- Avoid creating a separate `desert_foraging` region until the trail feels full.

### Salt River

Godot current:

- `BikeBrowserWorld/Regions/River/SaltRiver.tscn`
- Dr. Maya NPC.
- `test_water_quality` via `WaterQualityStation.gd`.
- River water, dock boardwalk, water kit, cattails.

Phaser content to consider:

- Resources: `algae_sample`, `microbial_sample`, `river_minerals`, `reed_fiber`.
- Challenges:
  - Flow Rate: 120 liters/minute for 2.5 minutes = 300 liters.
  - Food Chain: 3 herons * 5 fish * 20 insects = 300 insects.
  - Irrigation Math: 900 liters/hour minus 1/3 and 1/4 = 375 liters/hour.
- Side quests:
  - `river_ecosystem_survey`
  - `balance_the_flow`
- Visual/environmental ideas:
  - Water ripples.
  - Drifting leaves/logs.
  - Fish/heron/frog movement.
  - Irrigation channel labels.

Recommendation:

- Add resource pickups and one or two animated ecology props first.
- Convert the flow/fraction prompts into `ChallengeStation` data.
- Keep Dr. Maya's main `test_water_quality` mission canonical; optional Phaser content should enrich, not replace it.

### Dry Wash / Bridge Build

Godot current:

- Bridge mission data exists: `bridge_quest_1` through `bridge_quest_5`, plus `bridge_material_test`.
- No `dry_wash` region in `regions.json`.
- No `Regions/DryWash` scene.

Phaser content to consider:

- `DryWashScene.js` has the strongest missing gameplay:
  - Broken bridge remnants.
  - Mr. Chen on-site.
  - Visit/build/post-build phases.
  - Bridge construction system with ghost beams.
  - Load-test bike animation.
  - Post-build persistent bridge.
  - Locked far-side trail indicator.

Recommendation:

- This is the highest-value Phaser-to-Godot migration after filling mine/river/desert micro-content.
- Add a Godot `dry_wash` region and connect it from `NeighborhoodStreet`.
- Start with a static broken bridge + review station; then port build/post-build state.

### Mountain

Godot current: no region.

Phaser content:

- Switchback mountain path.
- Cave entrance.
- Rare minerals / copper ore interaction.
- Summit view.
- Mountain spring.
- Legacy bridge fallback grants `copper_ore_sample` from mountain minerals.

Recommendation:

- Do not use Mountain as the primary copper source in Godot; Copper Mine is the right canonical location.
- Keep Mountain for later `mountain_range` expansion: cave, rare minerals, altitude/thermal/water content.
- If ported, use it as a late Act 1 or Act 2 exploration region.

### Dog Park

Godot current: no region.

Phaser content:

- Fenced park, benches, dogs, animated dogs.
- Plant interactions: ephedra, yerba mansa, creosote.
- Water bowl, tennis ball, lost collar hook.

Recommendation:

- Lower priority as a standalone region.
- Salvage plant interaction data into Desert Trail first.
- Dog park can become a neighborhood optional region later if social/ecology content is desired.

### Lake Edge

Godot current: no region.

Phaser content:

- Shoreline, water collision, dock, reeds, rocks, trees.
- Fishing spot, cave entrance, seashell.

Recommendation:

- Mostly redundant with Salt River for current Act 1.
- Salvage dock/fishing/seashell flavor if Salt River needs more inspectables.

### Sports Fields

Godot current: no region.

Phaser content:

- Soccer field and basketball court geometry.
- Soccer ball, race start, water fountain.

Recommendation:

- Low priority for final Godot Act 1 unless physics/sports content becomes a target pillar.

### Community Pool

Godot current: no region.

Phaser content:

- Pool deck, pool water collision, fence, chairs, lifeguard chair, slide.
- Pool rules, diving board, towel rack/sunscreen.

Recommendation:

- Low priority. Potential later water-safety/chemistry scene.
- Do not compete with Salt River until the river region is richer.

### Material Lab and Thermal Lab

Godot current:

- No dedicated Godot lab regions found.
- Garage has `workshop_first_build` and strong repair/workshop content.

Phaser content:

- `MaterialLabScene.js`: tensile testing, density slate, coupons, material reports.
- `ThermalRigScene.js`: thermal expansion simulation.

Recommendation:

- These are important if Godot keeps the bridge/material science arc.
- Port as compact garage-adjacent lab stations rather than separate regions at first:
  - `MaterialTestStation` for strength/density.
  - `ThermalExpansionStation` for later heat-failure content.

## Systemic Missing Pattern

Phaser had four reusable content primitives:

1. Location registry and unlock requirements.
2. Resource pickups.
3. Embedded challenge/quiz interactables.
4. Optional side quests offered by NPCs.

Godot currently has stronger versions of:

1. Region registry and transitions.
2. Quest registry.
3. Inventory manager.
4. Reward bridge.
5. HUD/notebook.
6. Specialized main quest stations.

Godot does not yet have obvious canonical equivalents for:

- Generic resource pickup station.
- Generic challenge/quiz station.
- Optional side-quest offer flow.
- Data-driven field inspectables.

That is why Copper Mine feels thin even though the scene exists. The content system that made the Phaser sub-scenes dense has not been fully rebuilt in Godot.

## Recommended Migration Order

### Phase 1: Reusable Godot Interaction Primitives

Build small, reusable components:

- `FieldResourcePickup.gd`
  - Exports `item_id`, `quantity`, `kind`, `display_name`, `description`, `one_shot`.
  - Calls `InventoryManager.add_item`.
  - Emits `EventBus.interaction_feedback`.
  - Can optionally record a quest objective.

- `ChallengeStation.gd`
  - Exports question, choices, correct index, explanation, reward payload, optional quest objective.
  - Reuses the existing dialog UI if possible.
  - Emits reward through `RewardBridge` or a lightweight challenge reward path.

- `OptionalQuestOfferStation.gd` or NPC-side option
  - Starts optional missions if Godot decides to keep side quests as regular JSON missions.

### Phase 2: Copper Mine Enrichment

Use existing Godot assets:

- `surface_copper_rocks.png`
- `deep_copper_ore.png`
- `wire_spool.png`
- `conductivity_test_station.png`
- `timber_support_beam.png`
- `lantern.png`
- `rock_sample_table.png`
- `mine_cart.png`

Add:

- Two copper resource pickups.
- One wire spool pickup.
- Conductivity challenge.
- Load-capacity challenge.
- Beam/stability inspectable.
- More mine prop density and collision where useful.

### Phase 3: Salt River and Desert Trail Enrichment

Salt River:

- Add algae/microbial/mineral/reed pickups.
- Add fish/heron/frog/water ripple movement.
- Add flow/food-chain/irrigation challenges.

Desert Trail:

- Add yucca/agave/jojoba/creosote/cactus-water pickups.
- Add water-management and plant-ratio challenges.
- Add scavenge spot and old crate inspectables.

### Phase 4: Missing High-Value Region

Add `dry_wash` to Godot:

- Static broken bridge first.
- Mr. Chen on-site.
- Bridge review/build station.
- Persisted built bridge state later.

### Phase 5: Later Optional Regions

Defer until Act 1 feels complete:

- Mountain.
- Dog Park.
- Lake Edge.
- Sports Fields.
- Community Pool.
- Dedicated Material/Thermal labs, unless bridge material testing needs them sooner.

## What Not To Port

- Do not port Phaser emoji/shape rendering; Godot assets are better.
- Do not duplicate Phaser save/quest/inventory architecture.
- Do not reintroduce `copper_ore_sample` as a mountain-only canonical source. Godot should make Copper Mine the source of copper evidence.
- Do not add all missing regions before enriching existing Godot regions; that would spread content thin again.

## Highest-Value Immediate Work

1. Add generic `FieldResourcePickup` and `ChallengeStation` in Godot.
2. Enrich Copper Mine using Phaser's copper resource/challenge/side-quest content.
3. Apply the same pattern to Salt River and Desert Trail.
4. Create a Godot Dry Wash region for the bridge arc.

This would solve the Copper Mine problem and the broader system-wide content gap with one reusable approach.
