# Act 1 Performance And Stability Report

Date: 2026-05-18
Agent: Systems-Validation-Agent
Workspace: `C:\dev\bikebrowser`

## Summary

The current Act 1 validation pass is stable across headless Godot, Godot web export, Vite build, canonical `/play` smoke, legacy regression smoke, and Node unit tests. No blocking crash, missing critical reward, missing capstone gate, or browser smoke failure was found.

## Gate Results

- Godot project boot: passed in 2.6s.
- Act 1 regional readiness gate/reward check: passed in 2.9s.
- Act 1 player path scene-station check: passed in 3.2s.
- Act 1 HUD guidance check: passed in 2.8s.
- Act 1 modal interaction guard check: passed in 3.3s.
- Playtest rig telemetry check: passed in 2.6s.
- Vertical slice check: passed in 3.4s.
- Brake, chain, tire, overlap, transition, and dialogue guard checks: passed.
- Godot web export: passed in 4.5s.
- Vite build: passed in 10.1s.
- `/play` Godot prototype Playwright smoke: 2 passed in 2.4s.
- Mission/inventory HUD and route coherence Playwright smoke: 4 passed in 14.4s.
- Playthrough/runtime Playwright smoke: 4 passed in 19.7s.
- Godot bridge and mechanical reasoning Node tests: 14 passed in 167ms.

## Stability Observations

- No validation command exited non-zero.
- No missing critical Act 1 mission files were detected.
- No missing item-backed capstone rewards were detected.
- Capstone lock/unlock behavior is explicitly tested.
- Scene-station completion path is explicitly tested for bridge, garage workshop, desert, mine, river, and capstone stations.
- Telemetry observes TireRig, records first engagement, records verification, captures at least five state transitions, and reaches `tire_verified`.

## Performance Observations

- Headless Godot checks are short, generally 2.4s to 4.3s each.
- Export and frontend build complete quickly enough for routine validation.
- Browser smoke remains under 20s for the playthrough/runtime bundle on this machine.
- Build output still contains large minified chunks:
  - `vendor-rapier`: about 2,081 kB
  - `vendor-phaser`: about 1,478 kB
  - `vendor-three`: about 740 kB
  - `GamePage`: about 720 kB

## Warnings And Non-Blocking Risks

- Godot headless success paths still sometimes emit ObjectDB/resource cleanup warnings, usually reporting 1-3 resources still in use at exit.
- Vite reports large chunk warnings for game and vendor bundles.
- Vite reports the deprecated CJS Node API warning.
- Node reports package module type inference warnings for ES module files in a package without `"type": "module"`.
- Browser tests validate boot, HUD, event bridge, and deterministic playthrough behavior, but they do not replace a manual readability pass for mobile comfort, emotional pacing, or mentor presence.

## Current Stability Verdict

Act 1 is technically stable enough for continued content validation and human playtesting. The remaining risk is not a failing gate; it is product truthfulness from the authoritative task list: hidden backend quests, optional content expectations, and qualitative mentor/item/world surfacing still need explicit resolution before a full Act 1 completion claim.
