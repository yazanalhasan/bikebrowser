/**
 * Inspector System — normalizes any entity into a unified inspection payload.
 *
 * Bridges the stress simulation + material engine into a single data model
 * that the UI inspector and failure assistant both consume.
 *
 * Data flow:
 *   stressSimulation → inspectorSystem → UI (MaterialInspector)
 *                                      → failureAssistant
 *
 * Every inspectable entity (vehicle, bridge, tool, structure) gets
 * normalized into the same shape. The inspector doesn't care what
 * KIND of entity it is — it reads the same payload.
 */

import { MATERIAL_MAP } from '../data/materials.js';
import { getObjectMetrics, getRecentEvents, getWeakestSegment } from './stressSimulation.js';
import { classifyFailureState, getStatusBadge, rankRootCauses, generateRecommendations } from '../utils/failureMath.js';

// ── Main Inspection Function ─────────────────────────────────────────────────

/**
 * Generate a normalized inspection payload for any entity.
 *
 * @param {object} entity - structural object from stressSimulation or any inspectable
 * @param {object} [options] - { selectedPart?, showDebug? }
 * @returns {object} inspection data
 */
export function getInspectionData(entity, options = {}) {
  if (!entity) return null;

  const selectedPartId = options.selectedPart;
  const metrics = getObjectMetrics(entity);
  const recentEvents = getRecentEvents(entity, 10);

  // If a specific subpart is selected, focus on that segment
  const selectedSegment = selectedPartId
    ? entity.segments?.find((s) => s.id === selectedPartId)
    : null;

  // Use selected segment state or aggregate metrics
  const focusState = selectedSegment?.state || {
    integrity: metrics.minIntegrity,
    stress: metrics.maxStress,
    strain: 0,
    fatigue: metrics.avgFatigue,
    vibration: metrics.maxVibration,
    temperature: metrics.avgTemperature,
    thermalStress: 0,
    bondStress: 0,
    contamination: 0,
    coatingCoverage: 0,
  };

  // Status badge
  const status = getStatusBadge(focusState);
  const failureState = classifyFailureState(focusState);

  // Material composition
  const materials = extractMaterials(entity, selectedSegment);

  // Root cause analysis
  const materialContext = selectedSegment ? {
    materialStrength: selectedSegment.matProps?.strength || 0.5,
    materialFatigue: selectedSegment.matProps?.fatigueResistance || 0.5,
  } : {};
  const rankedCauses = rankRootCauses(focusState, materialContext);
  const recommendations = generateRecommendations(focusState, rankedCauses, materialContext);

  // Warnings from events
  const warnings = recentEvents
    .filter((e) => e.severity > 0.3)
    .map((e) => ({
      severity: e.severity > 0.7 ? 'critical' : e.severity > 0.4 ? 'warning' : 'info',
      message: e.message,
      component: e.componentLabel,
      type: e.type,
      timestamp: e.timestamp,
    }));

  // Subparts list (for clicking through vehicle/structure parts)
  const subparts = (entity.segments || []).map((seg) => ({
    id: seg.id,
    label: seg.label,
    role: seg.role,
    material: seg.material,
    integrity: seg.state.integrity,
    stress: seg.state.stress,
    failureState: seg.state.failureState,
    selected: seg.id === selectedPartId,
  }));

  return {
    id: entity.id,
    name: entity.name || entity.id,
    category: entity.category || 'structure',
    selectedPart: selectedPartId || null,

    // Status
    status,
    failureState,
    integrity: Math.round(focusState.integrity * 100),

    // Material composition
    materials,

    // Live metrics
    currentState: {
      integrity: r(focusState.integrity),
      stress: r(focusState.stress),
      strain: r(focusState.strain),
      fatigue: r(focusState.fatigue),
      vibration: r(focusState.vibration),
      temperature: r(focusState.temperature),
      thermalStress: r(focusState.thermalStress || 0),
      contamination: r(focusState.contamination || 0),
      coatingCoverage: r(focusState.coatingCoverage || 0),
      bondStress: r(focusState.bondStress || 0),
      deformation: r(focusState.deformation || 0),
    },

    // Environment
    environment: entity.environment || {},

    // Aggregate metrics
    metrics: {
      ...metrics,
      weakestPart: getWeakestSegment(entity)?.label || 'N/A',
    },

    // Analysis
    warnings,
    rankedCauses: rankedCauses.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    recentEvents: recentEvents.map(normalizeEvent),

    // Subparts (for part selection)
    subparts,

    // History (for graphs)
    history: selectedSegment?.history || aggregateHistory(entity),

    // Debug info (only if requested)
    debug: options.showDebug ? getDebugInfo(entity, selectedSegment) : null,
  };
}

// ── Material Extraction ──────────────────────────────────────────────────────

function extractMaterials(entity, selectedSegment) {
  if (selectedSegment) {
    const mat = MATERIAL_MAP[selectedSegment.material];
    if (!mat) return [];
    return [{
      name: mat.label,
      id: selectedSegment.material,
      fraction: 1,
      role: selectedSegment.role,
      properties: flattenProperties(mat),
    }];
  }

  // Aggregate from all segments
  const materialCounts = {};
  for (const seg of entity.segments || []) {
    const matId = seg.material;
    if (!materialCounts[matId]) {
      materialCounts[matId] = { count: 0, roles: new Set() };
    }
    materialCounts[matId].count++;
    materialCounts[matId].roles.add(seg.role);
  }

  const total = entity.segments?.length || 1;
  return Object.entries(materialCounts).map(([matId, info]) => {
    const mat = MATERIAL_MAP[matId];
    return {
      name: mat?.label || matId,
      id: matId,
      fraction: Math.round((info.count / total) * 100) / 100,
      role: [...info.roles].join(', '),
      properties: mat ? flattenProperties(mat) : {},
    };
  });
}

function flattenProperties(mat) {
  return {
    strength: mat.structural?.strength || 0,
    elasticity: mat.structural?.elasticity || 0,
    fracturePoint: mat.structural?.fracturePoint || 0,
    fatigueResistance: mat.structural?.fatigueResistance || 0,
    density: mat.physical?.density || 0,
    thermalConductivity: mat.thermal?.conductivity || 0,
    expansion: mat.thermal?.expansion || 0,
    viscosity: mat.fluid?.viscosity || 0,
    wetting: mat.fluid?.wetting || 0,
    conductivity: mat.electrical?.conductivity || 0,
    contaminationResistance: mat.chemical?.contaminationResistance || 0,
    bonding: mat.chemical?.bonding || 0,
  };
}

// ── History Aggregation ──────────────────────────────────────────────────────

function aggregateHistory(entity) {
  if (!entity.segments || entity.segments.length === 0) return [];

  // Use the segment with the most history
  let longestHistory = [];
  for (const seg of entity.segments) {
    if (seg.history.length > longestHistory.length) {
      longestHistory = seg.history;
    }
  }

  // Average across all segments at each time point
  return longestHistory.map((_, i) => {
    const point = { t: 0, stress: 0, strain: 0, fatigue: 0, vibration: 0, temperature: 0, integrity: 0 };
    let count = 0;
    for (const seg of entity.segments) {
      const h = seg.history[i];
      if (!h) continue;
      point.t = h.t;
      point.stress += h.stress;
      point.fatigue += h.fatigue;
      point.vibration += h.vibration;
      point.temperature += h.temperature;
      point.integrity = Math.min(point.integrity || 1, h.integrity);
      count++;
    }
    if (count > 0) {
      point.stress /= count;
      point.fatigue /= count;
      point.vibration /= count;
      point.temperature /= count;
    }
    return point;
  });
}

// ── Event Normalization ──────────────────────────────────────────────────────

function normalizeEvent(event) {
  return {
    type: event.type,
    message: event.message,
    component: event.componentLabel,
    severity: event.severity,
    icon: event.icon,
    timestamp: event.timestamp,
    cause: event.causeType,
  };
}

// ── Debug Info ────────────────────────────────────────────────────────────────

function getDebugInfo(entity, selectedSegment) {
  if (selectedSegment) {
    return {
      segmentId: selectedSegment.id,
      rawMatProps: selectedSegment.matProps,
      crossSection: selectedSegment.crossSection,
      supportFactor: selectedSegment.supportFactor,
      constraintFactor: selectedSegment.constraintFactor,
      connectionCount: selectedSegment.connections.length,
      stressConcentrationInputs: {
        bondQuality: 1 - (selectedSegment.state.bondStress || 0),
        geometryFactor: selectedSegment.connections.length > 2 ? 0.3 : 0.1,
      },
      thermalExpansionFactor: selectedSegment.matProps.thermalExpansion,
      fatigueAccumulationRate: (1 - selectedSegment.matProps.fatigueResistance) * 0.003,
      historyLength: selectedSegment.history.length,
    };
  }

  return {
    segmentCount: entity.segments?.length || 0,
    lodLevel: entity.lodLevel,
    tickCount: entity.tickCount,
    totalEvents: entity.events?.length || 0,
    loadCount: entity.loads?.length || 0,
  };
}

// ── Metric Threshold Classification ──────────────────────────────────────────

/**
 * Get the threshold color for a metric value.
 * Used by UI bars to color-code risk levels.
 *
 * @param {string} metric - metric name
 * @param {number} value - current value
 * @returns {'green'|'yellow'|'orange'|'red'}
 */
export function getMetricColor(metric, value) {
  const thresholds = {
    stress:       { yellow: 0.4, orange: 0.6, red: 0.8 },
    strain:       { yellow: 0.3, orange: 0.5, red: 0.7 },
    fatigue:      { yellow: 0.3, orange: 0.5, red: 0.7 },
    vibration:    { yellow: 0.5, orange: 0.8, red: 1.2 },
    temperature:  { yellow: 0.4, orange: 0.6, red: 0.8 },
    contamination:{ yellow: 0.2, orange: 0.4, red: 0.6 },
    bondStress:   { yellow: 0.3, orange: 0.5, red: 0.7 },
    integrity:    { yellow: 0.7, orange: 0.5, red: 0.3 }, // inverted: lower = worse
  };

  const t = thresholds[metric];
  if (!t) return 'green';

  if (metric === 'integrity') {
    // Inverted: below threshold = bad
    if (value <= t.red) return 'red';
    if (value <= t.orange) return 'orange';
    if (value <= t.yellow) return 'yellow';
    return 'green';
  }

  if (value >= t.red) return 'red';
  if (value >= t.orange) return 'orange';
  if (value >= t.yellow) return 'yellow';
  return 'green';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function r(v) { return Math.round(v * 1000) / 1000; }
