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

/**
 * All scenes in boot order. The first scene in the array boots first.
 * For new games, ZuzuGarageScene is the start. For saves, we reorder
 * so the saved scene boots first.
 */
/**
 * Every scene, with the key it registers, as a literal string.
 *
 * The key is written out rather than read from the class (MUST 0.16).
 * `createGameConfig` used to find the saved scene with
 * `s.name === targetScene`, and a production build renames those
 * classes to things like `Io` and `Rp` — so nothing matched, the list
 * was never reordered, and the garage booted every time. A child who
 * stopped playing in the Dry Wash always woke up in the garage, and the
 * garage spawn then overwrote where they had been standing. The dev
 * server keeps real class names, which is exactly why every test we had
 * passed while the live site did this to every save.
 *
 * A string literal survives minification. `tests/act1-scene-keys.test.mjs`
 * checks each one against the key the scene actually registers.
 */
const LAYOUT_EDITOR_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_LAYOUT_EDITOR === 'true';

export const SCENE_LIST = [
  { key: 'ZuzuGarageScene', scene: ZuzuGarageScene },
  { key: 'MaterialLabScene', scene: MaterialLabScene },
  { key: 'ThermalRigScene', scene: ThermalRigScene },
  { key: 'OverworldScene', scene: OverworldScene },
  { key: 'StreetBlockScene', scene: StreetBlockScene },
  { key: 'DesertEdgeScene', scene: DesertEdgeScene },
  { key: 'DogParkScene', scene: DogParkScene },
  { key: 'LakeEdgeScene', scene: LakeEdgeScene },
  { key: 'SportsFieldsScene', scene: SportsFieldsScene },
  { key: 'CommunityPoolScene', scene: CommunityPoolScene },
  { key: 'DesertTrailScene', scene: DesertTrailScene },
  { key: 'MountainScene', scene: MountainScene },
  { key: 'ExplainerScene', scene: ExplainerScene },
  { key: 'CognitiveQuestScene', scene: CognitiveQuestScene },
  // World map + sub-scenes
  { key: 'WorldMapScene', scene: WorldMapScene },
  { key: 'DesertForagingScene', scene: DesertForagingScene },
  { key: 'CopperMineScene', scene: CopperMineScene },
  { key: 'SaltRiverScene', scene: SaltRiverScene },
  { key: 'DryWashScene', scene: DryWashScene },
];

/**
 * Is the layout editor part of this build?
 *
 * On in dev, and in a preview build that asks for it with
 * VITE_LAYOUT_EDITOR=true. Never in what ships.
 */
export function layoutEditorEnabled() {
  return LAYOUT_EDITOR_ENABLED;
}

/**
 * Add the dev layout editor to a running game, if this build has one.
 *
 * It used to be a SCENE_LIST entry with active:true, which meant it was
 * live in every session of the built game, listening for F2 — and F2
 * opens an editor that drags scene furniture around and writes layout
 * JSON. Found in the production bundle while reading the scene list
 * during the MUST 1 fix; not in review.md.
 *
 * Imported dynamically so the module is not in a shipped bundle at all,
 * and added last, so it is on top of whatever scene is running.
 *
 * @param {Phaser.Game} game
 * @returns {Promise<boolean>} true if it was added.
 */
export async function attachLayoutEditor(game) {
  if (!LAYOUT_EDITOR_ENABLED || !game) return false;
  const mod = await import('./scenes/LayoutEditorOverlayScene.js');
  if (game.scene.getScene('LayoutEditorOverlayScene')) return true;
  game.scene.add('LayoutEditorOverlayScene', mod.default, true);
  return true;
}

const ALL_SCENES = SCENE_LIST.map((entry) => entry.scene);

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

  // Reorder so the target scene boots first.
  //
  // By KEY, never by class name (MUST 0.16): `s.name` is whatever the
  // minifier decided, so this match silently failed in every production
  // build and the garage booted no matter what the save said.
  if (targetScene && targetScene !== 'ZuzuGarageScene') {
    const idx = SCENE_LIST.findIndex((entry) => entry.key === targetScene);
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
