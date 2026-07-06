import { test, expect } from 'playwright/test';

test.describe('Act 1 complete substrate', () => {
  test('supports full data-driven Act 1 progression and save resume', async ({ page }) => {
    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
    expect(await page.locator('canvas').count()).toBeGreaterThan(0);

    const diagnostic = await page.evaluate(() => window.__GAME__.runAct1Diagnostic());
    expect(diagnostic.ok).toBe(true);

    await page.evaluate(() => window.__GAME__.resetAct1());
    await page.evaluate(() => {
      const game = window.__GAME__;
      game.handleInteraction('bike_check');
      game.handleInteraction('dry_wash');
      for (let i = 0; i < 8; i += 1) game.handleInteraction('collect_materials');
      ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => game.testMaterial(id));
      game.completeBridgePlan('tested_triangle_plan');
      game.repairBridge();
      game.observeEcology('mesquite');
      game.observeEcology('creosote');
      game.observeEcology('saguaro');
      game.runChemistryRecipe('sealant_patch');
      game.recordLanguageInteraction('spanish_neighbor_greeting');
      game.recordLanguageInteraction('arabic_mentor_greeting');
      game.earnTrust();
      game.unlockWiderMap();
    });

    const state = await page.evaluate(() => window.__GAME__.getAct1State());
    expect(state.bike.checked).toBe(true);
    expect(state.bike.upgraded).toBe(true);
    expect(state.bridge.bridgeReconnected).toBe(true);
    expect(state.ecology.observed).toEqual(expect.arrayContaining(['mesquite', 'creosote', 'saguaro']));
    expect(state.chemistry.results.map((result) => result.recipeId)).toContain('sealant_patch');
    expect(state.language.interactions.map((entry) => entry.language)).toEqual(expect.arrayContaining(['spanish', 'arabic']));
    expect(state.discovery.widerMapUnlocked).toBe(true);
    expect(state.act1Complete).toBe(true);
    expect(state.notebook.unlocked).toEqual(expect.arrayContaining([
      'bike_check',
      'broken_wash',
      'bridge_problem',
      'material_test_results',
      'bridge_plan',
      'bridge_repaired',
      'desert_plant',
      'chemistry_result',
      'spanish_interaction',
      'arabic_interaction',
      'trust_milestone',
      'wider_map_unlocked',
    ]));
    expect(state.bridge.repairMoment.socialAcknowledgement).toContain('tested');
    expect(state.bridge.crossingMoment.feeling).toContain('stays steady');

    await page.evaluate(() => window.__GAME__.saveGame());
    await page.reload();
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
    const loaded = await page.evaluate(() => window.__GAME__.loadGame());
    expect(loaded.ok).toBe(true);
    const resumed = await page.evaluate(() => window.__GAME__.getAct1State());
    expect(resumed.act1Complete).toBe(true);
    expect(resumed.bridge.bridgeReconnected).toBe(true);
  });
});
