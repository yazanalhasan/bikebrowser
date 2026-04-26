/**
 * Thermal Rig Database — pure data for the Thermal Expansion Lab.
 *
 * Pure data module. No imports, no side effects. Mirrors the shape of
 * materialDatabase.js so the same Lab Rig pattern works.
 *
 * References (gameplay values are simplified from these sources):
 *   - Engineering Toolbox — coefficients of linear thermal expansion for
 *     common metals (engineeringtoolbox.com / Thermal Expansion of Solids).
 *   - NIST thermal expansion tables — reference values cross-checked.
 *   - CRC Handbook of Chemistry and Physics — melting point ranges.
 *
 * Schema (per entry):
 * {
 *   id, name,
 *   alphaPerK,         // linear thermal expansion coefficient (1/K)
 *   densityKgM3,
 *   color,             // hex string for the rod's visual fill
 *   failureTempC,      // approximate melting point, °C
 *   lengthMm,          // unloaded "home" length (gameplay constant)
 *   originalLengthMm,
 *   unlocks[],         // knowledge concepts revealed when tested
 *   questTags[],
 * }
 */

export const THERMAL_RODS = {
  steel_rod: {
    id: 'steel_rod',
    name: 'Steel Rod',
    // Mild steel α ≈ 11–13 ×10⁻⁶ /K. Engineering Toolbox: 12 ×10⁻⁶ /K.
    alphaPerK: 12e-6,
    // Structural steel density ~7850 kg/m³ (ASTM A36 spec).
    densityKgM3: 7850,
    // Matches MATERIALS.structural_steel.visual.color (cool slate-gray).
    color: '#555a66',
    // Steel melts ~1370–1530°C; mild steel ≈ 1450°C.
    failureTempC: 1450,
    lengthMm: 100,
    originalLengthMm: 100,
    unlocks: ['thermal_expansion_steel', 'low_alpha_baseline'],
    questTags: ['heat_failure', 'thermal'],
  },

  copper_rod: {
    id: 'copper_rod',
    name: 'Copper Rod',
    // Copper α ≈ 16.7–17 ×10⁻⁶ /K. Engineering Toolbox: 17 ×10⁻⁶ /K.
    alphaPerK: 17e-6,
    // Pure copper density 8940–8960 kg/m³.
    densityKgM3: 8960,
    // Matches MATERIALS.copper.visual.color (warm copper-orange).
    color: '#c46c44',
    // Copper melts at 1085°C.
    failureTempC: 1085,
    lengthMm: 100,
    originalLengthMm: 100,
    unlocks: ['thermal_expansion_copper', 'mid_alpha_reference'],
    questTags: ['heat_failure', 'thermal'],
  },

  aluminum_rod: {
    id: 'aluminum_rod',
    name: 'Aluminum Rod',
    // Aluminum α ≈ 22–24 ×10⁻⁶ /K. Engineering Toolbox: 23 ×10⁻⁶ /K.
    alphaPerK: 23e-6,
    // Pure aluminum density ~2700 kg/m³.
    densityKgM3: 2700,
    // Light brushed-aluminum gray.
    color: '#b8b8c2',
    // Aluminum melts at 660°C — lowest of the three.
    failureTempC: 660,
    lengthMm: 100,
    originalLengthMm: 100,
    unlocks: ['thermal_expansion_aluminum', 'high_alpha_warning'],
    questTags: ['heat_failure', 'thermal'],
  },
};

/** Stable iteration order for selectors / progress tracking. */
export const THERMAL_ROD_IDS = Object.freeze([
  'steel_rod',
  'copper_rod',
  'aluminum_rod',
]);

/** Lookup helper. Returns null for unknown ids. */
export function getThermalRod(id) {
  return THERMAL_RODS[id] || null;
}

/** Returns highest α among the registered rods (used to normalize scores). */
export function getMaxAlpha() {
  let max = 0;
  for (const id of THERMAL_ROD_IDS) {
    const r = THERMAL_RODS[id];
    if (r && r.alphaPerK > max) max = r.alphaPerK;
  }
  return max;
}
