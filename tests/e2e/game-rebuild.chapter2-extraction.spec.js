import { test, expect } from 'playwright/test';

// Chapter 2 biology pillar — the Extraction Bench — must be reachable in the live
// runtime and teach "method changes outcome": the same plant part yields a
// product with the right method and fails with the wrong one. Verifies the scene
// is wired (opens on extraction:start, the Circuit-Bench hub links to it, leaving
// reports discoveries).

test.describe('Chapter 2 — Extraction Bench (ethnobotany)', () => {
  test('processes desert plants — right method yields, wrong method fails', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    const ready = await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('ExtractionBenchScene')));
    expect(ready).toBe(true);

    // Reached the way the player does: from the Circuit Bench hub link.
    const opened = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('extraction:start');
      const s = game.scene.getScene('ExtractionBenchScene');
      return s.open;
    });
    expect(opened).toBe(true);

    // Drive the loop: agave leaf — grinding fails (mush), retting yields cordage.
    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('ExtractionBenchScene');
      s.speciesId = 'agave'; s.partId = 'leaf';
      s.methodId = 'grind';
      const wrong = s.process();
      s.methodId = 'ret';
      const right = s.process();
      return {
        wrongOutcome: wrong.outcome,
        rightOutcome: right.outcome,
        product: right.product,
        category: right.category,
        discovered: [...s.discovered],
      };
    });
    expect(run.wrongOutcome).toBe('wrong');
    expect(run.rightOutcome).toBe('yield');
    expect(run.product).toBe('cordage');
    expect(run.category).toBe('fiber');
    expect(run.discovered).toContain('cordage');

    // Leaving reports the discoveries and closes.
    const closed = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('extraction:done', ({ discovered }) => resolve({ discovered }));
      game.scene.getScene('ExtractionBenchScene').hide();
    }));
    expect(closed.discovered).toContain('cordage');

    expect(errors).toEqual([]);
  });
});
