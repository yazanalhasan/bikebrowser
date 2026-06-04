import { act1AssetManifest, getAct1AssetManifestState } from '../../data/act1/index.js';

export const ASSET_KEYS = {
  zuzu: 'placeholder.zuzu',
  zuzuWalkSheet: 'act1.zuzu.walk.sheet',
  zuzuRepairSheet: 'act1.zuzu.repair.sheet',
  bike: 'placeholder.bike',
  house: 'placeholder.house',
  street: 'placeholder.street',
  desertWash: 'placeholder.desertWash',
  bridge: 'placeholder.bridge',
  repairStation: 'placeholder.repairStation',
  garage: 'placeholder.garage',
  workbench: 'placeholder.workbench',
  utmRig: 'placeholder.utmRig',
  ecologyPlant: 'placeholder.ecologyPlant',
  chemistryStation: 'placeholder.chemistryStation',
  mapGate: 'placeholder.mapGate',
  mapGateFinal: 'act1.map_gate',
  garageWorkbench: 'act1.garage_workbench',
  materialSamples: 'act1.material_samples',
  bridgeBroken: 'act1.bridge_broken',
  bridgeRepaired: 'act1.bridge_repaired',
  notebookUi: 'act1.notebook_ui',
  hudFrame: 'act1.hud_frame',
  npcGarageMentor: 'act1.npc.garage_mentor',
  npcNeighbor: 'act1.npc.neighbor',
  npcArabicMentor: 'act1.npc.arabic_mentor',
  npcGarageMentorTalkSheet: 'act1.npc.garage_mentor.talk.sheet',
  npcGarageMentorRepairSheet: 'act1.npc.garage_mentor.repair.sheet',
  npcNeighborTalkSheet: 'act1.npc.neighbor.talk.sheet',
  npcNeighborCheerSheet: 'act1.npc.neighbor.cheer.sheet',
  npcArabicMentorTalkSheet: 'act1.npc.arabic_mentor.talk.sheet',
  notebook: 'placeholder.notebook',
  schoolNode: 'placeholder.schoolNode',
  npc: 'placeholder.npc',
  questMarker: 'placeholder.questMarker',
  routeMarkers: 'act1.route_marker.frames',
  interactionMarker: 'placeholder.interactionMarker',
  dialogueBubble: 'placeholder.dialogueBubble',
  toolItem: 'placeholder.toolItem',
  wave1SonoranVistaDraft: 'act1.wave1.sonoran_vista.draft',
  wave1RoadSystemDraft: 'act1.wave1.road_system.draft',
  housePueblo01Draft: 'act1.house.pueblo_01.draft',
  housePueblo02Draft: 'act1.house.pueblo_02.draft',
  houseMission01Draft: 'act1.house.mission_01.draft',
  houseTerritorial01Draft: 'act1.house.territorial_01.draft',
  vegetationSaguaroClusterDraft: 'act1.vegetation.saguaro_cluster.draft',
  questMarkerStoryDraft: 'act1.quest_marker.story.draft',
  propClarityGpsPost: 'act1.prop_clarity.gps_post',
  propClarityWorldScaleVista: 'act1.prop_clarity.world_scale_vista',
  propClarityRouteMarkerSet: 'act1.prop_clarity.route_marker_set',
  propClaritySonoranLandmarkSet: 'act1.prop_clarity.sonoran_landmark_set',
  propReplacementGarageWorkbench: 'act1.prop_replacement.garage_workbench',
  propReplacementMaterialTable: 'act1.prop_replacement.material_table',
  propReplacementChemistryBench: 'act1.prop_replacement.chemistry_bench',
  propReplacementBridgeDebris: 'act1.prop_replacement.bridge_debris',
  environmentSonoranMountainVista: 'act1.environment.sonoran_mountain_vista',
  environmentDesertRoadSystem: 'act1.environment.desert_road_system',
  environmentVegetationCluster: 'act1.environment.vegetation_cluster',
  environmentEcologyPatch: 'act1.environment.ecology_patch',
  saltRiverBackground: 'act1.biome.salt_river.background',
  washEdgeBackdrop: 'act1.ecology.backdrop.wash_edge',
  openFlatBackdrop: 'act1.ecology.backdrop.open_flat',
  saltFlatBackdrop: 'act1.biome.backdrop.salt_flat',
  freshBankBackdrop: 'act1.biome.backdrop.fresh_bank',
  dryTerraceBackdrop: 'act1.biome.backdrop.dry_terrace',
  saltCrossingBackdrop: 'act1.biome.backdrop.salt_crossing',
  washScourBackdrop: 'act1.investigation.backdrop.wash_scour',
  greenWashBackdrop: 'act1.investigation.backdrop.green_wash',
  utmRigBackdrop: 'act1.prediction.backdrop.utm_rig',
  washCrossingBackdrop: 'act1.bridge.backdrop.wash_crossing',
  saltbushPlant: 'act1.biome.saltbush.plant',
  cottonwoodPlant: 'act1.biome.cottonwood.plant',
  uiNpcCueWrench: 'act1.ui.npc_cue_wrench',
  uiNpcCueHeart: 'act1.ui.npc_cue_heart',
  uiNpcCueStar: 'act1.ui.npc_cue_star',
  uiMapFrame: 'act1.ui.map_frame',
};

export const ACT1_CHARACTER_ANIMATION_SHEETS = [
  {
    key: ASSET_KEYS.zuzuWalkSheet,
    url: new URL('../../art/final/act1/characters/zuzu_walk_native96_sheet.png', import.meta.url).href,
    frameWidth: 96,
    frameHeight: 96,
  },
  {
    key: ASSET_KEYS.zuzuRepairSheet,
    url: new URL('../../art/final/act1/characters/zuzu_repair_4dir_sheet.png', import.meta.url).href,
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: ASSET_KEYS.npcGarageMentorTalkSheet,
    url: new URL('../../art/final/act1/characters/mr_chen_talk_sheet.png', import.meta.url).href,
    frameWidth: 96,
    frameHeight: 96,
  },
  {
    key: ASSET_KEYS.npcGarageMentorRepairSheet,
    url: new URL('../../art/final/act1/characters/mr_chen_repair_sheet.png', import.meta.url).href,
    frameWidth: 96,
    frameHeight: 96,
  },
  {
    key: ASSET_KEYS.npcNeighborTalkSheet,
    url: new URL('../../art/final/act1/characters/mrs_ramirez_talk_sheet.png', import.meta.url).href,
    frameWidth: 96,
    frameHeight: 96,
  },
  {
    key: ASSET_KEYS.npcNeighborCheerSheet,
    url: new URL('../../art/final/act1/characters/mrs_ramirez_cheer_sheet.png', import.meta.url).href,
    frameWidth: 96,
    frameHeight: 96,
  },
  {
    key: ASSET_KEYS.npcArabicMentorTalkSheet,
    url: new URL('../../art/final/act1/characters/auntie_mariam_style_reference_sheet.png', import.meta.url).href,
    frameWidth: 96,
    frameHeight: 96,
  },
];

export const PLACEHOLDER_ASSET_CONTRACT = {
  source: 'generated_phaser_geometry',
  runtimeTier: 'clean_placeholder',
  generatedArtDirectRuntime: false,
  finalArtRequiresAseprite: true,
  keys: Object.keys(ASSET_KEYS),
};

export function getAssetRegistryState() {
  return {
    placeholderContract: { ...PLACEHOLDER_ASSET_CONTRACT },
    act1Manifest: getAct1AssetManifestState(),
  };
}

export function loadAct1FinalAssets(scene) {
  const loadedPlaceholderKeys = new Set();
  for (const asset of act1AssetManifest) {
    if (!['final_ready', 'draft'].includes(asset.status) || !asset.runtimeUrl) continue;
    if (asset.placeholderKey && !loadedPlaceholderKeys.has(asset.placeholderKey) && !scene.textures.exists(asset.placeholderKey)) {
      scene.load.image(asset.placeholderKey, asset.runtimeUrl);
      loadedPlaceholderKeys.add(asset.placeholderKey);
    }
    if (asset.finalKey && !scene.textures.exists(asset.finalKey)) {
      scene.load.image(asset.finalKey, asset.runtimeUrl);
    }
  }
}

// The route-marker set (final art) as a 4-frame 48x48 sheet:
//   0 = current/here, 1 = quest, 2 = locked, 3 = complete.
// Used for the in-world quest pins (replaces the flat placeholder marker).
export function loadAct1RouteMarkerSheet(scene) {
  if (scene.textures.exists(ASSET_KEYS.routeMarkers)) return;
  scene.load.spritesheet(
    ASSET_KEYS.routeMarkers,
    new URL('../../art/final/act1/prop_clarity_route_marker_set.png', import.meta.url).href,
    { frameWidth: 48, frameHeight: 48 },
  );
}

export const ROUTE_MARKER_FRAME = { current: 0, quest: 1, locked: 2, complete: 3 };

export function loadAct1CharacterAnimationSheets(scene) {
  for (const sheet of ACT1_CHARACTER_ANIMATION_SHEETS) {
    if (scene.textures.exists(sheet.key)) continue;
    scene.load.spritesheet(sheet.key, sheet.url, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
    });
  }
}

export function createPlaceholderTextures(scene) {
  createZuzu(scene);
  createBike(scene);
  createHouse(scene);
  createStreet(scene);
  createDesertWash(scene);
  createBridge(scene);
  createRepairStation(scene);
  createGarage(scene);
  createWorkbench(scene);
  createUtmRig(scene);
  createEcologyPlant(scene);
  createChemistryStation(scene);
  createMapGate(scene);
  createSaltRiverBackground(scene);
  createEnvironmentBackdrops(scene);
  createSceneContextBackdrops(scene);
  createSaltbushPlant(scene);
  createCottonwoodPlant(scene);
  createNotebook(scene);
  createSchoolNode(scene);
  createNpc(scene);
  createQuestMarker(scene);
  createInteractionMarker(scene);
  createDialogueBubble(scene);
  createToolItem(scene);
}

function texture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

// Shared art palette + helpers for a cohesive clean-vector look (soft ground
// shadow, dark warm outlines, two-tone shading). Keeps the generated placeholder
// props visually consistent with the loaded pixel-art props.
const OUTLINE = 0x241b14;

function shadow(g, x, y, w, h = null) {
  g.fillStyle(0x000000, 0.18).fillEllipse(x, y, w, h ?? Math.max(5, w * 0.22));
}

function pebble(g, x, y, r, fill = 0xb68f62) {
  g.fillStyle(OUTLINE, 0.34).fillEllipse(x + 1, y + 1, r * 2.2, r * 1.25);
  g.fillStyle(fill, 1).fillEllipse(x, y, r * 2, r * 1.15);
  g.fillStyle(0xe4c494, 0.7).fillEllipse(x - r * 0.35, y - r * 0.18, r * 0.8, r * 0.35);
}

function grassTuft(g, x, y, color = 0x8a7d43) {
  g.lineStyle(3, OUTLINE, 0.75);
  g.lineBetween(x, y, x - 7, y - 22).lineBetween(x, y, x + 4, y - 26).lineBetween(x, y, x + 11, y - 16);
  g.lineStyle(1.7, color, 1);
  g.lineBetween(x, y, x - 7, y - 22).lineBetween(x, y, x + 4, y - 26).lineBetween(x, y, x + 11, y - 16);
}

function drawBackdropFrame(g, sky, horizon, ground, groundShade) {
  g.fillStyle(OUTLINE, 1).fillRoundedRect(0, 0, 1120, 360, 18);
  g.fillStyle(sky, 1).fillRoundedRect(6, 6, 1108, 348, 14);
  g.fillStyle(horizon, 1).fillRect(6, 118, 1108, 76);
  g.fillStyle(ground, 1).fillRoundedRect(6, 192, 1108, 162, 10);
  g.fillStyle(groundShade, 1).fillRect(6, 292, 1108, 62);
  g.lineStyle(5, OUTLINE, 0.72).lineBetween(6, 288, 1114, 288);
}

function createEnvironmentBackdrops(scene) {
  texture(scene, ASSET_KEYS.washEdgeBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xf8d894, 0xd39a5c, 0xc8945d, 0x9b6840);
    g.fillStyle(0xffefb8, 0.94).fillCircle(932, 64, 46);
    g.fillStyle(0xf9c878, 0.8).fillCircle(932, 64, 64);
    g.fillStyle(0xba7a43, 1).fillTriangle(6, 186, 360, 128, 710, 198);
    g.fillStyle(0xe0ae72, 1).fillTriangle(6, 182, 270, 138, 520, 196);
    g.fillStyle(OUTLINE, 0.86).fillRoundedRect(698, 202, 416, 92, 8);
    g.fillStyle(0xaa6f42, 1).fillRoundedRect(706, 206, 406, 80, 8);
    g.fillStyle(0xd8a069, 1).fillRoundedRect(706, 206, 406, 24, 8);
    g.fillStyle(0x6f4a30, 0.7).fillRoundedRect(718, 258, 370, 30, 8);
    g.lineStyle(4, 0x7a5134, 0.72).lineBetween(724, 234, 1072, 252).lineBetween(746, 270, 1064, 278);
    g.fillStyle(0xd5a06b, 1).fillEllipse(402, 286, 820, 112);
    g.fillStyle(0xe4bb7e, 1).fillEllipse(376, 260, 720, 54);
    g.lineStyle(3, 0x7d5537, 0.82);
    for (const crack of [[132, 284, 214, 304, 176, 326], [312, 278, 402, 300, 438, 332], [586, 282, 650, 308, 630, 344], [812, 292, 870, 318, 948, 320]]) {
      g.lineBetween(crack[0], crack[1], crack[2], crack[3]).lineBetween(crack[2], crack[3], crack[4], crack[5]);
    }
    for (const p of [[70, 300, 7], [238, 258, 5], [520, 312, 8], [760, 270, 6], [1010, 318, 7]]) pebble(g, ...p);
    for (const t of [[92, 248], [674, 246], [1038, 238], [784, 314]]) grassTuft(g, t[0], t[1], 0xa68d4e);
  });

  texture(scene, ASSET_KEYS.openFlatBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xf2d99e, 0xcaa56e, 0xd2b07b, 0xb98f5e);
    g.fillStyle(0xdab67a, 1).fillRect(6, 170, 1108, 36);
    g.fillStyle(0xb98755, 0.75).fillRoundedRect(92, 150, 238, 28, 16).fillRoundedRect(772, 156, 180, 22, 12);
    g.lineStyle(3, 0xffedc0, 0.55).lineBetween(42, 220, 1078, 206);
    g.fillStyle(0xddbc88, 1).fillEllipse(560, 284, 980, 118);
    g.fillStyle(0xe8cb97, 1).fillEllipse(488, 250, 820, 56);
    g.fillStyle(0xbf986a, 0.6);
    for (const [x, y, w] of [[72, 318, 90], [220, 276, 54], [504, 308, 76], [804, 264, 46], [980, 318, 82]]) g.fillEllipse(x, y, w, 14);
    for (const p of [[102, 292, 5], [184, 316, 4], [356, 260, 3], [486, 292, 5], [642, 322, 4], [778, 284, 4], [918, 306, 5], [1052, 266, 3]]) pebble(g, ...p, 0xa8794c);
    grassTuft(g, 952, 250, 0x9a8748);
  });

  texture(scene, ASSET_KEYS.saltFlatBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xdcebbd, 0xb7c894, 0xe8e6cc, 0xc6d5c1);
    g.fillStyle(0x8fbfc0, 1).fillRoundedRect(4, 198, 1112, 72, 26);
    g.fillStyle(0x60999d, 1).fillRoundedRect(4, 234, 1112, 38, 18);
    g.fillStyle(0xbce2db, 0.82).fillRoundedRect(34, 208, 1000, 18, 10);
    g.fillStyle(0xf8f4df, 1);
    for (const [x, y, w, h] of [[54, 284, 190, 34], [242, 258, 180, 28], [426, 296, 226, 38], [706, 264, 198, 30], [904, 302, 178, 34]]) {
      g.fillRoundedRect(x, y, w, h, 12);
      g.fillStyle(0xd7d0b4, 1).fillRoundedRect(x + w * 0.52, y + h - 8, w * 0.42, 6, 3);
      g.fillStyle(0xf8f4df, 1);
    }
    g.lineStyle(3, 0xb6aa87, 0.75);
    for (const [x, y, w] of [[72, 302, 130], [286, 274, 108], [472, 316, 156], [758, 282, 118], [936, 320, 118]]) g.lineBetween(x, y, x + w, y + 6);
    g.fillStyle(0xfefbea, 0.9).fillRoundedRect(100, 242, 160, 8, 4).fillRoundedRect(648, 224, 220, 8, 4);
    for (const t of [[84, 278], [1038, 284], [978, 236]]) grassTuft(g, t[0], t[1], 0x9aa06d);
  });

  texture(scene, ASSET_KEYS.freshBankBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xbfe7c8, 0x89b670, 0x7fa05d, 0x5f7b43);
    g.fillStyle(0x7db7b2, 1).fillRoundedRect(8, 214, 1104, 54, 22);
    g.fillStyle(0xb7e5de, 0.86).fillRoundedRect(40, 222, 820, 14, 8);
    g.fillStyle(0x9fc076, 1).fillTriangle(6, 206, 450, 156, 1114, 212);
    g.fillStyle(0x6e8f50, 1).fillRoundedRect(0, 250, 1120, 52, 16);
    g.fillStyle(0x486234, 0.9).fillRoundedRect(0, 288, 1120, 66, 8);
    g.lineStyle(5, OUTLINE, 0.72).lineBetween(6, 286, 1114, 286);
    for (const [x, h] of [[132, 92], [202, 120], [874, 100], [952, 78]]) {
      shadow(g, x, 286, 60, 12);
      g.fillStyle(OUTLINE, 1).fillRoundedRect(x - 10, 144, 22, h, 8);
      g.fillStyle(0x8a5a38, 1).fillRoundedRect(x - 7, 148, 16, h - 4, 6);
      g.fillStyle(0xb8845a, 1).fillRoundedRect(x - 5, 150, 5, h - 8, 4);
      g.fillStyle(OUTLINE, 1).fillCircle(x, 126, 46);
      g.fillStyle(0x6fae54, 1).fillCircle(x, 126, 41);
      g.fillStyle(0x9ad57b, 0.9).fillCircle(x - 14, 110, 14);
    }
    g.fillStyle(0x9fd080, 1);
    for (const [x, y] of [[70, 300], [312, 272], [486, 314], [660, 270], [1032, 306]]) g.fillEllipse(x, y, 70, 24);
    g.fillStyle(0xaedbd1, 0.75).fillRoundedRect(386, 274, 166, 10, 5);
  });

  texture(scene, ASSET_KEYS.dryTerraceBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xefcf91, 0xc49b65, 0xcda36e, 0x9c714a);
    g.fillStyle(0xb98a57, 1).fillRoundedRect(6, 184, 1108, 62, 18);
    g.fillStyle(0xe0ba84, 1).fillRoundedRect(6, 184, 1108, 24, 16);
    g.fillStyle(OUTLINE, 0.52).fillRoundedRect(42, 238, 1036, 24, 10);
    g.fillStyle(0x7aa8a0, 0.58).fillRoundedRect(118, 306, 868, 18, 9);
    g.fillStyle(0x5f7f75, 0.42).fillRoundedRect(258, 326, 520, 12, 6);
    g.fillStyle(0xd7ad77, 1).fillEllipse(548, 284, 920, 100);
    g.fillStyle(0xe6c38e, 1).fillEllipse(500, 254, 760, 46);
    g.lineStyle(3, 0x7f5637, 0.7).lineBetween(82, 250, 1010, 246);
    g.lineStyle(2, 0xf0d39d, 0.7).lineBetween(120, 218, 1060, 212);
    for (const p of [[116, 292, 4], [244, 264, 5], [440, 310, 5], [692, 278, 4], [854, 318, 5], [1034, 270, 4]]) pebble(g, ...p, 0xad7d4f);
    for (const t of [[168, 248], [730, 242], [970, 254]]) grassTuft(g, t[0], t[1], 0xa58b4b);
  });

  texture(scene, ASSET_KEYS.saltCrossingBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xc4dcc5, 0x9db36c, 0x8b7f58, 0x5d6048);
    g.fillStyle(0x8aa469, 1).fillRect(6, 152, 1108, 54);
    g.fillStyle(0x5d8f91, 1).fillRoundedRect(0, 184, 1120, 170, 20);
    g.fillStyle(0x3f7478, 1).fillRoundedRect(0, 244, 1120, 110, 12);
    g.fillStyle(0x916d43, 0.38).fillRoundedRect(0, 208, 1120, 36, 18).fillRoundedRect(0, 308, 1120, 28, 14);
    g.lineStyle(5, 0xb8dad1, 0.86);
    for (const y of [208, 238, 270, 304]) {
      g.beginPath();
      g.moveTo(22, y);
      for (let x = 90; x < 1100; x += 120) g.lineTo(x, y + (x % 240 === 0 ? -12 : 10));
      g.strokePath();
    }
    g.fillStyle(OUTLINE, 1).fillRoundedRect(514, 118, 80, 214, 10);
    g.fillStyle(0x8b6f4a, 1).fillRoundedRect(520, 124, 68, 202, 8);
    g.fillStyle(0xb7955f, 1).fillRoundedRect(520, 124, 68, 36, 8);
    g.fillStyle(0x5b4935, 1).fillRoundedRect(524, 264, 60, 62, 8);
    g.fillStyle(0x77c5bd, 0.62).fillRoundedRect(450, 274, 200, 18, 9);
    g.fillStyle(0xf0b86f, 0.64).fillRoundedRect(530, 178, 44, 10, 5).fillRoundedRect(530, 218, 44, 10, 5);
    g.lineStyle(3, OUTLINE, 0.8).lineBetween(496, 154, 610, 154).lineBetween(490, 194, 618, 194);
    shadow(g, 554, 330, 170, 24);
  });
}

function createSceneContextBackdrops(scene) {
  texture(scene, ASSET_KEYS.washScourBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xf0cf8e, 0xc69058, 0xbb8050, 0x8f5c3b);
    g.fillStyle(0xffe4a6, 0.9).fillCircle(930, 62, 42);
    g.fillStyle(0xb77a49, 1).fillTriangle(6, 178, 250, 124, 500, 194);
    g.fillStyle(0xd7a368, 1).fillTriangle(6, 178, 190, 142, 392, 196);
    g.fillStyle(0xaa7148, 1).fillTriangle(1114, 180, 862, 132, 612, 196);
    g.fillStyle(0xd39b61, 1).fillTriangle(1114, 180, 944, 146, 720, 196);
    g.lineStyle(7, 0x6f462e, 0.8).lineBetween(38, 166, 1062, 154);
    g.lineStyle(3, 0xf0c47d, 0.85).lineBetween(38, 158, 1062, 146);
    g.fillStyle(OUTLINE, 0.9).fillRoundedRect(252, 188, 112, 104, 10).fillRoundedRect(756, 188, 112, 104, 10);
    g.fillStyle(0x8f6d55, 1).fillRoundedRect(260, 196, 96, 88, 8).fillRoundedRect(764, 196, 96, 88, 8);
    g.fillStyle(0xd4c3a2, 1).fillRoundedRect(260, 196, 96, 22, 8).fillRoundedRect(764, 196, 96, 22, 8);
    g.fillStyle(OUTLINE, 0.86).fillEllipse(560, 284, 662, 142);
    g.fillStyle(0x8a5638, 1).fillEllipse(560, 278, 626, 122);
    g.fillStyle(0xc5905c, 1).fillEllipse(560, 244, 540, 62);
    g.fillStyle(0x6f432d, 0.82).fillEllipse(560, 290, 430, 64);
    g.fillStyle(0xe2b477, 1).fillEllipse(560, 228, 440, 34);
    g.lineStyle(5, OUTLINE, 0.72).lineBetween(224, 220, 374, 226).lineBetween(722, 224, 878, 218);
    g.lineStyle(3, 0x6f452d, 0.72);
    for (const [x1, y1, x2, y2, x3, y3] of [[390, 254, 454, 278, 428, 318], [536, 238, 500, 278, 548, 320], [680, 252, 632, 286, 706, 328]]) {
      g.lineBetween(x1, y1, x2, y2).lineBetween(x2, y2, x3, y3);
    }
    for (const p of [[76, 310, 6], [172, 274, 5], [304, 318, 7], [472, 304, 5], [620, 326, 7], [802, 306, 5], [976, 276, 6], [1050, 322, 5]]) pebble(g, ...p, 0xa8754c);
  });

  texture(scene, ASSET_KEYS.greenWashBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xf2d7a2, 0xc79c64, 0xcc9b64, 0xa87349);
    g.fillStyle(0xbc8454, 1).fillTriangle(6, 186, 316, 124, 612, 198);
    g.fillStyle(0xe0b176, 1).fillTriangle(6, 184, 240, 148, 486, 198);
    g.fillStyle(0xb27848, 1).fillTriangle(1114, 184, 804, 128, 522, 198);
    g.fillStyle(0xdba66e, 1).fillTriangle(1114, 184, 912, 150, 684, 198);
    g.fillStyle(0xb88755, 1).fillEllipse(560, 286, 1040, 118);
    g.fillStyle(0xdfb178, 1).fillEllipse(560, 254, 900, 54);
    g.fillStyle(OUTLINE, 0.78).fillRoundedRect(104, 226, 908, 76, 36);
    g.fillStyle(0x3f6936, 1).fillRoundedRect(116, 222, 884, 74, 34);
    g.fillStyle(0x6fae54, 1).fillRoundedRect(132, 222, 850, 42, 22);
    g.fillStyle(0xa3d87a, 0.9).fillRoundedRect(162, 228, 760, 16, 8);
    g.lineStyle(4, 0x2c4b2c, 0.82).lineBetween(110, 282, 1006, 286);
    for (const [x, y, s] of [[178, 248, 1], [260, 238, 0.86], [420, 252, 1.1], [556, 236, 0.9], [716, 250, 1.05], [860, 240, 0.88], [950, 256, 1]]) {
      shadow(g, x, y + 42, 52 * s, 12);
      g.fillStyle(OUTLINE, 1).fillRoundedRect(x - 6 * s, y - 4 * s, 12 * s, 50 * s, 5);
      g.fillStyle(0x795030, 1).fillRoundedRect(x - 4 * s, y - 2 * s, 8 * s, 46 * s, 4);
      g.fillStyle(OUTLINE, 1).fillCircle(x, y - 10 * s, 26 * s);
      g.fillStyle(0x6f9e4f, 1).fillCircle(x, y - 10 * s, 22 * s);
      g.fillStyle(0xa8d97c, 0.95).fillCircle(x - 8 * s, y - 18 * s, 8 * s);
    }
    for (const t of [[94, 286, 0xa58b4b], [320, 270, 0x9bd66a], [614, 278, 0x98d870], [1044, 292, 0xa58b4b], [792, 276, 0x9fdc72]]) grassTuft(g, ...t);
    for (const p of [[60, 314, 5], [364, 312, 4], [508, 304, 5], [686, 312, 4], [1024, 316, 5]]) pebble(g, ...p, 0xaa764d);
  });

  texture(scene, ASSET_KEYS.utmRigBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xd6ecf0, 0x9fbfc6, 0xaab8b6, 0x7e8c8a);
    g.fillStyle(0xcdd6d4, 1).fillRoundedRect(84, 206, 952, 92, 18);
    g.fillStyle(0xe7eeee, 1).fillRoundedRect(118, 212, 884, 24, 12);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(224, 72, 86, 238, 12).fillRoundedRect(810, 72, 86, 238, 12);
    g.fillStyle(0x536e7a, 1).fillRoundedRect(234, 82, 66, 218, 9).fillRoundedRect(820, 82, 66, 218, 9);
    g.fillStyle(0x9cc4cc, 1).fillRoundedRect(244, 90, 16, 200, 7).fillRoundedRect(830, 90, 16, 200, 7);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(186, 58, 748, 64, 14);
    g.fillStyle(0x607d8b, 1).fillRoundedRect(198, 68, 724, 44, 10);
    g.fillStyle(0xaed4dc, 1).fillRoundedRect(216, 74, 438, 14, 7);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(414, 124, 292, 46, 10);
    g.fillStyle(0x455f69, 1).fillRoundedRect(424, 132, 272, 30, 8);
    g.fillStyle(0x9fb7bd, 1).fillRoundedRect(494, 168, 120, 42, 8);
    g.fillStyle(OUTLINE, 0.9).fillRoundedRect(360, 256, 400, 56, 12);
    g.fillStyle(0x546a70, 1).fillRoundedRect(372, 264, 376, 36, 8);
    g.fillStyle(0xb8c5c4, 1).fillRoundedRect(470, 246, 250, 26, 8);
    g.fillStyle(0xf0bd62, 0.92).fillRoundedRect(522, 184, 76, 40, 8);
    g.lineStyle(5, OUTLINE, 0.8).lineBetween(560, 164, 560, 236);
    g.fillStyle(0xffd77c, 1).fillTriangle(560, 236, 536, 206, 584, 206);
    g.lineStyle(3, 0xe7f3f4, 0.72).lineBetween(256, 112, 256, 288).lineBetween(856, 112, 856, 288);
    shadow(g, 560, 320, 620, 32);
    for (const p of [[170, 318, 5], [930, 318, 5], [1020, 278, 4]]) pebble(g, ...p, 0x87908f);
  });

  texture(scene, ASSET_KEYS.washCrossingBackdrop, 1120, 360, (g) => {
    drawBackdropFrame(g, 0xf0d39b, 0xbe8c58, 0xc7975f, 0x8f6040);
    g.fillStyle(0xffe1a0, 0.9).fillCircle(914, 64, 38);
    g.fillStyle(0xb87947, 1).fillTriangle(6, 184, 298, 132, 560, 196);
    g.fillStyle(0xd9a56a, 1).fillTriangle(6, 184, 236, 150, 430, 196);
    g.fillStyle(0xaa7045, 1).fillTriangle(1114, 184, 816, 132, 560, 196);
    g.fillStyle(0xd29a61, 1).fillTriangle(1114, 184, 914, 150, 696, 196);
    g.fillStyle(OUTLINE, 0.86).fillRoundedRect(34, 214, 392, 84, 16).fillRoundedRect(694, 214, 392, 84, 16);
    g.fillStyle(0xc8945d, 1).fillRoundedRect(42, 208, 386, 82, 14).fillRoundedRect(692, 208, 386, 82, 14);
    g.fillStyle(0xe5b374, 1).fillRoundedRect(42, 208, 386, 24, 12).fillRoundedRect(692, 208, 386, 24, 12);
    g.fillStyle(OUTLINE, 0.9).fillEllipse(560, 288, 430, 124);
    g.fillStyle(0x805139, 1).fillEllipse(560, 286, 400, 112);
    g.fillStyle(0xb77e4e, 1).fillEllipse(560, 252, 342, 54);
    g.fillStyle(0x67432f, 0.86).fillEllipse(560, 304, 278, 50);
    g.lineStyle(5, 0x70482f, 0.78).lineBetween(108, 246, 404, 250).lineBetween(716, 250, 1010, 246);
    g.lineStyle(3, 0xf0c681, 0.72).lineBetween(76, 226, 390, 226).lineBetween(728, 226, 1040, 224);
    for (const p of [[118, 306, 6], [256, 270, 5], [418, 314, 5], [518, 286, 5], [636, 294, 5], [746, 314, 5], [930, 272, 5], [1040, 314, 6]]) pebble(g, ...p, 0xa8774f);
    for (const t of [[78, 252], [382, 248], [730, 248], [1030, 252]]) grassTuft(g, t[0], t[1], 0xa58b4b);
  });
}

// A wheel with tire, metal rim, hub and spokes — the BikeBrowser hero detail.
function wheel(g, cx, cy, r) {
  g.fillStyle(OUTLINE, 1).fillCircle(cx, cy, r + 1);
  g.fillStyle(0x2b2f34, 1).fillCircle(cx, cy, r);            // tire
  g.fillStyle(0xb9c6cc, 1).fillCircle(cx, cy, r - 3);        // rim
  g.fillStyle(0x7d8a90, 1).fillCircle(cx, cy, r - 6);        // inner well
  g.lineStyle(1, 0xdfe8ea, 0.9);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    g.lineBetween(cx, cy, cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
  }
  g.fillStyle(0x3a4146, 1).fillCircle(cx, cy, 2.4);          // hub
}

function createZuzu(scene) {
  texture(scene, ASSET_KEYS.zuzu, 40, 52, (g) => {
    shadow(g, 20, 49, 26);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(8, 22, 24, 24, 8);
    g.fillStyle(0xf2c94c, 1).fillRoundedRect(10, 24, 20, 21, 7);     // shirt
    g.fillStyle(0xffe08a, 1).fillRoundedRect(12, 26, 8, 16, 4);      // shirt highlight
    g.fillStyle(0x4a5a6b, 1).fillRoundedRect(12, 40, 7, 9, 2).fillRoundedRect(21, 40, 7, 9, 2);
    g.fillStyle(OUTLINE, 1).fillCircle(20, 14, 11);
    g.fillStyle(0x7b4b31, 1).fillCircle(20, 12, 10);                 // hair
    g.fillStyle(0xe0a877, 1).fillCircle(20, 17, 8);                  // face
    g.fillStyle(0xf2c08a, 1).fillCircle(17, 16, 4);                  // cheek light
    g.fillStyle(0x2b2e3d, 1).fillCircle(17, 17, 1.4).fillCircle(23, 17, 1.4);
    g.fillStyle(0xd98a7a, 0.7).fillCircle(15, 20, 1.6).fillCircle(25, 20, 1.6);
  });
}

function createBike(scene) {
  // The BikeBrowser hero, at 2x density (192x112 @ ~0.525 scale): spoked wheels,
  // a shaded red diamond frame, fenders, chain, brake calipers and a headlight.
  texture(scene, ASSET_KEYS.bike, 192, 112, (g) => {
    shadow(g, 96, 102, 156, 18);
    const rearHub = [48, 76], bb = [96, 80], headTop = [128, 40], seatTop = [80, 38], frontHub = [144, 76];
    // fenders (drawn behind the wheels)
    g.lineStyle(7, OUTLINE, 1);
    g.beginPath(); g.arc(rearHub[0], rearHub[1], 36, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
    g.beginPath(); g.arc(frontHub[0], frontHub[1], 36, Math.PI * 1.15, Math.PI * 1.95); g.strokePath();
    g.lineStyle(3.5, 0xc7a06a, 1);
    g.beginPath(); g.arc(rearHub[0], rearHub[1], 36, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
    g.beginPath(); g.arc(frontHub[0], frontHub[1], 36, Math.PI * 1.15, Math.PI * 1.95); g.strokePath();
    wheel(g, rearHub[0], rearHub[1], 30);
    wheel(g, frontHub[0], frontHub[1], 30);
    // chain (rear hub to chainring)
    g.lineStyle(4, OUTLINE, 1).lineBetween(rearHub[0], rearHub[1], bb[0], bb[1]);
    g.lineStyle(2, 0x6f7d83, 1).lineBetween(rearHub[0], rearHub[1], bb[0], bb[1]);
    // frame — dark outline pass then bright red tubes, then highlight
    const tubes = [[rearHub, bb], [bb, seatTop], [seatTop, rearHub], [bb, headTop], [seatTop, headTop]];
    g.lineStyle(13, OUTLINE, 1);
    for (const [a, b] of tubes) g.lineBetween(a[0], a[1], b[0], b[1]);
    g.lineStyle(8, 0xd13c34, 1);
    for (const [a, b] of tubes) g.lineBetween(a[0], a[1], b[0], b[1]);
    g.lineStyle(3, 0xff8a7a, 0.85);
    g.lineBetween(seatTop[0], seatTop[1], headTop[0], headTop[1]);          // top-tube sheen
    g.lineBetween(bb[0] - 4, bb[1] - 6, seatTop[0] + 2, seatTop[1] + 6);    // seat-tube sheen
    // gusset plates at the joints
    g.fillStyle(OUTLINE, 1).fillCircle(bb[0], bb[1], 7).fillCircle(seatTop[0], seatTop[1], 6).fillCircle(headTop[0], headTop[1], 6);
    g.fillStyle(0xd13c34, 1).fillCircle(seatTop[0], seatTop[1], 4);
    // fork + front brake caliper
    g.lineStyle(11, OUTLINE, 1).lineBetween(headTop[0], headTop[1], frontHub[0], frontHub[1]);
    g.lineStyle(6, 0x9aa7ad, 1).lineBetween(headTop[0], headTop[1], frontHub[0], frontHub[1]);
    g.fillStyle(OUTLINE, 1).fillCircle(frontHub[0] - 2, frontHub[1] - 22, 4);
    // seat (saddle)
    g.fillStyle(OUTLINE, 1).fillRoundedRect(64, 26, 32, 12, 6);
    g.fillStyle(0x2b2f34, 1).fillRoundedRect(66, 27, 28, 9, 5);
    g.fillStyle(0x4a525a, 1).fillRoundedRect(66, 27, 14, 4, 4);
    g.lineStyle(5, OUTLINE, 1).lineBetween(seatTop[0], seatTop[1], 80, 34);
    // handlebars + grips + headlight
    g.lineStyle(10, OUTLINE, 1).lineBetween(headTop[0], headTop[1], 140, 22).lineBetween(140, 22, 120, 18);
    g.lineStyle(6, 0x2b2f34, 1).lineBetween(headTop[0], headTop[1], 140, 22).lineBetween(140, 22, 120, 18);
    g.fillStyle(0xe0473f, 1).fillCircle(120, 18, 5);                        // grip
    g.fillStyle(OUTLINE, 1).fillCircle(150, 50, 7);
    g.fillStyle(0xffe08a, 1).fillCircle(150, 50, 4.5);                      // headlight
    g.fillStyle(0xfff6e2, 0.9).fillCircle(148, 48, 1.8);
    // crank arm + pedal + chainring
    g.lineStyle(6, OUTLINE, 1).lineBetween(bb[0], bb[1], 88, 96);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(78, 94, 20, 8, 3);
    g.fillStyle(0x3a4146, 1).fillRoundedRect(80, 95, 16, 6, 2);             // pedal
    g.fillStyle(OUTLINE, 1).fillCircle(bb[0], bb[1], 8);
    g.fillStyle(0x55636a, 1).fillCircle(bb[0], bb[1], 6);                   // chainring
    g.fillStyle(0x2b2f34, 1).fillCircle(bb[0], bb[1], 2);
  });
}

function createHouse(scene) {
  texture(scene, ASSET_KEYS.house, 160, 128, (g) => {
    shadow(g, 80, 118, 132, 12);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(16, 40, 128, 76, 5);
    g.fillStyle(0xcf9266, 1).fillRoundedRect(18, 42, 124, 72, 4);    // adobe body
    g.fillStyle(0xe0a877, 1).fillRoundedRect(18, 42, 124, 14, 4);    // sunlit top band
    g.fillStyle(0xb6764b, 1).fillRoundedRect(18, 100, 124, 14, 4);   // shaded base
    g.fillStyle(OUTLINE, 1).fillTriangle(6, 50, 80, 8, 154, 50);
    g.fillStyle(0xb6552f, 1).fillTriangle(10, 48, 80, 12, 150, 48);  // roof
    g.fillStyle(0xcf6a3c, 1).fillTriangle(10, 48, 80, 12, 80, 48);   // roof light side
    g.fillStyle(OUTLINE, 1).fillRoundedRect(64, 70, 32, 46, 3);
    g.fillStyle(0x7c4a30, 1).fillRoundedRect(66, 72, 28, 42, 3);     // door
    g.fillStyle(0xf2c46d, 1).fillCircle(90, 93, 1.8);                // knob
    for (const dx of [30, 104]) {
      g.fillStyle(OUTLINE, 1).fillRoundedRect(dx - 2, 58, 30, 24, 3);
      g.fillStyle(0x9ccadb, 1).fillRoundedRect(dx, 60, 26, 20, 2);   // window
      g.fillStyle(0xc4e3ef, 1).fillRoundedRect(dx + 2, 62, 10, 16, 1);
    }
  });
}

function createStreet(scene) {
  texture(scene, ASSET_KEYS.street, 128, 96, (g) => {
    g.fillStyle(0xcdb389, 1).fillRect(0, 0, 128, 96);               // warm sand base
    g.fillStyle(0xc2a87d, 1);
    for (const [x, y, r] of [[20, 24, 9], [88, 16, 7], [54, 60, 10], [104, 74, 8], [30, 80, 6]]) {
      g.fillCircle(x, y, r);                                         // subtle ground mottle
    }
    g.fillStyle(0xd8c29a, 0.6).fillEllipse(70, 40, 60, 26);
  });
}

function createDesertWash(scene) {
  texture(scene, ASSET_KEYS.desertWash, 192, 96, (g) => {
    g.fillStyle(OUTLINE, 0.25).fillRoundedRect(2, 20, 188, 58, 22);
    g.fillStyle(0xb59a82, 1).fillRoundedRect(0, 18, 192, 60, 20);   // wash bed
    g.fillStyle(0xa2876f, 1).fillRoundedRect(0, 52, 192, 26, 20);   // shaded channel
    g.fillStyle(0x9ccfd6, 0.5).fillEllipse(96, 56, 150, 18);        // damp centre
    g.fillStyle(0x8d7a68, 1);
    for (const [x, y, r] of [[24, 38, 5], [62, 60, 4], [120, 34, 4], [164, 64, 5], [92, 30, 3]]) {
      g.fillStyle(OUTLINE, 0.4).fillCircle(x + 1, y + 1, r);
      g.fillStyle(0xc9b298, 1).fillCircle(x, y, r);                 // pebbles
    }
    g.lineStyle(2, 0x8a7560, 0.45).lineBetween(8, 50, 184, 42);
  });
}

function createBridge(scene) {
  texture(scene, ASSET_KEYS.bridge, 160, 64, (g) => {
    shadow(g, 80, 58, 150, 8);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(8, 38, 144, 12, 3);
    g.fillStyle(0x8a5a38, 1).fillRoundedRect(10, 40, 140, 9, 2);    // deck
    g.fillStyle(0xa9714a, 1).fillRoundedRect(10, 40, 140, 3, 2);    // deck highlight
    g.lineStyle(4, OUTLINE, 1);
    for (let x = 18; x <= 132; x += 28) g.strokeTriangle(x, 40, x + 14, 16, x + 28, 40);
    g.lineStyle(2.5, 0xd39b62, 1);
    for (let x = 18; x <= 132; x += 28) g.strokeTriangle(x, 40, x + 14, 16, x + 28, 40);  // rope truss
    g.fillStyle(0x5e3d27, 1);
    for (let x = 16; x <= 144; x += 16) g.fillRect(x, 41, 3, 7);    // planks
  });
}

function createRepairStation(scene) {
  // Bike repair stand — 2x density (192x160 @ ~0.55 scale). A red toolbox with a
  // drawer + handle, a clamped wheel mid-repair, a hung wrench and a tool roll.
  texture(scene, ASSET_KEYS.repairStation, 192, 160, (g) => {
    shadow(g, 96, 146, 150, 16);
    // toolbox body (two-drawer chest)
    g.fillStyle(OUTLINE, 1).fillRoundedRect(16, 74, 128, 66, 8);
    g.fillStyle(0xc23b34, 1).fillRoundedRect(20, 78, 120, 58, 6);          // red chest
    g.fillStyle(0xe0574f, 1).fillRoundedRect(20, 78, 120, 16, 6);          // lid sheen
    g.fillStyle(0x8f2a25, 1).fillRoundedRect(20, 122, 120, 14, 6);         // base shade
    g.lineStyle(3, OUTLINE, 1).lineBetween(24, 100, 136, 100).lineBetween(24, 118, 136, 118);  // drawer seams
    g.fillStyle(OUTLINE, 1).fillRoundedRect(62, 104, 36, 6, 3).fillRoundedRect(62, 122, 36, 6, 3);  // drawer pulls
    g.fillStyle(0x3a4146, 1).fillRoundedRect(60, 66, 72, 10, 4);           // top handle bar
    g.fillStyle(0x9aa7ad, 1).fillRoundedRect(60, 66, 72, 3, 4);
    // clamped wheel being trued
    wheel(g, 150, 70, 30);
    g.fillStyle(OUTLINE, 1).fillRect(128, 66, 10, 70);                    // stand arm to wheel
    g.fillStyle(0x55636a, 1).fillRect(130, 66, 6, 70);
    // hung wrench + screwdriver on the side
    g.lineStyle(9, OUTLINE, 1).lineBetween(40, 70, 64, 30);
    g.lineStyle(5, 0xb9c6cc, 1).lineBetween(40, 70, 64, 30);
    g.fillStyle(OUTLINE, 1).fillCircle(64, 28, 7); g.fillStyle(0x9aa7ad, 1).fillCircle(64, 28, 4.5);
    g.lineStyle(7, OUTLINE, 1).lineBetween(96, 64, 110, 30);
    g.lineStyle(3.5, 0xf2c46d, 1).lineBetween(96, 64, 106, 40);           // yellow screwdriver
    g.lineStyle(3.5, 0xb9c6cc, 1).lineBetween(106, 40, 110, 30);
  });
}

function createGarage(scene) {
  texture(scene, ASSET_KEYS.garage, 150, 96, (g) => {
    shadow(g, 75, 88, 130, 10);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(8, 20, 134, 66, 6);
    g.fillStyle(0x8a6347, 1).fillRoundedRect(10, 22, 130, 62, 5);   // structure
    g.fillStyle(0xa07a59, 1).fillRoundedRect(10, 22, 130, 12, 5);   // roof lip
    g.fillStyle(OUTLINE, 1).fillRoundedRect(26, 36, 98, 46, 4);
    g.fillStyle(0x44565a, 1).fillRoundedRect(28, 38, 94, 42, 3);    // roller door
    g.lineStyle(3, 0x597075, 1);
    for (let y = 46; y <= 74; y += 9) g.lineBetween(30, y, 120, y); // door slats
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(112, 56, 6, 10, 2);    // handle
  });
}

function createWorkbench(scene) {
  // Bridge-planning table — 2x density (172x92 @ ~0.55 scale): a sturdy bench
  // with a blue blueprint, a ruler and a pencil (the "plan the repair" spot).
  texture(scene, ASSET_KEYS.workbench, 172, 92, (g) => {
    shadow(g, 86, 84, 150, 12);
    // legs + cross brace
    g.fillStyle(OUTLINE, 1).fillRect(24, 54, 16, 32).fillRect(132, 54, 16, 32);
    g.fillStyle(0x5e4330, 1).fillRect(27, 54, 10, 32).fillRect(135, 54, 10, 32);
    g.fillStyle(OUTLINE, 1).fillRect(36, 66, 100, 7);
    g.fillStyle(0x6b4a33, 1).fillRect(38, 67, 96, 4);
    // table top
    g.fillStyle(OUTLINE, 1).fillRoundedRect(8, 22, 156, 34, 6);
    g.fillStyle(0x9c6c44, 1).fillRoundedRect(12, 26, 148, 26, 4);          // wood top
    g.fillStyle(0xb8845a, 1).fillRoundedRect(12, 26, 148, 7, 4);           // sunlit edge
    g.lineStyle(1.5, 0x7c5536, 0.6).lineBetween(18, 44, 154, 44);         // grain
    // blueprint sheet with a bridge sketch
    g.fillStyle(OUTLINE, 1).fillRoundedRect(40, 14, 70, 30, 3);
    g.fillStyle(0x2f6fb2, 1).fillRoundedRect(43, 16, 64, 26, 2);          // blueprint
    g.lineStyle(1.5, 0xbfe0f5, 0.9);
    g.lineBetween(48, 36, 102, 36);                                        // deck line
    for (let x = 50; x <= 98; x += 12) g.strokeTriangle(x, 36, x + 6, 26, x + 12, 36);  // truss sketch
    // ruler + pencil
    g.fillStyle(OUTLINE, 1).fillRoundedRect(112, 18, 44, 8, 2);
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(114, 19, 40, 6, 1);          // ruler
    g.lineStyle(2, 0x6b4a33, 0.6); for (let x = 118; x < 152; x += 6) g.lineBetween(x, 19, x, 22);
    g.lineStyle(5, OUTLINE, 1).lineBetween(118, 12, 140, 8);
    g.lineStyle(2.5, 0xe0a23a, 1).lineBetween(118, 12, 137, 8.5);         // pencil
    g.fillStyle(0x2b2f34, 1).fillCircle(118, 12, 1.6);
  });
}

function createUtmRig(scene) {
  // Universal Test Machine — rendered at 2x density (144x164, displayed at ~0.54
  // scale) so the rivets, panel seams and gauge read crisply at prop size.
  texture(scene, ASSET_KEYS.utmRig, 144, 164, (g) => {
    shadow(g, 72, 154, 116, 16);
    // heavy base with feet
    g.fillStyle(OUTLINE, 1).fillRoundedRect(20, 134, 104, 22, 5);
    g.fillStyle(0x343b40, 1).fillRoundedRect(24, 137, 96, 16, 4);
    g.fillStyle(0x4a535a, 1).fillRoundedRect(24, 137, 96, 5, 4);         // base top sheen
    g.fillStyle(OUTLINE, 1).fillRect(28, 154, 12, 6).fillRect(104, 154, 12, 6);  // feet
    // twin steel uprights with bolt seams
    for (const ux of [30, 96]) {
      g.fillStyle(OUTLINE, 1).fillRect(ux, 18, 18, 120);
      g.fillStyle(0x4f5a61, 1).fillRect(ux + 2, 18, 14, 120);            // column
      g.fillStyle(0x6f7d83, 1).fillRect(ux + 2, 18, 4, 120);            // left highlight
      g.fillStyle(0x2f363b, 1).fillRect(ux + 12, 18, 4, 120);          // right shade
      g.fillStyle(0x222a2f, 1);
      for (let by = 30; by < 130; by += 18) g.fillCircle(ux + 9, by, 1.8);  // bolt rivets
    }
    // top fixed crosshead
    g.fillStyle(OUTLINE, 1).fillRoundedRect(20, 12, 104, 22, 5);
    g.fillStyle(0x55636a, 1).fillRoundedRect(24, 15, 96, 16, 4);
    g.fillStyle(0x7d8a90, 1).fillRoundedRect(24, 15, 96, 5, 4);
    g.fillStyle(0x2f363b, 1).fillCircle(40, 23, 2.2).fillCircle(104, 23, 2.2);
    // moving crosshead (the part that presses down)
    g.fillStyle(OUTLINE, 1).fillRoundedRect(22, 66, 100, 22, 5);
    g.fillStyle(0x69757c, 1).fillRoundedRect(26, 69, 92, 16, 4);
    g.fillStyle(0x8c979d, 1).fillRoundedRect(26, 69, 92, 5, 4);
    g.lineStyle(2, 0x2f363b, 1).lineBetween(30, 86, 114, 86);
    // sample clamped under test
    g.fillStyle(OUTLINE, 1).fillRoundedRect(60, 88, 24, 30, 3);
    g.fillStyle(0x57c2b3, 1).fillRoundedRect(63, 90, 18, 26, 2);          // specimen
    g.fillStyle(0xbdeee6, 0.7).fillRect(66, 92, 4, 22);
    g.fillStyle(OUTLINE, 1).fillRect(58, 116, 28, 5);                    // lower grip
    // dial gauge on the column
    g.fillStyle(OUTLINE, 1).fillCircle(72, 48, 15);
    g.fillStyle(0xfff6e2, 1).fillCircle(72, 48, 12);
    g.lineStyle(1.5, 0x6b4a33, 0.6);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) g.lineBetween(72 + Math.cos(a) * 9, 48 + Math.sin(a) * 9, 72 + Math.cos(a) * 11, 48 + Math.sin(a) * 11);
    g.lineStyle(2, 0xe0473f, 1).lineBetween(72, 48, 79, 42);             // needle
    g.fillStyle(0x2f363b, 1).fillCircle(72, 48, 2);
    // load cable
    g.lineStyle(3, 0x2f363b, 1).lineBetween(122, 30, 130, 60).lineBetween(130, 60, 120, 78);
  });
}

function createEcologyPlant(scene) {
  // Desert planting cluster — 2x density (124x140 @ ~0.62 scale): a raised soil
  // bed with a seedling, a little agave, and a flowering desert sprig.
  texture(scene, ASSET_KEYS.ecologyPlant, 124, 140, (g) => {
    shadow(g, 62, 128, 96, 14);
    // raised soil mound
    g.fillStyle(OUTLINE, 1).fillEllipse(62, 116, 92, 34);
    g.fillStyle(0x8a5a38, 1).fillEllipse(62, 114, 88, 30);          // soil
    g.fillStyle(0x9c6c44, 1).fillEllipse(62, 108, 78, 18);          // sunlit crest
    g.fillStyle(0x5e3d27, 1).fillCircle(40, 116, 2).fillCircle(82, 118, 2).fillCircle(64, 122, 1.6);  // pebbles
    // central seedling
    g.lineStyle(7, OUTLINE, 1).lineBetween(62, 110, 62, 56);
    g.lineStyle(4, 0x4f9c75, 1).lineBetween(62, 110, 62, 56);       // stem
    for (const [lx, ly, lw, lh] of [[40, 80, 26, 12], [86, 70, 26, 12], [38, 58, 20, 10]]) {
      g.fillStyle(OUTLINE, 1).fillEllipse(lx, ly, lw + 4, lh + 4);
      g.fillStyle(0x67b083, 1).fillEllipse(lx, ly, lw, lh);
      g.fillStyle(0x8ad19a, 0.8).fillEllipse(lx - lw * 0.2, ly - 2, lw * 0.4, lh * 0.4);
    }
    g.fillStyle(OUTLINE, 1).fillCircle(62, 50, 16);
    g.fillStyle(0x86c98f, 1).fillCircle(62, 50, 13);                // top crown
    g.fillStyle(0xb7e6b0, 1).fillCircle(56, 45, 5);
    // little agave to the left (spiky rosette)
    g.fillStyle(OUTLINE, 1);
    for (const a of [-0.9, -0.4, 0, 0.4, 0.9]) g.fillTriangle(24, 104, 24 + Math.sin(a) * 6, 104, 24 + Math.sin(a) * 22, 104 - 30 + Math.cos(a) * 6);
    g.fillStyle(0x4f9c75, 1);
    for (const a of [-0.8, -0.3, 0.1, 0.6]) g.fillTriangle(24, 104, 24 + Math.sin(a) * 4, 104, 24 + Math.sin(a) * 18, 106 - 26 + Math.cos(a) * 4);
    // flowering sprig to the right
    g.lineStyle(4, OUTLINE, 1).lineBetween(98, 110, 102, 78);
    g.lineStyle(2, 0x4f9c75, 1).lineBetween(98, 110, 102, 78);
    g.fillStyle(OUTLINE, 1).fillCircle(102, 74, 7);
    g.fillStyle(0xf2c46d, 1).fillCircle(102, 74, 5);               // yellow bloom
    g.fillStyle(0xe0473f, 1).fillCircle(102, 74, 2);
  });
}

function createChemistryStation(scene) {
  texture(scene, ASSET_KEYS.chemistryStation, 82, 62, (g) => {
    shadow(g, 41, 56, 68, 7);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(6, 36, 70, 14, 3);
    g.fillStyle(0x6f4f3a, 1).fillRoundedRect(8, 38, 66, 10, 2);     // bench
    g.fillStyle(0x87654b, 1).fillRoundedRect(8, 38, 66, 3, 2);
    // beaker (teal liquid)
    g.fillStyle(OUTLINE, 1).fillRoundedRect(19, 12, 16, 26, 3);
    g.fillStyle(0xdef3f0, 0.5).fillRoundedRect(21, 14, 12, 22, 2);  // glass
    g.fillStyle(0x57c2b3, 1).fillRoundedRect(21, 26, 12, 10, 2);    // liquid
    g.fillStyle(0xbfeee6, 0.8).fillRect(23, 16, 2, 18);             // glass glint
    // flask (amber)
    g.fillStyle(OUTLINE, 1).fillTriangle(42, 38, 62, 38, 52, 18);
    g.fillStyle(0xf0c06a, 1).fillTriangle(45, 36, 59, 36, 52, 24);  // liquid
    g.fillStyle(OUTLINE, 1).fillRect(50, 14, 4, 8);                 // neck
    g.fillStyle(0xfff0c7, 0.5).fillTriangle(47, 36, 50, 36, 51, 28);
  });
}

function createMapGate(scene) {
  texture(scene, ASSET_KEYS.mapGate, 90, 88, (g) => {
    shadow(g, 45, 82, 64, 8);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(12, 14, 14, 66, 3).fillRoundedRect(64, 14, 14, 66, 3);
    g.fillStyle(0x8a6347, 1).fillRoundedRect(14, 16, 10, 62, 2).fillRoundedRect(66, 16, 10, 62, 2);  // posts
    g.fillStyle(0xa07a59, 1).fillRect(15, 16, 3, 62).fillRect(67, 16, 3, 62);    // post highlight
    g.fillStyle(OUTLINE, 1).fillRoundedRect(8, 8, 74, 12, 3);
    g.fillStyle(0x8a6347, 1).fillRoundedRect(10, 10, 70, 8, 2);     // lintel
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(10, 11, 70, 3, 2);     // sunlit top
    // arrow plaque (the "wider map" clue)
    g.fillStyle(OUTLINE, 1).fillCircle(45, 46, 15);
    g.fillStyle(0x6fae9c, 1).fillCircle(45, 46, 13);
    g.fillStyle(0xfff0c7, 1).fillTriangle(38, 52, 52, 52, 45, 38);  // up arrow
    g.fillRect(43, 46, 4, 8);
  });
}

function createSaltRiverBackground(scene) {
  texture(scene, ASSET_KEYS.saltRiverBackground, 256, 128, (g) => {
    g.fillStyle(0xd7cba5, 1).fillRect(0, 0, 256, 128);             // pale salt-flat light
    g.fillStyle(0xe9dfbf, 1).fillRect(0, 0, 256, 46);
    g.fillStyle(0xbdd6d0, 1).fillRoundedRect(-8, 48, 272, 38, 18); // broad river
    g.fillStyle(0x7fb5b5, 1).fillRoundedRect(-8, 64, 272, 22, 14);
    g.fillStyle(0xeef1da, 0.9);
    for (const [x, y, w] of [[18, 92, 48], [76, 104, 62], [154, 92, 56], [210, 110, 42]]) {
      g.fillEllipse(x, y, w, 8);                                  // salt crust plates
    }
    g.lineStyle(2, 0xb8a980, 0.65);
    for (const y of [92, 101, 111]) g.lineBetween(8, y, 248, y - 9);
    g.fillStyle(OUTLINE, 0.34).fillRoundedRect(0, 82, 256, 16, 8); // far-bank silhouette
    for (const [x, h] of [[26, 34], [52, 48], [72, 36], [204, 42], [226, 30]]) {
      g.fillStyle(OUTLINE, 1).fillRect(x - 2, 36, 6, h + 42);
      g.fillStyle(0x7aa666, 1).fillRect(x, 38, 2, h + 38);
      g.fillStyle(OUTLINE, 1).fillCircle(x, 34, 16);
      g.fillStyle(0x6fae54, 1).fillCircle(x, 34, 13);
      g.fillStyle(0x8ad19a, 0.85).fillCircle(x - 5, 28, 5);
    }
    g.fillStyle(0xf6f1dc, 0.95).fillRoundedRect(20, 92, 42, 4, 2).fillRoundedRect(146, 106, 64, 4, 2);
  });
}

function createSaltbushPlant(scene) {
  texture(scene, ASSET_KEYS.saltbushPlant, 124, 116, (g) => {
    shadow(g, 62, 106, 86, 12);
    g.fillStyle(OUTLINE, 1).fillEllipse(62, 96, 82, 26);
    g.fillStyle(0x8a5a38, 1).fillEllipse(62, 94, 78, 22);
    g.fillStyle(0xeef1da, 0.85).fillEllipse(38, 90, 30, 6).fillEllipse(78, 100, 34, 6);
    for (const [x, y] of [[42, 76], [54, 62], [66, 56], [78, 64], [88, 78]]) {
      g.lineStyle(7, OUTLINE, 1).lineBetween(62, 92, x, y);
      g.lineStyle(4, 0x4f9c75, 1).lineBetween(62, 92, x, y);
      g.fillStyle(OUTLINE, 1).fillEllipse(x, y, 28, 16);
      g.fillStyle(0x67b083, 1).fillEllipse(x, y, 24, 12);
      g.fillStyle(0xa7d8b3, 0.9).fillEllipse(x - 4, y - 3, 9, 4);
    }
    g.fillStyle(0xf6f1dc, 1).fillCircle(50, 68, 2).fillCircle(82, 72, 2).fillCircle(68, 52, 2);
  });
}

function createCottonwoodPlant(scene) {
  texture(scene, ASSET_KEYS.cottonwoodPlant, 132, 164, (g) => {
    shadow(g, 66, 152, 88, 14);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(56, 70, 20, 82, 8);
    g.fillStyle(0x8a5a38, 1).fillRoundedRect(59, 72, 14, 78, 6);
    g.fillStyle(0xb8845a, 1).fillRoundedRect(60, 74, 5, 72, 4);
    const crowns = [[48, 60, 36], [76, 54, 42], [62, 34, 38], [42, 92, 32], [90, 88, 34], [68, 94, 42]];
    for (const [x, y, r] of crowns) {
      g.fillStyle(OUTLINE, 1).fillCircle(x, y, r + 3);
      g.fillStyle(0x67b083, 1).fillCircle(x, y, r);
      g.fillStyle(0x8ad19a, 0.85).fillCircle(x - r * 0.25, y - r * 0.25, Math.max(7, r * 0.28));
    }
    g.lineStyle(5, OUTLINE, 1).lineBetween(64, 112, 34, 144).lineBetween(68, 114, 100, 144);
    g.lineStyle(3, 0x8a5a38, 1).lineBetween(64, 112, 34, 144).lineBetween(68, 114, 100, 144);
  });
}

function createNotebook(scene) {
  texture(scene, ASSET_KEYS.notebook, 72, 54, (g) => {
    shadow(g, 36, 49, 58, 6);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(7, 5, 58, 44, 5);
    g.fillStyle(0xe9d39a, 1).fillRoundedRect(8, 6, 56, 42, 4);      // cover
    g.fillStyle(0xfff6e2, 1).fillRoundedRect(12, 9, 50, 36, 3);     // page
    g.fillStyle(0xb6552f, 1).fillRoundedRect(34, 6, 5, 42, 1);      // spine
    g.lineStyle(1.5, 0x8f806a, 0.9);
    for (const y of [16, 22, 28]) g.lineBetween(16, y, 30, y);
    for (const y of [16, 22, 28]) g.lineBetween(42, y, 58, y);
    g.fillStyle(0x57c2b3, 1).fillCircle(20, 38, 3);                 // little sketch
  });
}

function createSchoolNode(scene) {
  texture(scene, ASSET_KEYS.schoolNode, 88, 72, (g) => {
    shadow(g, 44, 64, 70, 8);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(10, 18, 68, 46, 5);
    g.fillStyle(0xe6cf94, 1).fillRoundedRect(12, 20, 64, 42, 4);    // adobe building
    g.fillStyle(0xf2dca8, 1).fillRoundedRect(12, 20, 64, 12, 4);
    g.fillStyle(OUTLINE, 1).fillTriangle(4, 26, 44, 4, 84, 26);
    g.fillStyle(0x3f6173, 1).fillTriangle(8, 24, 44, 6, 80, 24);    // roof
    g.fillStyle(0x547f93, 1).fillTriangle(8, 24, 44, 6, 44, 24);
    g.fillStyle(0xf2c46d, 1).fillCircle(44, 14, 4);                 // bell
    g.fillStyle(OUTLINE, 1).fillRoundedRect(36, 42, 16, 20, 2);
    g.fillStyle(0x6f4a32, 1).fillRoundedRect(38, 44, 12, 18, 2);    // door
  });
}

function createNpc(scene) {
  texture(scene, ASSET_KEYS.npc, 40, 52, (g) => {
    shadow(g, 20, 49, 25);
    g.fillStyle(OUTLINE, 1).fillRoundedRect(8, 23, 24, 23, 7);
    g.fillStyle(0x5a8f6e, 1).fillRoundedRect(10, 25, 20, 21, 6);    // shirt
    g.fillStyle(0x72ab87, 1).fillRoundedRect(12, 27, 7, 16, 4);
    g.fillStyle(OUTLINE, 1).fillCircle(20, 15, 12);
    g.fillStyle(0x3d485a, 1).fillCircle(20, 13, 11);                // hair/cap
    g.fillStyle(0xc88f65, 1).fillCircle(20, 18, 8);                 // face
    g.fillStyle(0xd9a47c, 1).fillCircle(17, 17, 4);
    g.fillStyle(0x2b2e3d, 1).fillCircle(17, 18, 1.4).fillCircle(23, 18, 1.4);
  });
}

function createQuestMarker(scene) {
  texture(scene, ASSET_KEYS.questMarker, 28, 36, (g) => {
    shadow(g, 14, 33, 16, 4);
    g.fillStyle(OUTLINE, 1).fillCircle(14, 12, 11).fillTriangle(6, 20, 22, 20, 14, 35);
    g.fillStyle(0xf7c46d, 1).fillCircle(14, 12, 9);                 // pin head
    g.fillStyle(0xf7c46d, 1).fillTriangle(7, 19, 21, 19, 14, 33);   // pin point
    g.fillStyle(0xffe0a0, 1).fillCircle(11, 9, 3);                  // highlight
    g.fillStyle(0x26322d, 1).fillCircle(14, 12, 3.5);               // hole
  });
}

function createInteractionMarker(scene) {
  texture(scene, ASSET_KEYS.interactionMarker, 26, 26, (g) => {
    g.lineStyle(3, OUTLINE, 0.5).strokeCircle(13, 13, 10);
    g.lineStyle(2.5, 0x8ed6c9, 1).strokeCircle(13, 13, 10);
    g.fillStyle(0x8ed6c9, 0.35).fillCircle(13, 13, 7);
    g.fillStyle(0xeafaf7, 1).fillCircle(13, 13, 2.4);
  });
}

function createDialogueBubble(scene) {
  texture(scene, ASSET_KEYS.dialogueBubble, 160, 64, (g) => {
    g.fillStyle(OUTLINE, 1).fillRoundedRect(3, 3, 154, 48, 9);
    g.fillStyle(OUTLINE, 1).fillTriangle(33, 49, 51, 49, 36, 62);
    g.fillStyle(0xfff6e2, 1).fillRoundedRect(5, 5, 150, 44, 8);     // bubble
    g.fillStyle(0xfff6e2, 1).fillTriangle(35, 48, 49, 48, 38, 59);  // tail
    g.fillStyle(0xffe7b0, 1).fillRoundedRect(5, 5, 150, 10, 8);     // top sheen
    g.fillStyle(0x6b4a33, 1);
    for (const y of [24, 33]) g.fillRoundedRect(16, y, 110, 4, 2);  // text lines
    g.fillRoundedRect(16, 42, 70, 4, 2);
  });
}

function createToolItem(scene) {
  texture(scene, ASSET_KEYS.toolItem, 40, 32, (g) => {
    shadow(g, 20, 28, 28, 5);
    // a clean wrench
    g.lineStyle(9, OUTLINE, 1).lineBetween(9, 24, 31, 8);
    g.lineStyle(6, 0xb9c6cc, 1).lineBetween(9, 24, 31, 8);
    g.fillStyle(OUTLINE, 1).fillCircle(9, 24, 6).fillCircle(31, 8, 6);
    g.fillStyle(0x9aa7ad, 1).fillCircle(9, 24, 4.5).fillCircle(31, 8, 4.5);
    g.fillStyle(OUTLINE, 1).fillCircle(9, 24, 2).fillCircle(31, 8, 2);
    g.fillStyle(0xdfe8ea, 0.8).lineStyle(1.5, 0xdfe8ea, 0.8);
    g.lineBetween(13, 20, 27, 11);                                  // metal sheen
  });
}
