import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';

export function evaluateElectricalCompatibility(bike: BikeProfile, product: ProductSpecs): CompatibilityResult | null {
  if (!bike.electrical || product.category !== 'electrical') return null;

  return {
    status: 'needs-verification',
    confidence: 0.45,
    reasons: [],
    warnings: ['Electrical compatibility needs voltage, connector, and controller current metadata.'],
    measurementsNeeded: ['Confirm battery voltage and controller max current.'],
    educationalConcepts: ['Voltage matching', 'Current limits'],
  };
}
