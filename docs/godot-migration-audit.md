# BikeBrowser Godot Migration Audit

## 1. Executive Summary

BikeBrowser currently has a working Phaser 3 game embedded inside a React/Vite/Electron-style web app. The game is launched through `/play`, mounted by `src/renderer/game/GameContainer.jsx`, and persisted through `localStorage.bikebrowser_game_save`. It already includes meaningful foundations: Zuzu's garage, an overworld/neighborhood structure, NPC quest flow, repair quests, materials labs, ecology/foraging systems, cognitive challenges, progression checks, a React HUD, and Playwright smoke coverage.

The safest recommendation is **Hybrid React + Godot Web export**, with React remaining the parent shell. Godot should initially replace only the child-facing Quest World experience, while React keeps search, video watching, education trainers, allowance/ledger views, shopping/cart planning, build planning, and adult-supervised technical workflows. A full rewrite would risk losing working quest/save/test behavior before Godot proves value.

The first Godot target should be a small vertical slice: Zuzu movement, a dusk neighborhood, garage entry, Mr. Chen dialogue, a chain/derailleur mission trigger, and a simple reward event that reports back to the React shell. Phaser should stay available until the Godot slice matches or exceeds the current `/play` value.

Godot 4.6.2 is installed at `C:\Godot`, with both GUI and console executables present.

## 2. Current Game Architecture

### Runtime and launch path

- `src/renderer/App.jsx` defines `/play` -> `GamePage` and `/play3d` -> `Game3DPage`.
- `src/renderer/pages/GamePage.jsx` renders `GameContainer`.
- `src/renderer/game/GameContainer.jsx` owns the React-to-Phaser bridge.
- `src/renderer/game/config.js` creates a Phaser CANVAS game with Arcade Physics, resize scaling, disabled Phaser audio, and registered scenes.
- The first scene defaults to `ZuzuGarageScene`; saved games can reorder boot so the saved scene starts first.

### React/Phaser bridge

`GameContainer.jsx` is the main integration layer. It:

- Shows the start/continue/new-game screen.
- Reads `loadGame()` before creating Phaser.
- Creates the Phaser instance with `createGameConfig()`.
- Injects save state into `game.registry`.
- Listens for registry changes such as `gameState`, `dialogEvent`, `mcpAlert`, `physicsHUD`, and `physicsQuestion`.
- Renders the React HUD, dialog overlays, mobile joystick, gameplay report panel, debug tools, and reward/status surfaces.
- Calls `saveGame()` after quest, milestone, factory, and state updates.
- Exposes `window.__phaserGame` in dev.

### Scene registration

`src/renderer/game/config.js` registers:

- `ZuzuGarageScene`
- `MaterialLabScene`
- `ThermalRigScene`
- `OverworldScene`
- `StreetBlockScene`
- `DogParkScene`
- `LakeEdgeScene`
- `SportsFieldsScene`
- `CommunityPoolScene`
- `DesertTrailScene`
- `MountainScene`
- `ExplainerScene`
- `CognitiveQuestScene`
- `WorldMapScene`
- `DesertForagingScene`
- `CopperMineScene`
- `SaltRiverScene`
- `DryWashScene`
- legacy `GarageScene`
- legacy `NeighborhoodScene`
- `LayoutEditorOverlayScene`

### Scene registry

`src/renderer/game/systems/sceneRegistry.js` is the route map for game scenes. It defines scene keys, layer type, display names, icons, descriptions, spawns, exits, unlock requirements, regions, and default music. Current layers are effectively:

- `overworld`: macro navigation scenes such as `OverworldScene` and `WorldMapScene`.
- `local`: playable locations such as garage, street, labs, pool, trails, dry wash.
- `micro`: described in comments but mostly implemented as focused Phaser scenes such as `ExplainerScene` and `CognitiveQuestScene`.

Static scene layout currently follows the project rule: positions belong in `public/layouts/<scene>.layout.json` and are loaded through `loadLayout(this, '<key>')`. Any Godot migration should preserve this data-driven layout discipline during conversion.

### Core systems

Important game systems live under `src/renderer/game/systems/`:

- Save/progression: `saveSystem.js`, `questSystem.js`, `sideQuestSystem.js`, `milestoneEngine.js`, `progressionReachabilityAudit.js`, `runtimeAudit.js`.
- Navigation: `sceneRegistry.js`, `sceneTransition.js`, `seamlessTraversal.js`, `discoverySystem.js`, `discoveryBridge.js`.
- Player/world logic: `inventorySystem.js`, `interactionManager.js`, `inspectorSystem.js`, `gameplayArbiter.js`, `MCPSystem.js`.
- Repair/science: `physicsbridge.js`, `materialEngine.js`, `materials/*`, `thermalRigEngine.js`, `simulationEngine.js`, `stressSimulation.js`, `batterySystem.js`, `ebikeSystem.js`.
- Learning/cognition: `education/physicsEducationSystem.js`, `education/quizQuestionGenerator.js`, `cognitiveQuestSystem.js`, `cognitive/*`.
- Ecology/biology/language: `ecology*`, `biology*`, `foragingSystem.js`, `language*`, `phraseBuilder.js`.
- AI helpers: `systems/ai/*`, `gameAI.js`, `failureAssistant.js`.

### Data files

Reusable game data lives under `src/renderer/game/data/`:

- Quests: `quests.js`, `questBoard.js`, `dialogueTemplates.js`, `npcDialogueTemplates.js`.
- World: `sceneRegistry.js`, `regions.js`, `worldMapData.js`, `neighborhoodLayout.js`, `sceneItemGrants.js`.
- Items/materials/building: `items.js`, `bikeParts.js`, `batteryParts.js`, `ebikeParts.js`, `materials.js`, `recipes.js`, `workbenchRecipes.js`, `shop.js`, `factories.js`.
- Learning and science: `knowledgeConcepts.js`, `milestones.js`, `cognitiveQuests/*`, `explainers/*`.
- Ecology/biology/language: `flora.js`, `fauna.js`, `ecology.js`, `biology.js`, `plantChemistry.js`, `plantEffects.js`, `languages.js`, `languageQuests.js`.

### Tests and debug hooks

- `window.__phaserGame` is a dev-only handle used by Playwright.
- `window.__runtimeAuditResult` is written by `runtimeAudit.js`.
- `tests/e2e/helpers/gameBoot.js` boots `/play`, starts the adventure if needed, waits for Phaser, waits for an active scene, and reads runtime audit results.
- Existing smoke tests cover runtime audit, full-game quest playthrough, flat tire flow, and gameplay report panel.

## 3. Current Gameplay Status

### Existing scenes

The game currently has a broad world model:

- Garage/home base: `ZuzuGarageScene`, legacy `GarageScene`.
- Neighborhood/world travel: `OverworldScene`, `StreetBlockScene`, legacy `NeighborhoodScene`, `WorldMapScene`.
- Labs: `MaterialLabScene`, `ThermalRigScene`.
- Local areas: dog park, lake edge, sports fields, community pool, desert trail, mountain.
- Arizona/world sub-scenes: desert foraging, copper mine, Salt River, dry wash.
- Focus scenes: flat tire explainer and cognitive quest scene.

### Player movement

Player movement is Phaser-specific and built around `src/renderer/game/entities/Player.js`, Arcade Physics, camera-follow behavior, input handling, and mobile joystick support from the React wrapper. In Godot this should become a `CharacterBody2D` with `_physics_process`, input actions, collision shapes, and an optional React-hosted virtual joystick bridge for Web.

### NPCs

NPC behavior is centralized around `src/renderer/game/entities/Npc.js` and data files such as `npcProfiles.js`, `npcAppearances.js`, and dialogue templates. This structure is highly reusable as data, but the rendering, collision, and interaction implementation should become Godot `Area2D` and signal-driven dialogue triggers.

### Quests

The quest engine is a strong reusable asset. `questSystem.js` is mostly pure state transition logic over data in `quests.js`. Existing quests include flat tire repair, chain repair, desert/ecology quests, materials engineering, bridge collapse/material testing, thermal failure, composites, buoyancy, surfactants, coatings, cognitive puzzles, and related unlocks.

The current limitation is that quest rewards still write directly into game save fields such as `zuzubucks` and `reputation`, while the larger BikeBrowser product also has education/allowance reward concepts. Migration should avoid duplicating money systems.

### Repair mini-games and explainers

Repair content exists in multiple forms:

- Flat tire repair has an explainer flow via `ExplainerScene` and `data/explainers/flatTireExplainer.js`.
- Chain repair exists as a quest with derailleur/chain concepts.
- Materials lab and thermal rig scenes provide interactive engineering mini-game foundations.
- Dry wash and bridge/material concepts are represented through quests, material scoring, density logging, and observation state.

The current derailleur work is more conceptual quest logic than a full tactile repair simulation. Godot is a good place to build these as focused physical interactions, while React should remain responsible for video/search/reference material.

### Educational overlays

Educational overlays are split:

- React overlays inside `GameContainer.jsx`.
- Phaser scenes such as `ExplainerScene` and `CognitiveQuestScene`.
- Data-driven quiz/question engines under `systems/education` and `systems/cognitive`.

Godot can recreate lightweight in-world prompts and mini-quizzes, but detailed learning dashboards should stay in React.

### Rewards and saves

Game persistence is `localStorage.bikebrowser_game_save`, schema version 6. The save includes player scene/position, inventory, active quest, completed quests, upgrades, `zuzubucks`, reputation, journal, settings, builds, factories, knowledge, skills, biology state, language state, side quests, cognitive stats, world map discovery, solved obstacles, milestones, material logs, mining, and discovery fog.

This save shape is useful as a migration contract. Godot should not invent a disconnected save format without a bridge/migration plan.

### HUD and debug tools

The HUD is currently React-driven. It shows core state, quests, inventory/milestones, cognitive panels, debug reports, and money. This is one reason a hybrid approach is safer: React already owns a lot of high-value UI.

## 4. Current Asset Inventory

### Character and sprite atlases

Likely useful in Godot:

- `public/assets/game/atlases/zuzu.png`
- `public/assets/game/atlases/zuzu.json`
- `public/assets/game/atlases/neighborhood.png`
- `public/assets/game/atlases/neighborhood.json`

These can be converted into Godot `SpriteFrames`, `AtlasTexture`, or imported texture regions. Cleanup may be needed to standardize pivots, frame names, animation groups, and scale.

### Tilemaps and world maps

- `public/assets/game/maps/neighborhood.json`
- `public/assets/game/tilesets/sonoran_tiles.png`
- `public/game/maps/neighborhood_world_v1.png`

The tilemap is a strong candidate for Godot `TileMapLayer` conversion. The world map image can be imported directly, but should be checked for resolution, collision boundaries, and label readability.

### Layout data

The project has layout JSON files in `public/layouts/`, including:

- `zuzu-garage.layout.json`
- `neighborhood.layout.json`
- `overworld.layout.json`
- `street-block.layout.json`
- `material-lab.layout.json`
- `thermal-rig` equivalent layouts through scene-specific files
- local scene layouts for dog park, lake edge, sports fields, community pool, desert trail, mountain, copper mine, salt river, dry wash, desert foraging, cognitive flat tire, and flat tire explainer.

These should be migrated intentionally. Options:

1. Keep JSON as canonical data and write a Godot importer/loader.
2. Generate `.tscn` scenes from JSON once, then treat Godot scenes as canonical.
3. Use JSON for authored static anchors and Godot scenes for visual composition.

Given the existing AGENTS rule, option 1 or 3 is safest during early migration.

### Ecology assets

`public/assets/ecology/` contains plants, animals, and terrain images plus `manifest.json` and attribution. These are usable as Godot textures but appear to be placeholder/generated quality. They are fine for a vertical slice, but should not define the final art bar.

### Audio

Audio exists under `public/game/audio/`:

- Music: `garage_warm_oud.ogg`, `neighborhood_hybrid_ride.ogg`, `desert_discovery.ogg`, `pixel_pedal_parade*.mp3`, `pyramid_sandwalk.mp3`, and others.
- Stingers: `reward_tarabi_stinger.ogg`, `upgrade_unlock_hybrid.ogg`.
- Manifest and procedural fallback logic: `src/renderer/game/audio/audioManifest.js`, `AudioManager.js`, `proceduralAudio.js`.

Audio files can be imported into Godot, but the current Web Audio manager is React/JS-specific. For a Web export, keep React audio until Godot audio behavior is proven across browsers.

### UI and app icons

- `assets/icons/*` and `assets/icon.png` are app/site assets.
- `public/assets/game/ui/shadow_soft_*.png` are reusable small UI/visual polish assets.

React should keep most app UI. Godot should only own in-game diegetic UI and CanvasLayer overlays needed during gameplay.

### Phaser Editor assets

`public/game/editor-assets/packs/*.json` and `src/renderer/game/editor-scenes/*Base.js` document a previous Phaser Editor direction. This material is useful for understanding layout/asset-pack intent, but should not be expanded further if Godot becomes the target runtime.

## 5. Current Educational Systems

### Stay in React/web

- `src/renderer/spellingTrainer/SpellingTrainerApp.jsx`
- `src/renderer/spellingTrainer/account.js`
- `src/renderer/spellingTrainer/ocr.js`
- `src/renderer/spellingTrainer/uploadServer.js`
- `src/renderer/learning/learningStore.js`
- `src/renderer/learning/topics.js`
- YouTube search/watch pages and learning path panels.
- Shopping/cart/build planning screens.

These are form-heavy, text-heavy, media-heavy, account/ledger-heavy, or adult-facing. React is the better surface.

### Share with Godot through data/APIs

- Learning progress from `learningStore.js`.
- Quest completion events.
- Reward events and allowance ledger once unified.
- Video/topic metadata and quiz results.
- Mission templates and route IDs.
- Game save summaries and unlock state.

Godot should consume small JSON payloads or `postMessage` events rather than directly rewriting React stores.

### Partially recreate in Godot

- Quick in-world quizzes.
- NPC teaching prompts.
- Mission unlock popups.
- Badge/reward animations.
- Repair mini-game instructions.
- Lightweight cognitive puzzles tied directly to world actions.

### Move fully into Godot

- Spatial exploration.
- NPC interaction timing.
- Quest triggers.
- Repair mini-game manipulation.
- World inventory interactions.
- In-world mission feedback.

## 6. Current Mission/Planning Systems

The current checkout still exposes an adult/category-style homepage with tiles such as Project Builder, Build Planner, Shop Materials, Play Game, Spelling Trainer, Bikes, E-Bikes, Dirt Bikes, Mountain Bikes, BMX, and Building & Parts. The newer "Garage Missions", "Power Lab", "Battery Workshop", and "Learning Arcade" direction is not present as route files in this checkout.

Existing planning systems:

- `src/renderer/pages/ProjectBuilderPage.jsx`
- `src/services/buildMissions.js`
- `src/client/apiClient.js`
- `src/renderer/pages/YouTubeSearchView.jsx`
- `src/renderer/pages/VideoWatchPage.jsx`
- `src/renderer/components/ProjectShoppingPanel.tsx`
- `src/renderer/services/shopping/ProjectCartService.ts`
- `src/renderer/services/shopping/GlobalCartService.ts`
- compatibility services under `src/renderer/services/compatibility/`

Recommended division:

- React companion screens: project builder, build planner, shopping/cart, video search/watch, battery workshop planning, allowance dashboard.
- Shared API/data: mission templates, selected videos, project parts list, compatibility warnings translated into kid copy.
- Godot missions: NPC quest versions of garage missions, repair problems, and exploration goals.
- Godot interactive labs: derailleur alignment, tire patching, bridge testing, simple circuit/power puzzles, battery safety simulations that remain educational and adult-gated where appropriate.

## 7. What Should Stay in React

Keep these in React:

- Home page and top-level navigation.
- YouTube search, ranking, video watch pages, and video quizzes.
- Project Builder and Build Planner.
- Shopping/cart/parts planning.
- Compatibility intelligence dashboards.
- Spelling Trainer and account/reward screens.
- Letter, multiplication, handwriting, OCR/upload workflows when present.
- Allowance ledger and parent-visible balances.
- Adult-supervised Power Lab/Battery Workshop planning screens.
- Settings, debug reports, and cross-system dashboards.

React is better for dense forms, search results, real purchases, adult gates, text-heavy learning, browser APIs, and account/ledger management.

## 8. What Should Move to Godot

Move these into Godot after the vertical slice proves stable:

- Quest World exploration.
- Zuzu movement, collision, and scene transitions.
- NPCs and dialogue popups.
- Repair mini-games that benefit from direct manipulation.
- Mission trigger zones.
- In-world inventory interactions.
- World map traversal.
- Local place scenes such as garage, street, lab, dry wash, and trail areas.
- Diegetic quest feedback, badges, and short reward effects.

Godot should become the child's interactive world, not the entire BikeBrowser app.

## 9. What Should Be Shared Through Data/APIs

Shared contracts should include:

- Save summary: scene, position, active quest, completed quests, inventory, unlocks, current balance summary.
- Reward event: source, amount, label, metadata, idempotency key, timestamp.
- Mission template: id, title, kid title, steps, required concepts, reward plan, source route.
- NPC/dialogue data: speaker id, dialogue tree id, quest trigger, localized/kid copy.
- Compatibility warnings: adult message, kid message, severity, related part, suggested fix.
- Video metadata: title, id, topic, quiz id, watched/completed flags.

For Godot Web export embedded in React, the first bridge should be `postMessage`:

- Godot -> React: `quest_started`, `quest_completed`, `reward_awarded`, `save_requested`, `open_companion_route`.
- React -> Godot: `hydrate_save`, `mission_unlocked`, `reward_balance_updated`, `settings_updated`.

Later, the same messages can be backed by Cloudflare APIs or Electron IPC.

## 10. Godot Target Architecture

Recommended Godot 4 project name: `BikeBrowserWorld`.

Folder structure:

```text
BikeBrowserWorld/
  project.godot
  scenes/
    boot/
    world/
    garage/
    repair/
    powerlab/
    batteryworkshop/
    learning/
    ui/
  scripts/
    characters/
    missions/
    repair/
    save/
    bridge/
    ui/
    world/
  assets/
    characters/
    environments/
    props/
    ui/
    audio/
  data/
    layouts/
    missions/
    quests/
    dialogue/
    items/
  autoload/
    GameState.gd
    EventBus.gd
    SaveService.gd
    ReactBridge.gd
    RewardBridge.gd
  ui/
    hud/
    dialogue/
    debug/
  missions/
  characters/
  repair/
  powerlab/
  batteryworkshop/
  learning/
  world/
```

Godot equivalents:

| Current Phaser concept | Godot equivalent |
| --- | --- |
| Phaser Scene | `.tscn` scene with script |
| Phaser sprite | `Sprite2D` or `AnimatedSprite2D` |
| Phaser atlas | `SpriteFrames`, `AtlasTexture`, imported texture regions |
| Phaser interaction zone | `Area2D` with signals |
| Phaser Arcade Physics body | `CharacterBody2D`, `StaticBody2D`, `Area2D` |
| Phaser update loop | `_process` / `_physics_process` |
| Phaser registry events | Autoload singleton + signals |
| React HUD | Godot `CanvasLayer` for in-game HUD; React for app/global HUD |
| localStorage save | Godot save object plus React `postMessage` bridge to existing save/ledger |
| `window.__phaserGame` debug bridge | Godot debug overlay + React bridge debug hooks |
| Layout JSON | Godot importer or runtime loader for `data/layouts/*.json` |

## 11. Recommended Migration Strategy

### Option comparison

**A. Continue Phaser only**

- Pros: no runtime migration cost; existing tests and debug hooks remain useful.
- Cons: current UI/game boundary is crowded; repair/lab interactions are harder to polish; long-term scene authoring remains mixed.
- Verdict: acceptable short term, weak long term if the goal is a richer world.

**B. Hybrid React + Godot Web export**

- Pros: keeps working React systems; allows Godot to focus on Quest World; safer migration; web deployment remains possible; old Phaser can stay as fallback.
- Cons: requires a React/Godot bridge and two runtime stacks during migration.
- Verdict: best fit.

**C. Full Godot game with API connections**

- Pros: clean game runtime, stronger editor workflow.
- Cons: would require rebuilding search, learning, shopping, ledgers, and adult gates or embedding web views inside Godot. Too risky.
- Verdict: not recommended now.

**D. Godot desktop app**

- Pros: strong native runtime and file access.
- Cons: conflicts with the current browser/site deployment model; Cloudflare/web route integration becomes secondary.
- Verdict: useful only as a development/editor target, not the main product path.

### Phased roadmap

**Phase 0: Audit only**

- No behavior changes.
- Produce this report and next-step checklist.

**Phase 1: Godot vertical slice**

- Create Zuzu movement.
- Create dusk neighborhood.
- Create garage scene.
- Add Mr. Chen NPC.
- Add dialogue popup.
- Add chain/derailleur mission trigger.
- Emit simple reward event to React.

**Phase 2: Port mission/dialogue/reward systems**

- Convert quest templates to Godot-readable JSON.
- Add Godot mission state.
- Add bridge to React reward/allowance system.
- Keep Phaser save untouched until migration mapping is tested.

**Phase 3: Port repair mini-games**

- Derailleur alignment.
- Tire repair.
- Bridge/material testing.
- Battery/power lab simulations.

**Phase 4: Connect Godot to BikeBrowser backend/web systems**

- Use React as bridge to APIs and storage.
- Add bidirectional events for missions, rewards, route openings, and settings.

**Phase 5: Export Godot to Web and embed**

- Embed under `/play` or `/quest-world`.
- Keep `/play?engine=phaser` fallback during transition.
- Measure performance on desktop, tablet, and mobile browsers.

**Phase 6: Retire or preserve Phaser**

- Retire Phaser only after Godot reaches feature parity for current `/play` flows and tests.
- Preserve Phaser as fallback if Web export performance or browser compatibility is weak.

## 12. First Vertical Slice Specification

Goal: prove Godot can replace the child's Quest World loop without touching the rest of BikeBrowser.

Required player flow:

1. React route opens Godot Web export.
2. Godot boots into a dusk neighborhood scene.
3. Zuzu can walk with keyboard and touch-friendly controls.
4. Zuzu enters or starts near the garage.
5. Mr. Chen is visible as an NPC.
6. Player interacts with Mr. Chen.
7. Dialogue introduces a chain/derailleur problem.
8. Mission starts: "Help Mr. Chen Fix His Chain."
9. Player inspects a bike/chain hotspot.
10. Game emits a reward preview or small completion event to React.

Minimum Godot scenes:

- `scenes/boot/Boot.tscn`
- `scenes/world/Neighborhood.tscn`
- `scenes/garage/ZuzuGarage.tscn`
- `scenes/ui/DialogBox.tscn`
- `scenes/ui/Hud.tscn`

Minimum Godot scripts:

- `autoload/GameState.gd`
- `autoload/EventBus.gd`
- `autoload/ReactBridge.gd`
- `scripts/characters/ZuzuController.gd`
- `scripts/characters/NpcInteraction.gd`
- `scripts/missions/MissionService.gd`
- `scripts/save/SaveService.gd`

Success criteria:

- Runs locally in Godot.
- Exports to Web.
- Embeds in React behind a test route.
- Emits at least one structured event to React.
- Does not mutate existing Phaser save unless explicitly enabled.

## 13. File-by-File Migration Notes

| Current file | Migration note |
| --- | --- |
| `src/renderer/App.jsx` | Add future Godot route or engine flag here. Preserve `/play` until feature parity. |
| `src/renderer/pages/GamePage.jsx` | Current Phaser entry. Later can choose Phaser or Godot based on flag. |
| `src/renderer/game/GameContainer.jsx` | Main React/Phaser bridge. Use as reference for the Godot React bridge, not as code to port directly. |
| `src/renderer/game/config.js` | Phaser scene registration. Godot equivalent is project scene tree and autoloads. |
| `src/renderer/game/systems/saveSystem.js` | Treat as current save contract. Build a migration/bridge layer before replacing it. |
| `src/renderer/game/systems/questSystem.js` | Mostly reusable logic. Consider converting quest state transitions to shared JSON plus Godot script. |
| `src/renderer/game/data/quests.js` | High-value content. Convert or generate JSON for Godot rather than rewriting by hand. |
| `src/renderer/game/systems/sceneRegistry.js` | Convert into Godot world/scene metadata. Preserve unlock requirements. |
| `src/renderer/game/entities/Player.js` | Port behavior to `ZuzuController.gd`; do not port Phaser rendering/physics code. |
| `src/renderer/game/entities/Npc.js` | Port to `Area2D` interaction component plus data-driven profile. |
| `src/renderer/game/prefabs/TransitionZone.js` | Port to reusable `Area2D` scene transition component. |
| `src/renderer/game/prefabs/Workbench.js` | Port to interactable Godot scene/prefab. |
| `src/renderer/game/scenes/ZuzuGarageScene.js` | First local scene candidate after neighborhood slice. |
| `src/renderer/game/scenes/OverworldScene.js` | Later world navigation candidate. Start smaller with a single neighborhood. |
| `src/renderer/game/scenes/StreetBlockScene.js` | Good first neighborhood slice if less dense than full overworld. |
| `src/renderer/game/scenes/ExplainerScene.js` | Convert only repair-focused explainers needed for the slice. |
| `src/renderer/game/scenes/CognitiveQuestScene.js` | Keep in React/Phaser until Godot quiz UI is stable. |
| `src/renderer/game/systems/runtimeAudit.js` | Recreate as Godot debug checklist and browser smoke assertions. |
| `tests/e2e/helpers/gameBoot.js` | Add a new Godot boot helper while preserving Phaser helper. |
| `public/layouts/*.layout.json` | Preserve as canonical static layout data or generate Godot scenes from them. |
| `public/assets/game/atlases/zuzu.*` | Convert to Godot animated sprite resources. |
| `public/assets/game/maps/neighborhood.json` | Candidate tilemap import. |
| `public/assets/game/tilesets/sonoran_tiles.png` | Candidate Godot tileset. |
| `public/game/audio/*` | Import selectively; keep React/Web Audio fallback early. |
| `src/renderer/pages/YouTubeSearchView.jsx` | Stay React. Godot should request "open video lesson" through bridge. |
| `src/renderer/pages/ProjectBuilderPage.jsx` | Stay React. Godot can unlock companion missions from this data. |
| `src/renderer/services/shopping/*` | Stay React/adult-facing. Godot should never expose purchase actions. |

## 14. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Losing working Phaser functionality | Keep Phaser `/play` available until Godot passes equivalent smoke tests. |
| Godot Web export limitations | Run Web export experiment in Phase 1 before porting more systems. Test Chrome, Edge, mobile/tablet. |
| Asset conversion problems | Start with direct PNG imports; defer perfect atlas/tilemap conversion. Maintain an asset conversion log. |
| Save-system fragmentation | Treat `bikebrowser_game_save` as read-only during the first Godot slice. Use bridge events and separate Godot test saves first. |
| Reward-system duplication | Route all real allowance/money events through React ledger services. Godot emits reward intents, not final ledger writes. |
| React/Godot communication complexity | Begin with a small `postMessage` schema and typed event IDs. Avoid direct store mutation from Godot. |
| Performance on tablets | Test early with a minimal Web export and target low draw calls, compressed textures, and simple shaders. |
| Mobile/browser compatibility | Keep React virtual controls available and test pointer/touch behavior before replacing current mobile support. |
| Overbuilding too early | Build only one NPC, one mission, one scene, one reward bridge first. |
| Adult-gated safety content leaking into child UI | Keep battery build/repair planning in React adult-gated screens; Godot may show conceptual simulations only. |
| Layout drift from current rules | Preserve data-driven layouts; do not hard-code static anchors in Godot scripts. |

## 15. Testing Strategy

Current tests to preserve:

- `tests/e2e/runtime-audit.smoke.spec.js`
- `tests/e2e/full-game-playthrough.smoke.spec.js`
- `tests/e2e/flat-tire-flow.smoke.spec.js`
- `tests/e2e/gameplay-report-panel.smoke.spec.js`

New Godot migration tests:

- Static data conversion test: quest IDs and scene IDs survive export.
- React bridge unit test: events validate shape and idempotency keys.
- Playwright smoke: Godot canvas/iframe appears under test route.
- Playwright interaction smoke: player can move, interact with Mr. Chen, start mission.
- Reward bridge smoke: Godot emits reward intent; React records or previews through the correct ledger layer.
- Save bridge smoke: React sends hydrate payload; Godot applies active mission/unlocks without corrupting Phaser save.
- Visual smoke: canvas is nonblank at desktop and mobile sizes.

Godot-side checks:

- Run Godot console import/export in CI if feasible.
- Add a small GDScript test harness later for mission and save services.
- Keep Phaser tests running until retirement.

## 16. Recommended Next Codex Prompt

Use this after the audit is accepted:

```text
Create a Godot migration branch for BikeBrowser. Do not replace Phaser yet.

Goal: create a minimal Godot 4 vertical slice in a new BikeBrowserWorld folder and a React test route that can embed the Web export later.

Constraints:
- Preserve existing /play Phaser route.
- Do not modify Phaser gameplay behavior.
- Use data-driven layout principles; no hard-coded static anchors in scene scripts.
- Create only the first vertical slice: Zuzu movement, dusk neighborhood placeholder, garage placeholder, Mr. Chen NPC, dialogue popup, chain/derailleur mission trigger, and a reward-intent event bridge.
- Add docs for how to open the Godot project from C:\Godot.
- Add tests for the React bridge event schema.

After implementation, run tests/build and report changed files.
```
