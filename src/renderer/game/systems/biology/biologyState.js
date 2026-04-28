/**
 * Biology State — workbench state container per `biology-substrate.md`
 * §11 "Save state model".
 *
 * Stage 1 persists:
 *   state.biology.recipes[recipeId] = {
 *     attempts:        number,         // total attempts (success + failure)
 *     successes:       number,         // successful attempts
 *     firstSuccessAt:  number|null,    // ms timestamp of first success, or null
 *     lastAttemptAt:   number|null,
 *   }
 *   state.biology.unlockedStage = 'stage-1' | 'stage-2' | 'stage-3'
 *
 * The state lives on the standard game-state object (the same
 * object passed to `saveGame()`). This module's helpers read /
 * mutate the `biology` slice in a stable shape, so callers don't
 * have to know the layout.
 *
 * Authority separation per substrate §11: biology owns recipe and
 * organism state; it never writes ecology's per-species runtime
 * state. Species observation pushes to `state.observations` are
 * handled by the recipe-engine consumer, not by this module — this
 * module is concerned only with the per-recipe attempt counter and
 * first-success timestamp.
 */

import { saveGame } from '../saveSystem.js';

/**
 * @typedef {Object} RecipeAttemptRecord
 * @property {number}      attempts
 * @property {number}      successes
 * @property {number|null} firstSuccessAt
 * @property {number|null} lastAttemptAt
 */

/**
 * Default Stage-1 biology state slice.
 *
 * @returns {{ recipes: Record<string, RecipeAttemptRecord>, unlockedStage: 'stage-1' }}
 */
export function defaultBiologyState() {
  return {
    recipes: {},
    unlockedStage: 'stage-1',
  };
}

/**
 * Ensure `state.biology` exists in canonical shape; returns the
 * (possibly newly-created) biology slice. Mutates `state` in place
 * if the slice was missing, mirroring the convention of other
 * state systems in the codebase.
 *
 * @param {object} state         the global game state
 * @returns {object} state.biology
 */
export function ensureBiologyState(state) {
  if (!state.biology || typeof state.biology !== 'object') {
    state.biology = defaultBiologyState();
  }
  if (!state.biology.recipes || typeof state.biology.recipes !== 'object') {
    state.biology.recipes = {};
  }
  if (!state.biology.unlockedStage) {
    state.biology.unlockedStage = 'stage-1';
  }
  return state.biology;
}

/**
 * Record a recipe attempt outcome. Updates the per-recipe record
 * and (optionally) persists via `saveGame`.
 *
 * @param {object}  state                game state
 * @param {string}  recipeId
 * @param {boolean} success
 * @param {Object}  [opts]
 * @param {boolean} [opts.persist=true]  call saveGame after update
 * @param {number}  [opts.timestamp]     override Date.now() (test hook)
 * @returns {RecipeAttemptRecord}        updated record
 */
export function recordRecipeAttempt(state, recipeId, success, opts = {}) {
  const persist = opts.persist !== false;
  const ts = opts.timestamp ?? Date.now();

  const bio = ensureBiologyState(state);
  const rec = bio.recipes[recipeId] || {
    attempts: 0,
    successes: 0,
    firstSuccessAt: null,
    lastAttemptAt: null,
  };
  rec.attempts += 1;
  rec.lastAttemptAt = ts;
  if (success) {
    rec.successes += 1;
    if (rec.firstSuccessAt == null) rec.firstSuccessAt = ts;
  }
  bio.recipes[recipeId] = rec;

  if (persist) {
    try {
      saveGame(state);
    } catch (err) {
      // Persistence failure is non-fatal — the in-memory state is
      // already updated. Surface so dev sees it.

      console.warn('[biology] biologyState: saveGame failed', err);
    }
  }
  return rec;
}

/**
 * Read the per-recipe record. Returns a fresh default record (not
 * persisted) if the recipe has never been attempted.
 *
 * @param {object} state
 * @param {string} recipeId
 * @returns {RecipeAttemptRecord}
 */
export function getRecipeRecord(state, recipeId) {
  const bio = ensureBiologyState(state);
  return (
    bio.recipes[recipeId] || {
      attempts: 0,
      successes: 0,
      firstSuccessAt: null,
      lastAttemptAt: null,
    }
  );
}

/**
 * Has the player ever successfully completed this recipe?
 *
 * @param {object} state
 * @param {string} recipeId
 * @returns {boolean}
 */
export function hasFirstSuccess(state, recipeId) {
  return getRecipeRecord(state, recipeId).firstSuccessAt != null;
}

/**
 * Read which workbench stage is currently visible to the player.
 * Per substrate §4 cross-stage `getStageVisibility()`.
 *
 * @param {object} state
 * @returns {'stage-1'|'stage-2'|'stage-3'}
 */
export function getUnlockedStage(state) {
  return ensureBiologyState(state).unlockedStage || 'stage-1';
}
