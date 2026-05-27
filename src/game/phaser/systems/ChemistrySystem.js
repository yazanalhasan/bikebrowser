import { act1Chemistry } from '../../data/act1/index.js';

export class ChemistrySystem {
  static carryForward = {
    environmentalPrimitives: ['heat', 'drying_time', 'concentration'],
    progressionPrimitives: ['recipe_run', 'safe_handling_recorded'],
    actScalingPath: 'Mix-dry-test loops become later materials, ecology, and propulsion chemistry reasoning.',
  };

  constructor(recipes = act1Chemistry) {
    this.recipes = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    this.results = new Map();
  }

  runRecipe(recipeId) {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return { ok: false, reason: 'unknown_recipe', recipeId };
    const result = {
      recipeId,
      output: recipe.output,
      explanation: `${recipe.displayName} uses ${recipe.concentration} concentration and ${recipe.drying} drying before it can be trusted.`,
      safeHandling: true,
      stages: ['mix', 'wait', 'test'],
    };
    this.results.set(recipeId, result);
    return { ok: true, result };
  }

  getState() {
    return {
      results: [...this.results.values()],
      recipes: [...this.recipes.values()],
    };
  }

  loadState(state = {}) {
    this.results = new Map((state.results || []).map((result) => [result.recipeId, result]));
  }
}
