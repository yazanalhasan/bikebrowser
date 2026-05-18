import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BIKEBROWSER_AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const OUT_DIR = process.env.BIKEBROWSER_AUDIT_OUT_DIR || 'playtest_captures/runtime_screens';
const REPORT_PATH = process.env.BIKEBROWSER_AUDIT_REPORT_PATH || 'telemetry/route_capture_report.json';

const ROUTES = [
  { name: 'home', path: '/', waitMs: 1500 },
  { name: 'play', path: '/play', waitMs: 3500 },
  { name: 'godot_diagnostics', path: '/godot-prototype?diagnostics=1', waitMs: 3500 },
  { name: 'legacy_play', path: '/legacy-play', waitMs: 2500 },
  { name: 'play3d', path: '/play3d', waitMs: 2500 },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'lowres', width: 960, height: 540, isMobile: false },
  { name: 'tablet_portrait', width: 820, height: 1180, isMobile: true },
  { name: 'mobile_portrait', width: 390, height: 844, isMobile: true },
  { name: 'mobile_landscape', width: 844, height: 390, isMobile: true },
];
const REPEAT_COUNT = Number(process.env.BIKEBROWSER_AUDIT_REPEAT_COUNT || 2);

await mkdir(OUT_DIR, { recursive: true });
await mkdir(path.dirname(REPORT_PATH), { recursive: true });

const browser = await chromium.launch({ headless: true });
const startedAt = new Date().toISOString();
const CONCURRENCY = Number(process.env.BIKEBROWSER_AUDIT_CONCURRENCY || 8);

async function captureOne(viewport, route, iteration) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  const consoleFailures = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleFailures.push({
        type: message.type(),
        text: message.text(),
      });
    }
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText || 'unknown',
    });
  });

  const url = BASE_URL + route.path;
  const fileName = `${viewport.name}__${route.name}__run${String(iteration).padStart(2, '0')}.png`;
  const outputPath = path.join(OUT_DIR, fileName);

  let status = 'ok';
  let title = '';
  let bodyText = '';
  let iframeInfo = null;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(route.waitMs);
    title = await page.title().catch(() => '');
    bodyText = (await page.locator('body').innerText({ timeout: 1000 }).catch(() => '')).slice(0, 1000);
    iframeInfo = await page.evaluate(() => {
      const iframe = document.querySelector('[data-testid="godot-iframe"]');
      if (!iframe) return null;
      const rect = iframe.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    await page.screenshot({ path: outputPath, fullPage: false });
  } catch (error) {
    status = 'error';
    errors.push(error.message);
  } finally {
    await context.close();
  }

  return {
    iteration,
    viewport: viewport.name,
    route: route.name,
    path: route.path,
    url,
    screenshot: outputPath.replaceAll('\\', '/'),
    status,
    title,
    bodyText,
    iframeInfo,
    consoleFailures: consoleFailures.slice(0, 20),
    errors,
    failedRequests: failedRequests.slice(0, 8),
  };
}

const tasks = [];
for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    for (let iteration = 1; iteration <= REPEAT_COUNT; iteration += 1) {
      tasks.push({ viewport, route, iteration });
    }
  }
}

const results = [];
let nextTask = 0;
async function worker() {
  while (nextTask < tasks.length) {
    const task = tasks[nextTask];
    nextTask += 1;
    results.push(await captureOne(task.viewport, task.route, task.iteration));
  }
}

await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, () => worker()),
);
await browser.close();

const report = {
  startedAt,
  finishedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  outputDir: OUT_DIR.replaceAll('\\', '/'),
  reportPath: REPORT_PATH.replaceAll('\\', '/'),
  routeCount: ROUTES.length,
  viewportCount: VIEWPORTS.length,
  repeatCount: REPEAT_COUNT,
  concurrency: CONCURRENCY,
  screenshotCount: results.length,
  results: results.sort((a, b) => `${a.viewport}:${a.route}`.localeCompare(`${b.viewport}:${b.route}`)),
};

await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

console.log(JSON.stringify(report, null, 2));
