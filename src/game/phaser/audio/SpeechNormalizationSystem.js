const FRACTIONS = [
  [/\b1\/2\b/g, 'one-half'],
  [/\b1\/4\b/g, 'one-quarter'],
  [/\b3\/4\b/g, 'three-quarters'],
];

const SYMBOL_RULES = [
  [/\s\+\s/g, ' plus '],
  [/\s=\s/g, ' equals '],
  [/(\d)\s*x\s*(\d)/gi, '$1 times $2'],
  [/(\d+(?:\.\d+)?)%/g, '$1 percent'],
];

const UNIT_RULES = [
  [/\bcm(?:\^?3|³)\b/gi, 'cubic centimeters'],
  [/\bm(?:\^?2|²)\b/gi, 'square meters'],
  [/\bmg\/dL\b/g, 'milligrams per deciliter'],
  [/\bdeg\b/gi, 'degrees'],
  [/\b°F\b/g, 'degrees Fahrenheit'],
  [/\bF\b(?=\s|$|[.?!,])/g, 'Fahrenheit'],
];

const SCIENCE_RULES = [
  [/\bpH\b/g, 'P H'],
  [/\bDNA\b/g, 'D N A'],
  [/\bRNA\b/g, 'R N A'],
  [/\bCO2\b/g, 'carbon dioxide'],
  [/\bH2O\b/g, 'water'],
];

const ENGINEERING_RULES = [
  [/\bUTM\b/g, 'universal testing machine'],
];

const NUMBER_WORDS = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
  30: 'thirty',
  40: 'forty',
  50: 'fifty',
  60: 'sixty',
  70: 'seventy',
  80: 'eighty',
  90: 'ninety',
};

export class SpeechNormalizationSystem {
  constructor(options = {}) {
    this.rules = options.rules || [
      ...FRACTIONS,
      ...SYMBOL_RULES,
      ...UNIT_RULES,
      ...SCIENCE_RULES,
      ...ENGINEERING_RULES,
    ];
  }

  normalize(text, context = {}) {
    if (!text) return '';
    let spoken = String(text);

    spoken = spoken.replace(/\bCO2\b/g, context.spellChemicalFormulas ? 'C O 2' : 'carbon dioxide');
    spoken = spoken.replace(/\bH2O\b/g, context.spellChemicalFormulas ? 'H 2 O' : 'water');
    spoken = spoken.replace(/\bUTM\b/g, context.spellAcronyms ? 'U T M' : 'universal testing machine');

    for (const [pattern, replacement] of this.rules) {
      spoken = spoken.replace(pattern, replacement);
    }

    spoken = spoken.replace(/(\d+\.\d+)\s+degrees\s+Fahrenheit/g, (_match, value) => `${decimalToWords(value)} degrees Fahrenheit`);
    spoken = spoken.replace(/(\d+\.\d+)/g, (_match, value) => decimalToWords(value));

    spoken = spoken.replace(/(\w)\s-\s(\w)/g, '$1 minus $2');
    spoken = spoken.replace(/\s+/g, ' ').trim();
    return spoken;
  }
}

export function decimalToWords(value) {
  const [whole, decimal = ''] = String(value).split('.');
  const wholeWords = numberToWords(Number(whole));
  const decimalWords = decimal.split('').map((digit) => NUMBER_WORDS[Number(digit)] || digit).join(' ');
  return decimalWords ? `${wholeWords} point ${decimalWords}` : wholeWords;
}

export function numberToWords(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (NUMBER_WORDS[number]) return NUMBER_WORDS[number];
  if (number < 100) {
    const tens = Math.floor(number / 10) * 10;
    const ones = number % 10;
    return ones ? `${NUMBER_WORDS[tens]}-${NUMBER_WORDS[ones]}` : NUMBER_WORDS[tens];
  }
  return String(value);
}

export const speechNormalizationSystem = new SpeechNormalizationSystem();
