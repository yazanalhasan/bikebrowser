# BikeBrowser Full Live Playthrough Audit

## Purpose

This report follows up the Godot migration audit with a live playthrough pass of the current game portion. The goal is to support the clarified direction: **build the entire game portion in Godot**, while keeping the surrounding BikeBrowser web app for search, videos, allowance, shopping, build planning, and adult-facing tools.

## What Was Actually Played

I performed two kinds of verification:

1. **Manual live browser pass through the visible beginning of the game**
   - Opened `/play`.
   - Saw the start screen for "Zuzu's Bike Adventure."
   - Started a fresh game.
   - Spawned in `ZuzuGarageScene`.
   - Observed the React/Phaser HUD, Zuzubucks display, right-side tool buttons, virtual controls, garage props, labels, workbench, materials lab, thermal lab, bike rack, notebook, and exit.
   - Used the on-screen controls to exit the garage.
   - Entered the neighborhood/street scene.
   - Observed NPCs, labeled houses, plants, road, bike repair marker, heat warning, interact prompts, and world labels.
   - Interacted with Mr. Chen.
   - Started and advanced the "Fix Mr. Chen's Slipped Chain" quest dialogue.

2. **Automated browser-runtime full quest playthrough**
   - Ran the existing Playwright playthrough suite.
   - The suite booted the browser game and completed every shipped quest through the real quest system.
   - Result: `4 passed`.
   - Command run: `npm run test:e2e:playthrough`.

Important distinction: the automated full-game test proves the quest data and quest state machine can complete all shipped quests in the browser runtime. It does **not** physically steer Zuzu through every map, every collision path, and every interaction by hand. The manual pass confirms the beginning of the real player experience; the automated pass confirms end-to-end quest-system reachability.

## Test Result

```text
npm run test:e2e:playthrough

4 passed
```

Covered tests:

- `flat-tire-flow.smoke.spec.js`
- `full-game-playthrough.smoke.spec.js`
- `gameplay-report-panel.smoke.spec.js`
- `runtime-audit.smoke.spec.js`

## Quest Coverage Observed Through Runtime Playthrough

The current shipped quest set contains 21 quests:

1. `flat_tire_repair` - Fix Mrs. Ramirez's Flat Tire
2. `chain_repair` - Fix Mr. Chen's Slipped Chain
3. `desert_healer` - Desert Healer
4. `food_chain_tracker` - Follow the Food Chain
5. `desert_survival` - Desert Survival Basics
6. `medicine_balance` - Balance the Medicine
7. `extract_dna` - The Blueprint of Life
8. `understand_expression` - From Code to Machine
9. `engineer_bacteria` - Engineer a Living Factory
10. `bio_battery_integration` - Biology Meets Engineering
11. `the_living_fluid` - The Living Basin
12. `desert_infection` - Desert Infection
13. `one_sided_forest` - The One-Sided Forest
14. `toxic_knowledge` - Toxic Knowledge
15. `invisible_map` - The Invisible Map
16. `bridge_collapse` - The Bridge That Broke
17. `heat_failure` - When Heat Wins
18. `perfect_composite` - The Perfect Composite
19. `boat_puzzle` - The Floating Challenge
20. `engine_cleaning` - The Clogged Engine
21. `desert_coating` - Surviving the Desert Sun

The automated playthrough validates that all 21 can be started, advanced, and completed through `questSystem.js` using the live browser runtime and real quest data.

## Beginning-to-End Player Path Seen

### Start screen

The player sees:

- "Zuzu's Bike Adventure"
- "From Neighborhood to Stars"
- Continue Adventure
- New Game
- "A bike repair learning game"

For Godot: this should become either a Godot title screen or a React wrapper that launches the Godot export. Since the goal is the entire game portion in Godot, the stronger long-term choice is a Godot title/menu with React only embedding it.

### Fresh start confirmation

The game warns that current game progress will be replaced while learning progress across BikeBrowser stays safe.

For Godot: preserve this split. Game progress can reset; learning/allowance progress must remain web-owned and protected.

### Garage spawn

The fresh game starts in `ZuzuGarageScene`.

Visible elements:

- Zuzu player character.
- Zuzu's bike on a rack.
- Workbench/tool area.
- Materials Lab entry.
- Thermal Lab entry.
- Notebook.
- Bottom exit labeled "Go Outside."
- Zuzubucks HUD.
- Back/home controls.
- Right-side buttons for notebook/calendar/bag/book/lab/trophy/audio/brain/debug/pause.
- On-screen movement controls and interaction button.

For Godot: the garage should be the first full scene to rebuild after the initial movement slice. It is the home base and should become the anchor for inventory, tools, bike work, labs, mission selection, and save/load.

### Garage to neighborhood transition

Using the on-screen down control moved Zuzu to the bottom exit and transitioned into the neighborhood.

For Godot: scene transitions should be reusable `Area2D` nodes, with transition metadata kept data-driven. Do not hard-code static anchors in scripts; convert or preserve the existing `public/layouts/*.layout.json` approach.

### Neighborhood/street scene

Visible elements:

- Neighborhood scene title.
- Houses with labels.
- NPCs Mrs. Ramirez and Mr. Chen.
- Mr. Chen's bike repair marker.
- Plant/ecology labels.
- Heat warning: "Extreme heat! Seek shade or hydrate."
- Interact prompts.
- Garage return button.
- Same HUD and side toolbar.

For Godot: this scene should become the first explorable world hub. It carries the strongest "game" feeling and should be rebuilt before deeper labs.

### Mr. Chen chain quest

Interacting with Mr. Chen starts `chain_repair`:

- Quest title appears: "Fix Mr. Chen's Slipped Chain."
- Step counter appears.
- Dialogue panel opens with Mr. Chen's text.
- Continue advances dialogue.
- Quest moves to step 3/7 during the observed pass.

For Godot: this is the ideal first mission to port. It is small, bike-focused, NPC-driven, educational, and easy to compare against Phaser.

## What the Current Game Already Does Well

- It has a real game shell, not just a prototype.
- The start/new-game flow is understandable.
- The garage immediately communicates "bike repair home base."
- The neighborhood has clear NPCs and interact prompts.
- Quest state is visible in the HUD.
- The game has a surprisingly broad quest graph.
- Save migration exists and is versioned.
- The Playwright quest safety net is valuable.
- Layout data already exists outside scene code.
- The game has a working bridge between React HUD and Phaser state.

## What Feels Most Phaser-Specific

- Scene classes and boot order in `src/renderer/game/config.js`.
- Arcade Physics movement and collisions.
- Phaser registry as state bridge.
- Phaser Graphics drawing for many props/overlays.
- Phaser scene start/launch/stop flows.
- Dev hooks such as `window.__phaserGame`.
- Playwright tests that directly call Phaser scene methods.
- Existing interaction zones and pointer handlers.
- Phaser Editor migration artifacts.

These should not be ported line-by-line. They should be re-expressed as Godot scenes, nodes, signals, resources, and autoload services.

## What Is Reusable in Godot

High-value reusable content:

- Quest IDs, titles, steps, rewards, and dialogue from `src/renderer/game/data/quests.js`.
- Scene metadata from `sceneRegistry.js`.
- Save schema concepts from `saveSystem.js`.
- Item IDs and inventory concepts from `items.js`.
- NPC profile/dialogue data.
- Knowledge/milestone concepts.
- Layout JSON as migration source data.
- Zuzu atlas/sprite assets.
- Neighborhood and tilemap assets.
- Music and reward stingers.
- Existing e2e test expectations as migration acceptance criteria.

## What Should Stay Outside Godot

Even if the whole game portion moves to Godot, these should remain React/web responsibilities:

- YouTube search, ranking, watching, and quizzes.
- Allowance ledger and real money balance.
- Shopping/cart and purchase safety.
- Project Builder and Build Planner.
- Adult-supervised battery workshop planning.
- Spelling, handwriting, letter, and multiplication trainers unless they are mini-game cameos.
- Cloudflare API calls and public site routing.
- Parent/debug/admin views.

Godot should emit events; React should own real-world money, purchases, web APIs, and adult-gated content.

## What Should Move Into Godot

Because your goal is the whole game portion in Godot, these should move:

- Title/menu for the game.
- Zuzu movement and animation.
- Garage.
- Neighborhood/street.
- World map and local scene travel.
- NPCs.
- Dialogue UI.
- Quest HUD.
- Inventory/game items.
- Zuzubucks as an in-game reward presentation.
- Repair mini-games.
- Materials lab interactions.
- Thermal lab interactions.
- Dry wash/bridge gameplay.
- Cognitive/quiz scenes that are part of a quest.
- Save/load for game progress, bridged back to React.

## Recommended Godot Migration Direction

The recommendation changes from "Godot vertical slice only" to:

**Build the entire game portion in Godot, but ship it through React as the parent shell.**

That means:

- Godot owns `/play` eventually.
- Phaser stays temporarily as `/play?engine=phaser` or a backup route during migration.
- React embeds Godot Web export.
- React keeps non-game systems.
- Game progress syncs through a bridge.
- Real allowance/reward ledger stays React-owned.

## Godot Port Order

### Phase 1: Core playable loop

Port:

- Game title screen.
- Fresh start confirmation.
- `ZuzuGarageScene`.
- Zuzu movement.
- Garage exit.
- `StreetBlockScene`.
- Mr. Chen.
- Chain repair quest.
- Dialogue panel.
- Quest HUD.
- Save/load stub.

Acceptance:

- A fresh player can start in Godot, leave garage, talk to Mr. Chen, start the chain quest, advance dialogue, and receive a reward-intent event.

### Phase 2: Flat tire and early repairs

Port:

- Mrs. Ramirez.
- Flat tire quest.
- Flat tire explainer.
- Basic quiz UI.
- Tool use steps.
- Reward presentation.

Acceptance:

- Godot can pass the player-visible equivalent of `flat-tire-flow.smoke.spec.js`.

### Phase 3: World and map travel

Port:

- Overworld scene.
- World map.
- Scene unlock requirements.
- Discovery/fog concepts.
- Local scene transitions.

Acceptance:

- Player can travel through all major areas currently represented in Phaser.

### Phase 4: Labs and engineering systems

Port:

- Materials Lab.
- Thermal Rig.
- Bridge collapse flow.
- Dry Wash bridge.
- Material measuring/testing interactions.

Acceptance:

- `bridge_collapse`, `heat_failure`, and material quests have playable Godot equivalents.

### Phase 5: Ecology, biology, cognitive, and advanced quests

Port:

- Foraging/interactions.
- Ecology observations.
- Biology quest surfaces.
- Cognitive quest UI.
- Advanced science quests.

Acceptance:

- All 21 shipped quest IDs have Godot-playable equivalents.

### Phase 6: Replace Phaser route

Port:

- Game save bridge.
- Reward bridge.
- Settings bridge.
- Mobile input.
- Debug overlay.
- Playwright Godot smoke tests.

Acceptance:

- `/play` loads Godot by default.
- Phaser remains available only as legacy fallback until removed.

## Godot Acceptance Checklist for "Entire Game Portion"

Before retiring Phaser, Godot must support:

- Fresh start.
- Continue saved game.
- Player movement.
- Mobile controls.
- Garage.
- Neighborhood.
- Every registered current scene or a deliberate replacement.
- All 21 shipped quests.
- Dialogue.
- Quizzes.
- Inventory.
- Quest rewards.
- Zuzubucks display.
- React allowance bridge for real money.
- Scene transitions.
- Save migration/import from Phaser save.
- Runtime debug overlay.
- Automated smoke tests.
- Visual screenshot checks.

## Playthrough Findings

### Finding 1: The game is already larger than the first screen suggests

The visible beginning looks like a small garage/neighborhood repair game, but the quest data spans repairs, ecology, biology, materials, thermals, bridge building, fluids, coatings, and advanced systems. Godot planning should treat this as a medium-sized educational RPG, not a single repair mini-game.

### Finding 2: The first true Godot benchmark should be Mr. Chen's chain quest

The chain quest is the cleanest first target because it starts from visible NPC interaction, uses a real bike problem, has seven steps, includes a repair concept, and is easy to test from fresh-game flow.

### Finding 3: The React HUD is doing a lot of work

The current HUD, side buttons, debug controls, and overlays are substantial. If the game portion moves fully to Godot, the HUD should move too, except for outer app navigation and account/allowance views.

### Finding 4: Quest tests are strong but not player-complete

The full-game Playwright test completes every shipped quest, but it satisfies many required steps by directly inserting inventory, observations, recipes, and correct quiz choices. That is excellent for data/system reachability, but Godot still needs player-path tests for movement, collisions, and real interaction.

### Finding 5: Layout discipline is a major asset

The existing layout JSON rule should become a Godot migration strength. Static positions should be imported from data or authored in scenes/resources, not scattered through scripts.

## Immediate Next Step

Create a Godot project only after this target is accepted:

```text
BikeBrowserWorld/
```

First Godot deliverable:

- Title screen.
- Garage scene.
- Street/neighborhood scene.
- Zuzu controller.
- Mr. Chen NPC.
- Chain repair mission.
- Dialogue UI.
- Reward-intent bridge to React.

Do not start with the world map, advanced labs, or all quests. Start with the real first loop and make it feel good.

## Verification Performed

Commands run:

```text
npm run test:e2e:playthrough
```

Result:

```text
4 passed
```

Manual browser states observed:

- `/play` start screen.
- fresh-start confirmation modal.
- `ZuzuGarageScene`.
- garage-to-neighborhood transition.
- `StreetBlockScene`.
- Mr. Chen interaction.
- `chain_repair` quest dialogue progression.

## Remaining Uncertainties

- I did not physically steer through every quest by hand.
- The full quest pass is automated through the browser runtime and quest system.
- Some later scenes and quests may have visual or collision issues not exposed by the quest-state test.
- The current checkout does not include the newer Power Lab/Battery Workshop React routes mentioned in prior product direction.
- A true final migration spec should include screenshots or video captures for every scene before rebuilding them in Godot.
