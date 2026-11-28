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
import ThermalRigScene from './scenes/ThermalRigScene.js';
import StreetBlockScene from './scenes/StreetBlockScene.js';
import DesertEdgeScene from './scenes/DesertEdgeScene.js';
import DogParkScene from './scenes/DogParkScene.js';
import LakeEdgeScene from './scenes/LakeEdgeScene.js';
import SportsFieldsScene from './scenes/SportsFieldsScene.js';
import CommunityPoolScene from './scenes/CommunityPoolScene.js';
import DesertTrailScene from './scenes/DesertTrailScene.js';
import MountainScene from './scenes/MountainScene.js';
import ExplainerScene from './scenes/ExplainerScene.js';
import CognitiveQuestScene from './scenes/CognitiveQuestScene.js';

// World map + sub-scenes (Quest for Glory-style expansion)
import WorldMapScene from './scenes/WorldMapScene.js';
import DesertForagingScene from './scenes/DesertForagingScene.js';
import CopperMineScene from './scenes/CopperMineScene.js';
import SaltRiverScene from './scenes/SaltRiverScene.js';
import DryWashScene from './scenes/DryWashScene.js';

// Dev-only overlay (F2 layout editor). Always registered; activates on F2.
import LayoutEditorOverlayScene from './scenes/LayoutEditorOverlayScene.js';

/**
 * All scenes in boot order. The first scene in the array boots first.
 * For new games, ZuzuGarageScene is the start. For saves, we reorder
 * so the saved scene boots first.
 */
const ALL_SCENES = [
  ZuzuGarageScene,
  MaterialLabScene,
  ThermalRigScene,
  OverworldScene,
  StreetBlockScene,
  DesertEdgeScene,
  DogParkScene,
  LakeEdgeScene,
  SportsFieldsScene,
  CommunityPoolScene,
  DesertTrailScene,
  MountainScene,
  ExplainerScene,
  CognitiveQuestScene,
  // World map + sub-scenes
  WorldMapScene,
  DesertForagingScene,
  CopperMineScene,
  SaltRiverScene,
  DryWashScene,
  // Dev overlay (must be last so it's last to boot but always-active)
  LayoutEditorOverlayScene,
];

/**
 * Map old scene keys to new ones for save migration.
 *
 * The scenes themselves are gone (MUST 0.15): they were drawn with
 * Graphics primitives and a child who walked west out of the Dry Wash
 * landed in them with no way back. This map is the whole of what is left
 * of them — `loadGame` rewrites a retired key to its live scene before
 * the game boots, so nothing can start one.
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
    // The Act 1 art is 16-bit pixel art authored at its on-screen size.
    // pixelArt disables texture smoothing so sprites stay crisp instead of
    // being bilinear-filtered into mush. On the CANVAS renderer this clears
    // imageSmoothingEnabled on the 2D context; roundPixels keeps sprites on
    // whole-pixel positions so they don't shimmer while the camera scrolls.
    pixelArt: true,
    roundPixels: true,
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
