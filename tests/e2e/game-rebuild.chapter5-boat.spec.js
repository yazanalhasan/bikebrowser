import { test, expect } from 'playwright/test';

// Chapter 5 (Boat) first slice — the Buoyancy / Hydro Tank — opens Act 2. It must
// unlock after Ch4, launch from the ladder, and teach Archimedes + stability: an
// overloaded hull sinks while the balanced build floats and can be built. Also
// exercises the shared KnobBenchScene base end-to-end.

test.describe('Chapter 5 — Hydro Tank (Boat)', () => {
  test('unlocks after Ch4, launches from the ladder, and a seaworthy boat can be built', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('BoatTankScene')))).toBe(true);

    const status = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.set('progression', { chaptersComplete: [1, 2, 3, 4] });
      const map = game.scene.getScene('ChapterMapScene');
      return map.progression().spine().flatMap((a) => a.chapters).find((c) => c.num === 5).runtimeStatus;
    });
    expect(status).toBe('preview');

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('boat:start');
      return game.scene.getScene('BoatTankScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('BoatTankScene');
      s.selection = { hull: 'skiff', material: 'steel', cargo: 'heavy', ballast: 'heavy' };
      s.setPrediction('sink');
      const bad = s.test().verdict;
      s.selection = { hull: 'dinghy', material: 'aluminum', cargo: 'medium', ballast: 'low' };
      s.setPrediction('float');
      const good = s.test();
      return { bad, good: good.verdict, reserve: good.reserve, solved: s.solved };
    });
    expect(run.bad).toBe('sink');
    expect(run.good).toBe('float');
    expect(run.reserve).toBeGreaterThan(0);
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('boat:built', () => setTimeout(() => resolve({
        complete: game.registry.get('progression').chaptersComplete,
        open: game.scene.getScene('BoatTankScene').open,
      }), 50));
      game.scene.getScene('BoatTankScene')._build();
    }));
    expect(built.complete).toContain(5);
    expect(built.open).toBe(false);

    expect(errors).toEqual([]);
  });
});
