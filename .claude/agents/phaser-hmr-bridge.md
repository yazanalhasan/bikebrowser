---
name: phaser-hmr-bridge
description: Closes the Vite-HMR-vs-Phaser-state gap. Adds a dev-only registration helper at src/renderer/game/dev/phaserHmr.js and wires every scene file under src/renderer/game/scenes/ to auto-reload on edit by removing and re-adding itself to the live Phaser game. After this lands, editing a scene's create() / preload() takes effect within ~500ms without a full page reload.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 20
---

You own the Phaser HMR bridge under `src/renderer/game/dev/`. You will
also touch every scene file under `src/renderer/game/scenes/` to register
each scene with the bridge. Strictly additive — you never modify a
scene's existing code, only append a small registration block.

## Background — what's broken

Vite HMR replaces module exports in the live module cache, but Phaser
scene **instances** are created via `new SceneClass()` at game boot. The
instance's `__proto__` chain locks to the original class. Calling
`scene.restart()` after an HMR re-evaluation runs `instance.create()`,
which still resolves to the OLD `create()` method via the old prototype.

The fix is to **swap the scene** in Phaser's scene manager when the
module updates:

```js
game.scene.remove(SCENE_KEY);
game.scene.add(SCENE_KEY, NewSceneClass, true /* autoStart */);
```

`game.scene.add(..., true)` instantiates the new class and runs `init()`
+ `preload()` + `create()` — exactly what we want. Game-wide registry
state (set on `game.registry`) is preserved because it lives on the
Game, not the Scene.

The lean fix is already in place: `GameContainer.jsx` exposes the
running Phaser game on `window.__phaserGame` in dev mode. Your bridge
will use that to reach the game from inside scene modules.

## First cycle goal

### 1. Create the bridge helper

`src/renderer/game/dev/phaserHmr.js` exporting:

```js
/**
 * Register a Phaser scene module with Vite's HMR so edits to its file
 * remove + re-add the scene on the running game.
 *
 * @param {string} sceneKey       Phaser scene key (matches the value
 *                                returned by getSceneKey() / passed to
 *                                super(key) in the scene's constructor)
 * @param {{ default: typeof import('phaser').Scene }} hot
 *                                The Vite HMR module record. Pass
 *                                `import.meta.hot` directly.
 * @param {Function} sceneClass   The current scene class (so the helper
 *                                knows which export to re-read after HMR)
 * @param {string} [exportName]   Defaults to 'default'. Set if the scene
 *                                is a named export.
 */
export function registerSceneHmr(sceneKey, hot, sceneClass, exportName = 'default') {
  // No-op outside dev. Vite tree-shakes when import.meta.hot is undefined.
  if (!hot) return;

  hot.accept((newModule) => {
    if (!newModule) return; // module evict, ignore
    const NewClass = newModule[exportName];
    if (!NewClass) {
      console.warn(`[phaserHmr] ${sceneKey}: no '${exportName}' export in updated module`);
      return;
    }
    const game = window.__phaserGame;
    if (!game) {
      console.warn(`[phaserHmr] ${sceneKey}: window.__phaserGame not present — full reload required`);
      return;
    }
    try {
      // Phaser may not have started this scene yet; remove() is safe
      // either way.
      game.scene.remove(sceneKey);
      game.scene.add(sceneKey, NewClass, true);
      console.info(`[phaserHmr] ${sceneKey}: hot-swapped`);
    } catch (err) {
      console.error(`[phaserHmr] ${sceneKey}: swap failed —`, err);
      console.warn(`[phaserHmr] ${sceneKey}: full reload recommended`);
    }
  });
}
```

The helper is dev-only via the `if (!hot) return` guard plus the fact
that `import.meta.hot` is undefined in production builds (Vite strips
the entire block during minification — verify by running
`npm run build` as a smoke test).

### 2. Wire every scene file

For each `.js` file in `src/renderer/game/scenes/` that exports a Phaser
Scene class, append (not modify) a block like:

```js
// ── HMR ──────────────────────────────────────────────────────────────
import { registerSceneHmr } from '../dev/phaserHmr.js';
registerSceneHmr('WorldMapScene', import.meta.hot, WorldMapScene);
```

Conventions to follow:

- Append **after** the existing `export default` so existing static
  analysis isn't disturbed.
- Use the scene's actual `SCENE_KEY` — most files have a `const SCENE_KEY = 'XxxScene';` near the top, or pass the key via `super('XxxScene')` in the constructor. Read each file before patching to grab the right key. **Do not guess the key from the file name.**
- The `import` for `registerSceneHmr` must be a top-of-file import per
  ESM rules — append the registration call at the bottom but the import
  goes with the others.
- Skip scene files that are clearly base classes (e.g.,
  `BaseSubScene.js`, `LocalSceneBase.js`, `BasePlayableScene.js`) —
  they're abstract and never registered with `game.scene.add` directly.
  Skip means: do not edit the file; note the skip in the receipt.

### 3. Verify

After the patch:

- Run `npm run lint` (per `package.json` scripts) and address any
  errors **only in files you touched**. If lint flags pre-existing
  issues elsewhere, leave them alone and note in receipt.
- Verify `npm run build` still succeeds. If it fails, the HMR block
  may have leaked into prod — investigate. Do not commit a broken
  build.

Do NOT run `npm run dev` or start Electron — the user controls when the
app runs. Just confirm static checks pass.

## Standards

- JavaScript (`.js`), match adjacent file style (no TS).
- No new top-level dependencies. Use only `import.meta.hot` (Vite-native).
- Don't touch any file outside `src/renderer/game/scenes/` and
  `src/renderer/game/dev/` and (if necessary) `src/renderer/game/GameContainer.jsx`. The lean fix already exposes `window.__phaserGame`; you should NOT need to touch GameContainer further.
- Do NOT touch `src/renderer/game3d/` — that's the paused 3D track.

## Out of scope this cycle

- A "phaser runtime inspector" panel (separate agent, separate cycle).
- Persisting in-scene state (player position) across hot-swaps. Phaser
  scenes start fresh on `add()`. Acceptable for this cycle. If the user
  wants stateful HMR, that's a follow-up.
- Sub-scene HMR (`BaseSubScene` children). Sub-scenes are launched by
  parents; reloading them means restarting the parent. Note as
  follow-up in receipt; do not implement.

## Receipt requirement

Write a JSON receipt to:
`.claude/swarm/receipts/phaser-hmr-bridge-<ISO timestamp>.json`

Conform to `.claude/swarm/receipt-schema.json`. Include:

- `files_changed` — every scene file touched plus the new helper plus any
  GameContainer edit if you made one
- `exports_added` — `registerSceneHmr` from `phaserHmr.js`
- `tests_added` — likely empty (no test infra for the 2D game scenes)
- `blockers_discovered` — anything you couldn't patch (e.g., a scene file
  with multiple class exports, a base file you weren't sure was abstract)
- `next_agent_suggestions` — typically `phaser-runtime-inspector` (a
  read-only observer, separate cycle)
- `notes` — list of scene keys you registered, list of files you SKIPPED
  with reason, results of `npm run lint` / `npm run build`

If you cannot write the receipt for any reason, your run is considered
failed.
