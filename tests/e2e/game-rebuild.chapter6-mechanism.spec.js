import { test, expect } from 'playwright/test';

// Chapter 6 biology pillar — the Mechanism Bench (molecular biology). Reachable in
// the live runtime; teaches that a mechanism connects molecule → target → effect
// at the right level: a wrong target is rejected, the correct chain explains the
// willow observation.

test.describe('Chapter 6 — Mechanism Bench (molecular biology)', () => {
  test('reachable; validates the molecule→target→effect chain for the willow remedy', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('MechanismScene')))).toBe(true);

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('mech:start');
      return game.scene.getScene('MechanismScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('MechanismScene');
      s.selection = { molecule: 'salicylic_acid', target: 'dna', effect: 'inhibits' };
      s.setPrediction('wrong_target');
      const bad = s.test().verdict;
      s.selection = { molecule: 'salicylic_acid', target: 'cox_enzyme', effect: 'inhibits' };
      s.setPrediction('mechanism');
      const good = s.test();
      return { bad, good: good.verdict, level: good.level, solved: s.solved };
    });
    expect(run.bad).toBe('wrong_target');
    expect(run.good).toBe('mechanism');
    expect(run.level).toBe('protein');
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('mech:built', () => resolve(true));
      game.scene.getScene('MechanismScene')._build();
    }));
    expect(built).toBe(true);

    expect(errors).toEqual([]);
  });
});
