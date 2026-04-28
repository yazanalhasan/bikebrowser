/**
 * Ecology substrate — public API barrel.
 *
 * Per ecology-substrate.md §4, this module is the only surface that
 * scene code should import from `systems/ecology/`. Internal modules
 * (`ecologyState.js`, `ecologyQueries.js`, `ecologyTicker.js`,
 * `ecologyEvents.js`, `speciesResolver.js`, `EcologyEntity.js`) are
 * implementation details.
 *
 * Exported public surface:
 *
 *   registerEntity(scene, config)            → EcologyEntity
 *   registerEntities(scene, configs)         → EcologyEntity[]
 *   registerProcedural(scene, options)       → halts (Phase 6)
 *   queryEntities(scene, predicate)          → EcologyEntity[]
 *   emitObservation(entity, source)          → primary event payload
 *   emitForage(entity, source)               → forage event payload
 *   debugDrawEcologyEntities(scene)          → dev overlay
 *   attachEcologyTicker(scene, opts)         → ticker controller
 *
 * Plus typed helpers re-exported from `speciesResolver` and
 * `ecologyQueries` for ergonomic consumer use.
 *
 * Resolved open questions baked into this implementation:
 *   §13.1 — secondary relationTag observations fire as separate
 *           `ecology.observation` events (not atomic).
 *   §13.3 — `state.observations` deduplicates; events emit every
 *           time.
 *   §13.4 — time-of-day enforcement is hybrid: fade alpha at
 *           boundary, disable interaction zone body when window
 *           closes, removal at next scene reload.
 *
 * Deferred (per dispatch prompt):
 *   §13.5 — per-scene caps.
 *   §13.6 — procedural seed determinism.
 */

import { EcologyEntity } from './EcologyEntity.js';
import {
  addEntity,
  nextEntityId,
  removeEntity,
  releaseScene,
  listEntitiesForScene,
} from './ecologyState.js';
import {
  getFloraSpecies,
  getFaunaSpecies,
  getPlantEcology,
  getRelationTags,
  getPredators,
  getPreyFor,
  resolveSpeciesType,
} from './speciesResolver.js';
import {
  emitObservation as _emitObservation,
  emitForage as _emitForage,
} from './ecologyEvents.js';
import { SCENE_ITEM_GRANTS } from '../../data/sceneItemGrants.js';

// Re-export the public-shaped query helpers verbatim.
export {
  queryEntities,
  getEntityById,
  listEntitiesBySpecies,
  listEntitiesByRelationTag,
  listEntitiesByScene,
} from './ecologyQueries.js';

// Re-export the ticker (a scene that wants ticker services calls it
// directly).
export { attachEcologyTicker, tickEcology } from './ecologyTicker.js';

// Re-export species resolver helpers — Phase 4 scene code is expected
// to import these for read-only lookups without re-importing data
// directly.
export {
  getFloraSpecies,
  getFaunaSpecies,
  getPlantEcology,
  getRelationTags,
  getPredators,
  getPreyFor,
  isFloraSpecies,
  isFaunaSpecies,
  listFloraSpeciesByBiome,
  listFaunaSpeciesByTime,
  listFaunaSpeciesRequiring,
  listChainEdges,
  getBiomeAt,
  getBiomeById,
  listBiomes,
  getTimeBehavior,
  isAnimalActiveAt,
  listActiveAnimals,
  resolveSpeciesType,
  getLinkedAnimals,
} from './speciesResolver.js';

// Event constants — consumers wanting to wire `registry.events.on`
// listeners use these so the event name is single-sourced.
export {
  ECOLOGY_OBSERVATION_EVENT,
  ECOLOGY_FORAGE_EVENT,
  ECOLOGY_PROXIMITY_EVENT,
} from './ecologyEvents.js';

// EcologyEntity class — typically not instantiated by consumers
// directly, but re-exported for typecheck ergonomics and tests.
export { EcologyEntity } from './EcologyEntity.js';

// ── Default forage-grant lookup ─────────────────────────────────────

/**
 * Default `grantsItemId` for a (sceneKey, speciesId) pair: looks up
 * `SCENE_ITEM_GRANTS[sceneKey]` and returns the first item id that
 * appears to match the species. The match is heuristic — a future
 * cycle replaces this with a proper species-to-item table — but for
 * Phase 3 it correctly resolves the common cases (`mesquite_pods`
 * for `mesquite`, `creosote_leaves` for `creosote`, etc.).
 *
 * Returns null when no match is found, which is the correct default
 * for entities that are observable-only.
 *
 * @param {string} sceneKey
 * @param {string} speciesId
 * @returns {string|null}
 */
function _defaultGrantsItemId(sceneKey, speciesId) {
  if (!sceneKey || !speciesId) return null;
  const grants = SCENE_ITEM_GRANTS[sceneKey];
  if (!Array.isArray(grants)) return null;
  // Prefer items whose id starts with the species id (e.g.,
  // 'mesquite_pods' for 'mesquite'). Fall back to a substring match.
  const startsWith = grants.find((g) => typeof g.itemId === 'string' && g.itemId.startsWith(`${speciesId}_`));
  if (startsWith) return startsWith.itemId;
  const includes = grants.find((g) => typeof g.itemId === 'string' && g.itemId.includes(speciesId));
  return includes?.itemId ?? null;
}

// ── Relationship-field derivation ───────────────────────────────────

/**
 * Compute the four relationship fields from data — `eats`, `eatenBy`,
 * `nearbyAttractors`, `relationTags` — given a species id and type.
 *
 * @param {string} speciesId
 * @param {'flora'|'fauna'|'microbe'} type
 * @returns {{ eats: string[], eatenBy: string[], nearbyAttractors: string[], relationTags: string[] }}
 */
function _deriveRelationshipFields(speciesId, type) {
  const relationTags = getRelationTags(speciesId);
  if (type === 'flora') {
    const eco = getPlantEcology(speciesId);
    return {
      eats: [],
      eatenBy: Array.isArray(eco?.supports) ? [...eco.supports] : [],
      nearbyAttractors: Array.isArray(eco?.predatorsNearby) ? [...eco.predatorsNearby] : [],
      relationTags,
    };
  }
  if (type === 'fauna') {
    const fauna = getFaunaSpecies(speciesId);
    /** @type {Set<string>} */
    const eats = new Set(Array.isArray(fauna?.diet) ? fauna.diet : []);
    for (const edge of getPreyFor(speciesId)) eats.add(edge.species);
    /** @type {Set<string>} */
    const eatenBy = new Set();
    for (const edge of getPredators(speciesId)) eatenBy.add(edge.species);
    return {
      eats: Array.from(eats),
      eatenBy: Array.from(eatenBy),
      nearbyAttractors: [],
      relationTags,
    };
  }
  // 'microbe' — reserved for biology substrate registrations; substrate
  // does not derive anything from data tables.
  return {
    eats: [],
    eatenBy: [],
    nearbyAttractors: [],
    relationTags,
  };
}

// ── attachInteractionZone (private) ─────────────────────────────────

/**
 * Install the Phaser interaction zone for an entity. Per the
 * substrate spec §4 "registerEntity → 4", the zone is owned by the
 * scene's lifecycle: cleanup happens in the `scene.shutdown` listener
 * registered alongside.
 *
 * Wires:
 *   - Proximity overlap with `scene.player.sprite` → `emitObservation`
 *     with source `'proximity'` (idempotent at the state level via
 *     the dedup in `_appendObservation`).
 *   - Pointer events when the zone is interactive (set in scene code,
 *     not here — the substrate does not own input wiring beyond the
 *     overlap) — left to the consumer.
 *
 * @param {Phaser.Scene} scene
 * @param {EcologyEntity} entity
 */
function attachInteractionZone(scene, entity) {
  if (!scene?.add || typeof scene.add.zone !== 'function') {
    // No-op for headless tests or scenes without the add factory.
    return;
  }
  const radius = entity.interactionRadius;
  const size = radius * 2;
  const zone = scene.add.zone(entity.x, entity.y, size, size);
  if (scene.physics?.add?.existing) {
    scene.physics.add.existing(zone, true);
  }
  zone.setData?.('ecologyEntityId', entity.id);
  entity.zone = zone;

  // Auto proximity observation: best-effort. Scenes that have a
  // `scene.player.sprite` get observation events when the player
  // enters the zone. The dedup in `emitObservation` ensures
  // `state.observations` only grows once per species.
  const player = scene.player?.sprite ?? scene.player ?? null;
  if (player && scene.physics?.add?.overlap) {
    try {
      scene.physics.add.overlap(player, zone, () => {
        if (!entity.isObservable()) return;
        _emitObservation(scene, entity, 'proximity');
      });
    } catch { /* swallow — physics not ready */ }
  }
}

/**
 * Install the per-scene shutdown handler that releases this scene's
 * entities. Idempotent — the handler self-deduplicates via a flag on
 * the scene instance.
 *
 * @param {Phaser.Scene} scene
 */
function _ensureShutdownHook(scene) {
  if (!scene || scene._ecologyShutdownHooked) return;
  scene._ecologyShutdownHooked = true;
  const sceneKey = scene.scene?.key ?? scene.sys?.settings?.key;
  const handler = () => {
    if (!sceneKey) return;
    const entities = listEntitiesForScene(sceneKey);
    for (const e of entities) {
      try { e.zone?.destroy?.(); } catch { /* swallow */ }
      e.zone = null;
      e.sprite = null;
    }
    releaseScene(sceneKey);
    scene._ecologyShutdownHooked = false;
  };
  scene.events?.once?.('shutdown', handler);
  scene.events?.once?.('destroy', handler);
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Register a single EcologyEntity into the substrate's per-scene
 * registry. Resolves defaults, derives relationship fields, attaches
 * the interaction zone, and returns the populated entity.
 *
 * Required config fields:
 *   - speciesId  string  must resolve to FLORA, FAUNA, or be `'microbe'`
 *   - x          number
 *   - y          number
 *
 * Optional config fields (substrate §3):
 *   - sceneKey, spawnedBy, interactionRadius, observable, forageable,
 *     grantsItemId, questObservationId, inspectText, timeOfDayRule,
 *     biomeRule, type
 *
 * @param {Phaser.Scene} scene
 * @param {object} config
 * @returns {EcologyEntity}
 */
export function registerEntity(scene, config) {
  if (!scene) throw new Error('[ecology] registerEntity requires a scene');
  if (!config || typeof config !== 'object') {
    throw new Error('[ecology] registerEntity requires a config object');
  }
  const { speciesId, x, y } = config;
  if (typeof speciesId !== 'string' || speciesId.length === 0) {
    throw new Error('[ecology] registerEntity: config.speciesId must be a non-empty string');
  }
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error(`[ecology] registerEntity: config.x and config.y must be numbers (got ${x}, ${y})`);
  }

  // Resolve type from data, allowing explicit override (microbe).
  const type = config.type ?? resolveSpeciesType(speciesId);
  if (type == null) {
    // Halt-and-surface in dev; scene code can wrap this in a try/catch
    // for production warn-and-skip semantics if desired.
    throw new Error(`[ecology] registerEntity: unknown speciesId "${speciesId}" (not in FLORA/FAUNA)`);
  }

  const sceneKey = config.sceneKey
    ?? scene.scene?.key
    ?? scene.sys?.settings?.key
    ?? 'unknown';
  const spawnedBy = config.spawnedBy ?? 'layout';

  // Resolve grantsItemId default if not supplied.
  const grantsItemId = (config.grantsItemId !== undefined)
    ? config.grantsItemId
    : _defaultGrantsItemId(sceneKey, speciesId);

  // Derive relationship fields from data.
  const rel = _deriveRelationshipFields(speciesId, type);

  // Build the entity.
  const id = config.id ?? nextEntityId(sceneKey, speciesId);
  const entity = new EcologyEntity({
    id,
    speciesId,
    type,
    sceneKey,
    x,
    y,
    spawnedBy,
    interactionRadius: config.interactionRadius,
    observable: config.observable,
    forageable: config.forageable,
    grantsItemId,
    questObservationId: config.questObservationId,
    inspectText: config.inspectText,
    timeOfDayRule: config.timeOfDayRule,
    biomeRule: config.biomeRule,
    eats: rel.eats,
    eatenBy: rel.eatenBy,
    nearbyAttractors: rel.nearbyAttractors,
    relationTags: rel.relationTags,
  });

  // Attach the zone, register, hook shutdown.
  attachInteractionZone(scene, entity);
  addEntity(sceneKey, entity);
  _ensureShutdownHook(scene);

  return entity;
}

/**
 * Bulk wrapper around `registerEntity`. Returns the array of populated
 * entities. Skips any config that throws, logging a console warning
 * — this lets a scene register a layout's full plant list without
 * one bad entry tearing the whole scene down.
 *
 * @param {Phaser.Scene} scene
 * @param {object[]} configs
 * @returns {EcologyEntity[]}
 */
export function registerEntities(scene, configs) {
  if (!Array.isArray(configs)) {
    throw new Error('[ecology] registerEntities: configs must be an array');
  }
  /** @type {EcologyEntity[]} */
  const out = [];
  for (const cfg of configs) {
    try {
      out.push(registerEntity(scene, cfg));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[ecology] registerEntities: skipped one entry', err?.message || err, cfg);
    }
  }
  return out;
}

/**
 * Procedural-population stub. Phase 6 will move `populateWorld` /
 * `spawnFlora` / `spawnFauna` / `applyFoodChain` from the legacy
 * `ecologyEngine.js` into the ticker module per playbook §A.9.6.
 *
 * Currently halt-and-surface — calling this signals a dispatch out of
 * scope for the Phase 3 deliverable.
 *
 * @param {Phaser.Scene} _scene
 * @param {object} _options
 * @returns {never}
 */
export function registerProcedural(_scene, _options) {
  throw new Error('[ecology] registerProcedural is deferred to Phase 6. See ecology-substrate.md §8.');
}

/**
 * Emit an observation for the given entity. Thin wrapper that keeps
 * the public surface aligned with the substrate spec — internally
 * delegates to `ecologyEvents.emitObservation`.
 *
 * @param {EcologyEntity} entity
 * @param {'proximity'|'interact'|'inspect'|'programmatic'} [source='programmatic']
 * @returns {object}
 */
export function emitObservation(entity, source = 'programmatic') {
  if (!entity) {
    throw new Error('[ecology] emitObservation requires an entity');
  }
  // Resolve the scene from the entity's recorded sceneKey via the
  // zone's `.scene` reference if available, else the caller's
  // ambient context (Phaser sets `zone.scene` automatically).
  const scene = entity.zone?.scene ?? null;
  return _emitObservation(scene, entity, source);
}

/**
 * Emit a forage action for the given entity. Grants
 * `entity.grantsItemId` to inventory and persists. Thin wrapper.
 *
 * @param {EcologyEntity} entity
 * @param {'interact'|'programmatic'} [source='interact']
 * @returns {object}
 */
export function emitForage(entity, source = 'interact') {
  if (!entity) {
    throw new Error('[ecology] emitForage requires an entity');
  }
  const scene = entity.zone?.scene ?? null;
  return _emitForage(scene, entity, source);
}

/**
 * Dev-only overlay: draw a visible bounding circle and species label
 * for every entity in a scene. Toggled by the `?debug=ecology` URL
 * flag at the consumer end — this function just renders.
 *
 * Returns a "destroy" function that tears down the overlay. Calling
 * `debugDrawEcologyEntities` again before destroying first is safe;
 * it stacks.
 *
 * @param {Phaser.Scene} scene
 * @returns {() => void}
 */
export function debugDrawEcologyEntities(scene) {
  if (!scene?.add?.graphics) return () => {};
  const sceneKey = scene.scene?.key ?? scene.sys?.settings?.key;
  if (!sceneKey) return () => {};
  const entities = listEntitiesForScene(sceneKey);

  const gfx = scene.add.graphics();
  gfx.setDepth(9999);
  /** @type {Phaser.GameObjects.Text[]} */
  const labels = [];

  for (const entity of entities) {
    const color = entity.type === 'fauna' ? 0xff66aa : 0x66ffaa;
    gfx.lineStyle(1, color, 0.8);
    gfx.strokeCircle(entity.x, entity.y, entity.interactionRadius);
    const text = scene.add.text(entity.x, entity.y - entity.interactionRadius - 12, entity.speciesId, {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 3, y: 1 },
    });
    text.setOrigin(0.5, 1);
    text.setDepth(10000);
    labels.push(text);
  }

  return () => {
    try { gfx.destroy(); } catch { /* swallow */ }
    for (const t of labels) {
      try { t.destroy(); } catch { /* swallow */ }
    }
  };
}

/**
 * Force-remove an entity from the registry (and destroy its zone).
 * Provided for advanced consumers; ordinary lifecycle uses the
 * scene-shutdown path.
 *
 * @param {string} sceneKey
 * @param {string} entityId
 */
export function unregisterEntity(sceneKey, entityId) {
  const entities = listEntitiesForScene(sceneKey);
  const ent = entities.find((e) => e.id === entityId);
  if (!ent) return false;
  try { ent.zone?.destroy?.(); } catch { /* swallow */ }
  ent.zone = null;
  ent.sprite = null;
  return removeEntity(sceneKey, entityId);
}
