# Test infrastructure audit + E2E feasibility analysis

**Date:** 2026-04-27
**Scope:** What testing exists in BikeBrowser+ today, what's missing, and what it would take to add Playwright-based E2E coverage for the Phaser game running under Electron.
**Status:** Read-only audit. No source/config/test files were modified.

All paths are absolute under `C:\Users\yazan\bikebrowser\`.

---

## Section 1 — Current state

### 1.1 Test files in the repo

A repository-wide glob for `**/*.test.{js,jsx,ts,tsx}`, `**/*.spec.{js,jsx,ts,tsx}`, `**/__tests__/**`, `**/test/**`, `**/tests/**` returns hits **only inside `node_modules/`** (zod, fast-uri, jsx-ast-utils, etc.). There are zero project-owned files matching the conventional `.test.*` / `.spec.*` / `__tests__/` patterns.

There is no `tests/` or `e2e/` directory at the repo root.

What does exist is a small set of hand-rolled Node-script smoke checks living under `scripts/` and `tools/`. Each is an ad-hoc CLI invoked manually; none is wired into a runner, none asserts via a framework, and only some have an exit-code contract.

| File | Type | Framework | What it does |
|---|---|---|---|
| `C:\Users\yazan\bikebrowser\scripts\check-app.mjs` | Smoke | Playwright (chromium, headless) | Loads `http://localhost:5173/` and `/play`, checks for error-boundary text, snapshots screenshots. Exits 1 on failure. |
| `C:\Users\yazan\bikebrowser\scripts\check-routes.mjs` | Smoke | Playwright (chromium) | Visits 8 routes (Home, YouTube search, Project Builder, etc.), screenshots each, records JS errors per route. No exit-code contract. |
| `C:\Users\yazan\bikebrowser\scripts\check-bikes-flow.mjs` | Smoke | Playwright (chromium) | Drills into the YouTube search flow with API request inspection. |
| `C:\Users\yazan\bikebrowser\scripts\check-no-backend.mjs` | Smoke | Playwright (chromium) | Verifies the readiness gate on the search page when the API server is down. |
| `C:\Users\yazan\bikebrowser\scripts\full-audit.mjs` | Smoke | Playwright (chromium, desktop+mobile) | Combined route audit + `/play` immersive-chrome check + API health probe. |
| `C:\Users\yazan\bikebrowser\scripts\check-game-scenes.mjs` | Static smoke | Custom (`fs`+`grep`) | File-existence + textual `code.includes(...)` assertions for the scene/registry/save layout. Exits 1 on failure. |
| `C:\Users\yazan\bikebrowser\scripts\check-save-system.mjs` | Unit-ish | Custom + localStorage shim | Imports the real `saveSystem.js` ESM, runs round-trip / reset / migration assertions in plain Node with a `Map`-backed `localStorage`. Exits 1 on failure. |
| `C:\Users\yazan\bikebrowser\scripts\check-health.js` | Smoke | Custom | Probes ports 5173 / 3001 / 1234 / 11434 + cloudflared process + better-sqlite3 ABI. |
| `C:\Users\yazan\bikebrowser\scripts\test-lab-notebook-migration.js` | Migration unit | Custom (string-extracts the migrate fn) | Validates `migrateV5toV6` for the lab notebook fields. Exits 1 on failure. |
| `C:\Users\yazan\bikebrowser\tools\inspect-save.js` | Dev tool | Custom CLI | Reads/edits a JSON-dumped save; not a test, listed for completeness. |

### 1.2 `package.json` test-related state

Excerpted from `C:\Users\yazan\bikebrowser\package.json` (full file: 97 lines):

**Test-related dependencies (devDependencies):**
- `playwright` `^1.59.1` — installed at `node_modules/playwright/` with the `_electron` namespace available via `playwright.test`/`@playwright/test` patterns. Note: this is the *plain* `playwright` package, not `@playwright/test`. The Electron helper `playwright._electron` exists in plain `playwright` too (1.30+).

**Test-related dependencies (dependencies):**
- None.

**Test-related npm scripts:**
- None. The `scripts` block has `start`, `dev`, `dev:web`, `dev:react`, `dev:electron`, `dev:stack`, `build`, `build:electron`, `lint`, `tunnel`, `check:health`, `kill:dev`, `start:clean`, `predev:stack`, `rebuild:native`, `postinstall`, `generate:icons`. The closest things to test scripts are `check:health` (which calls `scripts/check-health.js`) and the manually-runnable Playwright `.mjs` files. No `test`, `test:unit`, `test:e2e`, `test:watch`, etc.

**No test runner is installed.** No Vitest, no Jest, no Mocha, no Cypress, no `@playwright/test`. Just the lower-level `playwright` driver used directly from Node scripts.

### 1.3 Test config files

Globbed for `**/playwright.config.*`, `**/vitest.config.*`, `**/jest.config.*`, `**/cypress.config.*`, `**/mocha.config.*`. Only hits inside `node_modules/`. **No project-owned test config files exist.**

### 1.4 What's actually being tested

Categorized by what each script touches:

| Concern | Where it's tested today |
|---|---|
| Pure functions | None |
| React components | None |
| Quest engine logic (`questSystem.js`, `advanceQuest`, observe gating) | **None** |
| Phaser scenes | Only at the file-existence + textual-source level via `check-game-scenes.mjs` |
| Save system (round-trip, reset, learning-progress preservation) | `check-save-system.mjs` (Node + localStorage shim, real source import) |
| Save migrations | `test-lab-notebook-migration.js` (string-extracts `migrateV5toV6`) |
| UI flows / app boot | `check-app.mjs`, `check-routes.mjs`, `full-audit.mjs` (Playwright headless on the Vite dev URL) |
| `/play` immersive-chrome (no header/footer) | `full-audit.mjs` checks `[data-testid="app-header"]`/`app-footer` are not visible |
| Audit modules (`runRuntimeAudit`, `progressionReachabilityAudit`) | None — these are runtime-only at boot in DEV mode (`GameContainer.jsx:290`); no test consumes their output |
| Data integrity (regions, quest givers, items, scene keys) | `runRuntimeAudit()` runs at boot but its return value is never asserted by anything outside the React tree |
| Backend / API endpoints | None directly; only proxied via the route-screen smoke checks |

### 1.5 Test-adjacent infrastructure

Worth noting — these aren't tests but they're the closest thing the codebase has:

- **localStorage shim** for headless save tests: `scripts/check-save-system.mjs:18-24` (a six-line `Map`-backed shim usable by any future Node-side test).
- **Save fixture builder pattern** in `test-lab-notebook-migration.js:56-65` (literal `v5Save` object, manually constructed). Not generalized; one fixture per test.
- **Runtime audit module** at `src/renderer/game/systems/runtimeAudit.js` — not a test framework but it's the closest thing to a programmatic data-integrity assertion. Returns `{ errors, warnings, passed }`. Consumed only by `GameContainer.jsx:290` in DEV mode.
- **Reachability audit** at `src/renderer/game/systems/progressionReachabilityAudit.js` — invoked from `runRuntimeAudit`.
- **Scene-isolation helper:** none. Scenes can't be loaded standalone without booting the full Phaser game (`createGameConfig` starts an `OverworldScene`/`ZuzuGarageScene`). HMR-style scene swap is documented at `src/renderer/game/dev/phaserHmr.js` but requires a running game.
- **DevTools save-state injection** is documented at `tools/inspect-save.js:11-20` — workflow is "copy save text from DevTools console, paste into JSON file, edit, paste back". Manual.
- **Window-level game handle:** in DEV mode `GameContainer.jsx:289` exposes the running game as `window.__phaserGame`. This is used by the scene HMR helper at `src/renderer/game/dev/phaserHmr.js:62` and is the natural attachment point for any future E2E reach into game state.

Bottom line on coverage: **the codebase has Playwright installed and uses it for chromium-only smoke checks of the React shell, plus two homegrown Node-script unit-ish save tests, plus a static file-existence audit.** Quest logic, scene state, observe/advance flows, and any actual gameplay paths are completely untested.

---

## Section 2 — Coverage gaps

### 2.1 Bug class C3 — quest engine observe-step gating (commit 922da63)

**The bug.** `src/renderer/game/systems/questSystem.js:199-202` had an empty observe branch. Any `step.type === 'observe'` quest auto-advanced when `LocalSceneBase.advanceFromDialog` (`src/renderer/game/scenes/LocalSceneBase.js:104`) called `advanceQuest(state, choiceIndex)` after dialog dismissal, regardless of whether `state.observations` actually contained the step's `requiredObservation`. The fix (commit 922da63) added a three-line gate.

**What test would have caught it.** A pure-function unit test of `advanceQuest` — no Phaser, no React, no DOM:

```js
// Hypothetical
const state = { activeQuest: { id: 'bridge_collapse', stepIndex: 6 }, observations: [] };
const result = advanceQuest(state, 0);
expect(result.ok).toBe(false);          // Gate must block.
expect(result.state.activeQuest.stepIndex).toBe(6);  // No advance.
```

**Can the current infra express this?** No. There is no unit-test runner installed. The closest precedent is `scripts/check-save-system.mjs`, which imports the real `saveSystem.js` ESM under Node with a `localStorage` shim — that pattern would work for `questSystem.js` if the module has no DOM/Phaser side-effects (it doesn't appear to). So a hand-written `scripts/check-quest-engine.mjs` could be added today using exactly the same idiom. **A lightweight runner like Vitest would be a strict improvement** but is not strictly required. The real gap is conventional: nobody writes such a script when adding a new quest mechanic, because the project has no "you should add a test" norm.

### 2.2 Bug class C2 — east-edge traversal silence

**The bug.** Sensor wired correctly in `src/renderer/game/scenes/NeighborhoodScene.js:179-184`, callback registered, but no scene transition fires at runtime. The `seamlessTraversal.js` adjacency map references the legacy `NeighborhoodScene` rather than the live `OverworldScene` graph (per `.claude/bugs/2026-04-27-quest-engine-and-traversal.md` Bug 2).

**What test would have caught it.** Two layers, both currently impossible:

1. **Static cross-reference audit** — extend `runRuntimeAudit.js` (or a new file) to assert that every key in `SCENE_ADJACENCY` is a registered, *live* (non-legacy) scene. The existing `runtimeAudit.auditQuestScenes` (line 115) already does this for quest steps; an analogous `auditTraversalAdjacency` would catch the legacy reference cleanly. **Possible today** without any new infra; just a new sub-audit function. The current infra would surface the result via the boot-time `console.group` only — no CI failure.
2. **Integration test** — boot the game, load a save with the player at the east-edge of NeighborhoodScene, drive the player east via input simulation, assert the active scene changed. **Not possible today**: there is no way to load a fixture save, no way to drive Phaser inputs from a test, and no programmatic exit of the test harness when the scene transitions.

### 2.3 Materials Lab access predicate (`ZuzuGarageScene.js:198-208`)

**The bug.** The Materials Lab doorway gate is keyed on `bridge_collapse` quest state. A player on `desert_coating` step 5 (`apply_coating`) can't enter, even though the quest's hint directs them to "use the material workbench" (per `.claude/bugs/2026-04-27-materials-lab-access.md`).

**What test would have caught it.** This is a *reachability* bug, not a runtime crash. The right test is a static cross-reference audit: for every quest step whose `scene` field points at `MaterialLabScene`, the gate predicate in `ZuzuGarageScene.addInteractable` must accept the active quest. This is closer in spirit to the existing `progressionReachabilityAudit.js` than to a Playwright test. **Partially possible today** — `progressionReachabilityAudit` exists and could be extended to include scene-gate cross-checks. The hard part is teaching the audit to symbolically read the gate predicate (which is JS code, not data); the cleaner refactor would be to move gate predicates into a data file alongside the quest definitions.

The current infra cannot express the predicate-cross-check audit cleanly, but it has the right shape. Adding it would be an extension of an existing audit, not a new test framework.

### 2.4 Auto-completing quests pattern (general)

**The bug class.** Any quest whose first step is `type: 'observe'` auto-advances on the *next dialog dismissal* because `LocalSceneBase.advanceFromDialog` calls `advanceQuest()` blindly without re-checking the step type. Per the bug-log file, **19 of 21** `requiredObservation` strings in `quests.js` have *no* emission code path anywhere — meaning even with the C3 gate fix, those quests are stuck at their observe step.

**What tests would have caught this.** Two complementary tests:

1. **Coverage audit:** for every `requiredObservation` value across `data/quests.js`, grep the codebase for an emission site. Any observation with zero emitters is unreachable. **Possible today** as a `scripts/check-observation-coverage.mjs` script — pure data + grep. Same idiom as `check-game-scenes.mjs`.
2. **Behavioral integration test:** load a save with `bridge_collapse` active at step 6, simulate a dialog dismissal, assert `state.activeQuest.stepIndex` did not advance. This is the C3 fix verification described in `.claude/bugs/2026-04-27-quest-engine-and-traversal.md` "Verification protocol" — currently performed manually by the user. **Not possible today** without Playwright + save-state injection + a way to read game registry from outside the React tree.

### 2.5 Summary

| Bug | Catchable today w/o new infra? | Best test shape |
|---|---|---|
| C3 observe gating | Yes (Node-script unit test like `check-save-system.mjs`) | Pure-function unit |
| C2 traversal silence | Static audit yes; runtime no | Static audit (extend `runtimeAudit`) + E2E |
| Materials Lab gate | Static audit yes (with predicate refactor); runtime no | Static reachability audit |
| Auto-completing quests | Coverage audit yes (data+grep); behavior no | Coverage audit + E2E behavior |

The pattern: **most of these are catchable with cheap static/audit-style scripts that fit the existing `scripts/check-*.mjs` idiom**. The bugs that require *runtime* validation (C2, the C3 fix verification, the auto-complete behavior) need real E2E infrastructure.

---

## Section 3 — E2E feasibility for Phaser + Electron

### 3.1 Electron + main-process layout

- **Electron version:** `^28.3.3` (from `package.json:41`).
- **Main entry:** `src/main/main.js` (declared at `package.json:5`).
- **BrowserWindow URL pattern:** at `src/main/main.js:536-563`:

```
if (isDev) {
  mainWindow.loadURL('http://localhost:5173');
} else {
  if (rendererUrl) mainWindow.loadURL(rendererUrl);
  else mainWindow.loadFile(builtIndexPath);  // build/index.html
}
```

- **Game route:** `/play` on the same origin (verified by `scripts/check-app.mjs:51` and `scripts/full-audit.mjs:7-13` which both navigate to `http://localhost:5173/play`).
- **`webPreferences`:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, with a preload at `src/preload/preload.js`.

### 3.2 Reachability for tests

- **Dev mode:** `http://localhost:5173/play` is reachable from a regular Chromium browser (no Electron required) — that's already how `scripts/check-app.mjs` and friends operate. A Playwright test against chromium can boot the game today, *without* Electron, because the renderer is just a Vite-served React app.
- **Packaged builds:** load `file://.../build/index.html` via `loadFile`. Reachable only inside Electron.
- **Electron-internal IPC:** the game uses preload-bridged IPC (`src/preload/preload.js`) for shopping, places, AI provider info, etc., but the *Phaser scene logic itself* does not depend on IPC — it's pure renderer-side code reading `localStorage` for saves. So **a test does not need Electron just to exercise the Phaser game**; chromium against the dev URL is sufficient for almost all gameplay assertions.
- **When Electron *would* be needed:** any test that asserts on the main-process search pipeline, AI provider routing, IPC cache, or the YouTube interceptor. Those are out of scope for a "Phaser game playthrough" suite.

### 3.3 Playwright Electron support

Playwright's `_electron` API ships in plain `playwright` 1.30+. The repo has `playwright@^1.59.1` in `devDependencies` and installed at `node_modules/playwright/`. Usage shape:

```js
import { _electron as electron } from 'playwright';
const app = await electron.launch({ args: ['.'] });   // points at src/main/main.js per package.json "main"
const window = await app.firstWindow();
// `window` is a Page; full Page API works (locators, evaluate, keyboard, etc.).
```

Two important wrinkles:

1. **Native module ABI.** `better-sqlite3` is built for Electron's Node ABI (per `scripts/check-health.js:42-60`). Playwright launching `electron` directly should be fine — it's the same Electron binary. This *would* break if a test tried to load `better-sqlite3` from plain Node.
2. **Vite dev server.** In dev mode, `main.js` calls `loadURL('http://localhost:5173')` and falls back to the built bundle if Vite isn't reachable. An Electron-launched Playwright test must either start Vite first (the existing `dev:electron` npm script does this via `wait-on`) or run against a packaged build's `file://` URL.

For the immediate Phaser-game E2E story, **chromium-against-Vite is the simpler path** and is already used by all five existing Playwright `.mjs` smoke checks. Electron-native is only worth the complexity when testing IPC-bound flows.

### 3.4 Minimal additions for Playwright-based E2E

#### 3.4.1 New dependencies

If using only chromium against Vite: **none** — `playwright@1.59.1` is already installed.

If adopting `@playwright/test` (the runner with built-in test syntax, fixtures, parallelization, retries): add `@playwright/test` as a devDependency.

Recommendation: **adopt `@playwright/test` for the runner ergonomics**. Cost is one new devDependency. Without it, every test is a hand-rolled `node scripts/check-*.mjs` with manual `assert(...)` and `process.exit(1)` — exactly the maintenance shape that has held the project back from writing tests at all.

#### 3.4.2 Test directory convention

Existing convention: `scripts/check-*.mjs` for smoke checks at the repo root, no subdirectories. For E2E, recommend `tests/e2e/` to separate "things you run with `npx playwright test`" from "things you run with `node scripts/check-*.mjs`". This keeps the `scripts/` namespace for ad-hoc operational tools and lets `playwright.config.js` set `testDir: 'tests/e2e'` cleanly.

A future `tests/unit/` (Vitest) directory could sit alongside without confusion.

#### 3.4.3 Save-state injection helper

The save lives at `localStorage.bikebrowser_game_save` (`src/renderer/game/systems/saveSystem.js:22`). Two viable strategies:

- **`addInitScript` pre-injection.** Playwright's `page.addInitScript()` runs before any page script. A helper `loadSave(page, saveObject)` that writes `localStorage.setItem('bikebrowser_game_save', JSON.stringify(saveObject))` *before* `page.goto('/play')` is the cleanest and is fully supported. This is the recommended path.
- **Registry-level fixture.** Each save is a JSON fixture under `tests/e2e/fixtures/saves/` (e.g. `bridge-collapse-step-7.json`). A lightweight `buildSave(overrides)` function merges `defaultSave` (which would need to be exported from `saveSystem.js` — currently internal at line 31) with overrides. This is the right structure once more than two or three saves are needed.

Both work today without source changes (defaults can be reproduced via `loadGame()` returning a fresh state when `localStorage` is empty, then re-saved with overrides).

The save schema is `version: 6`. Migration is automatic on `loadGame`, so older fixtures still work — but writing a *fresh* fixture should target v6 to avoid the migration code-path becoming part of the test variability.

#### 3.4.4 Input simulation strategy

Phaser scenes wire inputs as `this.input.keyboard.on('keydown-E', ...)` (per the LocalSceneBase pattern referenced in the bug logs). Two options:

- **DOM-level dispatch** via `page.keyboard.press('e')`. Phaser registers global `keydown` listeners on `window`, so a Playwright keypress on the focused `<canvas>` propagates correctly. Faster, simpler, deterministic.
- **Electron-native input simulation** — only meaningful if running through `_electron`; not applicable to the chromium-against-Vite path.

Recommendation: **DOM-level dispatch**. This is what Playwright's `page.keyboard` and `page.mouse` are designed for and matches how the existing smoke scripts already drive the React UI.

For mouse-based interactables (the click-targeting that LocalSceneBase uses for tap-to-interact), `page.mouse.click(x, y)` works but requires knowing canvas coordinates. The cleaner pattern is to expose interactable hit-testing through a DEV-only debug helper on `window.__phaserGame`, e.g. `window.__phaserGame.debug.clickInteractable('Materials Lab')`. Costs one new helper file under `src/renderer/game/dev/`; safer than coordinate brittleness.

#### 3.4.5 Assertion strategy

The renderer already exposes `window.__phaserGame` in DEV mode (`GameContainer.jsx:289`). From a Playwright test:

```js
const state = await page.evaluate(() => {
  return window.__phaserGame.scene.scenes
    .find(s => s.scene.isActive())
    .registry.get('gameState');
});
expect(state.activeQuest.stepIndex).toBe(6);
```

This is the cleanest path. Three caveats:

1. **`window.__phaserGame` is DEV-only** (`GameContainer.jsx:288`: `if (import.meta.env.DEV)`). Tests against a production build won't see it. For E2E this is fine — tests should run against the dev build or a deliberately-instrumented "test" build.
2. **Save is written async-ish** — `saveGame()` is synchronous to localStorage, but the registry update that triggers `saveGame` happens via a Phaser event. Tests should `await` after the trigger, then read; or read directly from registry which is the source of truth.
3. **DOM scraping** as a secondary signal: the dialog UI uses `data-testid` attributes (`AppLayout.jsx:45-71` shows the convention). Adding `data-testid` to the Phaser HUD overlay React components (HudOverlay, DialogOverlay, etc.) costs little and gives tests a stable grip without poking at game internals.

A deliberate **DEV-only test API** at `GameContainer.jsx` that bundles the common reach-ins (`getState`, `getActiveScene`, `triggerInteractable(label)`, `dismissDialog()`) is the highest-leverage investment. Roughly 50 lines, lives under a `if (import.meta.env.DEV) window.__test = { ... }` guard.

#### 3.4.6 CI integration

- **Headless chromium against Vite** runs anywhere — GitHub Actions ubuntu-latest needs no `xvfb` (chromium ships its own headless mode).
- **Headless Electron** on Linux CI traditionally needs `xvfb` (`xvfb-run npx playwright test`). Electron 28 supports `--headless` but it's flaky for windowed apps; `xvfb` is the safer bet.
- **Native rebuild** in CI: `better-sqlite3` rebuild via `@electron/rebuild` (per `package.json:18-19`). Adds ~30s to CI install. Cacheable.

For an initial "smoke test on PR" workflow, chromium-against-Vite + GitHub Actions ubuntu is the lowest-friction path: no `xvfb`, no native rebuild gates, ~20s end-to-end.

### 3.5 Scope estimate

| Stage | Setup effort | Ongoing maintenance |
|---|---|---|
| Add `@playwright/test`, `playwright.config.js`, `tests/e2e/` | 1 hr | Trivial |
| Save-state fixture loader + `defaultSave` export from `saveSystem.js` | 1 hr | Per-fixture: 5 min |
| DEV test API on `window.__test` (state read, interactable trigger, dialog dismiss) | 2-3 hrs | Per new helper: 15 min |
| First smoke test (game boots, no console errors, runtime-audit passes) | 1 hr | Trivial |
| First behavior test (save fixture → dismiss dialog → assert no auto-advance) | 2 hrs | Per new test: 20 min |
| GitHub Actions workflow (chromium-only, against Vite) | 1 hr | Trivial |
| **Total: bootstrap to first useful guard** | **~8 hrs** | **~30 min/test added thereafter** |

Adding Electron-native testing later (for IPC paths) is an additive ~4-6 hr lift on top: `_electron.launch`, `xvfb` setup, packaged-build vs. dev-build flag, `wait-on` orchestration in CI.

---

## Section 4 — Recommended approach

### Option A — Smallest: data-integrity smoke

**What.** A single Playwright test that boots `/play`, waits for `window.__phaserGame` to exist, then evaluates `await runRuntimeAudit({ silent: true })` in the page context and asserts `passed === true` with `errors.length === 0`.

**Why.** Catches the entire bug class of "quest references a scene/item/observation that doesn't exist", "discoveryUnlocks key drift", "region biome regression", "progression reachability break". `runRuntimeAudit` already runs at boot (`GameContainer.jsx:290`) but its result is only logged — nothing asserts on it. A single E2E that turns the existing audit into a CI guard is **the highest-leverage 30-line test imaginable**.

**Setup time:** ~3 hrs (project setup + first test + CI workflow).
**Ongoing maintenance:** near zero — the audit module is already maintained as part of the data-correctness story.
**Blast-radius risk:** very low. Failure means somebody broke a data invariant; the test is purely observational.

**Catches:** C3 prerequisites for unwired observations (if `runtimeAudit` is extended), Materials Lab gate predicate cross-checks (if added as a sub-audit), discoveryUnlocks key drift, quest scene typos. Does **not** catch: live runtime behavior bugs like C2 traversal silence or the auto-complete dialog flow.

### Option B — Medium: quest behavior smoke

**What.** A Playwright test that:
1. Loads a fixture save (`tests/e2e/fixtures/saves/bridge-collapse-pre-bridge-built.json`) with `activeQuest = { id: 'bridge_collapse', stepIndex: <observe-step-index> }` and `observations = []`.
2. Boots `/play`.
3. Triggers a quest-bearing dialog (via the DEV test API or by walking the player to an NPC with `page.keyboard.press`).
4. Dismisses the dialog (`page.keyboard.press('Enter')`).
5. Reads `gameState` via `window.__phaserGame.scene.getScene('ZuzuGarageScene').registry.get('gameState')`.
6. Asserts `state.activeQuest.stepIndex` is unchanged (the observe gate held).

**Why.** This is the *runtime* validation the C3 bug log is asking for ("Verification protocol", lines 92-105 of `2026-04-27-quest-engine-and-traversal.md`). Without it, the C3 fix is `[static-only]` indefinitely.

**Setup time:** ~6-8 hrs total (Option A foundation + DEV test API + fixture builder + first test).
**Ongoing maintenance:** ~20 min per new quest-behavior test. Fixture saves go stale when the save schema bumps; mitigated by keeping fixtures version-tagged and running them through `loadGame`'s migration on read.
**Blast-radius risk:** medium. False positives if Phaser scene timing is non-deterministic (e.g. dialog opens 1 frame later than expected). Mitigated by polling assertions with `expect.poll`.

**Catches:** C3 gate fix verification, auto-complete dialog flow regressions, any future observe-step gating bugs. Foundation for catching C2 traversal (a follow-on test that walks east and asserts scene change).

**Recommended starting point.** This is the right ambition level for the project today. The C3 bug log explicitly notes runtime validation is required; this is how that validation becomes automated.

### Option C — Largest: full quest playthrough suite

**What.** Per-quest test files: `tests/e2e/quests/bridge-collapse.spec.js`, `desert-coating.spec.js`, etc. Each loads a "quest start" fixture, drives the player through every step (input simulation + dialog dismissal + interactable triggers), asserts state at each checkpoint, and verifies completion. Roughly 21 quests × 30-100 lines each = 1-2k LOC of tests.

**Setup time:** ~30-50 hrs total.
**Ongoing maintenance:** **high.** Every quest content change can break its test. Realistically requires a dedicated person or a strong norm of "if you change the quest, you fix the test". For a single-developer project, this is overkill.
**Blast-radius risk:** high. A flaky test in the middle of the suite blocks the whole CI run; per-quest isolation via `test.describe` mitigates this but doesn't eliminate it. Phaser scene state can be timing-sensitive.

**Catches:** essentially all bug classes the project has hit. But the cost is that test maintenance becomes the dominant ongoing engineering activity.

### Recommendation

**Start at Option A this week, then escalate to Option B for the C3 fix and one or two priority quests within the next 1-2 weeks.** Option C is not appropriate for the current project state and team size; revisit only if the project starts shipping to non-developers.

The Option A → B path also has the best learning curve: A teaches the team how to write a Playwright test against the running game without any save-state mechanics; B layers on fixtures and DEV API; C is just "more B".

---

## Section 5 — Open questions

These are the structural ambiguities a future test author should resolve before committing to a strategy. Each affects E2E test design materially.

1. **Scene isolation.** Can `MaterialLabScene`, `DryWashScene`, etc. be loaded standalone (e.g. for a per-scene unit test) without booting `OverworldScene` or `ZuzuGarageScene` first? `createGameConfig` (`src/renderer/game/config.js`) takes a `startScene` parameter (used by `GameContainer.jsx:274-276` to resume from saved state), so in principle yes — but each scene's `init`/`create` may assume registry data populated by a predecessor scene. Worth testing before designing a per-scene test pattern.

2. **Save portability across game instances.** `localStorage` is per-origin. A test that writes the save then navigates to `/play` should see it. But Phaser's scene init reads the save *once* at boot (`GameContainer.jsx:273`) — any later `localStorage.setItem` during a running game is ignored until the next reload. Test pattern: write save, reload page, then assert. Don't try to mutate a running game's save mid-test.

3. **`runRuntimeAudit()` from outside React.** It's an exported function from `src/renderer/game/systems/runtimeAudit.js` and is `await`-able. Calling it from `page.evaluate` requires it to be reachable from the global scope. Currently it isn't exposed on `window` — only invoked at line 290 of `GameContainer.jsx`. **Action item before adopting Option A:** add `if (import.meta.env.DEV) window.__runtimeAudit = runRuntimeAudit;` next to the existing `window.__phaserGame` assignment, or include it under the proposed `window.__test` namespace.

4. **HMR vs. test reproducibility.** `phaserHmr.js` (`src/renderer/game/dev/phaserHmr.js`) hot-swaps scene classes when the source file changes. During an active test run with Vite serving the dev bundle, an editor save would mid-test re-add a scene. Mitigation: `playwright test` runs against a freshly-spawned browser per test file by default, so cross-test contamination is unlikely; in-test contamination requires an editor save during the test, which is a development-environment-only concern. Not a CI concern. Worth documenting for local-dev test runs.

5. **`/play` chrome bypass.** Per commit 5d16936 (referenced in the dispatch), `uxSafety.js` exempts `/play` from the standard "must have header" enforcement. The exemption is at `src/renderer/utils/uxSafety.js:32` (`'/play': ['MUST_HAVE_HOME_BUTTON', 'MUST_HAVE_HEADER', 'MUST_HAVE_NAV_CONTAINER', 'NO_EMPTY_SCREEN']`). For E2E tests, this means selectors like `[data-testid="app-header"]` are deliberately absent on `/play` — `full-audit.mjs:51-56` already encodes this expectation. Test selectors for `/play` should target Phaser's canvas + DEV API, not React component testids. The existing pattern in `full-audit.mjs` is already correct here.

6. **Fixture save `version` drift.** `saveSystem.CURRENT_VERSION` is currently `6`. When it bumps to 7, all fixtures need to either (a) be re-recorded against the new schema, or (b) rely on `loadGame`'s migration to fix them up on read. The latter is more durable; the former gives sharper error messages. Recommend (b) with a comment in each fixture noting the schema version it was authored against.

7. **`@playwright/test` vs. plain `playwright`.** The current ad-hoc scripts use plain `playwright`. Option A could be done either way. For Option B onwards, `@playwright/test`'s fixture/parallelization story is materially better. Pick before writing the first new test.
