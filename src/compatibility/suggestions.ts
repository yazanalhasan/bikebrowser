import type { CompatibilityIssue, ProjectItem } from '../types/project';

type Suggestion = {
  message: string;
  targetCategory: string;
};

export const generateSuggestions = (_items: ProjectItem[], issues: CompatibilityIssue[]): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  issues.forEach((issue) => {
    if (issue.rule === 'Voltage Match') {
      suggestions.push({
        message: 'Replace controller with matching voltage',
        targetCategory: 'controller',
      });
    }

    if (issue.rule === 'Controller Current Limit') {
      suggestions.push({
        message: 'Upgrade battery to higher discharge current',
        targetCategory: 'battery',
      });
    }

    if (issue.rule === 'Motor Power Compatibility') {
      suggestions.push({
        message: 'Use higher power controller or lower power motor',
        targetCategory: 'controller',
      });
    }
  });

  return suggestions;
};

export default {
  generateSuggestions,
};
