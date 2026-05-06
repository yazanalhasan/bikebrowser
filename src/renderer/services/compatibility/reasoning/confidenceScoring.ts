import type { CompatibilityResult } from '../bikeProfiles/schema';

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function scoreFromResult(result: CompatibilityResult, extractionConfidence = 0.7): number {
  const base = {
    compatible: 0.9,
    'likely-compatible': 0.72,
    'needs-verification': 0.48,
    incompatible: 0.88,
  }[result.status];

  const missingPenalty = Math.min(0.25, result.measurementsNeeded.length * 0.08);
  return clampConfidence((base * 0.75) + (extractionConfidence * 0.25) - missingPenalty);
}
