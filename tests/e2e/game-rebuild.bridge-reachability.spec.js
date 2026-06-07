import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY acceptance for the Bridge Design UI (Phase 1.9.3).
// The action under test — designing the bridge — is performed with REAL keyboard
// only. Setup (collect + test materials) may use __GAME__; the design must not.
const captureDir = 'playtest_captures/game_rebuild_bridge_reachability';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
async function playerPosition(page) {
  return page.evaluate(() => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return { x: s.player.x, y: s.player.y };
  });
}
async function hold(page, key, ms = 140) {
  await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(40);
}
async function activeInteraction(page) {
  return page.evaluate(() => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return s.interactions.nearest(s.player)?.id || null;
  });
}
async function zoneById(page, id) {
  return page.evaluate((zid) => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    const z = s.interactions.zones.find((c) => c.id === zid || c.action === zid);
    return z ? { id: z.id, x: z.x, y: z.y } : null;
  }, id);
}
async function walkTo(page, target) {
  const { x, y, id } = target;
  const ARRIVE = 24, STEP = 6;
  for (let guard = 0; guard < 200; guard += 1) {
    const pos = await playerPosition(page);
    if (await activeInteraction(page) === id) return;
    const dx = x - pos.x, dy = y - pos.y;
    if (Math.hypot(dx, dy) < ARRIVE) return;
    if (Math.abs(dx) > STEP) await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(220, Math.max(45, Math.abs(dx) * 2.0)));
    if (Math.abs(dy) > STEP) await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(220, Math.max(45, Math.abs(dy) * 2.0)));
  }
  throw new Error(`Could not walk to ${id}`);
}

test.describe('Player reachability — bridge design', () => {
  test('a real player designs the bridge (keyboard); a weak design fails, a sound one holds', async ({ page }) => {
    test.setTimeout(60_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);
    // Setup only (not the action under test): collect + test materials.
    await page.evaluate(() => {
      window.__GAME__.resetAct1();
      const runtime = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
      runtime.inventorySystem.addMany(['balsa', 'bamboo', 'steel', 'carbon_fiber', 'iron']);
      ['balsa', 'bamboo', 'steel', 'carbon_fiber', 'iron'].forEach((id) => runtime.testMaterial(id));
    });

    // Walk to the bridge workbench and press E to open the design overlay.
    const bp = await zoneById(page, 'bridge_plan');
    expect(bp).toBeTruthy();
    await walkTo(page, { ...bp });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__ && window.__BRIDGE_DESIGN__.active === true, null, { timeout: 10_000 });

    // Choose a bridge family first; the Truss is the deck/support/brace/cable/foundation build.
    const chooseFamily = async (key) => {
      await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'family');
      for (let g = 0; g < 8; g += 1) {
        const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.families[window.__BRIDGE_DESIGN__.familyIndex].key);
        if (cur === key) break;
        await page.keyboard.press('ArrowDown');
      }
      await page.keyboard.press('KeyE');
    };
    await chooseFamily('truss');

    const pick = async (materialId) => {
      await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
      for (let g = 0; g < 8; g += 1) {
        const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.candidateId);
        if (cur === materialId) break;
        await page.keyboard.press('ArrowRight');
      }
      await page.keyboard.press('KeyE'); // drop the held part into the active slot
    };
    // Once every slot is filled the scene waits on the "Test Bridge" button.
    const testBridge = async () => {
      await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'ready');
      await page.keyboard.press('KeyE'); // press Test Bridge -> runs the load solver
    };

    // Flawed design: weak balsa support -> it must fail visibly (5-role builder).
    await pick('bamboo'); await pick('balsa'); await pick('carbon_fiber'); await pick('steel'); await pick('iron');
    await testBridge();
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
    await page.screenshot({ path: `${captureDir}/01_bridge_fail.png`, fullPage: true });
    const failOutcome = await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome);
    expect(failOutcome).not.toBe('safe');

    // Iterate to a sound design: steel support -> it holds.
    await page.keyboard.press('KeyE'); // rebuild
    await pick('bamboo'); await pick('steel'); await pick('carbon_fiber'); await pick('steel'); await pick('iron');
    await testBridge();
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
    await page.screenshot({ path: `${captureDir}/02_bridge_hold.png`, fullPage: true });
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome)).toBe('safe');
    await page.keyboard.press('KeyE'); // finish
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.active === false);

    // Observation only: the sound design created the bridge plan.
    const plan = await page.evaluate(() => window.__GAME__.getAct1State().bridge.plan);
    expect(plan).toBeTruthy();
  });

  test('Escape exits the bridge design overlay — never trapped', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    await page.evaluate(() => {
      window.__GAME__.resetAct1();
      const runtime = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
      runtime.inventorySystem.addMany(['steel', 'bamboo']);
      ['bamboo', 'steel'].forEach((id) => runtime.testMaterial(id));
      window.__bikebrowserRebuildGame.registry.events.emit('bridgeDesign:start');
    });
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__ && window.__BRIDGE_DESIGN__.active === true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.active === false);
    expect(await page.evaluate(() => Boolean(window.__bikebrowserRebuildGame.registry.get('modalActive')))).toBe(false);
  });
});
