/**
 * Quick Playwright smoke test — checks if the app boots without errors.
 * Run: node scripts/check-app.mjs
 */
import { chromium } from 'playwright';

const URL = 'http://localhost:5173/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });

    // Check for error boundary text
    const bodyText = await page.textContent('body');
    const hasError = bodyText.includes('initialization error') ||
                     bodyText.includes('Maximum update depth') ||
                     bodyText.includes('hit an initialization error');

    if (hasError) {
      console.log('FAIL: Error boundary triggered');
      console.log('Page text snippet:', bodyText.slice(0, 500));
      process.exit(1);
    }

    // Check for expected Home page content
    const hasBikeBrowser = bodyText.includes('BikeBrowser');
    const hasTopics = bodyText.includes('What interests you');

    console.log('Page loaded:', hasBikeBrowser ? 'YES' : 'NO');
    console.log('Topics visible:', hasTopics ? 'YES' : 'NO');
    console.log('JS errors:', errors.length > 0 ? errors.join('; ') : 'none');

    // Check learning section
    const hasLearning = bodyText.includes('Your Learning Journey');
    console.log('Learning section:', hasLearning ? 'YES' : 'NO');

    // Screenshot
    await page.screenshot({ path: 'screenshots/home.png', fullPage: true });
    console.log('Screenshot saved: screenshots/home.png');

    // Check /play route
    await page.goto(URL + 'play', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    const playText = await page.textContent('body');
    const hasGame = playText.includes('Tap to Start') || playText.includes('Zuzu');
    console.log('/play loaded:', hasGame ? 'YES' : 'NO');
    await page.screenshot({ path: 'screenshots/play.png' });
    console.log('Screenshot saved: screenshots/play.png');

    if (!hasBikeBrowser) {
      console.log('FAIL: BikeBrowser content not found');
      process.exit(1);
    }

    console.log('PASS: App boots successfully');
  } catch (err) {
    console.log('FAIL:', err.message);
    console.log('JS errors collected:', errors.join('; '));
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
