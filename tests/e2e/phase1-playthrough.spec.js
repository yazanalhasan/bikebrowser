// phase1-playthrough.spec.js — TEMPORARY QA playthrough of the Phase 1 build
// at /game-rebuild. Two layers:
//   (A) Real-UI play via keyboard/mouse — captures what a player SEES/DOES.
//   (B) Drive each educational system via window.__GAME__ — captures the
//       feedback text + state each Phase-1 flow produces.
// Outputs screenshots + phase1_playthrough.json to the EB qa_audit folder.

import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase1';
fs.mkdirSync(SHOT, { recursive: true });

test.setTimeout(180000);

const transcript = [];
const rec = (label, data) => { transcript.push({ label, data }); };

async function shot(page, name) {
  await page.screenshot({ path: `${SHOT}/${name}.png` });
}
async function call(page, method, ...args) {
  return page.evaluate(({ m, a }) => {
    try {
      const fn = window.__GAME__?.[m];
      if (!fn) return { __missing: m };
      const r = fn(...a);
      return JSON.parse(JSON.stringify(r ?? null));
    } catch (e) { return { __error: String(e) }; }
  }, { m: method, a: args });
}
async function lastFeedback(page) {
  return page.evaluate(() => {
    try {
      const f = window.__GAME__?.getFeedbackState?.();
      return f?.last ? { kind: f.last.kind, message: f.last.message } : null;
    } catch { return null; }
  });
}

test('Phase 1 playthrough — experience capture', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  // ---- BOOT ----
  await page.goto('/game-rebuild', { waitUntil: 'domcontentloaded' });
  for (const name of ['Start Adventure!', 'Continue Adventure', 'Start', 'Play', 'Tap to Start', 'Start Game']) {
    try { await page.getByRole('button', { name }).first().click({ timeout: 1200 }); break; } catch {}
  }
  await page.waitForFunction(() => Boolean(window.__GAME__), null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  await shot(page, '10-boot');
  rec('boot.act1State', await call(page, 'getAct1State'));

  // ---- (A) REAL UI PLAY (keyboard / mouse) ----
  // focus the game surface
  try { await page.locator('canvas').first().click({ timeout: 2000, position: { x: 200, y: 200 } }); }
  catch { await page.mouse.click(400, 300); }

  // Open GPS (G), notebook (N), quiet (M) — capture what a kid sees.
  for (const [key, name] of [['g', '11-gps'], ['n', '12-notebook'], ['n', '13-notebook-close']]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(900);
    await shot(page, name);
  }

  // Explore: move in each direction and press E/Space to interact.
  const moves = [['ArrowUp', '14-move-up'], ['ArrowRight', '15-move-right'], ['ArrowDown', '16-move-down'], ['ArrowLeft', '17-move-left']];
  for (const [key, name] of moves) {
    await page.keyboard.down(key); await page.waitForTimeout(700); await page.keyboard.up(key);
    await page.keyboard.press('e'); await page.waitForTimeout(500);
    await shot(page, name);
  }
  // Walk up toward the NPC row and try to interact several times.
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowUp');
  for (let i = 0; i < 3; i++) { await page.keyboard.press('e'); await page.waitForTimeout(500); await page.keyboard.press(' '); await page.waitForTimeout(500); }
  await shot(page, '18-interact-npc');
  rec('afterUIPlay.feedback', await lastFeedback(page));
  rec('afterUIPlay.quests', await call(page, 'getQuestState'));

  // ---- (B) DRIVE EACH EDUCATIONAL FLOW via __GAME__ ----

  // ECOLOGY
  const eco = {};
  for (const sp of ['mesquite', 'creosote', 'saguaro', 'wash_marker']) {
    eco[sp] = await call(page, 'observeEcology', sp);
    eco[sp + '_fb'] = await lastFeedback(page);
  }
  rec('ecology', eco);
  await page.waitForTimeout(400); await shot(page, '20-ecology');

  // PREDICTION + REASONING (predict BEFORE test so it resolves)
  const pred = {};
  pred.predict_steel = await call(page, 'predictMaterial', 'steel', true, 'high', 'Steel is metal so it should be very strong.');
  pred.predict_steel_fb = await lastFeedback(page);
  pred.predict_scrap = await call(page, 'predictMaterial', 'weak_scrap', true, 'low', 'Not sure, guessing it holds.');
  pred.predict_scrap_fb = await lastFeedback(page);
  rec('prediction', pred);
  await shot(page, '21-prediction');

  // UTM material tests (resolves predictions made above)
  const utm = {};
  for (const m of ['steel', 'weak_scrap', 'mesquite', 'copper_brace']) {
    utm[m] = await call(page, 'testMaterial', m);
    utm[m + '_fb'] = await lastFeedback(page);
  }
  rec('utm', utm);
  await shot(page, '22-utm');

  // BRIDGE (Phase 1.6 choice -> consequence): weak design fails, safe succeeds
  const bridge = {};
  bridge.design_weak = await call(page, 'designBridge', { deck: 'weak_scrap', support: 'steel', brace: 'copper_brace' });
  bridge.design_weak_fb = await lastFeedback(page);
  bridge.design_safe = await call(page, 'designBridge', { deck: 'steel', support: 'steel', brace: 'copper_brace' });
  bridge.design_safe_fb = await lastFeedback(page);
  bridge.repair = await call(page, 'repairBridge');
  bridge.repair_fb = await lastFeedback(page);
  rec('bridge', bridge);
  await shot(page, '23-bridge');

  // DRY WASH investigation (observe -> hypothesize misleading -> investigate -> conclude)
  const inv = {};
  for (const [mid, mis] of [['wash_out_cause', 'weak_materials'], ['green_strip', 'recent_rain']]) {
    inv[mid + '_observe'] = await call(page, 'observeMystery', mid);
    inv[mid + '_observe_fb'] = await lastFeedback(page);
    inv[mid + '_hypothesize'] = await call(page, 'hypothesizeMystery', mid, mis);
    inv[mid + '_hypothesize_fb'] = await lastFeedback(page);
    inv[mid + '_investigate'] = await call(page, 'investigateMystery', mid);
    inv[mid + '_investigate_fb'] = await lastFeedback(page);
    inv[mid + '_investigate2'] = await call(page, 'investigateMystery', mid);
    inv[mid + '_conclude'] = await call(page, 'concludeMystery', mid);
    inv[mid + '_conclude_fb'] = await lastFeedback(page);
  }
  rec('investigation', inv);
  await shot(page, '24-drywash');

  // REASONING grade + wider map (Act 1 completion)
  rec('reasoning', await call(page, 'assessReasoning'));
  rec('unlockWiderMap', await call(page, 'unlockWiderMap'));
  rec('unlockWiderMap_fb', await lastFeedback(page));

  // NOTEBOOK final state + UI
  rec('notebook.final', await call(page, 'getNotebookState'));
  await page.keyboard.press('n'); await page.waitForTimeout(900); await shot(page, '25-notebook-final');

  // FINAL full state
  const finalState = await call(page, 'getAct1State');
  rec('final.act1State', finalState);
  await page.keyboard.press('n'); await page.waitForTimeout(400);
  await shot(page, '26-final');

  rec('runtimeErrors', errors.slice(0, 50));
  fs.writeFileSync(`${SHOT}/phase1_playthrough.json`, JSON.stringify(transcript, null, 2));
  console.log('TRANSCRIPT_BYTES', fs.statSync(`${SHOT}/phase1_playthrough.json`).size);
  expect(Boolean(finalState)).toBeTruthy();
});
