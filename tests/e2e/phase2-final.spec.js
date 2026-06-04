// phase2-final.spec.js — verify ecology FAILURE payoff (wrong plant) + capture
// the notebook Map tab (World Map surface). Player input only.
import { test, expect } from 'playwright/test';
import fs from 'fs';
const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase2_final';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(160000);
const log = [];
const note = (a, x = {}) => log.push({ a, ...x });
async function shot(p, n) { await p.screenshot({ path: `${SHOT}/${n}.png` }).catch(() => {}); }
function readWorld(p) { return p.evaluate(() => { const g = window.__bikebrowserRebuildGame; const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player); if (!s) return null; return { player: { x: Math.round(s.player.x), y: Math.round(s.player.y) }, zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y })) }; }); }
const eco = (p) => p.evaluate(() => window.__ECOLOGY__ || null);
async function walkTo(p, t, maxSteps = 110) { if (!t) return false; let last = null, stuck = 0; for (let i = 0; i < maxSteps; i++) { const w = await readWorld(p); if (!w) return false; const dx = t.x - w.player.x, dy = t.y - w.player.y; if (Math.hypot(dx, dy) < 44) return true; if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 4) stuck++; else stuck = 0; last = w.player; const ks = []; if (stuck >= 4) ks.push(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4]); else if (stuck >= 2) ks.push(Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp')); else { if (Math.abs(dx) > 18) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); if (Math.abs(dy) > 18) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp'); } for (const k of ks) await p.keyboard.down(k); await p.waitForTimeout(115); for (const k of ks) await p.keyboard.up(k); } return false; }

test('phase2 final: ecology failure payoff + map tab', async ({ page }) => {
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

  // Ecology: open, observe site 1 (wash_edge_shade), pick the WORST plant (saguaro).
  await walkTo(page, byId.ecology_garden);
  await page.keyboard.press('e'); await page.waitForTimeout(800);
  const s = await eco(page);
  note('open', { eco: s });
  if (s?.active) {
    if (s.phase === 'observe') { await page.keyboard.press('e'); await page.waitForTimeout(500); }
    await page.waitForFunction(() => window.__ECOLOGY__?.phase === 'predict', null, { timeout: 6000 }).catch(() => {});
    // pick saguaro (a landmark — wrong for a wash-edge bank needing shade+roots)
    const target = 'saguaro';
    for (let g = 0; g < 8; g++) { if ((await eco(page)).optionId === target) break; await page.keyboard.press('ArrowRight'); await page.waitForTimeout(180); }
    note('chosen', { optionId: (await eco(page)).optionId });
    await page.keyboard.press('e'); await page.waitForTimeout(900);
    const out = await eco(page);
    note('outcome', { phase: out?.phase, matchedCount: out?.matchedCount, results: out?.results });
    await shot(page, '00-ecology-WRONG-outcome');
  }
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);

  // Notebook Map tab — precise clicks along the panel top.
  await page.keyboard.press('n'); await page.waitForTimeout(800);
  const vp = page.viewportSize() || { width: 1280, height: 720 };
  await shot(page, '10-notebook-clues');
  // tab row sits ~y=18px; Map is the rightmost of Clues|Tests|Map
  for (const x of [1130, 1150, 1170, 1100]) { await page.mouse.click(x, 18); await page.waitForTimeout(250); }
  await shot(page, '11-notebook-map');
  // also try clicking literal "Map" via a wider y sweep
  for (const y of [14, 22, 30]) { await page.mouse.click(1150, y); await page.waitForTimeout(250); await shot(page, `12-map-y${y}`); }
  await page.keyboard.press('n');

  note('errors', { errors: errors.slice(0, 20) });
  fs.writeFileSync(`${SHOT}/phase2_final.json`, JSON.stringify(log, null, 2));
  console.log('PHASE2_FINAL_DONE');
  expect(Boolean(byId.ecology_garden)).toBeTruthy();
});
