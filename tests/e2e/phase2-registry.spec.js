// phase2-registry.spec.js — verify the Discovery Registry ([J]) as a player:
// does it open, do discoveries appear/persist, does it connect to gameplay?
import { test, expect } from 'playwright/test';
import fs from 'fs';
const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase2_registry';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(150000);
const log = [];
const note = (a, x = {}) => log.push({ a, ...x });
async function shot(p, n) { await p.screenshot({ path: `${SHOT}/${n}.png` }).catch(() => {}); }
function readWorld(p) { return p.evaluate(() => { const g = window.__bikebrowserRebuildGame; const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player); if (!s) return null; return { player: { x: Math.round(s.player.x), y: Math.round(s.player.y) }, zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y })) }; }); }
const disc = (p) => p.evaluate(() => { try { const d = window.__GAME__.getAct1State().discovery; return { count: d.discovered.length, total: d.regions.length, known: d.discovered }; } catch { return null; } });
const activeScenes = (p) => p.evaluate(() => (window.__bikebrowserRebuildGame?.scene?.scenes || []).filter((x) => x.scene?.isActive?.() && x.scene?.isVisible?.()).map((x) => x.scene.key));
async function walkTo(p, t, maxSteps = 110) { if (!t) return false; let last = null, stuck = 0; for (let i = 0; i < maxSteps; i++) { const w = await readWorld(p); if (!w) return false; const dx = t.x - w.player.x, dy = t.y - w.player.y; if (Math.hypot(dx, dy) < 44) return true; if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 4) stuck++; else stuck = 0; last = w.player; const ks = []; if (stuck >= 4) ks.push(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4]); else if (stuck >= 2) ks.push(Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp')); else { if (Math.abs(dx) > 18) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); if (Math.abs(dy) > 18) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp'); } for (const k of ks) await p.keyboard.down(k); await p.waitForTimeout(115); for (const k of ks) await p.keyboard.up(k); } return false; }

test('phase2 discovery registry [J] + map keys', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.getByText(/Play BikeBrowser|Act 1/i).last().click({ timeout: 6000 });
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  await page.waitForFunction(() => { const g = window.__bikebrowserRebuildGame; return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player)); }, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});
  const byId = Object.fromEntries(((await readWorld(page))?.zones || []).map((z) => [z.id, z]));

  // Open registry [J] BEFORE discovering anything.
  note('disc_before', await disc(page));
  await page.keyboard.press('j'); await page.waitForTimeout(800);
  note('J_open_before', { active: await activeScenes(page) });
  await shot(page, '00-registry-before');
  await page.keyboard.press('j'); await page.waitForTimeout(300);

  // Discover the wash (E), the ecology garden play, then reopen registry.
  if (await walkTo(page, byId.dry_wash)) { await page.keyboard.press('e'); await page.waitForTimeout(600); }
  note('disc_after_wash', await disc(page));
  await page.keyboard.press('j'); await page.waitForTimeout(800);
  await shot(page, '01-registry-after-wash');
  await page.keyboard.press('j'); await page.waitForTimeout(300);

  // Try other plausible map keys a kid might press.
  for (const k of ['m', 'g', 'j', 'Tab']) { await page.keyboard.press(k); await page.waitForTimeout(700); await shot(page, `10-key-${k}`); note('key', { k, active: await activeScenes(page) }); await page.keyboard.press(k).catch(() => {}); await page.waitForTimeout(200); }

  note('errors', { errors: errors.slice(0, 20) });
  fs.writeFileSync(`${SHOT}/phase2_registry.json`, JSON.stringify(log, null, 2));
  console.log('PHASE2_REGISTRY_DONE');
  expect(true).toBeTruthy();
});
