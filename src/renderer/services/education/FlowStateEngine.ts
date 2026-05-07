export const FLOW_LEVELS = ['Calm', 'Focused', 'Locked In', 'Flow State', 'Mechanic Genius'] as const;

export function calculateFlowState({
  recentResults = [],
  currentStreak = 0,
}: {
  recentResults: Array<{ correct: boolean; reactionTimeMs: number }>;
  currentStreak?: number;
}) {
  const recent = recentResults.slice(-8);
  const correctRate = recent.length ? recent.filter((item) => item.correct).length / recent.length : 0;
  const averageSpeed = recent.length
    ? recent.reduce((total, item) => total + item.reactionTimeMs, 0) / recent.length
    : 9999;
  const rapidCorrect = recent.filter((item) => item.correct && item.reactionTimeMs <= 1800).length;
  let index = 0;

  if (correctRate >= 0.65 && currentStreak >= 2) index = 1;
  if (correctRate >= 0.75 && currentStreak >= 3 && averageSpeed <= 2800) index = 2;
  if (correctRate >= 0.9 && currentStreak >= 5 && rapidCorrect >= 4) index = 3;
  if (correctRate === 1 && currentStreak >= 10 && averageSpeed < 1500) index = 4;

  return {
    level: FLOW_LEVELS[index],
    score: Number((correctRate * 60 + Math.min(40, currentStreak * 4)).toFixed(1)),
    animationEnergy: Number((1 + index * 0.22).toFixed(2)),
    musicIntensity: Number((1 + index * 0.18).toFixed(2)),
    recoveryNeeded: recent.slice(-2).some((item) => !item.correct),
  };
}
