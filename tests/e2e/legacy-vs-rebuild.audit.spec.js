// legacy-vs-rebuild.audit.spec.js — Evidence-based runtime audit comparing the
// LEGACY Phaser game (/legacy-play, src/renderer/game) against the REBUILD
// Act-1 slice (/game-rebuild, src/game).
//
// Goal: honestly determine whether each route BOOTS and is PLAYABLE, capture
// screenshots, and dump runtime state (scenes, interactables, errors) to JSON
// so a human can ground their comparison in reality, not docs.
//
// Output:
//   playtest_captures/legacy_vs_rebuild/legacy_*.png
//   playtest_captures/legacy_vs_rebuild/rebuild_*.png
//   playtest_captures/legacy_vs_rebuild/legacy_runtime.json
//   playtest_captures/legacy_vs_rebuild/rebuild_runtime.json

import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from 'playwright/test';

const DIR = 'playtest_captures/legacy_vs_rebuild';

function collectConsole(page, sink) {
  page.on('pageerror', (err) => sink.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') sink.push(`console.error: ${msg.text()}`);
  });
}

// ---------------------------------------------------------------------------
// LEGACY  (/legacy-play, src/renderer/game)
// ---------------------------------------------------------------------------
test('LEGACY /legacy-play runtime audit', async ({ page }) => {
  mkdirSync(DIR, { recursive: true });
  const errors = [];
  collectConsole(page, errors);

  await page.goto('/legacy-play', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. Splash screen
  await page.screenshot({ path: `${DIR}/legacy_00_splash.png`, fullPage: true });
  const splashText = await page.evaluate(() => document.body.innerText.slice(0, 600));

  // 2. Click Start Adventure / Continue
  let started = false;
  for (const name of ['Start Adventure!', 'Continue Adventure', 'New Game', 'Start']) {
    try {
      await page.getByRole('button', { name }).click({ timeout: 2500 });
      started = true;
      break;
    } catch { /* try next */ }
  }

  // 3. Wait for Phaser game handle (DEV-only).
  let booted = false;
  try {
    await page.waitForFunction(() => Boolean(window.__phaserGame), null, { timeout: 20000 });
    booted = true;
  } catch { booted = false; }

  // 4. Wait for an active scene.
  let activeSceneFound = false;
  if (booted) {
    try {
      await page.waitForFunction(() => {
        const g = window.__phaserGame;
        return g && g.scene && g.scene.scenes &&
          g.scene.scenes.some((s) => s.scene && s.scene.isActive());
      }, null, { timeout: 20000 });
      activeSceneFound = true;
    } catch { activeSceneFound = false; }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/legacy_01_after_start.png`, fullPage: true });

  // 5. Dump runtime scene state.
  const runtime = await page.evaluate(() => {
    const out = {
      hasPhaserGame: Boolean(window.__phaserGame),
      runtimeAudit: window.__runtimeAuditResult
        ? JSON.parse(JSON.stringify(window.__runtimeAuditResult))
        : null,
      scenes: [],
      activeScenes: [],
      canvasSize: null,
    };
    const g = window.__phaserGame;
    if (g && g.scene && g.scene.scenes) {
      for (const s of g.scene.scenes) {
        const key = s.scene?.key;
        const active = Boolean(s.scene?.isActive && s.scene.isActive());
        const visible = Boolean(s.scene?.isVisible && s.scene.isVisible());
        out.scenes.push({ key, active, visible });
        if (active) {
          // Count interactive game objects on the active scene.
          let interactiveCount = 0;
          let textSamples = [];
          try {
            const list = s.children?.list || [];
            for (const obj of list) {
              if (obj.input && obj.input.enabled) interactiveCount++;
              if (obj.type === 'Text' && obj.text && textSamples.length < 25) {
                const t = String(obj.text).trim();
                if (t) textSamples.push(t.slice(0, 80));
              }
            }
          } catch { /* ignore */ }
          out.activeScenes.push({
            key,
            childCount: s.children?.list?.length || 0,
            interactiveCount,
            textSamples,
            hasPlayer: Boolean(s.player),
            playerPos: s.player ? { x: Math.round(s.player.x), y: Math.round(s.player.y) } : null,
          });
        }
      }
    }
    const canvas = document.querySelector('canvas');
    if (canvas) out.canvasSize = { w: canvas.width, h: canvas.height };
    return out;
  });

  // 6. Try to interact: move player with arrow keys, screenshot.
  let movement = null;
  if (activeSceneFound) {
    const before = await page.evaluate(() => {
      const g = window.__phaserGame;
      const s = g.scene.scenes.find((x) => x.scene.isActive() && x.player);
      return s && s.player ? { x: Math.round(s.player.x), y: Math.round(s.player.y), scene: s.scene.key } : null;
    });
    await page.locator('canvas').click({ position: { x: 400, y: 300 }, timeout: 3000 }).catch(() => {});
    for (let i = 0; i < 12; i++) { await page.keyboard.down('ArrowRight'); await page.waitForTimeout(60); }
    await page.keyboard.up('ArrowRight');
    for (let i = 0; i < 12; i++) { await page.keyboard.down('ArrowDown'); await page.waitForTimeout(60); }
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => {
      const g = window.__phaserGame;
      const s = g.scene.scenes.find((x) => x.scene.isActive() && x.player);
      return s && s.player ? { x: Math.round(s.player.x), y: Math.round(s.player.y), scene: s.scene.key } : null;
    });
    movement = { before, after, moved: Boolean(before && after && (before.x !== after.x || before.y !== after.y)) };
    await page.screenshot({ path: `${DIR}/legacy_02_after_move.png`, fullPage: true });
  }

  // 7. Try to reach the overworld / world map by direct scene start (probe
  //    reachability of the big scene roster without needing in-game nav).
  const sceneProbe = await page.evaluate(async () => {
    const g = window.__phaserGame;
    const probe = [];
    if (!g) return probe;
    const targets = ['OverworldScene', 'WorldMapScene', 'MaterialLabScene', 'DryWashScene',
      'CopperMineScene', 'DesertForagingScene', 'MountainScene', 'LakeEdgeScene',
      'CommunityPoolScene', 'DogParkScene', 'CognitiveQuestScene', 'DesertTrailScene'];
    for (const key of targets) {
      const exists = Boolean(g.scene.getScene ? g.scene.getScene(key) : null);
      probe.push({ key, registered: exists });
    }
    return probe;
  });

  runtime.splashText = splashText;
  runtime.startedClicked = started;
  runtime.booted = booted;
  runtime.activeSceneFound = activeSceneFound;
  runtime.movement = movement;
  runtime.sceneProbe = sceneProbe;
  runtime.consoleErrors = errors;

  // 8. If we got the overworld, screenshot it after a forced start.
  if (booted) {
    await page.evaluate(() => {
      const g = window.__phaserGame;
      try { if (g.scene.getScene('OverworldScene')) { g.scene.start('OverworldScene'); } } catch {}
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${DIR}/legacy_03_overworld_attempt.png`, fullPage: true });
    const ovw = await page.evaluate(() => {
      const g = window.__phaserGame;
      const s = g.scene.scenes.find((x) => x.scene.isActive());
      return s ? { key: s.scene.key, children: s.children?.list?.length || 0 } : null;
    });
    runtime.overworldAfterForceStart = ovw;
  }

  writeFileSync(`${DIR}/legacy_runtime.json`, JSON.stringify(runtime, null, 2));
  // eslint-disable-next-line no-console
  console.log('[LEGACY] booted=%s activeScene=%s errors=%d', booted, activeSceneFound, errors.length);
});

// ---------------------------------------------------------------------------
// REBUILD  (/game-rebuild, src/game)
// ---------------------------------------------------------------------------
test('REBUILD /game-rebuild runtime audit', async ({ page }) => {
  mkdirSync(DIR, { recursive: true });
  const errors = [];
  collectConsole(page, errors);

  await page.goto('/game-rebuild', { waitUntil: 'domcontentloaded' });

  let booted = false;
  try {
    await page.waitForFunction(() =>
      window.BIKEBROWSER_READY === true &&
      Boolean(window.__GAME__) &&
      Boolean(window.__bikebrowserRebuildGame), null, { timeout: 25000 });
    booted = true;
  } catch { booted = false; }

  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/rebuild_00_start.png`, fullPage: true });

  const runtime = await page.evaluate(() => {
    const out = { booted: window.BIKEBROWSER_READY === true, scenes: [], activeScenes: [] };
    const g = window.__bikebrowserRebuildGame;
    if (g && g.scene && g.scene.scenes) {
      for (const s of g.scene.scenes) {
        const active = Boolean(s.scene?.isActive && s.scene.isActive());
        out.scenes.push({ key: s.scene?.key, active });
        if (active) {
          let interactiveCount = 0; let textSamples = [];
          try {
            for (const obj of (s.children?.list || [])) {
              if (obj.input && obj.input.enabled) interactiveCount++;
              if (obj.type === 'Text' && obj.text && textSamples.length < 25) {
                const t = String(obj.text).trim();
                if (t) textSamples.push(t.slice(0, 80));
              }
            }
          } catch {}
          out.activeScenes.push({
            key: s.scene?.key,
            childCount: s.children?.list?.length || 0,
            interactiveCount,
            textSamples,
            hasPlayer: Boolean(s.player),
          });
        }
      }
    }
    return out;
  });

  // Drive the full Act-1 happy path (mirrors existing acceptance spec).
  const flow = [];
  async function step(label, fn) {
    try { await fn(); flow.push({ label, ok: true }); }
    catch (e) { flow.push({ label, ok: false, error: String(e).slice(0, 160) }); }
    await page.waitForTimeout(250);
  }

  await step('bike_check', () => page.evaluate(() => window.__GAME__.handleInteraction('bike_check')));
  await page.screenshot({ path: `${DIR}/rebuild_01_bike_check.png`, fullPage: true });
  await step('dry_wash', () => page.evaluate(() => window.__GAME__.handleInteraction('dry_wash')));
  await page.screenshot({ path: `${DIR}/rebuild_02_dry_wash.png`, fullPage: true });
  await step('collect_materials', () => page.evaluate(() => window.__GAME__.handleInteraction('collect_materials')));
  await step('test_materials', () => page.evaluate(() =>
    ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'].forEach((id) => window.__GAME__.testMaterial(id))));
  await page.screenshot({ path: `${DIR}/rebuild_03_material_tests.png`, fullPage: true });
  await step('bridge_plan', () => page.evaluate(() => window.__GAME__.completeBridgePlan('tested_triangle_plan')));
  await step('repair_bridge', () => page.evaluate(() => window.__GAME__.repairBridge()));
  await step('unlock_map', () => page.evaluate(() => window.__GAME__.unlockWiderMap()));
  await page.screenshot({ path: `${DIR}/rebuild_04_bridge_repaired_map.png`, fullPage: true });
  await step('open_notebook', () => page.evaluate(() =>
    window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook()));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/rebuild_05_notebook.png`, fullPage: true });

  runtime.flow = flow;
  runtime.consoleErrors = errors;
  writeFileSync(`${DIR}/rebuild_runtime.json`, JSON.stringify(runtime, null, 2));
  // eslint-disable-next-line no-console
  console.log('[REBUILD] booted=%s errors=%d', booted, errors.length);
});
