import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

const ROUTES = [
  { path: '/', name: 'Home', expect: ['BikeBrowser', 'What interests you'], screenshot: 'home' },
  { path: '/youtube/search?q=bike+repair+tutorial&fast=1', name: 'YouTube Search (Bikes)', expect: ['rank videos'], screenshot: 'youtube_search', wait: 15000 },
  { path: '/project-builder', name: 'Project Builder', expect: ['Project'], screenshot: 'project_builder' },
  { path: '/build-planner', name: 'Build Planner', expect: ['Build'], screenshot: 'build_planner' },
  { path: '/shop', name: 'Shopping', expect: ['Shop Materials'], screenshot: 'shopping' },
  { path: '/saved-notes', name: 'Saved Notes', expect: ['Notes'], screenshot: 'saved_notes' },
  { path: '/safe-search', name: 'Safe Search', expect: ['Search'], screenshot: 'safe_search' },
  { path: '/play', name: 'Game (/play)', expect: ['Zuzu'], screenshot: 'game', wait: 3000 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop audit
  console.log('\\n========== DESKTOP AUDIT (1280x800) ==========');
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dp = await desktopCtx.newPage();
  const jsErrors = [];
  dp.on('pageerror', (err) => jsErrors.push(err.message));

  for (const route of ROUTES) {
    jsErrors.length = 0;
    try {
      await dp.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await dp.waitForTimeout(route.wait || 3000);

      const text = await dp.textContent('body');
      const matched = route.expect.filter(e => text.toLowerCase().includes(e.toLowerCase()));
      const hasError = text.includes('initialization error') || text.includes('Maximum update depth');
      const relevantErrors = jsErrors.filter(e => !e.includes('UX audit'));

      await dp.screenshot({ path: `screenshots/${route.screenshot}.png` });

      const status = hasError ? 'ERROR' : matched.length === route.expect.length ? 'OK' : 'WARN';
      const icon = status === 'OK' ? '✓' : status === 'WARN' ? '~' : '✗';
      console.log(`${icon} ${route.name.padEnd(30)} ${status}  content:${matched.length}/${route.expect.length}  jsErr:${relevantErrors.length}`);
      if (relevantErrors.length > 0) console.log(`  JS: ${relevantErrors[0].slice(0, 120)}`);
    } catch (err) {
      console.log(`✗ ${route.name.padEnd(30)} FAIL  ${err.message.slice(0, 80)}`);
    }
  }

  // Immersive check for /play
  console.log('\\n--- /play immersive check ---');
  await dp.goto(BASE + '/play', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await dp.waitForTimeout(2000);
  const headerVisible = await dp.locator('[data-testid="app-header"]').isVisible().catch(() => false);
  const footerVisible = await dp.locator('[data-testid="app-footer"]').isVisible().catch(() => false);
  console.log(`Header visible: ${headerVisible} (should be false)`);
  console.log(`Footer visible: ${footerVisible} (should be false)`);
  console.log(headerVisible || footerVisible ? '✗ FAIL: App chrome leaking into /play' : '✓ PASS: /play is immersive');

  // Mobile audit
  console.log('\\n========== MOBILE AUDIT (390x844) ==========');
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await mobileCtx.newPage();

  for (const route of [ROUTES[0], ROUTES[4], ROUTES[7]]) {
    try {
      await mp.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await mp.waitForTimeout(route.wait || 3000);
      await mp.screenshot({ path: `screenshots/mobile_${route.screenshot}.png` });
      console.log(`✓ Mobile ${route.name.padEnd(22)} screenshot captured`);
    } catch (err) {
      console.log(`✗ Mobile ${route.name.padEnd(22)} FAIL: ${err.message.slice(0, 60)}`);
    }
  }

  // API health
  console.log('\\n========== API HEALTH ==========');
  const apiPage = await desktopCtx.newPage();
  try {
    const resp = await apiPage.goto('http://localhost:3001/health', { timeout: 5000 });
    console.log(`✓ API server: HTTP ${resp.status()}`);
  } catch {
    console.log('✗ API server: NOT REACHABLE on port 3001');
  }

  await browser.close();
  console.log('\\nDone.');
})();
