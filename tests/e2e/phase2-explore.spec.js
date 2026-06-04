// phase2-explore.spec.js — PHASE 2 QA discovery pass (play first).
// Boots Home->Play, enumerates the current surface (zones, scenes, hooks),
// presses the HUD keys (G map, N notebook, M quiet), and screenshots what a
// player actually sees. Read-only probes; no debug-API actions.
import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase2_explore';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(180000);
const log = [];
const note = (a, x = {}) => log.push({ a, ...x });

test('phase 2 surface discovery (player)', async ({ page }) => {
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('console: ' + m.text()); });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.getByText(/Play BikeBrowser|Act 1/i).last().click({ timeout: 6000 });
  await page.waitForURL(/\/game-rebuild/, { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  await page.waitForFunction(() => { const g = window.__bikebrowserRebuildGame; return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player)); }, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});
  await page.screenshot({ path: `${SHOT}/00-loaded.png` });

  // Full surface enumeration (read-only).
  const surface = await page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const scenes = g?.scene?.scenes || [];
    const s = scenes.find((x) => x.interactions?.zones?.length && x.player);
    let act1 = null;
    try { act1 = window.__GAME__.getAct1State(); } catch {}
    return {
      hooks: Object.keys(window).filter((k) => /^__[A-Z]/.test(k)),
      allScenes: scenes.map((x) => x.scene?.key),
      activeScenes: scenes.filter((x) => x.scene?.isActive?.()).map((x) => x.scene.key),
      zones: (s?.interactions?.zones || []).map((z) => ({ id: z.id, label: z.label, x: z.x, y: z.y })),
      act1Keys: act1 ? Object.keys(act1) : null,
      discovery: act1?.discovery ?? null,
      ecology: act1?.ecology ?? null,
      worldMap: act1?.worldMap ?? act1?.discovery?.map ?? null,
    };
  });
  note('surface', surface);

  // Press the HUD keys a player would try, screenshot each.
  for (const [key, name] of [['g', '01-G-map'], ['g', '02-G-close'], ['n', '03-N-notebook']]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOT}/${name}.png` });
  }
  // In the notebook, try clicking the Map / Discovery-ish tabs (mouse).
  for (const label of ['Map', 'Clues', 'Tests']) {
    const t = page.getByText(label, { exact: false }).first();
    if (await t.count().catch(() => 0)) { await t.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOT}/04-notebook-${label}.png` }); }
  }
  await page.keyboard.press('n'); await page.waitForTimeout(400);

  note('consoleErrors', { errors: consoleErrors.slice(0, 40) });
  fs.writeFileSync(`${SHOT}/surface.json`, JSON.stringify(log, null, 2));
  console.log('PHASE2_EXPLORE_DONE hooks=' + surface.hooks.length + ' zones=' + surface.zones.length + ' scenes=' + surface.allScenes.length);
  expect(surface.zones.length).toBeGreaterThan(0);
});
