# Bridge Lesson Baseline Audit

Date: 2026-05-22

## Scope

This audit covers the current Mr. Chen bridge lesson flow in BikeBrowserWorld, with emphasis on `bridge_quest_5`, `bridge_material_test`, Mr. Chen dialogue, notebook hooks, bridge assets, Act 1 capstone touchpoints, `BridgeReviewStation`, and the current `/play` bridge presentation preview.

## Where The Lesson Currently Appears

- `BikeBrowserWorld/Data/missions/bridge_quest_5.json`
  - Current quest id: `bridge_quest_5`
  - Current name: `Mr. Chen's Triangle Bridge Lesson`
  - Prerequisite: `chain_repair`
  - Presentation pointer: `presentation_id = mr_chen_triangle_bridge_lesson`
  - Steps currently cover:
    - watch bridge presentation
    - compare bridge types
    - identify bridge parts
    - learn triangles
    - trace load path
    - talk to neighbors
    - receive badge
    - unlock new area

- `BikeBrowserWorld/Data/presentations/mr_chen_triangle_bridge_lesson.json`
  - Contains the current source lesson progression:
    - crossing problem
    - bridge families
    - main parts
    - rectangle wobble
    - triangle truss
    - dry wash load path
  - Uses `demo_type` keys that drive procedural sketches in the HUD overlay.

- `BikeBrowserWorld/Data/dialogue/mr_chen_bridge.json`
  - Contains Mr. Chen bridge dialogue references including `triangle_bridge_presentation`, `triangle_lesson`, and `load_path_wrap`.

- `BikeBrowserWorld/Systems/Interactions/QuestObjectiveStation.gd`
  - `BridgeReviewStation` starts/advances `bridge_quest_5`.
  - When objective `watch_bridge_presentation` is recorded, it loads `mr_chen_triangle_bridge_lesson.json` and emits `presentation_requested`.

- `BikeBrowserWorld/Systems/UI/HudController.gd`
  - Listens for `presentation_requested`.
  - Builds `BridgePresentationPanel` at runtime.
  - Displays title, body text, slide counter, procedural diagram, and `Next` / `Rest` buttons.

- `BikeBrowserWorld/Regions/Debug/BridgePresentationPreview.tscn`
  - Debug-only preview route registered as `bridge_presentation_preview`.
  - Current browser URL for isolated testing:
    - `/play?playtest=1&playtestRegion=bridge_presentation_preview`

- `BikeBrowserWorld/Regions/Neighborhood/NeighborhoodStreet.tscn`
  - Has `BridgeReviewStation` for bridge review in the neighborhood flow.

- `BikeBrowserWorld/Regions/DryWash/DryWash.tscn`
  - Has `BridgeReviewStation` for dry-wash review context.

## What Is Static Or Click-Through

- The current lesson is still slide-forward, not discovery-first.
- The player can advance pages, but does not actually manipulate bridge parts yet.
- `BridgePresentationDiagram.gd` animates diagrams procedurally, but it does not yet provide page-specific tasks such as:
  - placing log/plank/deck crossings
  - sorting bridge families by force behavior
  - labeling deck / abutment / pier
  - pushing a rectangle frame
  - dragging a diagonal brace
  - tracing load path from deck to supports to ground
- Quest objective advancement currently occurs through station interaction, not through completion of the lesson interactions.
- The modal is visually closer to a presentation panel than Mr. Chen's workshop engineering notebook.

## Existing Assets

- `BikeBrowserWorld/Assets/Props/DryWash/test_bridge_segment.png`
  - Used by `QuestObjectiveStation.gd` as bridge station dressing.

- `BikeBrowserWorld/Assets/Props/DryWash/clipboard_bridge_plan.png`
  - Used by `QuestObjectiveStation.gd` and Act 1 regional readiness visuals.

- `BikeBrowserWorld/Data/notes/environmental_notes.json`
  - `garage_bridge_blueprint` already names a truss sketch and notes that triangles share load.

- `BikeBrowserWorld/Regions/Garage/UniversalTestingMachine.tscn`
  - Existing notebook-like material testing rig scene.
  - Contains a `Notebook` Node2D, observation label, header label, stamp, clamp blocks, lever, weight plates, gauge, and sample visuals.

- `BikeBrowserWorld/docs/bridge_material_testing_mini_game.md`
  - Describes a bench-style bridge material test with notebook observations.

## Placeholder Or Temporary Systems

- `BikeBrowserWorld/Systems/UI/BridgePresentationDiagram.gd`
  - Temporary procedural drawing script for bridge diagrams.
  - Useful as a functional prototype, but not an Aseprite-quality final art pass.

- `BikeBrowserWorld/Regions/Debug/BridgePresentationPreview.gd`
  - Useful for isolated preview, but still emits the same modal lesson instead of a dedicated notebook scene.

- `bridge_material_test`
  - `BikeBrowserWorld/Data/missions/bridge_material_test.json` is marked `deprecated: true` and `supersededBy: bridge_quest_3`.
  - It still contains useful concept language for material testing, but should not become the main bridge notebook lesson.

- Legacy web quest data:
  - `src/renderer/game/data/quests.js` has a `bridge_collapse` quest with triangle/truss lesson content.
  - It is content parity support, not the canonical Godot in-world lesson.

## Notebook Hooks

- `BikeBrowserWorld/Core/QuestRegistry/QuestRegistry.gd`
  - `get_notebook_snapshot()` feeds HUD notebook sections.
  - `_notebook_sketches()` currently adds sketches for:
    - tube leak map
    - A-B-C-Quick
    - Mrs. Ramirez tube repair
    - Chain path
    - Plant notes
    - Regional questions
  - It does not yet add a bridge notebook artifact for:
    - bridge families sketch
    - triangle brace insight
    - load path sketch

- `BikeBrowserWorld/Systems/UI/HudController.gd`
  - Notebook overlay already exists as `QuestNotebookPanel`.
  - `Sketches And Notes` section reads from `QuestRegistry.get_notebook_snapshot().sketches`.

## Act 1 Capstone Touchpoints

- `BikeBrowserWorld/Data/missions/act1_regional_readiness.json`
  - Requires `bridge_quest_5`.
  - Uses `dialogue_refs: ["mr_chen_bridge.triangle_lesson"]`.

- `BikeBrowserWorld/Core/QuestRegistry/QuestRegistry.gd`
  - `_capstone_clues()` currently mentions bridge shapes as part of systems thinking once Act 1 readiness unlocks.

## Interaction Hooks That Already Exist

- `QuestObjectiveStation.gd` can load a presentation from a quest's `presentation_id`.
- `EventBus.emit_game_event("presentation_requested", ...)` already routes bridge lesson payloads into HUD.
- `HudController.gd` can block world input while an overlay is open.
- `BridgePresentationPreview` lets the lesson be loaded alone through playtest region routing.
- `QuestRegistry.set_quest_note()` can record extra quest-state data and emit notebook updates, but the bridge lesson does not use it yet.

## What Needs Aseprite Art

Final notebook art should replace or augment the current procedural placeholder diagrams:

- notebook paper background
- taped notes, smudges, grease marks, page tabs
- Mr. Chen pencil marks and arrows
- dry wash mini-scene
- bridge family mini-cards:
  - beam
  - arch
  - frame
  - cable-stayed
  - suspension
  - truss
- bridge parts labels:
  - deck / superstructure
  - abutment
  - pier / support
- rectangle frame states:
  - square/rectangular
  - racked parallelogram
- diagonal brace piece
- triangle truss states:
  - unbraced
  - braced
  - stable under push
- force arrows / load path sprites
- notebook completion badge/sketch

## Baseline Verdict

The current bridge lesson is functionally wired but not yet the desired experience. It appears in the game, can be previewed alone, and contains the right educational sequence. However, it remains a modal, text-forward presentation with procedural drawings. The next pass must convert it into Mr. Chen's workshop engineering notebook: page-based, warm, tactile, interactive, and built around visible player actions that make rectangles wobble, triangles stiffen, and load paths trace into the ground.
