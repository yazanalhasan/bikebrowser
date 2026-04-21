/**
 * Chemistry System — extraction and refinement of plant compounds.
 *
 * This is NOT recipe-based. Everything is property-driven:
 *   1. Extract: plant part → chemical with properties inherited from source
 *   2. Refine: chemical + method → improved properties (purity, stability, conductivity)
 *   3. Output feeds into batteryChemistry.js for component creation
 *
 * Properties flow and compound:
 *   plant.part.properties → extracted.properties → refined.properties
 *   Each step modifies the numeric property values based on the method used.
 */

import { PLANTS, COMPOUNDS, getPlant } from '../data/plantChemistry.js';

// ── Extraction ───────────────────────────────────────────────────────────────

/**
 * Extract chemicals from a plant part.
 *
 * Each compound present in the part becomes an extracted chemical
 * with properties derived from both the part AND the compound's
 * base properties.
 *
 * @param {string} plantId
 * @param {string} partKey - e.g. 'fiber', 'resin', 'wood', 'ash'
 * @param {number} [skillLevel=1] - player's chemistry skill (1–5)
 * @returns {{ chemicals: Chemical[], explanation: string } | null}
 */
export function extractChemicals(plantId, partKey, skillLevel = 1) {
  const plant = getPlant(plantId);
  if (!plant) return null;

  const part = plant.parts[partKey];
  if (!part) return null;

  const chemicals = [];
  const skillBonus = (skillLevel - 1) * 0.05; // 0–0.2 bonus

  for (const compoundId of part.chemistry) {
    const compound = COMPOUNDS[compoundId];
    if (!compound) continue;

    // Merge properties: part properties influence extraction quality
    const extractedProps = {};

    // Inherit compound base properties
    for (const [key, value] of Object.entries(compound.baseProperties)) {
      if (typeof value === 'number') {
        extractedProps[key] = value;
      } else {
        extractedProps[key] = value;
      }
    }

    // Part properties modify the extraction
    // Higher relevant part property → better extraction of that compound
    for (const [key, value] of Object.entries(part.properties)) {
      if (typeof value === 'number' && key in extractedProps) {
        // Blend: compound base × part influence
        extractedProps[key] = extractedProps[key] * 0.6 + value * 0.4;
      } else if (typeof value === 'number' && !(key in extractedProps)) {
        // Add part-specific properties at reduced strength
        extractedProps[key] = value * 0.3;
      }
    }

    // Purity depends on extraction skill
    const basePurity = 0.3 + skillBonus;
    extractedProps.purity = Math.min(1, basePurity + (part.properties.mineral_content || 0) * 0.1);

    // Stability starts low for raw extraction
    extractedProps.stability = 0.4 + skillBonus;

    chemicals.push({
      id: `${plantId}_${partKey}_${compoundId}`,
      compoundId,
      label: `${compound.label} (from ${part.label})`,
      type: categorizeChemical(compound, extractedProps),
      sourceId: plantId,
      sourcePart: partKey,
      properties: extractedProps,
      refined: false,
      refinementCount: 0,
    });
  }

  const explanation = chemicals.length > 0
    ? `Extracted ${chemicals.length} compound(s) from ${part.label}. ` +
      `Raw extracts have low purity (${Math.round(chemicals[0].properties.purity * 100)}%) — ` +
      `refine them to improve properties.`
    : `No extractable compounds found in ${part.label}.`;

  return { chemicals, explanation };
}

/**
 * Categorize a chemical by its primary role in the battery pipeline.
 */
function categorizeChemical(compound, properties) {
  if (properties.conductivity_potential > 0.3 || compound.category === 'ionic') {
    return 'electrolyte';
  }
  if (properties.carbonizable || (properties.carbon_content && properties.carbon_content > 0.5)) {
    return 'carbon';
  }
  if (properties.dielectric_strength > 0.4 || properties.hydrophobicity > 0.6) {
    return 'insulator';
  }
  if (properties.fiber_strength > 0.5) {
    return 'fiber';
  }
  if (properties.surfactant_strength > 0.4 || compound.category === 'surfactant') {
    return 'surfactant';
  }
  if (properties.viscosity > 0.5 || properties.adhesion > 0.4) {
    return 'binder';
  }
  return 'organic';
}

// ── Refinement ───────────────────────────────────────────────────────────────

/**
 * Refinement methods and their effects on properties.
 * Each method multiplies certain properties and has trade-offs.
 */
const REFINEMENT_METHODS = {
  heating: {
    id: 'heating',
    label: 'Heating',
    icon: '🔥',
    effects: {
      purity: 1.3,
      stability: 0.9,        // heat can degrade some compounds
      thermal_stability: 1.2,
      water_content: 0.1,    // drives off water
      viscosity: 0.8,
    },
    requirements: { factory: 'metal_shop' }, // needs kiln
    description: 'Apply heat to drive off impurities and water. Increases purity but can reduce stability.',
    explanation: 'Heating evaporates volatile impurities and water. The remaining compound is more concentrated but may decompose if overheated.',
  },
  filtering: {
    id: 'filtering',
    label: 'Filtering',
    icon: '🧪',
    effects: {
      purity: 1.4,
      stability: 1.1,
      conductivity_potential: 1.05,
      mineral_content: 0.7,  // removes some minerals
    },
    requirements: {},
    description: 'Filter through fiber mesh to remove particulates. Improves purity significantly.',
    explanation: 'Filtration physically separates particles by size. Smaller contaminants pass through, but dissolved compounds stay in solution.',
  },
  drying: {
    id: 'drying',
    label: 'Drying',
    icon: '☀️',
    effects: {
      purity: 1.2,
      stability: 1.2,
      water_content: 0.05,
      concentration: 1.5,    // concentrates active compounds
      conductivity_potential: 1.1,
    },
    requirements: {},
    description: 'Evaporate water to concentrate the active compounds.',
    explanation: 'Removing water concentrates the dissolved chemicals. For electrolytes, this increases ion density and conductivity.',
  },
  carbonizing: {
    id: 'carbonizing',
    label: 'Carbonizing (Pyrolysis)',
    icon: '⚫',
    effects: {
      carbon_content: 1.8,
      purity: 1.3,
      stability: 1.4,
      surface_area: 1.5,     // char creates porous surface
      fiber_strength: 0.3,   // destroys fiber structure
      water_content: 0,
    },
    requirements: { factory: 'metal_shop' }, // needs kiln
    applicableTo: ['carbon', 'fiber'],
    description: 'Heat without oxygen to convert organic matter into carbon. Creates electrode material.',
    explanation: 'Pyrolysis breaks down organic molecules, leaving behind a porous carbon structure. The pores create enormous surface area for storing charge — this is how electrodes work.',
  },
  dissolving: {
    id: 'dissolving',
    label: 'Dissolving',
    icon: '💧',
    effects: {
      solubility: 1.3,
      conductivity_potential: 1.3,
      viscosity: 0.7,
      stability: 0.95,
    },
    requirements: {},
    applicableTo: ['electrolyte', 'organic'],
    description: 'Dissolve in water to create an ionic solution.',
    explanation: 'When ionic compounds dissolve, they split into positive and negative ions. These free ions carry electrical charge through the solution — that\'s what makes an electrolyte conductive.',
  },
  combining: {
    id: 'combining',
    label: 'Combining',
    icon: '🔀',
    effects: {}, // dynamic — depends on what's combined
    requirements: { factory: 'battery_lab' },
    description: 'Mix two chemicals to create a composite with blended properties.',
    explanation: 'Combining chemicals can create synergies: a surfactant mixed with electrolyte helps it wet electrode surfaces better, improving contact and efficiency.',
  },
};

/**
 * Refine a chemical using a method.
 *
 * @param {object} chemical - extracted chemical object
 * @param {string} methodId - refinement method
 * @param {number} [skillLevel=1] - chemistry skill
 * @returns {{ chemical: object, explanation: string } | null}
 */
export function refineChemical(chemical, methodId, skillLevel = 1) {
  const method = REFINEMENT_METHODS[methodId];
  if (!method) return null;

  // Check if method is applicable to this chemical type
  if (method.applicableTo && !method.applicableTo.includes(chemical.type)) {
    return {
      chemical,
      explanation: `${method.label} cannot be applied to ${chemical.type} chemicals. Try a different method.`,
      success: false,
    };
  }

  const skillMult = 1 + (skillLevel - 1) * 0.05;
  const newProps = { ...chemical.properties };

  // Apply method effects to properties
  for (const [prop, multiplier] of Object.entries(method.effects)) {
    if (prop in newProps && typeof newProps[prop] === 'number') {
      newProps[prop] = Math.min(1, newProps[prop] * multiplier * skillMult);
    } else if (typeof multiplier === 'number' && multiplier !== 0) {
      // Add new properties that the method introduces
      newProps[prop] = Math.min(1, multiplier * 0.5 * skillMult);
    }
  }

  // Refinement diminishing returns
  const count = chemical.refinementCount + 1;
  const diminishing = 1 / (1 + count * 0.2);
  for (const key of Object.keys(newProps)) {
    if (typeof newProps[key] === 'number' && newProps[key] > chemical.properties[key]) {
      const gain = newProps[key] - chemical.properties[key];
      newProps[key] = chemical.properties[key] + gain * diminishing;
    }
  }

  // Cap all numeric properties at 0.95 (perfection is unreachable)
  for (const key of Object.keys(newProps)) {
    if (typeof newProps[key] === 'number') {
      newProps[key] = Math.min(0.95, Math.max(0, newProps[key]));
    }
  }

  const refined = {
    ...chemical,
    properties: newProps,
    refined: true,
    refinementCount: count,
    lastMethod: methodId,
    label: chemical.label.replace(/\(refined.*?\)/, '').trim() + ` (refined ×${count})`,
  };

  // Re-categorize after refinement (carbonizing changes type)
  if (methodId === 'carbonizing') {
    refined.type = 'carbon';
  }

  return {
    chemical: refined,
    explanation: method.explanation,
    success: true,
  };
}

/**
 * Combine two chemicals. Properties blend based on type synergies.
 *
 * @param {object} chemA
 * @param {object} chemB
 * @returns {{ chemical: object, explanation: string }}
 */
export function combineChemicals(chemA, chemB) {
  const combinedProps = {};

  // Blend all numeric properties (weighted average)
  const allKeys = new Set([
    ...Object.keys(chemA.properties),
    ...Object.keys(chemB.properties),
  ]);

  for (const key of allKeys) {
    const a = chemA.properties[key];
    const b = chemB.properties[key];
    if (typeof a === 'number' && typeof b === 'number') {
      // Synergy: complementary types boost each other
      const synergy = getSynergy(chemA.type, chemB.type, key);
      combinedProps[key] = Math.min(0.95, (a + b) / 2 * synergy);
    } else if (typeof a === 'number') {
      combinedProps[key] = a * 0.7;
    } else if (typeof b === 'number') {
      combinedProps[key] = b * 0.7;
    } else {
      combinedProps[key] = a ?? b;
    }
  }

  combinedProps.purity = Math.min(0.95,
    ((chemA.properties.purity || 0.5) + (chemB.properties.purity || 0.5)) / 2
  );
  combinedProps.stability = Math.min(0.95,
    ((chemA.properties.stability || 0.5) + (chemB.properties.stability || 0.5)) / 2
  );

  const combined = {
    id: `${chemA.id}+${chemB.id}`,
    compoundId: 'composite',
    label: `${chemA.label} + ${chemB.label}`,
    type: determineCombinedType(chemA.type, chemB.type),
    sourceId: 'combined',
    sourcePart: 'composite',
    properties: combinedProps,
    refined: true,
    refinementCount: Math.max(chemA.refinementCount, chemB.refinementCount),
    components: [chemA.id, chemB.id],
  };

  const explanation = `Combined ${chemA.type} with ${chemB.type}. ` +
    getSynergyExplanation(chemA.type, chemB.type);

  return { chemical: combined, explanation };
}

// ── Synergy Logic ────────────────────────────────────────────────────────────

/**
 * Synergy multiplier when combining two chemical types.
 * Certain pairings boost specific properties.
 */
function getSynergy(typeA, typeB, property) {
  const pair = [typeA, typeB].sort().join('+');

  const synergies = {
    'electrolyte+surfactant': {
      conductivity_potential: 1.3,  // surfactant helps electrolyte wet surfaces
      wetting_ability: 1.4,
    },
    'carbon+electrolyte': {
      surface_area: 1.2,           // electrolyte fills carbon pores
      conductivity_potential: 1.1,
    },
    'binder+fiber': {
      fiber_strength: 1.3,        // binder reinforces fiber
      stability: 1.2,
    },
    'insulator+fiber': {
      dielectric_strength: 1.2,   // fiber scaffold + insulation
      porosity: 1.15,
    },
  };

  return synergies[pair]?.[property] || 1.0;
}

function getSynergyExplanation(typeA, typeB) {
  const pair = [typeA, typeB].sort().join('+');
  const explanations = {
    'electrolyte+surfactant': 'Surfactant reduces surface tension, helping the electrolyte penetrate porous electrode surfaces for better contact.',
    'carbon+electrolyte': 'Electrolyte fills the carbon pores, creating maximum contact area for charge storage.',
    'binder+fiber': 'The binder glues fibers together, creating a stronger structural material.',
    'insulator+fiber': 'Fiber provides a scaffold while insulating material fills gaps, creating an effective separator.',
  };
  return explanations[pair] || 'Properties blended from both sources.';
}

function determineCombinedType(typeA, typeB) {
  if (typeA === 'electrolyte' || typeB === 'electrolyte') return 'electrolyte';
  if (typeA === 'carbon' || typeB === 'carbon') return 'carbon';
  if (typeA === 'insulator' || typeB === 'insulator') return 'insulator';
  return 'composite';
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Get all available refinement methods. */
export function getRefinementMethods() {
  return Object.values(REFINEMENT_METHODS);
}

/** Get methods applicable to a chemical type. */
export function getApplicableMethods(chemicalType) {
  return Object.values(REFINEMENT_METHODS).filter((m) =>
    !m.applicableTo || m.applicableTo.includes(chemicalType)
  );
}

/** Get the refinement method definition. */
export function getRefinementMethod(methodId) {
  return REFINEMENT_METHODS[methodId] || null;
}

/**
 * Compute a quality score for a chemical based on its intended use.
 */
export function computeChemicalQuality(chemical, intendedUse) {
  const p = chemical.properties;
  switch (intendedUse) {
    case 'electrode':
      return avg(p.carbon_content, p.surface_area, p.purity, p.stability);
    case 'electrolyte':
      return avg(p.conductivity_potential, p.stability, p.purity, p.solubility);
    case 'separator':
      return avg(p.dielectric_strength, p.porosity, p.fiber_strength, p.stability);
    case 'insulation':
      return avg(p.dielectric_strength, p.hydrophobicity, p.thermal_stability);
    default:
      return avg(p.purity, p.stability);
  }
}

function avg(...values) {
  const nums = values.filter((v) => typeof v === 'number');
  if (nums.length === 0) return 0;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}
