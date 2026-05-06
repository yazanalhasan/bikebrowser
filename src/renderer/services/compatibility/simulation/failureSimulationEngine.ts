type FailureInput = {
  category: string;
  failureType?: string;
};

const FAILURE_LIBRARY = {
  'pull-ratio-mismatch': {
    symptoms: ['ghost shifting', 'missed shifts', 'chain skipping', 'pulley misalignment', 'indexing drift'],
    causalChain: [
      'Shifter pulls cable based on one drivetrain standard.',
      'Cable pull ratio moves the derailleur a different distance than expected.',
      'Derailleur pulley no longer lines up with cassette spacing.',
      'Chain lands between sprockets or rubs against the next gear.',
    ],
    ridingSymptoms: [
      'Bike shifts cleanly in one gear but skips under load in another.',
      'Chain hesitates or jumps when climbing.',
      'Barrel adjuster changes help briefly but indexing drifts again.',
    ],
    fixes: [
      'Use a derailleur with the same indexing family as the shifter and cassette.',
      'Match Shimano CUES/LINKGLIDE parts together for this build.',
    ],
  },
  'capacity-exceeded': {
    symptoms: ['chain slack', 'overstretched derailleur cage', 'large-cog noise'],
    causalChain: [
      'Cassette range exceeds derailleur chain wrap capacity.',
      'Derailleur cage cannot take up enough chain slack.',
      'B-gap and pulley angle move outside intended range.',
    ],
    ridingSymptoms: [
      'Chain goes slack in small-small combinations.',
      'Derailleur struggles to clear the largest cog.',
    ],
    fixes: [
      'Choose a derailleur rated for the cassette max cog and total capacity.',
      'Resize chain after changing cassette range.',
    ],
  },
};

export function simulateCompatibilityFailure(input: FailureInput) {
  const failureType = input.failureType || (input.category === 'rear-derailleur' ? 'pull-ratio-mismatch' : 'capacity-exceeded');
  const model = FAILURE_LIBRARY[failureType as keyof typeof FAILURE_LIBRARY] || FAILURE_LIBRARY['capacity-exceeded'];

  return {
    category: input.category,
    failureType,
    ...model,
  };
}

export default {
  simulateCompatibilityFailure,
};
