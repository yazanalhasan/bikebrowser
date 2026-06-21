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

    // The journal toggle ([J]) is suppressed while a modal/dialogue is active
    // (NeighborhoodScene: modal = modalActive || dialogueActive || editMode), and
    // observing the desert helpers can leave a dialogue up. Dismiss it and wait for
    // the modal state to clear before opening the registry.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const g = window.__bikebrowserRebuildGame;
      return !g.registry.get('modalActive') && !g.registry.get('dialogueActive');
    }, null, { timeout: 5_000 }).catch(() => {});

    // Open the registry with [J] — the persistent, categorised payoff. Retry while
    // it isn't open yet (any lingering transient overlay briefly suppresses the
    // toggle). We only press when it's closed, so this never toggles it back shut.
    let registryOpen = false;
    for (let i = 0; i < 12 && !registryOpen; i += 1) {
      registryOpen = await page.evaluate(() => window.__DISCOVERY__.open === true);
      if (registryOpen) break;
      await page.keyboard.press('KeyJ');
      await page.waitForTimeout(500);
      registryOpen = await page.evaluate(() => window.__DISCOVERY__.open === true);
    }
    expect(registryOpen, 'pressing [J] opens the discovery registry').toBe(true);
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
