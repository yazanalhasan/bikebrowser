/**
 * ecologyState — per-scene EcologyEntity registry.
 *
 * Per ecology-substrate.md §10 (Performance and lifecycle), the
 * substrate keeps a `Map<sceneKey, Map<entityId, EcologyEntity>>` so
 * every consumer query is scene-scoped (the typical case) but
 * cross-scene queries are still possible by walking the outer map.
 *
 * The state is module-private. Use the exported helpers — never reach
 * into the maps directly. This module does **not** import the
 * EcologyEntity class; it stores opaque objects so unit tests can
 * inject mock entities without inheriting the class.
 *
 * Lifecycle:
 *   - Scenes attach via `addEntity(sceneKey, entity)` during scene
 *     `create()`.
 *   - `releaseScene(sceneKey)` is called from a `scene.shutdown`
 *     listener (wired by `registerEntity`) and clears that scene's
 *     entries.
 *   - Procedural populations (Phase 6) follow the same lifecycle but
 *     additionally serialize to `state.ecology[regionId]` before
 *     shutdown — that integration is NOT in this module.
 */

/**
 * @typedef {import('./EcologyEntity.js').EcologyEntity} EcologyEntity
 */

/** @type {Map<string, Map<string, EcologyEntity>>} */
const _byScene = new Map();

/** Monotonically-increasing per-scene+species counter for stable ids. */
const _idCounters = new Map();

/**
 * Generate a substrate-stable id of the form
 * `<sceneKey>:<speciesId>:<n>` (per substrate §3 Required fields).
 *
 * @param {string} sceneKey
 * @param {string} speciesId
 * @returns {string}
 */
export function nextEntityId(sceneKey, speciesId) {
  const key = `${sceneKey}::${speciesId}`;
  const n = _idCounters.get(key) ?? 0;
  _idCounters.set(key, n + 1);
  return `${sceneKey}:${speciesId}:${n}`;
}

/**
 * Add an entity to the per-scene registry. Replaces any existing entry
 * with the same id (HMR-safe per substrate §10).
 *
 * @param {string} sceneKey
 * @param {EcologyEntity} entity
 * @returns {EcologyEntity}
 */
export function addEntity(sceneKey, entity) {
  if (!sceneKey || typeof sceneKey !== 'string') {
    throw new Error('[ecology] addEntity requires a sceneKey string');
  }
  if (!entity || typeof entity.id !== 'string') {
    throw new Error('[ecology] addEntity requires an entity with a string id');
  }
  let bucket = _byScene.get(sceneKey);
  if (!bucket) {
    bucket = new Map();
    _byScene.set(sceneKey, bucket);
  }
  bucket.set(entity.id, entity);
  return entity;
}

/**
 * Retrieve an entity by its substrate-stable id. Walks all scenes if
 * `sceneKey` is omitted; if provided, restricts to that scene's bucket.
 *
 * @param {string} entityId
 * @param {string} [sceneKey]
 * @returns {EcologyEntity | null}
 */
export function getEntity(entityId, sceneKey) {
  if (typeof entityId !== 'string') return null;
  if (sceneKey) {
    const bucket = _byScene.get(sceneKey);
    return bucket?.get(entityId) ?? null;
  }
  for (const bucket of _byScene.values()) {
    const hit = bucket.get(entityId);
    if (hit) return hit;
  }
  return null;
}

/**
 * Remove an entity from the registry. Returns whether removal occurred.
 *
 * @param {string} sceneKey
 * @param {string} entityId
 * @returns {boolean}
 */
export function removeEntity(sceneKey, entityId) {
  const bucket = _byScene.get(sceneKey);
  if (!bucket) return false;
  return bucket.delete(entityId);
}

/**
 * List every entity currently registered to a given scene.
 *
 * @param {string} sceneKey
 * @returns {EcologyEntity[]}
 */
export function listEntitiesForScene(sceneKey) {
  const bucket = _byScene.get(sceneKey);
  if (!bucket) return [];
  return Array.from(bucket.values());
}

/**
 * Walk every entity in every scene. Used by cross-scene queries
 * (e.g., the Stage-3 simulator export). Order is iteration order of
 * the underlying maps; consumers MUST NOT rely on a specific order.
 *
 * @returns {EcologyEntity[]}
 */
export function listAllEntities() {
  /** @type {EcologyEntity[]} */
  const out = [];
  for (const bucket of _byScene.values()) {
    for (const ent of bucket.values()) out.push(ent);
  }
  return out;
}

/**
 * List the keys of all scenes currently holding entities.
 *
 * @returns {string[]}
 */
export function listSceneKeys() {
  return Array.from(_byScene.keys());
}

/**
 * Release every entity for the given scene. Does NOT destroy zones
 * or sprites — that is the responsibility of the caller (typically the
 * `scene.shutdown` handler installed by `registerEntity`). This call
 * removes the registry entries only.
 *
 * @param {string} sceneKey
 * @returns {number} number of entities removed
 */
export function releaseScene(sceneKey) {
  const bucket = _byScene.get(sceneKey);
  if (!bucket) return 0;
  const n = bucket.size;
  bucket.clear();
  _byScene.delete(sceneKey);
  return n;
}

/**
 * Test-only: completely reset all state. Not part of the public API.
 *
 * @internal
 */
export function _resetEcologyState() {
  _byScene.clear();
  _idCounters.clear();
}
