// Probe what the Home "Play BikeBrowserWorld" button opens: /play (Godot iframe).
import { test, expect } from 'playwright/test';
const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase1';
test.setTimeout(60000);

test('home Play button -> /play state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('crash', () => errors.push('PAGE CRASHED'));

  // Start at Home and actually click the primary game CTA like a kid would.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  let clicked = false;
  try { await page.getByText('Play BikeBrowserWorld', { exact: false }).first().click({ timeout: 4000 }); clicked = true; } catch {}
  await page.waitForTimeout(6000);
  const info = {
    clickedHomeCTA: clicked,
    url: page.url(),
    iframePresent: await page.locator('[data-testid="godot-iframe"], iframe').count(),
    bodyText: (await page.evaluate(() => document.body?.innerText || '')).replace(/\s+/g, ' ').trim().slice(0, 500),
    errors: errors.slice(0, 30),
  };
  await page.screenshot({ path: `${SHOT}/40-home-play-target.png` }).catch(() => {});
  console.log('PLAY_ROUTE_INFO\n' + JSON.stringify(info, null, 2));
  expect(true).toBeTruthy();
});
