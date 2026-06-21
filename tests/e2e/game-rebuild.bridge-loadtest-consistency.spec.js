import { test, expect } from 'playwright/test';

// Regression for the soft-lock: a truss design the role-solver would accept must
// NOT pass design if it fails the load test (e.g. a brace weak in tension). Design
// acceptance now gates on the same StructuralModel the LoadTestScene runs, so
// "accepted" always survives the load test — no contradiction, no stuck player.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
async function setup(page) {
  await page.evaluate(() => {
    window.__GAME__.resetAct1();
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    r.inventorySystem.addMany(['bamboo', 'iron', 'steel', 'carbon_fiber', 'concrete']);
    ['bamboo', 'iron', 'steel', 'carbon_fiber', 'concrete'].forEach((id) => r.testMaterial(id));
  });
}
const design = (page, sel) => page.evaluate((s) => window.__GAME__.designBridge(s), { bridgeType: 'truss', ...sel });

test('a brace weak in tension is rejected at design AND would fail the load test (consistent)', async ({ page }) => {
  test.setTimeout(45000);
  await ready(page);
  await setup(page);

  // iron brace passes the role check (strength) but is weak in tension -> the
  // structural gate rejects it at design with a tension reason.
  const ironBrace = await design(page, { deck: 'bamboo', support: 'steel', brace: 'iron', cable: 'steel', foundation: 'iron' });
  expect(ironBrace.ok).toBe(false);
  expect(ironBrace.reason).toBe('load_test_fail');
  expect(ironBrace.failedRole).toBe('brace');
  expect(ironBrace.explanation.toLowerCase()).toContain('tension');

  // The same design with a steel brace is accepted AND survives every load.
  const steelBrace = await design(page, { deck: 'bamboo', support: 'steel', brace: 'steel', cable: 'steel', foundation: 'iron' });
  expect(steelBrace.ok).toBe(true);
  expect(steelBrace.outcome).toBe('safe');

  // carbon fibre brace also passes (the clue's "strong candidate").
  const carbonBrace = await design(page, { deck: 'bamboo', support: 'steel', brace: 'carbon_fiber', cable: 'steel', foundation: 'iron' });
  expect(carbonBrace.ok).toBe(true);
});
