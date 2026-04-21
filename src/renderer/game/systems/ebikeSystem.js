/**
 * E-Bike System — combines bike + battery + electrical into a complete build.
 *
 * The e-bike system graph merges three sub-systems:
 *   1. Bike graph (frame, wheels, drivetrain, brakes)
 *   2. Battery graph (cells, BMS, wiring)
 *   3. Electrical graph (motor, controller, sensors)
 *
 * The simulation engine validates the complete system including
 * cross-system constraints (voltage matching, current limits).
 */

import {
  buildGraphFromDefinition, addNode, addEdge, setInstalled,
} from './systemGraph.js';
import { simulate } from './simulationEngine.js';
import { BIKE_PARTS, BIKE_RULES } from '../data/bikeParts.js';
import { EBIKE_PARTS, EBIKE_RULES } from '../data/ebikeParts.js';
import { createBatteryGraph, installAllCells, installInfrastructure, getBatteryStats } from './batterySystem.js';

// ── E-Bike Graph Construction ────────────────────────────────────────────────

/**
 * Create a complete e-bike system graph.
 *
 * @param {object} [batteryConfig] - { series, parallel }
 * @returns {object} system graph with bike + battery + electrical
 */
export function createEbikeGraph(batteryConfig = { series: 13, parallel: 2 }) {
  // Start with bike parts
  const allParts = [...BIKE_PARTS, ...EBIKE_PARTS];
  const allRules = [...BIKE_RULES, ...EBIKE_RULES];

  let graph = buildGraphFromDefinition(allParts, allRules);

  // Merge battery sub-graph
  const batteryGraph = createBatteryGraph(batteryConfig.series, batteryConfig.parallel);
  for (const [id, node] of batteryGraph.nodes) {
    graph = addNode(graph, node);
  }
  for (const edge of batteryGraph.edges) {
    graph = addEdge(graph, edge);
  }

  return graph;
}

/**
 * Create a bike-only graph (no electrical/battery).
 */
export function createBikeGraph() {
  return buildGraphFromDefinition(BIKE_PARTS, BIKE_RULES);
}

// ── Build Operations ─────────────────────────────────────────────────────────

/**
 * Install a component by ID.
 */
export function installComponent(graph, componentId) {
  return setInstalled(graph, componentId, true);
}

/**
 * Uninstall a component by ID.
 */
export function uninstallComponent(graph, componentId) {
  return setInstalled(graph, componentId, false);
}

/**
 * Install all bike components (for a complete bike).
 */
export function installFullBike(graph) {
  let g = graph;
  for (const part of BIKE_PARTS) {
    g = setInstalled(g, part.id, true);
  }
  return g;
}

/**
 * Install all e-bike electrical components.
 */
export function installElectrical(graph) {
  let g = graph;
  for (const part of EBIKE_PARTS) {
    if (g.nodes.has(part.id)) {
      g = setInstalled(g, part.id, true);
    }
  }
  return g;
}

// ── Simulation ───────────────────────────────────────────────────────────────

/**
 * Run bike-only simulation.
 */
export function simulateBike(graph) {
  return simulate(graph, 'bike');
}

/**
 * Run full e-bike simulation (bike + battery + electrical).
 */
export function simulateEbike(graph, context = {}) {
  return simulate(graph, 'ebike', context);
}

// ── E-Bike Metrics ───────────────────────────────────────────────────────────

/**
 * Compute complete e-bike performance metrics.
 */
export function getEbikeMetrics(graph, riderWeight = 60) {
  const simResult = simulate(graph, 'ebike', { riderWeight });
  const batteryStats = getBatteryStats(graph);

  const motor = graph.nodes.get('motor');
  const controller = graph.nodes.get('controller');

  return {
    // Battery
    battery: batteryStats,

    // Motor
    motorPower: motor?.properties?.power || 0,
    motorVoltage: motor?.properties?.ratedVoltage || 0,

    // Performance (from simulation)
    range: simResult.metrics.ebikeRange || 0,
    topSpeed: simResult.metrics.ebikeTopSpeed || 0,
    efficiency: simResult.metrics.ebikeEfficiency || 0,

    // Build quality
    score: simResult.score,
    errors: simResult.errors.length,
    warnings: simResult.warnings.length,
    rideable: simResult.success,

    // Weight
    totalWeight: simResult.metrics.bikeWeight || 0,
  };
}

/**
 * Compute estimated range based on current build.
 *
 * @param {number} batteryWh - battery watt-hours
 * @param {number} motorEfficiency - 0–1
 * @param {number} riderWeight - kg
 * @param {number} bikeWeight - kg
 * @returns {number} estimated range in km
 */
export function computeRange(batteryWh, motorEfficiency, riderWeight, bikeWeight) {
  const totalLoad = riderWeight + bikeWeight;
  const whPerKm = totalLoad * 0.015; // simplified model
  return Math.round((batteryWh * motorEfficiency) / whPerKm);
}
