# Act 1 Polish Pass Report

Date: 2026-05-27

## Summary

This pass improved the existing `/game-rebuild` Act 1 vertical slice without replacing the portable systems or chasing final art. The slice now has better movement feel, clearer interaction feedback, stronger notebook rewards, richer UTM/bridge evidence feedback, warmer NPC pacing, stronger diagnostics, and expanded Playwright/CUDA validation.

## Gameplay Feel

- Added acceleration/deceleration smoothing to player movement.
- Added prompt easing when entering interaction zones.
- Added visible interaction halos around stations.
- Added compact feedback toast for important discoveries, tests, trust changes, bridge progress, and map unlocks.
- Added environmental story cues: bike tracks, flood line, workshop/test hints, and restrained route signaling.

## Notebook Improvements

- Notebook now tracks new entries separately from unlocked entries.
- Notebook view shows total progress and category progress.
- New evidence is marked until the notebook is opened.
- Runtime feedback announces meaningful notebook unlocks.
- Notebook remains a field notebook rather than a large menu system.

## UTM / Material Testing

- Material results now include `deformation`, `strengthBand`, usefulness, explanation, and best use.
- Testing produces feedback messages that compare material behavior.
- Bridge planning requires tested evidence before accepting the plan.
- Weak-scrap-only bridge plans are explicitly rejected with a readable reason.

## Bridge / Map Progression

- Bridge plans now include load-path data.
- Bridge repair gives clearer failure feedback when attempted before planning.
- Wider map unlock is gated behind an actually reconnected bridge.
- Bridge completion and wider-map unlock produce restrained, rewarding feedback.

## NPC / Trust / Language

- Dialogue was tightened for warmth and pacing.
- Spanish and Arabic remain contextual and relationship-based.
- Trust feedback now connects social progress to evidence and care.
- Cultural content remains intentionally shallow pending human-authored briefs.

## Ecology / Chemistry

- Ecology feedback emphasizes heat, water, shade, and restraint.
- Chemistry feedback emphasizes mix, wait, test.
- Both systems remain interaction-led rather than lecture-led.

## Diagnostics / Validation

Expanded `window.__GAME__.runAct1Diagnostic()` checks:

- quest transition validity
- dialogue objective reference validity
- required dialogue chains
- duplicate notebook entries
- bridge state consistency
- reachable interaction zones
- purposeful interaction zones
- no generated art directly in runtime

Added `tests/e2e/game-rebuild.act1-polish.spec.js` covering:

- movement responsiveness
- notebook/new-entry feedback
- invalid bridge plan rejection
- tested bridge plan acceptance
- map gate progression gating
- diagnostic integrity
- corrupted save recovery
- architecture guard against scene-side quest hacks

## Visual QA

Updated visual captures:

- Act 1 start
- bike repair/notebook
- bridge discovery
- material testing
- ecology interaction
- chemistry interaction
- trust/language/notebook
- bridge repaired/map unlock

CUDA visual runtime analysis:

- GPU: NVIDIA GeForce RTX 5090
- Images analyzed: 8
- Findings: 0
- Output: `project_audit/visual_runtime_analysis.json`

## Commands Run

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete
```

## Unresolved Tensions

- Placeholder art is clearer but still not production quality.
- UTM, chemistry, bridge, and ecology need future close-up interaction panels.
- Spanish and Arabic content need human-authored cultural briefs before deeper use.
- Route ergonomics still needs a human walking playtest.
- Visual QA currently catches broad runtime issues, not semantic child-comprehension failures.

## Next Recommended Phase

Run a human playtest focused on station discoverability, notebook satisfaction, and whether the player understands: observe -> test -> compare -> decide -> build -> unlock. Then produce Aseprite briefs for the first production-art targets without changing the systems architecture.
