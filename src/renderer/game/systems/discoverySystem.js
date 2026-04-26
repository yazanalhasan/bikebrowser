/**
 * Discovery System — tracks which world-map tiles the player has explored.
 *
 * Civilization-style fog of war, but data only. Rendering is owned by
 * separate agents (world-fog-overlay, world-node-gating) that consume the
 * public API exposed below.
 *
 * Storage: a sparse `Set<string>` keyed by `${gx}_${gy}`. Most of the world
 * stays undiscovered most of the time, so a sparse Set keeps memory and
 * save-payload size proportional to *explored* tiles rather than total tiles.
 *
 * Persistence: serialized via `getDiscoveryState()` → embedded in the save,
 * rehydrated via `loadDiscoveryState(payload)`. Older saves without a
 * `discovery` field hydrate cleanly into an empty discovery state.
 *
 * Coordinate system:
 *   - World pixels (px, py) are continuous coordinates from the world map.
 *   - Grid cells (gx, gy) are world pixels divided by DISCOVERY_TILE_SIZE.
 *   - revealArea works in world pixels with a pixel radius; the system
 *     converts to grid cells internally and reveals every grid cell whose
 *     center falls inside the circle.
 */

/** Grid cell size in world pixels. */
export const DISCOVERY_TILE_SIZE = 32;

// ── Region-discovered pub/sub ────────────────────────────────────────────────

/**
 * Registered listeners for region-discovered events.
 * @type {Array<function({ regionId: string }): void>}
 */
const _regionDiscoveredListeners = [];

/**
 * Register a callback that fires whenever a world-map location is revealed.
 * The callback receives `{ regionId }` where regionId is the WORLD_LOCATIONS
 * nodeId (locationId) of the newly discovered location.
 *
 * @param {function({ regionId: string }): void} callback
 * @returns {function(): void} Unsubscribe function — call to remove the listener.
 */
export function onRegionDiscovered(callback) {
  _regionDiscoveredListeners.push(callback);
  return function unsubscribe() {
    const idx = _regionDiscoveredListeners.indexOf(callback);
    if (idx >= 0) _regionDiscoveredListeners.splice(idx, 1);
  };
}

/**
 * Emit a region-discovered event to all registered listeners.
 *
 * @internal — exported for WorldMapScene.revealNode() to call after discovery.
 *   Do not call from outside the discovery/world-map layer.
 * @param {string} regionId — the WORLD_LOCATIONS nodeId (locationId) that was revealed.
 */
export function _emitRegionDiscovered(regionId) {
  for (const cb of _regionDiscoveredListeners) {
    try {
      cb({ regionId });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[discovery] listener error in onRegionDiscovered handler', e);
    }
  }
}

// ── Module state ────────────────────────────────────────────────────────────

/**
 * Sparse set of revealed grid cells. Keys are `${gx}_${gy}` strings.
 * @type {Set<string>}
 */
let revealed = new Set();

/** Cached map dimensions in world pixels (used for clamping reveal queries). */
let mapWidth = 0;
let mapHeight = 0;

// ── Helpers ─────────────────────────────────────────────────────────────────

function key(gx, gy) {
  return `${gx}_${gy}`;
}

function maxGridX() {
  return mapWidth > 0 ? Math.max(0, Math.ceil(mapWidth / DISCOVERY_TILE_SIZE) - 1) : Infinity;
}

function maxGridY() {
  return mapHeight > 0 ? Math.max(0, Math.ceil(mapHeight / DISCOVERY_TILE_SIZE) - 1) : Infinity;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the discovery grid for a world map of the given pixel size.
 * Clears any existing reveal state. Call this once per world-map session,
 * BEFORE applying loaded save data (then call `loadDiscoveryState` to hydrate).
 *
 * @param {number} width  World width in pixels.
 * @param {number} height World height in pixels.
 */
export function initDiscovery(width, height) {
  mapWidth = Number.isFinite(width) && width > 0 ? width : 0;
  mapHeight = Number.isFinite(height) && height > 0 ? height : 0;
  revealed = new Set();
}

/**
 * Reveal every grid cell whose center falls inside the circle defined by
 * (px, py, radius) — all in world pixels.
 *
 * Cheap to call every frame: bounded loop over the radius's grid footprint,
 * Set.add is O(1), and tiles already revealed are no-ops.
 *
 * @param {number} px     Reveal center X (world pixels).
 * @param {number} py     Reveal center Y (world pixels).
 * @param {number} radius Reveal radius (world pixels).
 */
export function revealArea(px, py, radius) {
  if (!Number.isFinite(px) || !Number.isFinite(py)) return;
  if (!Number.isFinite(radius) || radius <= 0) return;

  const tile = DISCOVERY_TILE_SIZE;
  const r2 = radius * radius;

  // Grid footprint of the circle.
  const gxMin = Math.max(0, Math.floor((px - radius) / tile));
  const gyMin = Math.max(0, Math.floor((py - radius) / tile));
  const gxMax = Math.min(maxGridX(), Math.floor((px + radius) / tile));
  const gyMax = Math.min(maxGridY(), Math.floor((py + radius) / tile));

  for (let gy = gyMin; gy <= gyMax; gy++) {
    const cy = gy * tile + tile / 2;
    const dy = cy - py;
    for (let gx = gxMin; gx <= gxMax; gx++) {
      const cx = gx * tile + tile / 2;
      const dx = cx - px;
      if (dx * dx + dy * dy <= r2) {
        revealed.add(key(gx, gy));
      }
    }
  }
}

/**
 * Has the grid cell containing world pixel (x, y) been revealed?
 *
 * Accepts either world pixels OR grid coordinates — disambiguated by whether
 * the values look like pixels (>= DISCOVERY_TILE_SIZE in either axis is
 * treated as pixels for safety, but to keep the API predictable we ALWAYS
 * treat (x, y) as world pixels). Callers needing raw grid lookups can do
 * `isDiscovered(gx * DISCOVERY_TILE_SIZE, gy * DISCOVERY_TILE_SIZE)`.
 *
 * @param {number} x World X (pixels).
 * @param {number} y World Y (pixels).
 * @returns {boolean}
 */
export function isDiscovered(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const gx = Math.floor(x / DISCOVERY_TILE_SIZE);
  const gy = Math.floor(y / DISCOVERY_TILE_SIZE);
  return revealed.has(key(gx, gy));
}

/**
 * Serialize current discovery state for saving.
 *
 * Shape:
 *   {
 *     tiles:  string[],   // ["3_5", "3_6", ...]
 *     width:  number,     // map width in pixels at init time
 *     height: number,     // map height in pixels at init time
 *     tile:   number,     // DISCOVERY_TILE_SIZE — embedded for forward compat
 *   }
 *
 * @returns {{ tiles: string[], width: number, height: number, tile: number }}
 */
export function getDiscoveryState() {
  return {
    tiles: Array.from(revealed),
    width: mapWidth,
    height: mapHeight,
    tile: DISCOVERY_TILE_SIZE,
  };
}

/**
 * Hydrate discovery state from a saved payload.
 *
 * Backwards compatibility:
 *   - `null` / `undefined` / non-object → start with empty set.
 *   - Missing `tiles` → empty set.
 *   - Missing `width`/`height` → keep whatever `initDiscovery` set, else 0.
 *
 * @param {unknown} payload Whatever was stored in `save.discovery`.
 */
export function loadDiscoveryState(payload) {
  if (!payload || typeof payload !== 'object') {
    revealed = new Set();
    return;
  }

  const tiles = Array.isArray(payload.tiles) ? payload.tiles : [];
  revealed = new Set(tiles.filter((t) => typeof t === 'string'));

  if (Number.isFinite(payload.width) && payload.width > 0) {
    mapWidth = payload.width;
  }
  if (Number.isFinite(payload.height) && payload.height > 0) {
    mapHeight = payload.height;
  }
}

/**
 * Clear all revealed tiles (e.g. New Game). Map dimensions are preserved.
 */
export function resetDiscovery() {
  revealed = new Set();
}

/**
 * Internal/test helper — returns the live revealed Set.
 * Not part of the supported public surface, but safe to read.
 */
export function _debugGetRevealedSet() {
  return revealed;
}
