export const CONFUSABLE_LETTERS = new Set(['b', 'd', 'p', 'q', 'B', 'D', 'P', 'Q']);

export const PRIMARY_CONFUSION_PAIRS = {
  'b->d': 0,
  'd->b': 0,
  'p->q': 0,
  'q->p': 0,
};

export function isConfusableLetter(char) {
  return CONFUSABLE_LETTERS.has(char);
}

export function normalizeTrainingTileChar(char, { preserveCapitalBD = true } = {}) {
  if (!preserveCapitalBD) return char;
  if (char === 'b') return 'B';
  if (char === 'd') return 'D';
  return char;
}
