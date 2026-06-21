import { test, expect } from 'playwright/test';

// Chapter 4 biology pillar — the Microscope (cellular biology). Reachable in the
// live runtime; teaches that resolving cells needs thin + magnification + stain
// together: a thick chunk is opaque, the ideal slide resolves the structures.

test.describe('Chapter 4 — Microscope (cellular biology)', () => {
  test('reachable; resolves cells only with thin section + magnification + stain', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('MicroscopeScene')))).toBe(true);

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('cell:start');
      return game.scene.getScene('MicroscopeScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('MicroscopeScene');
      s.selection = { sample: 'leaf', stain: 'methylene', mag: 'high', prep: 'thick' };
      s.setPrediction('opaque');
      const bad = s.test().verdict;
      s.selection = { sample: 'leaf', stain: 'methylene', mag: 'high', prep: 'thin' };
      s.setPrediction('resolved');
      const good = s.test();
      return { bad, good: good.verdict, revealed: good.revealed, solved: s.solved };
    });
    expect(run.bad).toBe('opaque');
    expect(run.good).toBe('resolved');
    expect(run.revealed).toContain('chloroplasts');
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('cell:built', () => resolve(true));
      game.scene.getScene('MicroscopeScene')._build();
    }));
    expect(built).toBe(true);

    expect(errors).toEqual([]);
  });
});
