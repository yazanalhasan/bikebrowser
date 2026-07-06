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
    for (let i = 0; i < 8; i += 1) g.handleInteraction('collect_materials');
    for (let i = 0; i < 3; i += 1) g.handleInteraction('ecology_patch');
    ['bamboo', 'steel', 'carbon_fiber'].forEach((id) => g.testMaterial(id));
    g.designBridge({ deck: 'bamboo', support: 'steel', brace: 'carbon_fiber' });
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
      // Full ecology-depth loop: three condition-grounded ecology sites + one
      // engineering site. Each is observe -> predict -> resolve, right fit thrives.
      // Site 1 (ecology): saltbush is the salt-tolerant fit for the brackish flat.
      g.observeBiomePlacement('salt_river', 'salt_bank_plant');
      g.predictBiomePlacement('salt_river', 'salt_bank_plant', 'saltbush');
      const eco = g.resolveBiomePlacement('salt_river', 'salt_bank_plant');
      // Site 2 (ecology): cottonwood fits the moist, low-salinity fresh bank.
      g.observeBiomePlacement('salt_river', 'fresh_bank_tree');
      g.predictBiomePlacement('salt_river', 'fresh_bank_tree', 'cottonwood');
      const eco2 = g.resolveBiomePlacement('salt_river', 'fresh_bank_tree');
      // Site 3 (ecology): deep-rooted mesquite fits the dry terrace.
      g.observeBiomePlacement('salt_river', 'dry_terrace_mesquite');
      g.predictBiomePlacement('salt_river', 'dry_terrace_mesquite', 'mesquite');
      const eco3 = g.resolveBiomePlacement('salt_river', 'dry_terrace_mesquite');
      // Site 4 (engineering): predict steel (wrong) -> teaches copper for corrosion.
      g.observeBiomePlacement('salt_river', 'salt_crossing_material');
      g.predictBiomePlacement('salt_river', 'salt_crossing_material', 'steel');
      const eng = g.resolveBiomePlacement('salt_river', 'salt_crossing_material');
      // Completion reward: first-time-only ZuzuBucks via the biome:complete hook.
      const bucksBefore = g.getAct1State().zuzuBucks;
      const award = g.completeBiome({ biomeId: 'salt_river' });
      const bucksAfter = g.getAct1State().zuzuBucks;
      const replay = g.completeBiome({ biomeId: 'salt_river' }); // must not re-award
      const bucksReplay = g.getAct1State().zuzuBucks;
      const state = g.getAct1State();
      const biome = state.biomes.biomes.find((b) => b.id === 'salt_river');
      const disc = JSON.stringify(state.discoveryRegistry.entries).toLowerCase();
      const notes = JSON.stringify(state.notebook).toLowerCase();
      return {
        enteredOk: enter.ok,
        ecoThrives: eco.thrives,
        eco2Thrives: eco2.thrives,
        eco3Thrives: eco3.thrives,
        engThrives: eng.thrives,
        engCorrect: eng.correct,
        engWhy: eng.why,
        resolved: biome.resolved,
        count: biome.count,
        complete: biome.complete,
        hasSaltbush: disc.includes('saltbush'),
        hasCottonwood: disc.includes('cottonwood'),
        hasCorrosion: disc.includes('corrosion'),
        hasLandmark: disc.includes('salt river'),
        notebookHasCottonwood: notes.includes('cottonwood'),
        awardOk: award.ok,
        bucksDelta: bucksAfter - bucksBefore,
        replayOk: replay.ok,
        bucksReplayDelta: bucksReplay - bucksAfter,
      };
    });

    expect(result.enteredOk).toBe(true);
    expect(result.ecoThrives, 'saltbush fits the salt flat').toBe(true);
    expect(result.eco2Thrives, 'cottonwood fits the moist fresh bank').toBe(true);
    expect(result.eco3Thrives, 'mesquite fits the dry terrace').toBe(true);
    expect(result.engThrives, 'steel does not last in salt water').toBe(false);
    expect(result.engCorrect, 'copper is the corrosion-resistant fit').toBe('copper_brace');
    expect(result.engWhy.length, 'a teaching explanation is given when wrong').toBeGreaterThan(0);
    expect(result.resolved, 'all four sites resolved').toBe(4);
    expect(result.count, 'biome carries four placements (3 ecology + 1 engineering)').toBe(4);
    expect(result.complete, 'biome loop complete').toBe(true);
    expect(result.hasSaltbush && result.hasCottonwood && result.hasCorrosion && result.hasLandmark, 'biome registers plant/concept/landmark discoveries').toBe(true);
    expect(result.notebookHasCottonwood, 'salt-river ecology unlocks notebook entries').toBe(true);
    // Reward hook: first completion awards ZuzuBucks once; replay does not.
    expect(result.awardOk, 'first completion awards the reward').toBe(true);
    expect(result.bucksDelta, 'first completion grants ZuzuBucks').toBeGreaterThan(0);
    expect(result.replayOk, 'a repeat completion does not re-award').toBe(false);
    expect(result.bucksReplayDelta, 'no ZuzuBucks farming on replay').toBe(0);

    // Persistence: save/load keeps the biome progress.
    const reloaded = await page.evaluate(() => {
      window.__GAME__.saveGame();
      const s = window.__GAME__.loadGame().state.biomes.biomes.find((b) => b.id === 'salt_river');
      return { resolved: s.resolved, complete: s.complete };
    });
    expect(reloaded.resolved).toBe(4);
    expect(reloaded.complete).toBe(true);
  });
});
