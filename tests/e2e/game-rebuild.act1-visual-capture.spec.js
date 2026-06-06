import { mkdirSync } from 'node:fs';
import { test, expect } from 'playwright/test';

const captureDir = 'playtest_captures/game_rebuild_act1_complete';

async function frame(page, x, y) {
  await page.evaluate(({ x, y }) => {
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    scene.player.setPosition(x, y);
    scene.cameras.main.centerOn(x, y);
    scene.registry.set('playerPosition', { x, y });
  }, { x, y });
  await page.waitForTimeout(80);
}

test.describe('Act 1 visual captures', () => {
  test('captures major Act 1 runtime states', async ({ page }) => {
    mkdirSync(captureDir, { recursive: true });
    await page.goto('/game-rebuild');
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()) &&
      Boolean(window.__GAME__)
    );
    await expect(page.locator('canvas')).toBeVisible();

    await frame(page, 305, 506);
    await page.screenshot({ path: `${captureDir}/01_act1_start.png`, fullPage: true });
    await page.evaluate(() => window.__GAME__.handleInteraction('bike_check'));
    await page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook());
    await frame(page, 650, 430);
    await page.screenshot({ path: `${captureDir}/02_bike_repair_notebook.png`, fullPage: true });
    await page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook());

    await page.evaluate(() => window.__GAME__.handleInteraction('dry_wash'));
    await frame(page, 1190, 574);
    await page.screenshot({ path: `${captureDir}/03_bridge_discovery.png`, fullPage: true });

    await page.evaluate(() => {
      window.__GAME__.handleInteraction('collect_materials');
      window.__GAME__.handleInteraction('ecology_patch');
      ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => window.__GAME__.testMaterial(id));
    });
    await frame(page, 742, 408);
    await page.screenshot({ path: `${captureDir}/04_material_testing.png`, fullPage: true });

    await page.evaluate(() => {
      window.__GAME__.observeEcology('mesquite');
      window.__GAME__.observeEcology('creosote');
      window.__GAME__.observeEcology('saguaro');
    });
    await frame(page, 1030, 760);
    await page.screenshot({ path: `${captureDir}/05_ecology_interaction.png`, fullPage: true });

    await page.evaluate(() => window.__GAME__.runChemistryRecipe('sealant_patch'));
    await frame(page, 820, 444);
    await page.screenshot({ path: `${captureDir}/06_chemistry_interaction.png`, fullPage: true });

    await page.evaluate(() => {
      window.__GAME__.recordLanguageInteraction('spanish_neighbor_greeting');
      window.__GAME__.recordLanguageInteraction('arabic_mentor_greeting');
      window.__GAME__.earnTrust();
      window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook();
    });
    await frame(page, 430, 438);
    await page.screenshot({ path: `${captureDir}/07_trust_language_notebook.png`, fullPage: true });
    await page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook());

    await page.evaluate(() => {
      window.__GAME__.completeBridgePlan('tested_triangle_plan');
      window.__GAME__.repairBridge();
      window.__GAME__.unlockWiderMap();
    });
    await frame(page, 1484, 514);
    await page.screenshot({ path: `${captureDir}/08_bridge_repaired_map_unlock.png`, fullPage: true });
  });

  test('captures mobile bridge payoff and notebook readability', async ({ page }) => {
    const mobileDir = 'playtest_captures/game_rebuild_mobile_payoff';
    mkdirSync(mobileDir, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/game-rebuild');
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()) &&
      Boolean(window.__GAME__)
    );
    await expect(page.locator('canvas')).toBeVisible();

    await page.evaluate(() => {
      const game = window.__GAME__;
      game.resetAct1();
      game.handleInteraction('bike_check');
      game.handleInteraction('collect_materials');
      game.handleInteraction('ecology_patch');
      ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => game.testMaterial(id));
      game.completeBridgePlan('tested_triangle_plan');
      game.repairBridge();
      window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook();
    });
    await frame(page, 1255, 642);
    await page.screenshot({ path: `${mobileDir}/01_mobile_bridge_payoff_notebook.png`, fullPage: true });

    const mobileState = await page.evaluate(() => {
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      return {
        notebookVisible: scene.notebookPanel.visible,
        payoffVisible: scene.bridgePayoffText.visible,
        notebookText: scene.notebookCardsText.text,
      };
    });
    expect(mobileState.notebookVisible).toBe(true);
    expect(mobileState.payoffVisible).toBe(true);
    expect(mobileState.notebookText).toContain('Bridge Repaired');
  });
});
