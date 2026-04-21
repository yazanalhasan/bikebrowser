/**
 * Battery Parts — cell definitions, configurations, and BMS specs.
 *
 * The battery system is a sub-graph within the e-bike system.
 * Cells are arranged in series (voltage) and parallel (capacity).
 *
 * Key concepts the player learns:
 *   - Series: voltage = cells_in_series × 3.7V
 *   - Parallel: capacity = cells_in_parallel × cell_capacity
 *   - Watt-hours: Wh = voltage × Ah
 *   - BMS: protects cells from damage
 */

/**
 * Create battery cell nodes for a given configuration.
 *
 * @param {number} series - cells in series (determines voltage)
 * @param {number} parallel - cells in parallel (determines capacity)
 * @param {object} [cellSpec] - override cell properties
 * @returns {object[]} array of cell node definitions
 */
export function createCellNodes(series, parallel, cellSpec = {}) {
  const cells = [];
  for (let s = 0; s < series; s++) {
    for (let p = 0; p < parallel; p++) {
      cells.push({
        id: `cell_${s}_${p}`,
        type: 'cell',
        properties: {
          label: `Cell S${s + 1}P${p + 1}`,
          icon: '🔋',
          voltage: cellSpec.voltage || 3.7,
          capacity: cellSpec.capacity || 2500, // mAh
          health: cellSpec.health || 1.0,
          seriesPosition: s,
          parallelPosition: p,
          category: 'battery',
          description: `Lithium cell at position S${s + 1}P${p + 1}. 3.7V nominal.`,
        },
      });
    }
  }
  return cells;
}

/**
 * Battery infrastructure components (non-cell parts).
 */
export const BATTERY_INFRASTRUCTURE = [
  {
    id: 'battery_config',
    type: 'system',
    properties: {
      label: 'Battery Configuration',
      icon: '⚡',
      series: 0,
      parallel: 0,
      category: 'battery',
      description: 'The series/parallel arrangement of cells.',
    },
  },
  {
    id: 'bms',
    type: 'component',
    properties: {
      label: 'Battery Management System',
      icon: '🖥️',
      category: 'battery',
      maxVoltage: 60,
      maxCurrent: 30,
      balancing: true,
      description: 'Monitors cells, prevents overcharge/discharge, balances voltage. Essential for safety.',
      cost: 40,
    },
  },
  {
    id: 'battery_casing',
    type: 'component',
    properties: {
      label: 'Battery Casing',
      icon: '📦',
      category: 'battery',
      material: 'abs_plastic',
      waterproof: false,
      description: 'Protective enclosure for the battery pack.',
      cost: 25,
    },
  },
  {
    id: 'nickel_strips',
    type: 'component',
    properties: {
      label: 'Nickel Strips',
      icon: '🔗',
      category: 'battery',
      description: 'Connects cells together in series and parallel.',
      cost: 10,
    },
  },
  {
    id: 'battery_wiring',
    type: 'component',
    properties: {
      label: 'Battery Wiring',
      icon: '🔌',
      category: 'battery',
      gauge: 12,
      description: 'Power cables from battery to controller.',
      cost: 8,
    },
  },
];

/**
 * Battery rules — dependency edges.
 */
export function createBatteryRules(series, parallel) {
  const rules = [];

  // All cells require nickel strips
  for (let s = 0; s < series; s++) {
    for (let p = 0; p < parallel; p++) {
      rules.push({
        from: `cell_${s}_${p}`,
        to: 'nickel_strips',
        relation: 'requires',
      });
    }
  }

  // BMS monitors all cells
  rules.push({ from: 'bms', to: 'battery_config', relation: 'requires' });

  // Wiring requires BMS
  rules.push({ from: 'battery_wiring', to: 'bms', relation: 'requires' });

  // Casing contains everything
  rules.push({ from: 'battery_casing', to: 'nickel_strips', relation: 'requires' });

  return rules;
}

/**
 * Predefined battery configurations for the game.
 */
export const BATTERY_PRESETS = {
  starter: {
    label: '10S1P Starter Pack',
    series: 10,
    parallel: 1,
    voltage: 37,
    description: '37V, basic range. Good for learning.',
  },
  standard: {
    label: '13S2P Standard Pack',
    series: 13,
    parallel: 2,
    voltage: 48.1,
    description: '48V, solid range. Most common e-bike battery.',
  },
  performance: {
    label: '14S3P Performance Pack',
    series: 14,
    parallel: 3,
    voltage: 51.8,
    description: '52V, extended range. For serious builds.',
  },
};

/**
 * Battery materials needed for construction.
 */
export const BATTERY_MATERIALS = {
  lithium_cell: {
    id: 'lithium_cell',
    label: 'Lithium Cell (18650)',
    icon: '🔋',
    category: 'battery_material',
    description: 'Standard 18650 lithium-ion cell. 3.7V, 2500mAh.',
    cost: 5,
  },
  nickel_strip: {
    id: 'nickel_strip',
    label: 'Nickel Strip',
    icon: '🔗',
    category: 'battery_material',
    description: 'Pure nickel strip for spot-welding cells together.',
    cost: 1,
  },
  copper_wire: {
    id: 'copper_wire',
    label: 'Copper Wire',
    icon: '🧶',
    category: 'battery_material',
    description: 'Thick copper wire for high-current connections.',
    cost: 2,
  },
  insulation: {
    id: 'insulation',
    label: 'Insulation Sheet',
    icon: '🧻',
    category: 'battery_material',
    description: 'Fish paper insulation to prevent short circuits.',
    cost: 1,
  },
  casing_material: {
    id: 'casing_material',
    label: 'Casing Material',
    icon: '📦',
    category: 'battery_material',
    description: 'ABS plastic or aluminum for the battery enclosure.',
    cost: 8,
  },
};
