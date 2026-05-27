import { readFileSync } from 'node:fs';
import { test, expect } from 'playwright/test';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
}

test.describe('Act 1 polish hardening', () => {
  test('movement, prompt, notebook, and evidence feedback stay responsive', async ({ page }) => {
    await ready(page);
    const before = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('playerPosition'));
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(450);
    await page.keyboard.up('ArrowRight');
    const after = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('playerPosition'));
    expect(after.x).toBeGreaterThan(before.x + 12);

    await page.evaluate(() => window.__GAME__.handleInteraction('bike_check'));
    const notebook = await page.evaluate(() => window.__GAME__.getNotebookState());
    expect(notebook.newEntries).toContain('bike_check');
    const feedback = await page.evaluate(() => window.__GAME__.getFeedbackState());
    expect(feedback.last.message).toContain('Bike check complete');
  });

  test('bridge planning rejects weak-only plans and accepts tested evidence', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => window.__GAME__.resetAct1());

    const weakOnly = await page.evaluate(() => window.__GAME__.completeBridgePlan('weak_scrap_only'));
    expect(weakOnly.ok).toBe(false);
    expect(weakOnly.reason).toBe('weak_materials_fail');

    const tooSoon = await page.evaluate(() => window.__GAME__.completeBridgePlan('tested_triangle_plan'));
    expect(tooSoon.ok).toBe(false);
    expect(tooSoon.reason).toBe('missing_tests');

    await page.evaluate(() => {
      window.__GAME__.handleInteraction('collect_materials');
      ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => window.__GAME__.testMaterial(id));
    });
    const accepted = await page.evaluate(() => window.__GAME__.completeBridgePlan('tested_triangle_plan'));
    expect(accepted.ok).toBe(true);
    expect(accepted.plan.loadPath).toEqual(['deck', 'support', 'triangle_brace', 'ground']);

    const lockedMap = await page.evaluate(() => window.__GAME__.unlockWiderMap());
    expect(lockedMap.ok).toBe(false);
    expect(lockedMap.reason).toBe('bridge_not_reconnected');
  });

  test('diagnostics catch structural regressions and save corruption recovers safely', async ({ page }) => {
    await ready(page);
    const diagnostic = await page.evaluate(() => window.__GAME__.runAct1Diagnostic());
    expect(diagnostic.ok).toBe(true);
    expect(diagnostic.checks.dialogueObjectiveRefsValid).toBe(true);
    expect(diagnostic.checks.interactionsReachable).toBe(true);
    expect(diagnostic.checks.noGeneratedRuntimeArt).toBe(true);

    await page.evaluate(() => localStorage.setItem('bikebrowser.gameRebuild.act1', '{"bad":true}'));
    const loaded = await page.evaluate(() => window.__GAME__.loadGame());
    expect(loaded.ok).toBe(false);
    expect(loaded.reason).toBe('invalid_save');
    const state = await page.evaluate(() => window.__GAME__.getAct1State());
    expect(state.sceneReady).toBe(true);
  });

  test('quest architecture remains data-first and scene-light', () => {
    const scene = readFileSync('src/game/phaser/scenes/NeighborhoodScene.js', 'utf8');
    expect(scene).not.toContain('act1Quests');
    expect(scene).not.toContain('completedObjectives.add');
    expect(scene).toContain('handleInteraction');

    const assetRegistry = readFileSync('src/game/phaser/systems/AssetRegistry.js', 'utf8');
    expect(assetRegistry).toContain('generatedArtDirectRuntime: false');
  });
});
