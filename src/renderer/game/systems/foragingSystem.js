/**
 * Foraging System — detection, harvest, quality, and collection.
 *
 * Allows the player to gather materials from ecology-spawned plants.
 * Quality depends on environment conditions, creating meaningful
 * exploration incentives.
 *
 * Flow: detect nearby plant → check harvestable → compute quality → yield items
 */

import { getEnvironment } from './ecologyEngine.js';
import { PLANT_EFFECTS } from '../data/plantEffects.js';
import { FLORA_MAP } from '../data/flora.js';

// ── Harvest definitions (plant → item mapping) ──────────────────────────────

const HARVEST_TABLE = {
  creosote:      { items: ['creosote_leaves'],       baseYield: 2, rarity: 0.8 },
  mesquite:      { items: ['mesquite_pods'],          baseYield: 3, rarity: 0.7 },
  prickly_pear:  { items: ['prickly_pear_fruit', 'prickly_pear_pads'], baseYield: 2, rarity: 0.6 },
  saguaro:       { items: ['saguaro_fruit'],          baseYield: 1, rarity: 0.2 },
  jojoba:        { items: ['jojoba_seeds'],           baseYield: 2, rarity: 0.5 },
  barrel_cactus: { items: ['barrel_cactus_pulp'],     baseYield: 1, rarity: 0.4 },
  palo_verde:    { items: ['palo_verde_pods'],        baseYield: 2, rarity: 0.6 },
  // Medicinal plants (found in specific biomes, rarer)
  ephedra:       { items: ['ephedra_stems'],          baseYield: 1, rarity: 0.15 },
  yerba_mansa:   { items: ['yerba_mansa_root'],       baseYield: 1, rarity: 0.1 },
  desert_lavender: { items: ['desert_lavender_flowers'], baseYield: 2, rarity: 0.2 },
  agave:         { items: ['agave_fiber'],            baseYield: 1, rarity: 0.3 },
};

const FORAGE_RADIUS = 80; // pixels — how close player must be

// ── Detection ────────────────────────────────────────────────────────────────

/**
 * Find plants within foraging range of the player.
 *
 * @param {number} playerX
 * @param {number} playerY
 * @param {object[]} worldPlants - ecology-spawned plant objects
 * @returns {object[]} harvestable plants within range
 */
export function detectForageables(playerX, playerY, worldPlants) {
  return worldPlants.filter((plant) => {
    const dx = plant.x - playerX;
    const dy = plant.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= FORAGE_RADIUS && HARVEST_TABLE[plant.species];
  });
}

// ── Quality computation ──────────────────────────────────────────────────────

/**
 * Compute harvest quality based on environmental conditions.
 *
 * Higher moisture → better quality (plants are healthier)
 * Optimal elevation → better quality
 * Time of day matters for some plants
 *
 * @param {number} x
 * @param {number} y
 * @param {string} species
 * @param {'day'|'night'|'dawn'|'dusk'} [timeOfDay='day']
 * @returns {number} quality 0–1
 */
export function computeQuality(x, y, species, timeOfDay = 'day') {
  const env = getEnvironment(x, y, timeOfDay);
  let quality = 0.5; // base

  // Moisture boost (wetter = healthier plants)
  quality += env.moisture * 0.3;

  // Temperature sweet spot (not too hot, not too cold)
  const tempOptimal = 1 - Math.abs(env.temperature - 0.5) * 2;
  quality += tempOptimal * 0.1;

  // Dawn/dusk harvesting bonus (traditional knowledge)
  if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
    quality += 0.1;
  }

  // Some plants are better at specific elevations
  const effectDef = PLANT_EFFECTS[species];
  if (effectDef) {
    quality += 0.05;
  }

  // ── Advanced foraging dimensions (from flora.foraging) ──

  const floraDef = FLORA_MAP[species];
  const foragingData = floraDef?.foraging;
  if (foragingData) {
    // Night potency bonus for nocturnal plants (desert lavender, etc.)
    if (timeOfDay === 'night' && foragingData.nightBonus > 0) {
      quality += foragingData.nightBonus;
    }

    // Potency window match
    if (foragingData.potencyWindow !== 'any' && foragingData.potencyWindow === timeOfDay) {
      quality += 0.15;
    }

    // Contamination reduces quality
    const envContam = env.scientificProperties?.contaminationLevel || 0;
    quality -= envContam * 0.2;
    quality -= foragingData.contaminationRate * 2;
  }

  return Math.max(0.1, Math.min(1.0, quality));
}

// ── Night harvesting risk ────────────────────────────────────────────────────

/**
 * Compute danger level for harvesting at a given time.
 * Night foraging is riskier (scorpions, predators) but some plants
 * are more potent at night.
 *
 * @param {string} species
 * @param {'day'|'night'|'dawn'|'dusk'} timeOfDay
 * @returns {{ danger: number, bonus: number, warnings: string[] }}
 */
export function computeForagingRisk(species, timeOfDay) {
  const floraDef = FLORA_MAP[species];
  const foragingData = floraDef?.foraging;
  if (!foragingData) return { danger: 0, bonus: 0, warnings: [] };

  const warnings = [];
  let danger = 0;
  let bonus = 0;

  if (timeOfDay === 'night') {
    danger = foragingData.nightDanger || 0.1;
    bonus = foragingData.nightBonus || 0;

    if (danger > 0.2) {
      warnings.push('Scorpions are active near this plant at night!');
    }
    if (bonus > 0) {
      warnings.push(`${floraDef.label} is ${Math.round(bonus * 100)}% more potent at night.`);
    }
  }

  if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
    danger = (foragingData.nightDanger || 0.1) * 0.3;
    bonus = 0.05; // slight dawn/dusk bonus
  }

  return { danger, bonus, warnings };
}

// ── Harvest ──────────────────────────────────────────────────────────────────

// ── Quest-Conditional Drops ─────────────────────────────────────────────────
// When a quest is active that needs a special item from a plant species,
// foraging that plant drops the quest item in addition to normal loot.

const QUEST_DROPS = {
  mesquite: {
    questId: 'bridge_collapse',
    item: 'mesquite_wood_sample',
  },
};

/**
 * Harvest a plant and return the yield.
 *
 * @param {object} plant - the plant object from ecology
 * @param {'day'|'night'|'dawn'|'dusk'} [timeOfDay='day']
 * @param {object} [gameState] - optional game state to check active quests
 * @returns {{ items: { itemId: string, quality: number }[], species: string, message: string } | null}
 */
export function harvest(plant, timeOfDay = 'day', gameState = null) {
  const entry = HARVEST_TABLE[plant.species];
  if (!entry) return null;

  const quality = computeQuality(plant.x, plant.y, plant.species, timeOfDay);

  // Each item in the harvest table has a chance to drop
  const items = [];
  for (const itemId of entry.items) {
    const count = Math.max(1, Math.round(entry.baseYield * quality));
    for (let i = 0; i < count; i++) {
      items.push({ itemId, quality: Math.round(quality * 100) / 100 });
    }
  }

  // Quest-conditional drops: add quest item if the relevant quest is active
  const questDrop = QUEST_DROPS[plant.species];
  if (questDrop && gameState?.activeQuest?.id === questDrop.questId) {
    if (!(gameState.inventory || []).includes(questDrop.item)) {
      items.push({ itemId: questDrop.item, quality: 1.0 });
    }
  }

  const qualityLabel = quality >= 0.8 ? 'Excellent' : quality >= 0.6 ? 'Good' : quality >= 0.4 ? 'Fair' : 'Poor';

  return {
    items,
    species: plant.species,
    quality,
    message: `Harvested ${plant.species} — ${qualityLabel} quality (${Math.round(quality * 100)}%)`,
  };
}

// ── Foraging cooldowns ───────────────────────────────────────────────────────

const _forageCooldowns = new Map();
const COOLDOWN_MS = 30000; // 30 seconds between harvests of same plant

/**
 * Check if a plant is ready to be harvested (cooldown expired).
 */
export function canHarvest(plantKey) {
  const lastHarvest = _forageCooldowns.get(plantKey);
  if (!lastHarvest) return true;
  return Date.now() - lastHarvest >= COOLDOWN_MS;
}

/**
 * Mark a plant as harvested (start cooldown).
 */
export function markHarvested(plantKey) {
  _forageCooldowns.set(plantKey, Date.now());
}

/**
 * Generate a unique key for a plant instance (for cooldown tracking).
 */
export function plantKey(plant) {
  return `${plant.species}_${Math.round(plant.x)}_${Math.round(plant.y)}`;
}

// ── Full forage action ───────────────────────────────────────────────────────

/**
 * Complete forage action: detect → validate → harvest → return results.
 *
 * @param {number} playerX
 * @param {number} playerY
 * @param {object[]} worldPlants
 * @param {'day'|'night'|'dawn'|'dusk'} [timeOfDay='day']
 * @returns {{ success: boolean, harvest?: object, message: string }}
 */
export function attemptForage(playerX, playerY, worldPlants, timeOfDay = 'day') {
  const nearby = detectForageables(playerX, playerY, worldPlants);
  if (nearby.length === 0) {
    return { success: false, message: 'No plants nearby to forage.' };
  }

  // Pick the closest harvestable plant
  const sorted = nearby
    .map((p) => ({ ...p, dist: Math.sqrt((p.x - playerX) ** 2 + (p.y - playerY) ** 2) }))
    .sort((a, b) => a.dist - b.dist);

  for (const plant of sorted) {
    const key = plantKey(plant);
    if (!canHarvest(key)) continue;

    const result = harvest(plant, timeOfDay);
    if (!result) continue;

    markHarvested(key);
    return { success: true, harvest: result, message: result.message };
  }

  return { success: false, message: 'Plants nearby are regrowing — try again later.' };
}

/** Get the harvest table entry for a species (for UI/tooltips). */
export function getHarvestInfo(species) {
  return HARVEST_TABLE[species] || null;
}
