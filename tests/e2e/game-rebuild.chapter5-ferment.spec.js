import { test, expect } from 'playwright/test';

// Chapter 5 biology pillar — the Fermentation Bench (microbiology). Reachable in
// the live runtime; teaches that the microbe + conditions decide the product:
// yeast with oxygen just grows, sealed it ferments sugar to alcohol.

test.describe('Chapter 5 — Fermentation Bench (microbiology)', () => {
  test('reachable; yeast ferments sugar to alcohol only when sealed from oxygen', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('FermentBenchScene')))).toBe(true);

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('ferment:start');
      return game.scene.getScene('FermentBenchScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('FermentBenchScene');
      s.selection = { substrate: 'fruit_juice', microbe: 'yeast', temp: 'warm', oxygen: 'open' };
      s.setPrediction('aerobic_growth');
      const bad = s.test().verdict;
      s.selection = { substrate: 'fruit_juice', microbe: 'yeast', temp: 'warm', oxygen: 'sealed' };
      s.setPrediction('alcohol');
      const good = s.test();
      return { bad, good: good.verdict, product: good.product, solved: s.solved };
    });
    expect(run.bad).toBe('aerobic_growth');
    expect(run.good).toBe('alcohol');
    expect(run.product).toBe('alcohol');
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('ferment:built', () => resolve(true));
      game.scene.getScene('FermentBenchScene')._build();
    }));
    expect(built).toBe(true);

    expect(errors).toEqual([]);
  });
});
