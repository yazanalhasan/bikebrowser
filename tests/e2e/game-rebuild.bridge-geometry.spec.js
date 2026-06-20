import { test, expect } from 'playwright/test';

// Phase 2C — the brace teaches geometry: a diagonal is a triangle (resists), a
// flat/upright brace is a rectangle (deforms). Each slot defaults to its ideal
// orientation, so the brace is a triangle unless the player deliberately rotates
// it flat.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
async function openTruss(page) {
  await page.evaluate(() => {
    window.__GAME__.setAudioSettings({ speechEnabled: false });
    window.__GAME__.resetAct1();
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    r.inventorySystem.addMany(['bamboo','steel','carbon_fiber','iron']);
    ['bamboo','steel','carbon_fiber','iron'].forEach((id) => r.testMaterial(id));
    window.__bikebrowserRebuildGame.registry.events.emit('bridgeDesign:start');
  });
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__?.phase === 'family');
  for (let g = 0; g < 8; g += 1) {
    const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.families[window.__BRIDGE_DESIGN__.familyIndex].key);
    if (cur === 'truss') break; await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
}
async function select(page, id) {
  for (let g = 0; g < 9; g += 1) {
    const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.candidateId);
    if (cur === id) break; await page.keyboard.press('ArrowRight'); await page.waitForTimeout(40);
  }
}
async function activeRole(page) { return page.evaluate(() => window.__BRIDGE_DESIGN__.role); }

test.describe('Bridge — brace geometry (Phase 2C)', () => {
  test('a flat brace (rectangle) deforms and fails; the default triangle holds', async ({ page }) => {
    test.setTimeout(60_000);
    await ready(page);

    // --- flat brace fails on geometry, before the material solver ---
    await openTruss(page);
    // deck, support (sound materials, default orientation)
    await select(page, 'steel'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // deck
    await select(page, 'steel'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // support
    expect(await activeRole(page)).toBe('brace');
    // rotate the brace OFF the diagonal (45 -> 90 = rectangle), then place steel
    await select(page, 'steel');
    await page.keyboard.press('KeyR'); await page.waitForTimeout(80); // 45 -> 90 (rectangle)
    await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // brace placed flat
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.braceIsTriangle)).toBe(false);
    await select(page, 'steel'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // cable
    await select(page, 'iron'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120);  // foundation
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'ready');
    await page.keyboard.press('KeyE'); // TEST
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).not.toBe('safe');
    const verdict = await page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('BridgeDesignScene').verdict.text);
    expect(verdict.toLowerCase()).toContain('triangle');

    // --- same sound materials, default (triangle) brace -> holds ---
    await page.keyboard.press('KeyE'); // rebuild
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
    await select(page, 'steel'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // deck
    await select(page, 'steel'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // support
    await select(page, 'steel'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // brace (default 45 = triangle)
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.braceIsTriangle)).toBe(true);
    await select(page, 'steel'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120); // cable
    await select(page, 'iron'); await page.keyboard.press('KeyE'); await page.waitForTimeout(120);  // foundation
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'ready');
    await page.keyboard.press('KeyE'); // TEST
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).toBe('safe');
  });
});
