# Revised World Architecture

## Purpose

BikeBrowserWorld should not be designed as a direct Phaser scene port. The target is a scalable educational RPG and simulation platform: a child-facing world that can grow across regions, domains, labs, quests, discoveries, and companion React systems.

Phaser remains the reference runtime during migration. Godot becomes the long-term game runtime. React remains the parent shell for shopping, videos, OCR, educational dashboards, allowance ledger, build planning, compatibility intelligence, and adult-gated systems.

## Product Shape

The long-term game is closer to:

- Quest for Glory: skill-gated adventuring, dialogue, local scenes, puzzle solving.
- Pokemon: regions, collection, progression, world traversal, friendly domain mastery.
- Zelda: direct movement, interactable world objects, tool use, layered unlocks.
- Rune Factory: crafting, workshops, materials, learning loops, world systems.
- Animal Crossing: neighborhood warmth, NPC routines, daily visits, collections.
- Educational simulation RPG: each quest teaches a real STEM concept through play.

This means the architecture must support multiple play styles at once:

- Walk around and talk to NPCs.
- Repair bikes.
- Explore regions.
- Run lab simulations.
- Gather materials.
- Unlock knowledge.
- Solve cognitive and language challenges.
- Bridge out to React for videos, shopping, allowance, dashboards, and adult tools.

## Architectural Principles

1. **Game runtime belongs in Godot.** Movement, regions, NPCs, dialogue, in-game UI, quests, labs, and simulation play should live in Godot.
2. **Companion systems stay in React.** Anything involving real purchases, real allowance, OCR, video ranking, compatibility dashboards, adult gates, and dense forms stays in React.
3. **Phaser behavior is reference behavior.** Existing Phaser files are a map of working content and edge cases, not a target file structure.
4. **Data defines progression.** Regions, quests, domains, dialogue, discoveries, and rewards should be registered data, not scattered script conditionals.
5. **Domains are plugins.** Bike mechanics, ecology, biology, chemistry, thermals, materials, battery systems, cognitive, and language learning each own their own simulations and educational events.
6. **Saves are segmented.** Large future saves must be split by profile, world, region, quest, inventory, discovery, domains, and bridge state.
7. **Events are the contract.** Godot systems communicate through signals and typed events. React/Godot communication uses typed `postMessage` events.
8. **Migration must be reversible.** Phaser `/play` stays intact until Godot has feature parity and stable tests.
9. **Layouts remain data-aware.** Existing `public/layouts/*.layout.json` should guide Godot layout import or conversion. Static anchors should not be hard-coded in scripts.
10. **Web export is a first-class constraint.** Godot Web export requires WebAssembly and WebGL 2.0 support. Godot 4.6 documentation recommends single-threaded Web export by default to avoid SharedArrayBuffer and cross-origin isolation friction.

Source checked for Web export constraints: [Godot Exporting for the Web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html).

## Target Godot Project Layers

```text
BikeBrowserWorld/
  Core/
    EventBus
    SaveService
    RegionRegistry
    QuestRegistry
    DiscoveryService
    SimulationManager
    InventoryManager
    DialogueManager
    CompanionBridge
    ProfileService
    SettingsService
    DebugService

  Domains/
    Mechanics/
    Electrical/
    BatterySystems/
    Ecology/
    Biology/
    Chemistry/
    Thermals/
    Materials/
    Cognitive/
    Language/

  Regions/
    Garage/
    Neighborhood/
    Desert/
    Labs/
    River/
    Mountain/
    WorldMap/
    Hidden/

  Systems/
    Quest/
    Discovery/
    Rewards/
    Simulation/
    Interactions/
    World/
    UI/
    Audio/
    Input/

  Data/
    regions/
    missions/
    dialogue/
    domains/
    items/
    layouts/
    npcs/
    discoveries/
    simulations/
```

Godot file naming can be lower-case on disk if preferred, but the logical architecture should stay close to this division.

## Core Runtime Services

### EventBus

Central signal router for game events:

- `region_entered`
- `region_exited`
- `interaction_started`
- `quest_started`
- `quest_step_completed`
- `quest_completed`
- `discovery_unlocked`
- `domain_event_emitted`
- `simulation_started`
- `simulation_completed`
- `inventory_changed`
- `reward_intent`
- `save_requested`
- `companion_route_requested`

EventBus should not own game rules. It only routes signals and typed payloads.

### GameState or ProfileService

Owns the active runtime snapshot:

- active profile id
- active save slot
- current region id
- current spawn id
- active quest ids
- current UI mode
- companion shell state

This service should read from `SaveService`, not directly from browser localStorage.

### SaveService

Owns segmented save reads/writes. During early migration it uses:

```text
bikebrowser_godot_test_save
```

It must not mutate:

```text
bikebrowser_game_save
```

until an explicit migration phase.

Segmented save sections:

```json
{
  "schemaVersion": 1,
  "profile": {},
  "world": {},
  "regions": {},
  "quests": {},
  "inventory": {},
  "discoveries": {},
  "domains": {},
  "simulations": {},
  "rewards": {},
  "bridge": {},
  "settings": {},
  "debug": {}
}
```

### RegionRegistry

Owns all region metadata:

- region id
- display name
- domain tags
- scene path
- parent world
- entry spawns
- exits
- unlock rules
- streaming group
- save segment id
- music key
- companion route hooks

This replaces direct thinking around Phaser scene keys.

### QuestRegistry

Owns quest/mission templates and runtime state:

- quest id
- title
- domain tags
- region requirements
- NPC giver
- steps
- objective type
- educational concepts
- prerequisites
- completion conditions
- reward plan
- companion needs

Godot should preserve current quest IDs where possible, including `chain_repair`, `flat_tire_repair`, `bridge_collapse`, and the biology/materials quests.

### DiscoveryService

Owns world discovery:

- visited regions
- revealed world nodes
- fog tiles
- discovered concepts
- discovered species/materials/items
- hidden area unlocks
- quest-triggered reveals

This is where the current Phaser `discoverySystem.js`, `discoveryBridge.js`, and `discoveryUnlocks.js` concepts should land.

### SimulationManager

Dispatches domain-specific simulations:

- material strength test
- thermal expansion test
- tire repair explainer
- derailleur alignment
- bridge stability
- ecology observation
- biology construct planning
- battery safety simulation
- cognitive puzzle
- language challenge

Each simulation domain stays isolated. SimulationManager only manages lifecycle, save events, and completion signals.

### InventoryManager

Owns items, tools, materials, equipment, quantities, and unlockable workbench recipes. It should separate:

- physical tools
- bike parts
- raw materials
- crafted items
- samples
- knowledge-only items
- quest flags

### DialogueManager

Owns dialogue sessions:

- speaker
- dialogue tree
- active node
- choices
- voice metadata
- quest triggers
- domain concept callouts
- companion route buttons

Dialogue should be data-driven. Scripts should not hard-code all dialogue lines.

### CompanionBridge

Godot-to-React bridge using typed messages:

Godot -> React:

- `quest_started`
- `quest_completed`
- `reward_intent`
- `save_requested`
- `open_companion_route`
- `debug_log`
- `video_lesson_requested`
- `adult_gate_requested`

React -> Godot:

- `hydrate_save`
- `settings_update`
- `reward_balance`
- `companion_result`
- `video_quiz_result`
- `adult_gate_result`

The bridge is the boundary between playful in-game learning and real-world systems.

## Region and Scene Model

Godot should use regions, not raw scenes, as the gameplay abstraction.

```text
World
  Region
    Scene
      Local Zones
        Interactables
        NPCs
        Domain Simulations
```

Example:

```text
World: Arizona Neighborhood
  Region: Garage
    Scenes: ZuzuGarage, MaterialsLab, ThermalLab
  Region: Neighborhood
    Scenes: StreetBlock, DogPark, LakeEdge, SportsFields
  Region: Desert
    Scenes: DesertTrail, DesertForaging, CopperMine, DryWash
  Region: River
    Scenes: SaltRiver
```

The region is saved and unlocked. The scene is loaded. The zone is where interaction happens.

## Domain Plugin Model

Each domain should expose the same interface:

```text
DomainModule
  id
  display_name
  concepts
  quest_templates
  interaction_types
  simulation_types
  item_types
  discovery_types
  reward_rules
  companion_routes
```

This lets a quest combine domains without coupling them.

Example:

`bridge_collapse` can touch:

- Mechanics: bike crossing problem.
- Materials: strength-to-weight.
- Ecology: mesquite wood.
- Mining: copper sample.
- Thermals later: heat effects on materials.

The quest should coordinate domain events; it should not own each simulation internally.

## In-Game UI Boundaries

Godot should own:

- title screen
- pause screen
- quest HUD
- dialogue boxes
- inventory/game items
- local map
- interaction prompts
- mini-game UI
- reward popups
- discovery notifications

React should own:

- site shell and route navigation
- allowance ledger
- video search/watch
- project builder/build planner
- shopping/cart
- compatibility intelligence
- adult gates
- OCR dashboards
- long-form educational dashboards

## Web Export Architecture

Godot Web export should be embedded by React during migration:

```text
React route /godot-prototype
  iframe or hosted container
    Godot Web export
      postMessage bridge
```

Early export settings:

- prefer single-threaded Web export
- avoid C# for Web build
- design for WebAssembly and WebGL 2.0
- avoid requiring cross-origin isolation in the first pass
- use `index.html` for the exported entry
- test from Vite/local server, not `file://`

## Migration Architecture Decision

The first build remains a vertical slice, but the architecture should be scaled from day one:

- Create registries now, even if they only contain `Garage`, `Neighborhood`, and `chain_repair`.
- Create domain module stubs now, even if only Mechanics is active.
- Create segmented save now, even if most segments are empty.
- Create bridge schemas now, even if only `quest_started` and `reward_intent` are emitted.
- Keep Phaser as reference and fallback.

This keeps the first slice small without baking in small-game assumptions.

## Non-Goals For The First Implementation Pass

- Do not migrate all 21 quests.
- Do not replace `/play`.
- Do not write to `bikebrowser_game_save`.
- Do not rebuild shopping, video search, OCR, or allowance inside Godot.
- Do not build multiplayer yet.
- Do not build the full world map yet.
- Do not implement every domain simulation yet.
- Do not copy Phaser classes line-by-line into GDScript.

## First Vertical Slice Under This Architecture

The first Godot slice should instantiate the long-term architecture with tiny content:

- Regions: `garage`, `neighborhood`
- Domain: `mechanics`
- Quest: `chain_repair`
- NPC: `mr_chen`
- Simulation placeholder: `chain_hotspot_inspection`
- Save key: `bikebrowser_godot_test_save`
- Bridge events: `quest_started`, `reward_intent`, `save_requested`, `debug_log`

That slice is not the final game, but it proves the architecture.
