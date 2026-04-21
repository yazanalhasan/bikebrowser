/**
 * Smoke check: verify game scene modules load and inherit correctly.
 *
 * Run: node scripts/check-game-scenes.mjs
 *
 * Checks:
 *   1. All scene files exist
 *   2. Scene architecture (layered: overworld, local, legacy)
 *   3. LocalSceneBase used correctly
 *   4. Asset pack JSON files are valid
 *   5. Config imports all scenes
 *   6. Scene registry and transition system
 *   7. Save system migration
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  \u2713 ${label}`);
    passed++;
  } else {
    console.log(`  \u2717 ${label}`);
    failed++;
  }
}

console.log('=== Game Scene Smoke Check ===\n');

// 1. Core file existence
console.log('Core files:');
const coreFiles = [
  'src/renderer/game/config.js',
  'src/renderer/game/GameContainer.jsx',
  'src/renderer/game/entities/Player.js',
  'src/renderer/game/entities/Npc.js',
  'src/renderer/game/assetPackLoader.js',
  'src/renderer/game/systems/saveSystem.js',
  'src/renderer/game/systems/questSystem.js',
  'src/renderer/game/systems/inventorySystem.js',
  'src/renderer/game/systems/sceneRegistry.js',
  'src/renderer/game/systems/sceneTransition.js',
  'src/renderer/game/systems/interactionManager.js',
];
for (const f of coreFiles) {
  check(f, existsSync(resolve(ROOT, f)));
}

// 2. Scene files
console.log('\nScene files:');
const sceneFiles = [
  // Overworld
  'src/renderer/game/scenes/OverworldScene.js',
  // Local scenes
  'src/renderer/game/scenes/LocalSceneBase.js',
  'src/renderer/game/scenes/ZuzuGarageScene.js',
  'src/renderer/game/scenes/StreetBlockScene.js',
  'src/renderer/game/scenes/DogParkScene.js',
  'src/renderer/game/scenes/LakeEdgeScene.js',
  'src/renderer/game/scenes/SportsFieldsScene.js',
  'src/renderer/game/scenes/CommunityPoolScene.js',
  'src/renderer/game/scenes/DesertTrailScene.js',
  'src/renderer/game/scenes/MountainScene.js',
  // Legacy (save compat)
  'src/renderer/game/scenes/GarageScene.js',
  'src/renderer/game/scenes/NeighborhoodScene.js',
  // Editor base classes
  'src/renderer/game/editor-scenes/GarageSceneBase.js',
  'src/renderer/game/editor-scenes/NeighborhoodSceneBase.js',
];
for (const f of sceneFiles) {
  check(f, existsSync(resolve(ROOT, f)));
}

// 3. Local scenes extend LocalSceneBase
console.log('\nLocal scene architecture:');
const localSceneNames = [
  'ZuzuGarageScene', 'StreetBlockScene', 'DogParkScene',
  'LakeEdgeScene', 'SportsFieldsScene', 'CommunityPoolScene',
  'DesertTrailScene', 'MountainScene',
];
for (const name of localSceneNames) {
  const path = resolve(ROOT, `src/renderer/game/scenes/${name}.js`);
  if (!existsSync(path)) continue;
  const code = readFileSync(path, 'utf8');
  check(`${name} extends LocalSceneBase`, code.includes('extends LocalSceneBase'));
  check(`${name} overrides createWorld`, code.includes('createWorld()'));
}

// 4. Overworld has location markers
console.log('\nOverworld structure:');
const overworld = readFileSync(resolve(ROOT, 'src/renderer/game/scenes/OverworldScene.js'), 'utf8');
check('OverworldScene uses sceneRegistry', overworld.includes('getLocalScenes'));
check('OverworldScene uses transitionTo', overworld.includes('transitionTo'));
check('OverworldScene has location markers', overworld.includes('_locationMarkers'));

// 5. Config registers all scenes
console.log('\nConfig registration:');
const config = readFileSync(resolve(ROOT, 'src/renderer/game/config.js'), 'utf8');
const expectedImports = [
  'OverworldScene', 'ZuzuGarageScene', 'StreetBlockScene', 'DogParkScene',
  'LakeEdgeScene', 'SportsFieldsScene', 'CommunityPoolScene',
  'DesertTrailScene', 'MountainScene', 'GarageScene', 'NeighborhoodScene',
];
for (const name of expectedImports) {
  check(`config imports ${name}`, config.includes(`import ${name}`));
}
check('config has scene migration map', config.includes('SCENE_KEY_MIGRATION'));

// 6. Scene registry
console.log('\nScene registry:');
const registry = readFileSync(resolve(ROOT, 'src/renderer/game/systems/sceneRegistry.js'), 'utf8');
for (const name of ['OverworldScene', 'ZuzuGarageScene', 'StreetBlockScene', 'DogParkScene']) {
  check(`Registry defines ${name}`, registry.includes(name));
}
check('Registry has isSceneUnlocked', registry.includes('isSceneUnlocked'));
check('Registry has getSpawn', registry.includes('getSpawn'));

// 7. Save system migration
console.log('\nSave system:');
const save = readFileSync(resolve(ROOT, 'src/renderer/game/systems/saveSystem.js'), 'utf8');
check('Save version is 3', save.includes('CURRENT_VERSION = 3'));
check('Save has v2→v3 migration', save.includes('migrateV2toV3'));
check('Save defaults to ZuzuGarageScene', save.includes("scene: 'ZuzuGarageScene'"));

// 8. Asset pack files
console.log('\nAsset packs:');
const packFiles = [
  'public/game/editor-assets/packs/preload-pack.json',
  'public/game/editor-assets/packs/audio-pack.json',
  'public/game/editor-assets/packs/garage-scene-pack.json',
  'public/game/editor-assets/packs/neighborhood-scene-pack.json',
  'public/game/editor-assets/packs/ui-pack.json',
];
for (const pf of packFiles) {
  const fullPath = resolve(ROOT, pf);
  if (!existsSync(fullPath)) { check(`${pf} exists`, false); continue; }
  try {
    JSON.parse(readFileSync(fullPath, 'utf8'));
    check(`${pf} (valid JSON)`, true);
  } catch { check(`${pf} (valid JSON)`, false); }
}

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
