# Overnight Baseline Status — 2026-05-18

## Environment

- Workspace: `C:\dev\bikebrowser`
- Branch: `repair/runtime-canonicalization` ahead of origin by 3 commits
- Node: `v22.22.3`
- npm: `10.9.8`
- Godot: `4.6.2.stable.official.71f334935`
- OpenClaw: `OpenClaw 2026.5.12 (f066dd2)`

## Git State

The baseline began with an already-dirty worktree containing Godot scene/test changes, generated exports/screenshots, OpenClaw/Codex audit artifacts, telemetry/capture directories, and recent route/runtime changes. This pass preserves that worktree and will only stage files intentionally touched during the pass.

## Baseline Validation

| Check | Result | Notes |
| --- | --- | --- |
| `npm run build` | PASS | Vite build completed. Existing warnings: Vite CJS API deprecation, typeless `postcss.config.js`, large chunks. |
| `npm run test:e2e` | PASS | 8/8 Playwright tests passed, including canonical `/play`, legacy quest playthrough, mission/inventory HUD, and runtime audit. |
| `godot --headless --path BikeBrowserWorld --quit` | PASS | RuntimeValidator: 0 errors, 1 warning. Known headless ObjectDB/resource shutdown messages printed after success. |
| `runtime_repair_smoke.gd` | PASS | Runtime smoke passed; RuntimeValidator: 0 errors, 1 warning. |
| `vertical_slice_check.gd` | PASS | Vertical slice check passed. |
| `brake_rig_state_check.gd` | PASS | BrakeRig state machine passed. |
| `chain_rig_state_check.gd` | PASS | ChainRig state machine passed. |
| `tire_rig_state_check.gd` | PASS | TireRig state machine passed. |
| `chain_hotspot_embodied_check.gd` | PASS | Chain hotspot embodied check passed. |
| `interaction_overlap_check.gd` | PASS | Interaction topology passed. |
| `tools/export-godot-web.ps1` | PASS | Godot web export refreshed successfully. |

## Baseline Assessment

Baseline is healthy enough to continue exploration. Canonical `/play` remains Godot-backed and tested. `/legacy-play` remains available and covered by the existing Phaser playthrough/runtime smoke tests.

## Immediate Watch Items

- Mobile portrait `/play` still deserves deeper framing review beyond the first camera fix.
- Existing dirty files should be committed only in intentional, scoped checkpoints.
- Large production chunks remain a performance smell, but not a first-15-minute playtest blocker.
