import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateTimingMetrics } from '../src/renderer/services/education/ReactionTimingEngine.ts';
import { calculateReward } from '../src/renderer/services/education/RewardCalculationEngine.ts';
import { createDefaultLearningProfile, applyEducationResult } from '../src/renderer/services/education/PlayerLearningProfile.ts';
import { createEducationSessionEngine } from '../src/renderer/services/education/EducationSessionEngine.ts';

test('reaction timing classifies speed tiers and combo multipliers', () => {
  const lightning = calculateTimingMetrics({ questionShownAt: 1000, answerSubmittedAt: 2100, previousReactionTimes: [1300, 1200] });
  const fast = calculateTimingMetrics({ questionShownAt: 1000, answerSubmittedAt: 2300, previousReactionTimes: [1400, 1500] });
  const steady = calculateTimingMetrics({ questionShownAt: 1000, answerSubmittedAt: 4200, previousReactionTimes: [3000] });
  const slow = calculateTimingMetrics({ questionShownAt: 1000, answerSubmittedAt: 6200, previousReactionTimes: [2200, 5600] });

  assert.equal(lightning.speedTier, 'lightning');
  assert.equal(lightning.comboMultiplier, 1.6);
  assert.equal(fast.speedTier, 'fast');
  assert.equal(fast.comboMultiplier, 1.35);
  assert.equal(steady.speedTier, 'steady');
  assert.equal(slow.speedTier, 'slow');
  assert.equal(slow.hesitationSpike, true);
});

test('reward calculation combines accuracy, speed, streak, difficulty, first try, and mastery', () => {
  const reward = calculateReward({
    subject: 'multiplication',
    correct: true,
    firstTry: true,
    difficulty: 3,
    streak: 7,
    improvementDelta: 0.18,
    patternMastery: 0.62,
    timing: {
      reactionTimeMs: 1300,
      speedTier: 'fast',
      comboMultiplier: 1.35,
      rollingAverageMs: 1600,
      fastestMs: 1300,
      consistency: 0.9,
      hesitationSpike: false
    }
  });

  assert.equal(reward.xp, 35);
  assert.equal(reward.coins, 8);
  assert.deepEqual(reward.labels, [
    'Fast Thinker Bonus',
    '7x Streak',
    'First Try',
    'Pattern Mastery Progress',
    'Improvement Bonus'
  ]);
});

test('learning profile stores shared spelling and multiplication progress', () => {
  const profile = createDefaultLearningProfile('Zaydan');
  const updated = applyEducationResult(profile, {
    subject: 'multiplication',
    skillId: 'multiplication.7x8',
    patternFamily: '7s',
    correct: true,
    firstTry: true,
    reactionTimeMs: 1300,
    xp: 35,
    coins: 8,
    timestamp: '2026-05-06T08:00:00.000Z'
  });

  assert.equal(updated.profileName, 'Zaydan');
  assert.equal(updated.xp, 35);
  assert.equal(updated.coins, 8);
  assert.equal(updated.earnings.totalDollars, 0.08);
  assert.equal(updated.earnings.multiplicationDollars, 0.08);
  assert.equal(updated.subjects.multiplication.attempts, 1);
  assert.equal(updated.subjects.multiplication.correct, 1);
  assert.equal(updated.patterns['7s'].attempts, 1);
  assert.equal(updated.skills['multiplication.7x8'].masteryScore > 0, true);
});

test('education session engine evaluates answers and updates profile through shared infrastructure', () => {
  const profile = createDefaultLearningProfile('Zaydan');
  profile.subjects.multiplication.streak = 6;
  profile.patterns['7s'] = { attempts: 5, correct: 4, masteryScore: 0.62 };
  profile.skills['multiplication.7x8'] = {
    attempts: 0,
    correct: 0,
    firstTryCorrect: 0,
    masteryScore: 0.62,
    fastestMs: 1600,
    reactionTimes: [1600],
    lastSeenAt: '2026-05-06T07:00:00.000Z'
  };
  const engine = createEducationSessionEngine({
    now: () => 2300,
    initialProfile: profile
  });

  const session = engine.startQuestion({
    subject: 'multiplication',
    skillId: 'multiplication.7x8',
    patternFamily: '7s',
    prompt: '7 x 8',
    answer: 56,
    difficulty: 3,
    shownAt: 1000
  });

  const result = engine.submitAnswer(session.questionId, 56);
  assert.equal(result.correct, true);
  assert.equal(result.timing.speedTier, 'fast');
  assert.equal(result.reward.xp, 35);
  assert.equal(result.profile.skills['multiplication.7x8'].correct, 1);
});
