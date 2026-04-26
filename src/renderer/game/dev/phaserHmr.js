/**
 * Phaser ⇄ Vite HMR bridge.
 *
 * Vite HMR replaces module exports in the live module cache, but Phaser
 * scene **instances** are created via `new SceneClass()` at game boot,
 * and their `__proto__` chain locks to the original class. Calling
 * `scene.restart()` after an HMR update would re-run the OLD `create()`.
 *
 * The fix is to remove + re-add the scene on the running Phaser game so
 * Phaser instantiates the freshly-loaded class:
 *
 *   game.scene.remove(KEY);
 *   game.scene.add(KEY, NewSceneClass, true);  // autoStart
 *
 * `GameContainer.jsx` exposes the running game on `window.__phaserGame`
 * in dev mode; this helper reads it from there.
 *
 * Production builds: `import.meta.hot` is `undefined`, so the early
 * return below makes the rest of the function dead code that Vite
 * tree-shakes during minification.
 */

/**
 * Register a Phaser scene module with Vite's HMR so edits to its file
 * remove + re-add the scene on the running Phaser game.
 *
 * Strictly additive — call this at module top-level (after the scene's
 * `export default`) and pass `import.meta.hot` directly. In production
 * the call is a no-op.
 *
 * @param {string} sceneKey
 *   Phaser scene key — must match the value passed to `super(key)` in
 *   the scene's constructor (or returned by `getSceneKey()`).
 * @param {import('vite/types/hot.d.ts').ViteHotContext | undefined} hot
 *   The Vite HMR module record. Pass `import.meta.hot`. Falsy in prod.
 * @param {Function} _sceneClass
 *   The current scene class. Reserved for future diagnostics; the
 *   helper re-reads the new class from the updated module on each
 *   accept callback.
 * @param {string} [exportName='default']
 *   Which export holds the scene class. Override only if the scene is
 *   a named export rather than the default.
 * @returns {void}
 */
// eslint-disable-next-line no-unused-vars
export function registerSceneHmr(sceneKey, hot, _sceneClass, exportName = 'default') {
  // No-op outside dev. Vite tree-shakes everything below in production.
  if (!hot) return;

  hot.accept((newModule) => {
    // Module was evicted (e.g. file deleted) — nothing to swap in.
    if (!newModule) return;

    const NewClass = newModule[exportName];
    if (!NewClass) {
      console.warn(
        `[phaserHmr] ${sceneKey}: no '${exportName}' export in updated module — skipping swap`
      );
      return;
    }

    const game = window.__phaserGame;
    if (!game) {
      console.warn(
        `[phaserHmr] ${sceneKey}: window.__phaserGame not present — full reload required`
      );
      return;
    }

    try {
      // remove() is safe whether or not the scene has been started yet.
      game.scene.remove(sceneKey);
      game.scene.add(sceneKey, NewClass, true /* autoStart */);
      console.info(`[phaserHmr] ${sceneKey}: hot-swapped`);
    } catch (err) {
      console.error(`[phaserHmr] ${sceneKey}: swap failed —`, err);
      console.warn(`[phaserHmr] ${sceneKey}: full reload recommended`);
    }
  });
}
