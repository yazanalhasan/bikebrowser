/**
 * Battery Chemistry System — maps refined chemicals to battery components.
 *
 * This is the bridge between chemistry and engineering:
 *   refined chemicals → battery components → system graph → simulation
 *
 * Battery components:
 *   - Electrode: carbon-based, stores charge via surface area
 *   - Electrolyte: ionic solution, carries charge between electrodes
 *   - Separator: porous insulator between electrodes (prevents short circuit)
 *
 * Performance is property-driven:
 *   capacity = electrode.surface_area × electrode.purity × config
 *   power = electrolyte.conductivity × system_efficiency
 *   failure_rate = 1 - electrolyte.stability
 *   short_circuit_risk = 1 - separator.dielectric_strength
 *
 * This is a lithium ANALOG — same principles, plant-derived materials.
 */

import { computeChemicalQuality } from './chemistrySystem.js';

// ── Battery Component Creation ───────────────────────────────────────────────

/**
 * Create an electrode from a carbon-type chemical.
 *
 * The electrode stores electrical charge. Its performance depends on:
 *   - surface_area: more pores = more charge storage = more capacity
 *   - carbon_content: purer carbon = better conductivity
 *   - stability: how long the electrode lasts before degrading
 *
 * @param {object} chemical - refined carbon chemical
 * @returns {{ component: object, explanation: string } | null}
 */
export function createElectrode(chemical) {
  if (chemical.type !== 'carbon') {
    return {
      component: null,
      explanation: `Cannot make an electrode from ${chemical.type}. Need a carbon-type material (try carbonizing wood or fiber).`,
    };
  }

  const p = chemical.properties;
  const quality = computeChemicalQuality(chemical, 'electrode');

  const electrode = {
    id: `electrode_${chemical.id}`,
    componentType: 'electrode',
    label: `Plant Carbon Electrode (from ${chemical.label})`,
    icon: '⚫',
    sourceChemical: chemical.id,

    // Performance properties (derived from chemical properties)
    properties: {
      surface_area: p.surface_area || p.porosity || 0.3,
      carbon_purity: p.carbon_content || p.purity || 0.3,
      conductivity: (p.carbon_content || 0.3) * (p.purity || 0.3),
      stability: p.stability || 0.4,
      capacity_factor: quality,
      weight: 1 - (p.porosity || 0.3) * 0.5, // porous = lighter
    },

    quality,
    description: `Carbon electrode with ${Math.round(quality * 100)}% quality. ` +
      `Surface area: ${grade(p.surface_area)}, Purity: ${grade(p.purity)}.`,
  };

  const explanation = `Created electrode from ${chemical.label}. ` +
    `The carbon's porous structure stores charge — more surface area means more capacity. ` +
    `Quality: ${Math.round(quality * 100)}%.`;

  return { component: electrode, explanation };
}

/**
 * Create an electrolyte from an ionic chemical.
 *
 * The electrolyte carries ions between electrodes. Its performance depends on:
 *   - conductivity: how fast ions move = how much power the battery can deliver
 *   - stability: how likely the electrolyte is to break down
 *   - purity: contaminants reduce efficiency and cause side reactions
 *
 * @param {object} chemical - refined electrolyte/ionic chemical
 * @returns {{ component: object, explanation: string } | null}
 */
export function createElectrolyte(chemical) {
  if (chemical.type !== 'electrolyte') {
    return {
      component: null,
      explanation: `Cannot make an electrolyte from ${chemical.type}. Need an ionic compound (try dissolving mineral ash).`,
    };
  }

  const p = chemical.properties;
  const quality = computeChemicalQuality(chemical, 'electrolyte');

  // Conductivity is the key performance metric
  const conductivity = (p.conductivity_potential || 0.2) * (p.purity || 0.3);
  // Wetting factor: surfactant content improves electrode contact
  const wettingBonus = (p.wetting_ability || 0) * 0.15;

  const electrolyte = {
    id: `electrolyte_${chemical.id}`,
    componentType: 'electrolyte',
    label: `Plant Electrolyte (from ${chemical.label})`,
    icon: '💧',
    sourceChemical: chemical.id,

    properties: {
      conductivity: Math.min(0.95, conductivity + wettingBonus),
      stability: p.stability || 0.4,
      purity: p.purity || 0.3,
      pH: p.pH || 7,
      viscosity: p.viscosity || 0.5,
      power_factor: quality,
      failure_rate: Math.max(0.01, 1 - (p.stability || 0.4)),
    },

    quality,
    description: `Electrolyte with ${Math.round(quality * 100)}% quality. ` +
      `Conductivity: ${grade(conductivity)}, Stability: ${grade(p.stability)}.`,
  };

  const explanation = `Created electrolyte from ${chemical.label}. ` +
    `Dissolved ions carry charge between electrodes — higher conductivity means more power. ` +
    `Stability: ${grade(p.stability)} (unstable = risk of failure). Quality: ${Math.round(quality * 100)}%.`;

  return { component: electrolyte, explanation };
}

/**
 * Create a separator from insulating/fiber chemical.
 *
 * The separator sits between electrodes, preventing short circuits
 * while allowing ions to pass through.
 *
 * @param {object} chemical - insulator or fiber chemical
 * @returns {{ component: object, explanation: string } | null}
 */
export function createSeparator(chemical) {
  const validTypes = ['insulator', 'fiber', 'binder', 'composite'];
  if (!validTypes.includes(chemical.type)) {
    return {
      component: null,
      explanation: `Cannot make a separator from ${chemical.type}. Need an insulating or fiber material.`,
    };
  }

  const p = chemical.properties;
  const quality = computeChemicalQuality(chemical, 'separator');

  const separator = {
    id: `separator_${chemical.id}`,
    componentType: 'separator',
    label: `Plant Separator (from ${chemical.label})`,
    icon: '🧻',
    sourceChemical: chemical.id,

    properties: {
      dielectric_strength: p.dielectric_strength || p.hydrophobicity || 0.3,
      porosity: p.porosity || p.fiber_strength ? 0.5 : 0.2,
      thermal_resistance: p.thermal_stability || 0.4,
      thickness: 0.5, // normalized
      short_circuit_protection: Math.min(0.95, (p.dielectric_strength || 0.3) * (p.stability || 0.5)),
    },

    quality,
    description: `Separator with ${Math.round(quality * 100)}% quality. ` +
      `Insulation: ${grade(p.dielectric_strength)}, Porosity: ${grade(p.porosity)}.`,
  };

  const explanation = `Created separator from ${chemical.label}. ` +
    `The separator must block electrons (insulation) while letting ions pass (porosity). ` +
    `Quality: ${Math.round(quality * 100)}%.`;

  return { component: separator, explanation };
}

// ── Plant-Based Battery Assembly ─────────────────────────────────────────────

/**
 * Assemble a plant-based battery cell from components.
 *
 * Performance is computed from component properties, NOT hardcoded.
 *
 * @param {object} electrode
 * @param {object} electrolyte
 * @param {object} separator
 * @returns {{ cell: object, explanation: string, warnings: string[] }}
 */
export function assemblePlantCell(electrode, electrolyte, separator) {
  const warnings = [];

  if (!electrode || electrode.componentType !== 'electrode') {
    return { cell: null, explanation: 'Missing electrode component.', warnings: ['No electrode'] };
  }
  if (!electrolyte || electrolyte.componentType !== 'electrolyte') {
    return { cell: null, explanation: 'Missing electrolyte component.', warnings: ['No electrolyte'] };
  }
  if (!separator || separator.componentType !== 'separator') {
    return { cell: null, explanation: 'Missing separator component.', warnings: ['No separator'] };
  }

  const ep = electrode.properties;
  const lp = electrolyte.properties;
  const sp = separator.properties;

  // ── Compute cell performance from component properties ──

  // Voltage: plant-based cells are lower than lithium (~0.5–1.5V)
  // Based on electrolyte conductivity and electrode quality
  const voltage = 0.5 + lp.conductivity * 1.0; // 0.5–1.5V range

  // Capacity: surface area × electrode quality × a scaling factor
  const capacity = Math.round(ep.surface_area * ep.capacity_factor * 500); // mAh

  // Internal resistance: lower = better power delivery
  const internalResistance = Math.max(0.1, 1 - lp.conductivity * ep.conductivity);

  // Failure probability per cycle
  const failureRate = lp.failure_rate * (1 - sp.short_circuit_protection);

  // Short circuit risk
  const shortCircuitRisk = Math.max(0.01, 1 - sp.dielectric_strength);

  // Thermal risk
  const thermalRisk = Math.max(0.01, 1 - Math.min(sp.thermal_resistance, ep.stability) * 0.5);

  // Overall cell health (starts at component average quality)
  const avgQuality = (electrode.quality + electrolyte.quality + (separator?.quality || 0.5)) / 3;

  // Warnings based on properties
  if (lp.conductivity < 0.2) {
    warnings.push('Very low conductivity — motor will be weak. Refine your electrolyte.');
  }
  if (lp.stability < 0.4) {
    warnings.push('Unstable electrolyte — risk of random shutdown. Improve purity.');
  }
  if (sp.dielectric_strength < 0.3) {
    warnings.push('Weak separator — short circuit risk! Use better insulating material.');
  }
  if (ep.surface_area < 0.3) {
    warnings.push('Low electrode surface area — low capacity. Carbonize at higher temperature.');
  }

  const cell = {
    id: `plant_cell_${Date.now()}`,
    type: 'plant_cell',
    label: 'Plant-Based Cell',
    icon: '🔋',
    properties: {
      voltage: Math.round(voltage * 100) / 100,
      capacity,
      internalResistance: Math.round(internalResistance * 100) / 100,
      failureRate: Math.round(failureRate * 1000) / 1000,
      shortCircuitRisk: Math.round(shortCircuitRisk * 100) / 100,
      thermalRisk: Math.round(thermalRisk * 100) / 100,
      health: 1.0,
      plantBased: true,
    },
    components: {
      electrode: electrode.id,
      electrolyte: electrolyte.id,
      separator: separator.id,
    },
    quality: Math.round(avgQuality * 100) / 100,
  };

  const explanation =
    `Assembled plant-based cell: ${voltage.toFixed(2)}V, ${capacity}mAh. ` +
    `This is lower than a lithium cell (3.7V, 2500mAh) because plant-derived ` +
    `electrolytes have lower ionic conductivity. ` +
    `But it works — and you made it from desert plants!` +
    (warnings.length > 0 ? ` ⚠️ ${warnings.length} warning(s).` : '');

  return { cell, explanation, warnings };
}

// ── Battery Pack from Plant Cells ────────────────────────────────────────────

/**
 * Compute plant battery pack performance.
 *
 * @param {object[]} cells - array of plant cell objects
 * @param {number} series - cells in series
 * @param {number} parallel - cells in parallel
 * @returns {object} pack stats
 */
export function computePlantPackStats(cells, series, parallel) {
  if (cells.length === 0) return null;

  const avgVoltage = cells.reduce((s, c) => s + c.properties.voltage, 0) / cells.length;
  const avgCapacity = cells.reduce((s, c) => s + c.properties.capacity, 0) / cells.length;
  const avgFailure = cells.reduce((s, c) => s + c.properties.failureRate, 0) / cells.length;
  const maxShortRisk = Math.max(...cells.map((c) => c.properties.shortCircuitRisk));

  const packVoltage = series * avgVoltage;
  const packCapacity = parallel * avgCapacity;
  const packWh = (packVoltage * packCapacity) / 1000;

  // Compare to lithium equivalent
  const lithiumEquivalentWh = series * 3.7 * parallel * 2.5;
  const efficiencyVsLithium = packWh / lithiumEquivalentWh;

  return {
    voltage: Math.round(packVoltage * 10) / 10,
    capacityMah: Math.round(packCapacity),
    wattHours: Math.round(packWh * 10) / 10,
    config: `${series}S${parallel}P`,
    cellCount: cells.length,
    avgCellQuality: Math.round(cells.reduce((s, c) => s + c.quality, 0) / cells.length * 100),
    failureRisk: Math.round(avgFailure * 100),
    shortCircuitRisk: Math.round(maxShortRisk * 100),
    efficiencyVsLithium: Math.round(efficiencyVsLithium * 100),
    explanation: `Plant pack: ${packVoltage.toFixed(1)}V, ${packCapacity}mAh (${packWh.toFixed(1)}Wh). ` +
      `That's ${Math.round(efficiencyVsLithium * 100)}% of a lithium equivalent. ` +
      `Failure risk: ${Math.round(avgFailure * 100)}% per cycle.`,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function grade(value) {
  if (value === undefined || value === null) return 'unknown';
  if (value >= 0.8) return 'excellent';
  if (value >= 0.6) return 'good';
  if (value >= 0.4) return 'fair';
  if (value >= 0.2) return 'poor';
  return 'very low';
}
