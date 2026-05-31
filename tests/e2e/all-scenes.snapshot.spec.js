import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from 'playwright/test';
import { waitForGameBoot } from './helpers/gameBoot.js';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = path.join('playtest_captures', `all_scenes_${timestamp}`);

const legacySceneKeys = [
  'OverworldScene',
  'ZuzuGarageScene',
  'MaterialLabScene',
  'ThermalRigScene',
  'StreetBlockScene',
  'DogParkScene',
  'LakeEdgeScene',
  'SportsFieldsScene',
  'CommunityPoolScene',
  'DesertTrailScene',
  'MountainScene',
  'ExplainerScene',
  'CognitiveQuestScene',
  'WorldMapScene',
  'DesertForagingScene',
  'CopperMineScene',
  'SaltRiverScene',
  'DryWashScene',
  'GarageScene',
  'NeighborhoodScene',
];

function safeName(value) {
  return value.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

async function captureLegacyScene(page, sceneKey, index) {
  const result = await page.evaluate(async (key) => {
    const game = window.__phaserGame;
    if (!game?.scene) return { ok: false, reason: 'missing __phaserGame' };

    for (const scene of game.scene.scenes) {
      const activeKey = scene?.scene?.key;
      if (activeKey && activeKey !== key && scene.scene.isActive()) {
        game.scene.stop(activeKey);
      }
    }

    if (!game.scene.getScene(key)) {
      return { ok: false, reason: `scene not registered: ${key}` };
    }

    game.registry.set('playerPosition', { x: 400, y: 350, scene: key });
    const sceneData = {
      spawn: 'default',
      fromSnapshot: true,
      explainerId: 'flat_tire',
      questId: 'flat_tire_reasoning',
      returnSceneKey: 'StreetBlockScene',
    };
    game.scene.start(key, sceneData);

    await new Promise((resolve) => setTimeout(resolve, 450));
    const scene = game.scene.getScene(key);
    if (scene?.cameras?.main && scene?.player?.sprite) {
      scene.cameras.main.centerOn(scene.player.sprite.x, scene.player.sprite.y);
    }
    return { ok: Boolean(scene?.scene?.isActive?.()), activeScene: key };
  }, sceneKey);

  if (!result.ok) {
    writeFileSync(
      path.join(outputDir, `${String(index).padStart(2, '0')}_${safeName(sceneKey)}_FAILED.txt`),
      `${sceneKey}: ${result.reason || 'scene did not become active'}\n`,
      'utf8',
    );
    return { ok: false, sceneKey, reason: result.reason || 'scene did not become active' };
  }

  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(outputDir, `${String(index).padStart(2, '0')}_${safeName(sceneKey)}.png`),
    fullPage: true,
  });
  return { ok: true, sceneKey };
}

test.describe('all scene snapshots', () => {
  test('captures the Phaser rebuild Act 1 runtime states', async ({ page }) => {
    mkdirSync(outputDir, { recursive: true });
    await page.goto('/game-rebuild');
    await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
    await expect(page.locator('canvas')).toBeVisible();

    const states = [
      ['game_rebuild_start', 305, 506, null],
      ['game_rebuild_notebook', 650, 430, () => {
        window.__GAME__.handleInteraction('bike_check');
        window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook();
      }],
      ['game_rebuild_bridge', 1190, 574, () => window.__GAME__.handleInteraction('dry_wash')],
      ['game_rebuild_materials', 742, 408, () => {
        window.__GAME__.handleInteraction('collect_materials');
        ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => window.__GAME__.testMaterial(id));
      }],
      ['game_rebuild_ecology', 1030, 760, () => {
        window.__GAME__.observeEcology('mesquite');
        window.__GAME__.observeEcology('creosote');
        window.__GAME__.observeEcology('saguaro');
      }],
      ['game_rebuild_chemistry', 820, 444, () => window.__GAME__.runChemistryRecipe('sealant_patch')],
      ['game_rebuild_repaired_map', 1484, 514, () => {
        window.__GAME__.completeBridgePlan('tested_triangle_plan');
        window.__GAME__.repairBridge();
        window.__GAME__.unlockWiderMap();
      }],
    ];

    for (let i = 0; i < states.length; i += 1) {
      const [name, x, y, setup] = states[i];
      if (setup) await page.evaluate(setup);
      await page.evaluate(({ x, y }) => {
        const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
        scene.player.setPosition(x, y);
        scene.cameras.main.centerOn(x, y);
      }, { x, y });
      await page.waitForTimeout(180);
      await page.screenshot({
        path: path.join(outputDir, `${String(i + 1).padStart(2, '0')}_${name}.png`),
        fullPage: true,
      });
    }
  });

  test('captures every registered legacy Phaser scene', async ({ page }) => {
    mkdirSync(outputDir, { recursive: true });
    await waitForGameBoot(page, { route: '/legacy-play', timeout: 30_000 });
    await expect(page.locator('canvas')).toBeVisible();

    const results = [];
    for (let i = 0; i < legacySceneKeys.length; i += 1) {
      results.push(await captureLegacyScene(page, legacySceneKeys[i], i + 1));
    }
    writeFileSync(
      path.join(outputDir, 'legacy_scene_capture_manifest.json'),
      JSON.stringify(results, null, 2),
      'utf8',
    );
  });

  test('captures canonical Godot and 3D routes', async ({ page }) => {
    mkdirSync(outputDir, { recursive: true });

    await page.goto('/play');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, 'godot_canonical_play.png'), fullPage: true });

    await page.goto('/play3d');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, 'three_play3d.png'), fullPage: true });
  });
});
