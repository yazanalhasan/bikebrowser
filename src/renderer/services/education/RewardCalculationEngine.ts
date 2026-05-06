import type { TimingMetrics } from './ReactionTimingEngine.ts';

export interface RewardInput {
  subject: string;
  correct: boolean;
  firstTry: boolean;
  difficulty: number;
  streak: number;
  improvementDelta?: number;
  patternMastery?: number;
  timing: TimingMetrics;
}

export interface RewardOutput {
  xp: number;
  coins: number;
  labels: string[];
  multipliers: {
    baseXP: number;
    difficultyMultiplier: number;
    speedMultiplier: number;
    streakMultiplier: number;
    masteryBonus: number;
  };
}

export function calculateReward(input: RewardInput): RewardOutput {
  if (!input.correct) {
    return {
      xp: 1,
      coins: 0,
      labels: ['Recovery Practice'],
      multipliers: {
        baseXP: 1,
        difficultyMultiplier: 1,
        speedMultiplier: 1,
        streakMultiplier: 1,
        masteryBonus: 1,
      },
    };
  }

  const baseXP = input.subject === 'spelling' ? 6 : 7;
  const difficultyMultiplier = 1 + Math.max(0, input.difficulty) * 0.35;
  const speedMultiplier = input.timing.comboMultiplier;
  const streakMultiplier = 1 + Math.min(10, Math.max(0, input.streak)) * 0.06;
  const masteryBonus = input.patternMastery && input.patternMastery >= 0.5 ? 1.08 : 1;
  const firstTryBonus = input.firstTry ? 3 : 0;
  const improvementBonus = input.improvementDelta && input.improvementDelta > 0.1 ? 2 : 0;
  const xp = Math.round(baseXP * difficultyMultiplier * speedMultiplier * streakMultiplier * masteryBonus + firstTryBonus + improvementBonus);
  const coins = Math.max(1, Math.round(xp / 4.4));
  const labels: string[] = [];

  if (input.timing.speedTier === 'lightning') labels.push('Lightning Thinker Bonus');
  if (input.timing.speedTier === 'fast') labels.push('Fast Thinker Bonus');
  if (input.streak >= 2) labels.push(`${input.streak}x Streak`);
  if (input.firstTry) labels.push('First Try');
  if ((input.patternMastery || 0) >= 0.5) labels.push('Pattern Mastery Progress');
  if ((input.improvementDelta || 0) > 0.1) labels.push('Improvement Bonus');

  return {
    xp,
    coins,
    labels,
    multipliers: {
      baseXP,
      difficultyMultiplier: Number(difficultyMultiplier.toFixed(2)),
      speedMultiplier,
      streakMultiplier: Number(streakMultiplier.toFixed(2)),
      masteryBonus,
    },
  };
}
