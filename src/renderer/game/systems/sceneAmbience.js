/**
 * Ambience cues that depend on where the player is.
 *
 * Pure data and string helpers, kept out of `MCPSystem.js` so they can be
 * tested without a Phaser scene.
 *
 * No scene imports.
 */

/**
 * Scenes with a roof over them.
 *
 * The "Extreme heat! Seek shade or hydrate." warning is an outdoor-desert
 * cue. It was firing in the garage, in both labs and inside the copper mine,
 * where it reads as a bug — and on a phone it landed on the coins chip.
 */
export const INDOOR_SCENES = new Set([
  'ZuzuGarageScene',
  'MaterialLabScene',
  'ThermalRigScene',
  'CopperMineScene',
  'ExplainerScene',
  'CognitiveQuestScene',
]);

/** True when the heat warning makes sense in this scene. */
export function isOutdoorScene(sceneKey) {
  return !INDOOR_SCENES.has(sceneKey);
}

/**
 * "desert_lavender" -> "Desert lavender".
 *
 * Ids are not for children; the forage hint used to show the raw species id.
 */
export function prettyName(id) {
  if (typeof id !== 'string' || !id.trim()) return 'A plant';
  const words = id.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
