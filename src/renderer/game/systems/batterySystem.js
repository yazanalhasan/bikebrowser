/**
 * Battery System — construction, configuration, and management.
 *
 * Provides high-level operations for building battery packs:
 *   - Create a battery graph from a configuration
 *   - Add/remove cells
 *   - Change series/parallel arrangement
 *   - Compute pack statistics
 *   - Validate safety
 *
 * Works on top of systemGraph + simulationEngine.
 */

import {
  buildGraphFromDefinition, addNode, setInstalled, addEdge,
} from './systemGraph.js';
import { simulate } from './simulationEngine.js';
import {
  createCellNodes, BATTERY_INFRASTRUCTURE, createBatteryRules, BATTERY_PRESETS,
} from '../data/batteryParts.js';

// ── Battery Graph Construction ───────────────────────────────────────────────

/**
 * Create a battery system graph from a configuration.
 *
 * @param {number} series - cells in series
 * @param {number} parallel - cells in parallel
 * @param {object} [cellSpec] - cell properties override
 * @returns {object} system graph
 */
export function createBatteryGraph(series, parallel, cellSpec = {}) {
  const cells = createCellNodes(series, parallel, cellSpec);
  const infra = BATTERY_INFRASTRUCTURE.map((part) => {
    if (part.id === 'battery_config') {
      return { ...part, properties: { ...part.properties, series, parallel } };
    }
    return part;
  });

  const parts = [...cells, ...infra];
  const rules = createBatteryRules(series, parallel);

  return buildGraphFromDefinition(parts, rules);
}

/**
 * Create a battery from a preset name.
 */
export function createFromPreset(presetName) {
  const preset = BATTERY_PRESETS[presetName];
  if (!preset) return null;
  return {
    graph: createBatteryGraph(preset.series, preset.parallel),
    preset,
  };
}

// ── Cell Operations ──────────────────────────────────────────────────────────

/**
 * Install all cells in a battery graph (mark as installed).
 */
export function installAllCells(graph) {
  let g = graph;
  for (const [id, node] of graph.nodes) {
    if (node.type === 'cell') {
      g = setInstalled(g, id, true);
    }
  }
  return g;
}

/**
 * Install all infrastructure (BMS, casing, wiring, strips).
 */
export function installInfrastructure(graph) {
  let g = graph;
  const infraIds = ['bms', 'battery_casing', 'nickel_strips', 'battery_wiring', 'battery_config'];
  for (const id of infraIds) {
    if (g.nodes.has(id)) {
      g = setInstalled(g, id, true);
    }
  }
  return g;
}

/**
 * Set the health of a specific cell.
 */
export function setCellHealth(graph, cellId, health) {
  const nodes = new Map(graph.nodes);
  const cell = nodes.get(cellId);
  if (!cell) return graph;
  nodes.set(cellId, {
    ...cell,
    properties: { ...cell.properties, health: Math.max(0, Math.min(1, health)) },
  });
  return { ...graph, nodes };
}

// ── Battery Queries ──────────────────────────────────────────────────────────

/**
 * Compute battery pack statistics.
 */
export function getBatteryStats(graph) {
  const config = graph.nodes.get('battery_config');
  const series = config?.properties?.series || 0;
  const parallel = config?.properties?.parallel || 0;

  const cells = [];
  for (const node of graph.nodes.values()) {
    if (node.type === 'cell' && node.installed) cells.push(node);
  }

  if (cells.length === 0) {
    return {
      voltage: 0, capacityMah: 0, capacityAh: 0, wattHours: 0,
      cellCount: 0, series, parallel, config: `${series}S${parallel}P`,
      avgHealth: 0,
    };
  }

  const cellVoltage = 3.7;
  const avgCapacity = cells.reduce((s, c) => s + (c.properties?.capacity || 2500), 0) / cells.length;
  const avgHealth = cells.reduce((s, c) => s + (c.properties?.health || 1), 0) / cells.length;

  const voltage = series * cellVoltage;
  const capacityMah = parallel * avgCapacity * avgHealth;
  const capacityAh = capacityMah / 1000;
  const wattHours = voltage * capacityAh;

  return {
    voltage: Math.round(voltage * 10) / 10,
    capacityMah: Math.round(capacityMah),
    capacityAh: Math.round(capacityAh * 10) / 10,
    wattHours: Math.round(wattHours),
    cellCount: cells.length,
    series,
    parallel,
    config: `${series}S${parallel}P`,
    avgHealth: Math.round(avgHealth * 100),
  };
}

/**
 * Validate a battery build.
 */
export function validateBattery(graph) {
  return simulate(graph, 'battery');
}

/**
 * Get available preset names.
 */
export function getPresets() {
  return Object.entries(BATTERY_PRESETS).map(([key, preset]) => ({
    key,
    ...preset,
  }));
}
