import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY acceptance for the Investigation UI (Phase 1.9.4).
// The action under test — running the washout investigation — is performed with
// REAL keyboard only (walk to the marker, press E, choose a hypothesis, gather
// evidence, conclude). No debug API drives the investigation itself.
const captureDir = 'playtest_captures/game_rebuild_investigation_reachability';

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
  await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(40);
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
  for (let guard = 0; guard < 240; guard += 1) {
    const pos = await playerPosition(page);
    if (await activeInteraction(page) === id) return;
    const dx = x - pos.x, dy = y - pos.y;
    if (Math.hypot(dx, dy) < ARRIVE) return;
    if (Math.abs(dx) > STEP) await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(220, Math.max(45, Math.abs(dx) * 2.0)));
    if (Math.abs(dy) > STEP) await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(220, Math.max(45, Math.abs(dy) * 2.0)));
  }
  throw new Error(`Could not walk to ${id}`);
}

test.describe('Player reachability — investigation', () => {
  test('a real player investigates the washout (keyboard); a misleading guess is disproved by evidence', async ({ page }) => {
    test.setTimeout(60_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);

    // Walk to the washout mystery marker and press E to open the investigation.
    const zone = await zoneById(page, 'investigate_wash');
    expect(zone).toBeTruthy();
    await walkTo(page, { ...zone });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__INVESTIGATION__ && window.__INVESTIGATION__.active === true, null, { timeout: 10_000 });

    // Observe -> move to weighing hypotheses.
    await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'observe');
    await page.screenshot({ path: `${captureDir}/01_observe.png`, fullPage: true });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'hypothesis');

    // Deliberately pick the MISLEADING hypothesis (weak_materials) so the
    // evidence has to correct us — the whole point of the loop.
    for (let g = 0; g < 4; g += 1) {
      const cur = await page.evaluate(() => window.__INVESTIGATION__.hypothesisId);
      if (cur === 'weak_materials') break;
      await page.keyboard.press('ArrowDown');
    }
    expect(await page.evaluate(() => window.__INVESTIGATION__.hypothesisId)).toBe('weak_materials');
    await page.screenshot({ path: `${captureDir}/02_hypothesis.png`, fullPage: true });
    await page.keyboard.press('KeyE');

    // Evidence: reveal every clue. The chosen guess should be contradicted.
    await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'evidence');
    for (let g = 0; g < 6; g += 1) {
      const s = await page.evaluate(() => window.__INVESTIGATION__);
      if (s.evidenceShown >= s.evidenceCount) break;
      await page.keyboard.press('KeyE');
    }
    await page.screenshot({ path: `${captureDir}/03_evidence.png`, fullPage: true });
    expect(await page.evaluate(() => window.__INVESTIGATION__.disprovesHypothesis)).toBe(true);

    // Conclude -> the evidence corrected the misleading guess.
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'conclusion');
    const concl = await page.evaluate(() => window.__INVESTIGATION__);
    expect(concl.correctedFromMisleading).toBe(true);
    expect(concl.conclusionText).toContain('scoured');
    await page.screenshot({ path: `${captureDir}/04_conclusion.png`, fullPage: true });

    // Summary -> close. Never trapped.
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'summary');
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__INVESTIGATION__.active === false);

    // Observation only: the engine state recorded a concluded, corrected mystery.
    const state = await page.evaluate(() => {
      const inv = window.__GAME__.getAct1State().investigation.investigations.find((i) => i.id === 'wash_out_cause');
      return { concluded: inv?.concluded, corrected: inv?.updatedFromMisleading, notebook: window.__GAME__.getAct1State().notebook };
    });
    expect(state.concluded).toBe(true);
    expect(state.corrected).toBe(true);
  });

  test('Escape exits the investigation overlay — never trapped', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    await page.evaluate(() => {
      window.__GAME__.resetAct1();
      window.__bikebrowserRebuildGame.registry.events.emit('investigation:start', 'wash_out_cause');
    });
    await page.waitForFunction(() => window.__INVESTIGATION__ && window.__INVESTIGATION__.active === true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__INVESTIGATION__.active === false);
    expect(await page.evaluate(() => Boolean(window.__bikebrowserRebuildGame.registry.get('modalActive')))).toBe(false);
  });
});
