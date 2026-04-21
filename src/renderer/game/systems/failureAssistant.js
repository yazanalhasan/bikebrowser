/**
 * Failure Assistant — AI explanation engine for material failures.
 *
 * Reads actual simulation data to generate grounded explanations.
 * Never hallucinates — every statement traces to a metric or event.
 *
 * 4-level explanation structure:
 *   1. Immediate cause — what failed and why
 *   2. Contributing factors — what made it worse
 *   3. Design advice — specific changes to improve
 *   4. Tradeoff warnings — what the fix costs
 *
 * Data flow:
 *   stressSimulation → inspectorSystem → failureAssistant
 *                                         ↓
 *                                    explanation + advice
 */

import { getInspectionData, getMetricColor } from './inspectorSystem.js';
import { rankRootCauses, generateRecommendations, assessBuildRisk } from '../utils/failureMath.js';
import { MATERIAL_MAP } from '../data/materials.js';

// ── Main Explanation Generator ───────────────────────────────────────────────

/**
 * Generate a complete failure explanation from an entity and context.
 *
 * @param {object} entity - structural object from stressSimulation
 * @param {object} [context] - { selectedPart?, triggerEvent?, playerHistory? }
 * @returns {object} explanation payload
 */
export function generateFailureExplanation(entity, context = {}) {
  const inspection = getInspectionData(entity, {
    selectedPart: context.selectedPart,
  });

  if (!inspection) {
    return { summary: 'No data available for this object.', causes: [], recommendedFixes: [], tradeoffs: [], confidence: 0 };
  }

  const state = inspection.currentState;
  const causes = inspection.rankedCauses;
  const recs = inspection.recommendations;
  const events = inspection.recentEvents;
  const failureState = inspection.failureState;

  // ── Level 1: Immediate Cause ──
  const immediateCause = buildImmediateCause(failureState, state, causes[0], inspection);

  // ── Level 2: Contributing Factors ──
  const contributingFactors = buildContributingFactors(state, causes.slice(1, 4), events);

  // ── Level 3: Design Advice ──
  const recommendedFixes = buildDesignAdvice(recs, state, inspection.materials);

  // ── Level 4: Tradeoff Warnings ──
  const tradeoffs = buildTradeoffs(recommendedFixes, inspection.materials);

  // Confidence: based on data quality
  const confidence = computeConfidence(events, causes, state);

  // Summary
  const summary = buildSummary(failureState, immediateCause, inspection);

  return {
    entityId: entity.id,
    entityName: inspection.name,
    selectedPart: inspection.selectedPart,
    summary,
    failureState: failureState.label,
    severity: failureState.severity,
    immediateCause,
    contributingFactors,
    recommendedFixes,
    tradeoffs,
    confidence: Math.round(confidence * 100),
    timestamp: Date.now(),
  };
}

// ── Level 1: Immediate Cause ─────────────────────────────────────────────────

function buildImmediateCause(failureState, state, topCause, inspection) {
  if (failureState.severity === 0) {
    return {
      description: 'No failure — system is operating within safe limits.',
      metric: null,
      threshold: null,
    };
  }

  const focusPart = inspection.selectedPart
    ? inspection.subparts.find((p) => p.id === inspection.selectedPart)?.label || inspection.selectedPart
    : inspection.metrics?.weakestPart || 'the structure';

  // Build cause description from actual metrics
  const descriptions = {
    catastrophic: `${focusPart} suffered catastrophic failure — integrity dropped to zero.`,
    buckling: `${focusPart} is buckling. Stress (${r(state.stress * 100)}%) and strain (${r(state.strain * 100)}%) both exceeded safe limits simultaneously.`,
    resonance_risk: `${focusPart} is experiencing resonance. Vibration amplitude (${r(state.vibration)}) is dangerously high — periodic forces are amplifying.`,
    overheating: `${focusPart} is overheating (${r(state.temperature * 100)}% of limit). Material is softening.`,
    delaminating: `${focusPart} is delaminating — bond between layers is failing under stress.`,
    cracked: `${focusPart} has developed fatigue cracks (${r(state.fatigue * 100)}% fatigue) under combined stress.`,
    leaking: `${focusPart} coating has failed (${r(state.coatingCoverage * 100)}% coverage). Contamination is penetrating.`,
    yielding: `${focusPart} is permanently deforming — stress (${r(state.stress * 100)}%) exceeds yield strength.`,
    strained: `${focusPart} is under significant strain (${r(state.stress * 100)}% stress).`,
  };

  return {
    description: descriptions[failureState.id] || `${focusPart} is in state: ${failureState.label}.`,
    metric: topCause?.id || null,
    metricValue: topCause?.weight || 0,
  };
}

// ── Level 2: Contributing Factors ────────────────────────────────────────────

function buildContributingFactors(state, secondaryCauses, events) {
  const factors = [];

  // From ranked secondary causes
  for (const cause of secondaryCauses) {
    if (cause.weight > 0.1) {
      factors.push({
        description: cause.label,
        weight: cause.weight,
        category: cause.id,
      });
    }
  }

  // Cross-system interactions (these are the interesting ones)
  if (state.temperature > 0.5 && state.fatigue > 0.3) {
    factors.push({
      description: 'Heat is accelerating fatigue crack growth. Elevated temperature makes atomic bonds weaker, so cracks propagate faster under each stress cycle.',
      weight: 0.4,
      category: 'cross_system',
    });
  }

  if (state.vibration > 0.5 && state.fatigue > 0.3) {
    factors.push({
      description: 'Vibration is driving fatigue accumulation. Each oscillation cycle adds micro-damage — this is the most common cause of structural failure in real engineering.',
      weight: 0.5,
      category: 'cross_system',
    });
  }

  if (state.coatingCoverage < 0.3 && state.temperature > 0.4) {
    factors.push({
      description: 'Exposed areas without coating are absorbing more heat, creating local hotspots that weaken the material.',
      weight: 0.3,
      category: 'cross_system',
    });
  }

  if (state.contamination > 0.3 && state.stress > 0.4) {
    factors.push({
      description: 'Contamination is weakening the material at a molecular level, reducing effective strength while the structure is under load.',
      weight: 0.35,
      category: 'cross_system',
    });
  }

  // Sort by weight
  factors.sort((a, b) => b.weight - a.weight);
  return factors.slice(0, 5);
}

// ── Level 3: Design Advice ───────────────────────────────────────────────────

function buildDesignAdvice(recommendations, state, materials) {
  const fixes = [];

  for (const rec of recommendations) {
    const fix = {
      action: rec.action,
      reason: rec.reason,
      priority: rec.priority,
      category: rec.category,
    };

    // Add material-specific suggestions
    if (rec.category === 'poor_material' && materials.length > 0) {
      const currentMat = materials[0];
      if (currentMat.properties.strength < 0.4) {
        fix.specific = `Current material (${currentMat.name}) has only ${r(currentMat.properties.strength * 100)}% strength. Consider steel (85%) or a composite.`;
      }
      if (currentMat.properties.fatigueResistance < 0.4) {
        fix.specific = `${currentMat.name} has low fatigue resistance (${r(currentMat.properties.fatigueResistance * 100)}%). Rubber or composites resist fatigue better.`;
      }
    }

    fixes.push(fix);
  }

  return fixes;
}

// ── Level 4: Tradeoff Warnings ───────────────────────────────────────────────

function buildTradeoffs(fixes, materials) {
  const tradeoffs = [];

  for (const fix of fixes) {
    const tradeoff = getTradeoffForFix(fix.category, materials);
    if (tradeoff) tradeoffs.push(tradeoff);
  }

  return tradeoffs;
}

function getTradeoffForFix(category, materials) {
  const tradeoffMap = {
    overload: {
      description: 'Reducing load or increasing cross-section adds weight, which slows the vehicle and increases energy consumption.',
      affects: ['weight', 'speed', 'efficiency'],
    },
    geometry_weakness: {
      description: 'Adding supports and bracing improves stability but adds weight and reduces interior space.',
      affects: ['weight', 'space'],
    },
    poor_material: {
      description: 'Stronger materials are typically heavier and more expensive. The strongest option isn\'t always the best — find the right balance.',
      affects: ['weight', 'cost'],
    },
    fatigue: {
      description: 'Fatigue-resistant materials (rubber, composites) are often less rigid. You may sacrifice stiffness for longevity.',
      affects: ['stiffness', 'rigidity'],
    },
    resonance: {
      description: 'Adding damping mass or changing geometry shifts the natural frequency, but may affect handling or aesthetics.',
      affects: ['weight', 'handling'],
    },
    thermal_mismatch: {
      description: 'Matching thermal expansion means limiting material choices. Expansion gaps add complexity and potential leak points.',
      affects: ['complexity', 'sealing'],
    },
    coating_failure: {
      description: 'Thicker coatings add weight and may reduce heat dissipation. Some coatings degrade in UV.',
      affects: ['weight', 'thermal'],
    },
    cross_system: {
      description: 'Cross-system fixes often involve tradeoffs across multiple domains. Test the full system, not just the individual component.',
      affects: ['complexity'],
    },
  };

  return tradeoffMap[category] || null;
}

// ── Summary Builder ──────────────────────────────────────────────────────────

function buildSummary(failureState, immediateCause, inspection) {
  if (failureState.severity === 0) {
    return `${inspection.name} is stable. All metrics within safe limits.`;
  }
  if (failureState.severity < 0.4) {
    return `${inspection.name} is under strain but operational. Monitor ${inspection.metrics?.weakestPart || 'weak points'}.`;
  }
  if (failureState.severity < 0.7) {
    return `${inspection.name}: ${failureState.label}. ${immediateCause.description} Action recommended.`;
  }
  return `${inspection.name}: ${failureState.label}! ${immediateCause.description} Immediate repair needed.`;
}

// ── Confidence Computation ───────────────────────────────────────────────────

function computeConfidence(events, causes, state) {
  let confidence = 0.5; // base

  // More events = more data = higher confidence
  confidence += Math.min(0.2, events.length * 0.03);

  // Clear dominant cause = higher confidence
  if (causes.length > 0 && causes[0].weight > 0.5) confidence += 0.15;

  // Extreme values are more certain
  if (state.stress > 0.8 || state.integrity < 0.2) confidence += 0.1;

  return Math.min(0.95, confidence);
}

// ── Build Preview Risk Assessment ────────────────────────────────────────────

/**
 * Assess risk of a build BEFORE deployment.
 * The assistant warns about problems before the player encounters them.
 *
 * @param {object} entity - structural object (may not have been simulated yet)
 * @param {object} [expectedLoads] - what loads the build will face
 * @returns {object} risk assessment with warnings and advice
 */
export function previewBuildRisk(entity, expectedLoads = {}) {
  const segments = entity.segments || [];

  let weakestIntegrity = 1;
  let maxStressRatio = 0;
  let thermalRisk = 0;
  let fatigueAccumulation = 0;
  let bondQualityMin = 1;

  for (const seg of segments) {
    weakestIntegrity = Math.min(weakestIntegrity, seg.state?.integrity || 1);
    fatigueAccumulation = Math.max(fatigueAccumulation, seg.state?.fatigue || 0);

    // Estimate stress from expected loads
    const expectedForce = expectedLoads.staticLoad || 0.3;
    const stressRatio = expectedForce / (seg.crossSection * (seg.matProps?.strength || 0.5));
    maxStressRatio = Math.max(maxStressRatio, stressRatio);

    // Thermal risk from environment
    const expectedTemp = expectedLoads.temperature || 0.3;
    const meltRatio = expectedTemp / Math.max(0.01, seg.matProps?.meltingPoint || 0.5);
    thermalRisk = Math.max(thermalRisk, meltRatio);

    // Bond quality
    bondQualityMin = Math.min(bondQualityMin, 1 - (seg.state?.bondStress || 0));
  }

  const risk = assessBuildRisk({
    weakestIntegrity,
    maxStressRatio,
    thermalRisk,
    fatigueAccumulation,
    bondQualityMin,
  });

  // Generate preview advice
  const advice = [];
  if (risk.riskLevel === 'high') {
    advice.push('This build has significant risk factors. Consider redesigning before deploying.');
  }
  if (maxStressRatio > 0.7) {
    advice.push(`Expected loads are at ${Math.round(maxStressRatio * 100)}% of material capacity. Leave more margin.`);
  }
  if (thermalRisk > 0.5) {
    advice.push('Operating temperature will stress the materials. Add thermal protection or use heat-resistant materials.');
  }

  return {
    ...risk,
    advice,
    preview: true,
    entityName: entity.name,
  };
}

// ── Live Warning Messages ────────────────────────────────────────────────────

/**
 * Generate a real-time warning message from a stress event.
 * Used for toast/HUD notifications during gameplay.
 *
 * @param {object} event - from stressSimulation event emitter
 * @returns {{ message, severity, icon, suggestion }}
 */
export function eventToWarning(event) {
  const suggestions = {
    STRESS_HIGH: 'Reduce speed or load to prevent structural damage.',
    STRESS_CRITICAL: 'Immediate danger! Stop and repair or the component will fail.',
    FATIGUE_RISING: 'Accumulated damage building up. Consider a rest stop for inspection.',
    RESONANCE_RISK: 'Change speed to break out of resonance. Vibration is amplifying.',
    THERMAL_EXPANSION_CONFLICT: 'Joints are stressed by heat differential. Slow down and let materials cool.',
    BOND_FAILURE_RISK: 'Connection weakening. Avoid sudden impacts.',
    COATING_FAILURE_POINT: 'Protective coating compromised. Environmental damage will accelerate.',
    CARGO_IMBALANCE: 'Cargo is shifting. Redistribute weight to center.',
    BUCKLE_STARTED: 'Structure is buckling! Reduce load immediately.',
    COMPONENT_FAILED: 'Component has failed. System performance degraded.',
  };

  return {
    message: event.message,
    severity: event.severity > 0.7 ? 'critical' : event.severity > 0.4 ? 'warning' : 'info',
    icon: event.icon,
    suggestion: suggestions[event.type] || 'Monitor the situation.',
    component: event.componentLabel,
    timestamp: event.timestamp,
  };
}

/**
 * Generate comparison between two builds.
 *
 * @param {object} entityA
 * @param {object} entityB
 * @returns {string[]} comparison points
 */
export function compareBuilds(entityA, entityB) {
  const inspA = getInspectionData(entityA);
  const inspB = getInspectionData(entityB);
  if (!inspA || !inspB) return ['Cannot compare — missing data.'];

  const points = [];
  const a = inspA.currentState;
  const b = inspB.currentState;

  if (a.integrity !== b.integrity) {
    const better = a.integrity > b.integrity ? inspA.name : inspB.name;
    points.push(`${better} has higher integrity (${Math.round(Math.max(a.integrity, b.integrity) * 100)}% vs ${Math.round(Math.min(a.integrity, b.integrity) * 100)}%).`);
  }

  if (Math.abs(a.stress - b.stress) > 0.1) {
    const safer = a.stress < b.stress ? inspA.name : inspB.name;
    points.push(`${safer} experiences less stress under the same load.`);
  }

  const weightA = inspA.metrics?.structureWeight || 0;
  const weightB = inspB.metrics?.structureWeight || 0;
  if (Math.abs(weightA - weightB) > 0.5) {
    const lighter = weightA < weightB ? inspA.name : inspB.name;
    points.push(`${lighter} is lighter (${Math.min(weightA, weightB).toFixed(1)} vs ${Math.max(weightA, weightB).toFixed(1)} units).`);
  }

  if (points.length === 0) points.push('Both builds have similar performance characteristics.');
  return points;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function r(v) { return Math.round(v * 100) / 100; }
