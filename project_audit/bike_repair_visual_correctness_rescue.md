# Bike Repair Visual Correctness Rescue

Date: 2026-05-22
Workspace: `C:\dev\bikebrowser`

## Scope

This pass targeted the visibly broken bike-repair core interactions found in `project_audit/interactive_quest_playtest_audit_2026-05-22.md`:

- Chain repair read backwards: the rear wheel/sprocket appeared forward of the crank for a right-facing bike.
- Tire repair read as scattered props rather than one coherent repair mechanism.
- The applied patch used packet/kit-style art instead of a single rubber tube patch.
- The visible NPC prompt did not have a browser-level tap/click acceptance path.
- There was no close-up regression capture for the chain/tire repair states.

## Fixes

### Chain correctness

- Reoriented `ChainRigEmbedded.tscn` so the rear wheel and sprocket sit behind the crank on the right-facing bike.
- Updated `ChainRig.gd` slipped/seated chain paths so the chain travels from the front chainring back to the rear drivetrain.
- Updated `SlippedChainStation.tscn` frame geometry so the visual bike frame matches the corrected drivetrain direction.
- Added alignment assertions to `chain_rig_state_check.gd`:
  - bike declares a right-facing direction
  - rear sprocket sits behind crank
  - chain runs back to the rear drivetrain
  - slipped chain remains live RigidBody2D links with PinJoint2D joints

### Tire repair staging

- Restaged `TireRig.tscn` as a single repair-mat mechanism:
  - centered wheel/tire
  - tube partially pulled out near the wheel
  - leak marker and patch share the same position
  - floor pump connects by hose
  - repair tools and supplies are grouped on the same mat
- Updated `TireRig.gd` so the exposed tube and patch keep their authored base transforms instead of scaling into oversized artifacts during state changes.

### Patch art

- Added `BikeBrowserWorld/Assets/Props/BikeRepair/single_tube_patch.png`.
- Kept `tire_patch_kit.png` as the supply prop only.
- Swapped the applied `Patch` node to the single patch art and aligned it to `LeakMarker`.
- Added assertions in `tire_rig_state_check.gd` that the applied patch uses `single_tube_patch.png` and remains aligned to the leak marker.

### Prompt acceptance

- Updated `AnimatedNpcInteraction.gd` so interaction areas are input-pickable and can trigger dialogue on left-click/tap when the player is in range.
- Added Playwright prompt smoke coverage for the visible Mrs. Ramirez prompt.

### Visual regression

- Added `bike_repair_visual_preview` debug region for close-up chain/tire repair visual capture.
- Added `tests/e2e/godot-bike-repair-visual.smoke.spec.js`.
- Captured screenshots:
  - `project_audit/screenshots/bike_repair_visual_correctness_rescue/bike_repair_visual_preview.png`
  - `project_audit/screenshots/bike_repair_visual_correctness_rescue/mrs_ramirez_prompt_before_accept.png`
  - `project_audit/screenshots/bike_repair_visual_correctness_rescue/mrs_ramirez_prompt_after_accept.png`

## Validation

Passed:

- `npm run build`
- `npx playwright test godot-bike-repair-visual.smoke.spec.js --project=chromium`
- `godot --headless --path BikeBrowserWorld --quit`
- `godot --headless --path BikeBrowserWorld --script res://tests/vertical_slice_check.gd`
- `godot --headless --path BikeBrowserWorld --script res://tests/chain_rig_state_check.gd`
- `godot --headless --path BikeBrowserWorld --script res://tests/tire_rig_state_check.gd`
- `godot --headless --path BikeBrowserWorld --script res://tests/interaction_overlap_check.gd`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\export-godot-web.ps1`

Known non-blocking validation output:

- Vite reports existing large chunk warnings.
- Vite reports the existing typeless `postcss.config.js` warning.
- Godot reports existing shutdown ObjectDB/resource warnings after headless runs; runtime validation itself reports zero errors.

## Notes

- The Playwright rescue smoke explicitly targets `http://localhost:5174` by default because the existing Playwright base URL on `5173` was serving a stale/non-BikeBrowser app during this pass.
- The debug preview is intentionally narrow: it is a visual correctness harness, not a surfaced player region.
- The repair interactions are now mechanically more coherent, but the tire repair art can still benefit from a later full Aseprite polish pass for cleaner silhouettes.
