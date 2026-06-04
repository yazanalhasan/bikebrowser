import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const outDir = path.resolve('project_audit/act1_prop_clarity_mission');
const evidenceDir = path.join(outDir, 'runtime_evidence');
const cropsDir = path.join(evidenceDir, 'crops');
mkdirSync(cropsDir, { recursive: true });

const baseUrl = process.env.BIKEBROWSER_BASE_URL || 'http://localhost:5173/game-rebuild';
const viewport = { width: 1280, height: 720 };

const states = [
  {
    id: 'locked_gps_start',
    player: { x: 430, y: 500 },
    setup: 'locked',
    notes: 'Current runtime before wider-map unlock; GPS shows known/locked city route context.',
  },
  {
    id: 'wider_gate_prompt',
    player: { x: 1484, y: 514 },
    setup: 'locked',
    notes: 'Player standing at the current wider-map gate affordance and prompt.',
  },
  {
    id: 'unlocked_gps_payoff',
    player: { x: 1484, y: 514 },
    setup: 'unlocked',
    notes: 'Current runtime after bridge repair and wider-map unlock.',
  },
];

const cropSpecs = [
  { id: 'gps_hud', left: 0, top: 385, width: 410, height: 335 },
  { id: 'workshop_props', left: 440, top: 130, width: 520, height: 420 },
  { id: 'bridge_gate_props', left: 900, top: 205, width: 380, height: 500 },
];

const trackedAssetIds = new Set([
  'map_gate',
  'prop_clarity_gps_post',
  'prop_clarity_world_scale_vista',
  'prop_clarity_route_marker_set',
  'prop_clarity_sonoran_landmark_set',
  'prop_replacement_garage_workbench',
  'prop_replacement_material_table',
  'prop_replacement_chemistry_bench',
  'prop_replacement_bridge_debris',
  'environment_vegetation_cluster',
  'ui_map_frame',
]);
const trackedAssetIdList = [...trackedAssetIds];

function scoreFromStats(stats, metadata) {
  const channels = stats.channels.slice(0, 3);
  const means = channels.map((channel) => channel.mean / 255);
  const stdevs = channels.map((channel) => channel.stdev / 255);
  const brightness = means.reduce((sum, value) => sum + value, 0) / means.length;
  const contrast = stdevs.reduce((sum, value) => sum + value, 0) / stdevs.length;
  const colorSeparation = Math.max(...means) - Math.min(...means);
  const informationDensity = Math.min(1, contrast * 3.2 + colorSeparation * 1.35);
  const childFacingReadability = Math.round(
    Math.max(0, Math.min(100, 32 + informationDensity * 46 + (brightness > 0.18 && brightness < 0.78 ? 14 : 0)))
  );
  return {
    width: metadata.width,
    height: metadata.height,
    brightness: Number(brightness.toFixed(3)),
    contrast: Number(contrast.toFixed(3)),
    colorSeparation: Number(colorSeparation.toFixed(3)),
    informationDensity: Number(informationDensity.toFixed(3)),
    childFacingReadability,
  };
}

async function captureState(page, state) {
  await page.evaluate(({ state }) => {
    const game = window.__GAME__;
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    game.resetAct1();
    if (state.setup === 'unlocked') {
      game.handleInteraction('bike_check');
      game.handleInteraction('dry_wash');
      game.handleInteraction('collect_materials');
      ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => game.testMaterial(id));
      game.completeBridgePlan('tested_triangle_plan');
      game.repairBridge();
      game.unlockWiderMap();
    }
    scene.player.setPosition(state.player.x, state.player.y);
    scene.cameras.main.centerOn(state.player.x, state.player.y);
    scene.registry.set('playerPosition', state.player);
  }, { state });
  await page.waitForTimeout(160);

  const screenshotPath = path.join(evidenceDir, `${state.id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const runtimeTruth = await page.evaluate((trackedIds) => {
    const trackedIdSet = new Set(trackedIds);
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    return {
      player: { x: Math.round(scene.player.x), y: Math.round(scene.player.y) },
      nearestInteraction: scene.interactions.nearest(scene.player)?.id || null,
      promptText: scene.prompt.visible ? scene.prompt.text : '',
      worldMapHud: scene.worldMapHudState,
      assetRegistry: window.__GAME__.getAssetRegistryState().act1Manifest.assets
        .filter((asset) => trackedIdSet.has(asset.id))
        .map((asset) => ({
          id: asset.id,
          finalKey: asset.finalKey,
          status: asset.status,
          approved: asset.approved === true,
          usingPlaceholder: asset.usingPlaceholder,
          runtimeUrl: asset.runtimeUrl || null,
        })),
    };
  }, trackedAssetIdList);

  const crops = [];
  for (const crop of cropSpecs) {
    const cropPath = path.join(cropsDir, `${state.id}_${crop.id}.png`);
    const cropBuffer = await sharp(screenshotPath).extract(crop).png().toBuffer();
    const stats = await sharp(cropBuffer).stats();
    const metadata = await sharp(cropBuffer).metadata();
    await sharp(cropBuffer).toFile(cropPath);
    crops.push({
      id: crop.id,
      file: path.relative(outDir, cropPath).replaceAll('\\', '/'),
      crop,
      scores: scoreFromStats(stats, metadata),
    });
  }
  return {
    id: state.id,
    file: path.relative(outDir, screenshotPath).replaceAll('\\', '/'),
    notes: state.notes,
    runtimeTruth,
    crops,
  };
}

async function makeContactSheet(captures) {
  const thumbs = [];
  for (const capture of captures) {
    for (const crop of capture.crops) {
      const input = path.join(outDir, crop.file);
      const thumb = await sharp(input)
        .resize({ width: 260, height: 190, fit: 'contain', background: '#16201d' })
        .extend({ top: 34, bottom: 16, left: 8, right: 8, background: '#f7f0dc' })
        .composite([{
          input: Buffer.from(
            `<svg width="276" height="240"><text x="8" y="20" font-family="Arial" font-size="13" fill="#203029">${capture.id} / ${crop.id}</text><text x="8" y="224" font-family="Arial" font-size="12" fill="#5a4a3b">readability ${crop.scores.childFacingReadability}/100</text></svg>`
          ),
          top: 0,
          left: 0,
        }])
        .png()
        .toBuffer();
      thumbs.push({ input: thumb });
    }
  }
  const columns = 3;
  const tileW = 276;
  const tileH = 240;
  const rows = Math.ceil(thumbs.length / columns);
  const sheetPath = path.join(evidenceDir, 'act1_prop_clarity_contact_sheet.png');
  await sharp({
    create: {
      width: columns * tileW,
      height: rows * tileH,
      channels: 4,
      background: '#203029',
    },
  })
    .composite(thumbs.map((thumb, index) => ({
      input: thumb.input,
      left: (index % columns) * tileW,
      top: Math.floor(index / columns) * tileH,
    })))
    .png()
    .toFile(sheetPath);
  return path.relative(outDir, sheetPath).replaceAll('\\', '/');
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport });
  await page.goto(baseUrl);
  await page.waitForFunction(() =>
    window.BIKEBROWSER_READY === true &&
    Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()) &&
    Boolean(window.__GAME__)
  );
  const captures = [];
  for (const state of states) {
    captures.push(await captureState(page, state));
  }
  const contactSheet = await makeContactSheet(captures);
  const report = {
    mission: 'mission_dbb100b325d6',
    portfolio: 'portfolio_06d1162143c8',
    scope: 'Act 1 prop clarity targeted runtime evidence for audit/prep package only',
    baseUrl,
    generatedAt: new Date().toISOString(),
    contactSheet,
    captures,
  };
  writeFileSync(path.join(outDir, 'runtime_readability_report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), path.join(outDir, 'runtime_readability_report.json'))}`);
  console.log(`Contact sheet: ${path.relative(process.cwd(), path.join(outDir, contactSheet))}`);
} finally {
  await browser.close();
}
