import { evaluateHandwritingAttempt } from '../engine/handwritingEngine.js';

export async function recognizeHandwritingLocally({ strokes, target, mode }) {
  const result = evaluateHandwritingAttempt({ strokes, target, mode, recognizedAs: target });
  return {
    text: target,
    confidence: Math.max(0.2, Math.min(0.95, result.analysis.overlap)),
    latencyMs: 0,
    source: 'local-shape',
    result,
  };
}
