import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from 'playwright/test';

const captureDir = 'playtest_captures/game_rebuild_act1_acceptance';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}

async function playerPosition(page) {
  return page.evaluate(() => {
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return { x: scene.player.x, y: scene.player.y };
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
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return scene.interactions.nearest(scene.player)?.id || null;
  });
}

async function walkTo(page, target) {
  const { x, y, id } = target;
  // Arrival = the target interaction is nearest (active===id) OR within ARRIVE px.
  // Move whenever further than STEP px. STEP must be < ARRIVE so there is no
  // dead band where the player neither moves nor arrives (which previously let a
  // nearby NPC zone stay "nearest" ~24-28px from a closely-spaced target, e.g.
  // the bike at 470,432 next to a neighbor at 420,438). Finer nudges near the
  // target make navigation deterministic without changing any acceptance
  // assertion, step, or coverage.
  const ARRIVE = 24;
  const STEP = 6;
  for (let guard = 0; guard < 200; guard += 1) {
    const pos = await playerPosition(page);
    if (await activeInteraction(page) === id) return pos;
    const dx = x - pos.x;
    const dy = y - pos.y;
    if (Math.hypot(dx, dy) < ARRIVE) return pos;
    if (Math.abs(dx) > STEP) {
      await hold(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(220, Math.max(45, Math.abs(dx) * 2.0)));
    }
    if (Math.abs(dy) > STEP) {
      await hold(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(220, Math.max(45, Math.abs(dy) * 2.0)));
    }
  }
  throw new Error(`Could not walk to ${id} at ${x},${y}; current ${JSON.stringify(await playerPosition(page))}; active ${await activeInteraction(page)}`);
}

async function interactionTarget(page, step) {
  return page.evaluate(({ id, prompt }) => {
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    const zone = scene.interactions.zones.find((candidate) =>
      candidate.id === id ||
      candidate.action === id ||
      candidate.label.includes(prompt)
    );
    if (!zone) throw new Error(`Missing interaction zone for ${id}`);
    return { id: zone.id, x: zone.x, y: zone.y, label: zone.label };
  }, { id: step.id, prompt: step.prompt });
}

async function closeDialogue(page) {
  for (let guard = 0; guard < 8; guard += 1) {
    const visible = await page.evaluate(() => {
      const scene = window.__bikebrowserRebuildGame.scene.getScene('DialogueScene');
      return Boolean(scene.panel?.visible);
    });
    if (!visible) return;
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
  }
}

async function interactAt(page, step) {
  if (step.before) await step.before(page);
  // Auto steps don't require walking to the zone — the consequence already
  // happened (e.g. on a passed load test the bridge auto-repairs AND auto-plays
  // the Community Crossing, so the player never walks east across the wash to the
  // bridge_repair zone). Just verify the resulting state + capture.
  if (step.auto) {
    if (step.waitFor) await page.waitForFunction(step.waitFor);
    await page.screenshot({ path: `${captureDir}/${step.file}.png`, fullPage: true });
    return;
  }
  const target = await interactionTarget(page, step);
  await walkTo(page, target);
  await page.waitForFunction((expected) => {
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return scene.prompt.visible && scene.prompt.text.includes(expected);
  }, step.prompt);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(220);
  if (step.drive) {
    await step.drive(page); // multi-step UI driven by real keyboard (no closeDialogue)
  } else {
    await closeDialogue(page);
  }
  if (step.waitFor) await page.waitForFunction(step.waitFor);
  await page.screenshot({ path: `${captureDir}/${step.file}.png`, fullPage: true });
}

test.describe('Act 1 player-visible acceptance walkthrough', () => {
  test('completes Act 1 through visible movement and interaction prompts', async ({ page }) => {
    test.setTimeout(300_000); // full Act-1 walkthrough in headless (collect 8 materials, 8-material UTM predict-flow, bridge design + load test + crossing cutscene, wider-gate). Runs ~3min; margin for CI variance.
    mkdirSync(captureDir, { recursive: true });
    await ready(page);

    await page.evaluate(() => {
      window.__GAME__.resetAct1();
      window.__GAME__.setAudioSettings({ speechEnabled: true, autoSpeak: true, musicEnabled: true });
    });
    await page.screenshot({ path: `${captureDir}/00_start.png`, fullPage: true });

    // Phase 1.5: quest gating — a material cannot be tested before it is
    // collected (no skipping the Observe/Collect step).
    const gatedBeforeCollect = await page.evaluate(() => {
      const result = window.__GAME__.testMaterial('steel');
      return { ok: result.ok, reason: result.reason, testedCount: window.__GAME__.getAct1State().materialTests.tested.length };
    });
    expect(gatedBeforeCollect).toMatchObject({ ok: false, reason: 'not_collected', testedCount: 0 });

    const steps = [
      {
        id: 'bike_check',
        x: 470,
        y: 432,
        prompt: 'Inspect the bike',
        file: '01_bike_check',
        waitFor: () => window.__GAME__.getAct1State().notebook.unlocked.includes('bike_check'),
      },
      {
        id: 'mr_chen',
        x: 282,
        y: 438,
        prompt: 'Talk to Mr. Chen',
        file: '02_mr_chen_dialogue',
        waitFor: () => window.__GAME__.getAudioState().lastSpoken?.voiceId === 'garage_mentor',
      },
      {
        id: 'dry_wash',
        x: 1190,
        y: 574,
        prompt: 'Read bridge sign',
        file: '03_dry_wash_discovery',
        waitFor: () => window.__GAME__.getAct1State().discovery.discovered.includes('dry_wash'),
      },
      {
        id: 'materials_table',
        x: 880,
        y: 410,
        prompt: 'Collect candidate materials',
        file: '04_collect_materials',
        waitFor: () => window.__GAME__.getAct1State().inventory.items.includes('steel'),
      },
      {
        id: 'ecology_patch',
        x: 1030,
        y: 760,
        prompt: 'Observe desert helpers',
        file: '05_ecology_observation',
        waitFor: () => window.__GAME__.getAct1State().notebook.unlocked.includes('desert_plant'),
      },
      {
        id: 'chemistry_station',
        x: 820,
        y: 444,
        prompt: 'Mix, dry, test',
        file: '06_chemistry_station',
        waitFor: () => window.__GAME__.getAct1State().notebook.unlocked.includes('chemistry_result'),
      },
      {
        id: 'utm',
        x: 742,
        y: 408,
        prompt: 'Run UTM material tests',
        file: '07_utm_tests',
        // Phase 1.9.2: predict-before-test is now PLAYER-REACHABLE. Pressing E at
        // the UTM opens the prediction flow; the player picks HOLD/BREAK + how-
        // sure and presses E to test — via REAL keyboard, no __GAME__ predict.
        drive: async (page) => {
          await page.waitForFunction(() => window.__PREDICTION__ && window.__PREDICTION__.active === true);
          // Predict for every material the UTM offers — the count is data-driven
          // (8 materials), so loop until the summary appears rather than a fixed N.
          for (let i = 0; i < 12; i += 1) {
            if ((await page.evaluate(() => window.__PREDICTION__.phase)) === 'summary') break;
            await page.waitForFunction(() => window.__PREDICTION__.phase === 'choose');
            if (i === 0) await page.screenshot({ path: `${captureDir}/07a_prediction_choose.png`, fullPage: true });
            await page.keyboard.press('ArrowLeft'); // pick "WILL HOLD"
            await page.keyboard.press('ArrowUp');   // how sure: up
            await page.keyboard.press('KeyE');       // commit + test
            await page.waitForFunction(() => window.__PREDICTION__.phase === 'result');
            if (i === 0) await page.screenshot({ path: `${captureDir}/07b_prediction_result.png`, fullPage: true });
            await page.keyboard.press('KeyE');       // next material / (after last) summary
            await page.waitForTimeout(120);
          }
          // 1.9.2B exit flow: a summary appears, then the overlay closes cleanly.
          await page.waitForFunction(() => window.__PREDICTION__.phase === 'summary');
          await page.screenshot({ path: `${captureDir}/07c_prediction_summary.png`, fullPage: true });
          await page.keyboard.press('KeyE');
          await page.waitForFunction(() => window.__PREDICTION__.active === false);
          // arc.md: prediction precedes intervention — a prediction exists for
          // every material tested (made via UI, not __GAME__).
          const gated = await page.evaluate(() => {
            const s = window.__GAME__.getAct1State();
            return { made: s.prediction.made, tested: s.materialTests.tested.length };
          });
          if (gated.made < gated.tested) throw new Error(`prediction did not gate testing: made=${gated.made} tested=${gated.tested}`);
        },
        waitFor: () => window.__GAME__.getAct1State().materialTests.tested.length >= 4,
      },
      {
        id: 'bridge_plan',
        x: 935,
        y: 454,
        prompt: 'Plan bridge repair',
        file: '08_bridge_plan',
        // Phase 1.9.3: PLAYER designs the bridge via the overlay (real keyboard).
        // A flawed design (weak support) fails on screen; the player iterates to
        // a sound design that holds. choice -> consequence -> iterate -> payoff.
        drive: async (page) => {
          await page.waitForFunction(() => window.__BRIDGE_DESIGN__ && window.__BRIDGE_DESIGN__.active === true);
          // Choose the Truss family (deck/support/brace/cable/foundation build).
          await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'family');
          for (let g = 0; g < 8; g += 1) {
            const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.families[window.__BRIDGE_DESIGN__.familyIndex].key);
            if (cur === 'truss') break;
            await page.keyboard.press('ArrowDown');
          }
          await page.keyboard.press('KeyE');
          const pick = async (materialId) => {
            await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'choose');
            for (let g = 0; g < 8; g += 1) {
              const cur = await page.evaluate(() => window.__BRIDGE_DESIGN__.candidateId);
              if (cur === materialId) break;
              await page.keyboard.press('ArrowRight');
            }
            await page.keyboard.press('KeyE'); // drop the held part into the active slot
          };
          // After every slot is filled the scene waits on the "Test Bridge" button.
          const testBridge = async () => {
            await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'ready');
            await page.keyboard.press('KeyE'); // press Test Bridge -> runs the load solver
          };
          // 1) flawed: weak balsa as the support -> the bridge fails (5-role builder).
          await pick('bamboo'); await pick('balsa'); await pick('carbon_fiber'); await pick('steel'); await pick('iron');
          await testBridge();
          await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
          await page.screenshot({ path: `${captureDir}/08a_bridge_fail.png`, fullPage: true });
          const failed = await page.evaluate(() => window.__BRIDGE_DESIGN__.outcome);
          if (failed === 'safe') throw new Error('expected the weak-support design to fail');
          await page.keyboard.press('KeyE'); // rebuild (iterate)
          // 2) sound: all-strong, steel cable (tension) + iron foundation (compression) -> holds.
          await pick('bamboo'); await pick('steel'); await pick('carbon_fiber'); await pick('steel'); await pick('iron');
          await testBridge();
          await page.waitForFunction(() => window.__BRIDGE_DESIGN__.phase === 'result');
          await page.screenshot({ path: `${captureDir}/08b_bridge_hold.png`, fullPage: true });
          await page.keyboard.press('KeyE'); // finish
          await page.waitForFunction(() => window.__BRIDGE_DESIGN__.active === false);
        },
        waitFor: () => Boolean(window.__GAME__.getAct1State().bridge.plan),
      },
      {
        id: 'bridge_repair',
        // No walk: a passed load test auto-repairs the bridge and auto-plays the
        // Community Crossing (decision_log #31), so the player never crosses east
        // to this zone. We just confirm the reconnection + step the cutscene.
        auto: true,
        x: 1255,
        y: 642,
        prompt: 'Reconnect the crossing',
        file: '09_bridge_repaired',
        waitFor: () => window.__GAME__.getAct1State().bridge.bridgeReconnected === true,
      },
      {
        id: 'wider_gate',
        x: 1484,
        y: 514,
        prompt: 'Open wider map clue',
        file: '10_wider_map_unlocked',
        waitFor: () => window.__GAME__.getAct1State().act1Complete === true,
      },
    ];

    for (const step of steps) {
      await interactAt(page, step);
      if (step.id === 'bridge_plan') {
        // Phase 3 — a sound design flows into the Load Test (a modal). Step through
        // it by real keyboard (each E advances one load scenario; the final E
        // finishes and emits loadTest:done -> the bridge reconnects + the wash
        // barrier lifts, so the next walk to bridge_repair isn't blocked). Drive it
        // until the bridge actually reconnects rather than a fixed press count, so
        // a slow modal open or an extra scenario can't leave the barrier up.
        await page.waitForFunction(() => window.__LOAD_TEST__ && window.__LOAD_TEST__.active === true, null, { timeout: 10000 }).catch(() => {});
        // Drive E until the bridge reconnects AND the wash barrier physically lifts
        // (state flipping isn't enough — the next walk crosses the wash, so the
        // collider must actually be disabled). Keep pressing in case a scenario
        // step was dropped.
        const barrierDown = () => page.evaluate(() => {
          const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
          const recon = window.__GAME__.getBridgeState().bridgeReconnected === true;
          const barrier = s.washBarrier?.body;
          return recon && (!barrier || barrier.enable === false);
        });
        for (let i = 0; i < 18; i += 1) {
          if (await barrierDown()) break;
          await page.keyboard.press('KeyE');
          await page.waitForTimeout(200);
        }
        await page.waitForFunction(() => {
          const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
          const recon = window.__GAME__.getBridgeState().bridgeReconnected === true;
          const barrier = s.washBarrier?.body;
          return recon && (!barrier || barrier.enable === false);
        }, null, { timeout: 6000 });
      }
      if (step.id === 'bridge_repair') {
        // Phase 6 — repairing the bridge auto-plays the Community Crossing cutscene
        // (Mr. Chen crosses to meet Mrs. Ramirez). It FREEZES the player until it is
        // fully closed, so step it to COMPLETION (each E advances a beat) — a fixed
        // press count can leave it active and the next walk to the wider gate frozen.
        await page.waitForFunction(() => window.__CROSSING__ && window.__CROSSING__.active === true, null, { timeout: 8000 }).catch(() => {});
        for (let i = 0; i < 20; i += 1) {
          if (!(await page.evaluate(() => Boolean(window.__CROSSING__ && window.__CROSSING__.active)))) break;
          await page.keyboard.press('KeyE');
          await page.waitForTimeout(180);
        }
        await page.waitForFunction(() => !window.__CROSSING__ || window.__CROSSING__.active === false, null, { timeout: 5000 });
      }
    }

    await page.keyboard.press('KeyN');
    await page.waitForFunction(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').notebookPanel.visible);
    await page.screenshot({ path: `${captureDir}/11_final_notebook_completion.png`, fullPage: true });

    const finalState = await page.evaluate(() => {
      const state = window.__GAME__.getAct1State();
      const audio = window.BIKEBROWSER_AUDIO_AUDIT?.captureAudioState?.();
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      return {
        act1Complete: state.act1Complete,
        bridgeReconnected: state.bridge.bridgeReconnected,
        widerMapUnlocked: state.discovery.widerMapUnlocked,
        unlockedNotebookEntries: state.notebook.unlocked,
        materialTestCount: state.materialTests.tested.length,
        engineeringLoop: state.engineeringLoop,
        reasoning: state.reasoning,
        materialVerdicts: state.materialTests.tested.map((t) => ({ id: t.materialId, bridgeSafe: t.bridgeSafe, band: t.strengthBand })),
        prediction: state.prediction,
        inventoryDetails: state.inventory.details.map((d) => ({
          id: d.id, category: d.category, source: d.source,
          durability: d.durability, bridgeSafe: d.engineering ? d.engineering.bridgeSafe : null,
          ecologySpecies: d.ecology ? d.ecology.species : null,
        })),
        chemistryResults: state.chemistry.completedRecipes,
        ecologyObservations: state.ecology.observations,
        finalFeedback: window.__GAME__.getFeedbackState().last,
        feedbackMessages: (window.__GAME__.getFeedbackState().log || []).map((f) => f && f.message).filter(Boolean),
        promptText: scene.prompt.text,
        audioSummary: audio ? {
          hookVerified: audio.available,
          musicState: audio.music.currentState,
          voiceLineVoiceId: audio.lastSpoken?.voiceId,
          musicTransitions: audio.eventCounts.music_transition || 0,
          interactionCues: audio.eventCounts.interaction_cue || 0,
          speechAttempts: audio.eventCounts.speech_attempt || 0,
          errors: audio.errors,
        } : null,
      };
    });

    expect(finalState.act1Complete).toBe(true);
    expect(finalState.bridgeReconnected).toBe(true);
    expect(finalState.widerMapUnlocked).toBe(true);
    expect(finalState.unlockedNotebookEntries).toEqual(expect.arrayContaining([
      'bike_check',
      'broken_wash',
      'bridge_problem',
      'material_test_results',
      'desert_plant',
      'mesquite',
      'creosote',
      'saguaro',
      'chemistry_result',
      'bridge_plan',
      'bridge_repaired',
      'wider_map_unlocked',
    ]));
    expect(finalState.materialTestCount).toBeGreaterThanOrEqual(4);
    // Phase 1.2: UTM produces real, differentiated per-material verdicts — a
    // strong material passes the load test and a poor one visibly fails.
    const steel = finalState.materialVerdicts.find((v) => v.id === 'steel');
    const weakScrap = finalState.materialVerdicts.find((v) => v.id === 'balsa');
    expect(steel).toMatchObject({ bridgeSafe: true, band: 'strong candidate' });
    expect(weakScrap).toMatchObject({ bridgeSafe: false, band: 'comparison failure' });
    // Phase 1.3: predict-before-test loop resolved against real verdicts.
    expect(finalState.prediction.resolved).toBeGreaterThanOrEqual(3);
    const steelPrediction = finalState.prediction.predictions.find((p) => p.subjectId === 'steel');
    const weakPrediction = finalState.prediction.predictions.find((p) => p.subjectId === 'balsa');
    expect(steelPrediction).toMatchObject({ willHold: true, actualSafe: true, correct: true });
    expect(weakPrediction).toMatchObject({ willHold: true, actualSafe: false, correct: false });
    expect(finalState.unlockedNotebookEntries).toContain('prediction_log');
    // Phase 1.4: inventory items carry metadata (category/source/durability +
    // engineering/ecology attributes).
    const steelItem = finalState.inventoryDetails.find((d) => d.id === 'steel');
    const mesquiteItem = finalState.inventoryDetails.find((d) => d.id === 'mesquite');
    expect(steelItem).toMatchObject({ category: 'material', bridgeSafe: true });
    expect(steelItem.source).toBeTruthy();
    expect(typeof steelItem.durability).toBe('number');
    expect(mesquiteItem).toMatchObject({ category: 'material', ecologySpecies: 'mesquite' });
    // Phase 1.5: the full engineering loop is completed in order, end to end.
    expect(finalState.engineeringLoop).toMatchObject({
      observe: true, predict: true, test: true, build: true, verify: true, complete: true,
    });
    // Phase 1.9.3: bridge consequence is proven in the bridge_plan drive (a weak
    // design fails on screen; the player iterates to a sound one that holds).
    // Phase 1.7: reasoning is graded as a learning system. Evidence + correction
    // are rewarded; a WRONG prediction (weak_scrap) does NOT tank the grade
    // because the player tested and corrected — reasoning quality, not correctness.
    const weakPredictionWasWrong = finalState.prediction.predictions.find((p) => p.subjectId === 'balsa').correct === false;
    expect(weakPredictionWasWrong).toBe(true);
    expect(finalState.reasoning.dimensions.evidence.score).toBe(1);
    expect(finalState.reasoning.dimensions.correction.score).toBe(1);
    expect(finalState.reasoning.band).not.toBe('developing');
    expect(finalState.reasoning.learnings.length).toBeGreaterThan(0);
    expect(finalState.reasoning.rewardsReasoningNotCorrectness).toBe(true);
    // The "Wider map unlocked" feedback fires on the gate interaction; unlocking
    // the gate ALSO registers a discovery, whose banner can be the very last
    // feedback. Assert the unlock message appears in the feedback LOG (not strictly
    // last). The widerMapUnlocked state assertion above is the authoritative signal.
    expect(finalState.feedbackMessages.some((m) => m.includes('Wider map unlocked'))).toBe(true);

    // Phase 1.8: Dry Wash investigation loop (run last so it doesn't clobber the
    // map-unlock feedback above). Observe -> Hypothesize (a MISLEADING
    // hypothesis) -> Investigate -> Evidence disproves it -> Conclude with the
    // better explanation. Proves the educational loop generalizes beyond bridges.
    const investigation = await page.evaluate(() => {
      const id = 'wash_out_cause';
      const observed = window.__GAME__.observeMystery(id).ok;
      const hyp = window.__GAME__.hypothesizeMystery(id, 'weak_materials'); // misleading
      const inv = window.__GAME__.investigateMystery(id);
      const con = window.__GAME__.concludeMystery(id);
      const st = window.__GAME__.getAct1State().investigation.investigations.find((i) => i.id === id);
      return {
        observed,
        hypothesisMisleading: hyp.misleading,
        evidenceDisproves: inv.disprovesHypothesis,
        correctedFromMisleading: con.correctedFromMisleading,
        conclusionText: con.conclusion.text,
        state: st,
        notebook: window.__GAME__.getAct1State().notebook.unlocked,
      };
    });
    expect(investigation.observed).toBe(true);
    expect(investigation.hypothesisMisleading).toBe(true);
    expect(investigation.evidenceDisproves).toBe(true);
    expect(investigation.correctedFromMisleading).toBe(true);
    expect(investigation.conclusionText).toContain('scoured');
    expect(investigation.state).toMatchObject({ kind: 'engineering', concluded: true, updatedFromMisleading: true });
    expect(investigation.notebook).toContain('wash_scour');
    await page.screenshot({ path: `${captureDir}/12_dry_wash_investigation.png`, fullPage: true });

    const report = {
      generatedAt: new Date().toISOString(),
      playerVisibleWalkthrough: true,
      backendCompletionShortcutsUsed: false,
      setupShortcutsUsed: ['resetAct1 only before play'],
      steps: steps.map((step) => ({
        id: step.id,
        prompt: step.prompt,
        screenshot: `${captureDir}/${step.file}.png`,
      })),
      finalScreenshot: `${captureDir}/11_final_notebook_completion.png`,
      finalState,
    };
    writeFileSync(`${captureDir}/act1_player_visible_acceptance_report.json`, JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(
      `${captureDir}/act1_player_visible_acceptance_report.md`,
      [
        '# Act 1 Player-Visible Acceptance Walkthrough',
        '',
        '- Player-visible walkthrough: `true`',
        '- Backend completion shortcuts used: `false`',
        '- Act 1 complete: `true`',
        '- Bridge reconnected: `true`',
        '- Wider map unlocked: `true`',
        `- Final screenshot: \`${report.finalScreenshot}\``,
        '',
        '## Steps',
        ...report.steps.map((step) => `- ${step.id}: ${step.prompt} -> \`${step.screenshot}\``),
        '',
      ].join('\n'),
      'utf8'
    );
  });
});
