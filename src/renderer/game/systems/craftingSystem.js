/**
 * Crafting System — data-driven recipe processing with effect composition.
 *
 * Recipes combine foraged materials into useful products.
 * Each recipe defines:
 *   - required ingredients (item ids)
 *   - processing method (raw, cooked, brewed, tincture, topical)
 *   - output item
 *   - combined effect (composed from ingredient plant effects)
 *
 * Effect composition: when two plants are combined, their effects merge.
 * Synergies boost certain stats, while stacking risks compounds toxicity.
 *
 * All data-driven — new recipes just add entries, no code changes.
 */

import { PLANT_EFFECTS } from '../data/plantEffects.js';
import ITEMS from '../data/items.js';

// ── Recipe Definitions ───────────────────────────────────────────────────────

export const RECIPES = {
  healing_salve: {
    id: 'healing_salve',
    name: 'Healing Salve',
    ingredients: ['creosote_leaves', 'agave_fiber'],
    processing: 'topical',
    result: 'healing_salve',
    description: 'Anti-inflammatory salve for cuts and scrapes.',
    effectSources: ['creosote', 'agave'],
    difficulty: 'beginner',
    learnedFrom: 'mrs_ramirez',
  },
  energy_cake: {
    id: 'energy_cake',
    name: 'Desert Energy Cake',
    ingredients: ['mesquite_pods', 'prickly_pear_fruit'],
    processing: 'cooked',
    result: 'energy_cake',
    description: 'Sustained energy from desert superfoods.',
    effectSources: ['mesquite', 'prickly_pear'],
    difficulty: 'beginner',
  },
  stimulant_tea: {
    id: 'stimulant_tea',
    name: 'Mormon Tea',
    ingredients: ['ephedra_stems'],
    processing: 'brewed',
    result: 'stimulant_tea',
    description: 'Speed boost tea — powerful but risky.',
    effectSources: ['ephedra'],
    difficulty: 'intermediate',
    warningText: 'Use sparingly — stresses the heart.',
  },
  wound_poultice: {
    id: 'wound_poultice',
    name: 'Wound Poultice',
    ingredients: ['yerba_mansa_root', 'agave_fiber'],
    processing: 'topical',
    result: 'wound_poultice',
    description: 'Antimicrobial bandage for deep wounds.',
    effectSources: ['yerba_mansa', 'agave'],
    difficulty: 'intermediate',
  },
  calming_tea: {
    id: 'calming_tea',
    name: 'Lavender Focus Tea',
    ingredients: ['desert_lavender_flowers'],
    processing: 'brewed',
    result: 'calming_tea',
    description: 'Sharpens focus and calms the mind.',
    effectSources: ['desert_lavender'],
    difficulty: 'beginner',
  },
  sun_balm: {
    id: 'sun_balm',
    name: 'Desert Sun Balm',
    ingredients: ['jojoba_seeds', 'agave_fiber'],
    processing: 'topical',
    result: 'sun_balm',
    description: 'Natural sunscreen from jojoba oil.',
    effectSources: ['jojoba', 'agave'],
    difficulty: 'beginner',
  },
  hydration_jelly: {
    id: 'hydration_jelly',
    name: 'Cactus Water Jelly',
    ingredients: ['prickly_pear_fruit', 'barrel_cactus_pulp'],
    processing: 'raw',
    result: 'hydration_jelly',
    description: 'Emergency hydration from two cactus species.',
    effectSources: ['prickly_pear', 'barrel_cactus'],
    difficulty: 'beginner',
  },
};

// ── Processing methods ───────────────────────────────────────────────────────

export const PROCESSING_TYPES = {
  raw: {
    label: 'Raw',
    description: 'No processing — use as-is.',
    qualityMultiplier: 0.8,
    timeSeconds: 0,
  },
  cooked: {
    label: 'Cooked',
    description: 'Heat-processed to improve digestibility.',
    qualityMultiplier: 1.0,
    timeSeconds: 5,
  },
  brewed: {
    label: 'Brewed',
    description: 'Steeped in hot water to extract compounds.',
    qualityMultiplier: 1.1,
    timeSeconds: 8,
  },
  tincture: {
    label: 'Tincture',
    description: 'Concentrated extraction — potent effects.',
    qualityMultiplier: 1.3,
    timeSeconds: 15,
  },
  topical: {
    label: 'Topical',
    description: 'Mixed into a paste or salve for skin application.',
    qualityMultiplier: 1.0,
    timeSeconds: 5,
  },
};

// ── Crafting Logic ───────────────────────────────────────────────────────────

/**
 * Check if a recipe can be crafted with the current inventory.
 *
 * @param {string} recipeId
 * @param {string[]} inventory - array of item ids
 * @returns {{ canCraft: boolean, missing: string[] }}
 */
export function canCraft(recipeId, inventory) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return { canCraft: false, missing: [recipeId] };

  const available = [...inventory];
  const missing = [];

  for (const ingredient of recipe.ingredients) {
    const idx = available.indexOf(ingredient);
    if (idx === -1) {
      missing.push(ingredient);
    } else {
      available.splice(idx, 1); // consume from available
    }
  }

  return { canCraft: missing.length === 0, missing };
}

/**
 * Get all recipes the player can currently craft.
 *
 * @param {string[]} inventory
 * @param {string[]} [knownRecipes] - recipes the player has learned
 * @returns {object[]}
 */
export function getAvailableRecipes(inventory, knownRecipes) {
  return Object.values(RECIPES)
    .filter((recipe) => {
      if (knownRecipes && !knownRecipes.includes(recipe.id)) return false;
      return canCraft(recipe.id, inventory).canCraft;
    })
    .map((recipe) => ({
      ...recipe,
      canCraft: true,
    }));
}

/**
 * Execute a crafting recipe. Consumes ingredients, produces result.
 *
 * @param {string} recipeId
 * @param {string[]} inventory
 * @param {number} [avgQuality=0.5] - average quality of ingredients
 * @returns {{ success: boolean, inventory: string[], result?: string, message: string, effect?: object }}
 */
export function craft(recipeId, inventory, avgQuality = 0.5) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return { success: false, inventory, message: 'Unknown recipe.' };

  const check = canCraft(recipeId, inventory);
  if (!check.canCraft) {
    const missingNames = check.missing.map((id) => ITEMS[id]?.name || id).join(', ');
    return { success: false, inventory, message: `Missing: ${missingNames}` };
  }

  // Consume ingredients
  let newInventory = [...inventory];
  for (const ingredient of recipe.ingredients) {
    const idx = newInventory.indexOf(ingredient);
    if (idx !== -1) newInventory.splice(idx, 1);
  }

  // Add result
  newInventory.push(recipe.result);

  // Compose effect from sources
  const composedEffect = composeEffects(recipe.effectSources, recipe.processing, avgQuality);

  const proc = PROCESSING_TYPES[recipe.processing];
  return {
    success: true,
    inventory: newInventory,
    result: recipe.result,
    message: `Crafted ${recipe.name}! (${proc?.label || recipe.processing})`,
    effect: composedEffect,
  };
}

// ── Effect Composition ───────────────────────────────────────────────────────

/**
 * Compose effects from multiple plant sources.
 * Merges all effects, averages overlaps, sums risks.
 *
 * @param {string[]} plantSources - plant names
 * @param {string} processing - processing method
 * @param {number} quality - 0–1 quality multiplier
 * @returns {object} composed effect matching plantEffects.js shape
 */
export function composeEffects(plantSources, processing, quality = 0.5) {
  const mergedEffects = {};
  let totalRisk = 0;
  let riskType = null;
  let maxDuration = 0;
  const types = [];

  for (const source of plantSources) {
    const pe = PLANT_EFFECTS[source];
    if (!pe) continue;

    types.push(pe.type);
    maxDuration = Math.max(maxDuration, pe.duration || 30);

    // Merge effects (stack, don't replace)
    for (const [key, value] of Object.entries(pe.effect || {})) {
      if (typeof value === 'number') {
        mergedEffects[key] = (mergedEffects[key] || 0) + value;
      } else {
        mergedEffects[key] = value;
      }
    }

    // Accumulate risks
    if (pe.risk) {
      riskType = pe.risk;
      totalRisk += pe.riskAmount || 0;
    }
  }

  // Apply processing quality multiplier
  const proc = PROCESSING_TYPES[processing];
  const qualityMult = (proc?.qualityMultiplier || 1) * quality;

  for (const key of Object.keys(mergedEffects)) {
    if (typeof mergedEffects[key] === 'number') {
      mergedEffects[key] *= qualityMult;
    }
  }

  return {
    type: types.join('+'),
    effect: mergedEffects,
    risk: riskType,
    riskAmount: totalRisk,
    duration: maxDuration,
    quality: qualityMult,
  };
}

/**
 * Get all recipes as a list (for UI display).
 */
export function getAllRecipes() {
  return Object.values(RECIPES);
}

/**
 * Get recipe by result item id.
 */
export function getRecipeForItem(itemId) {
  return Object.values(RECIPES).find((r) => r.result === itemId) || null;
}

// ── Dose-Dependent Pharmacology ──────────────────────────────────────────────

/**
 * Dose levels and their effect multipliers.
 * Low dose = mild benefit, no risk.
 * Medium dose = full benefit, some risk.
 * High dose = benefit plateaus, risk escalates.
 * Overdose = benefit reverses, risk becomes dominant.
 *
 * This is the fundamental pharmacology principle:
 * "The dose makes the poison." — Paracelsus
 */
const DOSE_CURVES = {
  low:      { benefitMult: 0.5,  riskMult: 0,    label: 'Low Dose' },
  medium:   { benefitMult: 1.0,  riskMult: 0.5,  label: 'Standard Dose' },
  high:     { benefitMult: 1.1,  riskMult: 1.5,  label: 'High Dose' },
  overdose: { benefitMult: 0.3,  riskMult: 3.0,  label: 'Overdose!' },
};

/**
 * Compute the final effect of a plant/crafted item considering dose
 * and player state.
 *
 * @param {object} plantEffect - from plantEffects.js
 * @param {'low'|'medium'|'high'|'overdose'} dose
 * @param {object} playerStats - current player stats { health, stamina, hydration, toxicity }
 * @returns {{ effects: object, risks: object, explanation: string, warnings: string[] }}
 */
export function computeDoseEffect(plantEffect, dose = 'medium', playerStats = {}) {
  const curve = DOSE_CURVES[dose] || DOSE_CURVES.medium;
  const warnings = [];

  // Scale benefits by dose
  const effects = {};
  for (const [key, value] of Object.entries(plantEffect.effect || {})) {
    if (typeof value === 'number') {
      effects[key] = Math.round(value * curve.benefitMult * 100) / 100;
    } else {
      effects[key] = value;
    }
  }

  // Scale risks by dose
  const risks = {};
  if (plantEffect.risk) {
    risks.type = plantEffect.risk;
    risks.amount = Math.round((plantEffect.riskAmount || 0.1) * curve.riskMult * 100) / 100;

    if (curve.riskMult > 1) {
      warnings.push(`${curve.label}: risk of ${plantEffect.risk} is elevated!`);
    }
  }

  // Player state interactions
  if (playerStats.toxicity > 0.4 && risks.amount > 0) {
    risks.amount *= 1.5;
    warnings.push('High existing toxicity amplifies risk! Consider detoxing first.');
  }
  if (playerStats.hydration < 0.3 && plantEffect.type === 'stimulant') {
    risks.amount *= 2;
    warnings.push('Stimulants are dangerous when dehydrated — cardiac risk doubled!');
  }
  if (playerStats.stamina < 0.2 && dose === 'high') {
    warnings.push('Exhaustion + high dose = unpredictable reaction.');
  }

  // Overdose reversal
  if (dose === 'overdose') {
    // Some benefits flip to negatives
    if (effects.restoreHealth) effects.restoreHealth = -Math.abs(effects.restoreHealth);
    if (effects.restoreStamina) effects.restoreStamina *= 0.2;
    warnings.push('OVERDOSE: Benefits reversed. Seeking more does not mean getting more.');
  }

  const explanation = `${curve.label}: ` +
    `Benefits at ${Math.round(curve.benefitMult * 100)}%, ` +
    `Risk at ${Math.round(curve.riskMult * 100)}%. ` +
    (dose === 'overdose'
      ? '"The dose makes the poison." More is not always better — the body has limits.'
      : dose === 'high'
      ? 'Higher dose pushes the body harder. The benefit curve is flattening while risk keeps climbing.'
      : dose === 'low'
      ? 'Low dose is safe but effect is mild. Good for sensitive patients or first-time use.'
      : 'Standard dose balances benefit and risk.');

  return { effects, risks, explanation, warnings, dose: curve.label };
}

/** Get available dose levels. */
export function getDoseLevels() {
  return Object.entries(DOSE_CURVES).map(([key, curve]) => ({
    key,
    ...curve,
  }));
}
