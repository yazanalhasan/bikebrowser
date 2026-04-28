/**
 * Recipe Registry — loads recipe definitions from `data/recipes.js`,
 * filters by `category: 'biology'`, and wraps each in a `Recipe`
 * instance. The Stage 1 engine reads from this registry.
 *
 * Per `biology-substrate.md` §15.3 (resolved): biology recipes live
 * in `data/recipes.js` with `category: 'biology'`. This module is
 * the single consumption point for that data.
 *
 * Registration is *idempotent* — registering the same id twice
 * replaces the prior entry (data hot-reload friendly).
 */

import { RECIPES, getRecipesByCategory } from '../../data/recipes.js';
import { Recipe } from './Recipe.js';

/** @type {Map<string, Recipe>} */
const _registry = new Map();

let _bootstrapped = false;

/**
 * Bootstrap the registry from `data/recipes.js`. Idempotent.
 * Called automatically on first read; can be called explicitly
 * (e.g. by tests) to re-sync after data changes.
 *
 * @returns {void}
 */
export function bootstrapRegistry() {
  _registry.clear();
  const biologyRecipes = getRecipesByCategory('biology');
  for (const def of biologyRecipes) {
    try {
      _registry.set(def.id, new Recipe(def));
    } catch (err) {
      // Author error — surface but don't crash registry build.
      // The engine will still surface the missing recipe at attempt
      // time, so the failure mode is observable.

      console.warn('[biology] recipeRegistry: failed to load recipe', def?.id, err);
    }
  }
  _bootstrapped = true;
}

function _ensureBootstrapped() {
  if (!_bootstrapped) bootstrapRegistry();
}

/**
 * Register a recipe at runtime. Used by `registerRecipe` in the
 * public API (substrate §4 Stage 1) and by tests.
 *
 * @param {Object} recipeDef    raw RecipeDef matching `data/recipes.js` shape
 * @returns {Recipe}
 */
export function registerRecipe(recipeDef) {
  _ensureBootstrapped();
  const recipe = recipeDef instanceof Recipe ? recipeDef : new Recipe(recipeDef);
  _registry.set(recipe.id, recipe);
  return recipe;
}

/**
 * Look up a recipe by id.
 *
 * @param {string} recipeId
 * @returns {Recipe|null}
 */
export function getRecipe(recipeId) {
  _ensureBootstrapped();
  return _registry.get(recipeId) || null;
}

/**
 * @returns {Recipe[]}  all registered biology recipes
 */
export function listRecipes() {
  _ensureBootstrapped();
  return Array.from(_registry.values());
}

/**
 * @returns {string[]}  registered recipe ids
 */
export function listRecipeIds() {
  _ensureBootstrapped();
  return Array.from(_registry.keys());
}

/**
 * Test-only: reset the registry (used to re-bootstrap from a
 * mutated `RECIPES` table during HMR / tests).
 *
 * @returns {void}
 */
export function _resetRegistryForTests() {
  _registry.clear();
  _bootstrapped = false;
}

// Re-export the raw table reference for advanced consumers (e.g.
// the workbench UI may want to render the displayName before any
// recipe has been instantiated).
export { RECIPES as ALL_RECIPES };
