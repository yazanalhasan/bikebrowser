# Pre-Ride Check Quest Shipping Report

Date: 2026-05-19
Quest: `act1_pre_ride_check`

## Shipped

- Renamed the runtime safety quest to `act1_pre_ride_check` with the title "Mrs. Ramirez's Pre-Ride Check".
- Kept a legacy alias for `bike_safety_check` in `QuestRegistry` so older hard-coded calls and saves do not strand progress.
- Rebuilt the street safety station into a three-act controller:
  - Act 1: Mrs. Ramirez introduces A-B-C-Quick, Zuzu checks air/brakes/chain/quick items, and discovers the rear flat without failing the checklist.
  - Act 2: Zuzu takes Mrs. Ramirez's rear tube to the garage, Mr. Chen frames the repair, TireRig records the slow leak, and the player marks a leak zone before patching.
  - Act 3: Zuzu returns, reinstalls the tube, and completes a solo final A-B-C-Quick inspection.
- Added runtime voice lines through the existing `AudioService.speak(text, speaker)` pipeline for Mrs. Ramirez and Mr. Chen.
- Added Mrs. Ramirez-specific inventory items:
  - `mrs_ramirez_rear_tube_flat`
  - `mrs_ramirez_rear_tube_repaired`
  - `mrs_ramirez_bike_ready`
- Added notebook support through `QuestRegistry.get_notebook_snapshot()`:
  - A-B-C-Quick page
  - tube leak mark record
  - final capstone wording
- Added six-zone leak marking instead of freehand drawing. This is the scoped version of the creativity moment and avoids introducing a full drawing subsystem.
- Added/updated garage Mr. Chen scene presence and repair dialogue.
- Updated Act 1 regional readiness prerequisites to treat the pre-ride quest as the full bike-systems prerequisite instead of requiring a separate flat tire quest.
- Exported the updated Godot web build into `public/godot/BikeBrowserWorld`.

## Act 1 UX Sweep

The same UX error existed outside the safety quest in generic Act 1 stations: bridge review, workshop first build, and Act 1 capstone could bulk-record all objectives from one interaction. That made multi-step review/build objectives read like lessons but behave like a single tap.

Fix shipped: `QuestObjectiveStation.gd` now records one objective per interaction, updates prompt text to the next objective, emits per-step feedback, and only completes the quest after all configured objectives have been individually advanced. Existing Act 1 path tests were updated to validate the multi-step station behavior.

Remaining design debt:

- `first_safety_check` still exists as an orphan/legacy mission file. It is not in the Act 1 spine, but should be deleted or explicitly marked deprecated in a cleanup pass.
- The current notebook diagram is text/state rendered in the notebook snapshot, not a custom illustrated notebook UI panel. It meets the six-zone deduction requirement but is not yet a bespoke sketchbook drawing surface.
- Browser audio verification confirms the route and runtime pipeline, but automated tests do not assert audible TTS playback quality. Headless Godot logs native TTS fallback as expected.

## Validation

Godot source checks:

- `godot --headless --path BikeBrowserWorld --script res://tests/safety_hold_requires_npc_dialog_check.gd` passed.
- `godot --headless --path BikeBrowserWorld --script res://tests/safety_check_brake_integration_check.gd` passed.
- `godot --headless --path BikeBrowserWorld --script res://tests/act1_hud_guidance_check.gd` passed.
- `godot --headless --path BikeBrowserWorld --script res://tests/act1_regional_readiness_check.gd` passed.
- `godot --headless --path BikeBrowserWorld --script res://tests/notebook_inventory_check.gd` passed.
- `godot --headless --path BikeBrowserWorld --script res://tests/act1_player_path_check.gd` passed.
- `godot --headless --path BikeBrowserWorld --script res://tests/tire_rig_state_check.gd` passed.
- `godot --headless --path BikeBrowserWorld --script res://tests/brake_rig_state_check.gd` passed.

Browser/export checks:

- `godot --headless --path BikeBrowserWorld --export-release "Web Single Threaded" exports/web/index.html` passed.
- Copied `index.html`, `index.js`, `index.wasm`, and `index.pck` into `public/godot/BikeBrowserWorld`.
- `npx playwright test tests/e2e/godot-prototype.smoke.spec.js tests/e2e/full-game-playthrough.smoke.spec.js tests/e2e/flat-tire-flow.smoke.spec.js --project=chromium --reporter=line` passed: 4/4.

Known validation note: Godot headless reports ObjectDB/resource cleanup warnings at process exit. These existed in the runtime checks and did not fail the scripts.

## Screenshot Evidence

Current automated screenshot coverage is still route-level rather than quest-phase-level. The available Playwright checks confirm the exported `/play` route boots and the browser runtime playthrough remains green. Phase-specific screenshot capture should be added after debug hooks can place the player at each pre-ride quest phase without manual movement.

Required future screenshot hooks:

- `act1_pre_ride_check:air_rear_flat_found`
- `act1_pre_ride_check:leak_marked`
- `act1_pre_ride_check:final_air_checked`
- notebook open state for A-B-C-Quick page and tube repair record

