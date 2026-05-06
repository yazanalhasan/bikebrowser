import type { BikeProfile, ProductSpecs } from '../bikeProfiles/schema';
import { evaluateProductCompatibility } from './compatibilityEngine';

const DEPENDENCIES: Record<string, string[]> = {
  cassette: ['rear-derailleur', 'chain', 'chainline', 'b-gap', 'chain-wrap-capacity'],
  'rear-derailleur': ['shifter', 'cassette', 'chain', 'hanger'],
  wheel: ['frame-spacing', 'brakes', 'tires'],
  brake: ['rotor', 'mount', 'lever'],
  seatpost: ['frame-insertion-depth', 'saddle-height'],
};

export function getAffectedSystems(componentCategory: string): string[] {
  return DEPENDENCIES[componentCategory] || [];
}

export function propagateConstraints(bike: BikeProfile, changedProduct: ProductSpecs) {
  const category = changedProduct.category || 'general';
  return {
    changedCategory: category,
    affectedSystems: getAffectedSystems(category),
    compatibility: evaluateProductCompatibility(bike, changedProduct),
  };
}

export default {
  getAffectedSystems,
  propagateConstraints,
};
