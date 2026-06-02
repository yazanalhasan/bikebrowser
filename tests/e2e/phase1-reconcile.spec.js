// phase1-reconcile.spec.js — REALITY RECONCILIATION (player only).
// Start at Home -> Play -> /game-rebuild. Attempt Bridge Design and Dry Wash
// Investigation using ONLY keyboard + mouse + visible UI. window.__GAME__ is
// used READ-ONLY (verify outcomes / navigate); NO debug-API actions are taken.
import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/reconcile';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(240000);

const steps = [];
const note = (action, extra = {}) => steps.push({ action, ...extra });

async function shot(page, name) { await page.screenshot({ path: `${SHOT}/${name}.png` }).catch(() => {}); note('screenshot', { file: `${name}.png` }); }

function readWorld(page) {
  return page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player);
    if (!s) return null;
    return { player: { x: Math.round(s.player.x), y: Math.round(s.player.y) },
      zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y, label: z.label })) };
  });
}
// READ-ONLY detectors (verification, not actions)
function probe(page) {
  return page.evaluate(() => {
    const out = { promptText: null, bridgeDesign: null, prediction: null, investigation: null, activeKeys: null };
    const g = window.__bikebrowserRebuildGame;
    const scenes = g?.scene?.scenes || [];
    out.activeKeys = scenes.filter((x) => x.scene?.isActive?.()).map((x) => x.scene.key);
    const ns = scenes.find((x) => x.prompt && x.player);
    out.promptText = ns?.prompt?.visible ? ns.prompt.text : null;
    out.bridgeDesign = window.__BRIDGE_DESIGN__ ? { active: window.__BRIDGE_DESIGN__.active, ...window.__BRIDGE_DESIGN__ } : null;
    out.prediction = window.__PREDICTION__ ? { active: window.__PREDICTION__.active, phase: window.__PREDICTION__.phase } : null;
    try {
      const inv = window.__GAME__.getAct1State().investigation;
      out.investigation = (inv?.investigations || []).map((i) => ({ id: i.id, observed: i.observed, hypothesisId: i.hypothesisId, evidenceCount: i.evidenceCount, concluded: i.concluded }));
    } catch {}
    return out;
  });
}
async function bridgeState(page) {
  return page.evaluate(() => { try { return window.__GAME__.getBridgeState(); } catch { return null; } });
}
async function walkTo(page, t, maxSteps = 90) {
  if (!t) return false;
  let last = null, stuck = 0;
  for (let i = 0; i < maxSteps; i++) {
    const w = await readWorld(page); if (!w) return false;
    const dx = t.x - w.player.x, dy = t.y - w.player.y;
    if (Math.hypot(dx, dy) < 48) return true;
    if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 4) stuck++; else stuck = 0;
    last = w.player;
    const ks = [];
    if (stuck >= 4) ks.push(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4]);
    else if (stuck >= 2) ks.push(Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp'));
    else { if (Math.abs(dx) > 20) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); if (Math.abs(dy) > 20) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp'); }
    for (const k of ks) await page.keyboard.down(k);
    await page.waitForTimeout(130);
    for (const k of ks) await page.keyboard.up(k);
  }
  const w = await readWorld(page);
  return w ? Math.hypot(t.x - w.player.x, t.y - w.player.y) < 70 : false;
}
async function go(page, byId, id) {
  const z = byId[id]; if (!z) { note('zone_missing', { id }); return false; }
  const reached = await walkTo(page, z);
  note('walk', { id, reached, target: { x: z.x, y: z.y } });
  return reached;
}
async function pressE(page, label) { await page.keyboard.press('e'); await page.waitForTimeout(700); note('press', { key: 'E', at: label }); }

test('reconciliation: bridge design + investigation (player only)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // 1) HOME -> PLAY (real mouse click)
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await shot(page, '00-home');
  const card = page.getByText(/Play BikeBrowser|Act 1/i).last();
  await card.click({ timeout: 6000 });
  note('click', { what: 'Home Play card' });
  await page.waitForURL(/\/game-rebuild/, { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  await page.waitForFunction(() => { const g = window.__bikebrowserRebuildGame; return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player)); }, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});
  note('landed', { url: page.url() });
  await shot(page, '01-game-loaded');

  const w0 = await readWorld(page);
  const byId = Object.fromEntries((w0?.zones || []).map((z) => [z.id, z]));
  note('zones', { ids: Object.keys(byId) });

  // 2) SETUP via UI so prerequisites are met (bike -> collect -> UTM predict/test)
  if (await go(page, byId, 'bike')) { await pressE(page, 'bike'); await page.keyboard.press('e'); await page.waitForTimeout(300); }
  if (await go(page, byId, 'materials_table')) { await pressE(page, 'materials_table'); await page.keyboard.press('e'); await page.waitForTimeout(300); }
  // UTM predict-test loop (keyboard): for each material pick + test + advance, then exit.
  if (await go(page, byId, 'utm')) {
    await pressE(page, 'utm');
    for (let i = 0; i < 8; i++) {
      const p = await probe(page);
      if (!p.prediction?.active) break;
      await page.keyboard.press(i % 4 === 1 ? 'ArrowRight' : 'ArrowLeft'); // vary HOLD/BREAK
      await page.keyboard.press('e'); // test
      await page.waitForTimeout(700);
      await page.keyboard.press('e'); // next/summary
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    await shot(page, '02-after-utm');
  }
  note('state_after_setup', { bridge: await bridgeState(page), probe: await probe(page) });

  // 3) BRIDGE DESIGN attempt — try every bridge-ish interaction
  for (const id of ['bridge_plan', 'bridge_repair']) {
    if (!byId[id]) continue;
    await go(page, byId, id);
    const before = await bridgeState(page);
    await pressE(page, id);
    const p = await probe(page);
    note('bridge_attempt', { id, promptText: p.promptText, bridgeDesignActive: p.bridgeDesign?.active ?? null, activeKeys: p.activeKeys });
    await shot(page, `10-bridge-${id}`);
    // If a design modal opened, try to CHOOSE materials + submit a WEAK design + redesign.
    if (p.bridgeDesign?.active) {
      // probe the control scheme by screenshotting, then drive arrows + E.
      for (let k = 0; k < 6; k++) {
        await page.keyboard.press(k % 2 ? 'ArrowRight' : 'ArrowLeft');
        await page.waitForTimeout(200);
        await page.keyboard.press('e'); // confirm role / advance
        await page.waitForTimeout(400);
        await shot(page, `11-bridge-${id}-choose${k}`);
        const pp = await probe(page);
        if (!pp.bridgeDesign?.active) { note('bridge_closed_after', { atStep: k }); break; }
      }
      // attempt redesign: reopen
      await pressE(page, `${id} (reopen)`);
      await shot(page, `12-bridge-${id}-reopen`);
    }
    note('bridge_after', { id, bridge: await bridgeState(page) });
  }

  // 4) DRY WASH INVESTIGATION attempt
  for (const id of ['dry_wash', 'bridge_repair']) {
    if (!byId[id]) continue;
    await go(page, byId, id);
    const invBefore = (await probe(page)).investigation;
    await pressE(page, id);
    const p = await probe(page);
    note('investigation_attempt', { id, promptText: p.promptText, activeKeys: p.activeKeys, investigation: p.investigation, invBefore });
    await shot(page, `20-invest-${id}`);
    // Try to drive any investigation UI: arrows to choose hypothesis, E to act.
    for (let k = 0; k < 5; k++) {
      await page.keyboard.press(k % 2 ? 'ArrowRight' : 'ArrowLeft');
      await page.waitForTimeout(200);
      await page.keyboard.press('e');
      await page.waitForTimeout(400);
      await shot(page, `21-invest-${id}-step${k}`);
    }
    note('investigation_after', { id, investigation: (await probe(page)).investigation });
  }

  // 5) Open notebook to see what the player actually recorded.
  await page.keyboard.press('n'); await page.waitForTimeout(800); await shot(page, '30-notebook');

  note('errors', { errors: errors.slice(0, 20) });
  fs.writeFileSync(`${SHOT}/reconcile.json`, JSON.stringify(steps, null, 2));
  console.log('RECONCILE_DONE zones=' + Object.keys(byId).length);
  expect(Boolean(w0)).toBeTruthy();
});
