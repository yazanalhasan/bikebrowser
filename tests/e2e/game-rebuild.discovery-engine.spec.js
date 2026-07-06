import { test, expect } from 'playwright/test';

// ENGINE acceptance for the Discovery Registry (Phase 2.2). Drives the system
// via the debug API to prove: discoveries register across categories from real
// gameplay actions, duplicates do not double-count, and the registry persists
// across save/load.

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => window.__GAME__.resetAct1());
}

test.describe('Engine acceptance — discovery registry', () => {
  test('discoveries register across categories, dedupe, and persist across save/load', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);

    const result = await page.evaluate(() => {
      const g = window.__GAME__;
      // Real gameplay actions populate several categories.
      g.observeEcology('mesquite');     // plant
      g.observeEcology('saguaro');      // plant + landmark
      for (let i = 0; i < 8; i += 1) g.handleInteraction('collect_materials');
      g.testMaterial('steel');          // material
      g.handleInteraction('dry_wash');  // landmark(s)
      g.handleInteraction('spanish_neighbor'); // language + npc_fact
      const afterActions = g.getAct1State().discoveryRegistry;

      // Dedupe: re-observing does not add a new discovery.
      g.observeEcology('mesquite');
      const afterDup = g.getAct1State().discoveryRegistry.total;

      // Persist: save then load — the registry survives.
      g.saveGame();
      g.loadGame();
      const afterReload = g.getAct1State().discoveryRegistry;

      const cats = (s) => s.categories.filter((c) => c.count).map((c) => c.category);
      return {
        total: afterActions.total,
        categories: cats(afterActions),
        afterDup,
        reloadTotal: afterReload.total,
        reloadCategories: cats(afterReload),
        directDup: g.registerDiscovery({ id: 'material_steel', category: 'material', title: 'Steel' }).isNew,
      };
    });

    expect(result.total, 'multiple discoveries registered from gameplay').toBeGreaterThanOrEqual(5);
    expect(result.categories).toEqual(expect.arrayContaining(['plant', 'material', 'landmark']));
    expect(result.categories).toEqual(expect.arrayContaining(['language', 'npc_fact']));
    expect(result.afterDup, 're-observing does not double-count').toBe(result.total);
    expect(result.directDup, 'registering a known id reports isNew=false').toBe(false);
    expect(result.reloadTotal, 'registry persists across save/load').toBe(result.total);
    expect(result.reloadCategories).toEqual(expect.arrayContaining(['plant', 'material', 'landmark']));
  });
});
