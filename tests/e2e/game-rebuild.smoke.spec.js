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
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true);

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

    await page.keyboard.press('F3');
    await page.waitForTimeout(100);
    await page.keyboard.press('F3');

    expect(errors.filter((message) => !message.includes('AudioContext'))).toEqual([]);
  });
});
