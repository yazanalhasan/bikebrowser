// gameBoot.js — Playwright helpers for booting the BikeBrowser Phaser game
// and reading runtime audit results.
//
// All helpers rely on DEV-only handles exposed by GameContainer.jsx and
// runtimeAudit.js:
//   - window.__phaserGame   : the running Phaser.Game instance
//   - window.__runtimeAuditResult : { errors, warnings, passed } (set after
//     runRuntimeAudit() resolves at boot)
//
// These handles are guarded by `import.meta.env.DEV`, so tests must run
// against the Vite dev server (not a production build).

/**
 * Navigate to /play and wait for Phaser to be initialized + at least one
 * scene to be active.
 *
 * @param {import('playwright/test').Page} page
 * @param {{ timeout?: number, route?: string }} [options]
 *   timeout — ms to wait for game boot + active scene (default 20000).
 *   route   — path to navigate to (default '/play').
 */
export async function waitForGameBoot(page, options = {}) {
  const { timeout = 20_000, route = '/play' } = options;

  await page.goto(route, { waitUntil: 'domcontentloaded' });

  // The /play route renders a "Start Adventure!" splash screen
  // (GameContainer.jsx:716-723). Phaser is only constructed after the
  // user clicks. Click it if present; otherwise assume the game is
  // already running (e.g., autosave-resumed).
  const startButton = page.getByRole('button', { name: 'Start Adventure!' });
  const continueButton = page.getByRole('button', { name: 'Continue Adventure' });
  try {
    await startButton.click({ timeout: 5_000 });
  } catch {
    try {
      await continueButton.click({ timeout: 2_000 });
    } catch {
      // Splash not shown (existing save resumed straight to game) -
      // proceed; the __phaserGame poll below covers either path.
    }
  }

  // Wait for the DEV-only window.__phaserGame handle. This is set in
  // GameContainer.jsx synchronously after `new Phaser.Game(config)`.
  await page.waitForFunction(
    () => Boolean(window.__phaserGame),
    null,
    { timeout },
  );

  // Wait for at least one Phaser scene to be active. Scenes are async-
  // initialized after the game constructor returns, so we poll the scene
  // manager until something is actually running.
  await page.waitForFunction(
    () => {
      const game = window.__phaserGame;
      if (!game || !game.scene || !game.scene.scenes) return false;
      return game.scene.scenes.some((s) => s.scene && s.scene.isActive());
    },
    null,
    { timeout },
  );
}

/**
 * Read the runtime audit result that runRuntimeAudit() exposes on window.
 *
 * Returns null if the audit has not yet fired (the caller should retry or
 * use waitForRuntimeAudit instead).
 *
 * @param {import('playwright/test').Page} page
 * @returns {Promise<{ errors: Array, warnings: Array, passed: boolean } | null>}
 */
export async function readRuntimeAudit(page) {
  return page.evaluate(() => {
    const result = window.__runtimeAuditResult;
    if (!result) return null;
    // Clone via JSON to ensure the result is serialisable across the bridge.
    return JSON.parse(JSON.stringify(result));
  });
}

/**
 * Wait for the runtime audit to have fired, then return its result.
 *
 * runRuntimeAudit() is called synchronously after game construction in DEV
 * mode (GameContainer.jsx:299). It is async (it `await`s sub-audits) so
 * the result lands a microtask or two after waitForGameBoot resolves.
 *
 * @param {import('playwright/test').Page} page
 * @param {{ timeout?: number }} [options]
 */
export async function waitForRuntimeAudit(page, options = {}) {
  const { timeout = 10_000 } = options;
  await page.waitForFunction(
    () => Boolean(window.__runtimeAuditResult),
    null,
    { timeout },
  );
  return readRuntimeAudit(page);
}
