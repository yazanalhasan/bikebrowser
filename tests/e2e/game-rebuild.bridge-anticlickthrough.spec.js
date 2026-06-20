import { test, expect } from 'playwright/test';

// Anti-clickthrough acceptance for the Truss bridge (Phase 1 fix).
// Core guarantee: pressing E repeatedly with nothing chosen must NEVER place a
// material or complete the bridge. Intentional placement (pick then place) still
// works; a sound design passes and a weak one fails.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
async function bd(page) { return page.evaluate(() => window.__BRIDGE_DESIGN__); }

async function openTruss(page) {
  await page.evaluate(() => {
    window.__GAME__.resetAct1();
    const runtime = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    runtime.inventorySystem.addMany(['balsa', 'bamboo', 'steel', 'carbon_fiber', 'iron']);
    ['balsa', 'bamboo', 'steel', 'carbon_fiber', 'iron'].forEach((id) => runtime.testMaterial(id));
    window.__bikebrowserRebuildGame.registry.events.emit('bridgeDesign:start');
  });
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__?.active === true);
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'family');
  // select Truss
  for (let g = 0; g < 8; g += 1) {
    const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.families[window.__BRIDGE_DESIGN__.familyIndex].key);
    if (cur === 'truss') break;
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
}
async function pickPlace(page, materialId) {
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
  for (let g = 0; g < 9; g += 1) {
    const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.candidateId);
    if (cur === materialId) break;
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('KeyE'); // place the (now chosen) material
  await page.waitForTimeout(120);
}

test.describe('Bridge — anti-clickthrough', () => {
  test('mashing E with nothing chosen never places or completes the bridge', async ({ page }) => {
    test.setTimeout(60_000);
    await ready(page);
    await openTruss(page);

    // Hammer E (and Space) 14 times without ever choosing a material.
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press(i % 2 ? 'Space' : 'KeyE');
      await page.waitForTimeout(40);
    }
    const s = await bd(page);
    // Nothing placed, no slot filled, still in choose, no held material.
    expect(Object.keys(s.selection)).toHaveLength(0);
    expect(s.zones.every((z) => !z.filled)).toBe(true);
    expect(s.phase).toBe('choose');
    expect(s.candidateId).toBeNull();
  });

  test('intentional pick-then-place builds; sound design holds, weak design fails', async ({ page }) => {
    test.setTimeout(60_000);
    await ready(page);
    await openTruss(page);

    // Weak: balsa in a load-bearing role -> must NOT be safe.
    for (const m of ['bamboo', 'balsa', 'carbon_fiber', 'steel', 'iron']) await pickPlace(page, m);
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'ready');
    await page.keyboard.press('KeyE'); // TEST
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).not.toBe('safe');

    // Rebuild sound: all tested-safe -> holds.
    await page.keyboard.press('KeyE'); // rebuild
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
    for (const m of ['bamboo', 'steel', 'carbon_fiber', 'steel', 'iron']) await pickPlace(page, m);
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'ready');
    await page.keyboard.press('KeyE'); // TEST
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).toBe('safe');

    // Exits cleanly — the bridge overlay closes; a sound design chains into the
    // load-test simulation (loadTest:start), which is the intended flow.
    await page.keyboard.press('KeyE'); // finish
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.active === false);
    expect(await page.evaluate(() => Boolean(window.__GAME__.getAct1State().bridge.plan))).toBeTruthy();
  });
});
