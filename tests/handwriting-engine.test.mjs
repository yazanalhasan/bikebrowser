import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildStrokePoint,
  createStrokeSession,
} from '../src/renderer/handwriting/engine/strokeCapture.js';
import {
  getStrokeBounds,
  normalizeStrokes,
} from '../src/renderer/handwriting/engine/strokeNormalization.js';
import {
  analyzeTracingAttempt,
} from '../src/renderer/handwriting/engine/tracingAnalysis.js';
import {
  scoreHandwritingAttempt,
} from '../src/renderer/handwriting/engine/handwritingScoring.js';
import {
  createDefaultHandwritingProgress,
  recordHandwritingAttempt,
  resetHandwritingProgress,
} from '../src/renderer/handwriting/engine/adaptiveHandwritingEngine.js';
import { getTracingPath } from '../src/renderer/handwriting/data/tracingPaths.js';

test('stroke capture stores vector pointer data for stylus and finger input', () => {
  const session = createStrokeSession();
  const bounds = { left: 10, top: 20, width: 200, height: 100 };

  const stylusPoint = buildStrokePoint({
    clientX: 110,
    clientY: 70,
    timeStamp: 1234,
    pressure: 0.62,
    pointerType: 'pen',
  }, bounds, 1000);
  const fingerPoint = buildStrokePoint({
    clientX: 60,
    clientY: 45,
    timeStamp: 1275,
    pointerType: 'touch',
  }, bounds, 1000);

  session.start(stylusPoint);
  session.append(fingerPoint);
  session.end();

  assert.equal(session.strokes.length, 1);
  assert.deepEqual(session.strokes[0][0], {
    x: 100,
    y: 50,
    t: 234,
    pressure: 0.62,
    pointerType: 'pen',
  });
  assert.equal(session.strokes[0][1].pointerType, 'touch');
});

test('normalization preserves bounds and scales strokes into a stable analysis box', () => {
  const strokes = [[
    { x: 10, y: 20, t: 0, pressure: 0.5, pointerType: 'touch' },
    { x: 110, y: 220, t: 300, pressure: 0.5, pointerType: 'touch' },
  ]];

  assert.deepEqual(getStrokeBounds(strokes), {
    minX: 10,
    minY: 20,
    maxX: 110,
    maxY: 220,
    width: 100,
    height: 200,
  });

  const normalized = normalizeStrokes(strokes, { width: 100, height: 100 });
  assert.equal(normalized[0][0].x, 0);
  assert.equal(normalized[0][0].y, 0);
  assert.equal(normalized[0][1].y, 100);
});

test('tracing analysis rewards completion and detects mirror orientation risk', () => {
  const target = getTracingPath('b');
  const aligned = analyzeTracingAttempt(target.samplePoints.map((point, index) => ({
    x: point.x,
    y: point.y,
    t: index * 80,
    pressure: 0.5,
    pointerType: 'pen',
  })), { targetLetter: 'b' });
  const mirrored = analyzeTracingAttempt(target.samplePoints.map((point, index) => ({
    x: 100 - point.x,
    y: point.y,
    t: index * 80,
    pressure: 0.5,
    pointerType: 'pen',
  })), { targetLetter: 'b' });

  assert.ok(aligned.completion >= 0.9);
  assert.ok(aligned.orientationCorrect);
  assert.equal(mirrored.orientationCorrect, false);
  assert.ok(mirrored.orientationScore < aligned.orientationScore);
});

test('handwriting scoring emphasizes effort and improvement over strict grading', () => {
  const score = scoreHandwritingAttempt({
    completion: 0.82,
    overlap: 0.6,
    directionSimilarity: 0.68,
    orientationScore: 0.55,
    smoothness: 0.74,
    hesitationCount: 2,
  }, {
    previousBest: { finalRewardScore: 4 },
    mode: 'trace',
  });

  assert.ok(score.effortScore >= score.legibilityScore);
  assert.ok(score.finalRewardScore >= 1);
  assert.ok(score.encouragement.includes('Nice'));
});

test('adaptive handwriting progress tracks reversals and can reset locally', () => {
  let progress = createDefaultHandwritingProgress();
  progress = recordHandwritingAttempt(progress, {
    target: 'b',
    recognizedAs: 'd',
    mode: 'trace-letter',
    metrics: { orientationCorrect: false, finalRewardScore: 2, hesitationCount: 3 },
  }).progress;

  assert.equal(progress.confusionMatrix['b->d'], 1);
  assert.equal(progress.tracingAccuracy.b.attempts, 1);
  assert.equal(progress.improvementMetrics.totalAttempts, 1);

  const reset = resetHandwritingProgress({ persist: false });
  assert.equal(reset.confusionMatrix['b->d'], 0);
  assert.equal(reset.improvementMetrics.totalAttempts, 0);
});
