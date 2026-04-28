/**
 * speciesResolver — read-only accessors over `data/flora.js`,
 * `data/fauna.js`, and `data/ecology.js`.
 *
 * Per ecology-substrate.md §2, the substrate consumes — never
 * redesigns — the data tables. This module is the single point of
 * data access for the rest of the substrate, which means consumer
 * code never imports the data files directly. That keeps the data
 * surface stable: if a future cycle reorganizes the tables,
 * everything downstream remains the same.
 *
 * Functions exported here mirror the substrate spec §2 contracts:
 *   §2.1 FLORA  — getFloraSpecies, listFloraSpeciesByBiome,
 *                 isFloraSpecies
 *   §2.2 FAUNA  — getFaunaSpecies, listFaunaSpeciesByTime,
 *                 listFaunaSpeciesRequiring, isFaunaSpecies
 *   §2.3 PLANT_ECOLOGY — getPlantEcology, getRelationTags,
 *                 (delegates: getLinkedAnimals)
 *   §2.4 PREDATOR_CHAINS — listChainEdges
 *                 (delegates: getPredators, getPreyFor)
 *   §2.5 BIOMES — getBiomeAt, getBiomeById, listBiomes
 *   §2.6 TIME_BEHAVIOR — getTimeBehavior, isAnimalActiveAt,
 *                 listActiveAnimals
 *
 * All functions are PURE: no caching, no side effects, no I/O. The
 * underlying data is itself frozen-by-convention; if a consumer needs
 * a defensive copy, copy at the call site.
 */

import { FLORA, FLORA_MAP } from '../../data/flora.js';
import { FAUNA, FAUNA_MAP } from '../../data/fauna.js';
import {
  PLANT_ECOLOGY,
  PREDATOR_CHAINS,
  TIME_BEHAVIOR,
  BIOMES,
  getBiome,
  getLinkedAnimals,
  getPredators,
  getPreyFor,
} from '../../data/ecology.js';

// Re-export the three delegated helpers verbatim so consumers have ONE
// import surface (`speciesResolver`) for every species-data question.
export { getLinkedAnimals, getPredators, getPreyFor };

// ── §2.1 FLORA ──────────────────────────────────────────────────────

/**
 * Get a flora species record by id, or null if it is not in FLORA.
 *
 * @param {string} speciesId
 * @returns {object|null}
 */
export function getFloraSpecies(speciesId) {
  if (typeof speciesId !== 'string') return null;
  return FLORA_MAP[speciesId] ?? null;
}

/**
 * List flora species ids whose `PLANT_ECOLOGY[id].biome` matches the
 * given biome id. Falls back to `BIOMES[biomeId].dominantPlants` when
 * a flora entry has no PLANT_ECOLOGY row.
 *
 * @param {string} biomeId
 * @returns {string[]}
 */
export function listFloraSpeciesByBiome(biomeId) {
  if (typeof biomeId !== 'string') return [];
  const fromEcology = Object.entries(PLANT_ECOLOGY)
    .filter(([, def]) => def.biome === biomeId)
    .map(([id]) => id);
  // Augment with BIOMES.dominantPlants for any species not already
  // covered (they may not have a PLANT_ECOLOGY row).
  const dominants = BIOMES[biomeId]?.dominantPlants ?? [];
  const set = new Set(fromEcology);
  for (const d of dominants) {
    if (FLORA_MAP[d]) set.add(d);
  }
  return Array.from(set);
}

/**
 * @param {string} speciesId
 * @returns {boolean}
 */
export function isFloraSpecies(speciesId) {
  return typeof speciesId === 'string' && Object.prototype.hasOwnProperty.call(FLORA_MAP, speciesId);
}

// ── §2.2 FAUNA ──────────────────────────────────────────────────────

/**
 * Get a fauna species record by id, or null.
 *
 * @param {string} speciesId
 * @returns {object|null}
 */
export function getFaunaSpecies(speciesId) {
  if (typeof speciesId !== 'string') return null;
  return FAUNA_MAP[speciesId] ?? null;
}

/**
 * @param {string} speciesId
 * @returns {boolean}
 */
export function isFaunaSpecies(speciesId) {
  return typeof speciesId === 'string' && Object.prototype.hasOwnProperty.call(FAUNA_MAP, speciesId);
}

/**
 * Animals active at a given time of day, per `TIME_BEHAVIOR`. Returns
 * `[]` for unknown time keys.
 *
 * @param {'day'|'night'|'dawn'|'dusk'} timeOfDay
 * @returns {string[]}
 */
export function listFaunaSpeciesByTime(timeOfDay) {
  const slot = TIME_BEHAVIOR?.[timeOfDay];
  if (!slot || !Array.isArray(slot.activeAnimals)) return [];
  return [...slot.activeAnimals];
}

/**
 * Reverse lookup: which fauna list `plantSpeciesId` in their
 * `requiresPlants` array.
 *
 * @param {string} plantSpeciesId
 * @returns {string[]}
 */
export function listFaunaSpeciesRequiring(plantSpeciesId) {
  if (typeof plantSpeciesId !== 'string') return [];
  return FAUNA
    .filter((f) => Array.isArray(f.requiresPlants) && f.requiresPlants.includes(plantSpeciesId))
    .map((f) => f.name);
}

// ── §2.3 PLANT_ECOLOGY ──────────────────────────────────────────────

/**
 * Per-plant ecological metadata (supports/predatorsNearby/biome/etc.).
 *
 * @param {string} speciesId
 * @returns {object|null}
 */
export function getPlantEcology(speciesId) {
  if (typeof speciesId !== 'string') return null;
  return PLANT_ECOLOGY[speciesId] ?? null;
}

/**
 * Compose the substrate's `relationTags` strings for a given species.
 *
 * Tag prefixes (per substrate §5):
 *   `supports:<animal>`        — flora's `PLANT_ECOLOGY.supports`
 *   `predatorsNearby:<animal>` — flora's `PLANT_ECOLOGY.predatorsNearby`
 *   `pollinators:<group>`      — flora's `PLANT_ECOLOGY.pollinators`
 *   `feature:<flag>`           — flora boolean feature flags
 *                                (producesFood / providesNesting / ...)
 *   `biome:<id>`               — biome of the species (flora) or any
 *                                biome where it is active (fauna)
 *   `eats:<species>`           — fauna prey list (from PREDATOR_CHAINS)
 *   `eatenBy:<species>`        — flora supports + fauna predators
 *   `activity:<time>`          — fauna activity flag
 *   `requiresPlants:<plant>`   — fauna's required-plant deps
 *
 * Returns `[]` for unknown species.
 *
 * @param {string} speciesId
 * @returns {string[]}
 */
export function getRelationTags(speciesId) {
  if (typeof speciesId !== 'string') return [];
  /** @type {Set<string>} */
  const tags = new Set();

  // Flora-derived tags
  const plant = PLANT_ECOLOGY[speciesId];
  if (plant) {
    for (const a of plant.supports || []) tags.add(`supports:${a}`);
    for (const p of plant.predatorsNearby || []) tags.add(`predatorsNearby:${p}`);
    for (const g of plant.pollinators || []) tags.add(`pollinators:${g}`);
    if (plant.biome) tags.add(`biome:${plant.biome}`);
    // Feature flags — booleans on the PLANT_ECOLOGY record
    for (const [k, v] of Object.entries(plant)) {
      if (typeof v === 'boolean' && v) tags.add(`feature:${k}`);
    }
  }

  // Fauna-derived tags
  const animal = FAUNA_MAP[speciesId];
  if (animal) {
    if (animal.activity) tags.add(`activity:${animal.activity}`);
    for (const plant of animal.requiresPlants || []) tags.add(`requiresPlants:${plant}`);
    for (const prey of animal.diet || []) tags.add(`eats:${prey}`);
    if (animal.isPredator) tags.add('feature:predator');
    if (animal.isPrey) tags.add('feature:prey');
    if (animal.aerial) tags.add('feature:aerial');
    // PREDATOR_CHAINS: who eats this fauna?
    for (const edge of getPredators(speciesId)) tags.add(`eatenBy:${edge.species}`);
    // ...and who does it eat (additional to FAUNA.diet)?
    for (const edge of getPreyFor(speciesId)) tags.add(`eats:${edge.species}`);
  }

  return Array.from(tags);
}

// ── §2.4 PREDATOR_CHAINS ────────────────────────────────────────────

/**
 * Read-only clone of `PREDATOR_CHAINS`.
 *
 * @returns {{prey: string, predator: string, probability: number}[]}
 */
export function listChainEdges() {
  return PREDATOR_CHAINS.map((edge) => ({ ...edge }));
}

// ── §2.5 BIOMES ─────────────────────────────────────────────────────

/**
 * Resolve a biome from elevation + moisture. Delegates to the
 * `data/ecology.js` helper.
 *
 * @param {number} elevation
 * @param {number} moisture
 * @returns {{id: string} & object}
 */
export function getBiomeAt(elevation, moisture) {
  return getBiome(elevation, moisture);
}

/**
 * @param {string} biomeId
 * @returns {(object & {id: string}) | null}
 */
export function getBiomeById(biomeId) {
  if (typeof biomeId !== 'string') return null;
  const def = BIOMES[biomeId];
  if (!def) return null;
  return { id: biomeId, ...def };
}

/**
 * @returns {string[]}
 */
export function listBiomes() {
  return Object.keys(BIOMES);
}

// ── §2.6 TIME_BEHAVIOR ──────────────────────────────────────────────

/**
 * @param {'day'|'night'|'dawn'|'dusk'} timeOfDay
 * @returns {object|null}
 */
export function getTimeBehavior(timeOfDay) {
  return TIME_BEHAVIOR?.[timeOfDay] ?? null;
}

/**
 * @param {string} speciesId
 * @param {'day'|'night'|'dawn'|'dusk'} timeOfDay
 * @returns {boolean}
 */
export function isAnimalActiveAt(speciesId, timeOfDay) {
  const list = listFaunaSpeciesByTime(timeOfDay);
  return list.includes(speciesId);
}

/**
 * Alias for `listFaunaSpeciesByTime` — provided to match the substrate
 * spec naming.
 *
 * @param {'day'|'night'|'dawn'|'dusk'} timeOfDay
 * @returns {string[]}
 */
export function listActiveAnimals(timeOfDay) {
  return listFaunaSpeciesByTime(timeOfDay);
}

// ── Cross-cutting type resolver ─────────────────────────────────────

/**
 * Resolve a species id to its EcologyEntity `type`. Returns null if
 * the id is unknown; the registration layer treats that as the
 * halt-and-surface case in dev (or warn-and-skip in prod).
 *
 * @param {string} speciesId
 * @returns {'flora'|'fauna'|'microbe'|null}
 */
export function resolveSpeciesType(speciesId) {
  if (isFloraSpecies(speciesId)) return 'flora';
  if (isFaunaSpecies(speciesId)) return 'fauna';
  return null; // 'microbe' is reserved for biology-substrate registrations.
}
