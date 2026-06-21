import { test, expect } from 'playwright/test';

// Skate Park — Phase 2 (data + unlock). The park is LOCKED before the bridge
// repair and UNLOCKED after; the obstacle catalog + layout are data-driven.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
const mapState = (page) => page.evaluate(() => {
  const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
  s.updateEvidencePanel();
  return s.worldMapHudState;
});

test.describe('Skate Park — unlock + data (Phase 2)', () => {
  test('locked before the bridge repair, unlocked after', async ({ page }) => {
    test.setTimeout(45000);
    await ready(page);
    await page.evaluate(() => window.__GAME__.resetAct1());
    await page.waitForTimeout(120);

    // Before repair: skate_park is a known-but-locked destination.
    let m = await mapState(page);
    expect(m.lockedDestinations, 'skate park locked before bridge repair').toContain('skate_park');
    expect(m.unlockedDestinations).not.toContain('skate_park');

    // Repair the bridge via the real chain.
    await page.evaluate(() => {
      const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
      r.inventorySystem.addMany(['bamboo', 'steel', 'carbon_fiber']);
      ['bamboo', 'steel', 'carbon_fiber'].forEach((id) => r.testMaterial(id));
      r.designBridge({ bridgeType: 'truss', deck: 'bamboo', support: 'steel', brace: 'carbon_fiber' });
      r.repairBridge();
    });
    await page.waitForTimeout(120);

    // After repair: skate_park is unlocked.
    m = await mapState(page);
    expect(m.unlockedDestinations, 'skate park unlocked after bridge repair').toContain('skate_park');
    expect(m.lockedDestinations).not.toContain('skate_park');
  });

  test('obstacle catalog is data-driven and the level-1 layout is valid', async ({ page }) => {
    test.setTimeout(30000);
    await ready(page);
    const sp = await page.evaluate(() => window.__GAME__.getAct1State().skatePark);
    // Catalog: the initial 6 obstacles, each carrying a material + the friction field.
    expect(sp.obstacleCatalog).toHaveLength(6);
    const ids = sp.obstacleCatalog.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['launch_ramp_s', 'quarter_pipe', 'low_rail', 'grind_box', 'manual_pad', 'pump_segment']));
    for (const o of sp.obstacleCatalog) {
      expect(typeof o.surfaceFriction).toBe('number');         // carry-forward friction field
      expect(o.material).toBeTruthy();                          // reuses an act1 material id
      expect(Array.isArray(o.educationalTags)).toBe(true);
    }
    expect(sp.metrics.physicsComplexity).toBeGreaterThan(3);   // multiple physics concepts present

    // The level-1 layout exists, parses, and references only catalog obstacles.
    const layout = await page.evaluate(async () => (await fetch('/layouts/skatepark.level1.json')).json());
    expect(layout.level).toBe(1);
    expect(layout.state).toBe('partially_damaged');
    expect(layout.obstacles.length).toBeGreaterThan(0);
    const catalogIds = new Set(ids);
    for (const inst of layout.obstacles) expect(catalogIds.has(inst.obstacle), `layout obstacle ${inst.obstacle} is in the catalog`).toBe(true);
  });
});
