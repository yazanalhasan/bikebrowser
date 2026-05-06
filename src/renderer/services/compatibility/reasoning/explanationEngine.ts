import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';

export function explainCompatibility(
  bike: BikeProfile,
  product: ProductSpecs,
  result: CompatibilityResult
): string {
  const subject = product.title || product.category || 'This part';
  const firstReason = result.reasons[0] || result.warnings[0] || 'The listing does not expose enough standards metadata.';

  if (result.status === 'incompatible') {
    return `${subject} is incompatible with ${bike.name || bike.id}. ${firstReason}`;
  }

  if (result.status === 'needs-verification') {
    return `${subject} needs verification before purchase. ${result.measurementsNeeded[0] || firstReason}`;
  }

  if (result.status === 'likely-compatible') {
    return `${subject} is likely compatible, but verify the listing details. ${firstReason}`;
  }

  return `${subject} is compatible based on the extracted standards. ${firstReason}`;
}

export function buildReasoningTrace(result: CompatibilityResult) {
  return [
    ...result.reasons.map((message) => ({ type: 'reason', message })),
    ...result.warnings.map((message) => ({ type: 'warning', message })),
    ...result.measurementsNeeded.map((message) => ({ type: 'measurement', message })),
  ];
}

export default {
  explainCompatibility,
  buildReasoningTrace,
};
