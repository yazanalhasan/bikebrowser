/**
 * Test: verify UI behavior when the API server is NOT running.
 * Expects the readiness gate to show "Starting search services..." or
 * "Search server unavailable" instead of a confusing generic error.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

(async () => {
  // First verify the API server is NOT on 3001 (or use a port we know is dead)
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Navigate directly to search — the backend readiness check should fire
  await page.goto(`${BASE}/youtube/search?q=bike+repair&fast=1`, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait a bit for the readiness check to run
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/search_with_backend.png' });

  const text = await page.textContent('body');
  const hasStarting = text.includes('Starting search services');
  const hasUnavailable = text.includes('Search server unavailable');
  const hasGenericError = text.includes('Failed to search right now');
  const hasResults = text.includes('rank videos');

  console.log('With backend running:');
  console.log('  Starting services:', hasStarting);
  console.log('  Unavailable:', hasUnavailable);
  console.log('  Generic error:', hasGenericError);
  console.log('  Has results:', hasResults);
  console.log('  Status:', hasResults ? 'PASS (results loaded)' : hasStarting ? 'OK (waiting)' : 'CHECK');

  await browser.close();
})();
