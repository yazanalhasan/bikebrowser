import { test, expect } from 'playwright/test';

test.describe('game graphics reset route', () => {
  test('loads clean Phaser rebuild scene with quest and dialogue substrate', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.())
    );
    await page.evaluate(() => window.__GAME__.setAudioSettings({ speechEnabled: false }));

    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);

    const bootState = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      return {
        activeNeighborhood: game.scene.getScene('NeighborhoodScene')?.scene?.isActive() || false,
        activeQuest: game.registry.get('questSystem')?.getSummary()?.id || null,
        hasLegacyStreet: game.scene.getScene('StreetBlockScene') !== null,
      };
    });

    expect(bootState.activeNeighborhood).toBe(true);
    expect(bootState.activeQuest).toBe('bridge_dry_wash_intro');
    expect(bootState.hasLegacyStreet).toBe(false);

    const mapHudState = await page.evaluate(() => {
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      return scene.worldMapHudState;
    });
    expect(mapHudState.visible).toBe(true);
    expect(mapHudState.currentLocation).toBe('street');
    expect(mapHudState.activeQuestMarker).toBe('dry_wash');
    expect(mapHudState.unlockedDestinations).toEqual(expect.arrayContaining(['home', 'garage', 'street', 'dry_wash', 'bridge']));
    expect(mapHudState.lockedDestinations).toContain('wider_gate');
    expect(mapHudState.lockedDestinations).toContain('salt_river');
    expect(mapHudState.lockedDestinations).toContain('copper_mine');

    const assetRegistry = await page.evaluate(() => window.__GAME__.getAssetRegistryState());
    expect(assetRegistry.placeholderContract.generatedArtDirectRuntime).toBe(false);
    expect(assetRegistry.act1Manifest.requiredCount).toBeGreaterThan(0);
    expect(assetRegistry.act1Manifest.finalReadyCount).toBe(assetRegistry.act1Manifest.requiredCount);
    expect(assetRegistry.act1Manifest.missingFinal).toEqual([]);
    expect(assetRegistry.act1Manifest.generatedRuntimeArt).toBe(false);

    const before = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('playerPosition'));
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(350);
    await page.keyboard.up('ArrowRight');
    const after = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('playerPosition'));
    expect(after.x).toBeGreaterThan(before.x);

    await page.evaluate(() => {
      window.__bikebrowserRebuildGame.registry.events.emit('dialogue:start', 'mr_chen_bridge_intro');
    });
    await expect(page.locator('canvas')).toBeVisible();
    await page.keyboard.press('KeyE');
    await page.keyboard.press('KeyE');

    const questAfterDialogue = await page.evaluate(() => {
      const summary = window.__bikebrowserRebuildGame.registry.get('questSystem').getSummary();
      return summary.objectives.find((objective) => objective.id === 'talk_to_mr_chen')?.complete;
    });
    expect(questAfterDialogue).toBe(true);

    const unlockedMapHudState = await page.evaluate(() => {
      const game = window.__GAME__;
      game.handleInteraction('collect_materials');
      game.handleInteraction('ecology_patch');
      ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => game.testMaterial(id));
      game.completeBridgePlan('tested_triangle_plan');
      game.repairBridge();
      game.unlockWiderMap();
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      scene.updateEvidencePanel();
      return scene.worldMapHudState;
    });
    expect(unlockedMapHudState.widerMapUnlocked).toBe(true);
    expect(unlockedMapHudState.activeQuestMarker).toBe('wider_gate');
    expect(unlockedMapHudState.lockedDestinations).toEqual([]);
    expect(unlockedMapHudState.unlockedDestinations).toEqual(expect.arrayContaining(['wider_gate', 'salt_river', 'copper_mine']));

    const readinessMapState = await page.evaluate(() =>
      window.BIKEBROWSER_TEST_BRIDGE.captureRuntimeSummary().worldMapHud
    );
    expect(readinessMapState.unlocked).toBe(true);
    expect(readinessMapState.state.activeQuestMarker).toBe('wider_gate');

    await page.keyboard.press('F3');
    await page.waitForTimeout(100);
    await page.keyboard.press('F3');

    expect(errors.filter((message) => !message.includes('AudioContext'))).toEqual([]);
  });
});
