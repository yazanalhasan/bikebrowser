// Adapts the EXISTING game materials (src/game/data/act1/act1Materials.js) +
// their canonical colors (src/game/phaser/systems/materialVisuals.js) into the
// shape the UTM scene/panel/card consume. No mechanical values are invented here:
// UTS, elastic limit and fracture strain come straight from each material's
// `curve`; yield/modulus are derived from those existing fields.
//
// The game teaches on a relative 0–10 stress scale (not MPa), so the UTM presents
// those same units honestly rather than faking engineering numbers.
import { act1Materials } from '../../game/data/act1/act1Materials.js';
import { MATERIAL_VIS } from '../../game/phaser/systems/materialVisuals.js';

const hex = (int) => `#${(int >>> 0).toString(16).padStart(6, '0').slice(-6)}`;

// curveType + fixed presentation facts derived from each material's id.
const PROFILE = {
  balsa: { curveType: 'ductile_metal', category: 'Natural — Wood', patternAngle: 90 },
  pine: { curveType: 'ductile_metal', category: 'Natural — Wood', patternAngle: 90 },
  bamboo: { curveType: 'ductile_metal', category: 'Natural — Wood', patternAngle: 90 },
  brick: { curveType: 'brittle', category: 'Masonry — Ceramic', patternAngle: 0 },
  concrete: { curveType: 'brittle', category: 'Cementitious', patternAngle: 0 },
  iron: { curveType: 'ductile_metal', category: 'Metal — Ferrous', patternAngle: 45 },
  steel: { curveType: 'ductile_metal', category: 'Metal — Ferrous', patternAngle: 45 },
  carbon_fiber: { curveType: 'composite', category: 'Composite', patternAngle: 30 },
};

// Fraction of UTS reached at yield, by archetype. Ductile materials yield well
// below UTS; brittle/composite materials run almost linearly to failure.
const YIELD_FRACTION = { ductile_metal: 0.62, brittle: 0.95, composite: 0.9, polymer: 0.5 };
const TEST_DURATION = { ductile_metal: 4200, brittle: 2800, composite: 3500, polymer: 4600 };

function adapt(material) {
  const profile = PROFILE[material.id] || { curveType: 'ductile_metal', category: 'Material', patternAngle: 45 };
  const visual = MATERIAL_VIS[material.id] || MATERIAL_VIS._default;
  const { elasticLimit, ultimateStress, strainAtFailure } = material.curve;
  const yieldStrength = Number((ultimateStress * (YIELD_FRACTION[profile.curveType] ?? 0.6)).toFixed(2));
  // Elastic slope (the relative-units "Young's modulus" of the drawn curve).
  const modulusSlope = Number((yieldStrength / Math.max(elasticLimit, 1e-4)).toFixed(2));

  return {
    id: material.id,
    name: material.displayName || material.name,
    category: profile.category,
    color: hex(visual.base),
    detailColor: hex(visual.detail),
    pattern: visual.pattern,
    patternAngle: profile.patternAngle,
    curveType: profile.curveType,
    testDurationMs: TEST_DURATION[profile.curveType] ?? 4000,

    // Mechanical properties (game's relative 0–10 scale, sourced from `curve`).
    yieldStrength,
    UTS: ultimateStress,
    youngsModulus: material.stiffness, // 0–10 stiffness analog
    modulusSlope,
    elasticLimit, // strain at proportional limit
    fractureStrain: strainAtFailure,
    elongationAtBreak: Number((strainAtFailure * 100).toFixed(2)), // %
    density: material.density, // relative (weight/10)
    weight: material.weight,
    strength: material.strength,
    stiffness: material.stiffness,

    // Teaching text carried straight from the game data.
    failureMode: material.failureMode,
    notes: material.notes,
    bridgeUsefulness: material.bridgeUsefulness,
    description: material.childReadableDescription,
    bestUse: material.bestUse,
  };
}

export const UTM_MATERIALS = act1Materials.map(adapt);
export const UTM_MATERIALS_BY_ID = Object.fromEntries(UTM_MATERIALS.map((m) => [m.id, m]));
export const getUtmMaterialById = (id) => UTM_MATERIALS_BY_ID[id] || null;

// Stress is reported in the game's relative teaching units, not MPa.
export const STRESS_UNIT = 'u';
export const STRESS_UNIT_LONG = 'relative units';
