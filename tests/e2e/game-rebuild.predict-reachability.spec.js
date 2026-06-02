import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY acceptance for the Prediction UI (Phase 1.9.2).
// The action under test — predicting and testing — is performed with REAL
// keyboard only (no window.__GAME__.predictMaterial / testMaterial). State reads
// are observation only (a real player "sees" the same state on screen).
const captureDir = 'playtest_captures/game_rebuild_predict_reachability';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
async function playerPosition(page) {
  return page.evaluate(() => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return { x: s.player.x, y: s.player.y };
  });
}
async function hold(page, key, ms = 140) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(40);
}
async function activeInteraction(page) {
  return page.evaluate(() => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return s.interactions.nearest(s.player)?.id || null;
  });
}
async function zoneById(page, id) {
  return page.evaluate((zid) => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    const z = s.interactions.zones.find((c) => c.id === zid || c.action === zid);
    return z ? { id: z.id, x: z.x, y: z.y } : null;
  }, id);
}
async function walkTo(page, target) {
  const { x, y, id } = target;
  const ARRIVE = 24, STEP = 6;
  for (let guard = 0; guard < 200; guard += 1) {
    const pos = await playerPosition(page);
    if (await activeInteraction(page) === id) return;
    const dx = x - pos.x, dy = y - pos.y;
    if (Math.hypot(dx, dy) < ARRIVE) return;
    if (Math.abs(dx) > STEP) await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(220, Math.max(45, Math.abs(dx) * 2.0)));
    if (Math.abs(dy) > STEP) await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(220, Math.max(45, Math.abs(dy) * 2.0)));
  }
  throw new Error(`Could not walk to ${id}`);
}
async function walkPressE(page, id) {
  const target = await zoneById(page, id);
  expect(target, `zone ${id} exists`).toBeTruthy();
  await walkTo(page, { ...target });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(220);
}

test.describe('Player reachability — predict-before-test', () => {
  test('a real player predicts (keyboard) before the UTM tests — no debug API for the action', async ({ page }) => {
    test.setTimeout(90_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);
    // Setup only (not the action under test): clean slate.
    await page.evaluate(() => window.__GAME__.resetAct1());

    // Collect materials by walking + pressing E (real player input).
    await walkPressE(page, 'materials_table'); // steel / copper_brace / weak_scrap
    await walkPressE(page, 'ecology_patch');   // mesquite (+ ecology)

    // Walk to the UTM and press E — this opens the prediction overlay (gating).
    const utm = await zoneById(page, 'utm');
    await walkTo(page, { ...utm });
    await page.keyboard.press('KeyE');

    // The prediction overlay must open from a real key press.
    await page.waitForFunction(() => window.__PREDICTION__ && window.__PREDICTION__.active === true, null, { timeout: 10_000 });
    await page.waitForFunction(() => window.__PREDICTION__.phase === 'choose');
    await page.screenshot({ path: `${captureDir}/01_predict_choose.png`, fullPage: true });

    const total = await page.evaluate(() => window.__PREDICTION__.total);
    expect(total).toBeGreaterThanOrEqual(4);

    // Predict + test every material with REAL keys: pick HOLD, set sure, test.
    for (let i = 0; i < total; i += 1) {
      await page.waitForFunction(() => window.__PREDICTION__.phase === 'choose');
      await page.keyboard.press('ArrowLeft'); // WILL HOLD
      await page.keyboard.press('ArrowUp');   // more sure
      await page.keyboard.press('KeyE');       // test
      await page.waitForFunction(() => window.__PREDICTION__.phase === 'result'); // test ran via UI
      if (i === 0) await page.screenshot({ path: `${captureDir}/02_predict_result.png`, fullPage: true });
      await page.keyboard.press('KeyE');       // next / finish
      await page.waitForTimeout(120);
    }

    // Overlay closes after the player finishes.
    await page.waitForFunction(() => window.__PREDICTION__.active === false);

    // Observation only: prediction preceded every test (arc.md), via the UI.
    const state = await page.evaluate(() => {
      const s = window.__GAME__.getAct1State();
      return { tested: s.materialTests.tested.length, made: s.prediction.made };
    });
    expect(state.tested).toBeGreaterThanOrEqual(4);
    expect(state.made).toBeGreaterThanOrEqual(state.tested); // a prediction for every test
  });
});
