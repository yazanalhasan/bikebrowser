/**
 * Recipes Data — canonical recipe definitions consumed by the
 * Biology Workbench substrate (and potentially other recipe-driven
 * systems in future).
 *
 * Per `biology-substrate.md` §15.3 (resolved):
 *   Biology recipes live here with `category: 'biology'`.
 *
 * Per the substrate §3 Recipe shape:
 *   - id: string
 *   - displayName: string
 *   - category: 'biology' | …
 *   - requiredInputs: [{ slotId, itemId, amount }]
 *   - process: { duration, visibleStages, failureConditions }
 *   - output: itemId
 *   - outcomeObservationId: string
 *   - knowledgeUnlock: string
 *
 * ─── Acknowledged technical debt ────────────────────────────────
 *
 * This file COEXISTS with `systems/craftingSystem.js`'s RECIPES
 * constant. There are now two parallel recipe surfaces in the
 * codebase:
 *
 *   - `systems/craftingSystem.js`'s RECIPES — older, owned by the
 *     crafting system. Quest `craft`-type steps (e.g.
 *     `desert_healer.craft_salve`) gate on these via
 *     `requiredRecipe`. Some recipe ids appear here verbatim
 *     (e.g. `healing_salve`).
 *   - `data/recipes.js` (THIS file) — newer, owned by the biology
 *     workbench. Recipes carry `category: 'biology'` and emit a
 *     `biology.recipe.outcome` event with an
 *     `outcomeObservationId` on success.
 *
 * Recipe id collision (e.g. `healing_salve` exists in BOTH) is
 * intentional under the current arrangement: the biology
 * workbench produces additional metadata (`outcomeObservationId`,
 * `knowledgeUnlock`) that the existing crafting system doesn't,
 * while the existing crafting system still drives the quest
 * `craft`-step gate. Quests that use `requiredRecipe` continue to
 * work via `craftingSystem.js`. The biology engine's emission of
 * `outcomeObservationId` (e.g. `salve_crafted`) is currently
 * UNCONSUMED by any quest; it is wired-emitter-but-no-listener
 * pending the future Recipe System Unification design.
 *
 * The unification of the two surfaces is a deliberate open
 * design conversation — see
 * `.claude/plans/items-1-8-playbook-2026-04-27.md` §A.10 "Recipe
 * system unification" for the three resolution paths under
 * consideration. No fix attempted in this file; the duplication
 * is documented here so future readers don't try to "fix" one
 * side without understanding the cross-system implications.
 *
 * Until A.10 lands, the contract is:
 *   - `systems/biology/recipeRegistry.js` reads THIS file,
 *     filtered by `category === 'biology'`.
 *   - `systems/craftingSystem.js` reads its own internal RECIPES
 *     constant and is the authoritative path for `craft`-type
 *     quest steps.
 *   - Recipe id collisions are tolerated; the two systems do not
 *     coordinate beyond the input-item level.
 */

/**
 * @typedef {Object} RecipeRequiredInput
 * @property {string} slotId   - workbench slot id (e.g. 'leaf_slot')
 * @property {string} itemId   - inventory item id required in the slot
 * @property {number} amount   - how many of itemId the slot consumes
 */

/**
 * @typedef {Object} RecipeProcess
 * @property {number}   duration       - process duration in ms
 * @property {string[]} visibleStages  - named stages shown in UI
 * @property {Array<{trigger: string, message: string}>} failureConditions
 */

/**
 * @typedef {Object} RecipeDef
 * @property {string} id
 * @property {string} displayName
 * @property {'biology'} category
 * @property {RecipeRequiredInput[]} requiredInputs
 * @property {RecipeProcess} process
 * @property {string} output                  - itemId of crafted output
 * @property {string} outcomeObservationId    - pushed to state.observations on success
 * @property {string} knowledgeUnlock         - reserved for future knowledge-state system
 */

/**
 * All recipes, keyed by id. Filter by `category` to scope a recipe
 * surface (e.g. biology workbench reads `category === 'biology'`).
 *
 * @type {Object<string, RecipeDef>}
 */
export const RECIPES = {
  // ── Biology recipes (category: 'biology') ────────────────────────────────

  healing_salve: {
    id: 'healing_salve',
    displayName: 'Healing Salve',
    category: 'biology',
    requiredInputs: [
      { slotId: 'leaf_slot', itemId: 'creosote_leaves', amount: 1 },
      { slotId: 'fiber_slot', itemId: 'agave_fiber', amount: 1 },
    ],
    process: {
      duration: 4000,
      visibleStages: ['grinding', 'mixing', 'curing'],
      failureConditions: [
        { trigger: 'missing-input', message: 'A required ingredient is missing.' },
        { trigger: 'wrong-ratio', message: 'Wrong proportions — salve under-yields.' },
        { trigger: 'wrong-condition', message: 'Too dry — paste cracks before it sets.' },
      ],
    },
    output: 'healing_salve',
    outcomeObservationId: 'salve_crafted',
    knowledgeUnlock: 'plant_pharmacology_basics',
  },

  plant_composite: {
    id: 'plant_composite',
    displayName: 'Plant Composite',
    category: 'biology',
    requiredInputs: [
      { slotId: 'fiber_slot', itemId: 'agave_fiber', amount: 1 },
      { slotId: 'resin_slot', itemId: 'creosote_leaves', amount: 1 },
    ],
    process: {
      duration: 5000,
      visibleStages: ['fiber_alignment', 'resin_infusion', 'press_cure'],
      failureConditions: [
        { trigger: 'missing-input', message: 'Need both fiber and resin source.' },
        { trigger: 'wrong-ratio', message: 'Resin pooled — fibers not fully bound.' },
        { trigger: 'wrong-condition', message: 'Cure incomplete — composite delaminates.' },
      ],
    },
    output: 'plant_composite',
    outcomeObservationId: 'composite_created',
    knowledgeUnlock: 'composite_materials',
  },

  protective_coating: {
    id: 'protective_coating',
    displayName: 'Protective Coating',
    category: 'biology',
    requiredInputs: [
      { slotId: 'resin_slot', itemId: 'creosote_leaves', amount: 1 },
      { slotId: 'wax_slot', itemId: 'jojoba_seeds', amount: 1 },
    ],
    process: {
      duration: 3500,
      visibleStages: ['rendering', 'blending', 'application'],
      failureConditions: [
        { trigger: 'missing-input', message: 'Coating needs both a resin and a wax source.' },
        { trigger: 'wrong-ratio', message: 'Coating runs thin — does not seal.' },
        { trigger: 'wrong-condition', message: 'Wax separated from resin — coating clouds.' },
      ],
    },
    output: 'protective_coating',
    outcomeObservationId: 'coating_applied',
    knowledgeUnlock: 'desert_surface_treatment',
  },
};

/**
 * Convenience: list of recipes filtered by category.
 *
 * @param {string} category
 * @returns {RecipeDef[]}
 */
export function getRecipesByCategory(category) {
  return Object.values(RECIPES).filter((r) => r.category === category);
}

export default RECIPES;
