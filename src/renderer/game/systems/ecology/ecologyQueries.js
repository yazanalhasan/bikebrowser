/**
 * ecologyQueries — predicate-based and lookup-style query helpers
 * for the substrate's per-scene EcologyEntity registry.
 *
 * Per ecology-substrate.md §4, `queryEntities` accepts EITHER a
 * function predicate `(entity) => boolean` OR an object-shape
 * predicate where each key/value pair must match the corresponding
 * field on the entity.
 *
 * Object-shape examples:
 *   queryEntities(scene, { speciesId: 'mesquite' })
 *   queryEntities(scene, { type: 'fauna', sceneKey: 'StreetBlockScene' })
 *   queryEntities(scene, { relationTag: 'supports:javelina' })
 *
 * Predicate forms are equivalent in expressiveness — pick whichever
 * reads better at the call site.
 *
 * The "scene" first parameter is interpreted permissively: if it is a
 * Phaser scene (has `scene.scene.key`), the query auto-restricts to
 * that scene's entities; if it is `null` or `undefined`, the query
 * walks every scene; if it is a string, the query treats it as a
 * sceneKey directly.
 */

import {
  listEntitiesForScene,
  listAllEntities,
  getEntity,
} from './ecologyState.js';

/**
 * @typedef {import('./EcologyEntity.js').EcologyEntity} EcologyEntity
 */

/**
 * Resolve the first argument to a list of candidate entities.
 *
 * @param {Phaser.Scene | string | null | undefined} sceneArg
 * @returns {EcologyEntity[]}
 */
function _resolveCandidates(sceneArg) {
  if (sceneArg == null) return listAllEntities();
  if (typeof sceneArg === 'string') return listEntitiesForScene(sceneArg);
  // Phaser scene: scene.scene.key is the canonical key
  const key = sceneArg?.scene?.key ?? sceneArg?.sys?.settings?.key;
  if (typeof key === 'string') return listEntitiesForScene(key);
  return listAllEntities();
}

/**
 * Match an object-shape predicate against an entity.
 *
 * Supported shape keys:
 *   - any direct field on EcologyEntity (string/number/boolean equality)
 *   - `relationTag: '<tag>'`        — entity.relationTags.includes(tag)
 *   - `relationTags: ['<tag>'...]`   — every tag must be present
 *   - `eats: '<species>'`            — entity.eats.includes(species)
 *   - `eatenBy: '<species>'`         — entity.eatenBy.includes(species)
 *
 * @param {EcologyEntity} entity
 * @param {object} shape
 * @returns {boolean}
 */
function _matchShape(entity, shape) {
  for (const [key, value] of Object.entries(shape)) {
    if (key === 'relationTag') {
      if (!Array.isArray(entity.relationTags) || !entity.relationTags.includes(value)) {
        return false;
      }
      continue;
    }
    if (key === 'relationTags') {
      const required = Array.isArray(value) ? value : [value];
      const tags = entity.relationTags || [];
      for (const t of required) {
        if (!tags.includes(t)) return false;
      }
      continue;
    }
    if (key === 'eats' || key === 'eatenBy' || key === 'nearbyAttractors') {
      const list = entity[key] || [];
      if (Array.isArray(value)) {
        for (const v of value) if (!list.includes(v)) return false;
      } else {
        if (!list.includes(value)) return false;
      }
      continue;
    }
    // Default: strict equality on the entity field
    if (entity[key] !== value) return false;
  }
  return true;
}

/**
 * Query the EcologyEntity registry. Supports two predicate forms:
 *
 *   queryEntities(scene, (entity) => entity.type === 'fauna')
 *   queryEntities(scene, { type: 'fauna' })
 *
 * `scene` may be a Phaser scene, a sceneKey string, or null/undefined
 * (the latter walks every scene's bucket).
 *
 * @param {Phaser.Scene | string | null | undefined} scene
 * @param {((e: EcologyEntity) => boolean) | object} predicate
 * @returns {EcologyEntity[]}
 */
export function queryEntities(scene, predicate) {
  const candidates = _resolveCandidates(scene);
  if (typeof predicate === 'function') {
    return candidates.filter((e) => {
      try { return predicate(e) === true; } catch { return false; }
    });
  }
  if (predicate && typeof predicate === 'object') {
    return candidates.filter((e) => _matchShape(e, predicate));
  }
  // No predicate → return everything in scope.
  return [...candidates];
}

/**
 * Find an entity by its substrate-stable id. Optional `scene`
 * narrows the search to one scene's bucket.
 *
 * @param {string} entityId
 * @param {Phaser.Scene | string | null} [scene]
 * @returns {EcologyEntity | null}
 */
export function getEntityById(entityId, scene) {
  if (scene == null) return getEntity(entityId);
  const key = (typeof scene === 'string') ? scene : (scene?.scene?.key ?? scene?.sys?.settings?.key);
  return getEntity(entityId, key);
}

/**
 * Convenience: list every entity matching a species id, optionally
 * scene-scoped.
 *
 * @param {string} speciesId
 * @param {Phaser.Scene | string | null} [scene]
 * @returns {EcologyEntity[]}
 */
export function listEntitiesBySpecies(speciesId, scene) {
  return queryEntities(scene, { speciesId });
}

/**
 * Convenience: list every entity carrying a given relationTag,
 * optionally scene-scoped.
 *
 * @param {string} relationTag
 * @param {Phaser.Scene | string | null} [scene]
 * @returns {EcologyEntity[]}
 */
export function listEntitiesByRelationTag(relationTag, scene) {
  return queryEntities(scene, { relationTag });
}

/**
 * Convenience: list every entity in a given scene.
 *
 * @param {Phaser.Scene | string} scene
 * @returns {EcologyEntity[]}
 */
export function listEntitiesByScene(scene) {
  return queryEntities(scene, () => true);
}
