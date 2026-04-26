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

export default loadLayout;
