import { mkdirSync } from 'node:fs';
import { test, expect } from 'playwright/test';

// Player reachability for the Da Vinci self-supporting bridge family.
// Setup (test materials) may use the API; the BUILD — family choice, wood pick,
// seating beams, rotating, testing — is performed with REAL keyboard only.
const captureDir = 'playtest_captures/game_rebuild_davinci';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}

async function openDavinciWithWoods(page) {
  await page.evaluate(() => {
    window.__GAME__.resetAct1();
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    r.inventorySystem.addMany(['balsa', 'bamboo']);
    ['balsa', 'bamboo'].forEach((id) => r.testMaterial(id));
    window.__bikebrowserRebuildGame.registry.events.emit('bridgeDesign:start');
  });
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__ && window.__BRIDGE_DESIGN__.active === true);
}

async function chooseFamily(page, key) {
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'family');
  for (let g = 0; g < 8; g += 1) {
    const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.families[window.__BRIDGE_DESIGN__.familyIndex].key);
    if (cur === key) break;
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('KeyE');
}

async function pickWood(page, id) {
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'dv_wood');
  for (let g = 0; g < 6; g += 1) {
    const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.dvWoodId);
    if (cur === id) break;
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('KeyE');
}

async function seatAllInOrder(page) {
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'dv_build');
  for (let i = 0; i < 7; i += 1) {
    await page.keyboard.press('KeyE'); // active auto-advances bottom-up → each beam interlocks
    await page.waitForTimeout(50);
  }
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'dv_ready');
}

async function testIt(page) {
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'dv_ready');
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
}

test.describe('Player reachability — Da Vinci self-supporting bridge', () => {
  test('geometry first, then material: a balsa arch is sound but crushes; bamboo holds', async ({ page }) => {
    test.setTimeout(60_000);
    mkdirSync(captureDir, { recursive: true });
    await ready(page);
    await openDavinciWithWoods(page);

    await chooseFamily(page, 'davinci');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.bridgeType)).toBe('davinci');

    // Build a geometrically valid arch out of weak balsa.
    await pickWood(page, 'balsa');
    await seatAllInOrder(page);
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.dvValid)).toBe(true);
    await page.screenshot({ path: `${captureDir}/01_davinci_assembled.png`, fullPage: true });
    await testIt(page);
    // Sound geometry, weak wood -> it fails under load (not 'safe').
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).not.toBe('safe');
    await page.screenshot({ path: `${captureDir}/02_davinci_balsa_fail.png`, fullPage: true });

    // Rebuild with bamboo (UTM-safe) -> the same shape now holds.
    await page.keyboard.press('KeyE'); // rebuild -> back to wood pick
    await pickWood(page, 'bamboo');
    await seatAllInOrder(page);
    await testIt(page);
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).toBe('safe');
    await page.screenshot({ path: `${captureDir}/03_davinci_bamboo_hold.png`, fullPage: true });

    await page.keyboard.press('KeyE'); // finish
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.active === false);
    const plan = await page.evaluate(() => window.__GAME__.getAct1State().bridge.plan);
    expect(plan).toBeTruthy();
    expect(plan.bridgeType).toBe('davinci');
  });

  test('a beam left at the wrong angle is not self-supporting and collapses', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    await openDavinciWithWoods(page);
    await chooseFamily(page, 'davinci');
    await pickWood(page, 'bamboo');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'dv_build');
    // Seat six beams correctly, then rotate the last one off its interlock angle.
    for (let i = 0; i < 6; i += 1) { await page.keyboard.press('KeyE'); await page.waitForTimeout(50); }
    await page.keyboard.press('KeyR'); // misalign the held beam
    await page.keyboard.press('KeyE'); // place it crooked
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'dv_ready');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.dvValid)).toBe(false);
    await testIt(page);
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).toBe('collapse');
  });

  test('Escape exits the bridge family screen — never trapped', async ({ page }) => {
    test.setTimeout(30_000);
    await ready(page);
    await openDavinciWithWoods(page);
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'family');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.active === false);
    expect(await page.evaluate(() => Boolean(window.__bikebrowserRebuildGame.registry.get('modalActive')))).toBe(false);
  });
});
