import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY + PAYOFF acceptance for the Salt River biome (Phase 2.4).
// By REAL keyboard: before the wider map opens, the expedition gives a clear
// LOCKED panel (reachable, never silent); after it opens (setup only), the
// player walks there and runs the full observe->predict->outcome->payoff loop.
const captureDir = 'playtest_captures/game_rebuild_biome_reachability';

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
  for (let guard = 0; guard < 300; guard += 1) {
    const pos = await playerPosition(page);
    if (await activeInteraction(page) === id) return;
    const dx = x - pos.x, dy = y - pos.y;
    if (Math.hypot(dx, dy) < ARRIVE) return;
    if (Math.abs(dx) > STEP) await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(220, Math.max(45, Math.abs(dx) * 1.8)));
    if (Math.abs(dy) > STEP) await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(220, Math.max(45, Math.abs(dy) * 1.8)));
  }
  throw new Error(`Could not walk to ${id}`);
}
async function pickBiome(page, optionId) {
  await page.waitForFunction(() => window.__BIOME__.phase === 'predict');
  for (let g = 0; g < 6; g += 1) {
    if ((await page.evaluate(() => window.__BIOME__.optionId)) === optionId) break;
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__BIOME__.phase === 'result');
}

test.describe('Player reachability — Salt River biome', () => {
  test('locked before the wider map: the expedition gives a clear panel, never silence', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    const zone = await zoneById(page, 'salt_river_expedition');
    expect(zone).toBeTruthy();
    await walkTo(page, { ...zone });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__BIOME__ && window.__BIOME__.active === true, null, { timeout: 10_000 });
    expect(await page.evaluate(() => window.__BIOME__.phase), 'locked entry shows a clear panel').toBe('blocked');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__BIOME__.active === false);
  });

  test('after the wider map opens, a real player runs the biome loop and gets the payoff', async ({ page }) => {
    test.setTimeout(70_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);
    // Setup only (prerequisite, not the action): open the wider map.
    await page.evaluate(() => {
      const g = window.__GAME__;
      g.handleInteraction('collect_materials');
      g.handleInteraction('ecology_patch');
      ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => g.testMaterial(id));
      g.designBridge({ deck: 'mesquite', support: 'steel', brace: 'copper_brace' });
      g.repairBridge();
      g.unlockWiderMap();
    });

    const zone = await zoneById(page, 'salt_river_expedition');
    await walkTo(page, { ...zone });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__BIOME__ && window.__BIOME__.active === true, null, { timeout: 10_000 });
    await page.waitForFunction(() => window.__BIOME__.phase === 'intro');
    await page.screenshot({ path: `${captureDir}/01_intro.png`, fullPage: true });
    await page.keyboard.press('KeyE'); // intro -> observe

    // Site 1 (ecology): pick the right plant (saltbush) -> good fit.
    await page.waitForFunction(() => window.__BIOME__.phase === 'observe');
    await page.keyboard.press('KeyE'); // observe -> predict
    await pickBiome(page, 'saltbush');
    expect(await page.evaluate(() => window.__BIOME__.thrives), 'saltbush fits').toBe(true);
    await page.screenshot({ path: `${captureDir}/02_good_fit.png`, fullPage: true });
    await page.keyboard.press('KeyE'); // result -> next observe

    // Site 2 (engineering): pick steel (wrong) -> teaches copper.
    await page.waitForFunction(() => window.__BIOME__.phase === 'observe');
    await page.keyboard.press('KeyE'); // observe -> predict
    await pickBiome(page, 'steel');
    expect(await page.evaluate(() => window.__BIOME__.thrives), 'steel does not last').toBe(false);
    await page.keyboard.press('KeyE'); // result -> summary

    await page.waitForFunction(() => window.__BIOME__.phase === 'summary');
    await page.screenshot({ path: `${captureDir}/03_summary.png`, fullPage: true });
    await page.keyboard.press('KeyE'); // summary -> close
    await page.waitForFunction(() => window.__BIOME__.active === false);

    // PAYOFF (observation): the biome is complete and its discoveries are recorded.
    const payoff = await page.evaluate(() => {
      const s = window.__GAME__.getAct1State();
      const biome = s.biomes.biomes.find((b) => b.id === 'salt_river');
      const disc = JSON.stringify(s.discoveryRegistry.entries).toLowerCase();
      return { complete: biome.complete, saltbush: disc.includes('saltbush'), corrosion: disc.includes('corrosion') };
    });
    expect(payoff.complete, 'biome loop completed through play').toBe(true);
    expect(payoff.saltbush && payoff.corrosion, 'biome discoveries recorded as payoff').toBe(true);
  });
});
