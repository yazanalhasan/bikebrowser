/**
 * Stage 1 Recipe Engine — validates inputs, runs the visible
 * process, and emits outcome events per `biology-substrate.md` §4
 * Stage 1 public API and §5 event model.
 *
 * The engine is *transport-only* over the recipe data: it does not
 * hold UI state, does not own the workbench's rendered surface, and
 * does not directly mutate `state.observations` or `state.inventory`.
 * Instead, on a successful attempt it emits `biology.recipe.outcome`
 * with the recipe's `outcomeObservationId` + `output` itemId in the
 * payload — the consuming scene is responsible for pushing that
 * observation and granting the item, per the codebase's standard
 * registry-set + saveGame pattern (see ZuzuGarageScene
 * `desert_coating` handler for the existing emitter).
 *
 * This separation keeps the engine portable per substrate §7
 * "Portability discipline" — the same engine instance backs the
 * Act 1 garage workbench and the Act 3 alien workbench.
 *
 * Process model: the visible process (`process.duration` ms with
 * `process.visibleStages` markers) is *advisory* metadata for the
 * UI. The engine validates inputs synchronously, then schedules
 * the outcome emission after `process.duration` ms via a Phaser
 * timer (or `setTimeout` fallback in unit tests). On UI-less or
 * test invocations, callers may pass `{ skipProcessTimer: true }`
 * to fire the outcome synchronously.
 */

import { getRecipe } from './recipeRegistry.js';
import { emitRecipeAttempt, emitRecipeOutcome } from './biologyEvents.js';
import { recordRecipeAttempt } from './biologyState.js';

/**
 * @typedef {Object} ProvidedInput
 * @property {string} slotId
 * @property {string} itemId
 * @property {number} amount
 */

/**
 * @typedef {Object} AttemptOptions
 * @property {boolean} [skipProcessTimer]   fire outcome synchronously (test/UI-less)
 * @property {object}  [state]              game state for persistence; if omitted,
 *                                          falls back to `scene.registry.get('gameState')`
 * @property {boolean} [persist]            persist state to save (default true)
 */

/**
 * @typedef {Object} AttemptResult
 * @property {string}      recipeId
 * @property {boolean}     accepted        true if recipe id is valid + inputs validate
 * @property {boolean}     success         true if outcome will be / was emitted as success
 * @property {string|null} failureReason   structured reason or null
 * @property {string|null} output          itemId of output (null on failure)
 * @property {string|null} outcomeObservationId  for consumer to push to state.observations
 * @property {number}      duration        process duration in ms (0 if skipped)
 * @property {Promise<void>} settled       resolves when outcome event has been emitted
 */

/**
 * Schedule a callback after `ms` milliseconds. Prefers Phaser's
 * scene timer (cleaned up on scene shutdown) when available;
 * falls back to `setTimeout` for tests / UI-less callers.
 *
 * @param {object|null} scene
 * @param {number}      ms
 * @param {() => void}  cb
 * @returns {void}
 */
function _delay(scene, ms, cb) {
  if (ms <= 0) { cb(); return; }
  if (
    scene &&
    scene.time &&
    typeof scene.time.delayedCall === 'function'
  ) {
    scene.time.delayedCall(ms, cb);
    return;
  }
  setTimeout(cb, ms);
}

/**
 * Resolve game state for persistence. Prefers the explicit `state`
 * option; falls back to `scene.registry.get('gameState')`. Returns
 * null if no state is reachable (engine still works — persistence
 * is a best-effort).
 *
 * @param {object} scene
 * @param {AttemptOptions} opts
 * @returns {object|null}
 */
function _resolveState(scene, opts) {
  if (opts && opts.state) return opts.state;
  if (scene && scene.registry && typeof scene.registry.get === 'function') {
    return scene.registry.get('gameState') || null;
  }
  return null;
}

/**
 * Attempt a recipe. Validates inputs, emits
 * `biology.recipe.attempt` immediately, runs the visible process,
 * then emits `biology.recipe.outcome`.
 *
 * @param {object} scene                       Phaser scene-like (game.events host)
 * @param {string} recipeId
 * @param {ProvidedInput[]} providedInputs
 * @param {AttemptOptions} [options]
 * @returns {AttemptResult}
 */
export function attemptRecipe(scene, recipeId, providedInputs, options = {}) {
  emitRecipeAttempt(scene, recipeId, providedInputs);

  const recipe = getRecipe(recipeId);

  // Unknown recipe → emit failure synchronously.
  if (!recipe) {
    const reason = `unknown_recipe:${recipeId}`;
    emitRecipeOutcome(scene, recipeId, false, null, reason);
    return {
      recipeId,
      accepted: false,
      success: false,
      failureReason: reason,
      output: null,
      outcomeObservationId: null,
      duration: 0,
      settled: Promise.resolve(),
    };
  }

  const failureReason = recipe.validateInputs(providedInputs);
  const willSucceed = failureReason == null;
  const duration = options.skipProcessTimer ? 0 : recipe.process.duration;

  let resolveSettled;
  const settled = new Promise((r) => { resolveSettled = r; });

  _delay(scene, duration, () => {
    if (willSucceed) {
      emitRecipeOutcome(scene, recipeId, true, recipe.output, null);
    } else {
      emitRecipeOutcome(scene, recipeId, false, null, failureReason);
    }
    // Persist attempt record (best-effort; never throws into UI).
    const state = _resolveState(scene, options);
    if (state) {
      recordRecipeAttempt(state, recipeId, willSucceed, {
        persist: options.persist !== false,
      });
    }
    resolveSettled();
  });

  return {
    recipeId,
    accepted: willSucceed,
    success: willSucceed,
    failureReason: willSucceed ? null : failureReason,
    output: willSucceed ? recipe.output : null,
    outcomeObservationId: willSucceed ? recipe.outcomeObservationId : null,
    duration,
    settled,
  };
}
