import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const errors = [];
  const networkErrors = [];
  const apiRequests = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('requestfailed', (req) => networkErrors.push(`${req.method()} ${req.url()} → ${req.failure()?.errorText}`));
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('/search') || u.includes('/rank') || u.includes(':3001')) {
      apiRequests.push(`${req.method()} ${u}`);
    }
  });

  // Test 1: Direct navigation to the search URL (bypasses tile click)
  console.log('=== Test: Direct navigation to bike search ===');
  await page.goto(`${BASE}/youtube/search?q=bike+repair+tutorial&fast=1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('URL:', page.url());

  // Wait for either results or error
  try {
    await Promise.race([
      page.waitForSelector('[data-testid="youtube-search-main"] .grid', { timeout: 30000 }),
      page.waitForSelector('text=Oops!', { timeout: 30000 }),
      page.waitForSelector('text=No videos found', { timeout: 30000 }),
    ]);
  } catch {
    console.log('Timed out waiting for content');
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/bikes_search.png', fullPage: true });

  const bodyText = await page.textContent('body');
  const hasError = bodyText.includes('Oops!') || bodyText.includes('Failed to search');
  const hasSpinner = bodyText.includes('Finding the best videos');
  const hasRankBanner = bodyText.includes('How we rank videos');
  const hasNoResults = bodyText.includes('No videos found');
  const imgCount = await page.locator('[data-testid="youtube-search-main"] img').count();

  console.log('Has error:', hasError);
  console.log('Still loading:', hasSpinner);
  console.log('Has rank explanation:', hasRankBanner);
  console.log('No results:', hasNoResults);
  console.log('Images in results:', imgCount);
  console.log('API requests:', apiRequests.join('\n  ') || 'none');
  console.log('JS errors:', errors.filter(e => !e.includes('UX audit')).join('; ') || 'none');
  console.log('Network fails:', networkErrors.join('; ') || 'none');

  // Test 2: Click on a tile from Home
  console.log('\n=== Test: Click Bikes tile from Home ===');
  apiRequests.length = 0;
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  // Click the div that contains "Bikes" title within a TopicTile
  const bikesTile = page.locator('div.cursor-pointer:has(h3:text("Bikes"))').first();
  const tileVisible = await bikesTile.isVisible();
  console.log('Bikes tile found:', tileVisible);
  if (tileVisible) {
    await bikesTile.click();
    await page.waitForTimeout(2000);
    console.log('URL after click:', page.url());
  }

  console.log(hasError ? 'FAIL: Search error' : imgCount > 0 ? 'PASS: Videos loaded' : hasRankBanner ? 'PASS: Results page rendered' : 'WARN: No video images');
  await browser.close();
})();
