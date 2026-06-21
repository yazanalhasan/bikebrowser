import { test, expect } from 'playwright/test';

// The Vehicle Ladder (arc.md §3) makes the whole game shape navigable from the
// running browser: three acts over the seven-rung vehicle ladder, Chapter 1
// playable and 2–7 canonical previews. This verifies the overlay is wired into
// the live runtime (opens on `chapters:start`, renders all seven chapters,
// closes on `chapters:done`) — not just unit-tested in isolation.

test.describe('Vehicle Ladder (chapter/act map)', () => {
  test('opens from the running game and exposes all 3 acts / 7 chapters', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/game-rebuild');
    await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()));

    // The ChapterMapScene must exist and be launched (parallel modal scene).
    const sceneReady = await page.evaluate(() =>
      Boolean(window.__bikebrowserRebuildGame.scene.getScene('ChapterMapScene')));
    expect(sceneReady).toBe(true);

    // Open it the way the player does — the registry event the J key emits.
    const opened = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      game.registry.events.emit('chapters:start');
      const s = game.scene.getScene('ChapterMapScene');
      return { open: s.open, visible: s.root.visible };
    });
    expect(opened.open).toBe(true);
    expect(opened.visible).toBe(true);

    // It renders the full spine: 3 act headers + 7 chapter vehicle titles.
    const rendered = await page.evaluate(() => {
      const s = window.__bikebrowserRebuildGame.scene.getScene('ChapterMapScene');
      const texts = s.cardLayer.list
        .filter((o) => o.type === 'Text')
        .map((o) => o.text);
      return texts;
    });
    for (const vehicle of ['Bike', 'E-bike', 'Motorcycle', 'Car', 'Boat', 'Plane', 'Spacecraft']) {
      expect(rendered.some((t) => t.includes(vehicle))).toBe(true);
    }
    expect(rendered.some((t) => t.includes('Act 1'))).toBe(true);
    expect(rendered.some((t) => t.includes('Act 2'))).toBe(true);
    expect(rendered.some((t) => t.includes('Act 3'))).toBe(true);

    // Selecting Chapter 1 emits chapter:enter and closes the overlay.
    const closed = await page.evaluate(() => {
      const game = window.__bikebrowserRebuildGame;
      let entered = null;
      game.registry.events.once('chapter:enter', ({ num }) => { entered = num; });
      const s = game.scene.getScene('ChapterMapScene');
      s.enterChapter({ num: 1, entry: { type: 'scene' } });
      return { entered, open: s.open };
    });
    expect(closed.entered).toBe(1);
    expect(closed.open).toBe(false);

    expect(errors).toEqual([]);
  });
});
