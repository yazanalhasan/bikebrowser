/**
 * Playwright route checker — visits all major routes and reports status.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const ROUTES = [
  { path: '/', name: 'Home', expect: 'BikeBrowser' },
  { path: '/youtube/search?q=bike+repair', name: 'YouTube Search', expect: 'Search' },
  { path: '/project-builder', name: 'Project Builder', expect: 'Project' },
  { path: '/build-planner', name: 'Build Planner', expect: 'Build' },
  { path: '/shop', name: 'Shopping', expect: 'Shop' },
  { path: '/saved-notes', name: 'Saved Notes', expect: 'Notes' },
  { path: '/safe-search', name: 'Safe Search', expect: 'Search' },
  { path: '/play', name: 'Game', expect: 'Zuzu' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const results = [];

  for (const route of ROUTES) {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    try {
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);

      const text = await page.textContent('body');
      const hasExpected = text.includes(route.expect);
      const hasError = text.includes('initialization error') || text.includes('Maximum update depth');

      const fname = route.name.toLowerCase().replace(/\s+/g, '_');
      await page.screenshot({ path: `screenshots/${fname}.png` });

      results.push({
        route: route.path,
        name: route.name,
        status: hasError ? 'ERROR' : hasExpected ? 'OK' : 'WARN',
        hasExpectedContent: hasExpected,
        jsErrors: errors.filter(e => !e.includes('UX audit')).length,
      });
    } catch (err) {
      results.push({
        route: route.path,
        name: route.name,
        status: 'FAIL',
        error: err.message,
      });
    }

    page.removeAllListeners('pageerror');
  }

  // Mobile check
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();

  for (const route of [ROUTES[0], ROUTES[5], ROUTES[7]]) {
    try {
      await mobilePage.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await mobilePage.waitForTimeout(1500);
      const fname = `mobile_${route.name.toLowerCase().replace(/\s+/g, '_')}`;
      await mobilePage.screenshot({ path: `screenshots/${fname}.png` });
      results.push({ route: route.path, name: `Mobile: ${route.name}`, status: 'OK (screenshot)' });
    } catch (err) {
      results.push({ route: route.path, name: `Mobile: ${route.name}`, status: 'FAIL', error: err.message });
    }
  }

  console.log('\n=== Route Check Results ===');
  for (const r of results) {
    const icon = r.status === 'OK' || r.status === 'OK (screenshot)' ? '✓' : r.status === 'WARN' ? '~' : '✗';
    console.log(`${icon} ${r.name.padEnd(22)} ${r.status}${r.jsErrors ? ` (${r.jsErrors} JS errors)` : ''}${r.error ? ` — ${r.error}` : ''}`);
  }

  await browser.close();
})();
