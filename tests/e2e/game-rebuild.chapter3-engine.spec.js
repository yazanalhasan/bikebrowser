import { test, expect } from 'playwright/test';

// Chapter 3 (Motorcycle) first slice — the Engine Dyno — must be reachable once
// Chapter 2 is complete and teach the power/heat/knock trade: a mismatched tune
// knocks, the balanced tune runs clean and builds the motorcycle. Verifies the
// unlock chain + the live tuning loop, beyond the unit-tested EngineModel.

test.describe('Chapter 3 — Engine Dyno (combustion)', () => {
  test('unlocks after Ch2, launches from the ladder, and a clean tune builds the motorcycle', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('EngineDynoScene')))).toBe(true);

    // Chapters 1 & 2 done → Chapter 3 unlocks as an enterable preview.
    const status = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.set('progression', { chaptersComplete: [1, 2] });
      const map = game.scene.getScene('ChapterMapScene');
      const ch3 = map.progression().spine().flatMap((a) => a.chapters).find((c) => c.num === 3);
      return ch3.runtimeStatus;
    });
    expect(status).toBe('preview');

    // Launch the dyno via the ladder's data-driven entry event.
    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('engine:start');
      return game.scene.getScene('EngineDynoScene').open;
    })).toBe(true);

    // Tune loop: a knock first (high compression on regular fuel), then a clean
    // balanced tune.
    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('EngineDynoScene');
      s.selection = { afr: 'stoich', timing: 'optimal', compression: 'high', cooling: 'liquid', fuel: 'regular' };
      s.setPrediction('knock');
      const bad = s.test().verdict;
      s.selection = { afr: 'stoich', timing: 'optimal', compression: 'high', cooling: 'liquid', fuel: 'premium' };
      s.setPrediction('runs');
      const good = s.test();
      return { bad, good: good.verdict, power: good.power, solved: s.solved };
    });
    expect(run.bad).toBe('knock');
    expect(run.good).toBe('runs');
    expect(run.power).toBeGreaterThan(100);
    expect(run.solved).toBe(true);

    // Build the motorcycle → marks Chapter 3 and closes.
    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('engine:built', () => setTimeout(() => resolve({
        complete: game.registry.get('progression').chaptersComplete,
        open: game.scene.getScene('EngineDynoScene').open,
      }), 50));
      game.scene.getScene('EngineDynoScene')._build();
    }));
    expect(built.complete).toContain(3);
    expect(built.open).toBe(false);

    expect(errors).toEqual([]);
  });
});
