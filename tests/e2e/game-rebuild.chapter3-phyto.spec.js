import { test, expect } from 'playwright/test';

// Chapter 3 biology pillar — the Phytochemistry Lab — must be reachable (from the
// Engine Dyno hub) and teach that conditions select the molecule: a non-polar
// solvent pulls the wrong compound, the right conditions extract pure salicin.

test.describe('Chapter 3 — Phytochemistry Lab', () => {
  test('reachable from the engine hub; conditions select which molecule comes out', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('PhytoLabScene')))).toBe(true);

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('phyto:start');
      return game.scene.getScene('PhytoLabScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('PhytoLabScene');
      s.selection = { solvent: 'oil', temp: 'warm', time: 'medium', grind: 'ground' };
      s.setPrediction('wrong_compound');
      const wrong = s.test();
      s.selection = { solvent: 'water', temp: 'warm', time: 'medium', grind: 'ground' };
      s.setPrediction('pure');
      const right = s.test();
      return { wrong: wrong.verdict, wrongCompound: wrong.compound, right: right.verdict, compound: right.compound, solved: s.solved };
    });
    expect(run.wrong).toBe('wrong_compound');
    expect(run.right).toBe('pure');
    expect(run.compound).toBe('salicin');
    expect(run.wrongCompound).not.toBe('salicin');
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('phyto:built', () => resolve(true));
      game.scene.getScene('PhytoLabScene')._build();
    }));
    expect(built).toBe(true);

    expect(errors).toEqual([]);
  });
});
