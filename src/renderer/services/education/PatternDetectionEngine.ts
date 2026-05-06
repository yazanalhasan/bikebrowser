export function detectPatternSignals({ factorA, factorB, reactionTimeMs = 0, usedDecomposition = false }: {
  factorA: number;
  factorB: number;
  reactionTimeMs?: number;
  usedDecomposition?: boolean;
}) {
  const signals = [];
  if (factorA === factorB) signals.push('square symmetry');
  if ([2, 4, 8].includes(factorA) || [2, 4, 8].includes(factorB)) signals.push('doubling pattern');
  if (factorA === 9 || factorB === 9) signals.push('9s digit pattern');
  if (usedDecomposition) signals.push('decomposition reasoning');
  if (reactionTimeMs < 1800) signals.push('rapid recall');
  return signals;
}
