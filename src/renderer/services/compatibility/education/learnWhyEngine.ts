import type { CompatibilityResult } from '../bikeProfiles/schema';
import { ENGINEERING_CONCEPTS } from './engineeringConcepts';

export function buildLearnWhy(result: CompatibilityResult) {
  return result.educationalConcepts.map((concept) => ({
    concept,
    ...(ENGINEERING_CONCEPTS[concept as keyof typeof ENGINEERING_CONCEPTS] || {
      title: concept,
      summary: 'This mechanical standard affects whether parts work together safely.',
    }),
  }));
}

export default {
  buildLearnWhy,
};
