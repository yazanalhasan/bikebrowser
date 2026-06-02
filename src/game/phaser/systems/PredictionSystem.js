// Phase 1.3 — Predict-before-test.
// Captures the player's prediction (will this material hold the bridge load?)
// and confidence BEFORE a UTM test, then resolves it against the real test
// verdict so the player compares their reasoning to evidence. This is the
// reasoning substrate the Phase 1.7 reasoning grader builds on.
export class PredictionSystem {
  static carryForward = {
    environmentalPrimitives: ['hypothesis', 'evidence_result'],
    progressionPrimitives: ['prediction_made', 'prediction_resolved'],
    actScalingPath: 'Predict-before-test generalizes from materials to chemistry, thermal, fluid, and biology rigs.',
  };

  constructor() {
    this.predictions = new Map();
  }

  // willHold: boolean (player predicts the material is safe for bridge load).
  // confidence: 'low' | 'medium' | 'high'. explanation: optional player reasoning.
  record(subjectId, willHold, confidence = 'medium', explanation = '') {
    const prediction = {
      subjectId,
      willHold: Boolean(willHold),
      confidence: ['low', 'medium', 'high'].includes(confidence) ? confidence : 'medium',
      explanation: String(explanation || ''),
      resolved: false,
      actualSafe: null,
      correct: null,
    };
    this.predictions.set(subjectId, prediction);
    return prediction;
  }

  has(subjectId) {
    return this.predictions.has(subjectId);
  }

  // Resolve a prediction against the real outcome (actualSafe). Returns the
  // resolved prediction with `correct`, or null if no prediction was made.
  resolve(subjectId, actualSafe) {
    const prediction = this.predictions.get(subjectId);
    if (!prediction || prediction.resolved) return prediction || null;
    const resolved = {
      ...prediction,
      resolved: true,
      actualSafe: Boolean(actualSafe),
      correct: prediction.willHold === Boolean(actualSafe),
    };
    this.predictions.set(subjectId, resolved);
    return resolved;
  }

  getState() {
    const predictions = [...this.predictions.values()];
    const resolved = predictions.filter((p) => p.resolved);
    return {
      predictions,
      made: predictions.length,
      resolved: resolved.length,
      correct: resolved.filter((p) => p.correct).length,
      accuracy: resolved.length ? Number((resolved.filter((p) => p.correct).length / resolved.length).toFixed(2)) : null,
    };
  }

  loadState(state = {}) {
    this.predictions = new Map((state?.predictions || []).map((p) => [p.subjectId, p]));
  }
}
