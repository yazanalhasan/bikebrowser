/**
 * Composite Engine — synthesize composite material descriptors from a
 * matrix + reinforcement pair using the rule of mixtures (Voigt model
 * for stiffness, with Krenchel-style orientation factors).
 *
 * References:
 *   - Krenchel, H. (1964) "Fibre Reinforcement" — orientation efficiency
 *     factors for unidirectional, woven, and random fiber arrangements.
 *   - Engineering Toolbox / standard composites texts — rule-of-mixtures
 *     formulae for stiffness and strength.
 *   - USDA Forest Products Lab Wood Handbook — laminated wood beam
 *     stiffness multipliers.
 *
 * GAMEPLAY SIMPLIFICATIONS:
 *   - Voigt rule-of-mixtures used for stiffness (over-estimates for
 *     transverse loading; the Reuss bound would be more accurate). We
 *     compensate with orientation factors below.
 *   - Strength uses the same rule-of-mixtures form as stiffness (real
 *     composite strength is governed by the weaker phase failing first;
 *     tuned constant included to keep gameplay numbers reasonable).
 *   - Density is a true volume-fraction blend (this part is physically
 *     correct).
 *   - Pending presets are returned with `pending: true` and a `todo:`
 *     string explaining the missing matrix.
 *
 * Pure module — no I/O, no global state, no mutation of materialDatabase.
 */

import { getMaterial } from './materialDatabase.js';

/**
 * Orientation efficiency factors for stiffness/strength contribution
 * from the reinforcement phase.
 *   unidirectional: 1.0 along fibers, 0.20 transverse — only the parallel
 *                   value is used here since the consumer chooses direction.
 *   woven:          0.65 balanced both directions.
 *   random:         0.40 (3D random fiber Krenchel approximation).
 */
const ORIENTATION_FACTOR = {
  unidirectional: 1.0,
  woven: 0.65,
  random: 0.40,
};

/**
 * Estimate composite properties using rule of mixtures.
 *   E_c = (eta * Vf * E_fiber) + ((1 - Vf) * E_matrix)
 *   sigma_c follows the same form (gameplay simplification).
 *   rho_c is a true volume-fraction blend.
 *
 * Other gameplay scalars (toughness, corrosion, fatigue) are blended by
 * volume fraction since there is no good closed-form rule of mixtures
 * for those proxies.
 *
 * @param {object} composite - descriptor from createComposite (or an
 *   inline equivalent). Must include matrixMaterialId, reinforcementMaterialId,
 *   reinforcementFraction, orientation.
 * @returns {object|null} synthetic material descriptor (same shape as
 *   materialDatabase entries) or null if either material is missing.
 */
export function estimateCompositeProperties(composite) {
  if (!composite) return null;
  if (composite.pending) return composite; // pass through unchanged

  const matrix = getMaterial(composite.matrixMaterialId);
  const fiber = getMaterial(composite.reinforcementMaterialId);
  if (!matrix || !fiber) return null;

  const Vf = Math.max(0, Math.min(1, composite.reinforcementFraction ?? 0));
  const Vm = 1 - Vf;
  const eta = ORIENTATION_FACTOR[composite.orientation] ?? ORIENTATION_FACTOR.random;

  // Special case: laminated wood (matrix === fiber). Use the matrix's
  // grainDirectionMultiplier.laminated factor instead of a fiber blend.
  let E_GPa, ultimateMPa;
  if (
    matrix.id === fiber.id &&
    matrix.anisotropy &&
    matrix.grainDirectionMultiplier?.laminated
  ) {
    const k = matrix.grainDirectionMultiplier.laminated;
    E_GPa = matrix.elasticModulusGPa * k;
    ultimateMPa = matrix.ultimateStrengthMPa * k;
  } else {
    E_GPa = eta * Vf * fiber.elasticModulusGPa + Vm * matrix.elasticModulusGPa;
    ultimateMPa = eta * Vf * fiber.ultimateStrengthMPa + Vm * matrix.ultimateStrengthMPa;
  }

  const densityKgM3 = Vf * fiber.densityKgM3 + Vm * matrix.densityKgM3;

  // Yield: if matrix has a yield, blend; otherwise null (wood-dominated
  // composites still lack a clean yield).
  let yieldStrengthMPa = null;
  if (matrix.yieldStrengthMPa != null && fiber.yieldStrengthMPa != null) {
    yieldStrengthMPa =
      eta * Vf * fiber.yieldStrengthMPa + Vm * matrix.yieldStrengthMPa;
  } else if (matrix.yieldStrengthMPa != null) {
    yieldStrengthMPa = Vm * matrix.yieldStrengthMPa;
  }

  // Volume-fraction blend of gameplay scalars.
  const blend = (a, b) => Vm * a + Vf * b;
  const fractureStrain = blend(matrix.fractureStrain, fiber.fractureStrain);
  const poissonRatio = blend(matrix.poissonRatio, fiber.poissonRatio);
  const toughness = blend(matrix.toughness, fiber.toughness);
  const corrosionResistance = blend(matrix.corrosionResistance, fiber.corrosionResistance);
  const fatigueResistance = blend(matrix.fatigueResistance, fiber.fatigueResistance);
  const bridgeScoreBias = blend(matrix.bridgeScoreBias, fiber.bridgeScoreBias);
  const costPerUnit = Vm * matrix.costPerUnit + Vf * fiber.costPerUnit * 1.10;
  // Slight 10% surcharge on the fiber's cost models the manufacturing premium.

  return {
    id: composite.id || `${matrix.id}__${fiber.id}__${composite.orientation}`,
    name:
      composite.name ||
      `${matrix.name} reinforced with ${fiber.name} (${composite.orientation})`,
    category: 'composite',
    densityKgM3,
    elasticModulusGPa: E_GPa,
    yieldStrengthMPa,
    ultimateStrengthMPa: ultimateMPa,
    fractureStrain,
    poissonRatio,
    toughness,
    costPerUnit,
    corrosionResistance,
    fatigueResistance,
    bridgeScoreBias,
    anisotropy: composite.orientation === 'unidirectional',
    failureMode: matrix.failureMode, // dominant phase usually controls failure mode
    unlocks: [...new Set([...(matrix.unlocks || []), ...(fiber.unlocks || [])])],
    questTags: [
      ...new Set(['composite', ...(matrix.questTags || []), ...(fiber.questTags || [])]),
    ],
    visual: {
      color: matrix.visual?.color || '#888888',
      finish: matrix.visual?.finish || 'matte',
    },
    // Composite-specific provenance, useful for the UTM scene to surface.
    composite: {
      matrixMaterialId: matrix.id,
      reinforcementMaterialId: fiber.id,
      reinforcementFraction: Vf,
      orientation: composite.orientation,
      orientationFactor: eta,
    },
  };
}

/**
 * Create a composite descriptor from a config. If matrix or reinforcement
 * is missing from the database, returns a pending stub instead of failing.
 */
export function createComposite(config) {
  const {
    id,
    name,
    matrixMaterialId,
    reinforcementMaterialId,
    reinforcementFraction = 0.10,
    orientation = 'woven',
    todo,
  } = config || {};

  // Pending stub — used when a referenced material doesn't exist yet
  // (e.g. polymer matrices added in a later wave).
  if (!matrixMaterialId || !reinforcementMaterialId) {
    return {
      id: id || 'pending_composite',
      name: name || 'Pending Composite',
      pending: true,
      todo:
        todo ||
        'Matrix or reinforcement material not yet defined in materialDatabase. Add the missing material in a future wave and re-run estimateCompositeProperties.',
      matrixMaterialId: matrixMaterialId || null,
      reinforcementMaterialId: reinforcementMaterialId || null,
      reinforcementFraction,
      orientation,
    };
  }

  const seed = {
    id,
    name,
    matrixMaterialId,
    reinforcementMaterialId,
    reinforcementFraction,
    orientation,
  };
  return estimateCompositeProperties(seed);
}

/**
 * Composite presets used by the UTM and quest content. TBD entries are
 * marked pending so the UTM scene can render them as locked / future
 * unlocks without crashing.
 */
export const COMPOSITE_PRESETS = {
  laminated_mesquite: createComposite({
    id: 'laminated_mesquite',
    name: 'Laminated Mesquite Beam',
    matrixMaterialId: 'mesquite_wood',
    reinforcementMaterialId: 'mesquite_wood',
    reinforcementFraction: 0.50, // symmetric stack, blend halfway
    orientation: 'unidirectional',
  }),
  copper_wire_reinforced_wood: createComposite({
    id: 'copper_wire_reinforced_wood',
    name: 'Copper-Wire Reinforced Mesquite',
    matrixMaterialId: 'mesquite_wood',
    reinforcementMaterialId: 'copper',
    reinforcementFraction: 0.10,
    orientation: 'woven',
  }),
  carbon_fiber_polymer: createComposite({
    id: 'carbon_fiber_polymer',
    name: 'Carbon Fiber Polymer (CFRP)',
    matrixMaterialId: null,
    reinforcementMaterialId: null,
    reinforcementFraction: 0.60,
    orientation: 'unidirectional',
    todo:
      'Add an epoxy/polymer matrix material and a carbon-fiber reinforcement material in a future materials wave, then wire ids here.',
  }),
  glass_fiber_polymer: createComposite({
    id: 'glass_fiber_polymer',
    name: 'Glass Fiber Polymer (GFRP)',
    matrixMaterialId: null,
    reinforcementMaterialId: null,
    reinforcementFraction: 0.50,
    orientation: 'woven',
    todo:
      'Add a polymer matrix material and a glass-fiber reinforcement material in a future materials wave, then wire ids here.',
  }),
  steel_cable_reinforced_composite: createComposite({
    id: 'steel_cable_reinforced_composite',
    name: 'Steel Cable Reinforced Composite',
    matrixMaterialId: 'mesquite_wood',
    reinforcementMaterialId: 'structural_steel',
    reinforcementFraction: 0.05,
    orientation: 'woven',
  }),
};
