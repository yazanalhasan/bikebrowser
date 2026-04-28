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
 * NOTE: this file is the home of biology-category recipes managed
 * by the biology workbench. Existing crafting recipes still live
 * in `systems/craftingSystem.js` `RECIPES` and are not duplicated
 * here — they belong to a separate recipe surface owned by the
 * crafting system. When/if those are migrated, they would be
 * tagged with their own category here. This file's contract:
 * read by `systems/biology/recipeRegistry.js` filtered by
 * `category === 'biology'`.
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
