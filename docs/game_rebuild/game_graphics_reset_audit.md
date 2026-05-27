# Game Graphics Reset Audit

Date: 2026-05-27

## Scope

Phase 1 audit for rebuilding the Phaser game graphics substrate from first principles while preserving quest/world intent and avoiding blind gameplay rewrites.

## Current Game Routes And Entry Points

Current React routes in `src/renderer/App.jsx`:

- `/play` -> `GodotPrototypePage` (current canonical Godot route)
- `/legacy-play` -> `GamePage` (legacy Phaser game)
- `/godot-prototype` -> `GodotPrototypePage`
- `/play3d` -> `Game3DPage`

The Phaser game is currently reachable through `/legacy-play`, not `/play`.

Phaser React wrapper:

- `src/renderer/pages/GamePage.jsx`
- `src/renderer/game/GameContainer.jsx`

## Phaser Initialization Path

Current Phaser boot path:

1. `GamePage.jsx`
2. `GameContainer.jsx`
3. `createGameConfig()` from `src/renderer/game/config.js`
4. Phaser registers all scenes from `src/renderer/game/scenes`
5. Start scene is derived from save state; default behavior starts the existing legacy scene stack.

The current Phaser wrapper also owns substantial surrounding UI: start screen, HUD, inventory, dialogue overlay, pause, speech, reports, crafting, and runtime audit.

## Current Scene List

Registered in `src/renderer/game/config.js`:

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
- `GarageScene`
- `NeighborhoodScene`
- `LayoutEditorOverlayScene`

Additional base/editor files exist:

- `BaseSubScene.js`
- `LocalSceneBase.js`
- `LabRigBase.js`
- `editor-scenes/GarageSceneBase.js`
- `editor-scenes/NeighborhoodSceneBase.js`

## Current Asset Folders

Phaser-local code/data folders:

- `src/renderer/game/data`
- `src/renderer/game/entities`
- `src/renderer/game/prefabs`
- `src/renderer/game/scenes`
- `src/renderer/game/systems`
- `src/renderer/game/ui`
- `src/renderer/game/audio`

Godot/world art folders are extensive under:

- `BikeBrowserWorld/Assets`

Current Phaser has no clean `src/game/art/generated`, `curated`, `final`, and `placeholder` split.

## Current Game Tests

Existing Playwright smoke tests under `tests/e2e` include:

- `flat-tire-flow.smoke.spec.js`
- `full-game-playthrough.smoke.spec.js`
- `gameplay-report-panel.smoke.spec.js`
- `godot-bike-repair-visual.smoke.spec.js`
- `godot-level-editor.smoke.spec.js`
- `godot-prototype.smoke.spec.js`
- `mission-inventory-hud.smoke.spec.js`
- `route-coherence.smoke.spec.js`
- `runtime-audit.smoke.spec.js`

Current npm test entry points:

- `npm run test:e2e`
- `npm run test:e2e:smoke`
- `npm run test:e2e:playthrough`

Relevant non-browser tests:

- `tests/mechanical-state-simulation.test.mjs`
- `tests/mechanical-reasoning-graph.test.mjs`
- `tests/godot-bridge.test.mjs`

## Current Docs Relevant To Quests And Arc

Primary:

- `arc.md`

Relevant repo docs:

- `docs/revised-world-architecture.md`
- `docs/revised-region-plan.md`
- `docs/revised-domain-systems.md`
- `docs/PHASER_EDITOR_MIGRATION.md`
- `docs/godot-migration-audit.md`
- `docs/godot-full-live-playthrough-audit.md`
- `docs/dev/quest_wiring_gate.md`

Relevant project audits:

- `project_audit/bridge_quest_truth_pass.md`
- `project_audit/registered_quest_reconciliation.md`
- `project_audit/data_only_quest_resolution.md`
- `project_audit/pre_ride_check_quest_design.md`
- `project_audit/pre_ride_check_quest_report.md`
- `project_audit/interactive_quest_playtest_audit_2026-05-22.md`

Relevant Godot docs/audits:

- `BikeBrowserWorld/docs/zuzu-character-guide.md`
- `BikeBrowserWorld/docs/tutorial_first_15_minutes.md`
- `BikeBrowserWorld/docs/bridge_material_testing_mini_game.md`
- `BikeBrowserWorld/docs/visual-style-guide.md`
- `BikeBrowserWorld/docs/visual-production-rules.md`
- `BikeBrowserWorld/docs/art-pipeline.md`
- `BikeBrowserWorld/docs/asset_inventory.md`
- `BikeBrowserWorld/project_audit/quest_system_audit.md`
- `BikeBrowserWorld/project_audit/quest_flow_map.md`

## What Should Be Preserved

- Narrative intent from `arc.md`: Sonoran Desert local adventure scaling into global/space systems thinking.
- Main character: Zuzu as a child bike/adventure learner.
- Core Act 1 concepts: bike repair, bridge/dry wash, material testing, desert ecology, neighborhood mentors.
- Quest/world/character docs as canonical intent.
- Useful existing systems as behavioral references: quest progression, dialogue patterns, save shape, runtime audit expectations.
- Existing tests as regression references, especially route load, canvas presence, quest smoke, and playthrough expectations.
- Non-game BikeBrowser routes.

## What Should Be Discarded As Visual Foundation

- Existing Phaser scene art/layout as a visual reference.
- Any scene whose look is defined by opportunistic rectangles, scattered props, debug-like labels, or inconsistent asset scale.
- Direct reliance on messy old asset folders as visual source of truth.
- Scene-local hardcoding of quest logic.
- Current visual route of "patching the scene until it looks okay."

## What Should Be Quarantined As Legacy

- `src/renderer/game/scenes/*` existing scene implementations.
- `src/renderer/game/editor-scenes/*`.
- Existing Phaser entities/prefabs that encode old visual assumptions.
- Existing asset pack references.
- Old `src/renderer/game/config.js` scene registration path for `/legacy-play`.

Quarantine should avoid deletion. The old code remains useful for intended interactions, current routing, tests, save compatibility, and constants.

## Risks Before Making Changes

- `/play` is currently canonical Godot. Replacing it with Phaser would break current Godot acceptance tests. The rebuild should introduce a new Phaser rebuild route or update tests deliberately.
- `GameContainer.jsx` is large and intermingles React HUD/dialogue/reporting with Phaser boot. A clean shell should be introduced without deleting the legacy wrapper.
- Existing tests assume `/legacy-play` remains available. Keep it stable while building the new route.
- Existing save states may reference old Phaser scene keys.
- Moving files can break imports if done mechanically. Prefer new `src/game` architecture plus explicit legacy boundary.
- Generated/curated/final art folders should be created empty or with clean placeholders; do not migrate messy art as production.
- Phaser implementation uses JavaScript today, not TypeScript. Introducing TypeScript may require Vite/tsconfig setup. Use `.js` first for a low-risk substrate.
