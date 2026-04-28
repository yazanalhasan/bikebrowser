/**
 * Biology Events — registry-event emission for the Stage 1 recipe
 * engine. Per `biology-substrate.md` §5 (Event model), the substrate
 * emits the following events on Phaser's scene game-event bus
 * (`scene.game.events`) so listeners can subscribe across scene
 * boundaries.
 *
 *   biology.recipe.attempt
 *     { recipeId, providedInputs, timestamp }
 *
 *   biology.recipe.outcome
 *     { recipeId, success, output, failureReason, timestamp }
 *
 * `failureReason` is `null` on success, otherwise a structured
 * string like `'missing_input:agave_fiber'` or
 * `'wrong_amount:creosote_leaves:expected=2,got=1'` (per dispatch
 * prompt + substrate §5).
 *
 * Stage 2 + Stage 3 events (`biology.organism.designed`,
 * `biology.simulation.tick`, `biology.simulation.outcome`) are
 * specified in substrate §5 but emission is deferred to the
 * dispatches that implement those stages.
 *
 * The substrate is scene-portable per substrate §7 — these helpers
 * are agnostic to which scene mounts the workbench. They look up
 * the active scene's game-events emitter from the scene argument.
 */

/**
 * @typedef {Object} ProvidedInput
 * @property {string} slotId
 * @property {string} itemId
 * @property {number} amount
 */

/**
 * @typedef {Object} RecipeAttemptPayload
 * @property {string} recipeId
 * @property {ProvidedInput[]} providedInputs
 * @property {number} timestamp
 */

/**
 * @typedef {Object} RecipeOutcomePayload
 * @property {string} recipeId
 * @property {boolean} success
 * @property {string|null} output         itemId or null on failure
 * @property {string|null} failureReason  null on success
 * @property {number} timestamp
 */

const ATTEMPT_EVENT = 'biology.recipe.attempt';
const OUTCOME_EVENT = 'biology.recipe.outcome';

/**
 * Resolve the most appropriate event emitter from a scene-like
 * object. Prefers `scene.game.events` (cross-scene); falls back
 * to `scene.events` for unit-test stubs that lack a Phaser game.
 *
 * @param {object} scene
 * @returns {{emit:Function}|null}
 */
function _emitter(scene) {
  if (scene && scene.game && scene.game.events && typeof scene.game.events.emit === 'function') {
    return scene.game.events;
  }
  if (scene && scene.events && typeof scene.events.emit === 'function') {
    return scene.events;
  }
  return null;
}

/**
 * Emit `biology.recipe.attempt`. Fired on every attempt — useful
 * for analytics and tutorials per substrate §5.
 *
 * @param {object} scene                        Phaser scene-like object
 * @param {string} recipeId
 * @param {ProvidedInput[]} providedInputs
 * @returns {RecipeAttemptPayload} the payload that was emitted
 */
export function emitRecipeAttempt(scene, recipeId, providedInputs) {
  /** @type {RecipeAttemptPayload} */
  const payload = {
    recipeId,
    providedInputs: Array.isArray(providedInputs)
      ? providedInputs.map((i) => ({ ...i }))
      : [],
    timestamp: Date.now(),
  };
  const em = _emitter(scene);
  if (em) em.emit(ATTEMPT_EVENT, payload);
  return payload;
}

/**
 * Emit `biology.recipe.outcome`. Drives observation push to
 * `state.observations` and quest advancement (consumer-side).
 *
 * @param {object} scene
 * @param {string} recipeId
 * @param {boolean} success
 * @param {string|null} output           itemId or null on failure
 * @param {string|null} [failureReason]  null on success
 * @returns {RecipeOutcomePayload} the payload that was emitted
 */
export function emitRecipeOutcome(scene, recipeId, success, output, failureReason = null) {
  /** @type {RecipeOutcomePayload} */
  const payload = {
    recipeId,
    success: Boolean(success),
    output: output ?? null,
    failureReason: success ? null : (failureReason ?? 'unknown'),
    timestamp: Date.now(),
  };
  const em = _emitter(scene);
  if (em) em.emit(OUTCOME_EVENT, payload);
  return payload;
}

/**
 * Subscribe a listener to `biology.recipe.outcome`. Mirrors the
 * Phaser API but provides a typed surface over the event name.
 *
 * @param {object} scene
 * @param {(payload: RecipeOutcomePayload) => void} listener
 * @returns {() => void} unsubscribe handle
 */
export function onRecipeOutcome(scene, listener) {
  const em = _emitter(scene);
  if (!em || typeof em.on !== 'function') return () => {};
  em.on(OUTCOME_EVENT, listener);
  return () => {
    if (typeof em.off === 'function') em.off(OUTCOME_EVENT, listener);
  };
}

/**
 * Subscribe a listener to `biology.recipe.attempt`.
 *
 * @param {object} scene
 * @param {(payload: RecipeAttemptPayload) => void} listener
 * @returns {() => void} unsubscribe handle
 */
export function onRecipeAttempt(scene, listener) {
  const em = _emitter(scene);
  if (!em || typeof em.on !== 'function') return () => {};
  em.on(ATTEMPT_EVENT, listener);
  return () => {
    if (typeof em.off === 'function') em.off(ATTEMPT_EVENT, listener);
  };
}

/**
 * Subscribe to ecology's species-observation surface per substrate
 * §8 "Ecology bridge contract". Stage 1 does not strictly need
 * this — Stages 2 and 3 do. We provide it now so consumers can
 * begin opting in. If the ecology system has not yet emitted any
 * `ecology.observation` events, the listener is simply never
 * called; if the ecology system never lands, this is a no-op.
 *
 * Per the dispatch prompt: "DO NOT import EcologyEntity directly."
 * — we listen for the event by name only, and never reference any
 * ecology module here.
 *
 * TODO(Phase 4): when ecology.observation is wired, surface the
 * observed species ids to the recipe registry so species-gated
 * recipes can be unlocked.
 *
 * @param {object} scene
 * @param {(payload: object) => void} listener
 * @returns {() => void} unsubscribe handle
 */
export function onEcologyObservation(scene, listener) {
  const em = _emitter(scene);
  if (!em || typeof em.on !== 'function') return () => {};
  em.on('ecology.observation', listener);
  return () => {
    if (typeof em.off === 'function') em.off('ecology.observation', listener);
  };
}

export const BIOLOGY_EVENTS = Object.freeze({
  RECIPE_ATTEMPT: ATTEMPT_EVENT,
  RECIPE_OUTCOME: OUTCOME_EVENT,
});
