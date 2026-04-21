/**
 * Asset Pack Loader — centralized loader for Phaser Editor asset packs.
 *
 * Phaser Editor exports asset definitions as Asset Pack JSON files.
 * This module provides helpers to load those packs in Phaser scenes,
 * serving as the bridge between editor-managed assets and the runtime.
 *
 * Usage in a scene's preload():
 *   import { loadPack } from '../assetPackLoader.js';
 *   preload() {
 *     loadPack(this, 'preload');
 *     loadPack(this, 'neighborhood-scene');
 *   }
 *
 * Pack files live in: public/game/editor-assets/packs/<name>-pack.json
 * Each pack file uses the standard Phaser Asset Pack JSON format.
 */

/**
 * All known asset packs. Keys match the section name inside each pack JSON.
 * Values are the URL paths relative to the public folder.
 */
const PACKS = {
  'preload': 'game/editor-assets/packs/preload-pack.json',
  'audio': 'game/editor-assets/packs/audio-pack.json',
  'garage-scene': 'game/editor-assets/packs/garage-scene-pack.json',
  'neighborhood-scene': 'game/editor-assets/packs/neighborhood-scene-pack.json',
  'ui': 'game/editor-assets/packs/ui-pack.json',
};

/**
 * Load an asset pack in a Phaser scene's preload() method.
 *
 * @param {Phaser.Scene} scene - The scene calling this from preload()
 * @param {string} packKey - Key from the PACKS registry above
 */
export function loadPack(scene, packKey) {
  const url = PACKS[packKey];
  if (!url) {
    console.warn(`[assetPackLoader] Unknown pack key: "${packKey}"`);
    return;
  }
  scene.load.pack(packKey, url);
}

/**
 * Load multiple asset packs at once.
 *
 * @param {Phaser.Scene} scene
 * @param {string[]} packKeys
 */
export function loadPacks(scene, packKeys) {
  for (const key of packKeys) {
    loadPack(scene, key);
  }
}

/**
 * Get the URL for a pack file (useful for manual/dynamic loading).
 *
 * @param {string} packKey
 * @returns {string|null}
 */
export function getPackUrl(packKey) {
  return PACKS[packKey] || null;
}

export default PACKS;
