import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';

export function evaluateCockpitCompatibility(bike: BikeProfile, product: ProductSpecs): CompatibilityResult | null {
  if (product.category !== 'cockpit') return null;

  const clamp = product.handlebarClamp || product.stemClamp;
  if (clamp && clamp !== bike.cockpit.handlebarClamp) {
    return {
      status: 'incompatible',
      confidence: 0.86,
      reasons: [`Cockpit clamp mismatch: bike uses ${bike.cockpit.handlebarClamp}, listing says ${clamp}.`],
      warnings: [],
      measurementsNeeded: [],
      educationalConcepts: ['Clamp diameter', 'Cockpit fit'],
    };
  }

  return {
    status: clamp ? 'compatible' : 'needs-verification',
    confidence: clamp ? 0.88 : 0.48,
    reasons: clamp ? [`Clamp diameter matches ${bike.cockpit.handlebarClamp}.`] : [],
    warnings: [],
    measurementsNeeded: clamp ? [] : [`Confirm clamp diameter is ${bike.cockpit.handlebarClamp}.`],
    educationalConcepts: ['Clamp diameter', 'Cockpit fit'],
  };
}
