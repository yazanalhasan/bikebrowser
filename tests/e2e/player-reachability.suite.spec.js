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
  // The predict-before-test flow lives in the R3F UTM lab (a GameShell overlay).
  // The real "modal up / player trapped" signal is the visible overlay dialog.
  return page.evaluate(() =>
    document.querySelector('.bb-utm-overlay')?.getAttribute('aria-label') === 'Universal Testing Machine');
}
async function holdKey(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(30);
}
// The nearest interaction zone to the player — arrival doesn't need an exact
// position, just close enough to interact (matches a real player and the proven
// bridge-reachability walk).
async function nearestId(page) {
  return page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const s = g.scene.scenes.find((x) => x.interactions?.zones?.length && x.player);
    return s?.interactions?.nearest?.(s.player)?.id ?? null;
  });
}
// Walk the player to a target zone. Holds each axis PROPORTIONAL to its remaining
// distance (the player moves ~160px/s, so the old fixed 130ms micro-steps spent
// almost all their wall-clock in readWorld round-trips and timed out on far
// targets). Sequential X-then-Y holds + a nearest()-based arrival = the proven
// approach from game-rebuild.bridge-reachability.
async function walkTo(page, t, maxSteps = 110) {
  if (!t) return false;
  // A dialogue/feedback overlay left by a previous interaction (e.g. collecting at
  // materials_table) FREEZES the player — movement is gated on
  // !modalActive && !dialogueActive. Over a long serial suite it can linger and
  // stall the next walk (the E then lands at the wrong spot). Dismiss it first;
  // walkTo only runs for MOVEMENT, so there is never a modal we need to keep open.
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => {
    const g = window.__bikebrowserRebuildGame;
    return !g.registry.get('modalActive') && !g.registry.get('dialogueActive');
  }, null, { timeout: 3000 }).catch(() => {});
  let last = null;
  let stuck = 0;
  for (let i = 0; i < maxSteps; i++) {
    const w = await readWorld(page);
    if (!w) return false;
    const dx = t.x - w.player.x;
    const dy = t.y - w.player.y;
    if (Math.hypot(dx, dy) < 48) return true;
    if (t.id && (await nearestId(page)) === t.id) return true;
    if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 5) stuck += 1; else stuck = 0;
    last = w.player;
    if (stuck >= 4) {
      // Hard stuck: cycle a single direction to slide off the obstacle.
      await holdKey(page, ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4], 200);
      continue;
    }
    if (stuck >= 2) {
      // Soft stuck: commit fully to the smaller axis to round a corner.
      await holdKey(page, Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp'), 220);
      continue;
    }
    if (Math.abs(dx) > 22) await holdKey(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(240, Math.max(55, Math.abs(dx) * 1.9)));
    if (Math.abs(dy) > 22) await holdKey(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(240, Math.max(55, Math.abs(dy) * 1.9)));
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
// Drive the R3F UTM lab (already opened by the caller pressing E at the UTM) to
// completion by real mouse input: for every sample chip — select, predict, run,
// wait for the result — then close with Escape. Every prediction is recorded in
// the runtime ledger, so prediction-precedes-intervention is provable state.
async function drivePredictionToCompletion(page, names = null) {
  await page.waitForFunction(() =>
    document.querySelector('.bb-utm-overlay')?.getAttribute('aria-label') === 'Universal Testing Machine', null, { timeout: 8000 });
  // The overlay chrome mounts before the lazy-loaded lab body (Suspense), so
  // wait for the sample tray itself — counting too early sees zero chips.
  await page.locator('.utm-chip').first().waitFor({ timeout: 20000 });
  const chips = page.locator('.utm-chip');
  const n = await chips.count();
  if (!n) throw new Error('UTM lab rendered no material chips');
  for (let i = 0; i < n; i += 1) {
    const label = (await chips.nth(i).textContent()) || '';
    if (names && !names.some((m) => label.includes(m))) continue;
    await chips.nth(i).click();
    await page.locator('.pb__opt').first().click();
    await page.locator('.utm-btn--run').click();
    await page.locator('.utm-btn--ghost', { hasText: 'Reset' }).first().waitFor({ timeout: 20000 });
  }
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.bb-utm-overlay'), null, { timeout: 8000 });
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
// Drive the ecology loop by keyboard: for each site, observe -> pick the FIRST
// plant option -> see the outcome -> advance; then close the summary. Returns
// when the overlay closes. The caller asserts the payoff (notebook + outcome).
async function driveEcology(page) {
  await page.waitForFunction(() => window.__ECOLOGY__ && window.__ECOLOGY__.active === true, null, { timeout: 8000 });
  for (let i = 0; i < 30; i++) {
    const s = await page.evaluate(() => window.__ECOLOGY__);
    if (!s.active) break;
    // observe -> predict -> (commit) result -> advance; summary -> close. In
    // 'predict' just commit the current option. E advances every other phase.
    await page.keyboard.press('e');
    await page.waitForTimeout(220);
  }
  await page.waitForFunction(() => window.__ECOLOGY__.active === false, null, { timeout: 8000 });
}

test.describe('player reachability', () => {
  test.describe.configure({ timeout: 240000 }); // generous headroom: these walk-heavy guards do many page.evaluate round-trips that slow under full-suite parallel CPU contention (they pass ~84s each in isolation);

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
    expect(await predictionModalOpen(page), 'pressing E at the UTM opens the UTM lab overlay').toBe(true);
    // The gate is visible: the run button stays locked until a prediction is made.
    await page.locator('.utm-chip').first().click();
    expect(await page.locator('.utm-btn--run').isDisabled(), 'testing is locked before a prediction').toBe(true);
    await page.locator('.pb__opt').first().click();
    expect(await page.locator('.utm-btn--run').isDisabled(), 'predicting unlocks the test').toBe(false);
  });

  // PROMOTED 2026-06-02: was WORKLIST (test.fail); fixed by collapsing the two
  // stacked Mrs. Ramirez zones into one progression-aware `neighbor` zone. Now a
  // GUARD: no zone is geometrically shadowed, AND the thank-you beat is reachable.
  test('GUARD: no shadowed zones, and Mrs. Ramirez\'s thank-you beat is reachable', async ({ page }) => {
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

    // (2) Reachable through play: the neighbor zone yields the wash intro first
    // (completes talk_neighbor). The Spanish thank-you is a POST-REPAIR beat by
    // design (Quest 9 thanks the neighbors after the crossing reconnects), so
    // the repair is set up via the debug API (setup, not the action) and then
    // the thank-you is driven by real keys. E advances AND picks choices.
    const nb = await zoneById(page, 'neighbor');
    expect(nb, 'a Mrs. Ramirez interaction exists').toBeTruthy();
    await walkTo(page, nb);
    const done = (obj) => page.evaluate((o) => {
      try { return window.__GAME__.getAct1State().quests.completedObjectives.includes(o); } catch { return false; }
    }, obj);
    await page.keyboard.press('e'); // open the wash intro
    await page.waitForTimeout(200);
    for (let i = 0; i < 22 && !(await done('talk_neighbor')); i++) {
      await page.keyboard.press('e');
      await page.waitForTimeout(150);
    }
    expect(await done('talk_neighbor'), 'the wash intro is reachable (talk_neighbor)').toBe(true);
    // Setup only: reconnect the bridge so the thank-you beat unlocks.
    await page.evaluate(() => {
      const g = window.__GAME__;
      for (let i = 0; i < 8; i += 1) g.handleInteraction('collect_materials');
      ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => g.testMaterial(id));
      g.completeBridgePlan('tested_triangle_plan');
      g.repairBridge();
    });
    await page.keyboard.press('Escape'); // clear the crossing cutscene if it opened
    await page.waitForTimeout(400);
    await walkTo(page, nb);
    await page.keyboard.press('e'); // open the thank-you
    await page.waitForTimeout(200);
    for (let i = 0; i < 22 && !(await done('spanish_neighbor')); i++) {
      await page.keyboard.press('e');
      await page.waitForTimeout(150);
    }
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
    expect(await predictionModalOpen(page), 'Escape closes the UTM lab, regaining control').toBe(false);
    const freed = await page.evaluate(() => !window.__bikebrowserRebuildGame.registry.get('modalActive'));
    expect(freed, 'the player is unfrozen after closing the lab').toBe(true);
  });

  // PROMOTED 2026-06-02: was WORKLIST (test.fail); fixed by 1.9.3 (bridge_plan
  // now opens BridgeDesignScene) + the gating-feedback fix. STRICT and by REAL
  // play only: collect + test materials at the UTM by keyboard, then the bridge
  // workbench must offer a genuine material CHOICE (phase 'choose' with
  // candidates) and a sound design must visibly hold. No __GAME__ for the action.
  test('GUARD: a player designs the bridge by hand — real choice, sound design holds', async ({ page }) => {
    await bootRebuild(page);
    // Real prerequisite, all by keyboard: gather candidate materials + mesquite,
    // then predict-and-test each at the UTM so the bridge has tested candidates.
    // Real input all the way: eight catalog samples (one per visit post
    // de-pad), mesquite, then predict-and-test each sample in the UTM lab.
    for (let i = 0; i < 8; i += 1) await collectAt(page, 'materials_table');
    await collectAt(page, 'ecology_patch');   // mesquite
    await walkTo(page, await zoneById(page, 'utm'));
    await page.keyboard.press('e');
    // Predict-and-test the four materials the truss build uses (the full
    // 8-material pass is the acceptance walkthrough's job).
    await drivePredictionToCompletion(page, ['Bamboo', 'Steel', 'Carbon Fiber', 'Iron']);

    // The bridge workbench opens the truss designer — a real family + material
    // choice, not a pre-baked plan.
    await walkTo(page, await zoneById(page, 'bridge_plan'));
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__ && window.__BRIDGE_DESIGN__.active === true, null, { timeout: 8000 });
    expect(await bridgeDesignOpen(page), 'pressing E opens the bridge DESIGN modal').toBe(true);
    // Family (truss) -> five-role build, by keyboard.
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'family');
    for (let g = 0; g < 8; g += 1) {
      if ((await page.evaluate(() => window.__BRIDGE_DESIGN__.families[window.__BRIDGE_DESIGN__.familyIndex].key)) === 'truss') break;
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.candidates.length), 'tested materials are offered as candidates').toBeGreaterThan(0);
    for (const id of ['bamboo', 'steel', 'carbon_fiber', 'steel', 'iron']) await pickBridgeMaterial(page, id);
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'ready');
    await page.keyboard.press('e'); // Test Bridge
    await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result', null, { timeout: 8000 });
    expect(await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome), 'the sound design holds').toBe('safe');
  });

  // PROMOTED 2026-06-02: was WORKLIST (test.fail); fixed by 1.9.4 (the
  // 'Investigate the washout' marker opens InvestigationScene). STRICT and by
  // REAL play only: walk to the washout mystery, run observe -> hypothesize ->
  // gather evidence -> conclude by keyboard, and require the per-mystery
  // concluded + corrected-by-evidence flags to flip. No __GAME__ for the action.
  test('GUARD: a player runs the Dry Wash investigation by hand — evidence corrects a wrong guess', async ({ page }) => {
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

  // ADDED 2026-06-02 (Phase 2.1): Ecology Loop, the same observe->predict->
  // outcome->payoff pattern as predict/build/investigate, with an explicit
  // PAYOFF assertion (the player visibly receives choice -> consequence ->
  // payoff). Driven by keyboard only; no __GAME__ for the action.
  test('GUARD: a player runs the ecology loop by hand — outcome shown, payoff delivered', async ({ page }) => {
    await bootRebuild(page);
    const zone = await zoneById(page, 'ecology_garden');
    expect(zone, 'an ecology planting interaction exists').toBeTruthy();
    const reached = await walkTo(page, zone);
    expect(reached, 'player can walk to the planting spot').toBe(true);
    await page.keyboard.press('e');
    await driveEcology(page);

    // PAYOFF: every site resolved to a visible outcome, and the plants the
    // player reasoned about are now field notes in the notebook.
    const payoff = await page.evaluate(() => {
      const eco = window.__GAME__.getAct1State().ecology;
      const notebook = JSON.stringify(window.__GAME__.getAct1State().notebook).toLowerCase();
      return {
        resolved: eco.placementsResolved,
        count: eco.placementCount,
        notebookHasPlants: notebook.includes('mesquite') && notebook.includes('creosote'),
      };
    });
    expect(payoff.resolved, 'every site reached a visible outcome through play').toBe(payoff.count);
    expect(payoff.notebookHasPlants, 'the payoff is recorded as field notes (notebook)').toBe(true);
  });

  // ADDED 2026-06-03 (Phase 2.2): Discovery Registry. By keyboard only, a
  // discovery through play fires the NEW DISCOVERY banner (immediate payoff) and
  // the persistent registry view opens with [J] (categorised payoff).
  test('GUARD: a discovery through play shows NEW DISCOVERY and opens the registry ([J])', async ({ page }) => {
    await bootRebuild(page);
    const before = await page.evaluate(() => window.__DISCOVERY__?.total ?? 0);
    const eco = await zoneById(page, 'ecology_patch');
    expect(eco, 'an ecology observation interaction exists').toBeTruthy();
    expect(await walkTo(page, eco), 'player can walk to it').toBe(true);
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('e');
      await page.waitForTimeout(400);
      const grew = await page.evaluate((b) => Boolean(window.__DISCOVERY__ && window.__DISCOVERY__.total > b), before);
      if (grew) break;
    }
    await page.waitForFunction((b) => window.__DISCOVERY__ && window.__DISCOVERY__.total > b, before, { timeout: 10000 });
    // Immediate payoff: the banner.
    expect(await page.evaluate(() => window.__DISCOVERY__.bannerVisible), 'NEW DISCOVERY banner shows').toBe(true);
    // Persistent payoff: the registry view opens and is categorised. Clear the
    // observation dialogue first — the dialogue box eats world keys like J.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.keyboard.press('j');
    await page.waitForFunction(() => window.__DISCOVERY__.open === true, null, { timeout: 5000 });
    const st = await page.evaluate(() => window.__DISCOVERY__);
    expect(st.total, 'registry holds the discoveries').toBeGreaterThan(0);
    expect(st.categories.some((c) => c.count > 0), 'discoveries are catalogued by category').toBe(true);
  });

  // ADDED 2026-06-03 (Phase 2.3): World Map. The G key opens a FUNCTIONAL map
  // (current/reachable/locked from real state) and closes again — it previously
  // double-toggled and read as a dead key. Keyboard only.
  test('GUARD: G opens a functional world map (current/reachable/locked) and closes', async ({ page }) => {
    await bootRebuild(page);
    await page.waitForFunction(() => Boolean(window.__WORLDMAP__), null, { timeout: 8000 });
    expect(await page.evaluate(() => window.__WORLDMAP__.open), 'map starts collapsed').toBe(false);
    await page.keyboard.press('g');
    await page.waitForFunction(() => window.__WORLDMAP__.open === true, null, { timeout: 5000 });
    const m = await page.evaluate(() => window.__WORLDMAP__);
    expect(m.currentLabel, 'shows current location').toBeTruthy();
    expect(m.reachable.includes(m.current), 'current is a reachable place (no dead link)').toBe(true);
    expect(m.reachable, 'neighborhood reachable').toEqual(expect.arrayContaining(['home', 'garage', 'street']));
    expect(m.locked.length, 'locked frontier shown honestly').toBeGreaterThan(0);
    await page.keyboard.press('g');
    await page.waitForFunction(() => window.__WORLDMAP__.open === false, null, { timeout: 5000 });
  });

  // ADDED 2026-06-03 (Phase 2.4): Multi-Biome (Salt River). Gated behind the
  // wider map (setup-only unlock), then the player walks there and runs the full
  // observe->predict->outcome->payoff loop by keyboard. Payoff = biome complete +
  // discoveries recorded.
  test('GUARD: a player runs the Salt River biome loop by hand — payoff delivered', async ({ page }) => {
    await bootRebuild(page);
    // Prerequisite (not the action): open the wider map so the biome unlocks.
    await page.evaluate(() => {
      const g = window.__GAME__;
      for (let i = 0; i < 8; i += 1) g.handleInteraction('collect_materials');
      for (let i = 0; i < 3; i += 1) g.handleInteraction('ecology_patch');
      ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => g.testMaterial(id));
      g.completeBridgePlan('tested_triangle_plan');
      g.repairBridge();
      g.unlockWiderMap();
    });
    // The repair auto-plays the Community Crossing (modal) — clear it fully or
    // the walk below starts frozen.
    for (let i = 0; i < 10; i += 1) {
      const modal = await page.evaluate(() => Boolean(window.__bikebrowserRebuildGame.registry.get('modalActive')));
      if (!modal) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    // The expedition is a HIDDEN opportunity until the City Gate is discovered
    // (a discovery that affects progression). Walk right up to the gate
    // (~1484,514) — the exploration-proximity discovery needs a closer approach
    // than the interaction radius (same walk as the City Gate GUARD).
    const revealed = () => page.evaluate(() =>
      window.__GAME__.getAct1State().discoveryUnlocks?.saltRiverRevealed === true);
    for (let g = 0; g < 60 && !(await revealed()); g++) {
      const p = await page.evaluate(() => {
        const sc = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
        return { x: Math.round(sc.player.x), y: Math.round(sc.player.y) };
      });
      const dx = 1484 - p.x, dy = 514 - p.y;
      if (Math.hypot(dx, dy) < 24) break;
      if (Math.abs(dx) > 12) { await page.keyboard.down(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(120); await page.keyboard.up(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); }
      if (Math.abs(dy) > 12) { await page.keyboard.down(dy > 0 ? 'ArrowDown' : 'ArrowUp'); await page.waitForTimeout(120); await page.keyboard.up(dy > 0 ? 'ArrowDown' : 'ArrowUp'); }
    }
    await page.waitForFunction(() => window.__GAME__.getAct1State().discoveryUnlocks?.saltRiverRevealed === true, null, { timeout: 8000 });
    const zone = await zoneById(page, 'salt_river_expedition');
    expect(zone, 'a Salt River expedition interaction exists').toBeTruthy();
    expect(await walkTo(page, zone), 'player can walk to the expedition').toBe(true);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__BIOME__ && window.__BIOME__.active === true, null, { timeout: 8000 });
    // Drive intro -> (observe -> predict[first option] -> result) x N -> summary -> close.
    for (let i = 0; i < 24; i++) {
      const s = await page.evaluate(() => window.__BIOME__);
      if (!s.active) break;
      await page.keyboard.press('e');
      await page.waitForTimeout(220);
    }
    await page.waitForFunction(() => window.__BIOME__.active === false, null, { timeout: 8000 });

    const payoff = await page.evaluate(() => {
      const s = window.__GAME__.getAct1State();
      const biome = s.biomes.biomes.find((b) => b.id === 'salt_river');
      return { complete: biome.complete, discoveries: s.discoveryRegistry.total };
    });
    expect(payoff.complete, 'the biome loop completes through play').toBe(true);
    expect(payoff.discoveries, 'discoveries accrued (payoff is recorded)').toBeGreaterThan(0);
  });

  // ADDED 2026-06-03 (Phase 2.2 Fun): discoveries MATTER. By exploration (no
  // prompt), discovering the City Gate reveals the otherwise-hidden Salt River
  // expedition — a discovery that affects progression, not a collectible.
  test('GUARD: a discovery affects progression — City Gate reveals the Salt River expedition', async ({ page }) => {
    await bootRebuild(page);
    const scene = (fn) => page.evaluate(`(${fn.toString()})(window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene'))`);
    expect(await scene((s) => s.saltRiverMarker.visible), 'expedition hidden at start').toBe(false);
    // Walk toward the City Gate (~1484,514) — exploration discovers it.
    for (let g = 0; g < 60; g++) {
      if (await page.evaluate(() => window.__GAME__.getAct1State().discoveryUnlocks.saltRiverRevealed === true)) break;
      const p = await scene((s) => ({ x: Math.round(s.player.x), y: Math.round(s.player.y) }));
      const dx = 1484 - p.x, dy = 514 - p.y;
      if (Math.hypot(dx, dy) < 30) break;
      if (Math.abs(dx) > 12) { await page.keyboard.down(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(120); await page.keyboard.up(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); }
      if (Math.abs(dy) > 12) { await page.keyboard.down(dy > 0 ? 'ArrowDown' : 'ArrowUp'); await page.waitForTimeout(120); await page.keyboard.up(dy > 0 ? 'ArrowDown' : 'ArrowUp'); }
    }
    await page.waitForFunction(() => window.__GAME__.getAct1State().discoveryUnlocks.saltRiverRevealed === true, null, { timeout: 8000 });
    expect(await scene((s) => s.saltRiverMarker.visible), 'the discovery revealed the expedition').toBe(true);
  });

  // ---- TRACKED, not yet crisply assertable ----

  test.fixme('PAYOFF(UTM): pressing "test" shows a visible load test (press/bend/snap), not just text', async () => {
    // NOTE: the prediction overlay now animates the beam hold/bend/break (1.9.2A);
    // this fixme remains only to add a crisp DOM/sprite-level assertion for the
    // UTM visualizer specifically. Ecology payoff is asserted in the GUARD above.
  });
});
