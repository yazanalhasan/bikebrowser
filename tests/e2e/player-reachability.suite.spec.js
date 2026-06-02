// player-reachability.suite.spec.js
// ============================================================================
// PLAYER-REACHABILITY REGRESSION SUITE (the "right tab" detector).
//
// Encodes the QA-audit findings as automatic assertions, driven by REAL player
// input (Home click + keyboard walking), NOT window.__GAME__ logic calls.
// Companion exploratory specs (phase1-*.spec.js) capture screenshots/state;
// THIS file is the pass/fail line.
//
// Convention:
//   - Plain test(...)      => a capability that must stay reachable (guards
//                            against regressions like the orphaned build).
//   - test.fail(...)       => a KNOWN GAP (worklist). It runs and is expected
//                            to FAIL today, so the suite stays green. When the
//                            "left tab" fixes it, Playwright reports it as an
//                            UNEXPECTED PASS — your signal to delete the
//                            `test.fail()` marker and lock the fix in.
//   - test.fixme(...)      => a gap we can't assert crisply yet (e.g. "feels
//                            satisfying"); tracked, not executed.
//
// Findings covered: orphaned build · non-reachable systems (bridge 1.6,
// investigation 1.8) · UTM input trap / no exit · shadowed interaction zone ·
// missing payoff loop.
// ============================================================================
import { test, expect } from 'playwright/test';

const REBUILD = '/game-rebuild';

async function bootRebuild(page) {
  await page.goto(REBUILD, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame),
    null,
    { timeout: 20000 },
  );
  await page.waitForFunction(() => {
    const g = window.__bikebrowserRebuildGame;
    return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player));
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});
}
function readWorld(page) {
  return page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player);
    if (!s) return null;
    return {
      player: { x: Math.round(s.player.x), y: Math.round(s.player.y) },
      zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y, label: z.label })),
    };
  });
}
function predictionModalOpen(page) {
  // The PredictionScene is a PERSISTENT overlay (it shows/hides a panel rather
  // than stopping), so scene.isActive() is always true. The real "modal up /
  // player trapped" signal is the visible panel — window.__PREDICTION__.active
  // (panel.visible) or the modalActive registry flag set in _finish().
  return page.evaluate(() => {
    if (window.__PREDICTION__ && typeof window.__PREDICTION__.active === 'boolean') return window.__PREDICTION__.active;
    const g = window.__bikebrowserRebuildGame;
    const s = g?.scene?.scenes?.find((x) => /predict/i.test(x.scene?.key || ''));
    return Boolean(s?.registry?.get?.('modalActive'));
  });
}
async function walkTo(page, t, maxSteps = 80) {
  if (!t) return false;
  let last = null;
  let stuck = 0;
  for (let i = 0; i < maxSteps; i++) {
    const w = await readWorld(page);
    if (!w) return false;
    const dx = t.x - w.player.x;
    const dy = t.y - w.player.y;
    if (Math.hypot(dx, dy) < 50) return true;
    if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 4) stuck += 1; else stuck = 0;
    last = w.player;
    const ks = [];
    if (stuck >= 4) {
      // Hard stuck: cycle a single direction to slide off the obstacle.
      ks.push(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4]);
    } else if (stuck >= 2) {
      // Soft stuck: commit to the smaller axis to round a corner.
      ks.push(Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp'));
    } else {
      if (Math.abs(dx) > 22) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      if (Math.abs(dy) > 22) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
    for (const k of ks) await page.keyboard.down(k);
    await page.waitForTimeout(130);
    for (const k of ks) await page.keyboard.up(k);
  }
  const w = await readWorld(page);
  return w ? Math.hypot(t.x - w.player.x, t.y - w.player.y) < 70 : false;
}
function bridgeDesignOpen(page) {
  // The player-facing bridge DESIGN modal (choose materials). Real signal is the
  // visible panel — window.__BRIDGE_DESIGN__.active — not the shared modalActive.
  return page.evaluate(() => {
    if (window.__BRIDGE_DESIGN__ && typeof window.__BRIDGE_DESIGN__.active === 'boolean') return window.__BRIDGE_DESIGN__.active;
    const g = window.__bikebrowserRebuildGame;
    const s = g?.scene?.scenes?.find((x) => /bridge.*design/i.test(x.scene?.key || ''));
    return Boolean(s?.panel?.visible);
  });
}
async function zoneById(page, id) {
  const w = await readWorld(page);
  return (w?.zones || []).find((z) => z.id === id) || null;
}

test.describe('player reachability', () => {
  test.describe.configure({ timeout: 120000 });

  // ---- GUARDS: must stay reachable (regression protection) ----

  test('GUARD: Home "Play" reaches the Phase 1 build (not orphaned)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const card = page.getByText(/Play BikeBrowser|Act 1/i).last();
    await expect(card, 'Home should expose a Play card for the Act-1 build').toHaveCount(1, { timeout: 8000 }).catch(async () => {
      // count may be >1; just require it exists
      expect(await card.count()).toBeGreaterThan(0);
    });
    await card.click({ timeout: 5000 });
    await page.waitForURL(/\/game-rebuild/, { timeout: 8000 });
    await page.waitForFunction(() => Boolean(window.__GAME__), null, { timeout: 20000 });
    expect(page.url()).toContain('/game-rebuild');
  });

  test('GUARD: UTM exposes a predict-before-test choice to the player', async ({ page }) => {
    await bootRebuild(page);
    const mats = await zoneById(page, 'materials_table');
    if (mats) { await walkTo(page, mats); await page.keyboard.press('e'); await page.waitForTimeout(500); await page.keyboard.press('e'); await page.waitForTimeout(300); }
    const utm = await zoneById(page, 'utm');
    expect(utm, 'a UTM interaction zone exists').toBeTruthy();
    await walkTo(page, utm);
    await page.keyboard.press('e');
    await page.waitForTimeout(900);
    expect(await predictionModalOpen(page), 'pressing E at the UTM opens the prediction (HOLD/BREAK) modal').toBe(true);
  });

  // ---- WORKLIST: known gaps. Expected to FAIL until fixed. ----

  test.fail('WORKLIST: no two interaction zones are geometrically shadowed', async ({ page }) => {
    // spanish_neighbor sits at the exact coords of neighbor -> nearest() can
    // never return it, so "Thank Mrs. Ramirez" is unreachable.
    await bootRebuild(page);
    const w = await readWorld(page);
    const dupes = [];
    const zones = w.zones;
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const d = Math.hypot(zones[i].x - zones[j].x, zones[i].y - zones[j].y);
        if (d < 8) dupes.push(`${zones[i].id} ~= ${zones[j].id} (${Math.round(d)}px)`);
      }
    }
    expect(dupes, `overlapping zones shadow each other: ${dupes.join('; ')}`).toEqual([]);
  });

  // PROMOTED 2026-06-02: was WORKLIST (test.fail); fixed by 1.9.2A-C (Escape
  // exit + summary + visible beam). Now a GUARD — must stay exitable.
  test('GUARD: UTM predict-test loop can be exited (not an input trap)', async ({ page }) => {
    await bootRebuild(page);
    const mats = await zoneById(page, 'materials_table');
    if (mats) { await walkTo(page, mats); await page.keyboard.press('e'); await page.waitForTimeout(500); await page.keyboard.press('e'); await page.waitForTimeout(300); }
    await walkTo(page, await zoneById(page, 'utm'));
    await page.keyboard.press('e');
    await page.waitForTimeout(700);
    expect(await predictionModalOpen(page), 'UTM modal opened').toBe(true);
    // The player must be able to BAIL OUT (the anti-trap guarantee). Try Esc,
    // then fall back to playing through + Esc.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    if (await predictionModalOpen(page)) {
      for (let i = 0; i < 6 && (await predictionModalOpen(page)); i++) {
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('e');
        await page.waitForTimeout(400);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    expect(await predictionModalOpen(page), 'player can exit the UTM (Esc or play-through), regaining control').toBe(false);
  });

  test.fail('WORKLIST: bridge design opens a player-facing choice (not pre-baked)', async ({ page }) => {
    // bridge_plan currently calls completeBridgePlan('tested_triangle_plan') —
    // the player never chooses. A BridgeDesignScene exists (1.9.3 in progress)
    // but is not yet wired to the world interaction. STRICT: require the player
    // to reach the spot AND the design modal to actually open. (Not the plan id,
    // which is null-satisfiable when the interaction is missed.)
    await bootRebuild(page);
    const bp = await zoneById(page, 'bridge_plan');
    expect(bp, 'a bridge-plan interaction exists').toBeTruthy();
    const reached = await walkTo(page, bp);
    expect(reached, 'player can walk to the bridge-plan spot').toBe(true);
    await page.keyboard.press('e');
    await page.waitForTimeout(800);
    expect(await bridgeDesignOpen(page), 'interacting opens the player-facing bridge DESIGN modal (choose materials)').toBe(true);
  });

  test.fail('WORKLIST: Dry Wash investigation is reachable through play', async ({ page }) => {
    // The dry_wash interaction only maps the area; observe/hypothesize/conclude
    // never run from the world. STRICT: require the player to reach the wash AND
    // a real per-mystery progress flag (observed/hypothesisId/concluded) to flip
    // — booleans that are false until a player actually investigates.
    await bootRebuild(page);
    const dw = await zoneById(page, 'dry_wash');
    expect(dw, 'a dry-wash interaction exists').toBeTruthy();
    const reached = await walkTo(page, dw);
    expect(reached, 'player can walk to the dry wash').toBe(true);
    await page.keyboard.press('e');
    await page.waitForTimeout(800);
    const started = await page.evaluate(() => {
      try {
        const inv = window.__GAME__.getAct1State().investigation;
        return Array.isArray(inv?.investigations)
          && inv.investigations.some((i) => i.observed || i.hypothesisId || i.concluded);
      } catch { return false; }
    });
    expect(started, 'interacting with the wash starts the investigation loop (observe/hypothesize/conclude) for the player').toBe(true);
  });

  // ---- TRACKED, not yet crisply assertable ----

  test.fixme('PAYOFF: pressing "test" shows a visible load test (press/bend/snap), not just text', async () => {
    // The verdict + tactile-cue data exists in materialTests; the player never
    // SEES the test happen. Add an assertion once a test-result visual/animation
    // element is rendered (e.g. a result card testid or a deformation sprite).
  });
});
