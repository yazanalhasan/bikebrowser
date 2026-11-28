/**
 * A challenge's id comes from the challenge, not from how many have been
 * registered.
 *
 * `BaseSubScene.addChallenge` built the id from `this._challenges.length`,
 * and that array is only emptied in the constructor. Phaser reuses the
 * scene object across visits, so the second visit to the mine numbered the
 * same three challenges `_3`.._5`: none of them matched a solved marker,
 * all three reopened, and each paid its reward again. Twenty Zuzubucks a
 * lap, for as many laps as a child cared to walk.
 *
 * Pure: no Phaser, no DOM.
 */

/** Lower-case, underscore-joined, letters and digits only. */
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * The stable id for a challenge in a scene.
 *
 * Prefers an explicit `config.id`, then its label, then its question —
 * each of which identifies the challenge itself rather than its position.
 *
 * @param {string} sceneKey
 * @param {{id?: string, label?: string, question?: string}} config
 */
export function challengeIdFor(sceneKey, config = {}) {
  const basis = config.id || config.label || config.question || 'challenge';
  return `challenge_${sceneKey}_${slugify(basis)}`;
}
