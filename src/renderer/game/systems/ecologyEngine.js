/**
 * Ecology Engine — procedural flora and fauna spawning system.
 *
 * Generates environmentally-appropriate vegetation and wildlife based on:
 *   - Elevation gradient (noise-based, mountain in NE corner)
 *   - Moisture gradient (lake/pool as water sources)
 *   - Flora clustering (desert plants grow in natural groupings)
 *   - Fauna food chain (predators spawn near prey)
 *   - Time of day (day/night activity patterns)
 *
 * Works with the 1536×1024 world map. Does NOT modify quest logic,
 * save state, or any deterministic game systems.
 */

import { WORLD, COLLISION_ZONES, LANDMARKS } from '../data/neighborhoodLayout.js';
import { FLORA } from '../data/flora.js';
import { FAUNA, FAUNA_MAP } from '../data/fauna.js';
import { PLANT_ECOLOGY, PREDATOR_CHAINS } from '../data/ecology.js';

// ── Seeded PRNG (deterministic per-position) ─────────────────────────────────

function hashPosition(x, y, seed = 42) {
  let h = seed;
  h = ((h << 5) - h + (x * 374761393)) | 0;
  h = ((h << 5) - h + (y * 668265263)) | 0;
  h = ((h ^ (h >>> 15)) * 2246822519) | 0;
  h = ((h ^ (h >>> 13)) * 3266489917) | 0;
  h = (h ^ (h >>> 16)) | 0;
  return (h & 0x7fffffff) / 0x7fffffff;
}

// ── Simple 2D noise (value noise, no dependencies) ───────────────────────────

function noise2D(x, y, scale = 1, seed = 0) {
  const sx = x / scale;
  const sy = y / scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;

  // Smooth interpolation
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hashPosition(ix, iy, seed);
  const b = hashPosition(ix + 1, iy, seed);
  const c = hashPosition(ix, iy + 1, seed);
  const d = hashPosition(ix + 1, iy + 1, seed);

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) +
         c * (1 - ux) * uy + d * ux * uy;
}

// ── Environment Model ────────────────────────────────────────────────────────

/**
 * Get the UNIFIED environment conditions at a world position.
 *
 * All systems read from this single model:
 *   - Ecology (flora/fauna spawning)
 *   - Chemistry (extraction quality)
 *   - Foraging (harvest quality, maturity)
 *   - Science interactions (fluid physics, contamination, topology)
 *   - Player stats (heat drain, hazards)
 *
 * @param {number} x
 * @param {number} y
 * @param {'day'|'night'|'dawn'|'dusk'} [timeOfDay='day']
 * @returns {object} unified environment
 */
export function getEnvironment(x, y, timeOfDay = 'day') {
  const elevation = getElevation(x, y);
  const moisture = getMoisture(x, y);
  const temperature = getTemperature(x, y);

  return {
    elevation,
    moisture,
    temperature,
    biomeType: classifyBiome(elevation, moisture),
    timeOfDay,

    // Scientific properties — drive OYLA-inspired systems
    scientificProperties: {
      fluidType: getFluidType(x, y, moisture),
      topologyState: getTopologyState(x, y, elevation),
      contaminationLevel: getContaminationLevel(x, y, moisture, temperature),
      signalNoise: getSignalNoise(x, y, elevation),
    },
  };
}

/** Classify biome from elevation + moisture. */
function classifyBiome(elevation, moisture) {
  if (moisture > 0.5) return 'riparian';
  if (elevation > 4000) return 'woodland';
  if (elevation > 2500 && moisture > 0.15) return 'chaparral';
  if (moisture < 0.15) return 'sonoran_desert';
  return 'desert_scrub';
}

/**
 * Non-Newtonian fluid zones — areas where plant secretions and
 * organic decay create oobleck-like ground.
 * Found near lake edges and dense mesquite stands where
 * organic matter accumulates in wet clay.
 */
function getFluidType(x, y, moisture) {
  // Near lake edge where organic sediment meets clay
  const lakeEdgeDist = Math.sqrt((x - 770) ** 2 + (y - 230) ** 2);
  const isLakeMargin = lakeEdgeDist < 120 && lakeEdgeDist > 60;

  // Dense organic decay zones (seeded, deterministic)
  const organicNoise = noise2D(x, y, 80, 7);
  const isOrganicPatch = moisture > 0.3 && organicNoise > 0.7;

  if (isLakeMargin || isOrganicPatch) return 'non_newtonian';
  if (moisture > 0.6) return 'water';
  if (moisture > 0.3) return 'mud';
  return 'dry';
}

/**
 * Topology state — regions where spatial geometry is unusual.
 * Cave systems and deep root networks create loop-like structures.
 * Located in mountain area and deep desert trail zone.
 */
function getTopologyState(x, y, elevation) {
  // Mountain cave zone
  const caveDist = Math.sqrt((x - 1300) ** 2 + (y - 120) ** 2);
  if (caveDist < 80 && elevation > 3500) return 'moebius';

  // Deep root network under ancient mesquite grove
  const rootDist = Math.sqrt((x - 400) ** 2 + (y - 800) ** 2);
  const rootNoise = noise2D(x, y, 50, 8);
  if (rootDist < 100 && rootNoise > 0.6) return 'loop';

  // Desert trail anomaly zone
  const trailDist = Math.sqrt((x - 1450) ** 2 + (y - 600) ** 2);
  if (trailDist < 60) return 'twisted';

  return 'normal';
}

/**
 * Environmental contamination — affects foraged items and player health.
 * Higher near roads, standing water, and decay zones.
 */
function getContaminationLevel(x, y, moisture, temperature) {
  let contamination = 0.02; // baseline desert = very clean

  // Roads are contaminated (intersection at ~640,470)
  const roadDist = Math.min(Math.abs(y - 470), Math.abs(x - 640));
  if (roadDist < 40) contamination += 0.3;

  // Standing water breeds microbes
  if (moisture > 0.5) contamination += moisture * 0.2;

  // Heat accelerates microbial growth
  contamination += temperature * 0.05;

  // Noise for natural variation
  contamination += noise2D(x, y, 150, 5) * 0.1;

  return Math.min(1, Math.max(0, contamination));
}

/**
 * Signal noise — electromagnetic/sensory interference.
 * Affects the memory challenge system and navigation clarity.
 * Higher near power lines (roads) and metal structures.
 */
function getSignalNoise(x, y, elevation) {
  let noise = 0.05;

  // Road/power line corridor
  if (Math.abs(y - 470) < 50 || Math.abs(x - 640) < 50) noise += 0.3;

  // Mountain interference from mineral deposits
  if (elevation > 3000) noise += (elevation - 3000) / 5000;

  // Natural variation
  noise += noise2D(x, y, 200, 6) * 0.15;

  return Math.min(1, Math.max(0, noise));
}

export function getElevation(x, y) {
  // Base gradient: rises toward NE corner (mountain)
  const nx = x / WORLD.width;
  const ny = y / WORLD.height;
  const gradient = (nx * 0.6 + (1 - ny) * 0.4); // higher NE

  // Noise for natural variation
  const n = noise2D(x, y, 200, 1) * 0.3;

  // Mountain peak boost in upper-right
  const mtDist = Math.sqrt((x - 1150) ** 2 + (y - 80) ** 2);
  const mtBoost = Math.max(0, 1 - mtDist / 400) * 3000;

  return 1200 + gradient * 2500 + n * 800 + mtBoost;
}

export function getMoisture(x, y) {
  // Water sources: lake (770, 140) and pool (1100, 720)
  const lakeDist = Math.sqrt((x - 770) ** 2 + (y - 140) ** 2);
  const poolDist = Math.sqrt((x - 1100) ** 2 + (y - 720) ** 2);

  const lakeInfluence = Math.max(0, 1 - lakeDist / 350);
  const poolInfluence = Math.max(0, 1 - poolDist / 200);

  // Base desert dryness + noise
  const base = 0.05 + noise2D(x, y, 300, 2) * 0.1;

  return Math.min(1, base + lakeInfluence * 0.7 + poolInfluence * 0.4);
}

export function getTemperature(x, y) {
  // Inversely proportional to elevation
  const elev = getElevation(x, y);
  return Math.max(0, Math.min(1, 1 - (elev - 1000) / 6000));
}

// ── Exclusion zones (don't spawn on roads, buildings, water) ─────────────────

function isExcludedZone(x, y) {
  // Collision zones (water, rocks)
  for (const cz of COLLISION_ZONES) {
    if (Math.abs(x - cz.x) < cz.width / 2 && Math.abs(y - cz.y) < cz.height / 2) {
      return true;
    }
  }

  // Major roads (horizontal ~y=470, vertical ~x=640)
  if (Math.abs(y - 470) < 30 && x > 100 && x < WORLD.width - 100) return true;
  if (Math.abs(x - 640) < 25 && y > 100 && y < WORLD.height - 100) return true;

  // Garage/home area
  if (x < 350 && y < 320) return true;

  // NPC areas (don't obscure quest NPCs)
  if (Math.abs(x - 480) < 50 && Math.abs(y - 300) < 50) return true;
  if (Math.abs(x - 880) < 50 && Math.abs(y - 680) < 50) return true;

  // World boundary padding
  if (x < 30 || x > WORLD.width - 30 || y < 30 || y > WORLD.height - 30) return true;

  return false;
}

// ── Flora Spawning ───────────────────────────────────────────────────────────

/**
 * Determine which flora species can grow at a given position.
 */
export function getViableFlora(x, y) {
  const env = getEnvironment(x, y);
  return FLORA.filter((f) =>
    env.elevation >= f.elevation[0] &&
    env.elevation <= f.elevation[1] &&
    env.moisture <= f.moistureMax
  );
}

/**
 * Attempt to spawn flora at a position. Returns array of plant objects or empty.
 */
export function spawnFlora(x, y) {
  if (isExcludedZone(x, y)) return [];

  const viable = getViableFlora(x, y);
  const results = [];

  for (const f of viable) {
    // Use position-seeded random for determinism
    const roll = hashPosition(x, y, f.name.length * 7 + 13);
    if (roll >= f.density) continue;

    if (f.cluster) {
      const cluster = createCluster(f, x, y);
      results.push(...cluster);
    } else {
      results.push({
        type: 'plant',
        species: f.name,
        x,
        y,
        size: f.size || 'medium',
        color: f.color,
        heightOffset: f.heightOffset || 0,
      });
    }
    break; // One species per grid cell
  }

  return results;
}

/**
 * Create a natural cluster of plants around a center point.
 */
export function createCluster(floraDef, centerX, centerY) {
  const items = [];
  const count = floraDef.clusterCount || 3;
  const radius = floraDef.clusterRadius || 30;

  for (let i = 0; i < count; i++) {
    const angle = hashPosition(centerX + i, centerY, 99) * Math.PI * 2;
    const r = hashPosition(centerX, centerY + i, 77) * radius;
    const px = centerX + Math.cos(angle) * r;
    const py = centerY + Math.sin(angle) * r;

    if (isExcludedZone(px, py)) continue;

    items.push({
      type: 'plant',
      species: floraDef.name,
      x: px,
      y: py,
      size: floraDef.size || 'medium',
      color: floraDef.color,
      heightOffset: floraDef.heightOffset || 0,
    });
  }
  return items;
}

// ── Fauna Spawning ───────────────────────────────────────────────────────────

/**
 * Spawn fauna at a position based on environment, nearby plants, and time.
 *
 * @param {number} x
 * @param {number} y
 * @param {object[]} nearbyPlants - plants in the vicinity
 * @param {'day'|'night'} timeOfDay
 * @returns {object[]} array of animal spawn objects
 */
export function spawnFauna(x, y, nearbyPlants, timeOfDay = 'day') {
  if (isExcludedZone(x, y)) return [];

  const env = getEnvironment(x, y);
  const results = [];

  const eligible = FAUNA.filter((f) => {
    // Elevation check
    if (env.elevation < f.elevation[0] || env.elevation > f.elevation[1]) return false;
    // Activity check
    if (f.activity && f.activity !== timeOfDay) return false;
    // Plant dependency check
    if (f.requiresPlants) {
      const plantSpecies = nearbyPlants.map((p) => p.species);
      if (!f.requiresPlants.some((rp) => plantSpecies.includes(rp))) return false;
    }
    // Water need check
    if (f.waterNeed > 0.5 && env.moisture < 0.3) return false;
    return true;
  });

  // Compute ecology-boosted spawn probabilities
  const plantSpecies = nearbyPlants.map((p) => p.species);

  for (const f of eligible) {
    const roll = hashPosition(x + 1000, y + 1000, f.name.length * 11);
    let spawnThreshold = 0.15; // base probability

    // Boost spawn probability based on ecology links
    for (const sp of plantSpecies) {
      const link = PLANT_ECOLOGY[sp];
      if (link && link.supports?.includes(f.name)) {
        spawnThreshold += link.spawnBoost || 0.2;
      }
    }
    spawnThreshold = Math.min(0.8, spawnThreshold); // cap

    if (roll > spawnThreshold) continue;

    results.push({
      type: 'animal',
      species: f.name,
      x: x + (hashPosition(x, y, 200) - 0.5) * 40,
      y: y + (hashPosition(y, x, 201) - 0.5) * 40,
      color: f.color,
      emoji: f.emoji,
      speed: f.speed || 0,
      aerial: f.aerial || false,
    });
  }

  return results;
}

/**
 * Apply food chain logic using data-driven predator chains.
 * If prey exists, spawn predators nearby based on PREDATOR_CHAINS probabilities.
 */
export function applyFoodChain(animals, allPlants, timeOfDay = 'day') {
  const predators = [];
  const presentSpecies = new Set(animals.map((a) => a.species));
  const alreadySpawned = new Set();

  for (const chain of PREDATOR_CHAINS) {
    if (!presentSpecies.has(chain.prey)) continue;

    const predatorDef = FAUNA_MAP[chain.predator];
    if (!predatorDef) continue;
    if (predatorDef.activity && predatorDef.activity !== timeOfDay) continue;
    if (alreadySpawned.has(chain.predator)) continue; // one per species

    // Find a prey animal to spawn near
    const preyAnimal = animals.find((a) => a.species === chain.prey);
    if (!preyAnimal) continue;

    const roll = hashPosition(preyAnimal.x + 500, preyAnimal.y + 500, chain.predator.length * 13);
    if (roll > chain.probability) continue;

    const offsetX = (hashPosition(preyAnimal.x, preyAnimal.y, 300) - 0.5) * 150;
    const offsetY = (hashPosition(preyAnimal.y, preyAnimal.x, 301) - 0.5) * 150;

    predators.push({
      type: 'animal',
      species: chain.predator,
      x: preyAnimal.x + offsetX,
      y: preyAnimal.y + offsetY,
      color: predatorDef.color,
      emoji: predatorDef.emoji,
      speed: predatorDef.speed || 0,
      aerial: predatorDef.aerial || false,
    });
    alreadySpawned.add(chain.predator);
  }

  return predators;
}

// ── World Population ─────────────────────────────────────────────────────────

/**
 * Populate the entire world with flora and fauna.
 *
 * Samples the world on a grid and spawns entities procedurally.
 * Results are deterministic (seeded by position).
 *
 * @param {object} [options]
 * @param {number} [options.gridSize=60] - sampling grid cell size in pixels
 * @param {'day'|'night'} [options.timeOfDay='day']
 * @returns {{ plants: object[], animals: object[] }}
 */
export function populateWorld(options = {}) {
  const gridSize = options.gridSize || 60;
  const timeOfDay = options.timeOfDay || 'day';
  const plants = [];
  const animals = [];

  // Spawn flora on grid
  for (let gx = 0; gx < WORLD.width; gx += gridSize) {
    for (let gy = 0; gy < WORLD.height; gy += gridSize) {
      // Offset by half grid for more natural placement
      const ox = hashPosition(gx, gy, 50) * gridSize * 0.5;
      const oy = hashPosition(gy, gx, 51) * gridSize * 0.5;
      const spawned = spawnFlora(gx + ox, gy + oy);
      plants.push(...spawned);
    }
  }

  // Spawn fauna near plant clusters
  const faunaGridSize = gridSize * 3; // animals are sparser
  for (let gx = 0; gx < WORLD.width; gx += faunaGridSize) {
    for (let gy = 0; gy < WORLD.height; gy += faunaGridSize) {
      // Find nearby plants
      const nearby = plants.filter((p) =>
        Math.abs(p.x - gx) < faunaGridSize && Math.abs(p.y - gy) < faunaGridSize
      );
      const spawned = spawnFauna(gx, gy, nearby, timeOfDay);
      animals.push(...spawned);
    }
  }

  // Food chain: spawn predators near prey
  const predators = applyFoodChain(animals, plants, timeOfDay);
  animals.push(...predators);

  return { plants, animals };
}
