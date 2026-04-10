import type { CompatibilityIssue, ProjectItem } from '../types/project';
import { compatibilityRules } from './rules';

export const runCompatibilityCheck = (items: ProjectItem[]): CompatibilityIssue[] => {
  const results: CompatibilityIssue[] = [];

  const battery = items.find((item) => item.category === 'battery');
  const controller = items.find((item) => item.category === 'controller');
  const motor = items.find((item) => item.category === 'motor');

  compatibilityRules.forEach((rule) => {
    const result = rule.check(battery, controller) || rule.check(motor, controller);

    if (result) {
      results.push({
        rule: rule.name,
        ...result,
      });
    }
  });

  return results;
};

export const summarizeCompatibility = (results: CompatibilityIssue[]) => {
  return {
    errors: results.filter((result) => result.type === 'error'),
    warnings: results.filter((result) => result.type === 'warning'),
    isValid: results.every((result) => result.type !== 'error'),
  };
};

export default {
  runCompatibilityCheck,
  summarizeCompatibility,
};
