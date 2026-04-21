/**
 * Knowledge System — tracks unlocked STEM concepts.
 *
 * Concepts unlock through quest completion, build milestones,
 * and factory achievements. Once unlocked, they:
 *   - Appear in the player's knowledge journal
 *   - Provide explanations during simulation errors
 *   - Gate access to advanced builds
 *   - Cascade-unlock dependent concepts
 *
 * Pure functions operating on a knowledge state array.
 */

import { KNOWLEDGE_CONCEPTS, getConceptsForEvent } from '../data/knowledgeConcepts.js';

// ── State Operations ─────────────────────────────────────────────────────────

/**
 * Default knowledge state.
 */
export function defaultKnowledge() {
  return {
    unlocked: [],       // concept IDs
    discoveries: [],    // { conceptId, unlockedAt, source }
  };
}

/**
 * Unlock a concept. Returns updated knowledge state.
 * Also cascade-unlocks concepts that depend on this one being a prerequisite.
 *
 * @param {object} knowledge - current knowledge state
 * @param {string} conceptId
 * @param {string} source - what triggered the unlock (quest name, build name, etc.)
 * @returns {{ knowledge: object, newUnlocks: string[] }}
 */
export function unlockConcept(knowledge, conceptId, source = 'unknown') {
  if (knowledge.unlocked.includes(conceptId)) {
    return { knowledge, newUnlocks: [] };
  }

  const concept = KNOWLEDGE_CONCEPTS[conceptId];
  if (!concept) return { knowledge, newUnlocks: [] };

  const newUnlocks = [conceptId];
  let updated = {
    unlocked: [...knowledge.unlocked, conceptId],
    discoveries: [
      ...knowledge.discoveries,
      { conceptId, unlockedAt: Date.now(), source },
    ],
  };

  // Cascade: check if this unlock enables other concepts
  const cascaded = getConceptsForEvent('concept', conceptId);
  for (const cascadeConcept of cascaded) {
    if (updated.unlocked.includes(cascadeConcept.id)) continue;
    // Check if ALL prerequisites are met
    const allPrereqsMet = checkPrerequisites(updated, cascadeConcept.id);
    if (allPrereqsMet) {
      const result = unlockConcept(updated, cascadeConcept.id, `cascade:${conceptId}`);
      updated = result.knowledge;
      newUnlocks.push(...result.newUnlocks);
    }
  }

  return { knowledge: updated, newUnlocks };
}

/**
 * Process a game event and unlock any matching concepts.
 *
 * @param {object} knowledge
 * @param {string} eventType - 'quest' | 'build' | 'factory' | 'concept'
 * @param {string} eventId - specific quest/build/factory id
 * @returns {{ knowledge: object, newUnlocks: string[] }}
 */
export function processEvent(knowledge, eventType, eventId) {
  const matching = getConceptsForEvent(eventType, eventId);
  let updated = knowledge;
  const allNewUnlocks = [];

  for (const concept of matching) {
    if (updated.unlocked.includes(concept.id)) continue;
    const result = unlockConcept(updated, concept.id, `${eventType}:${eventId}`);
    updated = result.knowledge;
    allNewUnlocks.push(...result.newUnlocks);
  }

  return { knowledge: updated, newUnlocks: allNewUnlocks };
}

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Check if a concept is unlocked.
 */
export function isConceptUnlocked(knowledge, conceptId) {
  return knowledge.unlocked.includes(conceptId);
}

/**
 * Check if all prerequisites for a concept are met.
 */
export function checkPrerequisites(knowledge, conceptId) {
  const concept = KNOWLEDGE_CONCEPTS[conceptId];
  if (!concept) return false;

  const by = concept.unlockedBy;
  if (!by) return true;

  // Check concept prerequisites
  if (by.concept && !knowledge.unlocked.includes(by.concept)) return false;
  if (by.concept2 && !knowledge.unlocked.includes(by.concept2)) return false;

  return true;
}

/**
 * Get all unlocked concepts with full metadata.
 */
export function getUnlockedConcepts(knowledge) {
  return knowledge.unlocked
    .map((id) => KNOWLEDGE_CONCEPTS[id])
    .filter(Boolean);
}

/**
 * Get concepts that are close to being unlocked (have some prereqs met).
 */
export function getDiscoverableConcepts(knowledge) {
  return Object.values(KNOWLEDGE_CONCEPTS)
    .filter((c) => !knowledge.unlocked.includes(c.id))
    .map((c) => ({
      ...c,
      prerequisitesMet: checkPrerequisites(knowledge, c.id),
    }));
}

/**
 * Get the explanation for a simulation error code, if the player has
 * the relevant concept unlocked.
 */
export function getErrorExplanation(knowledge, errorCode) {
  // Map error codes to relevant concepts
  const codeToConceptMap = {
    flat_tire: 'tire_pressure',
    low_pressure: 'tire_pressure',
    loose_chain: 'torque',
    no_brakes: 'friction',
    voltage_mismatch_controller: 'voltage',
    voltage_mismatch_motor: 'voltage',
    overvoltage: 'voltage',
    no_cells: 'series_parallel',
    insufficient_cells: 'series_parallel',
    no_bms: 'battery_design',
    current_overload_risk: 'current',
    no_motor: 'power_system',
    no_controller: 'power_system',
    // Chemistry error codes
    no_electrode: 'carbonization',
    no_electrolyte: 'electrolyte_function',
    no_separator: 'insulation_dielectric',
    critically_low_conductivity: 'conductivity',
    low_conductivity: 'conductivity',
    unstable_electrolyte: 'electrolyte_function',
    electrolyte_degradation_risk: 'refinement',
    short_circuit_risk: 'insulation_dielectric',
    weak_insulation: 'insulation_dielectric',
    low_electrode_surface: 'electrode_surface_area',
    chemistry_overheating: 'insulation_dielectric',
    // Biology error codes
    no_organism: 'organism_engineering',
    contamination_critical: 'bio_factory_scaling',
    contamination_risk: 'bio_factory_scaling',
    genome_collapse: 'genetic_modification',
    genome_drift: 'genetic_modification',
    expression_failure: 'gene_expression',
    low_expression: 'gene_expression',
    runaway_mutation: 'genetic_modification',
    elevated_mutation: 'genetic_modification',
    slow_growth: 'organism_engineering',
    // Material science error codes
    material_fracture: 'stress_strain',
    material_deformation: 'stress_strain',
    material_fatigue: 'fatigue_failure',
    material_thermal_failure: 'thermal_expansion',
    differential_expansion: 'thermal_expansion',
    heavy_at_speed: 'material_selection',
    rigid_long_ride: 'material_selection',
    hard_tires: 'material_selection',
    // Unified material science error codes
    sinks: 'buoyancy',
    capsize: 'buoyancy',
    tilt_warning: 'buoyancy',
    no_hull: 'buoyancy',
    no_waterproofing: 'protective_coatings',
    surfactant_spill: 'surfactants_interfaces',
    coating_warning: 'protective_coatings',
  };

  const conceptId = codeToConceptMap[errorCode];
  if (!conceptId) return null;
  if (!isConceptUnlocked(knowledge, conceptId)) return null;

  const concept = KNOWLEDGE_CONCEPTS[conceptId];
  return {
    conceptId,
    label: concept.label,
    explanation: concept.explanation,
    icon: concept.icon,
  };
}

/**
 * Get knowledge progress summary.
 */
export function getKnowledgeProgress(knowledge) {
  const total = Object.keys(KNOWLEDGE_CONCEPTS).length;
  const unlocked = knowledge.unlocked.length;
  const categories = {};

  for (const concept of Object.values(KNOWLEDGE_CONCEPTS)) {
    const cat = concept.category;
    if (!categories[cat]) categories[cat] = { total: 0, unlocked: 0 };
    categories[cat].total++;
    if (knowledge.unlocked.includes(concept.id)) categories[cat].unlocked++;
  }

  return {
    total,
    unlocked,
    percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    categories,
  };
}
