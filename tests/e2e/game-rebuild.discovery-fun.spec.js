import { test, expect } from 'playwright/test';

// FUN acceptance for the Discovery Registry (Phase 2.2 rework). Proves the three
// QA requirements: (1) discoverability — a first-discovery tutorial teaches the
// player the registry exists; (2) exploration-triggered discovery — entering a
// new area logs a discovery with NO interaction prompt; (3) discoveries MATTER —
// discovering the City Gate reveals the hidden Salt River expedition (affects
// progression, not a collectible).

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
function scene(page, fn) {
  return page.evaluate(`(${fn.toString()})(window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene'))`);
}
async function hold(page, key, ms = 160) {
  await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(40);
}

test.describe('Discovery Registry — Fun (consequential)', () => {
  test('ENGINE: discovering the City Gate flips a real unlock (saltRiverRevealed)', async ({ page }) => {
    test.setTimeout(30_000);
    await ready(page);
    const out = await page.evaluate(() => {
      const g = window.__GAME__;
      g.resetAct1();
      const before = g.getAct1State().discoveryUnlocks.saltRiverRevealed;
      g.registerDiscovery({ id: 'landmark_city_gate', category: 'landmark', title: 'The City Gate' });
      const after = g.getAct1State().discoveryUnlocks.saltRiverRevealed;
      return { before, after };
    });
    expect(out.before, 'hidden before discovery').toBe(false);
    expect(out.after, 'discovering the City Gate unlocks the Salt River reveal').toBe(true);
  });

  test('REACHABILITY: walking into a new area logs a discovery (no prompt) and teaches [J]', async ({ page }) => {
    test.setTimeout(60_000);
    await ready(page);
    const before = await page.evaluate(() => window.__DISCOVERY__?.total ?? 0);
    // Walk right toward the desert/wash edge — never press E.
    for (let i = 0; i < 14; i++) await hold(page, 'ArrowRight');
    for (let i = 0; i < 6; i++) await hold(page, 'ArrowDown');
    await page.waitForFunction((b) => (window.__DISCOVERY__?.total ?? 0) > b, before, { timeout: 8_000 });
    // Exploration alone produced a discovery, and the first-discovery tutorial fired.
    const sawTutorial = await scene(page, (s) => Boolean(s._firstDiscoveryShown));
    expect(sawTutorial, 'first discovery shows the [J] tutorial').toBe(true);
  });

  test('MATTERS: the Salt River expedition is hidden until the City Gate is discovered', async ({ page }) => {
    test.setTimeout(60_000);
    await ready(page);
    // Hidden at first: marker invisible, zone not interactable.
    expect(await scene(page, (s) => s.saltRiverMarker.visible), 'expedition marker hidden at start').toBe(false);
    expect(await scene(page, (s) => s._saltRiverRevealed), 'not revealed at start').toBe(false);

    // Walk toward the City Gate (~1484,514), position-aware, until exploration
    // discovers it. (Real players head for the map edge; this just makes the
    // approach deterministic.)
    const pos = () => scene(page, (s) => ({ x: Math.round(s.player.x), y: Math.round(s.player.y) }));
    for (let g = 0; g < 60; g++) {
      if (await page.evaluate(() => window.__GAME__.getAct1State().discoveryUnlocks.saltRiverRevealed === true)) break;
      const p = await pos();
      const dx = 1484 - p.x, dy = 514 - p.y;
      if (Math.hypot(dx, dy) < 30) break;
      if (Math.abs(dx) > 12) await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', 130);
      if (Math.abs(dy) > 12) await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', 130);
    }
    await page.waitForFunction(() => window.__GAME__.getAct1State().discoveryUnlocks.saltRiverRevealed === true, null, { timeout: 10_000 });

    // The discovery revealed the opportunity: marker now visible + zone live.
    expect(await scene(page, (s) => s.saltRiverMarker.visible), 'expedition revealed by the discovery').toBe(true);
    expect(await scene(page, (s) => s._saltRiverRevealed), 'reveal flag set').toBe(true);
  });
});
