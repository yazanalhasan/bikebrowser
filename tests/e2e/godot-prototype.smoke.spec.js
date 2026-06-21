// SKIPPED 2026-06-21: this spec boots a REMOVED route (the legacy Phaser `/legacy-play` /
// Godot `/play` / `/play3d` prototypes were quarantined — see src/renderer/utils/uxSafety.js).
// The canonical game is `/game-rebuild`, covered by the game-rebuild.*.spec.js suite.
// Re-author against /game-rebuild if this coverage is still wanted.
import { test, expect } from 'playwright/test';

test.describe.skip('Godot canonical route', () => {
  test('renders the canonical Godot world at /play without diagnostics by default', async ({ page }) => {
    await page.goto('/play');

    await expect(page.getByTestId('godot-prototype-page')).toBeVisible();
    await expect(page.getByTestId('godot-iframe')).toBeVisible();
    await expect(page.getByTestId('home-button')).toBeVisible();
    await expect(page.getByTestId('godot-diagnostics')).toHaveCount(0);
  });

  test('keeps diagnostics opt-in and preserves bridge event handling', async ({ page }) => {
    await page.goto('/godot-prototype?diagnostics=1');

    await expect(page.getByTestId('godot-prototype-page')).toBeVisible();
    await expect(page.getByTestId('godot-iframe')).toBeVisible();
    await expect(page.getByText('Legacy Phaser remains available at /legacy-play')).toBeVisible();

    await page.evaluate(() => {
      window.postMessage({
        type: 'quest_started',
        questId: 'chain_repair',
        timestamp: new Date().toISOString(),
      }, window.location.origin);
      window.postMessage({
        type: 'reward_intent',
        questId: 'chain_repair',
        amount: 1,
        currency: 'allowance_usd',
        label: 'Chain repair mission',
        idempotencyKey: 'godot:chain_repair:inspect_chain:v1',
        timestamp: new Date().toISOString(),
      }, window.location.origin);
    });

    await expect(page.getByTestId('godot-event-log')).toContainText('quest_started');
    await expect(page.getByTestId('godot-event-log')).toContainText('reward_intent');
  });
});
