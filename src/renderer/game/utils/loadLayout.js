/**
 * Resolve a layout JSON loaded into Phaser's cache.json.
 *
 * Throws if the cache key is missing — callers must register the layout
 * via this.load.json(key, path) in the scene's preload(). This is
 * deliberate: a missing layout is a bug, not a fallback condition.
 *
 * Returns the layout's `objects` map directly so callers can write
 * `this.layout.<name>.x` rather than `this.layout.objects.<name>.x`.
 */
export function loadLayout(scene, key) {
  const data = scene.cache.json.get(key);
  if (!data?.objects) {
    throw new Error(`Layout not found in cache: ${key}`);
  }
  return data.objects;
}

/**
 * The layout for the shape of screen the game is actually on.
 *
 * An overlay authored at 800x600 and contain-fitted onto a 390x844 phone
 * lands at 0.4875: 550 px of height thrown away and PATCH rendered at
 * 4.9 CSS px. A layout file may carry a `portrait` block authored for a
 * tall screen; this picks it when the viewport is taller than it is wide.
 *
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @returns {{objects: object, designWidth: number, designHeight: number,
 *            portrait: boolean}}
 */
export function loadResponsiveLayout(scene, key) {
  const data = scene.cache.json.get(key);
  if (!data?.objects) {
    throw new Error(`Layout not found in cache: ${key}`);
  }
  const cam = scene.cameras?.main;
  const isPortrait = Boolean(cam && cam.height > cam.width);
  const portrait = data.portrait;

  if (isPortrait && portrait?.objects) {
    return {
      // Merged over the landscape block, not instead of it. A portrait
      // layout only has to say what MOVES; every other key keeps its
      // landscape entry, so adding one object to a scene does not mean
      // remembering to add it to a second block as well — and a key
      // that was forgotten reads as "unchanged" rather than undefined
      // (plan 0.5).
      objects: { ...data.objects, ...portrait.objects },
      designWidth: portrait.designWidth || 400,
      designHeight: portrait.designHeight || 860,
      portrait: true,
    };
  }
  return {
    objects: data.objects,
    designWidth: data.designWidth || 800,
    designHeight: data.designHeight || 600,
    portrait: false,
  };
}

export default loadLayout;
