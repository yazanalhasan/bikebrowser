import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getTypographyClasses,
  isConfusableLetter,
  normalizeReadableText,
} from '../src/renderer/accessibility/typographyEngine.js';
import {
  createDefaultLetterDetectiveProgress,
  getLetterDetectiveDifficulty,
  recordLetterDetectiveAttempt,
} from '../src/renderer/learning/letter-detective/LetterDetectiveEngine.js';

test('readable text preserves lowercase paragraphs and capitalizes isolated b/d tiles only', () => {
  assert.equal(
    normalizeReadableText('Big dog', { lowercasePriority: true, isolatedTile: false }),
    'big dog',
  );
  assert.equal(
    normalizeReadableText('b', { isolatedTile: true, preserveCapitalBD: true }),
    'B',
  );
  assert.equal(
    normalizeReadableText('d', { isolatedTile: true, preserveCapitalBD: true }),
    'D',
  );
  assert.equal(
    normalizeReadableText('b', { isolatedTile: true, preserveCapitalBD: false }),
    'b',
  );
});

test('typography classes include font, spacing, and reduced motion from profile', () => {
  const classes = getTypographyClasses({
    dyslexiaMode: true,
    reducedMotion: true,
    increasedSpacing: true,
    readingFocusMode: false,
    fontMode: 'atkinson',
  });

  assert.ok(classes.includes('bb-dyslexia-mode'));
  assert.ok(classes.includes('bb-reduced-motion'));
  assert.ok(classes.includes('bb-spacing-enhanced'));
  assert.ok(classes.includes('bb-font-atkinson'));
});

test('confusable letters and letter detective confusion matrix are tracked centrally', () => {
  assert.equal(isConfusableLetter('b'), true);
  assert.equal(isConfusableLetter('x'), false);

  const start = createDefaultLetterDetectiveProgress();
  const result = recordLetterDetectiveAttempt(start, {
    target: 'b',
    choice: 'd',
    correct: false,
    elapsedMs: 1200,
  });

  assert.equal(result.progress.confusionMatrix['b->d'], 1);
  assert.equal(result.progress.totalAttempts, 1);
  assert.equal(result.progress.score, 0);
});

test('adaptive difficulty disables speed pressure while b/d accuracy is low', () => {
  let progress = createDefaultLetterDetectiveProgress();
  progress = recordLetterDetectiveAttempt(progress, {
    target: 'b',
    choice: 'd',
    correct: false,
    elapsedMs: 1600,
  }).progress;

  const difficulty = getLetterDetectiveDifficulty(progress);
  assert.equal(difficulty.largeTiles, true);
  assert.equal(difficulty.speedBonusEnabled, false);
});
