import type { CompatibilityIssue, ProjectItem } from '../types/project';
import { selectRuleInputs } from './pairing';
import { compatibilityRules } from './rules';

export const runCompatibilityCheck = (items: ProjectItem[]): CompatibilityIssue[] => {
  const results: CompatibilityIssue[] = [];

  compatibilityRules.forEach((rule) => {
    const { a, b } = selectRuleInputs(rule.pair, items);
    const result = rule.check(a, b);

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
