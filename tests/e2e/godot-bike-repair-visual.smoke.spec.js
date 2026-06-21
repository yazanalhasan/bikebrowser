// SKIPPED 2026-06-21: this spec boots a REMOVED route (the legacy Phaser `/legacy-play` /
// Godot `/play` / `/play3d` prototypes were quarantined — see src/renderer/utils/uxSafety.js).
// The canonical game is `/game-rebuild`, covered by the game-rebuild.*.spec.js suite.
// Re-author against /game-rebuild if this coverage is still wanted.
import { test, expect } from 'playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('project_audit/screenshots/bike_repair_visual_correctness_rescue');
const PLAY_BASE_URL = process.env.BIKEBROWSER_PLAY_BASE_URL || '';

function playUrl(query = '') {
  return `${PLAY_BASE_URL}/play${query}`;
}

async function waitForGodot(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => !document.body.innerText.includes('Initializing...'), null, {
    timeout: 30000,
  });
  const iframe = page.locator('iframe').first();
  await expect(iframe).toBeVisible({ timeout: 30000 });
  await iframe.click({ position: { x: 640, y: 360 } });
  await page.waitForTimeout(5000);
  return iframe;
}

test.describe.skip('Godot bike repair visual correctness', () => {
  test('captures close-up chain and tire repair preview states', async ({ page }) => {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    await page.goto(playUrl('?playtest=1&playtestRegion=bike_repair_visual_preview'));
    await waitForGodot(page);
    await page.waitForTimeout(4500);
    const output = path.join(SCREENSHOT_DIR, 'bike_repair_visual_preview.png');
    await page.screenshot({ path: output, fullPage: false });
    const stat = await fs.stat(output);
    expect(stat.size).toBeGreaterThan(10_000);
  });

  test('visible Mrs Ramirez prompt accepts keyboard and tap without console errors', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') runtimeErrors.push(msg.text());
    });

    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    await page.goto(playUrl('?playtest=1&playtestRegion=neighborhood_street'));
    const iframe = await waitForGodot(page);

    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(2600);
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(850);
    await page.keyboard.up('ArrowUp');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mrs_ramirez_prompt_before_accept.png'),
      fullPage: false,
    });

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(1200);
    await iframe.click({ position: { x: 395, y: 445 } });
    await page.waitForTimeout(1200);

    const output = path.join(SCREENSHOT_DIR, 'mrs_ramirez_prompt_after_accept.png');
    await page.screenshot({ path: output, fullPage: false });
    const stat = await fs.stat(output);
    expect(stat.size).toBeGreaterThan(10_000);
    expect(runtimeErrors.filter((message) => !message.includes('AudioContext'))).toEqual([]);
  });
});
