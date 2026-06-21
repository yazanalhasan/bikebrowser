import { test, expect } from 'playwright/test';

// Chapter 7 (Spacecraft) — the spine finale. Must unlock after Ch6, launch from
// the ladder, and certify against the four extremes: an air-breathing engine
// fails in vacuum, the fully-survivable craft certifies and launches (completing
// the vehicle ladder).

test.describe('Chapter 7 — Vacuum / Re-entry Chamber (Spacecraft)', () => {
  test('unlocks after Ch6, launches from the ladder, and a survivable spacecraft certifies', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('VacuumChamberScene')))).toBe(true);

    const status = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.set('progression', { chaptersComplete: [1, 2, 3, 4, 5, 6] });
      const map = game.scene.getScene('ChapterMapScene');
      return map.progression().spine().flatMap((a) => a.chapters).find((c) => c.num === 7).runtimeStatus;
    });
    expect(status).toBe('preview');

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('space:start');
      return game.scene.getScene('VacuumChamberScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('VacuumChamberScene');
      s.selection = { propulsion: 'air_breathing', shield: 'ceramic', life: 'recycling', redundancy: 'triple' };
      s.setPrediction('vacuum_fail');
      const bad = s.test().verdict;
      s.selection = { propulsion: 'chemical', shield: 'ceramic', life: 'recycling', redundancy: 'dual' };
      s.setPrediction('certified');
      const good = s.test();
      return { bad, good: good.verdict, solved: s.solved };
    });
    expect(run.bad).toBe('vacuum_fail');
    expect(run.good).toBe('certified');
    expect(run.solved).toBe(true);

    // Building completes the whole vehicle ladder (all 7 chapters).
    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('space:built', () => setTimeout(() => resolve({
        complete: game.registry.get('progression').chaptersComplete,
        open: game.scene.getScene('VacuumChamberScene').open,
      }), 50));
      game.scene.getScene('VacuumChamberScene')._build();
    }));
    expect(built.complete).toContain(7);
    expect(built.open).toBe(false);

    expect(errors).toEqual([]);
  });
});
