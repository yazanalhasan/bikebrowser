/**
 * ecologyTicker — per-frame proximity check + time-of-day rule
 * enforcement for EcologyEntities.
 *
 * Per ecology-substrate.md §10, the substrate has no built-in
 * `update()` hook; the ticker is opt-in. A scene that wants ticker
 * services calls `attachEcologyTicker(scene)` once during `create()`.
 * That returns a "tick" function the scene invokes from its own
 * `update()` (or a tick is auto-wired via `scene.events.on('update',
 * ...)` when the scene asks for it).
 *
 * Two responsibilities:
 *
 * 1. **Proximity events.** Throttled (default 250 ms) check of the
 *    player's distance to each scene entity. Emits
 *    `ecology.proximity` events when the player crosses an entity's
 *    `interactionRadius`. The substrate spec §5 marks proximity as
 *    deferred-but-specified; the implementation here is the minimal
 *    polling loop that satisfies the schema. Skipped when the scene
 *    has no `player` reference.
 *
 * 2. **Time-of-day rule enforcement (resolved §13.4 hybrid).** When a
 *    fauna entity's `activeTimes` does not include the current time
 *    of day:
 *      a. Tween the entity sprite's alpha to 0.35 ("fade").
 *      b. Disable the interaction zone's body so observation/forage
 *         events do not fire.
 *      c. The entity is NOT removed at runtime — removal happens at
 *         the next scene reload (per resolved §13.4: "removed at next
 *         scene reload" — i.e., the entity simply isn't re-registered
 *         on the next mount because the registration site checks the
 *         time-of-day).
 *    On the inverse transition (time-of-day shifts so that the entity
 *    becomes active again), the alpha tweens back to 1.0 and the zone
 *    re-enables.
 *
 * Time-of-day signal: read from `scene.registry.get('gameState')?.
 * timeOfDay` if present, else falls back to `'day'`. The substrate
 * does not own time-of-day — the world model does — so the ticker
 * just reads.
 */

import { listEntitiesForScene } from './ecologyState.js';
import { isAnimalActiveAt } from './speciesResolver.js';
import { emitProximity } from './ecologyEvents.js';

/**
 * @typedef {import('./EcologyEntity.js').EcologyEntity} EcologyEntity
 */

/** Default proximity-check throttle, in milliseconds. */
const PROXIMITY_THROTTLE_MS = 250;

/** Default fade alpha applied when an entity is inactive per time-of-day. */
const INACTIVE_FADE_ALPHA = 0.35;

/** Fade tween duration, in milliseconds. */
const FADE_TWEEN_MS = 400;

/**
 * Attach the ecology ticker to a scene. Idempotent — calling twice
 * with the same scene returns the same controller and does not
 * double-register.
 *
 * @param {Phaser.Scene} scene
 * @param {object} [options]
 * @param {number} [options.proximityThrottleMs=250]
 * @param {number} [options.inactiveFadeAlpha=0.35]
 * @returns {{ tick: () => void, dispose: () => void }}
 */
export function attachEcologyTicker(scene, options = {}) {
  if (!scene) throw new Error('[ecology] attachEcologyTicker requires a scene');

  // If already attached, return the existing controller.
  if (scene._ecologyTicker) return scene._ecologyTicker;

  const throttle = options.proximityThrottleMs ?? PROXIMITY_THROTTLE_MS;
  const fadeAlpha = options.inactiveFadeAlpha ?? INACTIVE_FADE_ALPHA;

  /** Map<entityId, { active: boolean, alpha: number }> — known visual state */
  const visualStates = new Map();
  let lastProximityAt = 0;
  let lastTimeOfDay = null;

  const tick = () => {
    const sceneKey = scene?.scene?.key ?? scene?.sys?.settings?.key;
    if (!sceneKey) return;
    const entities = listEntitiesForScene(sceneKey);
    if (entities.length === 0) return;

    const now = Date.now();
    const state = scene.registry?.get?.('gameState') || {};
    const timeOfDay = state.timeOfDay || 'day';
    const timeChanged = timeOfDay !== lastTimeOfDay;
    lastTimeOfDay = timeOfDay;

    // ── 1. Time-of-day rule enforcement ─────────────────────────────
    for (const entity of entities) {
      _applyTimeOfDayRule(scene, entity, timeOfDay, fadeAlpha, visualStates, timeChanged);
    }

    // ── 2. Proximity check (throttled) ──────────────────────────────
    if (now - lastProximityAt < throttle) return;
    lastProximityAt = now;

    const player = scene.player?.sprite ?? scene.player ?? null;
    if (!player || typeof player.x !== 'number' || typeof player.y !== 'number') return;

    const px = player.x;
    const py = player.y;
    for (const entity of entities) {
      if (!entity.isObservable()) continue;
      const dx = entity.x - px;
      const dy = entity.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= entity.interactionRadius) {
        emitProximity(scene, entity, dist);
      }
    }
  };

  // Auto-wire to scene.update so consumers get the behavior for free.
  // Scenes that want manual control can pass `options.manual = true`
  // and call `tick()` themselves.
  let updateHandler = null;
  if (!options.manual) {
    updateHandler = () => tick();
    scene.events?.on?.('update', updateHandler);
  }

  const dispose = () => {
    if (updateHandler) scene.events?.off?.('update', updateHandler);
    visualStates.clear();
    if (scene._ecologyTicker === controller) {
      delete scene._ecologyTicker;
    }
  };

  // Auto-dispose on scene shutdown.
  scene.events?.once?.('shutdown', dispose);
  scene.events?.once?.('destroy', dispose);

  const controller = { tick, dispose };
  scene._ecologyTicker = controller;
  return controller;
}

/**
 * Apply the resolved §13.4 hybrid behavior:
 *   - Fade alpha at boundary via tween on entity sprite alpha
 *   - Disable interaction zone body when window closes
 *   - (Removal at scene reload is handled by re-registration logic;
 *     the ticker does not destroy entities at runtime.)
 *
 * @param {Phaser.Scene} scene
 * @param {EcologyEntity} entity
 * @param {string} timeOfDay
 * @param {number} fadeAlpha
 * @param {Map<string, {active: boolean, alpha: number}>} visualStates
 * @param {boolean} timeChanged
 */
function _applyTimeOfDayRule(scene, entity, timeOfDay, fadeAlpha, visualStates, timeChanged) {
  // Compute desired-active per timeOfDayRule.
  const desired = _computeActive(entity, timeOfDay);
  const prev = visualStates.get(entity.id);

  if (prev && prev.active === desired && !timeChanged) return;

  visualStates.set(entity.id, { active: desired, alpha: desired ? 1.0 : fadeAlpha });
  entity.active = desired;
  entity.inactiveReason = desired ? null : `inactive at ${timeOfDay}`;

  // Fade the sprite alpha, if any. The substrate does not own sprites,
  // but consumers conventionally attach `entity.sprite` to whatever
  // GameObject they rendered. Best-effort, no throw.
  if (entity.sprite && typeof entity.sprite.setAlpha === 'function') {
    if (scene.tweens?.add) {
      scene.tweens.add({
        targets: entity.sprite,
        alpha: desired ? 1.0 : fadeAlpha,
        duration: FADE_TWEEN_MS,
      });
    } else {
      entity.sprite.setAlpha(desired ? 1.0 : fadeAlpha);
    }
  }

  // Enable/disable the interaction zone body. (Disabling the body is
  // sufficient to stop overlap callbacks from firing.)
  if (entity.zone?.body && typeof entity.zone.body.enable === 'boolean') {
    entity.zone.body.enable = desired;
  }
}

/**
 * Compute whether an entity is "active" at the given time of day,
 * per its `timeOfDayRule` and the FAUNA `activity` field.
 *
 *   'always'         → always active
 *   'plant-default'  → always active (flora ignore time-of-day)
 *   'fauna-default'  → active iff TIME_BEHAVIOR.activeAnimals includes the species
 *   'custom'         → currently treated as 'always'; reserved for future hooks
 *
 * @param {EcologyEntity} entity
 * @param {string} timeOfDay
 * @returns {boolean}
 */
function _computeActive(entity, timeOfDay) {
  switch (entity.timeOfDayRule) {
    case 'always':
    case 'plant-default':
      return true;
    case 'fauna-default':
      if (entity.type !== 'fauna') return true; // flora misclassified — be permissive
      return isAnimalActiveAt(entity.speciesId, timeOfDay);
    case 'custom':
    default:
      return true;
  }
}

/**
 * Manually invoke the ticker for a scene. Useful for tests or scenes
 * that opt out of the auto-update wiring with `{ manual: true }`.
 *
 * @param {Phaser.Scene} scene
 */
export function tickEcology(scene) {
  scene?._ecologyTicker?.tick?.();
}
