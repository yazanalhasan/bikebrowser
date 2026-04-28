/**
 * ecologyEvents — event emission helpers for the ecology substrate.
 *
 * Per ecology-substrate.md §5, the substrate emits three event types:
 *
 *   `ecology.observation` — fired by `emitObservation`. Includes the
 *      primary speciesId AND a per-tag secondary event (per resolved
 *      §13.1: secondary observations fire as additional events, NOT
 *      atomically packed onto a single event).
 *
 *   `ecology.forage` — fired by `emitForage`. Records a foraging
 *      action and the granted item id.
 *
 *   `ecology.proximity` — fired by `ecologyTicker` (NOT this module).
 *      Specified here for schema parity. The shape is published so
 *      future consumers do not need to redesign.
 *
 * Emission strategy: matches the registry-event pattern used by
 * `constructionSystem.js`, `obstacleSystem.js`, etc. — set the named
 * key on `scene.registry`, which fires the registry's `'changedata'`
 * event for any consumer listening. Most existing scenes wire a
 * `registry.events.on('changedata-<eventName>', ...)` handler in
 * `LocalSceneBase`.
 *
 * To make events visible across scene boundaries (per substrate §5
 * "events emitted via Phaser's global event bus"), this module ALSO
 * tries `scene.game.events.emit(eventName, payload)` when available —
 * that is the canonical Phaser cross-scene path. Both surfaces fire,
 * which is intentional: registry consumers continue to work, and a
 * future cross-scene consumer (the biology workbench) can listen on
 * `game.events` without a scene context.
 *
 * State mutation (push to `state.observations`, save) lives here so
 * the public API in `index.js` stays a thin wrapper.
 */

/**
 * @typedef {import('./EcologyEntity.js').EcologyEntity} EcologyEntity
 */

import { saveGame } from '../saveSystem.js';

/** Registry-key + event name for primary observations. */
export const ECOLOGY_OBSERVATION_EVENT = 'ecology.observation';
/** Registry-key + event name for forage actions. */
export const ECOLOGY_FORAGE_EVENT = 'ecology.forage';
/** Registry-key + event name for proximity ticks (Phase 6+). */
export const ECOLOGY_PROXIMITY_EVENT = 'ecology.proximity';

/**
 * Fire an event payload through both the scene registry (per the
 * existing `dialogEvent`/`gameState` pattern) and the global game
 * event bus (per the substrate's cross-scene contract).
 *
 * Best-effort: a missing scene/registry/game still proceeds without
 * throwing, so this is safe to call from any context.
 *
 * @param {Phaser.Scene | null | undefined} scene
 * @param {string} eventName
 * @param {object} payload
 */
function _publish(scene, eventName, payload) {
  if (!scene) return;
  try {
    scene.registry?.set?.(eventName, payload);
  } catch { /* swallow — scene torn down mid-event */ }
  try {
    scene.game?.events?.emit?.(eventName, payload);
  } catch { /* swallow */ }
}

/**
 * Resolve the live `gameState` from the scene registry. Returns a
 * shallow-cloned object so the caller can safely mutate it before
 * `scene.registry.set('gameState', ...)`.
 *
 * @param {Phaser.Scene} scene
 * @returns {object}
 */
function _readGameState(scene) {
  const live = scene?.registry?.get?.('gameState');
  return (live && typeof live === 'object') ? { ...live } : {};
}

/**
 * Push `entry` into `state.observations` if not already present.
 * Returns the (possibly new) state and whether it changed.
 *
 * @param {object} state
 * @param {string} entry
 * @returns {{ state: object, changed: boolean }}
 */
function _appendObservation(state, entry) {
  if (typeof entry !== 'string' || entry.length === 0) {
    return { state, changed: false };
  }
  const obs = Array.isArray(state.observations) ? state.observations : [];
  if (obs.includes(entry)) return { state, changed: false };
  return {
    state: { ...state, observations: [...obs, entry] },
    changed: true,
  };
}

/**
 * Emit a primary observation for the given entity, plus secondary
 * events for each `relationTag` (per resolved §13.1: secondary
 * observations fire as separate events, NOT a single atomic event).
 *
 * Per resolved §13.3: pushes to `state.observations` only on the FIRST
 * observation per species per save; emits on EVERY observation.
 *
 * Side effects:
 *   1. If state.observations does not already contain
 *      `entity.questObservationId` (or `entity.speciesId` if the
 *      override is null), append it.
 *   2. Persist via `saveGame` if state changed.
 *   3. Publish primary `ecology.observation` event.
 *   4. For each relationTag, publish a secondary `ecology.observation`
 *      event with `relationTag` populated and `relationTags: []`.
 *
 * @param {Phaser.Scene} scene
 * @param {EcologyEntity} entity
 * @param {'proximity'|'interact'|'inspect'|'programmatic'} [source='programmatic']
 * @returns {object} the primary event payload that was published
 */
export function emitObservation(scene, entity, source = 'programmatic') {
  if (!entity) {
    throw new Error('[ecology] emitObservation requires an entity');
  }

  const observationId = entity.questObservationId || entity.speciesId;
  const timestamp = Date.now();

  // 1+2. State write (dedup).
  const live = _readGameState(scene);
  const { state: nextState, changed } = _appendObservation(live, observationId);
  if (changed) {
    try {
      scene?.registry?.set?.('gameState', nextState);
      saveGame(nextState);
    } catch { /* swallow */ }
  }

  // 3. Primary event.
  /** @type {object} */
  const primary = {
    type: ECOLOGY_OBSERVATION_EVENT,
    speciesId: entity.speciesId,
    questObservationId: observationId,
    relationTags: Array.isArray(entity.relationTags) ? [...entity.relationTags] : [],
    relationTag: null,
    source,
    sceneKey: entity.sceneKey,
    entityId: entity.id,
    timestamp,
  };
  _publish(scene, ECOLOGY_OBSERVATION_EVENT, primary);

  // 4. Secondary events — one per relationTag (per resolved §13.1).
  for (const tag of (entity.relationTags || [])) {
    const secondary = {
      type: ECOLOGY_OBSERVATION_EVENT,
      speciesId: entity.speciesId,
      questObservationId: observationId,
      relationTags: [],
      relationTag: tag,
      source,
      sceneKey: entity.sceneKey,
      entityId: entity.id,
      timestamp,
    };
    _publish(scene, ECOLOGY_OBSERVATION_EVENT, secondary);
  }

  return primary;
}

/**
 * Emit a foraging event and grant the entity's `grantsItemId` to
 * `state.inventory`. Always succeeds at this layer (depletion vs
 * always-succeed is open question §13.2 and is the wiring layer's
 * concern, not the substrate's).
 *
 * Side effects:
 *   1. If `entity.grantsItemId` is set, push it onto state.inventory
 *      (NOT deduplicated — multiple harvests stack).
 *   2. Persist via `saveGame`.
 *   3. Publish `ecology.forage` event.
 *
 * Does NOT emit an observation. Quest-aware code that wants both calls
 * `emitObservation` separately.
 *
 * @param {Phaser.Scene} scene
 * @param {EcologyEntity} entity
 * @param {'interact'|'programmatic'} [source='interact']
 * @returns {object} the event payload that was published
 */
export function emitForage(scene, entity, source = 'interact') {
  if (!entity) {
    throw new Error('[ecology] emitForage requires an entity');
  }

  const timestamp = Date.now();
  const itemId = entity.grantsItemId || null;

  // 1+2. State write — grant item.
  if (itemId) {
    const live = _readGameState(scene);
    const inv = Array.isArray(live.inventory) ? live.inventory : [];
    const nextState = { ...live, inventory: [...inv, itemId] };
    try {
      scene?.registry?.set?.('gameState', nextState);
      saveGame(nextState);
    } catch { /* swallow */ }
  }

  // 3. Event.
  const payload = {
    type: ECOLOGY_FORAGE_EVENT,
    speciesId: entity.speciesId,
    grantsItemId: itemId,
    source,
    sceneKey: entity.sceneKey,
    entityId: entity.id,
    // `remaining` is 0 when forageable was consumed, 1 otherwise. The
    // substrate sets the entity's forageable flag to false post-grant
    // when the consumer opts into depletion (open question §13.2);
    // here we report the post-flip value.
    remaining: entity.isForageable && entity.isForageable() ? 1 : 0,
    timestamp,
  };
  _publish(scene, ECOLOGY_FORAGE_EVENT, payload);

  return payload;
}

/**
 * Emit a proximity event. Called by `ecologyTicker`, NOT by scene
 * code. The schema is exported here so the per-frame ticker stays
 * a small file focused on iteration and time-of-day rules.
 *
 * @param {Phaser.Scene} scene
 * @param {EcologyEntity} entity
 * @param {number} distance
 */
export function emitProximity(scene, entity, distance) {
  if (!entity) return;
  _publish(scene, ECOLOGY_PROXIMITY_EVENT, {
    type: ECOLOGY_PROXIMITY_EVENT,
    speciesId: entity.speciesId,
    entityId: entity.id,
    sceneKey: entity.sceneKey,
    distance,
    timestamp: Date.now(),
  });
}
