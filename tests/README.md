# BikeBrowser E2E tests

Playwright-driven smoke tests that boot the game in a real browser and
assert against the running renderer. This is the **runtime** validation
layer — distinct from the static `scripts/check-*.mjs` audits.

## Running locally

One-time setup (installs the chromium browser binary):

```
npm run test:e2e:install
```

Run the smoke suite:

```
npm run test:e2e:smoke
```

Run all E2E tests:

```
npm run test:e2e
```

The Vite dev server is started automatically by Playwright if it is not
already running on `http://localhost:5173` (`webServer.reuseExistingServer`
in `playwright.config.js`). If you already have `npm run dev:react` (or the
full stack) running, the test will reuse it.

After the run, `npx playwright show-report` opens the HTML report.

## What `runtime-audit.smoke.spec.js` asserts

The smoke test boots `/play` in chromium, waits for `window.__phaserGame`
and at least one active Phaser scene, then reads
`window.__runtimeAuditResult` (set by `runRuntimeAudit()` in
`src/renderer/game/systems/runtimeAudit.js`).

Asserts:

- `audit` is non-null (the audit fired at boot)
- `audit.errors` is `[]`

Warnings are surfaced in the test log but do not fail the test. The audit
covers: quest givers, quest items, quest scene refs, region biomes,
`DISCOVERY_UNLOCKS` keys, and progression reachability.

## How to add a new E2E test

Tests live in `tests/e2e/*.spec.js`. Helpers go under `tests/e2e/helpers/`.

```js
import { test, expect } from 'playwright/test';
import { waitForGameBoot, waitForRuntimeAudit } from './helpers/gameBoot.js';

test('your test name', async ({ page }) => {
  await waitForGameBoot(page);
  // ... your assertions
});
```

Reach into Phaser via `page.evaluate(() => window.__phaserGame....)`.

To set up game state before boot, use `page.addInitScript` to seed
`localStorage.bikebrowser_game_save` before `page.goto('/play')`. The
save schema lives in `src/renderer/game/systems/saveSystem.js`.

## DEV-only handles relied on

These are guarded by `import.meta.env.DEV` and exist only against the Vite
dev server, not production builds:

| Handle | Source | Purpose |
|---|---|---|
| `window.__phaserGame` | `src/renderer/game/GameContainer.jsx:298` | The running `Phaser.Game`. Use to inspect scenes/registry. |
| `window.__runtimeAuditResult` | `src/renderer/game/systems/runtimeAudit.js` | `{ errors, warnings, passed }` set after the boot audit resolves. |

## Current limitations

- **Chromium only.** Tests run against `chromium` via `playwright/test`,
  not Electron. IPC-bound flows (search pipeline, AI provider routing,
  better-sqlite3 cache) are out of scope.
- **DEV builds only.** Tests rely on `window.__phaserGame` and
  `window.__runtimeAuditResult`, which only exist when
  `import.meta.env.DEV` is true.
- **Dev server auto-started.** `playwright.config.js` runs
  `npm run dev:react`. If that command fails (e.g. port 5173 in use by a
  zombie process), the test fails before the first assertion.
- **No fixture save loader yet.** Tests boot from whatever
  `localStorage.bikebrowser_game_save` contains — typically empty in CI.
  The save-injection helper is described in
  `.claude/bugs/2026-04-27-test-infrastructure-audit.md` Section 3.4.3
  but not yet implemented.

## Known caveats

- **The smoke test fails if `runRuntimeAudit` reports any errors.** This
  is intentional — that is exactly the data-integrity guard the test is
  here to provide. If you've intentionally introduced an audit error and
  the test is now red, fix the data, do not soften the assertion.
- **HMR can interfere mid-test.** If you save a source file while the
  test is running locally, Vite's HMR may re-mount the game and break
  the assertions. Avoid editing source during a test run.
