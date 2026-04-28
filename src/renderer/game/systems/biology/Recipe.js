/**
 * Recipe — Stage 1 recipe type for the Biology Workbench.
 *
 * Shape per `biology-substrate.md` §3.3 (Recipe) and §3 unified
 * data model. A Recipe is a static declaration loaded from
 * `data/recipes.js` (filtered by `category: 'biology'`).
 *
 * The Recipe class is a thin validator-and-accessor over the raw
 * `RecipeDef` plain object — it does NOT execute the recipe.
 * Execution is the responsibility of `Stage1RecipeEngine`.
 *
 * Fields:
 *   - id                     stable identifier (quests reference these)
 *   - displayName            UI label
 *   - category               'biology' for Stage 1 recipes
 *   - requiredInputs         [{ slotId, itemId, amount }]
 *   - process                { duration, visibleStages, failureConditions }
 *   - output                 itemId of the produced output
 *   - outcomeObservationId   pushed to state.observations on success
 *   - knowledgeUnlock        reserved for future knowledge-state system
 */

/**
 * @typedef {Object} RecipeRequiredInput
 * @property {string} slotId
 * @property {string} itemId
 * @property {number} amount
 */

/**
 * @typedef {Object} RecipeProcess
 * @property {number} duration                ms
 * @property {string[]} visibleStages         ordered stage labels
 * @property {Array<{trigger:string,message:string}>} failureConditions
 */

/**
 * Stage 1 Recipe type.
 *
 * Stages 2 / 3 do NOT extend the Recipe class — they introduce
 * separate `Organism` and `Ecosystem` entities (see substrate §3).
 * Recipes are Stage-1-only.
 */
export class Recipe {
  /**
   * @param {Object} def                                 raw recipe def
   * @param {string} def.id
   * @param {string} def.displayName
   * @param {'biology'} def.category
   * @param {RecipeRequiredInput[]} def.requiredInputs
   * @param {RecipeProcess} def.process
   * @param {string} def.output
   * @param {string} def.outcomeObservationId
   * @param {string} def.knowledgeUnlock
   */
  constructor(def) {
    if (!def || typeof def !== 'object') {
      throw new Error('[biology] Recipe: definition is required.');
    }
    if (!def.id) {
      throw new Error('[biology] Recipe: id is required.');
    }
    if (def.category !== 'biology') {
      throw new Error(
        `[biology] Recipe ${def.id}: category must be 'biology' (got '${def.category}').`,
      );
    }
    if (!Array.isArray(def.requiredInputs) || def.requiredInputs.length === 0) {
      throw new Error(
        `[biology] Recipe ${def.id}: requiredInputs must be a non-empty array.`,
      );
    }
    if (!def.process || typeof def.process.duration !== 'number') {
      throw new Error(
        `[biology] Recipe ${def.id}: process.duration is required (number, ms).`,
      );
    }
    if (!Array.isArray(def.process.visibleStages)) {
      throw new Error(
        `[biology] Recipe ${def.id}: process.visibleStages must be an array.`,
      );
    }
    if (!Array.isArray(def.process.failureConditions)) {
      throw new Error(
        `[biology] Recipe ${def.id}: process.failureConditions must be an array.`,
      );
    }
    if (!def.output) {
      throw new Error(`[biology] Recipe ${def.id}: output (itemId) is required.`);
    }
    if (!def.outcomeObservationId) {
      throw new Error(
        `[biology] Recipe ${def.id}: outcomeObservationId is required.`,
      );
    }

    /** @type {string} */
    this.id = def.id;
    /** @type {string} */
    this.displayName = def.displayName || def.id;
    /** @type {'biology'} */
    this.category = def.category;
    /** @type {RecipeRequiredInput[]} */
    this.requiredInputs = def.requiredInputs.map((i) => ({ ...i }));
    /** @type {RecipeProcess} */
    this.process = {
      duration: def.process.duration,
      visibleStages: [...def.process.visibleStages],
      failureConditions: def.process.failureConditions.map((f) => ({ ...f })),
    };
    /** @type {string} */
    this.output = def.output;
    /** @type {string} */
    this.outcomeObservationId = def.outcomeObservationId;
    /** @type {string} */
    this.knowledgeUnlock = def.knowledgeUnlock || '';
  }

  /**
   * Validate that the player-provided inputs satisfy this recipe.
   * Returns the first failure encountered, or null if valid.
   *
   * @param {Array<{slotId:string,itemId:string,amount:number}>} providedInputs
   * @returns {string|null}  structured failure reason or null on pass
   */
  validateInputs(providedInputs) {
    const provided = Array.isArray(providedInputs) ? providedInputs : [];

    for (const required of this.requiredInputs) {
      const match = provided.find((p) => p.slotId === required.slotId);
      if (!match) {
        return `missing_input:${required.itemId}`;
      }
      if (match.itemId !== required.itemId) {
        return `wrong_input:${required.slotId}:expected=${required.itemId},got=${match.itemId}`;
      }
      if ((match.amount ?? 0) < required.amount) {
        return `wrong_amount:${required.itemId}:expected=${required.amount},got=${match.amount ?? 0}`;
      }
    }
    return null;
  }
}

export default Recipe;
