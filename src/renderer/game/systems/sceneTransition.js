/**
 * Scene Transition System — handles moving between scenes with
 * fade effects, spawn point resolution, and state preservation.
 *
 * Usage from any scene:
 *   import { transitionTo } from '../systems/sceneTransition.js';
 *   transitionTo(this, 'StreetBlockScene', 'fromGarage');
 */

import { saveGame } from './saveSystem.js';
import { SCENE_MAP, getSpawn, isSceneUnlocked } from './sceneRegistry.js';

const FADE_MS = 350;

/**
 * Transition from the current scene to another scene.
 *
 * @param {Phaser.Scene} currentScene — the scene initiating the transition
 * @param {string} targetSceneKey — scene key to transition to
 * @param {string} [spawnName='default'] — named spawn point in the target scene
 * @param {object} [opts] — options
 * @param {number} [opts.fadeMs=350] — fade duration in ms
 * @param {string} [opts.sfx='door_interact'] — SFX to play on transition
 */
export function transitionTo(currentScene, targetSceneKey, spawnName = 'default', opts = {}) {
  // Prevent double transitions
  if (currentScene._transitioning) return;
  currentScene._transitioning = true;

  const fadeMs = opts.fadeMs ?? FADE_MS;
  const sfx = opts.sfx ?? 'door_interact';

  // Check unlock
  const state = currentScene.registry.get('gameState');
  if (!isSceneUnlocked(targetSceneKey, state)) {
    currentScene._transitioning = false;
    currentScene.registry.set('dialogEvent', {
      speaker: 'System',
      text: 'This area is not yet accessible. Keep building your reputation!',
      choices: null,
      step: null,
    });
    return;
  }

  // Play transition SFX
  const audioMgr = currentScene.registry.get('audioManager');
  if (sfx) audioMgr?.playSfx(sfx);

  // Resolve spawn point
  const spawn = getSpawn(targetSceneKey, spawnName);

  // Save position in target scene
  const updated = {
    ...state,
    player: {
      x: spawn.x,
      y: spawn.y,
      scene: targetSceneKey,
    },
  };
  currentScene.registry.set('gameState', updated);
  saveGame(updated);

  // Fade out then start target scene
  currentScene.cameras.main.fadeOut(fadeMs, 0, 0, 0, (_cam, progress) => {
    if (progress >= 1) {
      currentScene.scene.start(targetSceneKey);
    }
  });
}

/**
 * Get display info for the current scene (for HUD).
 * @param {string} sceneKey
 * @returns {{ name: string, icon: string, layer: string } | null}
 */
export function getSceneInfo(sceneKey) {
  return SCENE_MAP[sceneKey] || null;
}
