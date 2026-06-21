import { test, expect } from 'playwright/test';

// Full Vehicle Ladder playthrough — the single end-to-end guard for the whole
// chapter system. It drives Ch1 → Ch7 in sequence: completing each chapter's
// signature engineering rig (via its ideal build) unlocks the next, until all
// seven are complete. Fast and deterministic — it exercises the real scenes,
// models, progression registry and unlock chain through events (no slow
// walk-the-world navigation), so it stays green in headless CI.

const RIGS = [
  { num: 2, scene: 'CircuitBenchScene', start: 'circuit:start', built: 'circuit:built', sel: { battery: 'batt_36v', fuse: 'fuse_10a', controller: 'ctrl_15a', wire: 'wire_med', motor: 'motor_250w' } },
  { num: 3, scene: 'EngineDynoScene', start: 'engine:start', built: 'engine:built', sel: { afr: 'stoich', timing: 'optimal', compression: 'high', cooling: 'liquid', fuel: 'premium' } },
  { num: 4, scene: 'CrashTestScene', start: 'crash:start', built: 'crash:built', sel: { front: 'crumple', cage: 'reinforced', restraint: 'belt_airbag', load: 'balanced' } },
  { num: 5, scene: 'BoatTankScene', start: 'boat:start', built: 'boat:built', sel: { hull: 'dinghy', material: 'aluminum', cargo: 'medium', ballast: 'low' } },
  { num: 6, scene: 'PlaneTunnelScene', start: 'plane:start', built: 'plane:built', sel: { airfoil: 'cambered', angle: 'optimal', structure: 'composite', engine: 'medium' } },
  { num: 7, scene: 'VacuumChamberScene', start: 'space:start', built: 'space:built', sel: { propulsion: 'chemical', shield: 'ceramic', life: 'recycling', redundancy: 'dual' } },
];

test.describe('Full Vehicle Ladder playthrough', () => {
  test('completing each chapter rig unlocks the next, Ch1 → Ch7', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    const status = (num) => page.evaluate((n) => {
      const map = window.__bikebrowserRebuildGame.scene.getScene('ChapterMapScene');
      return map.progression().spine().flatMap((a) => a.chapters).find((c) => c.num === n).runtimeStatus;
    }, num);

    // Fresh game: only Chapter 1 is playable; everything later is locked.
    await page.evaluate(() => window.__bikebrowserRebuildGame.registry.set('progression', { chaptersComplete: [] }));
    expect(await status(1)).toBe('playable');
    expect(await status(2)).toBe('locked');
    expect(await status(7)).toBe('locked');

    // Chapter 1 (the bike/bridge) completes the way the wash reconnection records it.
    await page.evaluate(() => window.__bikebrowserRebuildGame.registry.set('progression', { chaptersComplete: [1] }));

    // Walk the engineering spine: each rig unlocks, builds, and opens the next.
    for (const rig of RIGS) {
      // Unlocked as an enterable preview now that the prior chapter is done.
      expect(await status(rig.num), `Ch${rig.num} unlocked`).toBe('preview');

      const result = await page.evaluate(async (r) => {
        const game = window.__bikebrowserRebuildGame;
        game.registry.events.emit(r.start);
        const s = game.scene.getScene(r.scene);
        s.selection = { ...s.selection, ...r.sel };
        const verdict = s.test();
        const built = await new Promise((resolve) => {
          game.registry.events.once(r.built, () => resolve(true));
          s._build();
        });
        return { ok: verdict.ok, solved: s.solved, built, complete: game.registry.get('progression').chaptersComplete };
      }, rig);

      expect(result.ok, `Ch${rig.num} ideal build passes`).toBe(true);
      expect(result.solved).toBe(true);
      expect(result.built).toBe(true);
      expect(result.complete, `Ch${rig.num} recorded complete`).toContain(rig.num);

      // The next chapter is now unlocked (except after the final one).
      if (rig.num < 7) expect(await status(rig.num + 1), `Ch${rig.num + 1} unlocked by Ch${rig.num}`).toBe('preview');
    }

    // The whole ladder is complete.
    const complete = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('progression').chaptersComplete);
    expect(complete).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (let n = 2; n <= 7; n += 1) expect(await status(n), `Ch${n} complete`).toBe('complete');

    expect(errors).toEqual([]);
  });
});
