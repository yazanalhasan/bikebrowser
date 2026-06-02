import { test, expect } from 'playwright/test';

// Player-reachable acceptance (Phase 1.9): drive REAL player inputs
// (navigation + mouse/keyboard), never window.__GAME__ for the action under
// test. Proves the canonical Act-1 build is reachable from the product Home.
test.describe('Player reachability — navigation', () => {
  test('Home "Play" leads to the canonical Act 1 game (no debug API)', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');

    // The real player clicks the Play card with the mouse.
    const playCard = page.getByText('Play BikeBrowser', { exact: false }).first();
    await expect(playCard).toBeVisible();
    await playCard.click();

    // It must land on the canonical rebuild (/game-rebuild), not the Godot /play.
    await page.waitForURL(/game-rebuild/, { timeout: 30_000 });
    expect(page.url()).toMatch(/game-rebuild/);
    expect(page.url()).not.toMatch(/\/play(\b|$)/);

    // And the canonical game actually loads for the player.
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__), null, { timeout: 30_000 });
    await expect(page.locator('canvas')).toBeVisible();
  });
});
