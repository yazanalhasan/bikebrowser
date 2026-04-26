/**
 * Material Database — UTM (Universal Testing Machine) sub-game data.
 *
 * Pure data module. No imports, no side effects. Wave 1 of the UTM build.
 *
 * References (gameplay values are simplified from these sources):
 *   - USDA Forest Products Laboratory Wood Handbook (2010, FPL-GTR-190) —
 *     wood mechanical properties parallel- and cross-grain, density,
 *     Young's modulus, ultimate tensile strength.
 *   - Engineering Toolbox (engineeringtoolbox.com) — Young's modulus and
 *     density for common copper and steel alloys.
 *   - ASTM A36 / A572 spec sheets — yield and ultimate ranges for
 *     structural steel.
 *
 * GAMEPLAY SIMPLIFICATIONS (flagged here once; per-entry comments call out
 * specific divergences):
 *   - Toughness, corrosionResistance, fatigueResistance, bridgeScoreBias are
 *     0–1 gameplay scalars, not unit-bearing physical quantities. They are
 *     hand-tuned proxies, not derived from area-under-curve integrals.
 *   - costPerUnit is in zuzubucks (in-game currency), not real-world dollars.
 *   - poissonRatio and grainDirectionMultiplier values are within plausible
 *     ranges but rounded for readability.
 *   - Wood is treated as having no clear yield point (yieldStrengthMPa: null).
 *     Real wood has a proportional limit ~70% of ultimate; the testing engine
 *     uses that approximation when computing the elastic→failure transition.
 *
 * Schema (per entry):
 * {
 *   id, name, category,
 *   densityKgM3, elasticModulusGPa,
 *   yieldStrengthMPa | null, ultimateStrengthMPa,
 *   fractureStrain, poissonRatio,
 *   toughness, costPerUnit, corrosionResistance, fatigueResistance,
 *   bridgeScoreBias, anisotropy,
 *   grainDirectionMultiplier?: { parallel, cross, laminated },
 *   failureMode, unlocks[], questTags[],
 *   visual: { color, grainColor?, finish }
 * }
 */

export const MATERIALS = {
  mesquite_wood: {
    id: 'mesquite_wood',
    name: 'Mesquite Wood',
    category: 'wood',
    // Density 750–900 kg/m³ per Wood Handbook; mesquite is dense for a hardwood.
    densityKgM3: 850,
    // Parallel-to-grain Young's modulus 9–13 GPa.
    elasticModulusGPa: 11,
    // Wood lacks a clean yield point — proportional limit ≈ 70% of ultimate.
    yieldStrengthMPa: null,
    // Parallel-to-grain ultimate tensile 80–120 MPa.
    ultimateStrengthMPa: 100,
    // Strain at fracture 0.01–0.025 parallel-to-grain.
    fractureStrain: 0.018,
    poissonRatio: 0.30,
    // Gameplay proxy — wood is moderate-toughness, lower than ductile metals.
    toughness: 0.45,
    costPerUnit: 12,
    // Rots in water but stable in dry desert; gameplay penalty in monsoon biome.
    corrosionResistance: 0.35,
    fatigueResistance: 0.40,
    // Favored for early-game lightweight bridges.
    bridgeScoreBias: 0.25,
    anisotropy: true,
    grainDirectionMultiplier: { parallel: 1.0, cross: 0.25, laminated: 1.25 },
    failureMode: 'splinter',
    unlocks: ['grain_direction_matters', 'laminated_desert_wood_beam', 'first_canyon_bridge'],
    questTags: ['materials', 'wood', 'desert', 'beginner'],
    visual: { color: '#8b5a2b', grainColor: '#5e3a18', finish: 'rough' },
  },

  structural_steel: {
    id: 'structural_steel',
    name: 'Structural Steel (A36-like)',
    category: 'metal',
    densityKgM3: 7850,
    elasticModulusGPa: 200,
    yieldStrengthMPa: 250,
    // Ultimate 400–550 MPa per A36; gameplay value 450 MPa.
    ultimateStrengthMPa: 450,
    // Engineering strain at fracture 0.18–0.25 for ductile mild steel.
    fractureStrain: 0.20,
    poissonRatio: 0.30,
    toughness: 0.85,
    costPerUnit: 60,
    // Rusts; gameplay penalty in damp/monsoon environments.
    corrosionResistance: 0.30,
    fatigueResistance: 0.75,
    // Overkill for small spans; ideal for late-game heavy bridges.
    bridgeScoreBias: 0.10,
    anisotropy: false,
    failureMode: 'ductile-necking',
    unlocks: ['industrial_truss', 'heat_treatment', 'suspension_bridge_cable'],
    questTags: ['materials', 'metal', 'industrial'],
    visual: { color: '#555a66', finish: 'metallic' },
  },

  copper: {
    id: 'copper',
    name: 'Copper (Annealed)',
    category: 'metal',
    densityKgM3: 8960,
    // Young's modulus 110–130 GPa.
    elasticModulusGPa: 120,
    // Annealed copper yields very low (70 MPa); cold-worked can hit 220+.
    yieldStrengthMPa: 70,
    // Ultimate 210–400 MPa; annealed value used for gameplay.
    ultimateStrengthMPa: 250,
    // Annealed copper is extremely ductile — 0.20–0.45 fracture strain.
    fractureStrain: 0.35,
    poissonRatio: 0.34,
    toughness: 0.70,
    costPerUnit: 45,
    // Forms patina but underlying metal is well-protected; high score.
    corrosionResistance: 0.85,
    fatigueResistance: 0.55,
    // Bad as a primary structural beam — soft and expensive per strength.
    bridgeScoreBias: -0.30,
    anisotropy: false,
    failureMode: 'ductile-stretch',
    unlocks: [
      'conductive_bridge_sensor',
      'strain_gauge',
      'electric_motor_workshop',
      'composite_health_monitoring',
    ],
    questTags: ['materials', 'metal', 'electrical'],
    visual: { color: '#c46c44', finish: 'metallic' },
  },
};

/** Stable id list — useful for UI iteration and quest filters. */
export const MATERIAL_IDS = Object.keys(MATERIALS);

/**
 * Lookup helper.
 * @param {string} id
 * @returns {object|null}
 */
export function getMaterial(id) {
  return MATERIALS[id] || null;
}
