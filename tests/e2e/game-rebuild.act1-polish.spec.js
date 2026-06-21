import { readFileSync } from 'node:fs';
import { test, expect } from 'playwright/test';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
}

test.describe('Act 1 polish hardening', () => {
  test('movement, prompt, notebook, and evidence feedback stay responsive', async ({ page }) => {
    await ready(page);
    const before = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('playerPosition'));
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(450);
    await page.keyboard.up('ArrowRight');
    const after = await page.evaluate(() => window.__bikebrowserRebuildGame.registry.get('playerPosition'));
    expect(after.x).toBeGreaterThan(before.x + 12);

    await page.evaluate(() => window.__GAME__.handleInteraction('bike_check'));
    const notebook = await page.evaluate(() => window.__GAME__.getNotebookState());
    expect(notebook.newEntries).toContain('bike_check');
    const feedback = await page.evaluate(() => window.__GAME__.getFeedbackState());
    expect(feedback.last.message).toContain('Bike check complete');
  });

  test('normal HUD and notebook read as child-facing surfaces by default', async ({ page }) => {
    await ready(page);
    const hud = await page.evaluate(() => {
      const questScene = window.__bikebrowserRebuildGame.scene.getScene('QuestScene');
      const neighborhood = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      neighborhood.updateEvidencePanel();
      return {
        title: questScene.title.text,
        body: questScene.body.text,
        cluePanel: neighborhood.evidencePanel.text,
        debugVisible: window.__bikebrowserRebuildGame.scene.getScene('DebugScene').text.visible,
      };
    });
    expect(hud.title).toBe('Today\'s trail');
    expect(hud.body).not.toContain('✓');
    expect(hud.body).not.toContain('•');
    expect(hud.cluePanel).toContain('Current clue');
    expect(hud.cluePanel).not.toContain('Trust:');
    expect(hud.debugVisible).toBe(false);

    await page.evaluate(() => {
      window.__GAME__.handleInteraction('bike_check');
      window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook();
    });
    const notebook = await page.evaluate(() => {
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      return {
        header: scene.notebookHeader.text,
        categories: scene.notebookCategoryText.text,
        cards: scene.notebookCardsText.text,
        hint: scene.notebookHint.text,
      };
    });
    expect(notebook.header).toContain('Zuzu\'s Field Notebook');
    expect(notebook.header).toContain('clues');
    expect(notebook.cards).toContain('★ Bike Check');
    expect(notebook.cards).toContain('Tires, brakes, chain');
    expect(notebook.hint).toContain('New clues');
  });

  // SKIPPED 2026-06-21: this asserts the OLD aseprite sprite-sheet pipeline
  // (act1.zuzu.walk.sheet, *.talk.sheet, walk/idle animations). That pipeline was
  // replaced by the approved anime cutout art (zuzu_front/back; commits
  // 6273cb3/18d3c96), which is static-directional, not sheet-animated. Re-author
  // these assertions against the shipped anime art once it's finalized.
  test.skip('neighborhood characters use larger Aseprite animation sheets', async ({ page }) => {
    await ready(page);

    const visuals = await page.evaluate(async () => {
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      const before = {
        playerScale: scene.playerVisualState.scale,
        playerTexture: scene.player.texture.key,
        playerAnimation: scene.player.anims?.currentAnim?.key || null,
        animatedSheets: scene.characterVisuals.animatedSheets,
        npcIds: scene.characterVisuals.npcIds,
        npcScale: scene.characterVisuals.npcScale,
        runtimeSource: scene.characterVisuals.runtimeSource,
        npcPlacements: scene.characterVisuals.npcPlacements,
        npcRuntimeSources: scene.children.list
          .filter((object) => object.getData?.('characterId'))
          .map((object) => ({
            id: object.getData('characterId'),
            texture: object.texture.key,
            animation: object.anims?.currentAnim?.key || null,
            frameIndex: object.frame?.textureFrame ?? object.frame?.name ?? null,
            usesAsepriteRuntimeSheet: object.getData('usesAsepriteRuntimeSheet'),
          })),
      };
      scene.updatePlayerAnimation(performance.now(), { x: 1, y: 0 });
      const right = { animation: scene.playerVisualState.animation, facing: scene.playerVisualState.facing };
      scene.updatePlayerAnimation(performance.now(), { x: -1, y: 0 });
      const left = { animation: scene.playerVisualState.animation, facing: scene.playerVisualState.facing };
      scene.updatePlayerAnimation(performance.now(), { x: 0, y: -1 });
      const up = { animation: scene.playerVisualState.animation, facing: scene.playerVisualState.facing };
      scene.updatePlayerAnimation(performance.now(), { x: 0, y: 1 });
      const down = { animation: scene.playerVisualState.animation, facing: scene.playerVisualState.facing };
      return {
        ...before,
        playerDirections: { right, left, up, down },
      };
    });

    expect(visuals.playerScale).toBeGreaterThan(1.35);
    expect(visuals.npcScale).toBeGreaterThan(1.3);
    expect(visuals.runtimeSource).toBe('aseprite_final_character_sheets');
    expect(visuals.playerTexture).toBe('act1.zuzu.walk.sheet');
    expect(visuals.playerAnimation).toBe('zuzu.idle.down');
    expect(visuals.playerDirections).toEqual({
      right: { animation: 'zuzu.walk.right', facing: 'right' },
      left: { animation: 'zuzu.walk.left', facing: 'left' },
      up: { animation: 'zuzu.walk.up', facing: 'up' },
      down: { animation: 'zuzu.walk.down', facing: 'down' },
    });
    expect(visuals.npcIds).toEqual(['mr_chen', 'neighbor', 'auntie_mariam']);
    expect(visuals.animatedSheets).toEqual(expect.arrayContaining([
      'act1.npc.garage_mentor.talk.sheet',
      'act1.npc.neighbor.talk.sheet',
      'act1.npc.arabic_mentor.talk.sheet',
    ]));
    expect(visuals.npcRuntimeSources.every((npc) => npc.usesAsepriteRuntimeSheet)).toBe(true);
    expect(visuals.npcRuntimeSources.map((npc) => npc.texture)).toEqual([
      'act1.npc.garage_mentor.talk.sheet',
      'act1.npc.neighbor.talk.sheet',
      'act1.npc.arabic_mentor.talk.sheet',
    ]);
    expect(visuals.npcRuntimeSources.map((npc) => npc.animation)).toEqual([
      'chen.talk',
      'ramirez.talk',
      'mariam.talk',
    ]);
    expect(visuals.npcRuntimeSources.every((npc) => Number(npc.frameIndex) >= 0 && Number(npc.frameIndex) <= 3)).toBe(true);
    expect(visuals.npcPlacements).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'mr_chen', runtimeFinal: true }),
      expect.objectContaining({ id: 'neighbor', runtimeFinal: true }),
      expect.objectContaining({ id: 'auntie_mariam', runtimeFinal: true }),
    ]));
  });

  test('visual language state covers the full Act 1 loop without generated runtime art', async ({ page }) => {
    await ready(page);
    const visualLanguage = await page.evaluate(() => {
      const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
      return scene.visualLanguageState;
    });

    expect(visualLanguage.scope).toBe('complete_act1');
    expect(visualLanguage.generatedRuntimeArt).toBe(false);
    expect(visualLanguage.authoredBeats).toEqual(expect.arrayContaining([
      'garage_sanctuary',
      'npc_identity_cluster',
      'dry_wash_bridge_problem',
      'utm_tactile_testing',
      'ecology_living_patch',
      'chemistry_maker_surface',
      'field_notebook_reward',
      'bridge_repaired_payoff',
      'wider_map_tease',
    ]));
  });

  test('bridge planning rejects weak-only plans and accepts tested evidence', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => window.__GAME__.resetAct1());

    const weakOnly = await page.evaluate(() => window.__GAME__.completeBridgePlan('weak_scrap_only'));
    expect(weakOnly.ok).toBe(false);
    expect(weakOnly.reason).toBe('weak_materials_fail');

    const tooSoon = await page.evaluate(() => window.__GAME__.completeBridgePlan('tested_triangle_plan'));
    expect(tooSoon.ok).toBe(false);
    expect(tooSoon.reason).toBe('missing_tests');

    await page.evaluate(() => {
      window.__GAME__.handleInteraction('collect_materials');
      ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => window.__GAME__.testMaterial(id));
    });
    const accepted = await page.evaluate(() => window.__GAME__.completeBridgePlan('tested_triangle_plan'));
    expect(accepted.ok).toBe(true);
    expect(accepted.plan.loadPath).toEqual(['deck', 'support', 'triangle_brace', 'ground']);

    const lockedMap = await page.evaluate(() => window.__GAME__.unlockWiderMap());
    expect(lockedMap.ok).toBe(false);
    expect(lockedMap.reason).toBe('bridge_not_reconnected');
  });

  test('UTM tactile cues and bridge payoff are inspectable game state', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => window.__GAME__.resetAct1());

    await page.evaluate(() => {
      window.__GAME__.handleInteraction('collect_materials');
      ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => window.__GAME__.testMaterial(id));
      window.__GAME__.completeBridgePlan('tested_triangle_plan');
      window.__GAME__.repairBridge();
    });

    const state = await page.evaluate(() => window.__GAME__.getAct1State());
    expect(state.materialTests.tactileSummary.map((entry) => entry.materialId)).toEqual([
      'balsa',
      'pine',
      'bamboo',
      'brick',
      'concrete',
      'iron',
      'steel',
      'carbon_fiber',
    ]);
    expect(state.materialTests.tested.find((entry) => entry.materialId === 'balsa').tactileCue).toContain('fails too early');
    expect(state.bridge.repairMoment.childSummary).toContain('evidence');
    expect(state.bridge.crossingMoment.unlockHint).toContain('safe again');
    expect(state.notebook.unlocked).toContain('bridge_repaired');

    const feedback = await page.evaluate(() => window.__GAME__.getFeedbackState().last);
    expect(feedback.message).toContain('Bridge repaired');
    expect(feedback.details.repairMoment.socialAcknowledgement).toContain('tested');
  });

  test('diagnostics catch structural regressions and save corruption recovers safely', async ({ page }) => {
    await ready(page);
    const diagnostic = await page.evaluate(() => window.__GAME__.runAct1Diagnostic());
    expect(diagnostic.ok).toBe(true);
    expect(diagnostic.checks.dialogueObjectiveRefsValid).toBe(true);
    expect(diagnostic.checks.interactionsReachable).toBe(true);
    expect(diagnostic.checks.noGeneratedRuntimeArt).toBe(true);

    await page.evaluate(() => localStorage.setItem('bikebrowser.gameRebuild.act1', '{"bad":true}'));
    const loaded = await page.evaluate(() => window.__GAME__.loadGame());
    expect(loaded.ok).toBe(false);
    expect(loaded.reason).toBe('invalid_save');
    const state = await page.evaluate(() => window.__GAME__.getAct1State());
    expect(state.sceneReady).toBe(true);
  });

  test('quest architecture remains data-first and scene-light', () => {
    const scene = readFileSync('src/game/phaser/scenes/NeighborhoodScene.js', 'utf8');
    expect(scene).not.toContain('act1Quests');
    expect(scene).not.toContain('completedObjectives.add');
    expect(scene).toContain('handleInteraction');

    const assetRegistry = readFileSync('src/game/phaser/systems/AssetRegistry.js', 'utf8');
    expect(assetRegistry).toContain('generatedArtDirectRuntime: false');
  });
});
