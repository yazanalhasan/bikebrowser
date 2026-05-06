import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';
import { extractProductSpecs } from '../extraction/productSpecExtractor';
import { evaluateBrakeCompatibility } from '../rules/brakeRules';
import { evaluateCockpitCompatibility } from '../rules/cockpitRules';
import { evaluateDrivetrainCompatibility } from '../rules/drivetrainRules';
import { evaluateElectricalCompatibility } from '../rules/electricalRules';
import { evaluateFrameCompatibility } from '../rules/frameRules';
import { evaluateWheelCompatibility } from '../rules/wheelRules';

const RULES = [
  evaluateDrivetrainCompatibility,
  evaluateBrakeCompatibility,
  evaluateWheelCompatibility,
  evaluateCockpitCompatibility,
  evaluateFrameCompatibility,
  evaluateElectricalCompatibility,
];

function needsVerification(product: ProductSpecs): CompatibilityResult {
  return {
    status: 'needs-verification',
    confidence: 0.38,
    reasons: ['No deterministic compatibility rule matched this product category yet.'],
    warnings: ['The system needs more structured metadata before it can make a standards-based decision.'],
    measurementsNeeded: ['Confirm part category and key mechanical standard from the listing.'],
    educationalConcepts: ['Mechanical standards', 'Measurement discipline'],
  };
}

export function evaluateProductCompatibility(
  bike: BikeProfile,
  productOrListing: ProductSpecs | string
): CompatibilityResult {
  const product = typeof productOrListing === 'string'
    ? extractProductSpecs(productOrListing)
    : productOrListing;

  for (const rule of RULES) {
    const result = rule(bike, product);
    if (result) {
      return result;
    }
  }

  return needsVerification(product);
}

export function evaluateManyProducts(bike: BikeProfile, products: ProductSpecs[]): Array<ProductSpecs & { compatibility: CompatibilityResult }> {
  return products.map((product) => ({
    ...product,
    compatibility: evaluateProductCompatibility(bike, product),
  }));
}

export default {
  evaluateProductCompatibility,
  evaluateManyProducts,
};
