import type { BikeProfile } from './schema';
import { ozarkTrailM2RidgePro } from './ozarkTrailM2RidgePro.js';

const PROFILES: Record<string, BikeProfile> = {
  [ozarkTrailM2RidgePro.id]: ozarkTrailM2RidgePro as BikeProfile,
};

export function loadBikeProfile(profileId = 'ozark-trail-m2-ridge-pro'): BikeProfile {
  return PROFILES[profileId] || PROFILES['ozark-trail-m2-ridge-pro'];
}

export function listBikeProfiles(): BikeProfile[] {
  return Object.values(PROFILES);
}

export function getDefaultBikeProfile(): BikeProfile {
  return loadBikeProfile('ozark-trail-m2-ridge-pro');
}

export default {
  loadBikeProfile,
  listBikeProfiles,
  getDefaultBikeProfile,
};
