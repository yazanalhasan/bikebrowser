import { test, expect } from 'playwright/test';

// ENGINE acceptance for the Salt River biome (Phase 2.4). The biome is gated
// behind the wider map, carries the full observe->predict->outcome->payoff loop
// (right fit thrives, wrong still teaches), registers discoveries, and persists.

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => window.__GAME__.resetAct1());
}

function unlockWiderMap(page) {
  return page.evaluate(() => {
    const g = window.__GAME__;
    g.handleInteraction('collect_materials');
    g.handleInteraction('ecology_patch');
    ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => g.testMaterial(id));
    g.designBridge({ deck: 'mesquite', support: 'steel', brace: 'copper_brace' });
    g.repairBridge();
    return g.unlockWiderMap().ok;
  });
}

test.describe('Engine acceptance — Salt River biome', () => {
  test('gated until the wider map opens; full loop teaches; discoveries + persistence', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);

    // Gated before the wider map opens.
    const lockedEnter = await page.evaluate(() => window.__GAME__.enterBiome('salt_river'));
    expect(lockedEnter.ok, 'biome is locked until the bridge is repaired').toBe(false);
    expect(lockedEnter.reason).toBe('locked');

    expect(await unlockWiderMap(page), 'wider map unlocks via the real chain').toBe(true);

    const result = await page.evaluate(() => {
      const g = window.__GAME__;
      const enter = g.enterBiome('salt_river');
      // Site 1 (ecology): saltbush is the salt-tolerant fit.
      g.observeBiomePlacement('salt_river', 'salt_bank_plant');
      g.predictBiomePlacement('salt_river', 'salt_bank_plant', 'saltbush');
      const eco = g.resolveBiomePlacement('salt_river', 'salt_bank_plant');
      // Site 2 (engineering): predict steel (wrong) -> teaches copper for corrosion.
      g.observeBiomePlacement('salt_river', 'salt_crossing_material');
      g.predictBiomePlacement('salt_river', 'salt_crossing_material', 'steel');
      const eng = g.resolveBiomePlacement('salt_river', 'salt_crossing_material');
      const state = g.getAct1State();
      const biome = state.biomes.biomes.find((b) => b.id === 'salt_river');
      const disc = JSON.stringify(state.discoveryRegistry.entries).toLowerCase();
      return {
        enteredOk: enter.ok,
        ecoThrives: eco.thrives,
        engThrives: eng.thrives,
        engCorrect: eng.correct,
        engWhy: eng.why,
        resolved: biome.resolved,
        complete: biome.complete,
        hasSaltbush: disc.includes('saltbush'),
        hasCorrosion: disc.includes('corrosion'),
        hasLandmark: disc.includes('salt river'),
      };
    });

    expect(result.enteredOk).toBe(true);
    expect(result.ecoThrives, 'saltbush fits the salt flat').toBe(true);
    expect(result.engThrives, 'steel does not last in salt water').toBe(false);
    expect(result.engCorrect, 'copper is the corrosion-resistant fit').toBe('copper_brace');
    expect(result.engWhy.length, 'a teaching explanation is given when wrong').toBeGreaterThan(0);
    expect(result.resolved, 'both sites resolved').toBe(2);
    expect(result.complete, 'biome loop complete').toBe(true);
    expect(result.hasSaltbush && result.hasCorrosion && result.hasLandmark, 'biome registers plant/concept/landmark discoveries').toBe(true);

    // Persistence: save/load keeps the biome progress.
    const reloaded = await page.evaluate(() => {
      window.__GAME__.saveGame();
      const s = window.__GAME__.loadGame().state.biomes.biomes.find((b) => b.id === 'salt_river');
      return { resolved: s.resolved, complete: s.complete };
    });
    expect(reloaded.resolved).toBe(2);
    expect(reloaded.complete).toBe(true);
  });
});
