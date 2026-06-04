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
