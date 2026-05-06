import type { BikeProfile, CompatibilityResult, ProductSpecs } from '../bikeProfiles/schema';
import { maxCassetteTooth } from '../extraction/normalization';
import { scoreFromResult } from '../reasoning/confidenceScoring';

function result(
  status: CompatibilityResult['status'],
  reasons: string[],
  warnings: string[] = [],
  measurementsNeeded: string[] = [],
  educationalConcepts: string[] = []
): CompatibilityResult {
  const base: CompatibilityResult = {
    status,
    confidence: 0,
    reasons,
    warnings,
    measurementsNeeded,
    educationalConcepts,
  };
  return {
    ...base,
    confidence: scoreFromResult(base),
  };
}

export function evaluateRearDerailleur(bike: BikeProfile, product: ProductSpecs): CompatibilityResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const measurementsNeeded: string[] = [];
  const educationalConcepts = ['Cable pull ratio', 'Cassette range', 'Chain wrap capacity', 'Indexing'];
  const bikeFamily = bike.drivetrain.family.toLowerCase();
  const bikeMaxCog = maxCassetteTooth(bike.drivetrain.cassetteRange);

  if (!product.pullRatio) {
    measurementsNeeded.push('Confirm derailleur cable pull family: LINKGLIDE/CUES vs Hyperglide vs SRAM.');
  } else if (bikeFamily.includes('linkglide') && product.pullRatio !== 'LINKGLIDE') {
    reasons.push('Cable pull ratio mismatch with LINKGLIDE drivetrain.');
    reasons.push(`Your bike uses ${bike.drivetrain.family}; this listing appears to use ${product.pullRatio}.`);
  } else {
    reasons.push(`Pull ratio matches the ${bike.drivetrain.family} drivetrain.`);
  }

  if (!product.speeds) {
    measurementsNeeded.push(`Confirm the derailleur supports ${bike.drivetrain.speeds}-speed indexing.`);
  } else if (product.speeds !== bike.drivetrain.speeds) {
    reasons.push(`Speed mismatch: bike is ${bike.drivetrain.speeds}-speed, listing is ${product.speeds}-speed.`);
  } else {
    reasons.push(`${product.speeds}-speed indexing matches the bike.`);
  }

  if (!product.maxCogTeeth) {
    measurementsNeeded.push(`Confirm max cassette sprocket is at least ${bikeMaxCog || 'the bike cassette max'}T.`);
  } else if (bikeMaxCog && product.maxCogTeeth < bikeMaxCog) {
    reasons.push(`Cassette capacity mismatch: bike has ${bike.drivetrain.cassetteRange}, listing supports up to ${product.maxCogTeeth}T.`);
  } else {
    reasons.push(`Cassette capacity covers the bike's ${bike.drivetrain.cassetteRange} range.`);
  }

  if (!product.cage) {
    warnings.push('Cage length is not visible in the listing.');
    measurementsNeeded.push('Confirm long cage or capacity rating for 11-46T cassette.');
  } else if (product.cage !== 'long' && bikeMaxCog && bikeMaxCog >= 46) {
    reasons.push('Cage length may be too short for an 11-46T wide-range cassette.');
  } else {
    reasons.push('Long cage supports wide-range MTB cassette movement.');
  }

  const incompatible = reasons.some((reason) => /mismatch|too short/i.test(reason));
  if (incompatible) {
    return result('incompatible', reasons, warnings, measurementsNeeded, educationalConcepts);
  }

  if (measurementsNeeded.length > 0) {
    return result('needs-verification', reasons, warnings, measurementsNeeded, educationalConcepts);
  }

  return result('compatible', reasons, warnings, measurementsNeeded, educationalConcepts);
}

export function evaluateDrivetrainCompatibility(bike: BikeProfile, product: ProductSpecs): CompatibilityResult | null {
  if (product.category === 'rear-derailleur') {
    return evaluateRearDerailleur(bike, product);
  }

  return null;
}

export default {
  evaluateRearDerailleur,
  evaluateDrivetrainCompatibility,
};
