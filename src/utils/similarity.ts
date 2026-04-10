type SimilarItem = {
  category?: string;
  name?: string;
  specs?: Record<string, unknown>;
};

function tokenize(value: string): string[] {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function jaccard(left: string[], right: string[]): number {
  if (!left.length && !right.length) {
    return 1;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function flattenSpecs(specs: Record<string, unknown> | undefined): string[] {
  if (!specs || typeof specs !== 'object') {
    return [];
  }

  const tokens: string[] = [];
  Object.entries(specs).forEach(([key, value]) => {
    tokens.push(...tokenize(key));
    if (value == null) {
      return;
    }

    if (typeof value === 'object') {
      tokens.push(...flattenSpecs(value as Record<string, unknown>));
      return;
    }

    tokens.push(...tokenize(String(value)));
  });

  return tokens;
}

export const getItemSimilarityScore = (a: SimilarItem, b: SimilarItem): number => {
  const categoryMatch =
    String(a?.category || '').toLowerCase().trim() !== '' &&
    String(a?.category || '').toLowerCase().trim() === String(b?.category || '').toLowerCase().trim();

  const nameScore = jaccard(tokenize(String(a?.name || '')), tokenize(String(b?.name || '')));
  const specScore = jaccard(flattenSpecs(a?.specs), flattenSpecs(b?.specs));

  const score = Math.min(1, nameScore * 0.7 + specScore * 0.3 + (categoryMatch ? 0.2 : 0));
  return Number(score.toFixed(3));
};

export const isInterchangeableItem = (a: SimilarItem, b: SimilarItem, threshold = 0.58): boolean => {
  const sameCategory =
    String(a?.category || '').toLowerCase().trim() !== '' &&
    String(a?.category || '').toLowerCase().trim() === String(b?.category || '').toLowerCase().trim();

  if (sameCategory) {
    return true;
  }

  return getItemSimilarityScore(a, b) >= threshold;
};
