import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';

export function evaluateFrameCompatibility(bike: BikeProfile, product: ProductSpecs): CompatibilityResult | null {
  if (product.category !== 'seatpost') return null;

  if (product.seatpostDiameter && product.seatpostDiameter !== bike.frame.seatpostDiameter) {
    return {
      status: 'incompatible',
      confidence: 0.92,
      reasons: [`Seatpost diameter mismatch: bike requires ${bike.frame.seatpostDiameter}mm, listing says ${product.seatpostDiameter}mm.`],
      warnings: [],
      measurementsNeeded: [],
      educationalConcepts: ['Seatpost diameter', 'Frame insertion depth'],
    };
  }

  return {
    status: product.seatpostDiameter ? 'compatible' : 'needs-verification',
    confidence: product.seatpostDiameter ? 0.9 : 0.5,
    reasons: product.seatpostDiameter ? [`Seatpost diameter matches ${bike.frame.seatpostDiameter}mm.`] : [],
    warnings: [],
    measurementsNeeded: product.seatpostDiameter ? [] : [`Measure seatpost diameter; this bike uses ${bike.frame.seatpostDiameter}mm.`],
    educationalConcepts: ['Seatpost diameter', 'Frame insertion depth'],
  };
}
