import { test, expect } from 'playwright/test';

// ENGINE acceptance for the Ecology Loop (Phase 2.1). Drives the system through
// the debug API (allowed at this layer) to prove the observe -> predict ->
// resolve logic, the gating, and the payoff (notebook) are correct. The
// player-facing reachability is proven separately by the keyboard spec.

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => window.__GAME__.resetAct1());
}

test.describe('Engine acceptance — ecology loop', () => {
  test('observe -> predict -> resolve teaches via outcome (right thrives, wrong still teaches)', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);

    const result = await page.evaluate(() => {
      const g = window.__GAME__;
      // Gating: cannot predict before observing.
      const earlyPredict = g.predictEcologyPlacement('wash_edge_shade', 'mesquite');
      // Site 1 (wash edge): the correct plant is mesquite -> it thrives.
      g.observeEcologyPlacement('wash_edge_shade');
      g.predictEcologyPlacement('wash_edge_shade', 'mesquite');
      const right = g.resolveEcologyPlacement('wash_edge_shade');
      // Site 2 (open dry flat): predict mesquite (wrong) -> struggles, but the
      // payoff names creosote and why it fits.
      g.observeEcologyPlacement('open_dry_flat');
      g.predictEcologyPlacement('open_dry_flat', 'mesquite');
      const wrong = g.resolveEcologyPlacement('open_dry_flat');
      const eco = g.getAct1State().ecology;
      const notebook = JSON.stringify(g.getAct1State().notebook).toLowerCase();
      return { earlyPredict, right, wrong, eco, notebookHasMesquite: notebook.includes('mesquite'), notebookHasCreosote: notebook.includes('creosote') };
    });

    expect(result.earlyPredict.ok, 'predict is gated on observe first').toBe(false);
    expect(result.right.ok).toBe(true);
    expect(result.right.thrives, 'mesquite thrives at the wash edge').toBe(true);
    expect(result.wrong.thrives, 'mesquite struggles on the dry flat').toBe(false);
    expect(result.wrong.correctName.toLowerCase(), 'payoff names the plant that fits').toContain('creosote');
    expect(result.wrong.why.length, 'a teaching explanation is given when wrong').toBeGreaterThan(0);
    expect(result.eco.placementsResolved, 'both sites resolved').toBe(2);
    expect(result.eco.placementsMatched, 'one matched (mesquite at the wash edge)').toBe(1);
    expect(result.notebookHasMesquite && result.notebookHasCreosote, 'both plants recorded in notebook').toBe(true);
  });
});
