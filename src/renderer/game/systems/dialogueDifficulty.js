/**
 * Dialogue Difficulty — adaptive complexity bands for NPC dialogue.
 *
 * Computes a difficulty band based on:
 *   - completed quests
 *   - learning topic progress
 *   - recent correctness (from save state)
 *   - manual override from game settings
 *
 * Bands (ascending):
 *   1. starter   — very short, concrete, obvious choices, strong hints
 *   2. guided    — slightly richer vocab, short explanations after answers
 *   3. builder   — more technical wording, cause/effect reasoning
 *   4. advanced  — precise vocabulary, comparisons, tradeoffs
 */

export const BANDS = ['starter', 'guided', 'builder', 'advanced'];

const BAND_CONFIG = {
  starter: {
    label: 'Starter',
    maxSentenceWords: 12,
    hintStrength: 'strong',
    explanationDepth: 'minimal',
    questionStyle: 'obvious',
    description: 'Very short sentences, concrete wording, obvious answers, strong hints',
  },
  guided: {
    label: 'Guided',
    maxSentenceWords: 18,
    hintStrength: 'moderate',
    explanationDepth: 'short',
    questionStyle: 'clear',
    description: 'Slightly richer vocabulary, short explanations after answers',
  },
  builder: {
    label: 'Builder',
    maxSentenceWords: 25,
    hintStrength: 'light',
    explanationDepth: 'moderate',
    questionStyle: 'reasoning',
    description: 'More technical wording, asks for cause and effect',
  },
  advanced: {
    label: 'Advanced',
    maxSentenceWords: 35,
    hintStrength: 'minimal',
    explanationDepth: 'detailed',
    questionStyle: 'comparison',
    description: 'Precise vocabulary, encourages comparison and explanation',
  },
};

/**
 * Compute the current difficulty band.
 *
 * @param {object} params
 * @param {string[]} params.completedQuests - list of completed quest ids
 * @param {object}   params.topicProgress   - { [topicId]: 'new'|'started'|'practiced'|'completed' }
 * @param {string[]} params.questTopics     - topic ids relevant to the current quest
 * @param {string}   [params.overrideMode]  - 'adaptive'|'starter'|'guided'|'builder'|'advanced'
 * @returns {{ band: string, config: object, bandIndex: number }}
 */
export function computeDifficultyBand({
  completedQuests = [],
  topicProgress = {},
  questTopics = [],
  overrideMode,
} = {}) {
  // Manual override
  if (overrideMode && BANDS.includes(overrideMode)) {
    return makeBandResult(overrideMode);
  }

  // Adaptive computation
  let score = 0;

  // +1 per completed quest (max contribution: 2)
  score += Math.min(completedQuests.length, 2);

  // +1 if any quest topic is 'practiced' or 'completed'
  const topicStates = questTopics.map((t) => topicProgress[t] || 'new');
  const hasPracticedTopic = topicStates.some((s) => s === 'practiced' || s === 'completed');
  if (hasPracticedTopic) score += 1;

  // +1 if all quest topics are at least 'started'
  const allStarted = questTopics.length > 0 && topicStates.every((s) => s !== 'new');
  if (allStarted) score += 1;

  // +1 if majority of topics across the board are practiced/completed
  const allTopicValues = Object.values(topicProgress);
  const practicedCount = allTopicValues.filter((s) => s === 'practiced' || s === 'completed').length;
  if (allTopicValues.length > 0 && practicedCount / allTopicValues.length > 0.5) {
    score += 1;
  }

  // Map score to band (gradual, safe progression)
  let bandIndex;
  if (score <= 1) bandIndex = 0;       // starter
  else if (score <= 2) bandIndex = 1;   // guided
  else if (score <= 4) bandIndex = 2;   // builder
  else bandIndex = 3;                   // advanced

  return makeBandResult(BANDS[bandIndex]);
}

function makeBandResult(band) {
  return {
    band,
    config: BAND_CONFIG[band],
    bandIndex: BANDS.indexOf(band),
  };
}

/** Get the config for a named band. */
export function getBandConfig(band) {
  return BAND_CONFIG[band] || BAND_CONFIG.starter;
}
