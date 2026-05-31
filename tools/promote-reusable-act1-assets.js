import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(process.cwd());
const finalDir = join(root, 'src', 'game', 'art', 'final', 'act1');
const sourceDir = join(root, 'src', 'game', 'art', 'source', 'aseprite', 'act1');
const reusedDir = join(sourceDir, 'reused_sources');
mkdirSync(finalDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });
mkdirSync(reusedDir, { recursive: true });

const aseprite = 'C:\\Program Files\\Aseprite\\Aseprite.exe';

const src = {
  zuzuIdle: 'BikeBrowserWorld/Assets/Characters/Zuzu/RuntimeHD/Zuzu_idle_96.png',
  zuzuWalk: 'BikeBrowserWorld/Assets/Characters/Zuzu/Native96/zuzu_walk_native96_v1/sheet-transparent.png',
  zuzuRepair: 'BikeBrowserWorld/Assets/Characters/Zuzu/Forge/zuzu_repair_4dir_v1/sheet-transparent.png',
  mrsIdle: 'BikeBrowserWorld/Assets/Characters/MrsRamirez/MrsRamirez_idle.png',
  mrsTalk: 'BikeBrowserWorld/Assets/Characters/MrsRamirez/MrsRamirez_talk.png',
  mrsCheer: 'BikeBrowserWorld/Assets/Characters/MrsRamirez/MrsRamirez_cheer.png',
  mrChenIdle: 'BikeBrowserWorld/Assets/Characters/NPCs/MrChen/MrChen_idle.png',
  mrChenTalk: 'BikeBrowserWorld/Assets/Characters/NPCs/MrChen/MrChen_talk.png',
  mrChenRepair: 'BikeBrowserWorld/Assets/Characters/NPCs/MrChen/MrChen_repair.png',
  drMayaIdle: 'BikeBrowserWorld/Assets/Characters/DrMaya/DrMaya_idle/sheet-transparent.png',
  drMayaTalk: 'BikeBrowserWorld/Assets/Characters/DrMaya/DrMaya_talk/sheet-transparent.png',
  dryWash: 'BikeBrowserWorld/Assets/Props/DryWash/dry_wash_channel_tile.png',
  brokenBeam: 'BikeBrowserWorld/Assets/Props/DryWash/broken_bridge_beam.png',
  plank: 'BikeBrowserWorld/Assets/Props/DryWash/broken_bridge_plank.png',
  pier: 'BikeBrowserWorld/Assets/Props/DryWash/bridge_support_pier.png',
  segment: 'BikeBrowserWorld/Assets/Props/DryWash/test_bridge_segment.png',
  clipboard: 'BikeBrowserWorld/Assets/Props/DryWash/clipboard_bridge_plan.png',
  bridgePaper: 'BikeBrowserWorld/Assets/UI/BridgeNotebook/bridge_notebook_paper.png',
  bridgeCards: 'BikeBrowserWorld/Assets/UI/BridgeNotebook/bridge_family_cards.png',
  triangleStates: 'BikeBrowserWorld/Assets/UI/BridgeNotebook/triangle_truss_states.png',
  loadPath: 'BikeBrowserWorld/Assets/UI/BridgeNotebook/load_path_arrows.png',
  garageWall: 'BikeBrowserWorld/Assets/Backgrounds/Derived/garage_wall_panel.png',
  workbench: 'BikeBrowserWorld/Assets/Props/Garage/wooden_workbench_tools.png',
  pegboard: 'BikeBrowserWorld/Assets/Props/Garage/pegboard_tool_rack.png',
  stringLights: 'BikeBrowserWorld/Assets/Props/Garage/hanging_string_lights.png',
  poster: 'BikeBrowserWorld/Assets/Props/Garage/keep_pedaling_poster.png',
  toolbox: 'BikeBrowserWorld/Assets/Props/Garage/metal_toolbox.png',
  mesquite: 'public/assets/ecology/plants/mesquite.png',
  creosote: 'public/assets/ecology/plants/creosote.png',
  saguaro: 'public/assets/ecology/plants/saguaro.png',
  paloVerde: 'public/assets/ecology/plants/palo_verde.png',
  dryWashTerrain: 'public/assets/ecology/terrain/dry_wash.png',
  rubberStation: 'BikeBrowserWorld/Assets/Props/Labs/rubber_workshop_station.png',
  dryingTray: 'BikeBrowserWorld/Assets/Props/Labs/drying_tray.png',
  beakerBlue: 'BikeBrowserWorld/Assets/Props/Labs/beaker_blue_liquid.png',
  goggles: 'BikeBrowserWorld/Assets/Props/Labs/safety_goggles.png',
};

function abs(rel) {
  return join(root, rel);
}

async function sourceImage(rel) {
  return sharp(abs(rel)).png();
}

async function firstFrame(rel, frameSize = 96) {
  return sharp(abs(rel)).extract({ left: 0, top: 0, width: frameSize, height: frameSize }).png();
}

async function characterOut(rel, outName, tint = null) {
  const input = await firstFrame(rel);
  let img = input.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).resize({
    width: 58,
    height: 66,
    fit: 'inside',
    withoutEnlargement: true,
  });
  if (tint) {
    img = img.modulate(tint);
  }
  const resized = await img.png().toBuffer();
  const pngPath = join(finalDir, `${outName}.png`);
  await sharp({
    create: {
      width: 64,
      height: 72,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'south' }])
    .png()
    .toFile(pngPath);
  await makeAseprite(pngPath, outName);
}

async function makeAseprite(pngPath, outName) {
  await chromaKeyMagenta(pngPath);
  const sourcePng = join(sourceDir, `${outName}_source.png`);
  copyFileSync(pngPath, sourcePng);
  const asepritePath = join(sourceDir, `${outName}.aseprite`);
  if (existsSync(aseprite)) {
    execFileSync(aseprite, ['-b', sourcePng, '--save-as', asepritePath], { stdio: 'ignore' });
  }
}

async function chromaKeyMagenta(pngPath) {
  const image = sharp(pngPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (data[i + 3] < 24 || (r > 210 && g < 90 && b > 160)) {
      data[i + 3] = 0;
    }
  }
  const tmpPath = `${pngPath}.tmp`;
  await sharp(data, { raw: info }).png().toFile(tmpPath);
  copyFileSync(tmpPath, pngPath);
  unlinkSync(tmpPath);
}

async function composite(outName, width, height, layers) {
  const composites = [];
  for (const layer of layers) {
    let img = await sourceImage(layer.src);
    if (layer.extract) img = img.extract(layer.extract);
    img = img.resize({ width: layer.w, height: layer.h, fit: layer.fit || 'inside', withoutEnlargement: layer.noEnlarge ?? true });
    if (layer.tint) img = img.modulate(layer.tint);
    composites.push({ input: await img.png().toBuffer(), left: layer.x, top: layer.y });
  }
  const pngPath = join(finalDir, `${outName}.png`);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(pngPath);
  await makeAseprite(pngPath, outName);
}

async function copySourceSheet(rel, name) {
  const out = join(reusedDir, `${name}.png`);
  copyFileSync(abs(rel), out);
  if (existsSync(aseprite)) {
    execFileSync(aseprite, ['-b', out, '--save-as', join(reusedDir, `${name}.aseprite`)], { stdio: 'ignore' });
  }
}

await characterOut(src.zuzuIdle, 'zuzu');
await characterOut(src.mrChenIdle, 'npc_garage_mentor');
await characterOut(src.mrsIdle, 'npc_neighbor');
await characterOut(src.drMayaIdle, 'npc_arabic_mentor', { saturation: 0.92, brightness: 0.98 });

await composite('bridge_broken', 192, 88, [
  { src: src.dryWashTerrain, x: 0, y: 16, w: 192, h: 72, fit: 'cover', noEnlarge: false, tint: { brightness: 0.92, saturation: 0.88 } },
  { src: src.brokenBeam, x: 16, y: 20, w: 82, h: 54 },
  { src: src.plank, x: 94, y: 36, w: 72, h: 34 },
  { src: src.pier, x: 132, y: 28, w: 44, h: 46 },
]);
await composite('bridge_repaired', 192, 88, [
  { src: src.dryWashTerrain, x: 0, y: 16, w: 192, h: 72, fit: 'cover', noEnlarge: false, tint: { brightness: 0.94, saturation: 0.9 } },
  { src: src.segment, x: 30, y: 22, w: 132, h: 54 },
  { src: src.pier, x: 16, y: 36, w: 38, h: 38 },
  { src: src.pier, x: 138, y: 36, w: 38, h: 38 },
]);
await composite('notebook_ui', 160, 128, [
  { src: src.bridgePaper, x: 10, y: 7, w: 140, h: 90, fit: 'cover' },
  { src: src.triangleStates, x: 26, y: 24, w: 108, h: 28 },
  { src: src.loadPath, x: 32, y: 58, w: 92, h: 32 },
  { src: src.clipboard, x: 114, y: 78, w: 30, h: 30 },
]);

await composite('garage_workbench', 192, 128, [
  { src: src.garageWall, x: 0, y: 0, w: 192, h: 70, fit: 'cover' },
  { src: src.stringLights, x: 18, y: 8, w: 130, h: 28 },
  { src: src.pegboard, x: 28, y: 30, w: 48, h: 48 },
  { src: src.poster, x: 124, y: 26, w: 48, h: 34 },
  { src: src.workbench, x: 55, y: 62, w: 82, h: 58 },
  { src: src.toolbox, x: 20, y: 76, w: 34, h: 34 },
]);

await composite('ecology_tokens', 128, 96, [
  { src: src.dryWashTerrain, x: 0, y: 48, w: 128, h: 48, fit: 'cover' },
  { src: src.mesquite, x: 6, y: 18, w: 44, h: 44 },
  { src: src.creosote, x: 44, y: 28, w: 34, h: 34 },
  { src: src.saguaro, x: 78, y: 16, w: 34, h: 48 },
  { src: src.paloVerde, x: 92, y: 24, w: 34, h: 36 },
]);
await composite('chemistry_station', 112, 88, [
  { src: src.rubberStation, x: 12, y: 18, w: 58, h: 58 },
  { src: src.dryingTray, x: 58, y: 52, w: 42, h: 28 },
  { src: src.beakerBlue, x: 73, y: 22, w: 24, h: 30 },
  { src: src.goggles, x: 16, y: 62, w: 28, h: 18 },
]);

await copySourceSheet(src.zuzuWalk, 'zuzu_walk_native96_sheet');
await copySourceSheet(src.zuzuRepair, 'zuzu_repair_4dir_sheet');
await copySourceSheet(src.mrsTalk, 'mrs_ramirez_talk_sheet');
await copySourceSheet(src.mrsCheer, 'mrs_ramirez_cheer_sheet');
await copySourceSheet(src.mrChenTalk, 'mr_chen_talk_sheet');
await copySourceSheet(src.mrChenRepair, 'mr_chen_repair_sheet');
await copySourceSheet(src.drMayaTalk, 'auntie_mariam_style_reference_sheet');
await copySourceSheet(src.bridgeCards, 'bridge_notebook_family_cards');

console.log('Promoted reusable Act 1 graphics into final/source art folders.');
