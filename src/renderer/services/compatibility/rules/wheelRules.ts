import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';

export function evaluateWheelCompatibility(bike: BikeProfile, product: ProductSpecs): CompatibilityResult | null {
  if (product.category !== 'wheel') return null;

  const reasons: string[] = [];
  const measurementsNeeded: string[] = [];

  if (product.rearSpacing && product.rearSpacing !== bike.frame.rearSpacing) {
    return {
      status: 'incompatible',
      confidence: 0.88,
      reasons: [`Rear hub spacing mismatch: bike needs ${bike.frame.rearSpacing}, listing says ${product.rearSpacing}.`],
      warnings: [],
      measurementsNeeded: [],
      educationalConcepts: ['Boost hub spacing', 'Thru axle standards'],
    };
  }

  if (!product.rearSpacing && !product.frontSpacing) {
    measurementsNeeded.push(`Confirm hub spacing: rear ${bike.frame.rearSpacing}, front ${bike.frame.frontSpacing}.`);
  } else {
    reasons.push('Listed hub spacing matches known Boost frame spacing.');
  }

  return {
    status: measurementsNeeded.length ? 'needs-verification' : 'compatible',
    confidence: measurementsNeeded.length ? 0.48 : 0.88,
    reasons,
    warnings: [],
    measurementsNeeded,
    educationalConcepts: ['Boost hub spacing', 'Thru axle standards'],
  };
}
