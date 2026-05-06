import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';
import { scoreFromResult } from '../reasoning/confidenceScoring';

export function evaluateBrakeCompatibility(bike: BikeProfile, product: ProductSpecs): CompatibilityResult | null {
  if (product.category !== 'brake') return null;

  const reasons: string[] = [];
  const warnings: string[] = [];
  const measurementsNeeded: string[] = [];

  if (product.rotorSize && product.rotorSize !== bike.brakes.rotorFront && product.rotorSize !== bike.brakes.rotorRear) {
    warnings.push(`Bike currently uses ${bike.brakes.rotorFront}/${bike.brakes.rotorRear}mm rotors; listing says ${product.rotorSize}mm.`);
  }

  if (product.mountType && product.mountType.toLowerCase() !== bike.brakes.mountType.toLowerCase()) {
    return {
      status: 'incompatible',
      confidence: 0.84,
      reasons: [`Brake mount mismatch: bike uses ${bike.brakes.mountType}, listing says ${product.mountType}.`],
      warnings,
      measurementsNeeded,
      educationalConcepts: ['Brake mount standards', 'Rotor diameter'],
    };
  }

  if (!product.mountType) {
    measurementsNeeded.push(`Confirm caliper mount type is ${bike.brakes.mountType}.`);
  } else {
    reasons.push(`Brake mount matches ${bike.brakes.mountType}.`);
  }

  const base: CompatibilityResult = {
    status: measurementsNeeded.length ? 'needs-verification' : 'likely-compatible',
    confidence: 0,
    reasons,
    warnings,
    measurementsNeeded,
    educationalConcepts: ['Brake mount standards', 'Rotor diameter'],
  };

  return { ...base, confidence: scoreFromResult(base, product.extractionConfidence || 0.6) };
}
