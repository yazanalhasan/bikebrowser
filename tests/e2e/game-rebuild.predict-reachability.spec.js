import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY acceptance for predict-before-test (Phase 1.9.2; updated
// 2026-07-06 for the R3F UTM lab). The action under test — predicting and
// testing — is performed through the real lab UI (mouse + keyboard, no
// window.__GAME__.predictMaterial / testMaterial). State reads are observation
// only (a real player "sees" the same state on screen).
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
  const ARRIVE = 56;
  for (let guard = 0; guard < 90; guard += 1) {
    const pos = await playerPosition(page);
    if (await activeInteraction(page) === id) return;
    const dx = x - pos.x, dy = y - pos.y;
    if (Math.hypot(dx, dy) < ARRIVE) return;
    if (Math.abs(dx) > 20) await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(240, Math.max(60, Math.abs(dx) * 1.8)));
    if (Math.abs(dy) > 20) await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(240, Math.max(60, Math.abs(dy) * 1.8)));
  }
}
async function clearOverlays(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => {
    const g = window.__bikebrowserRebuildGame;
    return !g.registry.get('modalActive') && !g.registry.get('dialogueActive');
  }, null, { timeout: 4000 }).catch(() => {});
}

const utmOverlayOpen = () =>
  document.querySelector('.bb-utm-overlay')?.getAttribute('aria-label') === 'Universal Testing Machine';

test.describe('Player reachability — predict-before-test', () => {
  test('a real player predicts (via the lab UI) before the UTM tests — no debug API for the action', async ({ page }) => {
    test.setTimeout(180_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);
    // Setup only (not the action under test): clean slate.
    await page.evaluate(() => window.__GAME__.resetAct1());

    // Collect ALL eight catalog samples by real input — one per visit after the
    // de-pad — closing the trade dialogue between picks.
    const mats = await zoneById(page, 'materials_table');
    await walkTo(page, { ...mats });
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(220);
      await clearOverlays(page);
    }

    // Walk to the UTM and press E — this opens the R3F UTM lab.
    const utm = await zoneById(page, 'utm');
    await walkTo(page, { ...utm });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(utmOverlayOpen, null, { timeout: 10_000 });
    // Suspense: the overlay chrome mounts before the lazy lab body.
    await page.locator('.utm-chip').first().waitFor({ timeout: 20_000 });
    await page.screenshot({ path: `${captureDir}/01_predict_choose.png`, fullPage: true });

    const chips = page.locator('.utm-chip');
    const total = await chips.count();
    expect(total).toBeGreaterThanOrEqual(4);

    // Predict + test four samples with REAL input. The run button must stay
    // LOCKED until the player predicts — the visible gate.
    for (let i = 0; i < 4; i += 1) {
      await chips.nth(i).click();
      expect(await page.locator('.utm-btn--run').isDisabled(), 'testing locked before predicting').toBe(true);
      await page.locator('.pb__opt').first().click();
      await page.locator('.utm-btn--run').click();
      await page.locator('.utm-btn--ghost', { hasText: 'Reset' }).first().waitFor({ timeout: 20_000 });
      if (i === 0) await page.screenshot({ path: `${captureDir}/02_predict_result.png`, fullPage: true });
    }
    await page.screenshot({ path: `${captureDir}/03_predict_summary.png`, fullPage: true });

    // Exit flow: Escape closes the lab — the player is never trapped.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.bb-utm-overlay'));

    // Observation only: prediction preceded every test (arc.md), in REAL
    // runtime state — the ledger, not component state.
    const state = await page.evaluate(() => {
      const s = window.__GAME__.getAct1State();
      return { tested: s.materialTests.tested.length, made: s.prediction.made };
    });
    expect(state.tested).toBeGreaterThanOrEqual(4);
    expect(state.made).toBeGreaterThanOrEqual(state.tested); // a prediction for every test
  });

  test('Escape always exits the UTM lab — the player is never trapped', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    // Setup: open the lab from the world (the ACTION under test is the exit).
    await page.evaluate(() => window.__GAME__.resetAct1());
    const utm = await zoneById(page, 'utm');
    await walkTo(page, { ...utm });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(utmOverlayOpen, null, { timeout: 10_000 });
    await page.keyboard.press('Escape'); // real input
    await page.waitForFunction(() => !document.querySelector('.bb-utm-overlay'));
    // The world is interactive again (modal released).
    const modal = await page.evaluate(() => Boolean(window.__bikebrowserRebuildGame.registry.get('modalActive')));
    expect(modal).toBe(false);
  });
});
