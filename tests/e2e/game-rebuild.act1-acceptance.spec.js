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
  const target = await interactionTarget(page, step);
  await walkTo(page, target);
  await page.waitForFunction((expected) => {
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return scene.prompt.visible && scene.prompt.text.includes(expected);
  }, step.prompt);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(220);
  await closeDialogue(page);
  if (step.waitFor) await page.waitForFunction(step.waitFor);
  await page.screenshot({ path: `${captureDir}/${step.file}.png`, fullPage: true });
}

test.describe('Act 1 player-visible acceptance walkthrough', () => {
  test('completes Act 1 through visible movement and interaction prompts', async ({ page }) => {
    test.setTimeout(120_000);
    mkdirSync(captureDir, { recursive: true });
    await ready(page);

    await page.evaluate(() => {
      window.__GAME__.resetAct1();
      window.__GAME__.setAudioSettings({ speechEnabled: true, autoSpeak: true, musicEnabled: true });
    });
    await page.screenshot({ path: `${captureDir}/00_start.png`, fullPage: true });

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
        waitFor: () => window.__GAME__.getAct1State().materialTests.tested.length >= 4,
      },
      {
        id: 'bridge_plan',
        x: 935,
        y: 454,
        prompt: 'Plan bridge repair',
        file: '08_bridge_plan',
        waitFor: () => Boolean(window.__GAME__.getAct1State().bridge.plan),
      },
      {
        id: 'bridge_repair',
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
        materialVerdicts: state.materialTests.tested.map((t) => ({ id: t.materialId, bridgeSafe: t.bridgeSafe, band: t.strengthBand })),
        chemistryResults: state.chemistry.completedRecipes,
        ecologyObservations: state.ecology.observations,
        finalFeedback: window.__GAME__.getFeedbackState().last,
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
    const weakScrap = finalState.materialVerdicts.find((v) => v.id === 'weak_scrap');
    expect(steel).toMatchObject({ bridgeSafe: true, band: 'strong candidate' });
    expect(weakScrap).toMatchObject({ bridgeSafe: false, band: 'comparison failure' });
    expect(finalState.finalFeedback.message).toContain('Wider map unlocked');

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
