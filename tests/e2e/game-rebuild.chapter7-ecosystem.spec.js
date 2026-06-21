import { test, expect } from 'playwright/test';

// Chapter 7 biology capstone — the Life-Engineering bench (systems biology).
// Reachable in the live runtime; teaches the cascade + the ethical gate: an
// ecologically-sound design released irreversibly is RECKLESS; a balanced,
// monitored one is STABLE.

test.describe('Chapter 7 — Life-Engineering (systems biology)', () => {
  test('reachable; a balanced, responsible closed loop is stable (and reckless if irreversible)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    expect(await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('EcosystemScene')))).toBe(true);

    expect(await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('eco:start');
      return game.scene.getScene('EcosystemScene').open;
    })).toBe(true);

    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('EcosystemScene');
      // Ecologically sound but released irreversibly → reckless (the ethics gate).
      s.selection = { producer: 'algae', decomposer: 'microbes', consumer: 'grazers', approach: 'release' };
      s.setPrediction('reckless');
      const reckless = s.test().verdict;
      // Same design, but monitored & reversible → stable.
      s.selection = { producer: 'algae', decomposer: 'microbes', consumer: 'grazers', approach: 'monitored' };
      s.setPrediction('stable');
      const good = s.test();
      return { reckless, good: good.verdict, roles: good.roles, solved: s.solved };
    });
    expect(run.reckless).toBe('reckless');
    expect(run.good).toBe('stable');
    expect(run.roles.responsible).toBe(true);
    expect(run.solved).toBe(true);

    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('eco:built', () => resolve(true));
      game.scene.getScene('EcosystemScene')._build();
    }));
    expect(built).toBe(true);

    expect(errors).toEqual([]);
  });
});
