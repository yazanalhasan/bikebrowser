/**
 * Organism — Stage 1 organism shape per `biology-substrate.md` §3.1.
 *
 * Stage 1 organisms are produced by recipes that yield a "living"
 * output (e.g., a tincture, a microbial culture, a cutting). Many
 * Stage 1 recipes produce *items* not organisms; the engine accepts
 * either. This class defines the data shape for the organism case.
 *
 * Per substrate §3.1 (Stage 1):
 * ```
 * Organism {
 *   id: string,
 *   speciesId: string | null,
 *   type: 'plant' | 'microbe' | 'animal-sample' | 'extract',
 *   recipeId: string,
 *   createdAt: number,
 *   attributes: { potency?, doseSafe?, contaminationLevel?, ... }
 * }
 * ```
 *
 * Stage 2 extension (substrate §3.1, designed-for, NOT IMPLEMENTED):
 * ```
 * Organism extends Stage1Organism {
 *   parameters: { temperature, pH, salinity, water, light, … },
 *   parameterEnvelope: { temperature: [min,max], … },
 *   trials: TrialResult[],
 * }
 * ```
 *
 * Stage 3 extension (substrate §3.1, designed-for, NOT IMPLEMENTED):
 * ```
 * Organism extends Stage2Organism {
 *   ecosystemBehavior: {
 *     eats: speciesId[],
 *     eatenBy: speciesId[],
 *     populationDynamics: { reproductionRate, mortalityRate },
 *     environmentalImpact: {
 *       consumes: [{ resource, rate }],
 *       produces: [{ resource, rate }],
 *     },
 *   },
 * }
 * ```
 *
 * The class is left intentionally extensible — Stage 2 and Stage 3
 * dispatches will subclass or extend this shape via
 * `upgradeOrganismToNextStage` (currently a halt-and-surface stub
 * in `index.js`).
 */

/**
 * Conditions block — Stage 1 organisms record the ambient conditions
 * under which they were produced (matches substrate §3 unified data
 * model "conditions" field). Stage 2 extends to a full parameter
 * envelope; Stage 1 just records what we know.
 *
 * @typedef {Object} OrganismConditions
 * @property {number} [temperature]      ambient °C at creation
 * @property {number} [humidity]         0–1
 * @property {string} [biomeId]          biome at creation site
 * @property {string} [sceneKey]         scene where the recipe ran
 */

/**
 * Stage 1 Organism.
 */
export class Organism {
  /**
   * @param {Object} init
   * @param {string} init.id
   * @param {string|null} [init.speciesId]      null for crafted derivatives
   * @param {'plant'|'microbe'|'animal-sample'|'extract'} [init.type]
   * @param {string} init.recipeId
   * @param {number} [init.createdAt]
   * @param {OrganismConditions} [init.conditions]
   * @param {Object} [init.attributes]
   * @param {string|null} [init.output]         itemId or null for organism-only outputs
   */
  constructor(init) {
    if (!init || typeof init !== 'object') {
      throw new Error('[biology] Organism: init is required.');
    }
    if (!init.id) {
      throw new Error('[biology] Organism: id is required.');
    }
    if (!init.recipeId) {
      throw new Error('[biology] Organism: recipeId is required.');
    }

    /** @type {string} */
    this.id = init.id;
    /** @type {string|null} */
    this.speciesId = init.speciesId ?? null;
    /** @type {'plant'|'microbe'|'animal-sample'|'extract'} */
    this.type = init.type ?? 'extract';
    /** @type {string} */
    this.recipeId = init.recipeId;
    /** @type {number} */
    this.createdAt = init.createdAt ?? Date.now();
    /** @type {OrganismConditions} */
    this.conditions = { ...(init.conditions || {}) };
    /** @type {Object} */
    this.attributes = { ...(init.attributes || {}) };
    /** @type {string|null} */
    this.output = init.output ?? null;
  }

  /**
   * Plain JSON snapshot — used for save persistence. Stage 2 / 3
   * extensions append fields here without breaking back-compat
   * (per substrate §11 "Save state model" → strict-extension).
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      speciesId: this.speciesId,
      type: this.type,
      recipeId: this.recipeId,
      createdAt: this.createdAt,
      conditions: { ...this.conditions },
      attributes: { ...this.attributes },
      output: this.output,
    };
  }
}

export default Organism;
