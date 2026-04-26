/**
 * Phaser game configuration.
 *
 * Used by GameContainer.jsx to create the Phaser.Game instance.
 * Scenes are imported here so Phaser can register them.
 *
 * Scene architecture (3 layers):
 *   Overworld  — macro navigation map
 *   Local      — zoomed-in playable locations
 *   Micro      — focused interaction overlays (future)
 */

import Phaser from 'phaser';

// Overworld
import OverworldScene from './scenes/OverworldScene.js';

// Local scenes
import ZuzuGarageScene from './scenes/ZuzuGarageScene.js';
import MaterialLabScene from './scenes/MaterialLabScene.js';
import StreetBlockScene from './scenes/StreetBlockScene.js';
import DogParkScene from './scenes/DogParkScene.js';
import LakeEdgeScene from './scenes/LakeEdgeScene.js';
import SportsFieldsScene from './scenes/SportsFieldsScene.js';
import CommunityPoolScene from './scenes/CommunityPoolScene.js';
import DesertTrailScene from './scenes/DesertTrailScene.js';
import MountainScene from './scenes/MountainScene.js';

// World map + sub-scenes (Quest for Glory-style expansion)
import WorldMapScene from './scenes/WorldMapScene.js';
import DesertForagingScene from './scenes/DesertForagingScene.js';
import CopperMineScene from './scenes/CopperMineScene.js';
import SaltRiverScene from './scenes/SaltRiverScene.js';

// Legacy scenes (kept for save compat — old saves reference these keys)
import GarageScene from './scenes/GarageScene.js';
import NeighborhoodScene from './scenes/NeighborhoodScene.js';

/**
 * All scenes in boot order. The first scene in the array boots first.
 * For new games, ZuzuGarageScene is the start. For saves, we reorder
 * so the saved scene boots first.
 */
const ALL_SCENES = [
  ZuzuGarageScene,
  MaterialLabScene,
  OverworldScene,
  StreetBlockScene,
  DogParkScene,
  LakeEdgeScene,
  SportsFieldsScene,
  CommunityPoolScene,
  DesertTrailScene,
  MountainScene,
  // World map + sub-scenes
  WorldMapScene,
  DesertForagingScene,
  CopperMineScene,
  SaltRiverScene,
  // Legacy scenes (for old saves that reference GarageScene/NeighborhoodScene)
  GarageScene,
  NeighborhoodScene,
];

/**
 * Map old scene keys to new ones for save migration.
 */
export const SCENE_KEY_MIGRATION = {
  GarageScene: 'ZuzuGarageScene',
  NeighborhoodScene: 'OverworldScene',
};

/**
 * Build a Phaser config object.
 * @param {HTMLElement} parent - DOM element to mount the canvas into.
 * @param {number} width
 * @param {number} height
 * @param {string} [startScene] - scene key to boot first
 */
export function createGameConfig(parent, width, height, startScene) {
  const allScenes = [...ALL_SCENES];

  // Migrate legacy scene keys
  let targetScene = startScene;
  if (targetScene && SCENE_KEY_MIGRATION[targetScene]) {
    targetScene = SCENE_KEY_MIGRATION[targetScene];
  }

  // Reorder so the target scene boots first
  if (targetScene && targetScene !== 'ZuzuGarageScene') {
    const idx = allScenes.findIndex(
      s => s.name === targetScene || s.prototype?.constructor?.name === targetScene
    );
    if (idx > 0) {
      const [target] = allScenes.splice(idx, 1);
      allScenes.unshift(target);
    }
  }

  return {
    type: Phaser.CANVAS,
    parent,
    width,
    height,
    backgroundColor: '#333333',
    audio: { noAudio: true }, // We use our own AudioManager; avoid a second AudioContext
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: allScenes,
    disableContextMenu: true,
    pauseOnBlur: false,
  };
}
