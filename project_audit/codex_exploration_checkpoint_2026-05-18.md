# Codex Exploration Checkpoint — 2026-05-18

## Scope

Codex joined the OpenClaw refinement loop with a validation-first pass across the canonical web route, legacy route, Godot export, visual screenshots, CUDA image analysis, and the current Godot repair-rig checks.

## Findings

- `/play` is technically stable and diagnostics stay opt-in, but the canonical Godot wrapper had no visible escape control. For child playtests, this read as a trap risk even though route-level UX exemptions allowed it.
- Mobile portrait `/play` still exposes too much vertical calm space around the playable neighborhood band. The source camera now responds to portrait viewports, but the scene composition still wants a dedicated mobile framing pass.
- The Godot mechanical validation surface is healthy: TireRig, BrakeRig, ChainRig, vertical slice, runtime smoke, and interaction overlap all passed.
- The React/Phaser legacy quest graph remains healthy: the browser playthrough suite completed all current smoke coverage.
- CUDA visual analysis ran successfully on the RTX 5090. Its low-active-pixel findings for non-game utility routes mostly reflect sparse forms/empty states, not immediate game blockers.

## Changes Landed

- Added portrait-aware camera zoom to `BikeBrowserWorld/Systems/World/ZuzuController.gd` so tall mobile viewports frame the playable band more tightly.
- Added a small Lucide home button to `src/renderer/pages/GodotPrototypePage.jsx`, preserving immersive `/play` while giving children a clear way out.
- Added Playwright coverage that asserts the canonical `/play` route keeps that home escape visible while diagnostics remain hidden.
- Refreshed the Godot web export in `public/godot/BikeBrowserWorld/`.

## Validation

- `godot --headless --path BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd` — PASS.
- `godot --headless --path BikeBrowserWorld --script res://tests/vertical_slice_check.gd` — PASS.
- `godot --headless --path BikeBrowserWorld --script res://tests/brake_rig_state_check.gd` — PASS.
- `godot --headless --path BikeBrowserWorld --script res://tests/chain_rig_state_check.gd` — PASS.
- `godot --headless --path BikeBrowserWorld --script res://tests/tire_rig_state_check.gd` — PASS.
- `godot --headless --path BikeBrowserWorld --script res://tests/interaction_overlap_check.gd` — PASS.
- `npm run build` with Node 22.22.3 — PASS.
- `npm run test:e2e:playthrough` — PASS, 4 passed.
- `playwright test godot-prototype.smoke.spec.js` — PASS, 2 passed, after adding the `/play` home escape assertion.
- `tools/export-godot-web.ps1` — PASS; export timestamp `2026-05-18T07:30:42Z`.
- `tools/visual-runtime-capture.mjs` plus `tools/analyze_visual_runtime_cuda.py` — PASS on `NVIDIA GeForce RTX 5090`.

## Risks / Next Actions

- Continue with a deeper mobile Godot framing pass: camera zoom alone helps, but the neighborhood composition is still landscape-first.
- Triage side regions through visual/player value, not route count. The first 15 minutes should remain garage, neighborhood, chain, tire, and safety-check centered.
