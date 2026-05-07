import { calculateTimingMetrics } from './ReactionTimingEngine.ts';
import { calculateReward } from './RewardCalculationEngine.ts';
import { applyEducationResult, type PlayerLearningProfile } from './PlayerLearningProfile.ts';

export interface EducationQuestion {
  questionId?: string;
  subject: string;
  skillId: string;
  patternFamily?: string;
  prompt: string;
  answer: string | number;
  difficulty: number;
  shownAt?: number;
}

export function createEducationSessionEngine({
  now = () => performance.now(),
  initialProfile,
}: {
  now?: () => number;
  initialProfile: PlayerLearningProfile;
}) {
  let profile = initialProfile;
  const activeQuestions = new Map<string, Required<EducationQuestion>>();

  return {
    getProfile() {
      return profile;
    },
    startQuestion(question: EducationQuestion) {
      const questionId = question.questionId || `${question.skillId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const started = {
        ...question,
        questionId,
        patternFamily: question.patternFamily || 'general',
        shownAt: question.shownAt ?? now(),
      } as Required<EducationQuestion>;
      activeQuestions.set(questionId, started);
      return started;
    },
    submitAnswer(questionId: string, answer: string | number) {
      const question = activeQuestions.get(questionId);
      if (!question) throw new Error(`Unknown education question: ${questionId}`);
      const skill = profile.skills[question.skillId];
      const timing = calculateTimingMetrics({
        questionShownAt: question.shownAt,
        answerSubmittedAt: now(),
        previousReactionTimes: skill?.reactionTimes || [],
      });
      const normalizedExpected = String(question.answer).trim().toLowerCase();
      const normalizedActual = String(answer).trim().toLowerCase();
      const correct = normalizedExpected === normalizedActual;
      const subject = profile.subjects[question.subject] || { attempts: 0, correct: 0, streak: 0, bestStreak: 0 };
      const firstTry = !skill || skill.attempts === 0;
      const patternMastery = profile.patterns[question.patternFamily]?.masteryScore || 0.5;
      const reward = calculateReward({
        subject: question.subject,
        correct,
        firstTry,
        difficulty: question.difficulty,
        streak: correct ? subject.streak + 1 : 0,
        improvementDelta: timing.rollingAverageMs && timing.reactionTimeMs < timing.rollingAverageMs ? 0.15 : 0,
        patternMastery,
        timing,
      });

      profile = applyEducationResult(profile, {
        subject: question.subject,
        skillId: question.skillId,
        patternFamily: question.patternFamily,
        correct,
        firstTry,
        reactionTimeMs: timing.reactionTimeMs,
        xp: reward.xp,
        coins: reward.coins,
      });
      activeQuestions.delete(questionId);

      return { correct, timing, reward, profile, expectedAnswer: question.answer };
    },
  };
}
