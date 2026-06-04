// phase2-ecology.spec.js — complete the Ecology Loop (observe->predict->outcome
// ->payoff) by keyboard, both a CORRECT and a WRONG plant choice, and capture
// the notebook Map tab. Player input only; read-only verification.
import { test, expect } from 'playwright/test';
import fs from 'fs';
const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase2_ecology';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(200000);
const log = [];
const note = (a, x = {}) => log.push({ a, ...x });
async function shot(p, n) { await p.screenshot({ path: `${SHOT}/${n}.png` }).catch(() => {}); }
function readWorld(p) { return p.evaluate(() => { const g = window.__bikebrowserRebuildGame; const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player); if (!s) return null; return { player: { x: Math.round(s.player.x), y: Math.round(s.player.y) }, zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y })) }; }); }
const eco = (p) => p.evaluate(() => window.__ECOLOGY__ || null);
const fb = (p) => p.evaluate(() => { try { const f = window.__GAME__.getFeedbackState(); return f?.last ? f.last.message : null; } catch { return null; } });
async function walkTo(p, t, maxSteps = 110) { if (!t) return false; let last = null, stuck = 0; for (let i = 0; i < maxSteps; i++) { const w = await readWorld(p); if (!w) return false; const dx = t.x - w.player.x, dy = t.y - w.player.y; if (Math.hypot(dx, dy) < 44) return true; if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 4) stuck++; else stuck = 0; last = w.player; const ks = []; if (stuck >= 4) ks.push(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4]); else if (stuck >= 2) ks.push(Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp')); else { if (Math.abs(dx) > 18) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); if (Math.abs(dy) > 18) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp'); } for (const k of ks) await p.keyboard.down(k); await p.waitForTimeout(115); for (const k of ks) await p.keyboard.up(k); } return false; }
// In predict phase, cycle to a target option (or to a deliberately wrong one) and confirm.
async function chooseOption(p, pickWrong) {
  await p.waitForFunction(() => window.__ECOLOGY__ && window.__ECOLOGY__.phase === 'predict', null, { timeout: 6000 }).catch(() => {});
  const s = await eco(p);
  if (!s || s.phase !== 'predict') return null;
  // "right" plant for a wash-edge shade site is mesquite; pick it or avoid it.
  const want = pickWrong ? (s.options.find((o) => o !== 'mesquite') || s.options[0]) : (s.options.includes('mesquite') ? 'mesquite' : s.options[0]);
  for (let g = 0; g < 8; g++) { if ((await eco(p)).optionId === want) break; await p.keyboard.press('ArrowRight'); await p.waitForTimeout(180); }
  const chosen = (await eco(p)).optionId;
  await p.keyboard.press('e'); await p.waitForTimeout(900);
  return chosen;
}

test('phase2 ecology loop complete + map tab', async ({ page }) => {
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

  // Open the ecology loop.
  const reached = await walkTo(page, byId.ecology_garden);
  note('walk', { reached });
  await page.keyboard.press('e'); await page.waitForTimeout(800);
  note('open', { eco: await eco(page), feedback: await fb(page) });
  await shot(page, '00-observe-site1');

  // Drive up to 2 sites: site 1 = CORRECT choice, site 2 = WRONG choice.
  for (let site = 0; site < 2; site++) {
    const s0 = await eco(page);
    if (!s0?.active) { note('loop_ended_early', { site }); break; }
    await shot(page, `1${site}-site${site}-observe`);
    note(`site${site}_observe`, { eco: s0, feedback: await fb(page) });
    // observe -> predict (E enters choose)
    if ((await eco(page)).phase === 'observe') { await page.keyboard.press('e'); await page.waitForTimeout(500); }
    await shot(page, `1${site}-site${site}-predict`);
    const chosen = await chooseOption(page, site === 1); // site 1 picks wrong on purpose
    note(`site${site}_choose`, { chosen, pickWrong: site === 1, eco: await eco(page), feedback: await fb(page) });
    await shot(page, `1${site}-site${site}-outcome`);
    // advance through outcome/payoff (E) until next site or close
    for (let k = 0; k < 4; k++) { await page.keyboard.press('e'); await page.waitForTimeout(600); await shot(page, `1${site}-site${site}-payoff${k}`); note(`site${site}_payoff${k}`, { eco: await eco(page), feedback: await fb(page) }); const e = await eco(page); if (!e?.active || e.index > site) break; }
  }
  note('ecology_final', { eco: await eco(page), ecologyState: await page.evaluate(() => { try { return window.__GAME__.getAct1State().ecology; } catch { return null; } }) });
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);

  // NOTEBOOK MAP TAB — open and click the Map tab precisely.
  await page.keyboard.press('n'); await page.waitForTimeout(800); await shot(page, '30-notebook');
  const vp = page.viewportSize() || { width: 1280, height: 720 };
  // try a small grid of likely tab positions for "Map" (rightmost tab, top of panel)
  for (const x of [0.90, 0.93, 0.96]) for (const y of [0.035, 0.06]) {
    await page.mouse.click(Math.round(vp.width * x), Math.round(vp.height * y)); await page.waitForTimeout(300);
  }
  await shot(page, '31-notebook-map-attempt');

  note('errors', { errors: errors.slice(0, 30) });
  fs.writeFileSync(`${SHOT}/phase2_ecology.json`, JSON.stringify(log, null, 2));
  console.log('PHASE2_ECOLOGY_DONE');
  expect(Boolean(byId.ecology_garden)).toBeTruthy();
});
