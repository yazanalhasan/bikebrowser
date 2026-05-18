# Legacy Tooling Containment

Generated: 2026-05-17

## Result

Legacy Phaser tooling remains available, testable, and recoverable, but it is no longer the canonical player route.

## Current Route Ownership

- `/play`: canonical Godot embodied experience.
- `/godot-prototype`: compatibility alias for the Godot wrapper.
- `/legacy-play`: legacy Phaser shell and existing Phaser test surface.
- `/play3d`: unchanged existing 3D route.

## Test Containment

- `tests/e2e/helpers/gameBoot.js` now defaults Phaser boot helpers to `/legacy-play`.
- `tests/e2e/runtime-audit.smoke.spec.js` passed against the legacy route.
- `tests/e2e/godot-prototype.smoke.spec.js` now verifies canonical `/play` and opt-in Godot diagnostics.
- `tests/README.md` now describes Phaser E2E booting through `/legacy-play`.

## Tooling Preserved

- Phaser `GamePage` and `GameContainer` were not removed.
- The gameplay report panel and BUG button remain available in the legacy route.
- Existing runtime audit access through `window.__phaserGame` remains testable.
- Route/audit helper scripts were updated to recognize both canonical Godot and legacy Phaser paths.

## Containment Quality

The old surface is recoverable without competing with the main player experience. This is the right posture for a live transition: preserve test infrastructure, but stop presenting the old dashboard-like runtime as the authored game.

## Remaining Risk

Older audit documents still describe the pre-convergence state. They are useful historical context but should not be treated as current route truth after this sprint.
