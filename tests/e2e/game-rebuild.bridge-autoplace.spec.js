import { test, expect } from 'playwright/test';

// After the bridge is built and PASSES the full load test, it should be placed
// over the wash automatically (barrier drops, sprite repaired, wider map opens) —
// no separate manual "Reconnect the crossing" step required.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}

test('a passed load test auto-places the bridge and makes the wash crossable', async ({ page }) => {
  test.setTimeout(45000);
  await ready(page);
  await page.evaluate(() => {
    window.__GAME__.setAudioSettings({ speechEnabled: false });
    window.__GAME__.resetAct1();
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    r.inventorySystem.addMany(['bamboo', 'steel', 'carbon_fiber', 'iron']);
    ['bamboo', 'steel', 'carbon_fiber', 'iron'].forEach((id) => r.testMaterial(id));
    // Build a sound design (sets the plan) WITHOUT manually repairing.
    r.designBridge({ bridgeType: 'truss', deck: 'steel', support: 'steel', brace: 'steel', cable: 'steel', foundation: 'iron' });
  });

  // Before the load test completes: not reconnected, barrier still blocks.
  let st = await page.evaluate(() => {
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return { reconnected: r.constructionSystem.bridgeReconnected, barrier: Boolean(s.washBarrier?.body?.enable) };
  });
  expect(st.reconnected).toBe(false);
  expect(st.barrier).toBe(true);

  // Fire the SAME signal the LoadTestScene emits when the bridge holds through all loads.
  await page.evaluate(() => window.__bikebrowserRebuildGame.registry.events.emit('loadTest:done', { ok: true }));
  await page.waitForTimeout(150);

  // After: auto-placed — reconnected, barrier dropped, wider map unlocked.
  st = await page.evaluate(() => {
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return {
      reconnected: r.constructionSystem.bridgeReconnected,
      barrier: Boolean(s.washBarrier?.body?.enable),
      crossingActive: Boolean(window.__CROSSING__?.active),
      plan: Boolean(r.getAct1State().bridge.plan),
    };
  });
  expect(st.reconnected, 'bridge placed over the wash after a passed load test').toBe(true);
  expect(st.barrier, 'wash barrier dropped — the crossing is passable').toBe(false);
  expect(st.crossingActive, 'Community Crossing payoff plays').toBe(true);

  // A failed load test must NOT auto-place. (fresh run)
  await page.evaluate(() => {
    window.__GAME__.resetAct1();
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    r.inventorySystem.addMany(['steel', 'iron']); ['steel', 'iron'].forEach((id) => r.testMaterial(id));
    r.designBridge({ bridgeType: 'truss', deck: 'steel', support: 'steel', brace: 'steel' });
    window.__bikebrowserRebuildGame.registry.events.emit('loadTest:done', { ok: false });
  });
  await page.waitForTimeout(100);
  const failed = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('act1Runtime').constructionSystem.bridgeReconnected);
  expect(failed, 'a failed load test does not place the bridge').toBe(false);
});
