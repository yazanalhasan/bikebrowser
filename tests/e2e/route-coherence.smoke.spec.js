// SKIPPED 2026-06-21: this spec boots a REMOVED route (the legacy Phaser `/legacy-play` /
// Godot `/play` / `/play3d` prototypes were quarantined — see src/renderer/utils/uxSafety.js).
// The canonical game is `/game-rebuild`, covered by the game-rebuild.*.spec.js suite.
// Re-author against /game-rebuild if this coverage is still wanted.
import { test, expect } from 'playwright/test';

test.describe.skip('route coherence', () => {
  test('youtube search without a query invites search instead of spinning forever', async ({ page }) => {
    await page.goto('/youtube/search');

    await expect(page.getByTestId('youtube-search-view')).toBeVisible();
    await expect(page.getByText('Search for bike videos')).toBeVisible();
    await expect(page.getByText('Finding the best videos for you...')).toHaveCount(0);
  });

  test('3D prototype route does not expose debug controls by default', async ({ page }) => {
    await page.goto('/play3d');

    await expect(page.getByText('physics debug')).toHaveCount(0);
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('legacy Phaser route remains available', async ({ page }) => {
    await page.goto('/legacy-play');

    await expect(page.getByText('Start Adventure!')).toBeVisible();
  });

  test('canonical Godot route loads in a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/play');

    await expect(page.getByTestId('godot-prototype-page')).toBeVisible();
    await expect(page.getByTestId('godot-iframe')).toBeVisible();
  });
});
