// runtime-audit.smoke.spec.js — Boot-time data-integrity smoke test.
//
// Asserts that runRuntimeAudit() (src/renderer/game/systems/runtimeAudit.js)
// reports zero errors when the game boots in DEV mode. This catches the
// entire bug class of "quest references a scene/item/observation that does
// not exist", "discoveryUnlocks key drift", "region biome regression", and
// "progression reachability break" — all of which the audit already detects
// at boot but were previously only logged, never asserted on.
//
// See tests/README.md for how to run this and what it covers.

import { test, expect } from 'playwright/test';
import { waitForGameBoot, waitForRuntimeAudit } from './helpers/gameBoot.js';

test.describe('runtime audit smoke', () => {
  test('runtime audit reports zero errors at boot', async ({ page }) => {
    // Surface page-side console errors in the test output so a regression
    // surfaces with full context, not just "audit had errors".
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
    });

    await waitForGameBoot(page);
    const audit = await waitForRuntimeAudit(page);

    expect(audit, 'runRuntimeAudit must populate window.__runtimeAuditResult').not.toBeNull();
    expect(
      audit.errors,
      `runtime audit reported ${audit.errors.length} errors:\n` +
        audit.errors.map((e) => `  [${e.where}] ${e.message}`).join('\n'),
    ).toEqual([]);

    // Warnings are not failures — surface them in the test log for visibility.
    if (audit.warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[runtime-audit smoke] ${audit.warnings.length} warnings:\n` +
          audit.warnings.map((w) => `  [${w.where}] ${w.message}`).join('\n'),
      );
    }

    // Page-side errors collected during boot — informational, not asserted.
    if (consoleErrors.length > 0) {
      // eslint-disable-next-line no-console
      console.log('[runtime-audit smoke] console errors during boot:\n' + consoleErrors.join('\n'));
    }
  });
});
