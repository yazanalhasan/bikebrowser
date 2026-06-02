// phase1-reconcile2.spec.js — corrected player reconciliation.
// Drives Bridge Design (success + fail + redesign) and Investigation via the
// REAL entry zone `investigate_wash`. Keyboard/mouse only for ACTIONS; reads
// window state ONLY to navigate precisely and verify outcomes (no debug-API actions).
import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/reconcile2';
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
function bd(p) { return p.evaluate(() => window.__BRIDGE_DESIGN__ || null); }       // read-only
function inv(p) { return p.evaluate(() => { try { return window.__GAME__.getAct1State().investigation.investigations.map((i) => ({ id: i.id, observed: i.observed, hypothesisId: i.hypothesisId, evidenceCount: i.evidenceCount, concluded: i.concluded })); } catch { return null; } }); }
function hooks(p) { return p.evaluate(() => Object.keys(window).filter((k) => /^__[A-Z]/.test(k))); }
function invHook(p) { return p.evaluate(() => window.__INVESTIGATION__ || null); }
function bridgeSt(p) { return p.evaluate(() => { try { return window.__GAME__.getBridgeState(); } catch { return null; } }); }

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

// Pick a specific material for the current role by cycling ◄►(read candidateId), then E.
async function chooseMaterial(p, targetId, maxCycle = 10) {
  for (let i = 0; i < maxCycle; i++) {
    const s = await bd(p);
    if (!s?.active) return false;
    if (s.candidateId === targetId) { await p.keyboard.press('e'); await p.waitForTimeout(450); return true; }
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(220);
  }
  // fallback: just choose whatever is shown
  await p.keyboard.press('e'); await p.waitForTimeout(450); return false;
}
async function designBridgeViaUI(p, picks, tag) {
  const opened = (await bd(p))?.active;
  note('bridge_modal_open', { tag, opened: Boolean(opened) });
  if (!opened) return;
  for (let r = 0; r < 3; r++) {
    const s = await bd(p);
    if (!s?.active) break;
    const role = s.role;
    const ok = await chooseMaterial(p, picks[r]);
    note('bridge_pick', { tag, role, want: picks[r], chosen: ok });
    await shot(p, `${tag}-role${r}-${role}`);
  }
  await p.waitForTimeout(500);
  await shot(p, `${tag}-result`);
  note('bridge_result', { tag, bd: await bd(p), bridge: await bridgeSt(p) });
}

test('reconciliation v2: bridge (success/fail/redesign) + investigation via investigate_wash', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // HOME -> PLAY
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.getByText(/Play BikeBrowser|Act 1/i).last().click({ timeout: 6000 });
  await page.waitForURL(/\/game-rebuild/, { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  await page.waitForFunction(() => { const g = window.__bikebrowserRebuildGame; return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player)); }, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});
  note('landed', { url: page.url(), hooks: await hooks(page) });

  const w0 = await readWorld(page);
  const byId = Object.fromEntries((w0?.zones || []).map((z) => [z.id, z]));
  note('zones', { ids: Object.keys(byId) });

  const goE = async (id, presses = 1) => {
    const z = byId[id]; if (!z) { note('zone_missing', { id }); return false; }
    const reached = await walkTo(page, z);
    note('walk', { id, reached });
    if (reached) for (let k = 0; k < presses; k++) { await page.keyboard.press('e'); await page.waitForTimeout(650); }
    return reached;
  };

  // SETUP: bike, collect, UTM test ALL materials (keyboard predict->test->advance)
  await goE('bike', 2);
  await goE('materials_table', 2);
  if (await walkTo(page, byId.utm)) {
    await page.keyboard.press('e'); await page.waitForTimeout(700);
    for (let i = 0; i < 10; i++) {
      const pr = await page.evaluate(() => window.__PREDICTION__ || null);
      if (!pr?.active) break;
      await page.keyboard.press('ArrowLeft'); // guess HOLD
      await page.keyboard.press('e'); await page.waitForTimeout(650); // test (see beam)
      await page.keyboard.press('e'); await page.waitForTimeout(450); // next/summary
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  }
  await shot(page, '00-setup-done');

  // BRIDGE — SAFE design (steel/steel/copper_brace), then REDESIGN weak (weak_scrap/steel/copper_brace)
  if (await walkTo(page, byId.bridge_plan)) {
    await page.keyboard.press('e'); await page.waitForTimeout(700);
    await shot(page, '10-bridge-open');
    await designBridgeViaUI(page, ['steel', 'steel', 'copper_brace'], '11-safe');
    // redesign: reopen and try a weak deck to force failure
    await page.keyboard.press('e'); await page.waitForTimeout(700);
    note('bridge_reopen', { opened: Boolean((await bd(page))?.active) });
    await designBridgeViaUI(page, ['weak_scrap', 'steel', 'copper_brace'], '12-weak');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }
  note('bridge_final', { bridge: await bridgeSt(page) });

  // INVESTIGATION — via the REAL entry zone investigate_wash
  const invStart = await inv(page);
  let reachedInv = await walkTo(page, byId.investigate_wash);
  note('walk', { id: 'investigate_wash', reached: reachedInv });
  if (reachedInv) {
    await page.keyboard.press('e'); await page.waitForTimeout(800);
    await shot(page, '20-invest-open');
    note('invest_open', { hooks: await hooks(page), invHook: await invHook(page), promptInv: await inv(page) });
    // Drive the investigation UI: try arrows to pick a hypothesis, E to act; repeat to gather evidence + conclude.
    for (let k = 0; k < 10; k++) {
      await page.keyboard.press(k % 3 === 2 ? 'ArrowRight' : 'e');
      await page.waitForTimeout(450);
      await shot(page, `21-invest-step${k}`);
      const cur = await inv(page);
      note('invest_step', { k, inv: cur, invHook: await invHook(page) });
      if (cur && cur.some((m) => m.concluded)) { note('invest_concluded', { k }); break; }
    }
  }
  note('invest_final', { before: invStart, after: await inv(page) });

  await page.keyboard.press('n'); await page.waitForTimeout(800); await shot(page, '30-notebook');
  note('errors', { errors: errors.slice(0, 20) });
  fs.writeFileSync(`${SHOT}/reconcile2.json`, JSON.stringify(log, null, 2));
  console.log('RECONCILE2_DONE');
  expect(Boolean(w0)).toBeTruthy();
});
