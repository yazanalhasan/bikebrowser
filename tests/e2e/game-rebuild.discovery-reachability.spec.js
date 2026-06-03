import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY + PAYOFF acceptance for the Discovery Registry (Phase 2.2).
// By REAL keyboard only: the player triggers a discovery through gameplay, SEES
// the "NEW DISCOVERY" banner (payoff), and opens the persistent registry view
// with [J]. No __GAME__ for the action.
const captureDir = 'playtest_captures/game_rebuild_discovery_reachability';

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

test.describe('Player reachability — discovery registry', () => {
  test('a discovery through play shows NEW DISCOVERY, and the registry view opens with [J]', async ({ page }) => {
    test.setTimeout(60_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);

    // Baseline: nothing discovered via this path yet.
    const before = await page.evaluate(() => window.__DISCOVERY__?.total ?? 0);

    // Observe the desert helpers (non-debug gameplay) -> plants + a landmark
    // register, and the NEW DISCOVERY banner fires.
    const eco = await zoneById(page, 'ecology_patch');
    expect(eco).toBeTruthy();
    await walkTo(page, { ...eco });
    await page.keyboard.press('KeyE');
    await page.waitForFunction((b) => window.__DISCOVERY__ && window.__DISCOVERY__.total > b, before, { timeout: 10_000 });
    // The banner is the immediate payoff (it auto-dismisses, so check promptly).
    expect(await page.evaluate(() => window.__DISCOVERY__.bannerVisible), 'NEW DISCOVERY banner is shown').toBe(true);
    expect(await page.evaluate(() => window.__DISCOVERY__.last?.title), 'the banner names a real discovery').toBeTruthy();
    await page.screenshot({ path: `${captureDir}/01_new_discovery_banner.png`, fullPage: true });

    // Open the registry with [J] — the persistent, categorised payoff.
    await page.keyboard.press('KeyJ');
    await page.waitForFunction(() => window.__DISCOVERY__.open === true, null, { timeout: 5_000 });
    const state = await page.evaluate(() => window.__DISCOVERY__);
    expect(state.total, 'the registry holds the discoveries').toBeGreaterThan(0);
    expect(state.categories.some((c) => c.category === 'plant' && c.count > 0), 'plants are catalogued').toBe(true);
    await page.screenshot({ path: `${captureDir}/02_registry_open.png`, fullPage: true });

    // [J] again closes it — not a trap.
    await page.keyboard.press('KeyJ');
    await page.waitForFunction(() => window.__DISCOVERY__.open === false, null, { timeout: 5_000 });
  });

  test('discoveries persist across save/load (still in the registry after reload)', async ({ page }) => {
    test.setTimeout(60_000);
    await ready(page);
    const eco = await zoneById(page, 'ecology_patch');
    await walkTo(page, { ...eco });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__DISCOVERY__ && window.__DISCOVERY__.total > 0, null, { timeout: 10_000 });
    const total = await page.evaluate(() => { window.__GAME__.saveGame(); return window.__DISCOVERY__.total; });
    // Reload the page and load the save — discoveries are still there.
    await page.reload();
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
    const reloaded = await page.evaluate(() => window.__GAME__.loadGame().state.discoveryRegistry.total);
    expect(reloaded, 'discoveries persist across reload + load').toBe(total);
  });
});
