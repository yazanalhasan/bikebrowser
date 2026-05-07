export const HANDWRITING_PROGRESS_KEY = 'bikebrowser.handwritingProgress';

const DEFAULT_CONFUSIONS = {
  'b->d': 0,
  'd->b': 0,
  'p->q': 0,
  'q->p': 0,
};

const TRACKED_LETTERS = ['B', 'D', 'b', 'd', 'p', 'q'];

function createLetterStats() {
  return TRACKED_LETTERS.reduce((acc, letter) => {
    acc[letter] = { attempts: 0, avgReward: 0, bestReward: 0 };
    return acc;
  }, {});
}

export function createDefaultHandwritingProgress() {
  return {
    confusionMatrix: { ...DEFAULT_CONFUSIONS },
    improvementMetrics: {
      totalAttempts: 0,
      totalReward: 0,
      orientationMastery: 0,
      hesitationEvents: 0,
      consistencyStreak: 0,
      bestConsistencyStreak: 0,
    },
    tracingAccuracy: createLetterStats(),
    strokeConsistency: createLetterStats(),
  };
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export function loadHandwritingProgress() {
  const stored = typeof window !== 'undefined' && window.localStorage
    ? safeParse(window.localStorage.getItem(HANDWRITING_PROGRESS_KEY))
    : {};
  const defaults = createDefaultHandwritingProgress();

  return {
    ...defaults,
    ...stored,
    confusionMatrix: { ...DEFAULT_CONFUSIONS, ...(stored.confusionMatrix || {}) },
    improvementMetrics: { ...defaults.improvementMetrics, ...(stored.improvementMetrics || {}) },
    tracingAccuracy: { ...defaults.tracingAccuracy, ...(stored.tracingAccuracy || {}) },
    strokeConsistency: { ...defaults.strokeConsistency, ...(stored.strokeConsistency || {}) },
  };
}

export function saveHandwritingProgress(progress) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(HANDWRITING_PROGRESS_KEY, JSON.stringify(progress));
  }
  return progress;
}

export function resetHandwritingProgress(options = {}) {
  const progress = createDefaultHandwritingProgress();
  if (options.persist !== false) saveHandwritingProgress(progress);
  return progress;
}

export function recordHandwritingAttempt(progress, attempt) {
  const target = String(attempt.target || '').trim();
  const recognizedAs = String(attempt.recognizedAs || '').trim();
  const metrics = attempt.metrics || {};
  const reward = Math.max(1, metrics.finalRewardScore || 1);
  const next = {
    ...progress,
    confusionMatrix: { ...progress.confusionMatrix },
    improvementMetrics: { ...progress.improvementMetrics },
    tracingAccuracy: { ...progress.tracingAccuracy },
    strokeConsistency: { ...progress.strokeConsistency },
  };

  const confusionKey = `${target.toLowerCase()}->${recognizedAs.toLowerCase()}`;
  if (target && recognizedAs && target.toLowerCase() !== recognizedAs.toLowerCase()
    && Object.prototype.hasOwnProperty.call(next.confusionMatrix, confusionKey)) {
    next.confusionMatrix[confusionKey] += 1;
  }

  const currentStats = next.tracingAccuracy[target] || { attempts: 0, avgReward: 0, bestReward: 0 };
  const attempts = currentStats.attempts + 1;
  next.tracingAccuracy[target] = {
    attempts,
    avgReward: Math.round(((currentStats.avgReward || 0) * currentStats.attempts + reward) / attempts),
    bestReward: Math.max(currentStats.bestReward || 0, reward),
  };
  next.strokeConsistency[target] = {
    ...(next.strokeConsistency[target] || { attempts: 0, avgReward: 0, bestReward: 0 }),
    attempts,
    avgReward: next.tracingAccuracy[target].avgReward,
    bestReward: next.tracingAccuracy[target].bestReward,
  };

  const totalAttempts = next.improvementMetrics.totalAttempts + 1;
  const consistencyStreak = metrics.orientationCorrect
    ? next.improvementMetrics.consistencyStreak + 1
    : 0;
  next.improvementMetrics = {
    ...next.improvementMetrics,
    totalAttempts,
    totalReward: next.improvementMetrics.totalReward + reward,
    orientationMastery: next.improvementMetrics.orientationMastery + (metrics.orientationCorrect ? 1 : 0),
    hesitationEvents: next.improvementMetrics.hesitationEvents + (metrics.hesitationCount || 0),
    consistencyStreak,
    bestConsistencyStreak: Math.max(next.improvementMetrics.bestConsistencyStreak, consistencyStreak),
  };

  return {
    progress: next,
    reward,
    message: reward >= 4 ? 'Nice improvement!' : 'Good effort. Trace slowly and try again.',
  };
}

export function getAdaptiveHandwritingSettings(progress, target = 'b') {
  const lower = String(target).toLowerCase();
  const reversalRisk = (progress.confusionMatrix[`${lower}->d`] || 0)
    + (progress.confusionMatrix[`${lower}->b`] || 0)
    + (progress.confusionMatrix[`${lower}->q`] || 0)
    + (progress.confusionMatrix[`${lower}->p`] || 0);

  return {
    showStartAnchor: reversalRisk > 0,
    replaySpeed: reversalRisk > 1 ? 0.75 : 1,
    guideStrength: reversalRisk > 1 ? 'strong' : 'standard',
    rewardImprovementMore: true,
  };
}
