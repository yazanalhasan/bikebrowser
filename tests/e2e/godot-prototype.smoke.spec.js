import { test, expect } from 'playwright/test';

test.describe('Godot prototype route', () => {
  test('renders prototype shell and records bridge events without replacing Phaser', async ({ page }) => {
    await page.goto('/godot-prototype');

    await expect(page.getByTestId('godot-prototype-page')).toBeVisible();
    await expect(page.getByTestId('godot-iframe')).toBeVisible();
    await expect(page.getByText('Phaser fallback remains at /play')).toBeVisible();

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
