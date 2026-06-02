// phase1-utm-predict.spec.js — play the NEW predict-before-test (1.9.2) loop
// the correct way: collect, open the UTM, and for each material actually pick
// HOLD/BREAK + confidence + E to test. Judges termination, blank-screen, notebook.
import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase1_r2';
test.setTimeout(150000);
const log = [];

async function world(page) {
  return page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player);
    if (!s) return null;
    return {
      player: { x: Math.round(s.player.x), y: Math.round(s.player.y) },
      zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y })),
    };
  });
}
// Read prediction modal state + whether the world scene is visibly active.
async function modal(page) {
  return page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const scenes = g?.scene?.scenes || [];
    const pred = scenes.find((x) => /predict/i.test(x.scene?.key || ''));
    const predActive = Boolean(pred && pred.scene.isActive());
    let question = null;
    if (predActive) {
      const texts = [];
      pred.children?.list?.forEach((c) => { if (c.type === 'Text' && c.text) texts.push(c.text); });
      question = texts.join(' | ');
    }
    const neighborhood = scenes.find((x) => x.interactions?.zones?.length && x.player);
    const worldActive = Boolean(neighborhood && neighborhood.scene.isActive() && neighborhood.scene.isVisible());
    const activeKeys = scenes.filter((x) => x.scene?.isActive?.()).map((x) => x.scene.key);
    return { predActive, question, worldActive, activeKeys };
  });
}
async function walkTo(page, t, maxSteps = 45) {
  for (let i = 0; i < maxSteps; i++) {
    const w = await world(page); if (!w) return false;
    const dx = t.x - w.player.x, dy = t.y - w.player.y;
    if (Math.hypot(dx, dy) < 52) return true;
    const ks = [];
    if (Math.abs(dx) > 22) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    if (Math.abs(dy) > 22) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    for (const k of ks) await page.keyboard.down(k);
    await page.waitForTimeout(130);
    for (const k of ks) await page.keyboard.up(k);
  }
  return false;
}

test('UTM predict-before-test loop — played correctly', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/game-rebuild', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  await page.waitForFunction(() => {
    const g = window.__bikebrowserRebuildGame;
    return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player));
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});

  const w0 = await world(page);
  const byId = Object.fromEntries(w0.zones.map((z) => [z.id, z]));

  // Collect materials first (gating), then open the UTM.
  if (byId.materials_table) { await walkTo(page, byId.materials_table); await page.keyboard.press('e'); await page.waitForTimeout(600); await page.keyboard.press('e'); await page.waitForTimeout(300); }
  await walkTo(page, byId.utm);
  await page.keyboard.press('e');
  await page.waitForTimeout(800);

  // Now drive the prediction modal correctly, one material at a time.
  let iter = 0;
  const seen = [];
  while (iter < 10) {
    const m = await modal(page);
    if (!m.predActive) { log.push({ note: 'modal_closed', iter, m }); break; }
    seen.push(m.question);
    await page.screenshot({ path: `${SHOT}/A${10 + iter}-predict.png` });
    // Alternate a sensible answer; set confidence up; then test.
    await page.keyboard.press(iter % 3 === 1 ? 'ArrowRight' : 'ArrowLeft'); // pick BREAK sometimes, HOLD otherwise
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); // more sure
    await page.waitForTimeout(150);
    await page.keyboard.press('e'); // test
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOT}/A${10 + iter}b-result.png` });
    iter++;
  }
  log.push({ step: 'loop_done', iterations: iter, questionsSeen: seen });

  // After the loop: is the world visible (no blank screen)? what state?
  await page.waitForTimeout(600);
  const post = await modal(page);
  await page.screenshot({ path: `${SHOT}/A30-after-loop.png` });
  const blank = await page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const any = (g?.scene?.scenes || []).some((x) => x.scene?.isActive?.() && x.scene?.isVisible?.());
    return !any;
  });
  const detail = await page.evaluate(() => {
    try {
      const nb = window.__GAME__.getNotebookState();
      const mt = window.__GAME__.getMaterialTestState?.() || {};
      return { notebookCategories: nb.categories, unlocked: nb.unlocked, tested: (mt.tested || []).map((t) => t.materialId) };
    } catch (e) { return { err: String(e) }; }
  });
  log.push({ step: 'post', post, blankScreen: blank, detail, errors: errors.slice(0, 20) });

  fs.writeFileSync(`${SHOT}/utm_predict.json`, JSON.stringify(log, null, 2));
  console.log('UTM_PREDICT_DONE iter=' + iter + ' blank=' + blank);
  expect(w0.zones.length).toBeGreaterThan(0);
});
