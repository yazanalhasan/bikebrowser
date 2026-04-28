/**
 * Biology Workbench — public API surface.
 *
 * Implements the Stage 1 (Recipe Biology) surface of
 * `biology-substrate.md` §4. Stages 2 (Parametric) and Stage 3
 * (Simulation) are *designed-for* in the substrate but
 * implementation is deferred to later dispatches; this module
 * exports halt-and-surface stubs for those names so downstream
 * code can import them without error and surface undefined
 * behavior on early invocation.
 *
 * Per the agent .md "Out of scope": NO scene file, NO quest
 * definition, NO ecology system file, NO `questSystem.js` is
 * modified by this implementation. Recipe outcomes flow back
 * through the `biology.recipe.outcome` event — consumers (a
 * scene mounting the workbench, or a quest gate) subscribe to
 * that event and update their own state.
 */

// ── Stage 1 surface ──────────────────────────────────────────────────────────

import {
  registerRecipe as _registerRecipe,
  getRecipe,
  listRecipes,
  listRecipeIds,
  bootstrapRegistry,
  ALL_RECIPES,
} from './recipeRegistry.js';

import {
  attemptRecipe as _attemptRecipe,
} from './Stage1RecipeEngine.js';

import {
  emitRecipeOutcome as _emitRecipeOutcome,
  emitRecipeAttempt,
  onRecipeOutcome,
  onRecipeAttempt,
  onEcologyObservation,
  BIOLOGY_EVENTS,
} from './biologyEvents.js';

import {
  ensureBiologyState,
  recordRecipeAttempt,
  getRecipeRecord,
  hasFirstSuccess,
  getUnlockedStage,
} from './biologyState.js';

import { Recipe } from './Recipe.js';
import { Organism } from './Organism.js';

/**
 * Register a recipe with the engine. Mirrors substrate §4 Stage 1.
 *
 * @param {Object} recipeConfig    raw RecipeDef matching `data/recipes.js` shape
 * @returns {Recipe}
 */
export function registerRecipe(recipeConfig) {
  return _registerRecipe(recipeConfig);
}

/**
 * Validate inputs, run the visible process, emit outcome event.
 * Per substrate §4 Stage 1.
 *
 * @param {object} scene
 * @param {string} recipeId
 * @param {Array<{slotId:string,itemId:string,amount:number}>} providedInputs
 * @param {object} [options]    see `Stage1RecipeEngine.attemptRecipe`
 * @returns {object} AttemptResult
 */
export function attemptRecipe(scene, recipeId, providedInputs, options) {
  return _attemptRecipe(scene, recipeId, providedInputs, options);
}

/**
 * Emit `biology.recipe.outcome`. Exposed for consumers that need
 * to broadcast a recipe outcome WITHOUT going through
 * `attemptRecipe` (e.g., legacy scene-side logic that already
 * granted the output and now wants to emit the canonical event).
 *
 * @param {object} scene
 * @param {string} recipeId
 * @param {boolean} success
 * @param {string|null} output            itemId or null
 * @param {string|null} [failureReason]
 * @returns {object} the emitted RecipeOutcomePayload
 */
export function emitRecipeOutcome(recipeId, success, output, failureReason = null) {
  // Substrate §4 signature is (recipeId, success, output, failureReason?).
  // We resolve the scene from the global game registry — for direct
  // API callers, this means they should prefer the engine's
  // `attemptRecipe` (which knows the scene). When no scene is
  // available, we fall back to a no-op emitter so the call is safe.
  return _emitRecipeOutcome(_globalScene, recipeId, success, output, failureReason);
}

/**
 * Per substrate §4 cross-stage. Stage 1 returns `['stage1']`
 * unconditionally; Stage 2 / 3 unlocks (substrate §15.1) are
 * deferred.
 *
 * @param {object} [playerState]   game state (read for unlockedStage)
 * @returns {string[]}              currently visible stages (subset of
 *                                  ['stage1','stage2','stage3'])
 */
export function getStageVisibility(playerState) {
  if (!playerState) return ['stage1'];
  const stage = getUnlockedStage(playerState);
  if (stage === 'stage-3') return ['stage1', 'stage2', 'stage3'];
  if (stage === 'stage-2') return ['stage1', 'stage2'];
  return ['stage1'];
}

// Engine bootstrap is lazy — calling any of the above will
// auto-bootstrap the registry. Exposed for tests / consumers that
// want to force a re-sync after data hot reload.
export { bootstrapRegistry };

// Convenience accessors for consumers (workbench UI, tests).
export {
  getRecipe,
  listRecipes,
  listRecipeIds,
  ALL_RECIPES,
  emitRecipeAttempt,
  onRecipeOutcome,
  onRecipeAttempt,
  onEcologyObservation,
  BIOLOGY_EVENTS,
  ensureBiologyState,
  recordRecipeAttempt,
  getRecipeRecord,
  hasFirstSuccess,
  getUnlockedStage,
  Recipe,
  Organism,
};

// ── Stage 2 stubs (designed-for, NOT implemented) ────────────────────────────

const STAGE_2_DEFERRED =
  '[biology] %FN% is deferred to Phase 5 (Stage 2 implementation). See biology-substrate.md §15.1.';

/**
 * Stage 2: design an organism by selecting parameter values.
 * **HALT-AND-SURFACE** — implementation deferred to the dispatch
 * that builds Stage 2 (Parametric Biology). See substrate §15.1.
 *
 * @param {string} _baseSpeciesId
 * @param {object} _parameterChoices
 * @returns {never}
 * @throws  always — Stage 2 not implemented in this dispatch.
 */
export function designOrganism(_baseSpeciesId, _parameterChoices) {
  throw new Error(STAGE_2_DEFERRED.replace('%FN%', 'designOrganism'));
}

/**
 * Stage 2: validate an organism against environmental constraints.
 * **HALT-AND-SURFACE** — see substrate §15.1.
 *
 * @param {object} _organism
 * @param {object} _environmentalConstraints
 * @returns {never}
 * @throws  always — Stage 2 not implemented.
 */
export function validateOrganism(_organism, _environmentalConstraints) {
  throw new Error(STAGE_2_DEFERRED.replace('%FN%', 'validateOrganism'));
}

/**
 * Stage 2: emit `biology.organism.designed`.
 * **HALT-AND-SURFACE** — see substrate §15.1.
 *
 * @param {object} _organism
 * @returns {never}
 * @throws  always — Stage 2 not implemented.
 */
export function emitOrganismDesignEvent(_organism) {
  throw new Error(STAGE_2_DEFERRED.replace('%FN%', 'emitOrganismDesignEvent'));
}

// ── Stage 3 stubs (designed-for, NOT implemented) ────────────────────────────

const STAGE_3_DEFERRED =
  '[biology] %FN% is deferred to Phase 6 (Stage 3 implementation). See biology-substrate.md §15.4.';

/**
 * Stage 3: create a simulator ecosystem from a biome template.
 * **HALT-AND-SURFACE** — see substrate §15.4.
 *
 * @param {object} _biomeConfig
 * @returns {never}
 * @throws  always — Stage 3 not implemented.
 */
export function createEcosystem(_biomeConfig) {
  throw new Error(STAGE_3_DEFERRED.replace('%FN%', 'createEcosystem'));
}

/**
 * Stage 3: introduce an organism into a simulator ecosystem.
 * **HALT-AND-SURFACE** — see substrate §15.4.
 *
 * @param {object} _ecosystem
 * @param {object} _organism
 * @returns {never}
 * @throws  always — Stage 3 not implemented.
 */
export function introduceOrganism(_ecosystem, _organism) {
  throw new Error(STAGE_3_DEFERRED.replace('%FN%', 'introduceOrganism'));
}

/**
 * Stage 3: advance the simulation by `deltaTime` ticks.
 * **HALT-AND-SURFACE** — see substrate §15.4.
 *
 * @param {object} _ecosystem
 * @param {number} _deltaTime
 * @returns {never}
 * @throws  always — Stage 3 not implemented.
 */
export function stepSimulation(_ecosystem, _deltaTime) {
  throw new Error(STAGE_3_DEFERRED.replace('%FN%', 'stepSimulation'));
}

/**
 * Stage 3: snapshot of current ecosystem populations + environment.
 * **HALT-AND-SURFACE** — see substrate §15.4.
 *
 * @param {object} _ecosystem
 * @returns {never}
 * @throws  always — Stage 3 not implemented.
 */
export function observeEcosystemState(_ecosystem) {
  throw new Error(STAGE_3_DEFERRED.replace('%FN%', 'observeEcosystemState'));
}

/**
 * Stage 3: emit a simulation event (tick or terminal outcome).
 * **HALT-AND-SURFACE** — see substrate §15.4.
 *
 * @param {string} _eventType
 * @param {object} _ecosystem
 * @param {object} _organism
 * @param {object} _details
 * @returns {never}
 * @throws  always — Stage 3 not implemented.
 */
export function emitSimulationEvent(_eventType, _ecosystem, _organism, _details) {
  throw new Error(STAGE_3_DEFERRED.replace('%FN%', 'emitSimulationEvent'));
}

// ── Cross-stage stubs ────────────────────────────────────────────────────────

/**
 * Cross-stage: upgrade an organism's data shape from Stage N to
 * Stage N+1 per substrate §3.1 strict-extension model.
 * **HALT-AND-SURFACE** — Stage 2 needed for any real upgrade.
 *
 * @param {object} _organism
 * @returns {never}
 * @throws  always — Stage 2 not implemented.
 */
export function upgradeOrganismToNextStage(_organism) {
  throw new Error(STAGE_2_DEFERRED.replace('%FN%', 'upgradeOrganismToNextStage'));
}

// ── Internal: scene registration for global emit fallback ────────────────────

/**
 * Some consumers (notably legacy `emitRecipeOutcome` callers that
 * lack a scene reference) need the substrate to remember the most
 * recent active scene. This is a pragmatic compromise — the
 * preferred path is `attemptRecipe(scene, …)` which threads the
 * scene through. When no scene is reachable, emission becomes a
 * no-op (the event is dropped) — that is the failure mode for
 * detached calls.
 */
let _globalScene = null;

/**
 * Register the active scene so engine-internal code can find a
 * game-events emitter. Idempotent. Scenes mounting the workbench
 * should call this on `create()` and pass `null` on `shutdown`.
 *
 * @param {object|null} scene
 * @returns {void}
 */
export function setActiveScene(scene) {
  _globalScene = scene || null;
}
