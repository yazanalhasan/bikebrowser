# Interaction Prompt Reliability Fix

Date: 2026-05-26

## Finding

The `/play` prompt acceptance smoke already existed in `tests/e2e/godot-bike-repair-visual.smoke.spec.js`. It loads the Godot route, focuses the iframe, moves to Mrs. Ramirez, captures the prompt state, sends `KeyE`, then verifies a tap path without console errors.

## Coverage

- `/play?playtest=1&playtestRegion=neighborhood_street`
- iframe focus before keyboard input
- `KeyE` prompt acceptance
- tap/click fallback
- screenshots before and after acceptance
- console/page error guard

## Decision

No Godot input remapping change was needed in this pass. The smoke remains part of the full regression command set.
