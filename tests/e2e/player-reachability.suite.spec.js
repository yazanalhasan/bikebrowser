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
function investigationOpen(page) {
  return page.evaluate(() => Boolean(window.__INVESTIGATION__ && window.__INVESTIGATION__.active === true));
}
// Collect at a zone by real input: press E (triggers the pickup + opens its
// dialogue), then E again to clear the line. Dialogue is not modal, so the
// player keeps control either way.
async function collectAt(page, id) {
  const z = await zoneById(page, id);
  expect(z, `${id} zone exists`).toBeTruthy();
  await walkTo(page, z);
  await page.keyboard.press('e');
  await page.waitForTimeout(400);
  await page.keyboard.press('e');
  await page.waitForTimeout(250);
}
// Drive the prediction overlay (already opened by the caller pressing E at the
// UTM) to completion so every queued material is genuinely predicted + tested,
// then it closes. E advances every phase (choose->test, result->next, summary->close).
async function drivePredictionToCompletion(page) {
  await page.waitForFunction(() => window.__PREDICTION__ && window.__PREDICTION__.active === true, null, { timeout: 8000 });
  for (let i = 0; i < 40; i++) {
    if (!(await page.evaluate(() => window.__PREDICTION__.active))) break;
    await page.keyboard.press('e');
    await page.waitForTimeout(240);
  }
  await page.waitForFunction(() => window.__PREDICTION__.active === false, null, { timeout: 8000 });
}
// In the bridge design overlay, cycle the candidate to `materialId` and commit it.
async function pickBridgeMaterial(page, materialId) {
  await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
  for (let g = 0; g < 10; g++) {
    if ((await page.evaluate(() => window.__BRIDGE_DESIGN__.candidateId)) === materialId) break;
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('e');
  await page.waitForTimeout(120);
}
// Drive the investigation overlay by keyboard: observe -> pick the MISLEADING
// hypothesis -> reveal every clue -> conclude -> summary -> close.
async function driveInvestigation(page) {
  await page.waitForFunction(() => window.__INVESTIGATION__ && window.__INVESTIGATION__.active === true, null, { timeout: 8000 });
  await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'observe');
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'hypothesis');
  for (let g = 0; g < 4; g++) {
    if ((await page.evaluate(() => window.__INVESTIGATION__.hypothesisId)) === 'weak_materials') break;
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'evidence');
  for (let g = 0; g < 6; g++) {
    const s = await page.evaluate(() => window.__INVESTIGATION__);
    if (s.evidenceShown >= s.evidenceCount) break;
    await page.keyboard.press('e');
    await page.waitForTimeout(160);
  }
  await page.keyboard.press('e'); // -> conclusion
  await page.waitForFunction(() => window.__INVESTIGATION__.phase === 'conclusion');
  await page.keyboard.press('e'); // -> summary
  await page.waitForTimeout(150);
  await page.keyboard.press('e'); // -> close
  await page.waitForFunction(() => window.__INVESTIGATION__.active === false);
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

  // PROMOTED 2026-06-02: was WORKLIST (test.fail); fixed by collapsing the two
  // stacked Mrs. Ramirez zones into one progression-aware `neighbor` zone. Now a
  // GUARD: no zone is geometrically shadowed, AND the thank-you beat is reachable.
  test('GUARD: no shadowed zones, and Mrs. Ramirez\'s thank-you beat is reachable', async ({ page }) => {
    test.setTimeout(90000);
    await bootRebuild(page);
    // (1) Geometry: no two interaction zones overlap. The old `spanish_neighbor`
    // zone sat at 0px from `neighbor`, so nearest() could never return it.
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

    // (2) Reachable through play: the single neighbor zone yields the wash intro
    // first (completes talk_neighbor), then the Spanish thank-you (completes
    // spanish_neighbor + trust/language). Drive it by keyboard only.
    const nb = await zoneById(page, 'neighbor');
    expect(nb, 'a Mrs. Ramirez interaction exists').toBeTruthy();
    await walkTo(page, nb);
    const done = (obj) => page.evaluate((o) => {
      try { return window.__GAME__.getAct1State().quests.completedObjectives.includes(o); } catch { return false; }
    }, obj);
    await page.keyboard.press('e'); // open the wash intro
    await page.waitForTimeout(200);
    // Mash the advance key: closes the intro (-> talk_neighbor); the next
    // re-trigger opens the thank-you, which closes (-> spanish_neighbor).
    for (let i = 0; i < 18 && !(await done('spanish_neighbor')); i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(150);
    }
    expect(await done('talk_neighbor'), 'the wash intro is reachable (talk_neighbor)').toBe(true);
    expect(await done('spanish_neighbor'), 'the Spanish thank-you beat is reachable (spanish_neighbor)').toBe(true);
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

  // PROMOTED 2026-06-02: was WORKLIST (test.fail); fixed by 1.9.3 (bridge_plan
  // now opens BridgeDesignScene) + the gating-feedback fix. STRICT and by REAL
  // play only: collect + test materials at the UTM by keyboard, then the bridge
  // workbench must offer a genuine material CHOICE (phase 'choose' with
  // candidates) and a sound design must visibly hold. No __GAME__ for the action.
  test('GUARD: a player designs the bridge by hand — real choice, sound design holds', async ({ page }) => {
    test.setTimeout(120000);
    await bootRebuild(page);
    // Real prerequisite, all by keyboard: gather candidate materials + mesquite,
    // then predict-and-test each at the UTM so the bridge has tested candidates.
    await collectAt(page, 'materials_table'); // steel, copper_brace, weak_scrap
    await collectAt(page, 'ecology_patch');   // mesquite
    await walkTo(page, await zoneById(page, 'utm'));
    await page.keyboard.press('e');
    await drivePredictionToCompletion(page);

    // The bridge workbench now opens a real choice — not a pre-baked plan.
    await walkTo(page, await zoneById(page, 'bridge_plan'));
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__ && window.__BRIDGE_DESIGN__.active === true, null, { timeout: 8000 });
    expect(await bridgeDesignOpen(page), 'pressing E opens the bridge DESIGN modal').toBe(true);
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.candidates.length), 'tested materials are offered as candidates').toBeGreaterThan(0);

    // Choose a sound design (mesquite deck / steel support / copper brace) -> holds.
    await pickBridgeMaterial(page, 'mesquite');
    await pickBridgeMaterial(page, 'steel');
    await pickBridgeMaterial(page, 'copper_brace');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result', null, { timeout: 8000 });
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome), 'the sound design holds').toBe('safe');
  });

  // PROMOTED 2026-06-02: was WORKLIST (test.fail); fixed by 1.9.4 (the
  // 'Investigate the washout' marker opens InvestigationScene). STRICT and by
  // REAL play only: walk to the washout mystery, run observe -> hypothesize ->
  // gather evidence -> conclude by keyboard, and require the per-mystery
  // concluded + corrected-by-evidence flags to flip. No __GAME__ for the action.
  test('GUARD: a player runs the Dry Wash investigation by hand — evidence corrects a wrong guess', async ({ page }) => {
    test.setTimeout(90000);
    await bootRebuild(page);
    const zone = await zoneById(page, 'investigate_wash');
    expect(zone, 'an "investigate the washout" interaction exists').toBeTruthy();
    const reached = await walkTo(page, zone);
    expect(reached, 'player can walk to the washout mystery').toBe(true);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__INVESTIGATION__ && window.__INVESTIGATION__.active === true, null, { timeout: 8000 });
    expect(await investigationOpen(page), 'pressing E opens the investigation overlay').toBe(true);

    await driveInvestigation(page);

    const verified = await page.evaluate(() => {
      const inv = window.__GAME__.getAct1State().investigation;
      const m = (inv?.investigations || []).find((i) => i.id === 'wash_out_cause');
      return { concluded: Boolean(m?.concluded), corrected: Boolean(m?.updatedFromMisleading) };
    });
    expect(verified.concluded, 'the mystery is concluded through play').toBe(true);
    expect(verified.corrected, 'the misleading guess was corrected by the evidence').toBe(true);
  });

  // ---- TRACKED, not yet crisply assertable ----

  test.fixme('PAYOFF: pressing "test" shows a visible load test (press/bend/snap), not just text', async () => {
    // The verdict + tactile-cue data exists in materialTests; the player never
    // SEES the test happen. Add an assertion once a test-result visual/animation
    // element is rendered (e.g. a result card testid or a deformation sprite).
  });
});
