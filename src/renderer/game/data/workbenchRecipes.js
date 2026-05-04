import ITEMS from './items.js';
import { RECIPES as BIOLOGY_RECIPES } from './recipes.js';

const WORKBENCH_RECIPE_IDS = ['protective_coating', 'plant_composite'];

function itemName(itemId) {
  return ITEMS[itemId]?.name || itemId.replace(/_/g, ' ');
}

function fromBiologyRecipe(id, extra = {}) {
  const recipe = BIOLOGY_RECIPES[id];
  const ingredients = (recipe?.requiredInputs || []).flatMap((input) =>
    Array.from({ length: input.amount || 1 }, () => input.itemId),
  );

  return {
    id,
    name: recipe?.displayName || itemName(id),
    result: recipe?.output || id,
    ingredients,
    outcomeObservationId: recipe?.outcomeObservationId,
    ...extra,
  };
}

export const WORKBENCH_RECIPES = {
  protective_coating: fromBiologyRecipe('protective_coating', {
    questId: 'desert_coating',
    description:
      'Creosote resin makes a tough UV-resistant seal; jojoba wax helps the coating repel moisture.',
    useText: 'Use it as heat and sun protection for bike parts.',
  }),
  plant_composite: fromBiologyRecipe('plant_composite', {
    questId: 'perfect_composite',
    description:
      'Agave fibers carry tension while creosote resin binds the layers and spreads stress.',
    useText: 'Use it as a lightweight plant-based composite sample.',
  }),
};

export function getWorkbenchRecipe(id) {
  return WORKBENCH_RECIPES[id] || null;
}

export function getKnownWorkbenchRecipeIds(state) {
  const known = new Set(state?.knownWorkbenchRecipes || []);

  if (state?.activeQuest?.id === 'desert_coating') {
    known.add('protective_coating');
  }
  if ((state?.inventory || []).includes('protective_coating')) {
    known.add('protective_coating');
  }
  if ((state?.observations || []).includes('coating_applied')) {
    known.add('protective_coating');
  }
  if (state?.activeQuest?.id === 'perfect_composite') {
    known.add('plant_composite');
  }
  if ((state?.inventory || []).includes('plant_composite')) {
    known.add('plant_composite');
  }
  if ((state?.observations || []).includes('composite_created')) {
    known.add('plant_composite');
  }

  return WORKBENCH_RECIPE_IDS.filter((id) => known.has(id));
}

export function getKnownWorkbenchRecipes(state) {
  return getKnownWorkbenchRecipeIds(state)
    .map((id) => WORKBENCH_RECIPES[id])
    .filter(Boolean);
}

export function getMissingWorkbenchIngredients(recipe, inventory = []) {
  const available = [...inventory];
  const missing = [];

  for (const ingredient of recipe.ingredients || []) {
    const index = available.indexOf(ingredient);
    if (index === -1) {
      missing.push(ingredient);
    } else {
      available.splice(index, 1);
    }
  }

  return missing;
}

export function formatWorkbenchRecipeNote(recipe) {
  const ingredientText = (recipe.ingredients || []).map(itemName).join(' + ');
  return `Workbench recipe learned: ${recipe.name} = ${ingredientText}. ${recipe.description} ${recipe.useText}`;
}

export function formatWorkbenchMemoryLine(recipe) {
  const ingredientText = (recipe.ingredients || []).map(itemName).join(' + ');
  return `${recipe.name}: ${ingredientText} -> ${itemName(recipe.result)}. ${recipe.useText}`;
}

export function formatMissingWorkbenchIngredients(recipe, inventory = []) {
  return getMissingWorkbenchIngredients(recipe, inventory).map(itemName);
}
