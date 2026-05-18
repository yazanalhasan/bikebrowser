# Canonical Experience Convergence

Generated: 2026-05-17

## Result

The canonical player route is now the Godot embodied-world export.

- `/play` loads the Godot BikeBrowserWorld wrapper.
- `/legacy-play` preserves the legacy Phaser shell for recovery, audits, and existing E2E coverage.
- `/godot-prototype` remains as a compatibility alias to the Godot wrapper.
- Electron startup remains on the existing app shell path; the route convergence happens inside the React router and does not replace Electron boot architecture.

## What Changed

- `src/renderer/App.jsx` routes `/play` and `/godot-prototype` to `GodotPrototypePage`.
- `src/renderer/App.jsx` routes `/legacy-play` to the old `GamePage` Phaser container.
- `src/renderer/components/AppLayout.jsx` treats `/play`, `/legacy-play`, and `/godot-prototype` as immersive routes with no app chrome.
- `src/renderer/pages/GodotPrototypePage.jsx` now renders a full-viewport Godot iframe by default instead of a dashboard-style prototype page.
- Godot bridge event handling, save hydration, and diagnostics remain available.

## Convergence Quality

The split identity is substantially reduced. The first player-facing launch path now goes directly into BikeBrowserWorld instead of exposing the Phaser dashboard/toolkit surface. The old system remains available but is no longer emotionally dominant.

## Preserved Boundaries

- No new mechanics were added.
- BrakeRig, ChainRig, and embodied repair grammar were not altered.
- Godot runtime architecture was not redesigned.
- Phaser tooling was contained rather than deleted.
- Telemetry and validation infrastructure were preserved.

## Validation

- `npm run build`: passed.
- `npx playwright test tests/e2e/godot-prototype.smoke.spec.js --project=chromium`: passed after clearing a stale Vite server.
- `npx playwright test tests/e2e/runtime-audit.smoke.spec.js --project=chromium`: passed against `/legacy-play`.
- `tools/export-godot-web.ps1`: passed.

## Remaining Risk

The canonical route now depends on the static Godot web export being current. The export step should stay part of release/playtest preparation so `/play` never points at a stale build.
