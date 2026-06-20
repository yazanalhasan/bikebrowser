import { test, expect } from 'playwright/test';

// Phase 2A — role-based material logic regression guard.
// Locks the centrepiece lesson: a material's fit depends on the JOB, not one
// overall flag. Concrete is a great foundation (compression) but a terrible cable
// (tension); balsa is too floppy for a deck. Driven through the runtime solver.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
async function setup(page) {
  await page.evaluate(() => {
    window.__GAME__.resetAct1();
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    r.inventorySystem.addMany(['balsa','pine','bamboo','brick','concrete','iron','steel','carbon_fiber']);
    ['balsa','pine','bamboo','brick','concrete','iron','steel','carbon_fiber'].forEach((id) => r.testMaterial(id));
  });
}
const design = (page, sel) => page.evaluate((s) => window.__GAME__.designBridge(s), { bridgeType: 'truss', ...sel });

test.describe('Bridge — role-based material logic (Phase 2A)', () => {
  test('the same material fits one role and fails another (concrete: foundation yes, cable no)', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    await setup(page);

    // Concrete in the CABLE -> fails (weak in tension), and names the cable.
    const cable = await design(page, { deck: 'steel', support: 'steel', brace: 'steel', cable: 'concrete', foundation: 'steel' });
    expect(cable.ok).toBe(false);
    expect(cable.failedRole).toBe('cable');
    expect(cable.explanation.toLowerCase()).toContain('tension');

    // Concrete in the FOUNDATION (everything else sound) -> holds (strong in compression).
    const found = await design(page, { deck: 'steel', support: 'steel', brace: 'steel', cable: 'steel', foundation: 'concrete' });
    expect(found.ok).toBe(true);
    expect(found.outcome).toBe('safe');

    // Balsa deck -> fails (too floppy / low stiffness), and names the deck.
    const deck = await design(page, { deck: 'balsa', support: 'steel', brace: 'steel' });
    expect(deck.ok).toBe(false);
    expect(deck.failedRole).toBe('deck');

    // A role-appropriate sound design holds.
    const ok = await design(page, { deck: 'steel', support: 'concrete', brace: 'steel', cable: 'steel', foundation: 'concrete' });
    expect(ok.ok).toBe(true);
    expect(ok.outcome).toBe('safe');
  });
});
