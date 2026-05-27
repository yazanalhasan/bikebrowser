# Act 1 Commit Inventory

Date: 2026-05-27

## Commit Scope

This commit prepares the completed `/game-rebuild` Act 1 substrate and polish pass for review. It should include only the Phaser `/game-rebuild` route, Act 1 data/systems/scenes, Act 1 docs, Act 1 Playwright tests, and scoped visual capture artifacts.

## Act 1 Docs

- `docs/game_rebuild/act1_baseline_report.md`
- `docs/game_rebuild/act1_master_contract.md`
- `docs/game_rebuild/act1_completion_report.md`
- `docs/game_rebuild/act1_visual_validation_report.md`
- `docs/game_rebuild/act1_art_production_brief.md`
- `docs/game_rebuild/act1_polish_pass_report.md`
- `docs/game_rebuild/act1_commit_inventory.md`
- `docs/game_rebuild/act1_excluded_dirty_worktree.md`
- `docs/game_rebuild/act1_staged_diff_review.md`

## Game-Rebuild Foundation Docs

These are included because they define the new `/game-rebuild` substrate that Act 1 is built on:

- `docs/game_rebuild/game_graphics_reset_audit.md`
- `docs/game_rebuild/game_design_source_of_truth.md`
- `docs/game_rebuild/visual_bible.md`
- `docs/game_rebuild/art_pipeline.md`
- `docs/game_rebuild/rebuild_verification_report.md`

## Act 1 Data Files

- `src/game/data/act1/act1Quests.js`
- `src/game/data/act1/act1Characters.js`
- `src/game/data/act1/act1Locations.js`
- `src/game/data/act1/act1Materials.js`
- `src/game/data/act1/act1NotebookEntries.js`
- `src/game/data/act1/act1Dialogue.js`
- `src/game/data/act1/act1Ecology.js`
- `src/game/data/act1/act1Chemistry.js`
- `src/game/data/act1/act1MapRegions.js`
- `src/game/data/act1/act1AssetManifest.js`
- `src/game/data/act1/index.js`

## Portable Systems

- `src/game/phaser/systems/Act1RuntimeSystem.js`
- `src/game/phaser/systems/AssetRegistry.js`
- `src/game/phaser/systems/BikeSystem.js`
- `src/game/phaser/systems/CameraSystem.js`
- `src/game/phaser/systems/ChemistrySystem.js`
- `src/game/phaser/systems/ConstructionSystem.js`
- `src/game/phaser/systems/DebugDiagnosticSystem.js`
- `src/game/phaser/systems/DialogueSystem.js`
- `src/game/phaser/systems/DiscoveryMapSystem.js`
- `src/game/phaser/systems/EcologyObservationSystem.js`
- `src/game/phaser/systems/InputSystem.js`
- `src/game/phaser/systems/InteractionSystem.js`
- `src/game/phaser/systems/InventorySystem.js`
- `src/game/phaser/systems/LanguageSystem.js`
- `src/game/phaser/systems/MaterialsLabSystem.js`
- `src/game/phaser/systems/NotebookSystem.js`
- `src/game/phaser/systems/QuestSystem.js`
- `src/game/phaser/systems/SaveSystem.js`
- `src/game/phaser/systems/TrustSystem.js`

## Game-Rebuild Scene And Shell Files

- `src/game/GameShell.jsx`
- `src/game/game-shell.css`
- `src/game/index.js`
- `src/game/legacy/README.md`
- `src/game/art/placeholder/.gitkeep`
- `src/game/art/generated/.gitkeep`
- `src/game/art/curated/.gitkeep`
- `src/game/art/final/.gitkeep`
- `src/game/phaser/createGame.js`
- `src/game/phaser/scenes/BootScene.js`
- `src/game/phaser/scenes/PreloadScene.js`
- `src/game/phaser/scenes/WorldMapScene.js`
- `src/game/phaser/scenes/NeighborhoodScene.js`
- `src/game/phaser/scenes/QuestScene.js`
- `src/game/phaser/scenes/DialogueScene.js`
- `src/game/phaser/scenes/DebugScene.js`

## Phaser Data Re-Exports

- `src/game/phaser/data/characters.js`
- `src/game/phaser/data/dialogue.js`
- `src/game/phaser/data/items.js`
- `src/game/phaser/data/locations.js`
- `src/game/phaser/data/quests.js`

## Route Files

- `src/renderer/pages/GameRebuildPage.jsx`
- `src/renderer/App.jsx`
- `src/renderer/components/AppLayout.jsx`
- `src/renderer/utils/uxSafety.js`

## Act 1 Playwright Tests

- `tests/e2e/game-rebuild.smoke.spec.js`
- `tests/e2e/game-rebuild.act1-complete.spec.js`
- `tests/e2e/game-rebuild.act1-visual-capture.spec.js`
- `tests/e2e/game-rebuild.act1-polish.spec.js`

## Scoped Visual Captures

Included if staged:

- `playtest_captures/game_rebuild_act1_complete/01_act1_start.png`
- `playtest_captures/game_rebuild_act1_complete/02_bike_repair_notebook.png`
- `playtest_captures/game_rebuild_act1_complete/03_bridge_discovery.png`
- `playtest_captures/game_rebuild_act1_complete/04_material_testing.png`
- `playtest_captures/game_rebuild_act1_complete/05_ecology_interaction.png`
- `playtest_captures/game_rebuild_act1_complete/06_chemistry_interaction.png`
- `playtest_captures/game_rebuild_act1_complete/07_trust_language_notebook.png`
- `playtest_captures/game_rebuild_act1_complete/08_bridge_repaired_map_unlock.png`

## Explicitly Not Included

- Godot runtime/tire rig changes
- Bike repair Aseprite/PNG assets under `BikeBrowserWorld`
- ComfyUI helper scripts and toolchain audit documents
- Broad `project_audit` scratch/audit files
- unrelated screenshots and visual diff folders
