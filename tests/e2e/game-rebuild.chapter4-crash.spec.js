import { test, expect } from 'playwright/test';

// Chapter 4 (Car) first slice — the Crash & Load Test — must unlock after Ch3,
// launch from the ladder, and teach energy-managed safety: a rigid front injures
// the occupant (high-g) while the crumple build passes. Verifies the unlock chain
// + the live loop beyond the unit-tested CrashModel.

test.describe('Chapter 4 — Crash & Load Test (Car)', () => {
  test('unlocks after Ch3, launches from the ladder, and a crash-safe car can be built', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('CrashTestScene')))).toBe(true);

    const status = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.set('progression', { chaptersComplete: [1, 2, 3] });
      const map = game.scene.getScene('ChapterMapScene');
      return map.progression().spine().flatMap((a) => a.chapters).find((c) => c.num === 4).runtimeStatus;
    });
    expect(status).toBe('preview');

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('crash:start');
      return game.scene.getScene('CrashTestScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('CrashTestScene');
      s.selection = { front: 'rigid', cage: 'reinforced', restraint: 'belt_airbag', load: 'balanced' };
      s.setPrediction('high_g');
      const bad = s.test().verdict;
      s.selection = { front: 'crumple', cage: 'reinforced', restraint: 'belt_airbag', load: 'balanced' };
      s.setPrediction('safe');
      const good = s.test();
      return { bad, good: good.verdict, g: good.occupantG, solved: s.solved };
    });
    expect(run.bad).toBe('high_g');
    expect(run.good).toBe('safe');
    expect(run.g).toBeLessThanOrEqual(30);
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('crash:built', () => setTimeout(() => resolve({
        complete: game.registry.get('progression').chaptersComplete,
        open: game.scene.getScene('CrashTestScene').open,
      }), 50));
      game.scene.getScene('CrashTestScene')._build();
    }));
    expect(built.complete).toContain(4);
    expect(built.open).toBe(false);

    expect(errors).toEqual([]);
  });
});
