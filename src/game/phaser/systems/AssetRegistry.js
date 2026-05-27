export const ASSET_KEYS = {
  zuzu: 'placeholder.zuzu',
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
  notebook: 'placeholder.notebook',
  schoolNode: 'placeholder.schoolNode',
  npc: 'placeholder.npc',
  questMarker: 'placeholder.questMarker',
  interactionMarker: 'placeholder.interactionMarker',
  dialogueBubble: 'placeholder.dialogueBubble',
  toolItem: 'placeholder.toolItem',
};

export const PLACEHOLDER_ASSET_CONTRACT = {
  source: 'generated_phaser_geometry',
  runtimeTier: 'clean_placeholder',
  generatedArtDirectRuntime: false,
  finalArtRequiresAseprite: true,
  keys: Object.keys(ASSET_KEYS),
};

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

function createZuzu(scene) {
  texture(scene, ASSET_KEYS.zuzu, 40, 52, (g) => {
    g.fillStyle(0x000000, 0.22).fillEllipse(20, 48, 26, 8);
    g.fillStyle(0x7b4b31, 1).fillCircle(20, 13, 10);
    g.fillStyle(0xd9905d, 1).fillCircle(20, 16, 8);
    g.fillStyle(0xf2c94c, 1).fillRoundedRect(10, 24, 20, 17, 5);
    g.fillStyle(0x6d7478, 1).fillRoundedRect(11, 38, 7, 10, 2);
    g.fillRoundedRect(22, 38, 7, 10, 2);
    g.fillStyle(0x2b2e3d, 1).fillCircle(16, 15, 1.5);
    g.fillCircle(24, 15, 1.5);
    g.fillStyle(0x2f6fb2, 1).fillCircle(14, 29, 2);
    g.fillStyle(0xd94b45, 1).fillCircle(26, 31, 2);
  });
}

function createBike(scene) {
  texture(scene, ASSET_KEYS.bike, 96, 56, (g) => {
    g.lineStyle(4, 0x26343a, 1);
    g.strokeCircle(24, 36, 15);
    g.strokeCircle(72, 36, 15);
    g.lineStyle(4, 0x2f84bd, 1);
    g.strokeTriangle(24, 35, 48, 16, 56, 35);
    g.strokeTriangle(48, 16, 72, 35, 56, 35);
    g.lineStyle(3, 0x26343a, 1);
    g.lineBetween(48, 16, 60, 10);
    g.lineBetween(60, 10, 72, 10);
    g.lineBetween(48, 16, 44, 8);
    g.lineBetween(38, 8, 50, 8);
  });
}

function createHouse(scene) {
  texture(scene, ASSET_KEYS.house, 160, 128, (g) => {
    g.fillStyle(0x6f4b38, 1).fillRoundedRect(18, 42, 124, 72, 4);
    g.fillStyle(0xb46b45, 1).fillTriangle(10, 48, 80, 12, 150, 48);
    g.fillStyle(0xf2c46d, 0.9).fillRoundedRect(66, 72, 28, 42, 3);
    g.fillStyle(0x334a58, 1).fillRoundedRect(30, 60, 26, 20, 3);
    g.fillRoundedRect(104, 60, 26, 20, 3);
  });
}

function createStreet(scene) {
  texture(scene, ASSET_KEYS.street, 128, 96, (g) => {
    g.fillStyle(0x2b3740, 1).fillRect(0, 0, 128, 96);
    g.lineStyle(2, 0x51606d, 1).lineBetween(0, 18, 128, 18);
    g.lineBetween(0, 78, 128, 78);
    g.lineStyle(3, 0xe0c576, 0.8);
    for (let x = 8; x < 128; x += 34) g.lineBetween(x, 48, x + 18, 48);
  });
}

function createDesertWash(scene) {
  texture(scene, ASSET_KEYS.desertWash, 192, 96, (g) => {
    g.fillStyle(0xa78b76, 1).fillRoundedRect(0, 18, 192, 60, 20);
    g.fillStyle(0x7f7369, 1);
    for (const [x, y, r] of [[24, 38, 5], [62, 58, 3], [120, 34, 4], [164, 62, 5]]) {
      g.fillCircle(x, y, r);
    }
    g.lineStyle(2, 0x6f5d4f, 0.5).lineBetween(8, 52, 184, 40);
  });
}

function createBridge(scene) {
  texture(scene, ASSET_KEYS.bridge, 160, 64, (g) => {
    g.lineStyle(5, 0x6b4a33, 1).lineBetween(10, 42, 150, 42);
    g.lineStyle(3, 0xd39b62, 1);
    for (let x = 20; x <= 130; x += 28) g.strokeTriangle(x, 42, x + 14, 16, x + 28, 42);
    g.fillStyle(0x3c2d25, 1).fillRect(18, 44, 124, 8);
  });
}

function createRepairStation(scene) {
  texture(scene, ASSET_KEYS.repairStation, 96, 80, (g) => {
    g.fillStyle(0x8bb09a, 1).fillRoundedRect(10, 30, 76, 32, 6);
    g.fillStyle(0x26343a, 1).fillCircle(34, 34, 14);
    g.lineStyle(3, 0xf2c46d, 1).strokeCircle(34, 34, 14);
    g.lineStyle(4, 0x26343a, 1).lineBetween(58, 52, 76, 20);
    g.lineStyle(3, 0x2f84bd, 1).lineBetween(62, 50, 86, 50);
  });
}

function createGarage(scene) {
  texture(scene, ASSET_KEYS.garage, 150, 96, (g) => {
    g.fillStyle(0x72553f, 1).fillRoundedRect(10, 22, 130, 62, 5);
    g.fillStyle(0x3b4a4c, 1).fillRoundedRect(28, 38, 94, 42, 3);
    g.lineStyle(3, 0xd2b06b, 1).lineBetween(28, 52, 122, 52).lineBetween(28, 66, 122, 66);
  });
}

function createWorkbench(scene) {
  texture(scene, ASSET_KEYS.workbench, 86, 46, (g) => {
    g.fillStyle(0x8f623e, 1).fillRoundedRect(6, 12, 74, 18, 4);
    g.fillStyle(0x4a3528, 1).fillRect(14, 28, 8, 16).fillRect(64, 28, 8, 16);
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(24, 6, 28, 8, 3);
  });
}

function createUtmRig(scene) {
  texture(scene, ASSET_KEYS.utmRig, 72, 82, (g) => {
    g.lineStyle(5, 0x27383d, 1).strokeRoundedRect(16, 8, 40, 60, 4);
    g.fillStyle(0x8ed6c9, 1).fillRoundedRect(25, 31, 22, 8, 2);
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(22, 68, 28, 8, 2);
  });
}

function createEcologyPlant(scene) {
  texture(scene, ASSET_KEYS.ecologyPlant, 62, 70, (g) => {
    g.fillStyle(0x000000, 0.16).fillEllipse(31, 62, 44, 8);
    g.fillStyle(0x4f9c75, 1).fillRoundedRect(28, 18, 8, 42, 4);
    g.fillRoundedRect(12, 34, 20, 7, 4).fillRoundedRect(32, 27, 20, 7, 4);
    g.fillStyle(0x7fb069, 1).fillCircle(22, 18, 8).fillCircle(42, 14, 7);
  });
}

function createChemistryStation(scene) {
  texture(scene, ASSET_KEYS.chemistryStation, 82, 62, (g) => {
    g.fillStyle(0x785743, 1).fillRoundedRect(8, 36, 66, 12, 3);
    g.fillStyle(0x8ed6c9, 1).fillRoundedRect(22, 13, 10, 24, 4);
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(43, 20, 13, 18, 4);
    g.lineStyle(2, 0xfff0c7, 1).strokeCircle(28, 25, 10).strokeCircle(49, 29, 9);
  });
}

function createMapGate(scene) {
  texture(scene, ASSET_KEYS.mapGate, 90, 88, (g) => {
    g.lineStyle(7, 0x6b4a33, 1).lineBetween(18, 78, 18, 18).lineBetween(72, 78, 72, 18);
    g.lineStyle(4, 0xf2c46d, 1).lineBetween(18, 20, 72, 20).lineBetween(18, 44, 72, 44);
    g.fillStyle(0x8ed6c9, 1).fillTriangle(34, 64, 56, 64, 45, 40);
  });
}

function createNotebook(scene) {
  texture(scene, ASSET_KEYS.notebook, 72, 54, (g) => {
    g.fillStyle(0xfff0c7, 1).fillRoundedRect(8, 6, 56, 42, 4);
    g.lineStyle(2, 0x6b4a33, 1).lineBetween(36, 8, 36, 46);
    g.lineStyle(1, 0x8f806a, 1).lineBetween(14, 18, 32, 18).lineBetween(40, 18, 58, 18).lineBetween(14, 28, 30, 28);
  });
}

function createSchoolNode(scene) {
  texture(scene, ASSET_KEYS.schoolNode, 88, 72, (g) => {
    g.fillStyle(0xf0dca8, 1).fillRoundedRect(12, 20, 64, 42, 5);
    g.fillStyle(0x476b83, 1).fillTriangle(8, 24, 44, 6, 80, 24);
    g.fillStyle(0x2d423c, 1).fillRect(38, 42, 12, 20);
  });
}

function createNpc(scene) {
  texture(scene, ASSET_KEYS.npc, 40, 52, (g) => {
    g.fillStyle(0x000000, 0.22).fillEllipse(20, 48, 25, 8);
    g.fillStyle(0x3d485a, 1).fillCircle(20, 13, 11);
    g.fillStyle(0xc88f65, 1).fillCircle(20, 17, 8);
    g.fillStyle(0x5aa67b, 1).fillRoundedRect(10, 25, 20, 21, 5);
  });
}

function createQuestMarker(scene) {
  texture(scene, ASSET_KEYS.questMarker, 28, 36, (g) => {
    g.fillStyle(0xf7c46d, 1).fillCircle(14, 12, 10);
    g.fillStyle(0x26322d, 1).fillCircle(14, 12, 4);
    g.fillStyle(0xf7c46d, 1).fillTriangle(8, 22, 20, 22, 14, 34);
  });
}

function createInteractionMarker(scene) {
  texture(scene, ASSET_KEYS.interactionMarker, 26, 26, (g) => {
    g.lineStyle(3, 0x8ed6c9, 1).strokeCircle(13, 13, 10);
    g.fillStyle(0x8ed6c9, 0.4).fillCircle(13, 13, 7);
  });
}

function createDialogueBubble(scene) {
  texture(scene, ASSET_KEYS.dialogueBubble, 160, 64, (g) => {
    g.fillStyle(0xfff0c7, 0.96).fillRoundedRect(4, 4, 152, 46, 8);
    g.fillStyle(0xfff0c7, 0.96).fillTriangle(34, 48, 50, 48, 38, 60);
    g.lineStyle(2, 0x6b4a33, 1).strokeRoundedRect(4, 4, 152, 46, 8);
  });
}

function createToolItem(scene) {
  texture(scene, ASSET_KEYS.toolItem, 40, 32, (g) => {
    g.fillStyle(0x2f84bd, 1).fillRoundedRect(5, 13, 30, 8, 4);
    g.fillStyle(0xf2c46d, 1).fillRoundedRect(10, 7, 8, 18, 3);
  });
}
