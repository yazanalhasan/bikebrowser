export type SpeedTier = 'lightning' | 'fast' | 'steady' | 'slow';

export interface TimingMetrics {
  reactionTimeMs: number;
  speedTier: SpeedTier;
  comboMultiplier: number;
  rollingAverageMs: number;
  fastestMs: number;
  consistency: number;
  hesitationSpike: boolean;
}

export function getSpeedTier(reactionTimeMs: number): SpeedTier {
  if (reactionTimeMs < 1200) return 'lightning';
  if (reactionTimeMs <= 2500) return 'fast';
  if (reactionTimeMs <= 4500) return 'steady';
  return 'slow';
}

export function getSpeedMultiplier(speedTier: SpeedTier): number {
  return {
    lightning: 1.6,
    fast: 1.35,
    steady: 1.05,
    slow: 0.85,
  }[speedTier];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function calculateTimingMetrics({
  questionShownAt,
  answerSubmittedAt,
  previousReactionTimes = [],
}: {
  questionShownAt: number;
  answerSubmittedAt: number;
  previousReactionTimes?: number[];
}): TimingMetrics {
  const reactionTimeMs = Math.max(0, Math.round(answerSubmittedAt - questionShownAt));
  const speedTier = getSpeedTier(reactionTimeMs);
  const history = [...previousReactionTimes.slice(-9), reactionTimeMs].filter(Number.isFinite);
  const rollingAverageMs = average(history);
  const fastestMs = history.length ? Math.min(...history) : reactionTimeMs;
  const variance = history.length
    ? history.reduce((total, value) => total + Math.abs(value - rollingAverageMs), 0) / history.length
    : 0;
  const consistency = Number(Math.max(0, Math.min(1, 1 - variance / 5000)).toFixed(2));
  const priorAverage = average(previousReactionTimes.slice(-5));
  const hesitationSpike = reactionTimeMs > 4500 || (priorAverage > 0 && reactionTimeMs > priorAverage * 1.8);

  return {
    reactionTimeMs,
    speedTier,
    comboMultiplier: getSpeedMultiplier(speedTier),
    rollingAverageMs,
    fastestMs,
    consistency,
    hesitationSpike,
  };
}

export function updateReactionHistory(previousReactionTimes: number[], reactionTimeMs: number): number[] {
  return [...previousReactionTimes, reactionTimeMs].slice(-30);
}
