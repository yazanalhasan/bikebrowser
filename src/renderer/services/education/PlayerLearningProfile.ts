export interface EducationSkillRecord {
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  masteryScore: number;
  fastestMs: number | null;
  reactionTimes: number[];
  lastSeenAt: string | null;
}

export interface PlayerLearningProfile {
  version: number;
  profileName: string;
  xp: number;
  coins: number;
  earnings: {
    spellingDollars: number;
    multiplicationDollars: number;
    totalDollars: number;
  };
  achievements: string[];
  unlocks: string[];
  subjects: Record<string, { attempts: number; correct: number; streak: number; bestStreak: number }>;
  skills: Record<string, EducationSkillRecord>;
  patterns: Record<string, { attempts: number; correct: number; masteryScore: number }>;
  recentResults: Array<{ correct: boolean; reactionTimeMs: number; timestamp?: string }>;
}

export const EDUCATION_PROFILE_STORAGE_KEY = 'bikebrowser-education-profile-v1';

function createSubjectRecord() {
  return { attempts: 0, correct: 0, streak: 0, bestStreak: 0 };
}

export function createDefaultLearningProfile(profileName = 'Zaydan'): PlayerLearningProfile {
  return {
    version: 1,
    profileName,
    xp: 0,
    coins: 0,
    earnings: {
      spellingDollars: 0,
      multiplicationDollars: 0,
      totalDollars: 0,
    },
    achievements: [],
    unlocks: [],
    subjects: {
      spelling: createSubjectRecord(),
      multiplication: createSubjectRecord(),
    },
    skills: {},
    patterns: {},
    recentResults: [],
  };
}

function createSkillRecord(): EducationSkillRecord {
  return {
    attempts: 0,
    correct: 0,
    firstTryCorrect: 0,
    masteryScore: 0,
    fastestMs: null,
    reactionTimes: [],
    lastSeenAt: null,
  };
}

export function applyEducationResult(profile: PlayerLearningProfile, result: {
  subject: string;
  skillId: string;
  patternFamily?: string;
  correct: boolean;
  firstTry?: boolean;
  reactionTimeMs: number;
  xp: number;
  coins: number;
  dollars?: number;
  timestamp?: string;
}): PlayerLearningProfile {
  const subject = profile.subjects[result.subject] || createSubjectRecord();
  const skill = profile.skills[result.skillId] || createSkillRecord();
  const patternKey = result.patternFamily || 'general';
  const pattern = profile.patterns[patternKey] || { attempts: 0, correct: 0, masteryScore: 0 };
  const nextSubjectStreak = result.correct ? subject.streak + 1 : 0;
  const nextSkillCorrect = skill.correct + (result.correct ? 1 : 0);
  const nextSkillAttempts = skill.attempts + 1;
  const nextPatternCorrect = pattern.correct + (result.correct ? 1 : 0);
  const nextPatternAttempts = pattern.attempts + 1;
  const earnedDollars = Number((result.dollars ?? result.coins / 100).toFixed(2));
  const currentEarnings = profile.earnings || { spellingDollars: 0, multiplicationDollars: 0, totalDollars: 0 };
  const spellingDollars = Number((
    currentEarnings.spellingDollars + (result.subject === 'spelling' ? earnedDollars : 0)
  ).toFixed(2));
  const multiplicationDollars = Number((
    currentEarnings.multiplicationDollars + (result.subject === 'multiplication' ? earnedDollars : 0)
  ).toFixed(2));

  return {
    ...profile,
    xp: profile.xp + result.xp,
    coins: profile.coins + result.coins,
    earnings: {
      spellingDollars,
      multiplicationDollars,
      totalDollars: Number((spellingDollars + multiplicationDollars).toFixed(2)),
    },
    subjects: {
      ...profile.subjects,
      [result.subject]: {
        attempts: subject.attempts + 1,
        correct: subject.correct + (result.correct ? 1 : 0),
        streak: nextSubjectStreak,
        bestStreak: Math.max(subject.bestStreak, nextSubjectStreak),
      },
    },
    skills: {
      ...profile.skills,
      [result.skillId]: {
        ...skill,
        attempts: nextSkillAttempts,
        correct: nextSkillCorrect,
        firstTryCorrect: skill.firstTryCorrect + (result.correct && result.firstTry ? 1 : 0),
        masteryScore: Number(Math.min(1, nextSkillCorrect / Math.max(3, nextSkillAttempts)).toFixed(2)),
        fastestMs: skill.fastestMs === null ? result.reactionTimeMs : Math.min(skill.fastestMs, result.reactionTimeMs),
        reactionTimes: [...skill.reactionTimes, result.reactionTimeMs].slice(-30),
        lastSeenAt: result.timestamp || new Date().toISOString(),
      },
    },
    patterns: {
      ...profile.patterns,
      [patternKey]: {
        attempts: nextPatternAttempts,
        correct: nextPatternCorrect,
        masteryScore: Number(Math.min(1, nextPatternCorrect / Math.max(5, nextPatternAttempts)).toFixed(2)),
      },
    },
    recentResults: [
      ...profile.recentResults,
      { correct: result.correct, reactionTimeMs: result.reactionTimeMs, timestamp: result.timestamp },
    ].slice(-20),
  };
}

export function recordEducationEarning(
  profile: PlayerLearningProfile,
  subject: 'spelling' | 'multiplication',
  dollars: number
): PlayerLearningProfile {
  return applyEducationResult(profile, {
    subject,
    skillId: `${subject}.earning`,
    patternFamily: subject,
    correct: true,
    firstTry: false,
    reactionTimeMs: 0,
    xp: 0,
    coins: 0,
    dollars,
  });
}

export function loadLearningProfile(storage: Storage = localStorage): PlayerLearningProfile {
  try {
    const saved = JSON.parse(storage.getItem(EDUCATION_PROFILE_STORAGE_KEY) || 'null');
    if (!saved?.profileName) return createDefaultLearningProfile();
    return {
      ...createDefaultLearningProfile(saved.profileName),
      ...saved,
      subjects: {
        ...createDefaultLearningProfile(saved.profileName).subjects,
        ...(saved.subjects || {}),
      },
    };
  } catch {
    return createDefaultLearningProfile();
  }
}

export function saveLearningProfile(profile: PlayerLearningProfile, storage: Storage = localStorage): void {
  storage.setItem(EDUCATION_PROFILE_STORAGE_KEY, JSON.stringify(profile, null, 2));
}
