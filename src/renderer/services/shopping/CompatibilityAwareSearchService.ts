import type { BikeProfile, ProductSpecs } from '../compatibility/bikeProfiles/schema';
import { getDefaultBikeProfile } from '../compatibility/bikeProfiles/profileLoader';
import { extractProductSpecs } from '../compatibility/extraction/productSpecExtractor';
import { evaluateProductCompatibility } from '../compatibility/reasoning/compatibilityEngine';

function normalizeQuery(query: string): string {
  return String(query || '').trim().toLowerCase();
}

function isRearDerailleurQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return normalized.includes('derailleur') || normalized.includes('rear mech');
}

function isChainQuery(query: string): boolean {
  return normalizeQuery(query).includes('chain');
}

function isBrakeQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return normalized.includes('brake') || normalized.includes('rotor');
}

function isWheelQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return normalized.includes('wheel') || normalized.includes('hub');
}

export function buildCompatibilityAwareQuery(query: string, bike: BikeProfile = getDefaultBikeProfile()): string {
  const normalized = normalizeQuery(query);

  if (isRearDerailleurQuery(normalized)) {
    return [
      'rear derailleur',
      'Shimano CUES',
      'LINKGLIDE',
      `${bike.drivetrain.speeds}-speed`,
      bike.drivetrain.cassetteRange,
      'long cage',
      'MTB',
    ].join(' ');
  }

  if (isChainQuery(normalized)) {
    return [
      'bike chain',
      'Shimano CUES',
      'LINKGLIDE',
      `${bike.drivetrain.speeds}-speed`,
    ].join(' ');
  }

  if (isBrakeQuery(normalized)) {
    return [
      'mountain bike brake',
      bike.brakes.type,
      `${bike.brakes.rotorFront}mm rotor`,
      bike.brakes.mountType,
    ].join(' ');
  }

  if (isWheelQuery(normalized)) {
    return [
      `${bike.frame.wheelSize} inch MTB wheel`,
      bike.frame.rearSpacing,
      bike.frame.frontSpacing,
      'thru axle',
    ].join(' ');
  }

  if (normalized.includes('seatpost') || normalized.includes('dropper')) {
    return [`${bike.frame.seatpostDiameter}mm`, 'dropper seatpost', 'mountain bike'].join(' ');
  }

  if (normalized.includes('handlebar') || normalized.includes('stem')) {
    return [`${bike.cockpit.handlebarClamp}`, 'mountain bike cockpit'].join(' ');
  }

  return `bicycle ${normalized}`.trim();
}

export function evaluateListingForBike(product: ProductSpecs | string, bike: BikeProfile = getDefaultBikeProfile()) {
  const specs = typeof product === 'string' ? extractProductSpecs(product) : product;
  return {
    specs,
    compatibility: evaluateProductCompatibility(bike, specs),
  };
}

export default {
  buildCompatibilityAwareQuery,
  evaluateListingForBike,
};
