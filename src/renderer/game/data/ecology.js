/**
 * Ecology Link Data — defines the web of relationships between
 * plants, animals, and environment.
 *
 * This is the interconnection layer that makes the world feel alive.
 * The ecology engine reads these links to:
 *   - Boost spawn probability of animals near their food plants
 *   - Chain predators to prey presence
 *   - Drive quest discovery (follow the food chain)
 *   - Determine foraging outcomes (what grows near what)
 *
 * All data-driven. No hardcoded spawn logic.
 */

// ── Plant → Animal relationships ─────────────────────────────────────────────

export const PLANT_ECOLOGY = {
  creosote: {
    supports: ['kangaroo_rat', 'rabbit', 'quail'],
    predatorsNearby: ['roadrunner', 'hawk'],
    pollinators: ['insects'],
    spawnBoost: 0.6,
    biome: 'desert_scrub',
  },
  mesquite: {
    supports: ['javelina', 'rabbit', 'quail'],
    predatorsNearby: ['coyote'],
    spawnBoost: 0.7,
    biome: 'desert_scrub',
    producesFood: true,
  },
  saguaro: {
    supports: ['hawk', 'quail'],
    predatorsNearby: ['gila_monster'],
    spawnBoost: 0.4,
    biome: 'sonoran_desert',
    providesNesting: true,
  },
  prickly_pear: {
    supports: ['javelina', 'rabbit'],
    predatorsNearby: ['coyote'],
    spawnBoost: 0.5,
    biome: 'desert_scrub',
    producesFood: true,
  },
  palo_verde: {
    supports: ['rabbit', 'quail'],
    predatorsNearby: ['hawk'],
    spawnBoost: 0.4,
    biome: 'sonoran_desert',
    providesShade: true,
  },
  jojoba: {
    supports: ['kangaroo_rat', 'quail'],
    predatorsNearby: ['roadrunner'],
    spawnBoost: 0.3,
    biome: 'chaparral',
  },
  barrel_cactus: {
    supports: [],
    predatorsNearby: ['gila_monster'],
    spawnBoost: 0.1,
    biome: 'sonoran_desert',
    waterSource: true,
  },
  juniper: {
    supports: ['elk', 'quail'],
    predatorsNearby: [],
    spawnBoost: 0.5,
    biome: 'woodland',
  },
  pinyon: {
    supports: ['elk'],
    predatorsNearby: [],
    spawnBoost: 0.4,
    biome: 'woodland',
    producesFood: true,
  },
  agave: {
    supports: ['rabbit'],
    predatorsNearby: ['coyote'],
    pollinators: ['bats', 'insects'],
    spawnBoost: 0.3,
    biome: 'desert_scrub',
    producesFiber: true,
  },
  yucca: {
    supports: [],
    predatorsNearby: [],
    pollinators: ['insects'],
    spawnBoost: 0.3,
    biome: 'desert_scrub',
    producesSaponin: true,
    producesFiber: true,
  },
  desert_lavender: {
    supports: [],
    predatorsNearby: [],
    pollinators: ['insects'],
    spawnBoost: 0.3,
    biome: 'chaparral',
    producesMedicine: true,
  },
  ephedra: {
    supports: [],
    predatorsNearby: [],
    pollinators: ['insects'],
    spawnBoost: 0.2,
    biome: 'chaparral',
    producesStimulant: true,
    dangerousAtHighDose: true,
  },
};

// ── Animal → Animal relationships (predator chains) ──────────────────────────

export const PREDATOR_CHAINS = [
  { prey: 'javelina',     predator: 'coyote',     probability: 0.3 },
  { prey: 'rabbit',       predator: 'coyote',     probability: 0.4 },
  { prey: 'rabbit',       predator: 'hawk',       probability: 0.3 },
  { prey: 'kangaroo_rat', predator: 'coyote',     probability: 0.2 },
  { prey: 'kangaroo_rat', predator: 'roadrunner', probability: 0.4 },
  { prey: 'kangaroo_rat', predator: 'hawk',       probability: 0.3 },
  { prey: 'quail',        predator: 'hawk',       probability: 0.3 },
  { prey: 'quail',        predator: 'coyote',     probability: 0.15 },
];

// ── Time-of-day behavior ─────────────────────────────────────────────────────

export const TIME_BEHAVIOR = {
  day: {
    activeAnimals: ['javelina', 'rabbit', 'roadrunner', 'quail', 'gila_monster', 'hawk', 'elk'],
    plantActivity: 'photosynthesis',
    visibility: 1.0,
    temperature: 'hot',
  },
  night: {
    activeAnimals: ['coyote', 'kangaroo_rat'],
    plantActivity: 'dormant',
    visibility: 0.4,
    temperature: 'cool',
  },
  dawn: {
    activeAnimals: ['rabbit', 'quail', 'roadrunner', 'coyote'],
    plantActivity: 'waking',
    visibility: 0.7,
    temperature: 'mild',
  },
  dusk: {
    activeAnimals: ['javelina', 'coyote', 'kangaroo_rat', 'hawk'],
    plantActivity: 'settling',
    visibility: 0.6,
    temperature: 'cooling',
  },
};

// ── Biome definitions ────────────────────────────────────────────────────────

export const BIOMES = {
  desert_scrub: {
    elevationRange: [0, 3500],
    moistureRange: [0, 0.25],
    dominantPlants: ['creosote', 'mesquite', 'prickly_pear'],
    temperature: 'hot',
  },
  sonoran_desert: {
    elevationRange: [0, 4000],
    moistureRange: [0, 0.2],
    dominantPlants: ['saguaro', 'palo_verde', 'barrel_cactus'],
    temperature: 'hot',
  },
  chaparral: {
    elevationRange: [2000, 5000],
    moistureRange: [0.1, 0.4],
    dominantPlants: ['jojoba', 'creosote'],
    temperature: 'warm',
  },
  riparian: {
    elevationRange: [0, 5000],
    moistureRange: [0.4, 1.0],
    dominantPlants: ['mesquite', 'palo_verde'],
    temperature: 'mild',
  },
  woodland: {
    elevationRange: [3500, 7500],
    moistureRange: [0.2, 0.7],
    dominantPlants: ['juniper', 'pinyon'],
    temperature: 'cool',
  },
};

/**
 * Get the biome at a position based on environment conditions.
 */
export function getBiome(elevation, moisture) {
  for (const [id, biome] of Object.entries(BIOMES)) {
    if (elevation >= biome.elevationRange[0] &&
        elevation <= biome.elevationRange[1] &&
        moisture >= biome.moistureRange[0] &&
        moisture <= biome.moistureRange[1]) {
      return { id, ...biome };
    }
  }
  return { id: 'desert_scrub', ...BIOMES.desert_scrub };
}

/**
 * Get all animals that a plant supports (directly + predators).
 */
export function getLinkedAnimals(plantName) {
  const link = PLANT_ECOLOGY[plantName];
  if (!link) return [];
  return [...(link.supports || []), ...(link.predatorsNearby || [])];
}

/**
 * Get predators for a given prey species.
 */
export function getPredators(preyName) {
  return PREDATOR_CHAINS
    .filter((c) => c.prey === preyName)
    .map((c) => ({ species: c.predator, probability: c.probability }));
}

/**
 * Get prey for a given predator species.
 */
export function getPreyFor(predatorName) {
  return PREDATOR_CHAINS
    .filter((c) => c.predator === predatorName)
    .map((c) => ({ species: c.prey, probability: c.probability }));
}
