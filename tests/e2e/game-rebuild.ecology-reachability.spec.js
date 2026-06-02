import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY + PAYOFF acceptance for the Ecology Loop (Phase 2.1).
// The action under test — observe a site, predict a plant, see the outcome, get
// the payoff — is performed with REAL keyboard only. No __GAME__ for the action.
const captureDir = 'playtest_captures/game_rebuild_ecology_reachability';

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
  for (let guard = 0; guard < 240; guard += 1) {
    const pos = await playerPosition(page);
    if (await activeInteraction(page) === id) return;
    const dx = x - pos.x, dy = y - pos.y;
    if (Math.hypot(dx, dy) < ARRIVE) return;
    if (Math.abs(dx) > STEP) await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(220, Math.max(45, Math.abs(dx) * 2.0)));
    if (Math.abs(dy) > STEP) await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(220, Math.max(45, Math.abs(dy) * 2.0)));
  }
  throw new Error(`Could not walk to ${id}`);
}
// In the predict phase, cycle the plant card to `speciesId` and plant it.
async function plant(page, speciesId) {
  await page.waitForFunction(() => window.__ECOLOGY__.phase === 'predict');
  for (let g = 0; g < 8; g += 1) {
    if ((await page.evaluate(() => window.__ECOLOGY__.optionId)) === speciesId) break;
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__ECOLOGY__.phase === 'result');
}

test.describe('Player reachability — ecology loop', () => {
  test('a real player plants the desert (keyboard): wrong pick struggles, right pick thrives, payoff teaches', async ({ page }) => {
    test.setTimeout(60_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);

    // Walk to the planting spot and press E to open the ecology loop.
    const zone = await zoneById(page, 'ecology_garden');
    expect(zone).toBeTruthy();
    await walkTo(page, { ...zone });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__ECOLOGY__ && window.__ECOLOGY__.active === true, null, { timeout: 10_000 });

    // Site 1 (wash edge, correct = mesquite): pick the WRONG plant (creosote)
    // -> it struggles, and the payoff names the plant that actually fits.
    await page.waitForFunction(() => window.__ECOLOGY__.phase === 'observe');
    await page.screenshot({ path: `${captureDir}/01_observe.png`, fullPage: true });
    await page.keyboard.press('KeyE'); // observe -> predict
    await plant(page, 'creosote');
    expect(await page.evaluate(() => window.__ECOLOGY__.thrives), 'wrong plant struggles').toBe(false);
    expect(await page.evaluate(() => window.__ECOLOGY__.payoff), 'payoff delivered even when wrong').toBe(true);
    await page.screenshot({ path: `${captureDir}/02_wrong_struggles.png`, fullPage: true });
    await page.keyboard.press('KeyE'); // result -> next observe

    // Site 2 (open dry flat, correct = creosote): pick the RIGHT plant -> thrives.
    await page.waitForFunction(() => window.__ECOLOGY__.phase === 'observe');
    await page.keyboard.press('KeyE'); // observe -> predict
    await plant(page, 'creosote');
    expect(await page.evaluate(() => window.__ECOLOGY__.thrives), 'right plant thrives').toBe(true);
    await page.screenshot({ path: `${captureDir}/03_right_thrives.png`, fullPage: true });
    await page.keyboard.press('KeyE'); // result -> summary

    await page.waitForFunction(() => window.__ECOLOGY__.phase === 'summary');
    expect(await page.evaluate(() => window.__ECOLOGY__.matchedCount), 'at least one site thrived on first pick').toBeGreaterThanOrEqual(1);
    await page.keyboard.press('KeyE'); // summary -> close
    await page.waitForFunction(() => window.__ECOLOGY__.active === false);

    // PAYOFF acceptance (observation only): the player's planting left field
    // notes — the plants they reasoned about are now in the notebook.
    const notebook = await page.evaluate(() => window.__GAME__.getAct1State().notebook);
    const text = JSON.stringify(notebook).toLowerCase();
    expect(text.includes('mesquite') && text.includes('creosote'), 'notebook records the plants learned').toBe(true);
  });

  test('Escape exits the ecology overlay — never trapped', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    await page.evaluate(() => {
      window.__GAME__.resetAct1();
      window.__bikebrowserRebuildGame.registry.events.emit('ecology:start');
    });
    await page.waitForFunction(() => window.__ECOLOGY__ && window.__ECOLOGY__.active === true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__ECOLOGY__.active === false);
    expect(await page.evaluate(() => Boolean(window.__bikebrowserRebuildGame.registry.get('modalActive')))).toBe(false);
  });
});
