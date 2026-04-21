/**
 * Failure Math — root cause analysis, failure classification, and
 * recommendation generation.
 *
 * Used by both the stress simulation (to classify states) and the
 * failure assistant (to rank causes and generate advice).
 */

// ── Failure State Classification ─────────────────────────────────────────────

/**
 * Progressive failure states. Each has a threshold and description.
 * Order matters — checked from most severe to least.
 */
const FAILURE_STATES = [
  { id: 'catastrophic',    label: 'Catastrophic Failure', threshold: (s) => s.integrity <= 0, severity: 1.0, icon: '💥' },
  { id: 'buckling',        label: 'Buckling',             threshold: (s) => s.strain > 0.8 && s.stress > 0.7, severity: 0.9, icon: '📐' },
  { id: 'resonance_risk',  label: 'Resonance Risk',       threshold: (s) => s.vibration > 1.2, severity: 0.85, icon: '〰️' },
  { id: 'overheating',     label: 'Overheating',          threshold: (s) => s.temperature > 0.8, severity: 0.8, icon: '🔥' },
  { id: 'delaminating',    label: 'Delaminating',         threshold: (s) => s.bondStress > 0.7, severity: 0.75, icon: '📄' },
  { id: 'cracked',         label: 'Cracked',              threshold: (s) => s.fatigue > 0.7 && s.stress > 0.5, severity: 0.7, icon: '⚡' },
  { id: 'leaking',         label: 'Leaking',              threshold: (s) => s.coatingCoverage < 0.2 && s.contamination > 0.3, severity: 0.6, icon: '💧' },
  { id: 'yielding',        label: 'Yielding',             threshold: (s) => s.stress > 0.6 && s.strain > 0.3, severity: 0.5, icon: '↕️' },
  { id: 'strained',        label: 'Strained',             threshold: (s) => s.stress > 0.4, severity: 0.3, icon: '⚠️' },
  { id: 'stable',          label: 'Stable',               threshold: () => true, severity: 0, icon: '✅' },
];

/**
 * Classify the current failure state from dynamic metrics.
 *
 * @param {object} state - { integrity, stress, strain, fatigue, vibration, temperature, bondStress, coatingCoverage, contamination }
 * @returns {{ id, label, severity, icon }}
 */
export function classifyFailureState(state) {
  for (const fs of FAILURE_STATES) {
    if (fs.threshold(state)) {
      return { id: fs.id, label: fs.label, severity: fs.severity, icon: fs.icon };
    }
  }
  return FAILURE_STATES[FAILURE_STATES.length - 1]; // stable
}

/**
 * Get a status badge for display.
 */
export function getStatusBadge(state) {
  const fs = classifyFailureState(state);
  if (fs.severity === 0) return { label: 'Stable', color: 'green' };
  if (fs.severity < 0.4) return { label: 'Strained', color: 'yellow' };
  if (fs.severity < 0.7) return { label: fs.label, color: 'orange' };
  return { label: fs.label, color: 'red' };
}

// ── Root Cause Ranking ───────────────────────────────────────────────────────

/**
 * Weighted cause categories for root cause analysis.
 * Each category has a weight-computing function based on the current state.
 */
const CAUSE_CATEGORIES = {
  overload: {
    label: 'Overload — Force exceeds material strength',
    weight: (s) => Math.max(0, (s.stress || 0) - 0.5) * 2,
    fix: 'Reduce load, increase cross-section, or use a stronger material.',
  },
  geometry_weakness: {
    label: 'Geometry — Insufficient cross-section or support',
    weight: (s) => s.strain > 0.3 ? (s.strain - 0.3) * 1.5 : 0,
    fix: 'Widen the section, add supports, or use diagonal bracing.',
  },
  poor_material: {
    label: 'Material Choice — Wrong material for this application',
    weight: (s, ctx) => {
      let w = 0;
      if (ctx?.materialStrength < 0.3 && s.stress > 0.4) w += 0.5;
      if (ctx?.materialFatigue < 0.3 && s.fatigue > 0.4) w += 0.4;
      return w;
    },
    fix: 'Choose a material with higher strength or fatigue resistance for this role.',
  },
  weak_bonding: {
    label: 'Bond Failure — Poor connection between components',
    weight: (s) => (s.bondStress || 0) > 0.5 ? (s.bondStress - 0.5) * 2 : 0,
    fix: 'Improve bonding: use a better matrix, add adhesive, or use mechanical fasteners.',
  },
  thermal_mismatch: {
    label: 'Thermal Mismatch — Different expansion rates at joints',
    weight: (s) => (s.thermalStress || 0) > 0.3 ? (s.thermalStress - 0.3) * 1.5 : 0,
    fix: 'Use materials with similar expansion coefficients, or add expansion gaps.',
  },
  fatigue: {
    label: 'Fatigue — Cumulative damage from repeated stress',
    weight: (s) => s.fatigue > 0.4 ? (s.fatigue - 0.4) * 1.5 : 0,
    fix: 'Use a fatigue-resistant material, reduce cyclic loads, or add damping.',
  },
  resonance: {
    label: 'Resonance — Vibration amplification near natural frequency',
    weight: (s) => s.vibration > 0.8 ? (s.vibration - 0.8) * 3 : 0,
    fix: 'Change mass distribution to shift natural frequency, or add damping material.',
  },
  imbalance: {
    label: 'Imbalance — Uneven load distribution',
    weight: (s) => (s.tiltAngle || 0) > 10 ? ((s.tiltAngle - 10) / 80) * 1.5 : 0,
    fix: 'Redistribute cargo toward center. Lower the center of gravity.',
  },
  contamination: {
    label: 'Contamination — Chemical or biological weakening',
    weight: (s) => (s.contamination || 0) > 0.3 ? (s.contamination - 0.3) * 1.2 : 0,
    fix: 'Clean with surfactant, apply antimicrobial coating, or use resistant materials.',
  },
  coating_failure: {
    label: 'Coating Failure — Protective layer compromised',
    weight: (s) => s.coatingCoverage !== undefined && s.coatingCoverage < 0.3 ? (0.3 - s.coatingCoverage) * 1.5 : 0,
    fix: 'Reapply coating with better coverage. Use a more durable coating material.',
  },
};

/**
 * Rank root causes by weight for a given state.
 *
 * @param {object} state - dynamic state metrics
 * @param {object} [context] - additional context (material properties, build choices)
 * @returns {object[]} ranked causes, highest weight first
 */
export function rankRootCauses(state, context = {}) {
  return Object.entries(CAUSE_CATEGORIES)
    .map(([id, cat]) => ({
      id,
      label: cat.label,
      weight: Math.round(cat.weight(state, context) * 100) / 100,
      fix: cat.fix,
    }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

// ── Recommendation Generation ────────────────────────────────────────────────

/**
 * Generate specific recommendations based on current state and causes.
 *
 * @param {object} state
 * @param {object[]} rankedCauses - from rankRootCauses
 * @param {object} [context] - material info, build info
 * @returns {object[]} recommendations with priority
 */
export function generateRecommendations(state, rankedCauses, context = {}) {
  const recs = [];

  // From ranked causes
  for (const cause of rankedCauses.slice(0, 3)) {
    recs.push({
      priority: cause.weight > 0.5 ? 'high' : 'medium',
      action: cause.fix,
      reason: cause.label,
      category: cause.id,
    });
  }

  // Cross-system recommendations
  if (state.stress > 0.5 && state.coatingCoverage < 0.5) {
    recs.push({
      priority: 'medium',
      action: 'Apply protective coating to reduce environmental stress on exposed areas.',
      reason: 'High stress combined with low coating coverage accelerates degradation.',
      category: 'cross_system',
    });
  }

  if (state.temperature > 0.6 && (state.fatigue || 0) > 0.3) {
    recs.push({
      priority: 'high',
      action: 'Add heat-resistant material or thermal insulation. Heat accelerates fatigue crack growth.',
      reason: 'Thermal + fatigue interaction — heat makes fatigued material fail faster.',
      category: 'cross_system',
    });
  }

  if (state.vibration > 0.6 && (state.fatigue || 0) > 0.4) {
    recs.push({
      priority: 'high',
      action: 'Add damping to reduce vibration. Vibration-driven fatigue is the #1 cause of structural failure.',
      reason: 'Vibration + fatigue synergy — each vibration cycle adds micro-damage.',
      category: 'cross_system',
    });
  }

  return recs;
}

/**
 * Compute a risk score for a build BEFORE deployment.
 *
 * @param {object} buildState - pre-deployment build metrics
 * @returns {{ riskScore, riskLevel, warnings }}
 */
export function assessBuildRisk(buildState) {
  const warnings = [];
  let risk = 0;

  if (buildState.weakestIntegrity < 0.7) {
    risk += 0.3;
    warnings.push('Some components have reduced integrity. Repair or replace before deployment.');
  }
  if (buildState.maxStressRatio > 0.7) {
    risk += 0.25;
    warnings.push('Expected loads are close to material limits. Consider reinforcement.');
  }
  if (buildState.thermalRisk > 0.5) {
    risk += 0.2;
    warnings.push('Thermal stress expected in operating conditions. Add insulation or heat-resistant materials.');
  }
  if (buildState.fatigueAccumulation > 0.3) {
    risk += 0.15;
    warnings.push('Existing fatigue damage. This structure has been stressed before.');
  }
  if (buildState.bondQualityMin < 0.4) {
    risk += 0.2;
    warnings.push('Weak bond detected between components. Improve connection or use compatible materials.');
  }

  const riskLevel = risk > 0.6 ? 'high' : risk > 0.3 ? 'moderate' : 'low';
  return { riskScore: Math.min(1, Math.round(risk * 100) / 100), riskLevel, warnings };
}

/** Export the failure states for UI use. */
export function getFailureStates() {
  return FAILURE_STATES.map((fs) => ({ id: fs.id, label: fs.label, severity: fs.severity, icon: fs.icon }));
}
