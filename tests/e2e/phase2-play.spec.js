// phase2-play.spec.js — PHASE 2 QA play pass (player only, no debug-API actions).
// Plays the Ecology Loop, probes World Map (G), and tests Discovery (does
// visiting regions raise the known-count?). Read-only hooks for verification.
import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase2_play';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(240000);
const log = [];
const note = (a, x = {}) => log.push({ a, ...x });
async function shot(p, n) { await p.screenshot({ path: `${SHOT}/${n}.png` }).catch(() => {}); }

function readWorld(p) {
  return p.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player);
    if (!s) return null;
    return { player: { x: Math.round(s.player.x), y: Math.round(s.player.y) },
      zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y, label: z.label })) };
  });
}
const eco = (p) => p.evaluate(() => window.__ECOLOGY__ || null);
const discovery = (p) => p.evaluate(() => { try { const d = window.__GAME__.getAct1State().discovery; return { known: d.discovered, count: d.discovered.length, total: d.regions.length, regions: d.regions }; } catch { return null; } });
const gps = (p) => p.evaluate(() => { try { return window.__GAME__.getDiscoveryState?.() ?? null; } catch { return null; } });
const activeScenes = (p) => p.evaluate(() => (window.__bikebrowserRebuildGame?.scene?.scenes || []).filter((x) => x.scene?.isActive?.() && x.scene?.isVisible?.()).map((x) => x.scene.key));
const worldMapVisible = (p) => p.evaluate(() => { const s = (window.__bikebrowserRebuildGame?.scene?.scenes || []).find((x) => /worldmap/i.test(x.scene?.key || '')); return Boolean(s && s.scene.isActive() && s.scene.isVisible()); });

async function walkTo(p, t, maxSteps = 100) {
  if (!t) return false;
  let last = null, stuck = 0;
  for (let i = 0; i < maxSteps; i++) {
    const w = await readWorld(p); if (!w) return false;
    const dx = t.x - w.player.x, dy = t.y - w.player.y;
    if (Math.hypot(dx, dy) < 46) return true;
    if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 4) stuck++; else stuck = 0;
    last = w.player;
    const ks = [];
    if (stuck >= 4) ks.push(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4]);
    else if (stuck >= 2) ks.push(Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp'));
    else { if (Math.abs(dx) > 20) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); if (Math.abs(dy) > 20) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp'); }
    for (const k of ks) await p.keyboard.down(k);
    await p.waitForTimeout(120);
    for (const k of ks) await p.keyboard.up(k);
  }
  const w = await readWorld(p);
  return w ? Math.hypot(t.x - w.player.x, t.y - w.player.y) < 70 : false;
}

test('phase 2 play: ecology loop + world map + discovery', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.getByText(/Play BikeBrowser|Act 1/i).last().click({ timeout: 6000 });
  await page.waitForURL(/\/game-rebuild/, { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  await page.waitForFunction(() => { const g = window.__bikebrowserRebuildGame; return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player)); }, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});

  const w0 = await readWorld(page);
  const byId = Object.fromEntries((w0?.zones || []).map((z) => [z.id, z]));
  note('discovery_start', { discovery: await discovery(page), gps: await gps(page) });

  // ---- DISCOVERY: does visiting raise the known-count? ----
  for (const id of ['dry_wash', 'investigate_wash', 'ecology_garden', 'wider_gate']) {
    if (!byId[id]) continue;
    const reached = await walkTo(page, byId[id]);
    note('discovery_visit', { id, reached, discovery: await discovery(page) });
  }
  await shot(page, '10-after-roaming');

  // ---- WORLD MAP: press G, look for a map view ----
  await page.keyboard.press('g'); await page.waitForTimeout(1200);
  note('worldmap_G', { worldMapVisible: await worldMapVisible(page), active: await activeScenes(page) });
  await shot(page, '20-worldmap-G');
  await page.keyboard.press('g'); await page.waitForTimeout(500);
  // also try notebook Map tab via keyboard cycling
  await page.keyboard.press('n'); await page.waitForTimeout(700); await shot(page, '21-notebook');
  for (const k of ['ArrowRight', 'ArrowRight', 'Tab']) { await page.keyboard.press(k); await page.waitForTimeout(500); }
  await shot(page, '22-notebook-tabbed');
  await page.keyboard.press('n'); await page.waitForTimeout(300);

  // ---- ECOLOGY LOOP: walk to "Plant the desert" and play it ----
  const reachedEco = await walkTo(page, byId.ecology_garden);
  note('ecology_walk', { reached: reachedEco });
  if (reachedEco) {
    await page.keyboard.press('e'); await page.waitForTimeout(800);
    await shot(page, '30-ecology-open');
    note('ecology_open', { eco: await eco(page), active: await activeScenes(page) });
    // Drive observe -> predict -> outcome -> payoff with keyboard.
    for (let k = 0; k < 12; k++) {
      const before = await eco(page);
      if (!before?.active && k > 0) { note('ecology_closed', { k }); break; }
      // vary: mostly E to advance, sometimes arrows to choose a prediction
      await page.keyboard.press(k % 3 === 1 ? 'ArrowRight' : 'e');
      await page.waitForTimeout(500);
      await shot(page, `31-ecology-step${k}`);
      note('ecology_step', { k, eco: await eco(page) });
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }
  note('ecology_final_state', { ecologyState: await page.evaluate(() => { try { return window.__GAME__.getAct1State().ecology; } catch { return null; } }) });

  // notebook after, to see ecology/discovery entries
  await page.keyboard.press('n'); await page.waitForTimeout(700); await shot(page, '40-notebook-final');

  note('errors', { errors: errors.slice(0, 30) });
  fs.writeFileSync(`${SHOT}/phase2_play.json`, JSON.stringify(log, null, 2));
  console.log('PHASE2_PLAY_DONE');
  expect(Boolean(w0)).toBeTruthy();
});
