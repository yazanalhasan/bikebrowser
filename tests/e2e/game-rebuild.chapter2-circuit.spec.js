import { test, expect } from 'playwright/test';

// Chapter 2 (E-bike) first slice — the Circuit Bench — must be reachable and
// completable in the live browser: Chapter 1 completion unlocks it in the Vehicle
// Ladder, the ladder launches the bench, and the predict→test→build loop powers
// the e-bike (which marks Chapter 2 underway). Verifies the whole wiring chain,
// not just the unit-tested solver.

test.describe('Chapter 2 — Circuit Bench', () => {
  test('unlocks after Ch1, launches from the ladder, and the e-bike circuit can be built', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    // The CircuitBenchScene exists and is launched.
    const ready = await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('CircuitBenchScene')));
    expect(ready).toBe(true);

    // Complete Chapter 1 (record it the way the bridge does) → Chapter 2 unlocks.
    const unlocked = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.set('progression', { chaptersComplete: [1] });
      // Open the ladder and read Chapter 2's runtime status.
      game.registry.events.emit('chapters:start');
      const map = game.scene.getScene('ChapterMapScene');
      const spine = map.progression().spine();
      const ch2 = spine.flatMap((a) => a.chapters).find((c) => c.num === 2);
      return ch2.runtimeStatus; // 'preview' = unlocked + scaffolded (enterable demo)
    });
    expect(unlocked).toBe('preview');

    // Launch Chapter 2's Circuit Bench through the ladder's data-driven entry.
    const opened = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('circuit:start');
      const s = game.scene.getScene('CircuitBenchScene');
      return { open: s.open, slots: Object.keys(s.selection) };
    });
    expect(opened.open).toBe(true);

    // Drive the reasoning loop headlessly: a wrong build first (stall), then the
    // correct one (spin), then build the e-bike.
    const run = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('CircuitBenchScene');
      // Wrong: 24V can't spin the 36V motor.
      s.selection = { battery: 'batt_24v', fuse: 'fuse_10a', controller: 'ctrl_15a', wire: 'wire_med', motor: 'motor_250w' };
      s.setPrediction('stall');
      const wrong = s.test().verdict;
      // Right: the ideal build spins it.
      s.selection = { battery: 'batt_36v', fuse: 'fuse_10a', controller: 'ctrl_15a', wire: 'wire_med', motor: 'motor_250w' };
      s.setPrediction('spin');
      const right = s.test().verdict;
      return { wrong, right, solved: s.solved };
    });
    expect(run.wrong).toBe('stall');
    expect(run.right).toBe('spin');
    expect(run.solved).toBe(true);

    // Building the e-bike marks Chapter 2 complete and closes the bench.
    const built = await page.evaluate(() => new Promise((resolve) => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.once('circuit:built', () => {
        setTimeout(() => {
          const prog = game.registry.get('progression');
          const s = game.scene.getScene('CircuitBenchScene');
          resolve({ complete: prog.chaptersComplete, open: s.open });
        }, 50);
      });
      game.scene.getScene('CircuitBenchScene')._build();
    }));
    expect(built.complete).toContain(2);
    expect(built.open).toBe(false);

    expect(errors).toEqual([]);
  });
});
