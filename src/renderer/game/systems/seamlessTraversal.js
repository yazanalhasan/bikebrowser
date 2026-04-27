/**
 * Seamless Traversal System — sibling primitive to sceneTransition.js for
 * adjacent-screen edge walks (player walks off the east edge of one scene
 * and re-enters from the west edge of the next, preserving velocity +
 * orientation, no fade, no spawn-point lookup).
 *
 * This module is STRICTLY ADDITIVE to the legacy 2D game. The existing
 * teleport flow (`transitionTo` / `scene.start` in `sceneTransition.js`)
 * remains the path used by world-map travel, doorways, and named-spawn
 * jumps. Consumer scenes choose which primitive to call based on intent:
 *
 *   - Teleport (transitionTo)         → world-map jumps, doorways, spawn names.
 *   - Seamless (this module)          → adjacent-screen edge walks.
 *
 * Usage from a consumer scene's `create()`:
 *
 *   import {
 *     SCENE_ADJACENCY,
 *     attachEdgeSensor,
 *     performSeamlessTransition,
 *     applySeamlessEntry,
 *   } from '../systems/seamlessTraversal.js';
 *
 *   // In create(): apply incoming edge data, then attach the sensor.
 *   applySeamlessEntry(this, this._initData);
 *   attachEdgeSensor(this, this.player, (edge) => {
 *     performSeamlessTransition(this, edge, this.player);
 *   });
 *
 *   // In init(data): stash the data so create() can apply it after spawn.
 *   init(data) { this._initData = data; }
 *
 * Consumer scenes append their own adjacency entries by mutating the
 * SCENE_ADJACENCY object — no need to round-trip through this module:
 *
 *   import { SCENE_ADJACENCY } from '../systems/seamlessTraversal.js';
 *   SCENE_ADJACENCY.MyScene = {
 *     ...SCENE_ADJACENCY.MyScene,
 *     east: { to: 'OtherScene', entrySide: 'west' },
 *   };
 */

/* eslint-disable no-console */

/**
 * @typedef {'north' | 'south' | 'east' | 'west'} EdgeName
 */

/**
 * @typedef {object} AdjacencyEntry
 * @property {string} to            — target scene key.
 * @property {EdgeName} entrySide   — which edge of the target scene the
 *                                    player should enter from.
 * @property {object} [options]     — reserved for future use (e.g. forced
 *                                    facing override, audio sting suppression).
 */

/**
 * @typedef {Object<EdgeName, AdjacencyEntry>} SceneEdges
 */

/**
 * @typedef {Object<string, SceneEdges>} AdjacencyMap
 */

/**
 * Adjacency registry. Keyed by `(fromSceneKey, edge)` →
 * `{ to, entrySide, options? }`.
 *
 * **Mutable / extendable:** consumer agents register their scenes by
 * appending entries directly. Example:
 *
 *   SCENE_ADJACENCY.DryWashScene = {
 *     ...SCENE_ADJACENCY.DryWashScene,
 *     west: { to: 'NeighborhoodScene', entrySide: 'east' },
 *   };
 *
 * Seeded with the Neighborhood↔DryWash edge pair so the next agent
 * (`phaser-dry-wash-scene`) can consume the adjacency without round-
 * tripping through this module.
 *
 * @type {AdjacencyMap}
 */
export const SCENE_ADJACENCY = {
  NeighborhoodScene: {
    east: { to: 'DryWashScene', entrySide: 'west' },
    // … other edges added by consumer agents as scenes adopt the API.
  },
  DryWashScene: {
    west: { to: 'NeighborhoodScene', entrySide: 'east' },
    // East edge would lead to the locked far-side trail — left unmapped
    // until that scene exists; the edge sensor will safe-fail with a warn.
  },
};

// Edge → opposite edge lookup. Used to derive the entry edge when the
// adjacency entry omits an explicit `entrySide` (defensive fallback —
// our seeded entry always provides one).
const OPPOSITE_EDGE = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

// Spawn inset from the entry edge in pixels — keep the player just inside
// the world bounds so they don't immediately re-trigger the edge sensor.
const ENTRY_INSET = 32;

// Edge-sensor strip thickness in pixels.
const SENSOR_THICKNESS = 8;

/**
 * Read the scene's known world dimensions.
 *
 * Honors `scene.getWorldSize?.()` (LocalSceneBase pattern), then falls
 * back to physics world bounds, then to `scene.scale.{width,height}`.
 *
 * @param {Phaser.Scene} scene
 * @returns {{ width: number, height: number }}
 */
function getSceneWorldSize(scene) {
  if (typeof scene?.getWorldSize === 'function') {
    const ws = scene.getWorldSize();
    if (ws && Number.isFinite(ws.width) && Number.isFinite(ws.height)) return ws;
  }
  const bounds = scene?.physics?.world?.bounds;
  if (bounds && Number.isFinite(bounds.width) && Number.isFinite(bounds.height)) {
    return { width: bounds.width, height: bounds.height };
  }
  const sw = scene?.scale?.width ?? 800;
  const sh = scene?.scale?.height ?? 600;
  return { width: sw, height: sh };
}

/**
 * Capture player velocity + orientation in a serializable shape that can
 * be passed via `scene.start(key, data)` and restored by
 * `applySeamlessEntry`. Tolerates a partially-built player gracefully.
 *
 * @param {object} player — Player entity (with optional .sprite.body, .facing).
 * @returns {{ vx: number, vy: number, facing: string|null }}
 */
function capturePlayerKinematics(player) {
  const body = player?.sprite?.body ?? player?.body ?? null;
  const vx = Number.isFinite(body?.velocity?.x) ? body.velocity.x : 0;
  const vy = Number.isFinite(body?.velocity?.y) ? body.velocity.y : 0;
  const facing = typeof player?.facing === 'string' ? player.facing : null;
  return { vx, vy, facing };
}

/**
 * Compute the spawn `(x, y)` for an incoming player based on which edge
 * they are entering from and the target scene's world size. The spawn
 * sits at the midpoint of the entry edge, inset by ENTRY_INSET pixels so
 * the player does not immediately re-cross the same edge sensor.
 *
 * @param {EdgeName} entryEdge
 * @param {{ width: number, height: number }} world
 * @returns {{ x: number, y: number }}
 */
function computeEntryPosition(entryEdge, world) {
  const cx = world.width / 2;
  const cy = world.height / 2;
  switch (entryEdge) {
    case 'north': return { x: cx, y: ENTRY_INSET };
    case 'south': return { x: cx, y: world.height - ENTRY_INSET };
    case 'west':  return { x: ENTRY_INSET, y: cy };
    case 'east':  return { x: world.width - ENTRY_INSET, y: cy };
    default:      return { x: cx, y: cy };
  }
}

/**
 * Move a player to a given world position, robust to the various player
 * shapes used by the legacy 2D game (Player entity with .setPosition, or
 * raw sprite, or a sprite-with-body).
 *
 * @param {object} player
 * @param {number} x
 * @param {number} y
 */
function placePlayer(player, x, y) {
  if (typeof player?.setPosition === 'function') {
    player.setPosition(x, y);
    return;
  }
  if (player?.sprite?.body && typeof player.sprite.body.reset === 'function') {
    player.sprite.body.reset(x, y);
    return;
  }
  if (player?.sprite && typeof player.sprite.setPosition === 'function') {
    player.sprite.setPosition(x, y);
  }
}

/**
 * Restore captured velocity to the player's physics body, if available.
 *
 * @param {object} player
 * @param {number} vx
 * @param {number} vy
 */
function restoreVelocity(player, vx, vy) {
  const body = player?.sprite?.body ?? player?.body ?? null;
  if (body && typeof body.setVelocity === 'function') {
    body.setVelocity(vx, vy);
  } else if (body) {
    if (Number.isFinite(vx)) body.velocity = body.velocity || {};
    if (body.velocity) {
      body.velocity.x = vx;
      body.velocity.y = vy;
    }
  }
}

/**
 * Perform a seamless edge-walk transition from the current scene to its
 * adjacency-mapped neighbor. Captures the player's velocity + orientation,
 * looks up the adjacency entry, and starts the target scene with an
 * `init` payload of `{ entryEdge, vx, vy, facing }`. The target scene's
 * `init` is expected to call `applySeamlessEntry` to apply the payload.
 *
 * Safe-fail: if no adjacency entry exists for `(scene.scene.key, edge)`
 * this logs a `console.warn` and returns without throwing. Scenes that
 * have not registered all four edges are not crashed by the helper.
 *
 * Does NOT do spawn-point lookup, fade transition, or save trigger —
 * those are the teleport flow's responsibilities (see
 * `sceneTransition.js`).
 *
 * @param {Phaser.Scene} scene — the scene initiating the transition.
 * @param {EdgeName} edge — the edge the player crossed in the source scene.
 * @param {object} player — Player entity (with .sprite.body, .facing).
 */
export function performSeamlessTransition(scene, edge, player) {
  const fromKey = scene?.scene?.key;
  if (!fromKey) {
    console.warn('[seamlessTraversal] performSeamlessTransition: scene has no scene.key; aborting.');
    return;
  }

  const sceneEdges = SCENE_ADJACENCY[fromKey];
  const adj = sceneEdges?.[edge];
  const { vx: _peekVx, vy: _peekVy, facing: _peekFacing } = capturePlayerKinematics(player);
  console.log(
    `[traversal-debug] performSeamlessTransition: scene=${fromKey} edge=${edge} targetSceneId=${adj?.to ?? 'NONE'} vx=${_peekVx} vy=${_peekVy} facing=${_peekFacing} adjacencyLookup=${JSON.stringify(adj ?? null)}`,
  );
  if (!adj || !adj.to) {
    console.warn(
      `[seamlessTraversal] No adjacency for ${fromKey}.${edge}; ignoring edge cross.`,
    );
    return;
  }

  // Prevent re-entry while a transition is already in flight (mirrors
  // the guard pattern in transitionTo, but locally — this module never
  // touches scene._transitioning to avoid colliding with the teleport
  // flow's own state).
  if (scene._seamlessTransitioning) return;
  scene._seamlessTransitioning = true;

  const { vx, vy, facing } = capturePlayerKinematics(player);
  const entryEdge = adj.entrySide || OPPOSITE_EDGE[edge] || 'west';

  // Hand off to the target scene. The init payload is what the next
  // scene reads in its own `init(data)` and forwards to
  // `applySeamlessEntry`.
  const startData = {
    seamless: true,
    entryEdge,
    vx,
    vy,
    facing,
  };
  let _startDataStr;
  try { _startDataStr = JSON.stringify(startData); } catch (_e) { _startDataStr = '<unstringifiable>'; }
  console.log(
    `[traversal-debug] scene.scene.start() about to be called: target=${adj.to} data=${_startDataStr}`,
  );
  scene.scene.start(adj.to, startData);
}

/**
 * Apply a seamless-entry payload to the current scene. Call this from a
 * consumer scene's `create()` (after the player exists) using the data
 * stashed in `init(data)`.
 *
 * No-op when `data?.entryEdge` is absent, so scenes whose normal init
 * paths (teleport flow, default spawn, named spawn) pass through
 * unchanged. When present:
 *
 *   1. Computes the entry `(x, y)` from `entryEdge` + the scene's world
 *      bounds (`scene.getWorldSize?.()` → physics world bounds → scale).
 *   2. Repositions the player to that point.
 *   3. Restores `data.vx`/`data.vy` onto the player's physics body.
 *   4. Restores `data.facing` onto `player.facing` (if provided).
 *
 * Does NOT look up a named spawn point — that is the teleport flow's
 * responsibility.
 *
 * @param {Phaser.Scene} scene
 * @param {{ entryEdge?: EdgeName, vx?: number, vy?: number, facing?: string, seamless?: boolean }} [data]
 * @returns {boolean} true if the payload was applied, false on no-op.
 */
export function applySeamlessEntry(scene, data) {
  let _dataStr;
  try { _dataStr = JSON.stringify(data); } catch (_e) { _dataStr = '<unstringifiable>'; }
  console.log(
    `[traversal-debug] applySeamlessEntry: scene=${scene?.scene?.key ?? 'UNKNOWN'} data=${_dataStr}`,
  );
  if (!data || !data.entryEdge) return false;

  const player = scene?.player;
  if (!player) {
    console.warn('[seamlessTraversal] applySeamlessEntry: scene.player not ready; payload ignored.');
    return false;
  }

  const world = getSceneWorldSize(scene);
  const { x, y } = computeEntryPosition(data.entryEdge, world);

  placePlayer(player, x, y);
  restoreVelocity(player, Number.isFinite(data.vx) ? data.vx : 0, Number.isFinite(data.vy) ? data.vy : 0);

  if (typeof data.facing === 'string' && data.facing.length > 0) {
    player.facing = data.facing;
  }

  // Clear any in-flight guard left over from the prior scene's
  // performSeamlessTransition call. (The flag lived on the source
  // scene's instance — different object — so this is just defensive.)
  scene._seamlessTransitioning = false;

  return true;
}

/**
 * Attach four thin physics-overlap zones (one per cardinal edge of the
 * world) that fire `callback(edge)` when the player's sprite overlaps
 * them. OPT-IN: scenes that don't call this helper see zero behavior
 * change.
 *
 * The zones are pinned to the current world bounds at the time of the
 * call, sized SENSOR_THICKNESS pixels deep (so a fast-moving player can't
 * tunnel through them). Each zone is a static physics body — they do not
 * collide with the player, only overlap.
 *
 * Returns a small handle so callers can dispose of the sensors on scene
 * shutdown if desired (LocalSceneBase already cleans up overlap handlers
 * on scene stop, so most callers can ignore the return).
 *
 * @param {Phaser.Scene} scene
 * @param {object} player — Player entity with a .sprite property.
 * @param {(edge: EdgeName) => void} callback
 * @returns {{ zones: Object<EdgeName, Phaser.GameObjects.Rectangle>, destroy: () => void }}
 */
export function attachEdgeSensor(scene, player, callback) {
  const zones = { north: null, south: null, east: null, west: null };

  if (!scene?.physics?.add || !player?.sprite) {
    console.warn('[seamlessTraversal] attachEdgeSensor: scene.physics or player.sprite missing; no sensors attached.');
    return { zones, destroy: () => {} };
  }

  const world = getSceneWorldSize(scene);
  const t = SENSOR_THICKNESS;

  /**
   * Build one edge sensor.
   * @param {EdgeName} edge
   * @param {number} x — center x
   * @param {number} y — center y
   * @param {number} w — width
   * @param {number} h — height
   */
  const buildZone = (edge, x, y, w, h) => {
    const zone = scene.add.rectangle(x, y, w, h, 0x000000, 0);
    scene.physics.add.existing(zone, true); // static body
    console.log(
      `[traversal-debug] attachEdgeSensor: created zone ${edge} sceneKey=${scene?.scene?.key ?? 'UNKNOWN'} x=${x} y=${y} width=${w} height=${h}`,
    );
    scene.physics.add.overlap(player.sprite, zone, () => {
      const _px = player?.sprite?.x ?? player?.x ?? null;
      const _py = player?.sprite?.y ?? player?.y ?? null;
      console.log(
        `[traversal-debug] overlap fired: edge=${edge} sceneKey=${scene?.scene?.key ?? 'UNKNOWN'} playerX=${_px} playerY=${_py}`,
      );
      try {
        callback(edge);
      } catch (err) {
        console.warn(`[seamlessTraversal] edge-sensor callback for ${edge} threw:`, err);
      }
    });
    zones[edge] = zone;
    return zone;
  };

  // Place the sensors as thin strips just inside the world bounds. We
  // inset by a half-thickness so the strip's physics body lies inside
  // the world rect (otherwise Arcade's static body can be clipped).
  buildZone('north', world.width / 2,        t / 2,                   world.width, t);
  buildZone('south', world.width / 2,        world.height - t / 2,    world.width, t);
  buildZone('west',  t / 2,                  world.height / 2,        t, world.height);
  buildZone('east',  world.width - t / 2,    world.height / 2,        t, world.height);

  const destroy = () => {
    for (const key of Object.keys(zones)) {
      const z = zones[key];
      if (z && typeof z.destroy === 'function') z.destroy();
      zones[key] = null;
    }
  };

  return { zones, destroy };
}
