// SKIPPED 2026-06-21: this spec boots a REMOVED route (the legacy Phaser `/legacy-play` /
// Godot `/play` / `/play3d` prototypes were quarantined — see src/renderer/utils/uxSafety.js).
// The canonical game is `/game-rebuild`, covered by the game-rebuild.*.spec.js suite.
// Re-author against /game-rebuild if this coverage is still wanted.
import { test, expect } from 'playwright/test';

test.describe.skip('Godot level editor', () => {
  test('toggles edit mode, selects, nudges, and undoes through /play', async ({ page }) => {
    await page.goto('/play');

    const iframe = page.frameLocator('[data-testid="godot-iframe"]');
    await expect(page.getByTestId('godot-iframe')).toBeVisible();
    await page.waitForTimeout(3000);
    await page.getByTestId('godot-iframe').click({ position: { x: 640, y: 360 } });

    await page.keyboard.press('F2');

    const frame = page.frame({ url: /godot\/BikeBrowserWorld\/index\.html/ });
    await expect.poll(async () => frame?.evaluate(() => window.BikeBrowserLevelEditorState?.active === true)).toBe(true);
    await expect(page.getByTestId('home-button')).toHaveClass(/hidden/);

    const target = await frame.evaluate(() => window.BikeBrowserLevelEditorState.selectionTarget);
    expect(target?.x).toBeGreaterThan(0);
    await page.getByTestId('godot-iframe').click({ position: { x: target.x, y: target.y } });
    await expect.poll(async () => frame?.evaluate(() => window.BikeBrowserLevelEditorState?.selectedCount || 0)).toBeGreaterThan(0);

    const before = await frame.evaluate(() => window.BikeBrowserLevelEditorState.selection.position);
    await page.keyboard.press('ArrowRight');
    const after = await frame.evaluate(() => window.BikeBrowserLevelEditorState.selection.position);
    expect(after.x).not.toBe(before.x);

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
    const undone = await frame.evaluate(() => window.BikeBrowserLevelEditorState.selection.position);
    expect(undone.x).toBe(before.x);
    await page.keyboard.press('F2');

    await expect(page.getByTestId('home-button')).not.toHaveClass(/hidden/);
    await expect.poll(async () => frame?.evaluate(() => window.BikeBrowserLevelEditorState?.active === false)).toBe(true);
  });
});
