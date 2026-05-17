# Long-Term Godot Roadmap

## Goal

Build the entire BikeBrowser game portion in Godot as a scalable modular RPG/simulation platform, while React remains the parent shell for companion systems.

The migration must preserve the working Phaser game until Godot reaches feature parity. Phaser is not deleted early. It becomes reference behavior and fallback.

## Current Baseline

Current game runtime:

- Phaser 3 in React through `/play`.
- `GameContainer.jsx` owns React/Phaser bridge and HUD.
- `saveSystem.js` writes `bikebrowser_game_save`.
- `questSystem.js` completes 21 shipped quests.
- Scene registry includes garage, street, overworld, labs, local regions, world map, and sub-scenes.
- Playwright playthrough suite currently passes.

Current companion systems:

- video search/watch/ranking
- project builder
- build planner
- shopping/cart
- spelling trainer
- learning progress
- allowance direction
- compatibility intelligence

## Migration Strategy

Use four tracks in parallel, but only one should change runtime behavior at a time:

1. **Architecture/docs track**
   - Define long-term architecture.
   - Create region/domain/save/bridge specs.
   - Keep scope honest.

2. **Godot prototype track**
   - Build isolated `BikeBrowserWorld/`.
   - Use `bikebrowser_godot_test_save`.
   - Add `/godot-prototype`.
   - Do not replace `/play`.

3. **Compatibility track**
   - Preserve Phaser tests.
   - Add Godot smoke tests.
   - Add bridge schema tests.
   - Add save isolation tests.

4. **Content migration track**
   - Migrate one quest/domain at a time.
   - Use existing Phaser data as source.
   - Convert assets gradually.

## Phase 0: Architecture Reset

Status: this phase.

Deliverables:

- `docs/revised-world-architecture.md`
- `docs/revised-region-plan.md`
- `docs/revised-domain-systems.md`
- `docs/long-term-godot-roadmap.md`

Success criteria:

- Team agrees Godot architecture is a modular RPG/simulation engine.
- First implementation scope stays small.
- Long-term architecture does not trap the project as a mini-game.

## Phase 1: Godot Foundation Project

Create:

```text
BikeBrowserWorld/
  project.godot
  Core/
  Domains/
  Regions/
  Systems/
  Data/
  assets/
  docs/
  exports/
```

Minimum systems:

- EventBus
- SaveService
- RegionRegistry
- QuestRegistry
- DiscoveryService stub
- InventoryManager stub
- DialogueManager
- CompanionBridge
- RewardBridge

Minimum content:

- Boot/title screen
- Garage region
- Neighborhood street region
- Zuzu movement
- Mr. Chen
- `chain_repair`
- chain hotspot inspection

React:

- Add `/godot-prototype`.
- Embed Godot Web export.
- Listen for `quest_started` and `reward_intent`.
- Validate event schema.

Tests:

- bridge schema tests
- save isolation test
- Godot iframe nonblank smoke
- Mr. Chen interaction smoke if export can run
- Phaser regression smoke

Success criteria:

- Godot project exists and runs.
- Zuzu moves.
- Mr. Chen starts `chain_repair`.
- Godot emits reward intent.
- React receives event.
- Phaser `/play` still works.

## Phase 2: Mechanics Domain Parity

Migrate early bike repair gameplay:

- `chain_repair`
- `flat_tire_repair`
- tire explainer
- basic tool inventory
- garage workbench interactions
- repair reward flow

Add:

- Mechanics domain module
- repair simulation framework
- reusable quest step UI
- quiz/dialogue choice framework
- basic badge/reward presentation

Tests:

- Godot chain quest player-path test
- Godot flat tire player-path test
- reward intent idempotency test
- save/continue test
- Phaser flat tire regression remains

Exit criteria:

- Godot can replace the visible beginning player repair loop.
- Phaser still available.

## Phase 3: Region and World Traversal

Migrate:

- neighborhood cluster
- region transitions
- unlock rules
- world map prototype
- discovery/fog prototype
- local region save segments

Regions:

- Garage
- Neighborhood Street
- Dog Park
- Lake Edge
- Sports Fields
- Community Pool
- World Map shell

Tests:

- region registry test
- unlock rule test
- travel path smoke
- nonblank screenshots per active region
- save restore by region/spawn

Exit criteria:

- Godot has credible world traversal.
- RegionRegistry replaces Phaser scene-key thinking.

## Phase 4: Materials and Thermals

Migrate:

- Materials Lab
- Thermal Lab
- density measurement
- strength testing
- thermal expansion
- material knowledge state
- `bridge_collapse` foundation
- `heat_failure`
- `perfect_composite`

Add:

- Materials domain
- Thermals domain
- SimulationManager concrete lifecycle
- material notebook UI
- lab save segments

Tests:

- density simulation test
- material test save segment
- bridge quest step validation
- thermal simulation smoke

Exit criteria:

- Godot can host reusable STEM labs, not just walk-and-talk quests.

## Phase 5: Desert, Mining, and Bridge Arc

Migrate:

- Dry Wash
- Copper Mine
- Desert Trail
- Desert Foraging
- mining
- foraging
- bridge build/test
- material collection loops

Add:

- DiscoveryService full version
- Mining subsystem
- Foraging subsystem
- world map reveal rules
- bridge construction mini-game

Tests:

- `bridge_collapse` Godot player-path smoke
- copper soft-lock prevention test
- discovery reveal test
- mining inventory test

Exit criteria:

- Godot supports multi-region quest arcs with dependencies.

## Phase 6: Ecology, Biology, Chemistry

Migrate:

- ecology quests
- biology quests
- chemistry/surfactant/coating quests
- Salt River
- biology lab interactions
- living basin systems

Domains:

- Ecology
- Biology
- Chemistry

Tests:

- species observation test
- foraging-to-crafting test
- biology sample save test
- chemistry simulation completion test

Exit criteria:

- Cross-domain progression works across regions and simulations.

## Phase 7: Cognitive and Language Systems

Migrate:

- cognitive quest framework
- in-world cognitive rooms
- language NPC interactions
- phrase builder moments
- language trust/rank effects

React remains responsible for:

- large dashboards
- OCR-heavy practice
- parent-visible learning analytics

Tests:

- cognitive puzzle solve test
- language dialogue choice test
- learning event bridge test

Exit criteria:

- Godot can host optional/embedded educational challenges without bloating quest code.

## Phase 8: Battery and Electrical Systems

Migrate carefully:

- conceptual Power Lab puzzles
- battery safety simulations
- BMS learning module as safe in-game concept
- wire/fuse/controller diagnostics puzzles

Keep in React:

- adult gate
- parts research
- build plans
- safety checklists
- purchase planning

Tests:

- adult gate request bridge test
- no physical battery build CTA test
- safe conceptual simulation smoke

Exit criteria:

- Godot teaches safe concepts; React controls adult-supervised planning.

## Phase 9: Replace `/play` With Godot

Requirements before replacement:

- all active player-facing Phaser game loops have Godot equivalent or explicit retirement note
- save import/migration from `bikebrowser_game_save`
- React bridge stable
- Phaser tests still available under legacy route
- Godot smoke tests passing
- performance acceptable on target tablets/laptops

Route plan:

- `/godot-prototype`: early test route
- `/play?engine=godot`: beta route
- `/play?engine=phaser`: fallback route
- `/play`: switches to Godot after acceptance

Exit criteria:

- Godot is default Quest World runtime.
- Phaser remains temporary fallback.

## Phase 10: Phaser Retirement

Only after a stable Godot period:

- archive Phaser docs
- freeze Phaser save migration path
- remove Phaser runtime from active route
- keep content data migration scripts
- keep e2e tests that validate old save import

Do not delete Phaser systems until the user explicitly approves retirement.

## Testing Roadmap

### Keep current tests

- `runtime-audit.smoke.spec.js`
- `full-game-playthrough.smoke.spec.js`
- `flat-tire-flow.smoke.spec.js`
- `gameplay-report-panel.smoke.spec.js`

### Add migration tests

- bridge event schema tests
- save isolation tests
- region registry tests
- quest registry tests
- domain module tests
- Godot export nonblank smoke
- movement smoke
- NPC interaction smoke
- reward-intent smoke
- Phaser regression smoke

### Add future player-path tests

- fresh start -> garage -> neighborhood -> Mr. Chen
- flat tire repair
- world map unlock
- materials lab measurement
- bridge build
- ecology observation
- biology simulation
- cognitive puzzle
- language dialogue

## Performance Concerns

Godot Web export should be tested early for:

- WebAssembly startup time
- WebGL 2.0 compatibility
- mobile/tablet performance
- canvas resizing inside React
- iframe input focus
- audio unlock behavior
- memory use across region changes
- asset loading and cache behavior

Prefer:

- single-threaded Web export first
- small initial asset packs
- region-based loading
- simple 2D lighting
- no expensive shaders in first pass

## Save Migration Strategy

Stages:

1. Godot test save only: `bikebrowser_godot_test_save`
2. One-way read/import from Phaser save for testing
3. Dual-write test mode with explicit flag
4. Godot save becomes canonical for game progress
5. Legacy Phaser save import remains available

Never silently overwrite `bikebrowser_game_save`.

## Recommended Next Implementation Prompt

```text
Create the first BikeBrowserWorld Godot foundation project using the revised architecture docs.

Scope:
- Create BikeBrowserWorld folder.
- Add project.godot.
- Add Core autoload stubs: EventBus, SaveService, RegionRegistry, QuestRegistry, DiscoveryService, InventoryManager, DialogueManager, CompanionBridge, RewardBridge.
- Add Domains/Mechanics only as active domain.
- Add registered placeholders for other domains.
- Add Regions/Garage and Regions/Neighborhood with simple playable scenes.
- Add Zuzu movement.
- Add Mr. Chen NPC.
- Add chain_repair mission and chain hotspot.
- Add reward_intent event to React bridge.
- Add /godot-prototype route.
- Do not replace /play.
- Do not write bikebrowser_game_save.
- Add bridge schema tests, save isolation test, Godot prototype smoke if possible, and Phaser regression smoke.

Run tests and report results.
```

## Recommended Next Quest After Chain Repair

Migrate `flat_tire_repair` next.

Why:

- It is the current early-game repair safety net.
- It has existing Playwright coverage.
- It teaches a concrete repair concept.
- It introduces tool use and explainer flow.
- It is small enough to become the second Godot mechanics-domain proof.

After that, migrate `bridge_collapse` as the first large cross-domain arc.
