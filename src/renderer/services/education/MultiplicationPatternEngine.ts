export const MULTIPLICATION_PATTERN_ORDER = [1, 2, 10, 5, 9, 11, 3, 4, 6, 7, 8, 12];

export type MultiplicationPatternType =
  | 'identity'
  | 'doubling'
  | 'skip-counting'
  | 'decomposition'
  | 'symmetry'
  | 'rotational'
  | 'array-geometry'
  | 'engineering-multiplier';

export interface MultiplicationPattern {
  factorA: number;
  factorB: number;
  product: number;
  family: string;
  primaryType: MultiplicationPatternType;
  visualModel: string;
  explanation: string;
  decomposition?: Array<{ factorA: number; factorB: number; product: number }>;
  patternClues: string[];
}

function familyFor(factorA: number, factorB: number): number {
  const candidates = [factorA, factorB].filter((factor) => MULTIPLICATION_PATTERN_ORDER.includes(factor));
  return candidates.sort((left, right) => MULTIPLICATION_PATTERN_ORDER.indexOf(left) - MULTIPLICATION_PATTERN_ORDER.indexOf(right))[0] || factorA;
}

export function describeMultiplicationPattern(factorA: number, factorB: number): MultiplicationPattern {
  const product = factorA * factorB;
  const family = familyFor(factorA, factorB);
  const other = factorA === family ? factorB : factorA;

  if (family === 1) {
    return {
      factorA,
      factorB,
      product,
      family: '1s',
      primaryType: 'identity',
      visualModel: 'single-copy',
      explanation: 'One group keeps the amount unchanged.',
      patternClues: ['identity', 'one copy'],
    };
  }

  if ([2, 4, 8].includes(family)) {
    const doubles = family === 2 ? 1 : family === 4 ? 2 : 3;
    return {
      factorA,
      factorB,
      product,
      family: `${family}s`,
      primaryType: 'doubling',
      visualModel: 'doubling',
      explanation: `${family} x ${other} can be built by doubling ${other} ${doubles} time${doubles === 1 ? '' : 's'}.`,
      patternClues: ['double', 'recursive growth', 'power-of-two structure'],
    };
  }

  if (family === 9) {
    return {
      factorA,
      factorB,
      product,
      family: '9s',
      primaryType: 'symmetry',
      visualModel: 'digit-heatmap',
      explanation: 'The tens digit climbs while the ones digit falls, and the digits add to 9.',
      patternClues: ['digit sum 9', 'mirrored digits', 'finger math'],
    };
  }

  if (family === 12) {
    return {
      factorA,
      factorB,
      product,
      family: '12s',
      primaryType: 'rotational',
      visualModel: 'clock-rotation',
      explanation: 'Twelves behave like clock and wheel rotations: repeated jumps around a circle.',
      patternClues: ['clock mechanics', 'rotational systems', 'dozen structure'],
    };
  }

  if ([6, 7].includes(family)) {
    const easyPart = family === 7 ? 5 : 3;
    const remainder = family - easyPart;
    return {
      factorA,
      factorB,
      product,
      family: `${family}s`,
      primaryType: 'decomposition',
      visualModel: 'split-and-merge',
      explanation: `${family} x ${other} breaks into ${easyPart} x ${other} plus ${remainder} x ${other}.`,
      decomposition: [
        { factorA: easyPart, factorB: other, product: easyPart * other },
        { factorA: remainder, factorB: other, product: remainder * other },
      ],
      patternClues: ['break apart', 'known facts', 'merge partial products'],
    };
  }

  if ([3, 5, 10, 11].includes(family)) {
    return {
      factorA,
      factorB,
      product,
      family: `${family}s`,
      primaryType: 'skip-counting',
      visualModel: family === 5 ? 'clock-five-jumps' : 'grouped-array',
      explanation: `${family}s are strong skip-counting patterns with visible groups.`,
      patternClues: family === 11 ? ['repeat digits', 'mirror'] : ['skip count', 'rhythm', 'groups'],
    };
  }

  return {
    factorA,
    factorB,
    product,
    family: `${family}s`,
    primaryType: 'array-geometry',
    visualModel: 'array',
    explanation: 'Build the product as rows, columns, and mirrored arrays.',
    patternClues: ['rows', 'columns', 'commutative mirror'],
  };
}

export function createMultiplicationQuestion(factorA: number, factorB: number) {
  const pattern = describeMultiplicationPattern(factorA, factorB);
  return {
    ...pattern,
    expression: `${factorA} x ${factorB}`,
    answer: pattern.product,
    skillId: `multiplication.${factorA}x${factorB}`,
    reflectionPrompt: pattern.primaryType === 'decomposition'
      ? 'How can you split this into facts you already know?'
      : 'What pattern do you see?',
  };
}

export function createPatternSequence({ family = 2, anchor = 4, length = 4 }: { family?: number; anchor?: number; length?: number } = {}) {
  if ([2, 4, 8].includes(family)) {
    const sequence = [2, 4, 8].map((factor, index) => ({
      ...createMultiplicationQuestion(factor, anchor),
      reflectionPrompt: index === 2 ? 'What pattern changed?' : 'How did the group double?',
    }));
    return [...sequence, createMultiplicationQuestion(6, 7)].slice(0, length);
  }

  if (family === 7) {
    return [
      createMultiplicationQuestion(5, 7),
      createMultiplicationQuestion(1, 7),
      createMultiplicationQuestion(6, 7),
      createMultiplicationQuestion(7, 8),
    ].slice(0, length);
  }

  return Array.from({ length }, (_, index) => createMultiplicationQuestion(family, index + 1));
}
