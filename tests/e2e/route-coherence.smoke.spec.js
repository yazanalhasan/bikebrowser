import { test, expect } from 'playwright/test';

test.describe('route coherence', () => {
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
});
