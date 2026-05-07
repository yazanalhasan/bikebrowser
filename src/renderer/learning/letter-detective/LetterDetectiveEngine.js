import { PRIMARY_CONFUSION_PAIRS } from '../../accessibility/confusableLetters.js';

export const LETTER_DETECTIVE_PROGRESS_STORAGE_KEY = 'bikebrowser.letterDetectiveProgress';

const TRACKED_LETTERS = ['b', 'd', 'p', 'q'];

function createPerLetter() {
  return TRACKED_LETTERS.reduce((acc, letter) => {
    acc[letter] = { attempts: 0, correct: 0, avgMs: 0 };
    return acc;
  }, {});
}

export function createDefaultLetterDetectiveProgress() {
  return {
    totalAttempts: 0,
    totalCorrect: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctDiscriminations: {},
    confusionMatrix: { ...PRIMARY_CONFUSION_PAIRS },
    perLetter: createPerLetter(),
  };
}

function safeParseProgress(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export function loadLetterDetectiveProgress() {
  const stored = typeof window !== 'undefined' && window.localStorage
    ? safeParseProgress(window.localStorage.getItem(LETTER_DETECTIVE_PROGRESS_STORAGE_KEY))
    : {};

  return {
    ...createDefaultLetterDetectiveProgress(),
    ...stored,
    confusionMatrix: {
      ...PRIMARY_CONFUSION_PAIRS,
      ...(stored.confusionMatrix || {}),
    },
    perLetter: {
      ...createPerLetter(),
      ...(stored.perLetter || {}),
    },
    correctDiscriminations: {
      ...(stored.correctDiscriminations || {}),
    },
  };
}

export function saveLetterDetectiveProgress(progress) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LETTER_DETECTIVE_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }
  return progress;
}

export function resetLetterDetectiveProgress() {
  const progress = createDefaultLetterDetectiveProgress();
  return saveLetterDetectiveProgress(progress);
}

function getAccuracy(progress, letters) {
  const totals = letters.reduce((acc, letter) => {
    const stat = progress.perLetter?.[letter] || { attempts: 0, correct: 0 };
    acc.attempts += stat.attempts;
    acc.correct += stat.correct;
    return acc;
  }, { attempts: 0, correct: 0 });

  return totals.attempts ? totals.correct / totals.attempts : 1;
}

export function getLetterDetectiveDifficulty(progress) {
  const bdAccuracy = getAccuracy(progress, ['b', 'd']);
  const overallAccuracy = progress.totalAttempts
    ? progress.totalCorrect / progress.totalAttempts
    : 1;
  const matureAccuracy = progress.totalAttempts >= 20 && overallAccuracy > 0.9;

  return {
    emphasizeBD: bdAccuracy < 0.85,
    largeTiles: bdAccuracy < 0.85,
    slowPacing: bdAccuracy < 0.85,
    reduceDistractors: bdAccuracy < 0.85,
    speedBonusEnabled: matureAccuracy && bdAccuracy >= 0.85,
    mixedCaseRounds: matureAccuracy,
  };
}

export function recordLetterDetectiveAttempt(progress, attempt) {
  const {
    target,
    choice,
    correct,
    elapsedMs = 0,
    speedBonusEnabled = false,
    speedThresholdMs = 2500,
    confusablePair,
  } = attempt;
  const normalizedTarget = String(target || '').toLowerCase();
  const normalizedChoice = String(choice || '').toLowerCase();
  const next = {
    ...progress,
    totalAttempts: progress.totalAttempts + 1,
    totalCorrect: progress.totalCorrect + (correct ? 1 : 0),
    streak: correct ? progress.streak + 1 : 0,
    confusionMatrix: { ...progress.confusionMatrix },
    perLetter: { ...progress.perLetter },
    correctDiscriminations: { ...progress.correctDiscriminations },
  };

  next.bestStreak = Math.max(progress.bestStreak, next.streak);

  if (TRACKED_LETTERS.includes(normalizedTarget)) {
    const stat = progress.perLetter[normalizedTarget] || { attempts: 0, correct: 0, avgMs: 0 };
    const attempts = stat.attempts + 1;
    next.perLetter[normalizedTarget] = {
      attempts,
      correct: stat.correct + (correct ? 1 : 0),
      avgMs: Math.round(((stat.avgMs || 0) * stat.attempts + elapsedMs) / attempts),
    };
  }

  if (!correct) {
    const matrixKey = `${normalizedTarget}->${normalizedChoice}`;
    if (Object.prototype.hasOwnProperty.call(next.confusionMatrix, matrixKey)) {
      next.confusionMatrix[matrixKey] += 1;
    }
  }

  let reward = 0;
  const bonuses = [];
  if (correct) {
    reward += 1;
    if (next.streak > 0 && next.streak % 5 === 0) {
      reward += 2;
      bonuses.push('streak');
    }
    if (speedBonusEnabled && elapsedMs > 0 && elapsedMs < speedThresholdMs) {
      reward += 1;
      bonuses.push('speed');
    }
    if (confusablePair) {
      const masteredCount = (progress.correctDiscriminations[confusablePair] || 0) + 1;
      next.correctDiscriminations[confusablePair] = masteredCount;
      if (masteredCount % 10 === 0) {
        reward += 3;
        bonuses.push('confusable mastery');
      }
    }
  }

  next.score = (progress.score || 0) + reward;
  return { progress: next, reward, bonuses };
}
