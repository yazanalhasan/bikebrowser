/**
 * Mining System — resource extraction, yield calculation, and refinement.
 *
 * Pure functions operating on game state (same pattern as questSystem.js).
 * No side effects — callers persist the result.
 *
 * Gameplay loop:
 *   1. Player enters unlocked region
 *   2. Available materials shown based on rarity roll
 *   3. Player mines → raw material added to state.minedResources
 *   4. Player refines → refined material added to state.materials
 *   5. Milestone engine checks for mining/refining milestones
 *
 * Tool progression:
 *   Level 0 — hand mining (1× yield, common only)
 *   Level 1 — pickaxe (1.5× yield, uncommon accessible)
 *   Level 2 — drill (2× yield, rare accessible)
 *   Level 3 — automated rig (3× yield, epic accessible)
 */

import REGIONS, { REGION_MAP, RARITY_CHANCE } from '../data/regions.js';

// ── Tool Definitions ────────────────────────────────────────────────────────

const TOOL_LEVELS = [
  { level: 0, name: 'Hand Mining',    yieldMultiplier: 1.0, rarityAccess: ['common'],                        speedMs: 3000 },
  { level: 1, name: 'Pickaxe',        yieldMultiplier: 1.5, rarityAccess: ['common', 'uncommon'],            speedMs: 2000 },
  { level: 2, name: 'Drill',          yieldMultiplier: 2.0, rarityAccess: ['common', 'uncommon', 'rare'],    speedMs: 1200 },
  { level: 3, name: 'Automated Rig',  yieldMultiplier: 3.0, rarityAccess: ['common', 'uncommon', 'rare', 'epic'], speedMs: 800 },
];

export { TOOL_LEVELS };

// ── Region Access ───────────────────────────────────────────────────────────

/**
 * Check if a region is unlocked for the player.
 * Arizona is always unlocked. Others require milestone dependencies.
 */
export function isRegionUnlocked(regionId, milestoneState) {
  const region = REGION_MAP[regionId];
  if (!region) return false;
  if (region.dependencies.length === 0) return true;
  const completed = new Set(milestoneState?.completed || []);
  return region.dependencies.every((dep) => completed.has(dep));
}

/**
 * Get all regions with their unlock status.
 */
export function getRegionStatus(milestoneState) {
  return REGIONS.map((region) => ({
    id: region.id,
    name: region.name,
    icon: region.icon,
    culture: region.culture,
    unlocked: isRegionUnlocked(region.id, milestoneState),
    dependencies: region.dependencies,
    materialCount: region.materials.length,
  }));
}

// ── Material Availability ───────────────────────────────────────────────────

/**
 * Get materials available to mine in a region, filtered by tool level.
 */
export function getAvailableMaterials(regionId, toolLevel = 0) {
  const region = REGION_MAP[regionId];
  if (!region) return [];
  const tool = TOOL_LEVELS[Math.min(toolLevel, TOOL_LEVELS.length - 1)];
  return region.materials.filter((mat) => tool.rarityAccess.includes(mat.rarity));
}

/**
 * Roll for which material spawns at a mining node.
 * Weighted by rarity. Returns a material object or null.
 */
export function rollMaterialSpawn(regionId, toolLevel = 0) {
  const available = getAvailableMaterials(regionId, toolLevel);
  if (available.length === 0) return null;

  // Build weighted pool
  const weighted = [];
  for (const mat of available) {
    const chance = RARITY_CHANCE[mat.rarity] || 0.1;
    weighted.push({ mat, weight: chance });
  }

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const { mat, weight } of weighted) {
    roll -= weight;
    if (roll <= 0) return mat;
  }

  return weighted[0]?.mat || null;
}

// ── Mining ──────────────────────────────────────────────────────────────────

/**
 * Mine a resource. Returns updated state with the material added
 * to minedResources and mining stats updated.
 *
 * @param {object} state - full game state
 * @param {string} regionId
 * @param {string} materialId
 * @returns {{ state: object, ok: boolean, yield: number, message: string }}
 */
export function mineResource(state, regionId, materialId) {
  const region = REGION_MAP[regionId];
  if (!region) return { state, ok: false, yield: 0, message: 'Unknown region.' };

  // Check region unlocked
  if (!isRegionUnlocked(regionId, state.milestones)) {
    return { state, ok: false, yield: 0, message: `${region.name} is locked.` };
  }

  const material = region.materials.find((m) => m.id === materialId);
  if (!material) return { state, ok: false, yield: 0, message: 'Material not found in this region.' };

  // Check tool level allows this rarity
  const toolLevel = state.miningToolLevel || 0;
  const tool = TOOL_LEVELS[Math.min(toolLevel, TOOL_LEVELS.length - 1)];
  if (!tool.rarityAccess.includes(material.rarity)) {
    return { state, ok: false, yield: 0, message: `Need better tools to mine ${material.rarity} materials.` };
  }

  // Calculate yield
  const baseYield = 1;
  const yieldAmount = Math.max(1, Math.floor(baseYield * tool.yieldMultiplier));

  // Update state
  const minedResources = { ...(state.minedResources || {}) };
  minedResources[materialId] = (minedResources[materialId] || 0) + yieldAmount;

  const miningStats = { ...(state.miningStats || { totalMined: 0, regionsVisited: [] }) };
  miningStats.totalMined = (miningStats.totalMined || 0) + yieldAmount;
  if (!miningStats.regionsVisited.includes(regionId)) {
    miningStats.regionsVisited = [...miningStats.regionsVisited, regionId];
  }

  return {
    state: { ...state, minedResources, miningStats },
    ok: true,
    yield: yieldAmount,
    message: `Mined ${yieldAmount}× ${material.name}!`,
  };
}

// ── Refinement ──────────────────────────────────────────────────────────────

/**
 * Refinement recipes. Maps raw material → refined output.
 * Some require a second input (e.g., iron + carbon → steel).
 */
const REFINEMENT_RECIPES = {
  copper_ore:          { output: 'copper',           outputName: 'Copper Ingot',     cost: 1, secondInput: null },
  copper_ore_andes:    { output: 'copper',           outputName: 'Copper Ingot',     cost: 1, secondInput: null },
  copper_ore_arabian:  { output: 'copper',           outputName: 'Copper Ingot',     cost: 1, secondInput: null },
  copper_ore_turkish:  { output: 'copper',           outputName: 'Copper Ingot',     cost: 1, secondInput: null },
  copper_ore_persian:  { output: 'copper',           outputName: 'Copper Ingot',     cost: 1, secondInput: null },
  copper_ore_pakistan:  { output: 'copper',           outputName: 'Copper Ingot',     cost: 1, secondInput: null },
  silver_ore:          { output: 'silver',           outputName: 'Silver Ingot',     cost: 1, secondInput: null },
  silver_ore_andes:    { output: 'silver',           outputName: 'Silver Ingot',     cost: 1, secondInput: null },
  gold_ore:            { output: 'gold',             outputName: 'Gold Ingot',       cost: 2, secondInput: null },
  gold_ore_andes:      { output: 'gold',             outputName: 'Gold Ingot',       cost: 2, secondInput: null },
  gold_ore_arabian:    { output: 'gold',             outputName: 'Gold Ingot',       cost: 2, secondInput: null },
  gold_ore_swahili:    { output: 'gold',             outputName: 'Gold Ingot',       cost: 2, secondInput: null },
  gold_ore_pakistan:    { output: 'gold',             outputName: 'Gold Ingot',       cost: 2, secondInput: null },
  gold_ore_malay:      { output: 'gold',             outputName: 'Gold Ingot',       cost: 2, secondInput: null },
  iron_ore_turkish:    { output: 'iron_ingot',       outputName: 'Iron Ingot',       cost: 1, secondInput: null },
  iron_ore_swahili:    { output: 'iron_ingot',       outputName: 'Iron Ingot',       cost: 1, secondInput: null },
  iron_ore_chinese:    { output: 'iron_ingot',       outputName: 'Iron Ingot',       cost: 1, secondInput: null },
  lithium_brine:       { output: 'lithium_compound', outputName: 'Lithium Compound', cost: 3, secondInput: null },
  quartz:              { output: 'silicon',           outputName: 'Silicon',          cost: 2, secondInput: null },
  bauxite:             { output: 'aluminum',         outputName: 'Aluminum Ingot',   cost: 2, secondInput: null },
  tin_ore:             { output: 'tin',              outputName: 'Tin Ingot',        cost: 1, secondInput: null },
  tungsten_ore:        { output: 'tungsten',         outputName: 'Tungsten Bar',     cost: 3, secondInput: null },
  rare_earth_ore:      { output: 'rare_earth_refined', outputName: 'Rare Earth Elements', cost: 4, secondInput: null },
  zinc_ore:            { output: 'zinc',             outputName: 'Zinc Ingot',       cost: 1, secondInput: null },
  rock_salt:           { output: 'salt_crystal',     outputName: 'Salt Crystal',     cost: 1, secondInput: null },
  pink_salt:           { output: 'salt_crystal',     outputName: 'Salt Crystal',     cost: 1, secondInput: null },
  coal:                { output: 'coke',             outputName: 'Coke',             cost: 1, secondInput: null },
  boron_ore:           { output: 'boron',            outputName: 'Boron',            cost: 2, secondInput: null },
  phosphate_rock:      { output: 'phosphate',        outputName: 'Phosphate',        cost: 1, secondInput: null },
  natural_rubber:      { output: 'rubber',           outputName: 'Rubber',           cost: 1, secondInput: null },
};

export { REFINEMENT_RECIPES };

/**
 * Check if a material can be refined.
 */
export function canRefine(state, materialId) {
  const recipe = REFINEMENT_RECIPES[materialId];
  if (!recipe) return { canRefine: false, reason: 'No refinement recipe for this material.' };

  const available = (state.minedResources || {})[materialId] || 0;
  if (available < recipe.cost) {
    return { canRefine: false, reason: `Need ${recipe.cost} ${materialId}, have ${available}.` };
  }

  if (recipe.secondInput) {
    const secondAvailable = (state.minedResources || {})[recipe.secondInput] || 0;
    if (secondAvailable < 1) {
      return { canRefine: false, reason: `Also need ${recipe.secondInput}.` };
    }
  }

  return { canRefine: true, recipe };
}

/**
 * Refine a raw material into a processed material.
 * Consumes raw material from minedResources, adds to state.materials.
 *
 * @returns {{ state: object, ok: boolean, output: string, message: string }}
 */
export function refineMaterial(state, materialId) {
  const check = canRefine(state, materialId);
  if (!check.canRefine) {
    return { state, ok: false, output: null, message: check.reason };
  }

  const recipe = check.recipe;
  const minedResources = { ...(state.minedResources || {}) };
  const materials = { ...(state.materials || {}) };

  // Consume input
  minedResources[materialId] -= recipe.cost;
  if (minedResources[materialId] <= 0) delete minedResources[materialId];

  // Consume second input if needed
  if (recipe.secondInput) {
    minedResources[recipe.secondInput] -= 1;
    if (minedResources[recipe.secondInput] <= 0) delete minedResources[recipe.secondInput];
  }

  // Produce output
  materials[recipe.output] = (materials[recipe.output] || 0) + 1;

  const miningStats = { ...(state.miningStats || {}) };
  miningStats.totalRefined = (miningStats.totalRefined || 0) + 1;

  return {
    state: { ...state, minedResources, materials, miningStats },
    ok: true,
    output: recipe.output,
    message: `Refined into ${recipe.outputName}!`,
  };
}

// ── Material Science Comparison ─────────────────────────────────────────────

/**
 * Compare materials by a set of properties for the bridge quest
 * and other material-selection challenges.
 *
 * @param {string[]} materialIds - material IDs from minedResources or MATERIALS
 * @param {string[]} properties - property names to compare (e.g., ['strength', 'weight'])
 * @returns {object[]} comparison table
 */
export function compareMaterials(materialIds, properties) {
  // Import inline to avoid circular dependency
  const { MATERIALS } = require('../data/materials.js');

  return materialIds.map((id) => {
    const mat = MATERIALS[id];
    if (!mat) return { id, name: id, properties: {} };

    const props = {};
    for (const prop of properties) {
      // Search all domains for the property
      for (const domain of ['structural', 'physical', 'thermal', 'electrical', 'chemical', 'fluid', 'coating']) {
        if (mat[domain]?.[prop] !== undefined) {
          props[prop] = mat[domain][prop];
          break;
        }
      }
      if (props[prop] === undefined) props[prop] = 0;
    }

    return { id, name: mat.label, icon: mat.icon, category: mat.category, properties: props };
  });
}

// ── Default Mining State ────────────────────────────────────────────────────

export function defaultMiningState() {
  return {
    minedResources: {},     // { [materialId]: count }
    miningToolLevel: 0,     // 0-3
    miningStats: {
      totalMined: 0,
      totalRefined: 0,
      regionsVisited: [],
    },
  };
}
