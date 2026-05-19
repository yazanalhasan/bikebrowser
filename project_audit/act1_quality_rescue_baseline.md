# Act 1 Quality Rescue Baseline

Timestamp: 2026-05-19 00:25 PDT
Workspace: `C:\dev\bikebrowser`
Canonical route: `/play` Godot export

## Summary

The baseline confirms the existing technical path is mostly green, but the user-facing quality failures are real: browser audio is not audibly proven after unlock, the initial /play experience has no sound affordance, and existing Godot rig validation does not catch the chain/tire visual-read problems.

## Commands Run

| Check | Result | Notes |
| --- | --- | --- |
| `Invoke-WebRequest http://localhost:5173/play` | PASS | Returned HTTP 200. |
| Playwright /play boot + click/key unlock probe | PARTIAL | Godot booted and accepted first click/key; no browser-level proof of audible playback. |
| `npm run build` | PASS | Vite build completed. Chunk-size warnings remain. |
| `godot --headless --path BikeBrowserWorld --script tests/vertical_slice_check.gd` | PASS | Exit 0; resource leak warnings at shutdown. |
| `godot --headless --path BikeBrowserWorld --script tests/chain_rig_state_check.gd` | PASS | Exit 0; does not validate visual rear-drivetrain alignment. |
| `godot --headless --path BikeBrowserWorld --script tests/tire_rig_state_check.gd` | PASS | Exit 0; does not validate final visual quality. |
| `godot --headless --path BikeBrowserWorld --script project_audit/runtime_repair_smoke.gd` | PASS | Exit 0. |
| `./tools/export-godot-web.ps1` | PASS | Export completed. |

## Screenshots / Captures

- `project_audit/act1_quality_rescue_screens/play_initial.png`: /play during Godot loading.
- `project_audit/act1_quality_rescue_screens/play_after_unlock_attempt.png`: world after first click/key unlock attempt.
- `project_audit/act1_quality_rescue_screens/play_audio_probe.json`: browser frame/audio/console probe.

Station-specific captures are still needed for ChainRig, TireRig, plant observation, and Salt River after the lane agents expose or drive deterministic entry points.

## Audio Truth Check

After a click in the Godot iframe and a Space key press:

- Browser saw `window.AudioContext` support inside the Godot frame.
- Browser found `BikeBrowserAudio` on the frame.
- Browser found 0 HTML `audio` elements.
- Console reported `audio mappings: 7/7` from runtime validation.
- No baseline evidence proves actual audible music, cue playback, or TTS after the user gesture.
- No visible "tap/click to enable sound" affordance was visible in the screenshot.

Baseline status: audio is not fixed until a browser /play test confirms audible behavior after gesture.

## Visual / Learning Baseline Findings

- Chain and tire state tests pass, but they only prove scripted state progression. They do not prove that ChainRig reads as rear drivetrain work or that TireRig is production-quality.
- The first /play screenshot still has translucent overlap clutter near travel labels and reward/review prompts. This is not the central rescue scope, but it is a residual visual risk.
- Plant observation and Salt River learning are not represented in the baseline screenshot; they need direct station capture plus new validation hooks.

## Immediate Validation Gaps

- Need deterministic route or test hooks to open/capture ChainRig, TireRig, plant matching, and Salt River learning stations.
- Need audio unlock regression that can observe the game's own sound-state flags/logs, not just a successful boot.
- Need validation that ChainRig overlay anchors to the rear drivetrain composition.
- Need validation for plant mastery, water evidence conclusion, notebook entries, inventory recipe unlocks, and creative artifacts.

## Validation-Agent Addendum - 2026-05-19 00:37 PDT

Baseline commands rerun from C:\dev\bikebrowser:

| Check | Result | Evidence |
| --- | --- | --- |
| npm run build | PASS | Vite built successfully; existing large chunk and package module-type warnings remain. |
| npx playwright test tests/e2e/godot-prototype.smoke.spec.js --project=chromium | PASS | 2/2 passed for canonical /play and diagnostics bridge. |
| npx playwright test tests/e2e/full-game-playthrough.smoke.spec.js tests/e2e/flat-tire-flow.smoke.spec.js tests/e2e/mission-inventory-hud.smoke.spec.js tests/e2e/runtime-audit.smoke.spec.js --project=chromium | PASS | 5/5 passed. |
| Godot focused validation suite, 19 existing scripts | PASS | All checked scripts exited 0, including chain, tire, regional readiness, HUD, dialogue, transition, voice, and telemetry checks. |
| tools\export-godot-web.ps1 | PASS | Export exited 0 and refreshed public/godot/BikeBrowserWorld/version.json. |
| Browser /play click/key audio probe | PASS/PARTIAL | BikeBrowserAudio exposed unlock, playRegion, cue, speak; after invocation speechSynthesis.speaking was true. Browser automation cannot prove audible speaker output. |

Additional screenshot paths:

- project_audit/screenshots/play_route_initial.png
- project_audit/screenshots/play_route_after_input.png
- project_audit/screenshots/godot_diagnostics.png

Validation hooks added:

- BikeBrowserWorld/tests/act1_validation_hooks_check.gd verifies current hook coverage for TireRig mechanical snapshots, ChainRig deterministic stepping, plant observation station quest/objective ids, Salt River water station quest/objective ids, inventory serialization, and audio unlock/cue/TTS method exposure.

Concrete defects and gaps:

- Direct ChainRig, TireRig, plant station, and Salt River station screenshots are still blocked by tooling: Godot --headless uses the dummy renderer and returns no viewport image, while /play has no deterministic browser/debug entry point to jump to those specific rigs/stations.
- Browser evidence proves audio/TTS methods can be invoked after a gesture, but not actual audible output from the user's speakers.
- Godot headless checks still emit ObjectDB/resource cleanup warnings after successful exit.
- Rig visual alignment is now better covered by hook/state tests, but still needs pixel-level or deterministic scene-capture validation once a renderable capture path exists.
