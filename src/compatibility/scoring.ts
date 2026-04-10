import type { CompatibilityIssue, ProjectItem } from '../types/project';

export const scoreBuild = (items: ProjectItem[], results: CompatibilityIssue[]): number => {
  let score = 100;

  results.forEach((result) => {
    if (result.type === 'error') score -= 30;
    if (result.type === 'warning') score -= 10;
  });

  const battery = items.find((item) => item.category === 'battery');

  if ((battery?.specs?.voltage || 0) >= 48) {
    score += 10;
  }

  return Math.max(score, 0);
};

export default {
  scoreBuild,
};
