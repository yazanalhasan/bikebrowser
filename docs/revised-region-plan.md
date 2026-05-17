# Revised Region Plan

## Purpose

The Godot migration should organize the game around regions, not Phaser scene copies. A region is a gameplay place with identity, save state, unlock rules, domain systems, exits, NPCs, interactables, and companion hooks. A Godot scene is the implementation of one region state, not the product boundary.

## Region Registry Shape

Every region should have metadata with this shape:

```json
{
  "id": "garage",
  "title": "Zuzu's Garage",
  "world": "neighborhood_world",
  "scenePath": "res://Regions/Garage/ZuzuGarage.tscn",
  "domainTags": ["mechanics", "materials", "thermals"],
  "streamingGroup": "home_cluster",
  "saveSegment": "regions.garage",
  "defaultSpawn": "center",
  "spawns": {
    "center": { "layoutAnchor": "spawn_default" },
    "from_neighborhood": { "layoutAnchor": "spawn_from_street" }
  },
  "exits": [
    {
      "id": "to_neighborhood",
      "targetRegion": "neighborhood_street",
      "targetSpawn": "from_garage",
      "unlockRule": null
    }
  ],
  "unlockRules": [],
  "npcs": ["zuzu", "mr_chen"],
  "interactables": ["workbench", "bike_stand", "materials_lab_door"],
  "companionRoutes": ["/project-builder", "/build-planner"],
  "musicKey": "garage_warm_oud"
}
```

Layout anchors can come from converted `public/layouts/*.layout.json` data or Godot-authored marker nodes. The rule is the same: static layout belongs in data or scene resources, not procedural script literals.

## Region Layers

Use four levels:

1. **World:** broad container, such as Arizona Neighborhood.
2. **Region:** save/unlock unit, such as Garage or Dry Wash.
3. **Scene:** Godot `.tscn` implementation of the region.
4. **Zone:** local interaction area inside a scene.

Example:

```text
World: Arizona Neighborhood
  Region: Garage
    Scene: ZuzuGarage.tscn
      Zone: bike_stand
      Zone: workbench
      Zone: materials_lab_door
  Region: Neighborhood Street
    Scene: NeighborhoodStreet.tscn
      Zone: mr_chen_bike
      Zone: ramirez_bike
      Zone: garage_door
```

## Region Categories

### Home Cluster

Regions:

- Garage
- Neighborhood Street
- Materials Lab
- Thermal Lab
- Repair Academy
- Battery Workshop

Purpose:

- Core loop.
- First quests.
- Safe learning.
- Workbench access.
- Mission planning.
- Repair practice.

Godot responsibility:

- World traversal.
- NPCs.
- In-game labs.
- Repair mini-games.

React companion responsibility:

- Build planner.
- Project builder.
- Video lessons.
- Shopping/cart.
- Adult-gated battery planning.

### Neighborhood Cluster

Regions:

- Dog Park
- Lake Edge
- Sports Fields
- Community Pool
- Hidden neighborhood areas

Purpose:

- Early exploration.
- Ecology/science quests.
- Physics and materials puzzles.
- NPC routines and social discovery.

Unlock pattern:

- Reputation.
- Quest completion.
- Domain concepts discovered.
- NPC relationship state.

### Desert Cluster

Regions:

- Desert Trail
- Desert Foraging
- Dry Wash
- Copper Mine
- Mountain
- Hidden discovery areas

Purpose:

- Mining.
- Foraging.
- Materials engineering.
- Bridge construction.
- Ecology and survival learning.

Unlock pattern:

- World map discovery.
- Required gear.
- Quest state.
- Knowledge unlocks.

### River/Life Sciences Cluster

Regions:

- Salt River
- Living Basin
- Biology Zones
- Chemistry zones

Purpose:

- Biology systems.
- Fluid dynamics.
- Water/ecology interactions.
- Living systems simulations.

### Cognitive/Learning Cluster

Regions:

- Cognitive Puzzle Areas
- Learning Arcade
- Language practice spaces

Purpose:

- Optional challenge rooms.
- Cross-domain unlocks.
- Skill-building that feeds game progression.

React should still own the full education dashboards. Godot owns the in-world versions.

## Region Streaming Strategy

Start simple:

- One active region scene loaded at a time.
- Transition screen or fade between regions.
- Save on region exit.
- Restore at target spawn.

Later:

- Preload neighboring region packs.
- Keep small interior scenes cached.
- Stream large maps by chunk or subscene.
- Use world map as a fast-travel layer.

Do not design the first Godot slice around seamless open-world streaming. The content is more Quest-for-Glory local regions than continuous open world.

## Transition Contract

Every transition should pass:

```json
{
  "fromRegion": "garage",
  "toRegion": "neighborhood_street",
  "spawnId": "from_garage",
  "reason": "door",
  "preserveFacing": false,
  "saveBeforeTransition": true
}
```

Transition service responsibilities:

- validate target region exists
- check unlock rules
- save outgoing region state
- load target scene
- place player at spawn
- emit `region_entered`
- request companion sync if needed

## Region Save Segments

Each region owns only its local state:

```json
{
  "regions": {
    "garage": {
      "visited": true,
      "lastVisitedAt": "2026-05-12T00:00:00.000Z",
      "interactables": {
        "workbench": { "seen": true },
        "bike_stand": { "chainInspected": true }
      },
      "localFlags": {}
    },
    "neighborhood_street": {
      "visited": true,
      "npcsMet": ["mr_chen", "mrs_ramirez"],
      "hazardsSeen": ["extreme_heat"],
      "localFlags": {}
    }
  }
}
```

Global systems should not hide region-specific state inside unrelated quest flags.

## Initial Region Registry

The first Godot project should include these region registry entries, even if some are disabled:

| Region id | Initial status | Purpose |
| --- | --- | --- |
| `boot` | active | title/start flow |
| `garage` | active | home base and chain hotspot |
| `neighborhood_street` | active | Mr. Chen and first outdoor loop |
| `materials_lab` | registered disabled | future materials domain |
| `thermal_lab` | registered disabled | future thermals domain |
| `dry_wash` | registered disabled | future bridge quest |
| `copper_mine` | registered disabled | future mining/materials |
| `salt_river` | registered disabled | future biology/fluid systems |
| `world_map` | registered disabled | future navigation layer |

Registering disabled regions early proves the registry shape without creating full scenes.

## Current Phaser Reference Mapping

| Current Phaser scene | Godot region target | Migration note |
| --- | --- | --- |
| `ZuzuGarageScene` | `garage` | First home base region. |
| `StreetBlockScene` | `neighborhood_street` | First outdoor hub. |
| `OverworldScene` | `neighborhood_overworld` | Later map layer for neighborhood cluster. |
| `WorldMapScene` | `world_map` | Later macro travel and discovery layer. |
| `MaterialLabScene` | `materials_lab` | Domain lab region. |
| `ThermalRigScene` | `thermal_lab` | Domain lab region. |
| `DryWashScene` | `dry_wash` | Bridge/materials region. |
| `CopperMineScene` | `copper_mine` | Mining/materials region. |
| `SaltRiverScene` | `salt_river` | Biology/fluid region. |
| `DesertForagingScene` | `desert_foraging` | Ecology/foraging region. |
| `DogParkScene` | `dog_park` | Neighborhood ecology region. |
| `LakeEdgeScene` | `lake_edge` | Buoyancy/water science region. |
| `SportsFieldsScene` | `sports_fields` | Physics/materials region. |
| `CommunityPoolScene` | `community_pool` | Chemistry/water science region. |
| `DesertTrailScene` | `desert_trail` | Ecology/survival region. |
| `MountainScene` | `mountain` | Advanced materials/topology region. |
| `ExplainerScene` | `micro_interaction` | Replace with reusable mini-game/simulation overlay. |
| `CognitiveQuestScene` | `cognitive_area` | Replace with cognitive domain mini-game framework. |

## Region Unlock Rules

Unlock rules should be data-driven:

```json
{
  "all": [
    { "type": "reputation_at_least", "value": 20 },
    { "type": "quest_any_completed", "questIds": ["desert_healer", "food_chain_tracker"] }
  ],
  "hint": "Complete an ecology quest and earn 20 reputation."
}
```

Supported first rule types:

- `quest_completed`
- `quest_any_completed`
- `quest_active_or_completed`
- `reputation_at_least`
- `has_item`
- `has_tool`
- `knowledge_unlocked`
- `domain_level_at_least`
- `discovery_seen`

## NPC Placement and Schedules

NPCs should belong to regions but have schedules:

```json
{
  "npcId": "mr_chen",
  "defaultRegion": "neighborhood_street",
  "schedule": [
    { "timeBand": "morning", "region": "neighborhood_street", "anchor": "chen_driveway" },
    { "timeBand": "afternoon", "region": "materials_lab", "anchor": "test_bench" }
  ],
  "questGiverFor": ["chain_repair", "bridge_collapse", "food_chain_tracker"]
}
```

Do not implement full schedules in the first slice, but the registry should leave space for them.

## World Map Role

The world map should not be the first implementation. It should eventually:

- show discovered regions
- reveal hidden areas
- enforce unlock rules
- provide fast travel
- display active quest markers
- connect companion lesson routes
- show domain progress by region

The first slice can use direct door/edge transitions.

## Region Test Strategy

Every region should eventually have:

- boot smoke test
- nonblank render screenshot
- player spawn test
- exit validation test
- interactable registry test
- save segment test
- unlock-rule test
- companion bridge test when applicable

The first tests should cover:

- `garage` loads
- `neighborhood_street` loads
- transition garage -> neighborhood works
- Mr. Chen interaction starts `chain_repair`
- Phaser `/play` still boots
