export interface MistakeRecord {
  factorA: number;
  factorB: number;
  answer: number;
  correctAnswer: number;
  reactionTimeMs: number;
}

export function analyzeMistakes(mistakes: MistakeRecord[]) {
  const weaknesses = new Set<string>();
  const recommendedPatterns = new Set<string>();
  const highTableMisses = mistakes.filter((item) => item.factorA >= 6 || item.factorB >= 6);
  const slowMisses = mistakes.filter((item) => item.reactionTimeMs > 4500);
  const pairs = new Set(mistakes.map((item) => `${item.factorA}x${item.factorB}`));

  if (highTableMisses.length >= 2) {
    weaknesses.add('high-table weakness');
    recommendedPatterns.add('5+2 decomposition');
    recommendedPatterns.add('double-the-doubles');
  }
  if (slowMisses.length >= 2) {
    weaknesses.add('decomposition weakness');
    recommendedPatterns.add('split into known facts');
  }
  for (const item of mistakes) {
    if (pairs.has(`${item.factorB}x${item.factorA}`) && item.factorA !== item.factorB) {
      weaknesses.add('mirrored fact confusion');
      recommendedPatterns.add('commutative mirroring');
    }
  }

  return {
    weaknesses: [...weaknesses],
    recommendedPatterns: [...recommendedPatterns],
    focusFacts: mistakes.map((item) => `${item.factorA}x${item.factorB}`),
  };
}
