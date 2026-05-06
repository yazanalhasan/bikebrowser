type DiagnosticAnswers = {
  when?: string;
  gears?: string;
  afterShifting?: boolean;
  underTorque?: boolean;
  crossChaining?: boolean;
};

const QUESTIONS = [
  { id: 'when', prompt: 'When does it happen: climbing, sprinting, or easy pedaling?' },
  { id: 'gears', prompt: 'Which gears skip: smallest cogs, largest cogs, or all gears?' },
  { id: 'afterShifting', prompt: 'Does it happen right after shifting?' },
  { id: 'underTorque', prompt: 'Does it happen under climbing torque or hard pedaling?' },
  { id: 'crossChaining', prompt: 'Does it happen when the chain is at an extreme angle?' },
];

function scoreCause(id: string, answers: DiagnosticAnswers) {
  const evidence: string[] = [];
  let score = 0;

  if (id === 'chain-or-cassette-wear') {
    if (answers.underTorque) {
      score += 3;
      evidence.push('Skipping under load often points to worn chain/cassette tooth engagement.');
    }
    if (/largest|climbing/i.test(`${answers.gears || ''} ${answers.when || ''}`)) {
      score += 2;
      evidence.push('Largest climbing cogs expose worn chain/cassette engagement under high torque.');
    }
  }

  if (id === 'indexing-or-cable-tension') {
    if (answers.afterShifting) {
      score += 3;
      evidence.push('Skipping immediately after shifting points to indexing or cable tension.');
    }
  }

  if (id === 'hanger-alignment') {
    if (/all gears|largest/i.test(answers.gears || '')) {
      score += 1;
      evidence.push('Certain gear zones can expose hanger alignment errors.');
    }
  }

  if (id === 'cross-chain-angle') {
    if (answers.crossChaining) {
      score += 3;
      evidence.push('Extreme chain angle can cause noise and poor engagement.');
    }
  }

  return { id, score, evidence };
}

export function diagnoseRideSymptom(symptom: string, answers: DiagnosticAnswers = {}) {
  const likelyCauses = [
    'chain-or-cassette-wear',
    'indexing-or-cable-tension',
    'hanger-alignment',
    'cross-chain-angle',
  ]
    .map((id) => scoreCause(id, answers))
    .sort((left, right) => right.score - left.score);

  return {
    symptom,
    questions: QUESTIONS,
    likelyCauses,
    nextChecks: [
      'Measure chain wear with a chain checker.',
      'Check indexing one click at a time across the cassette.',
      'Inspect hanger alignment if shifting changes across the cassette.',
    ],
  };
}

export default {
  diagnoseRideSymptom,
};
