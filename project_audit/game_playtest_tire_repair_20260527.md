# Game Playtest - Tire Repair Pass

Date: 2026-05-27

## Scope

Test the game after the TireRig Aseprite repair mat pass.

## Commands Run

```powershell
npm run build
godot --headless --path C:\dev\bikebrowser\BikeBrowserWorld --script res://tests/tire_rig_state_check.gd
powershell -ExecutionPolicy Bypass -File tools\export-godot-web.ps1 -Preset "Web Dev Editor"
npm run test:e2e -- flat-tire-flow.smoke.spec.js godot-prototype.smoke.spec.js route-coherence.smoke.spec.js
$env:BIKEBROWSER_PLAY_BASE_URL='http://localhost:5173'; npm run test:e2e -- godot-bike-repair-visual.smoke.spec.js
npm run test:e2e:playthrough
```

## Results

Passed:

- Vite production build.
- Godot `tire_rig_state_check.gd`.
- Godot web export.
- Phaser flat tire flow smoke.
- Canonical Godot `/play` smoke.
- Route coherence smoke.
- Mobile `/play` load smoke.
- Godot bike repair visual screenshot smoke.
- Mrs. Ramirez prompt keyboard/tap acceptance smoke.
- Full shipped quest browser playthrough smoke.
- Gameplay report panel smoke.
- Runtime audit boot smoke.

## Captures

- `C:\dev\bikebrowser\project_audit\screenshots\bike_repair_visual_correctness_rescue\bike_repair_visual_preview.png`
- `C:\dev\bikebrowser\project_audit\screenshots\bike_repair_visual_correctness_rescue\mrs_ramirez_prompt_before_accept.png`
- `C:\dev\bikebrowser\project_audit\screenshots\bike_repair_visual_correctness_rescue\mrs_ramirez_prompt_after_accept.png`

## Findings

### P1 - Bike repair preview does not yet showcase the finished tire repair clearly

The automated visual smoke passed, but the captured preview still reads too scattered at full-page scale. The tire repair side shows the wheel, pump hose, levers, and supplies, but it does not clearly emphasize the authored repair mat, exposed tube, puncture, and single patch in the preview capture.

Likely cause:

- `BikeRepairVisualPreview.gd` holds the tire rig action for only the first six seconds, so the screenshot catches a transitional state rather than a deliberate final patch state.
- The tire station is also sharing the preview with the chain station, making the tire repair details small.

Recommended fix:

- Update the preview scene to explicitly stage or cycle through tire states: inspect, tube exposed, leak marked, patch applied, inflated/ready.
- Add at least one tire-only close-up screenshot capture for the patch state.

### P3 - Vite `/health` proxy warnings appear when API server is not running

During one Playwright smoke, Vite logged `/health` proxy `ECONNREFUSED` warnings because only the Vite server was running. Gameplay tests still passed.

## Conclusion

Functional game smoke is green. The TireRig implementation loads and validates. The remaining issue is visual presentation in the debug/preview capture: the authored tire repair truth is present in the scene, but the current preview does not show it strongly enough for art review.
