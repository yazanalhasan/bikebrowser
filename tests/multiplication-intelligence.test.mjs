import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MULTIPLICATION_PATTERN_ORDER,
  describeMultiplicationPattern,
  createMultiplicationQuestion,
  createPatternSequence,
} from '../src/renderer/services/education/MultiplicationPatternEngine.ts';
import { createMechanicalScenario } from '../src/renderer/services/education/MechanicalMultiplicationScenarios.ts';
import { analyzeMistakes } from '../src/renderer/services/education/MistakeAnalysisEngine.ts';
import { calculateFlowState } from '../src/renderer/services/education/FlowStateEngine.ts';
import { computeGearTrain } from '../src/renderer/spellingTrainer/math/gearPhysics.js';

test('multiplication pattern order follows the requested teaching sequence', () => {
  assert.deepEqual(MULTIPLICATION_PATTERN_ORDER, [1, 2, 10, 5, 9, 11, 3, 4, 6, 7, 8, 12]);
});

test('7 x 8 teaches decomposition instead of isolated recall', () => {
  const pattern = describeMultiplicationPattern(7, 8);

  assert.equal(pattern.family, '7s');
  assert.equal(pattern.primaryType, 'decomposition');
  assert.deepEqual(pattern.decomposition, [
    { factorA: 5, factorB: 8, product: 40 },
    { factorA: 2, factorB: 8, product: 16 }
  ]);
  assert.equal(pattern.product, 56);
});

test('adaptive sequence groups related doubling relationships before a challenge', () => {
  const sequence = createPatternSequence({ family: 4, anchor: 4, length: 4 });

  assert.deepEqual(sequence.map((q) => q.expression), ['2 x 4', '4 x 4', '8 x 4', '6 x 7']);
  assert.equal(sequence[2].reflectionPrompt, 'What pattern changed?');
});

test('mechanical scenarios translate facts into bike and engineering systems', () => {
  const scenario = createMechanicalScenario({ factorA: 3, factorB: 4, type: 'gears' });

  assert.equal(scenario.expression, '3 x 4');
  assert.equal(scenario.result, 12);
  assert.equal(scenario.theme, 'drivetrain');
  assert.equal(scenario.visualModel, 'gear-transfer');
  assert.match(scenario.story, /pedal rotations/);
});

test('gear physics keeps radius, teeth, velocity, and direction proportional', () => {
  const equal = computeGearTrain({ factorA: 1, factorB: 1 });
  const half = computeGearTrain({ factorA: 1, factorB: 2 });
  const quarter = computeGearTrain({ factorA: 1, factorB: 4 });
  const twoToThree = computeGearTrain({ factorA: 2, factorB: 3 });
  const idler = computeGearTrain({ factorA: 1, factorB: 1, includeIdler: true, idlerRadius: 30 });

  assert.equal(equal.gears[1].radius, 60);
  assert.equal(equal.gears[1].teeth, 40);
  assert.equal(equal.gears[1].angularVelocity, 1);

  assert.equal(half.gears[1].radius, 30);
  assert.equal(half.gears[1].teeth, 20);
  assert.equal(half.gears[1].angularVelocity, 2);

  assert.equal(quarter.gears[1].radius, 15);
  assert.equal(quarter.gears[1].teeth, 10);
  assert.equal(quarter.gears[1].angularVelocity, 4);

  assert.equal(twoToThree.gears[1].radius, 40);
  assert.equal(twoToThree.gears[1].teeth, 27);
  assert.equal(twoToThree.gears[0].radius * twoToThree.gears[0].angularVelocity, twoToThree.gears[1].radius * twoToThree.gears[1].angularVelocity);

  assert.deepEqual(idler.gears.map((gear) => gear.rotationDirection), [1, -1, 1]);
  assert.equal(idler.ratio.speedMultiplier, 1);
});

test('mistake analysis infers high-table and decomposition weaknesses', () => {
  const analysis = analyzeMistakes([
    { factorA: 7, factorB: 8, answer: 54, correctAnswer: 56, reactionTimeMs: 6100 },
    { factorA: 8, factorB: 7, answer: 55, correctAnswer: 56, reactionTimeMs: 5800 },
    { factorA: 6, factorB: 8, answer: 46, correctAnswer: 48, reactionTimeMs: 5200 }
  ]);

  assert.equal(analysis.weaknesses.includes('high-table weakness'), true);
  assert.equal(analysis.weaknesses.includes('decomposition weakness'), true);
  assert.equal(analysis.weaknesses.includes('mirrored fact confusion'), true);
  assert.equal(analysis.recommendedPatterns.includes('5+2 decomposition'), true);
});

test('flow state rises with fast accurate streaks and recovers after mistakes', () => {
  const state = calculateFlowState({
    recentResults: [
      { correct: true, reactionTimeMs: 1300 },
      { correct: true, reactionTimeMs: 1100 },
      { correct: true, reactionTimeMs: 1250 },
      { correct: true, reactionTimeMs: 1400 },
      { correct: true, reactionTimeMs: 1180 }
    ],
    currentStreak: 5
  });

  assert.equal(state.level, 'Flow State');
  assert.equal(state.animationEnergy > 1, true);
  assert.equal(state.musicIntensity > 1, true);
});
