import { test, expect } from 'playwright/test';

// Chapter 6 (Plane) first slice — the Wind Tunnel. Must unlock after Ch5, launch
// from the ladder, and balance the four forces: a stalling config fails, the
// balanced strong-and-light build flies and can be built.

test.describe('Chapter 6 — Wind Tunnel (Plane)', () => {
  test('unlocks after Ch5, launches from the ladder, and a balanced aircraft flies', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('PlaneTunnelScene')))).toBe(true);

    const status = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.set('progression', { chaptersComplete: [1, 2, 3, 4, 5] });
      const map = game.scene.getScene('ChapterMapScene');
      return map.progression().spine().flatMap((a) => a.chapters).find((c) => c.num === 6).runtimeStatus;
    });
    expect(status).toBe('preview');

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('plane:start');
      return game.scene.getScene('PlaneTunnelScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('PlaneTunnelScene');
      s.selection = { airfoil: 'cambered', angle: 'high', structure: 'composite', engine: 'large' };
      s.setPrediction('stall');
      const bad = s.test().verdict;
      s.selection = { airfoil: 'cambered', angle: 'optimal', structure: 'composite', engine: 'medium' };
      s.setPrediction('fly');
      const good = s.test();
      return { bad, good: good.verdict, lift: good.lift, weight: good.weight, solved: s.solved };
    });
    expect(run.bad).toBe('stall');
    expect(run.good).toBe('fly');
    expect(run.lift).toBeGreaterThanOrEqual(run.weight);
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('plane:built', () => setTimeout(() => resolve({
        complete: game.registry.get('progression').chaptersComplete,
        open: game.scene.getScene('PlaneTunnelScene').open,
      }), 50));
      game.scene.getScene('PlaneTunnelScene')._build();
    }));
    expect(built.complete).toContain(6);
    expect(built.open).toBe(false);

    expect(errors).toEqual([]);
  });
});
