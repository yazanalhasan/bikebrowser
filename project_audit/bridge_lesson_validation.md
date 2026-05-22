# Bridge Lesson Validation

Date: 2026-05-22

## Commands Run

- `npm run build`
  - Result: passed.
  - Notes: existing Vite warnings remain for large chunks, CJS Vite Node API deprecation, and package module type.

- `godot --headless --path BikeBrowserWorld --quit`
  - Result: passed with runtime validation `0 errors, 1 warning`.
  - Notes: existing ObjectDB/resource-at-exit warnings remain.

- `godot --headless --path BikeBrowserWorld --script res://tests/bridge_triangle_lesson_content_check.gd`
  - Result: passed.

- `godot --headless --path BikeBrowserWorld --script res://tests/bridge_notebook_lesson_interaction_check.gd`
  - Result: passed.

- `godot --headless --path BikeBrowserWorld --script res://tests/notebook_inventory_check.gd`
  - Result: passed.

- `godot --headless --path BikeBrowserWorld --script res://tests/vertical_slice_check.gd`
  - Result: passed.

- `godot --headless --path BikeBrowserWorld --script res://tests/act1_player_path_check.gd`
  - Result: passed after the bridge presentation was guarded from opening during headless station loops.

- `godot --headless --path BikeBrowserWorld --script res://tests/act1_regional_readiness_check.gd`
  - Result: passed.

- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\export-godot-web.ps1`
  - Result: passed; helper produced no failure output.

## Browser / Playwright Validation

Target:

`http://localhost:5174/play?playtest=1&playtestRegion=bridge_presentation_preview`

Screenshots captured:

- `project_audit/screenshots/bridge_lesson/desktop.png`
- `project_audit/screenshots/bridge_lesson/tablet.png`
- `project_audit/screenshots/bridge_lesson/mobile_portrait.png`
- `project_audit/screenshots/bridge_lesson/mobile_landscape.png`

Console result:

- Fresh Playwright runs showed no bridge notebook asset loading errors after switching texture loading back through Godot resource loading with an `Image.load()` fallback.
- Remaining browser warnings are existing React Router future-flag warnings and occasional WebGL ReadPixels performance warnings during screenshot capture.

## Fixed During Validation

- New PNG assets initially rendered in headless Godot but were missing in the web export when loaded only through `Image.load()`.
  - Fix: `BridgePresentationDiagram.gd` now tries `load(path)` first so exported/imported textures resolve from the packed build, then falls back to `Image.load()` for fresh local files.

- Broader validation exposed a strict typing warning in `UniversalTestingMachine.gd`.
  - Fix: explicitly typed `gauge_value: float`.

- Headless Act 1 station validation was blocked by the real presentation modal opening during station auto-completion.
  - Fix: `QuestObjectiveStation.gd` skips presentation modal emission under the headless display server. The interactive lesson is still covered by `bridge_notebook_lesson_interaction_check.gd`.

## Known Warnings / Risks

- Mobile portrait is readable enough to identify the page, title, central action, and controls, but it remains constrained by the app's current whole-canvas mobile scaling. A later global mobile canvas pass would make all Godot HUD overlays more comfortable.
- Page 2 bridge-family sorting is functional but visually dense. A future polish pass should give each family card more space or split the sorting into two rows/pages.
- Current audio uses restrained cue profiles based on existing stinger assets. Dedicated pencil/wood/paper audio files would improve the tactile feel.
