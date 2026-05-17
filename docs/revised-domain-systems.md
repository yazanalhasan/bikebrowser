# Revised Domain Systems

## Purpose

BikeBrowserWorld should be built as a modular educational universe. Each learning area should be a domain module that can power quests, regions, simulations, items, dialogue, discoveries, and companion React routes without becoming tangled with unrelated systems.

The current Phaser game already points this way: mechanics, ecology, biology, chemistry, materials, thermals, cognitive training, language, mining, foraging, and engineering systems all exist or are strongly represented.

## Domain Module Contract

Each domain should expose:

```json
{
  "id": "materials",
  "title": "Materials Science",
  "concepts": [],
  "questTemplates": [],
  "simulationTypes": [],
  "interactionTypes": [],
  "itemTypes": [],
  "discoveryTypes": [],
  "rewardRules": [],
  "regionTags": [],
  "companionRoutes": [],
  "saveSegment": "domains.materials"
}
```

Godot implementation should use a small base interface:

```text
DomainModule
  register(registries)
  hydrate(saveSegment)
  emit_domain_event(event)
  handle_quest_event(event)
  build_simulation(simulationId, payload)
  serialize()
```

The implementation can be GDScript classes/resources. The key is that each domain owns its content and simulation logic.

## Core Domain List

### Bike Mechanics

Current references:

- `flat_tire_repair`
- `chain_repair`
- `bikeParts.js`
- `items.js`
- garage/workbench interactions
- flat tire explainer

Godot responsibilities:

- tire repair mini-game
- chain/derailleur inspection
- tool use
- bike stand interactions
- repair academy practice loops

React companion responsibilities:

- video lessons
- project builder
- build planner
- shopping/cart
- compatibility intelligence

First implementation:

- `chain_repair`
- Mr. Chen dialogue
- chain hotspot inspection
- reward-intent event

### Electrical Engineering

Current references:

- `ebikeSystem.js`
- `ebikeParts.js`
- `systemGraph.js`
- controller and motor concepts inside quests/product direction

Godot responsibilities:

- circuit puzzle interactions
- wire tracing
- fuse logic
- motor/controller diagnosis simulations

React companion responsibilities:

- detailed part research
- adult-gated purchasing
- technical diagrams when too dense for game UI

### Battery Systems

Current references:

- `batterySystem.js`
- `batteryChemistry.js`
- `batteryParts.js`
- product direction for Battery Workshop

Godot responsibilities:

- conceptual simulations only
- pack layout visualization as learning diagram
- safety-first puzzles
- BMS "referee" model

React companion responsibilities:

- adult gate
- build planning
- safety checklist
- parts research
- no child-facing physical build CTA

Safety rule:

Godot must not instruct children to open, weld, charge, discharge, repair, or assemble lithium packs. Godot can teach concepts and emit `adult_gate_requested` for any physical planning.

### Ecology

Current references:

- `ecologyEngine.js`
- `ecology/*`
- `ecology.js`
- `flora.js`
- `fauna.js`
- `foragingSystem.js`
- ecology quests
- `public/assets/ecology/*`

Godot responsibilities:

- observe species
- forage safely
- discover food webs
- region ecology state
- ecology event ticks where useful

React companion responsibilities:

- long-form dashboards or reports
- external reference videos

### Biology

Current references:

- `biologySystem.js`
- `biology/*`
- `geneticEngineering.js`
- biology quests such as `extract_dna`, `engineer_bacteria`, and `bio_battery_integration`

Godot responsibilities:

- kid-safe biology simulations
- sample collection as game mechanic
- lab interaction loops
- biology quest surfaces

React companion responsibilities:

- detailed reading
- safety/adult review where needed

### Chemistry

Current references:

- `chemistrySystem.js`
- plant chemistry/effects
- surfactant/coating quests
- pool/water science concepts

Godot responsibilities:

- simple mixing puzzles
- observation-based chemistry effects
- surfactant and coating simulations

React companion responsibilities:

- dense references
- safety explanations

### Materials Science

Current references:

- `materialEngine.js`
- `materials/*`
- `materials.js`
- `MaterialLabScene.js`
- `bridgeBlueprint.js`
- `bridgeMaterialScoring.js`
- density slate/scale/calipers
- `bridge_collapse`

Godot responsibilities:

- density measurement
- strength tests
- bridge material selection
- dry wash bridge build/test
- material notebook

React companion responsibilities:

- deeper charts if needed
- build planner tie-ins

### Thermodynamics

Current references:

- `ThermalRigScene.js`
- `thermalRigEngine.js`
- `thermalRigDatabase.js`
- `heat_failure`

Godot responsibilities:

- thermal expansion lab
- heat danger feedback
- material failure demonstrations

React companion responsibilities:

- video lessons
- long-form explanation cards

### Cognitive Training

Current references:

- `CognitiveQuestScene.js`
- `cognitiveQuestSystem.js`
- `cognitive/*`
- `arizonaCognitiveQuests.js`
- cognitive profile save fields

Godot responsibilities:

- in-world puzzle rooms
- quest-gated cognitive checks
- visual/spatial/logic challenges

React companion responsibilities:

- learning dashboards
- parent progress view

### Language Learning

Current references:

- `languages.js`
- `languageQuests.js`
- `npcLanguageSystem.js`
- `audioLanguageSystem.js`
- `languageCoachAssistant.js`
- `phraseBuilder.js`

Godot responsibilities:

- NPC phrase practice
- trust/rank effects
- simple dialogue choices
- world signs and region language moments

React companion responsibilities:

- detailed practice panels
- speech/OCR-heavy workflows

## Cross-Domain Events

All domains should emit normalized educational events:

```json
{
  "type": "domain_event",
  "domain": "materials",
  "eventId": "density_measured",
  "conceptId": "density",
  "regionId": "materials_lab",
  "questId": "bridge_collapse",
  "payload": {
    "materialId": "mesquite_wood",
    "value": 0.83,
    "unit": "g/cm3"
  },
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

QuestRegistry, DiscoveryService, RewardBridge, and React companion systems can subscribe to these events.

## Domain Save Segments

Each domain saves only its own persistent state:

```json
{
  "domains": {
    "materials": {
      "measuredMaterials": {},
      "completedTests": [],
      "knownConcepts": []
    },
    "ecology": {
      "observedSpecies": [],
      "foragedItems": {},
      "foodWebDiscoveries": []
    },
    "cognitive": {
      "solvedPuzzles": [],
      "profile": {
        "patternSkill": 0.5,
        "spatialSkill": 0.5,
        "logicSkill": 0.5
      }
    }
  }
}
```

This prevents future save bloat from becoming a single unstructured object.

## Domain-to-Quest Relationship

Quests coordinate domain events. Domains do not own full narrative quests.

Example:

```text
Quest: bridge_collapse
  Requires:
    materials.density_measured
    materials.strength_test_completed
    ecology.mesquite_observed
    inventory.has_item(copper_ore_sample)
  Emits:
    discovery.bridge_site_revealed
    reward_intent
```

This allows future quests to reuse the same simulations.

## Domain-to-Region Relationship

Regions host domain systems:

| Region | Primary domains | Secondary domains |
| --- | --- | --- |
| Garage | mechanics | materials, thermals, battery |
| Neighborhood Street | mechanics | ecology, language |
| Materials Lab | materials | mechanics |
| Thermal Lab | thermals | materials |
| Dry Wash | materials | mechanics, ecology |
| Copper Mine | materials | electrical, mining |
| Salt River | biology | chemistry, ecology |
| Desert Trail | ecology | language, survival |
| Battery Workshop | battery systems | electrical, safety |
| Learning Arcade | cognitive | language, math |

## Companion React Bridge By Domain

Domains can ask React for help:

```json
{
  "type": "open_companion_route",
  "domain": "mechanics",
  "route": "/youtube/search",
  "reason": "learn_before_repair",
  "query": "rear derailleur indexing kid friendly tutorial"
}
```

Allowed companion actions:

- open video lesson
- show adult-gated planning panel
- show allowance ledger
- show project builder
- show build planner
- show safe search results
- request OCR/trainer dashboard

Godot should not directly call shopping APIs or mutate real allowance. It requests companion actions.

## Simulation Isolation

Each simulation should be reusable:

```text
Simulation
  id
  domain
  input_schema
  output_schema
  scene_path
  completion_events
  save_fragment
```

Example:

```json
{
  "id": "chain_hotspot_inspection",
  "domain": "mechanics",
  "scenePath": "res://Domains/Mechanics/Simulations/ChainInspection.tscn",
  "completionEvents": ["mechanics.chain_inspected"],
  "rewardPreview": { "zuzubucks": 5, "badge": "Chain Detective" }
}
```

The first implementation can be tiny, but it should use this pattern.

## Reward Rules

Domains emit reward intents. RewardBridge decides what leaves the game:

In-game reward:

- Zuzubucks
- badges
- tools
- region unlocks
- knowledge concepts

React real allowance:

- only after bridge validation
- only through ledger service
- idempotent event id
- parent-visible metadata

Reward event:

```json
{
  "type": "reward_intent",
  "source": "godot",
  "domain": "mechanics",
  "questId": "chain_repair",
  "amount": 1.0,
  "currency": "allowance_usd",
  "label": "Chain repair mission",
  "idempotencyKey": "godot:chain_repair:complete:v1"
}
```

## First Domain Implementation Order

1. Mechanics
   - chain repair
   - flat tire
   - garage tools
2. Materials
   - density and strength tests
   - bridge collapse
3. Thermals
   - thermal rig
   - heat failure
4. Ecology
   - observation and foraging
5. Biology/Chemistry
   - living basin, infection, surfactants
6. Cognitive/Language
   - reusable puzzle and dialogue challenge framework
7. Battery/Electrical
   - conceptual safe labs and adult bridge

## Anti-Patterns To Avoid

- A single `QuestManager.gd` that knows every domain rule.
- A single `GameState.gd` with every field dumped into one dictionary.
- Simulations that directly award money.
- Region scenes that hard-code quest logic.
- Dialogue scripts that hard-code all dialogue lines.
- Godot directly opening shopping or purchase flows.
- Rebuilding React dashboards inside Godot.
- Treating domain systems as one-off mini-games.

## First Slice Domain Scope

Only Mechanics is active in the first Godot slice:

- Domain: `mechanics`
- Region: `garage`, `neighborhood_street`
- NPC: `mr_chen`
- Quest: `chain_repair`
- Simulation: `chain_hotspot_inspection`
- Events: `mechanics.chain_problem_seen`, `mechanics.chain_inspected`

All other domains should be registered as empty stubs or documented placeholders, not implemented yet.
