const LETTER_PATHS = {
  B: {
    letter: 'B',
    viewBox: '0 0 100 120',
    guidePath: 'M 32 12 L 32 108 M 32 14 C 78 12 78 50 32 58 M 32 58 C 84 58 84 108 32 106',
    samplePoints: [
      { x: 32, y: 12 }, { x: 32, y: 36 }, { x: 32, y: 60 }, { x: 32, y: 84 }, { x: 32, y: 108 },
      { x: 32, y: 14 }, { x: 62, y: 18 }, { x: 74, y: 36 }, { x: 60, y: 54 }, { x: 32, y: 58 },
      { x: 32, y: 58 }, { x: 68, y: 64 }, { x: 80, y: 88 }, { x: 62, y: 106 }, { x: 32, y: 106 },
    ],
    start: { x: 32, y: 12 },
    orientation: 'right',
  },
  D: {
    letter: 'D',
    viewBox: '0 0 100 120',
    guidePath: 'M 30 12 L 30 108 M 30 14 C 86 16 88 104 30 108',
    samplePoints: [
      { x: 30, y: 12 }, { x: 30, y: 36 }, { x: 30, y: 60 }, { x: 30, y: 84 }, { x: 30, y: 108 },
      { x: 30, y: 14 }, { x: 64, y: 20 }, { x: 82, y: 58 }, { x: 68, y: 98 }, { x: 30, y: 108 },
    ],
    start: { x: 30, y: 12 },
    orientation: 'right',
  },
  b: {
    letter: 'b',
    viewBox: '0 0 100 120',
    guidePath: 'M 32 10 L 32 108 M 32 66 C 76 44 86 106 34 104',
    samplePoints: [
      { x: 32, y: 10 }, { x: 32, y: 34 }, { x: 32, y: 58 }, { x: 32, y: 82 }, { x: 32, y: 108 },
      { x: 32, y: 66 }, { x: 58, y: 54 }, { x: 78, y: 76 }, { x: 66, y: 102 }, { x: 34, y: 104 },
    ],
    start: { x: 32, y: 10 },
    orientation: 'right',
  },
  d: {
    letter: 'd',
    viewBox: '0 0 100 120',
    guidePath: 'M 68 10 L 68 108 M 68 66 C 24 44 14 106 66 104',
    samplePoints: [
      { x: 68, y: 10 }, { x: 68, y: 34 }, { x: 68, y: 58 }, { x: 68, y: 82 }, { x: 68, y: 108 },
      { x: 68, y: 66 }, { x: 42, y: 54 }, { x: 22, y: 76 }, { x: 34, y: 102 }, { x: 66, y: 104 },
    ],
    start: { x: 68, y: 10 },
    orientation: 'left',
  },
  p: {
    letter: 'p',
    viewBox: '0 0 100 120',
    guidePath: 'M 32 22 L 32 116 M 32 30 C 76 8 86 70 34 68',
    samplePoints: [
      { x: 32, y: 22 }, { x: 32, y: 46 }, { x: 32, y: 70 }, { x: 32, y: 94 }, { x: 32, y: 116 },
      { x: 32, y: 30 }, { x: 58, y: 18 }, { x: 78, y: 42 }, { x: 66, y: 68 }, { x: 34, y: 68 },
    ],
    start: { x: 32, y: 22 },
    orientation: 'right',
  },
  q: {
    letter: 'q',
    viewBox: '0 0 100 120',
    guidePath: 'M 68 22 L 68 116 M 68 30 C 24 8 14 70 66 68',
    samplePoints: [
      { x: 68, y: 22 }, { x: 68, y: 46 }, { x: 68, y: 70 }, { x: 68, y: 94 }, { x: 68, y: 116 },
      { x: 68, y: 30 }, { x: 42, y: 18 }, { x: 22, y: 42 }, { x: 34, y: 68 }, { x: 66, y: 68 },
    ],
    start: { x: 68, y: 22 },
    orientation: 'left',
  },
};

export const HANDWRITING_TRACE_LETTERS = Object.keys(LETTER_PATHS);

export function getTracingPath(letter) {
  return LETTER_PATHS[String(letter || '').trim()] || LETTER_PATHS.b;
}

export function getTracingPaths() {
  return { ...LETTER_PATHS };
}
