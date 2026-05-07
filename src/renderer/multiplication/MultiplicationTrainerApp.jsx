import React, { useMemo, useRef, useState } from 'react';
import { Calculator, Gauge, Wrench } from 'lucide-react';
import LearningHUD from '../components/education/LearningHUD.jsx';
import SharedRewardPopup from '../components/education/SharedRewardPopup.jsx';
import ComboMeter from '../components/education/ComboMeter.jsx';
import SpeedGauge from '../components/education/SpeedGauge.jsx';
import MasteryProgressRing from '../components/education/MasteryProgressRing.jsx';
import MultiplicationVisualizer from '../components/education/MultiplicationVisualizer.jsx';
import MathMasteryGraph from '../components/education/MathMasteryGraph.jsx';
import '../components/education/education.css';
import {
  createDefaultLearningProfile,
  loadLearningProfile,
  saveLearningProfile,
} from '../services/education/PlayerLearningProfile.ts';
import { calculateTimingMetrics } from '../services/education/ReactionTimingEngine.ts';
import { calculateReward } from '../services/education/RewardCalculationEngine.ts';
import { applyEducationResult } from '../services/education/PlayerLearningProfile.ts';
import { createPatternSequence, createMultiplicationQuestion, MULTIPLICATION_PATTERN_ORDER } from '../services/education/MultiplicationPatternEngine.ts';
import { createScenarioForPattern } from '../services/education/MechanicalMultiplicationScenarios.ts';
import { calculateFlowState } from '../services/education/FlowStateEngine.ts';
import { analyzeMistakes } from '../services/education/MistakeAnalysisEngine.ts';
import { buildSharedProfile, getProfileSyncKey, pullSharedProfile, pushSharedProfile } from '../services/profileSyncClient.js';

function money(value) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function buildQuestionQueue(profile) {
  const multiplication = profile.subjects?.multiplication || {};
  const tableIndex = Math.min(MULTIPLICATION_PATTERN_ORDER.length - 1, Math.floor((multiplication.correct || 0) / 8));
  const table = MULTIPLICATION_PATTERN_ORDER[tableIndex];
  if ([2, 4, 8].includes(table)) return createPatternSequence({ family: table, anchor: 4, length: 4 });
  if (table === 7) return createPatternSequence({ family: 7, length: 4 });
  return Array.from({ length: 6 }, (_, index) => createMultiplicationQuestion(table, index + 1));
}

export default function MultiplicationTrainerApp() {
  const [profile, setProfile] = useState(() => loadLearningProfile?.() || createDefaultLearningProfile());
  const [syncStatus, setSyncStatus] = useState(() => getProfileSyncKey() ? 'Cloud sync ready.' : 'Cloud sync off.');
  const [queue, setQueue] = useState(() => buildQuestionQueue(profile));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('Look for the mechanical pattern, then answer.');
  const [lastReward, setLastReward] = useState(null);
  const [lastTiming, setLastTiming] = useState(null);
  const [visualMode, setVisualMode] = useState('mechanic');
  const [mistakes, setMistakes] = useState([]);
  const shownAtRef = useRef(performance.now());
  const syncKeyRef = useRef(getProfileSyncKey());
  const syncHydratedRef = useRef(false);
  const syncPushTimerRef = useRef(null);

  const currentQuestion = queue[questionIndex] || queue[0];
  const subject = profile.subjects?.multiplication || {};
  const skillRecord = profile.skills?.[currentQuestion.skillId];
  const scenario = useMemo(
    () => createScenarioForPattern(currentQuestion.factorA, currentQuestion.factorB),
    [currentQuestion.factorA, currentQuestion.factorB]
  );
  const flowState = calculateFlowState({ recentResults: profile.recentResults || [], currentStreak: subject.streak || 0 });
  const mistakeAnalysis = analyzeMistakes(mistakes);

  React.useEffect(() => {
    let cancelled = false;

    async function hydrateMathProfile() {
      const syncKey = syncKeyRef.current;
      if (!syncKey) return;

      try {
        const result = await pullSharedProfile({ syncKey });
        if (cancelled) return;

        if (result.ok && result.profile?.educationProfile) {
          setProfile(result.profile.educationProfile);
          saveLearningProfile(result.profile.educationProfile);
          setQueue(buildQuestionQueue(result.profile.educationProfile));
          setQuestionIndex(0);
          setSyncStatus('Synced math ledger from cloud.');
        } else if (result.status === 'missing') {
          const saved = await pushSharedProfile(buildSharedProfile({ educationProfile: profile }), { syncKey });
          if (!cancelled) setSyncStatus(saved.ok ? 'Created shared profile from this math ledger.' : saved.error);
        } else {
          setSyncStatus(result.error || 'Using this device math ledger.');
        }
      } catch (error) {
        if (!cancelled) setSyncStatus(`Cloud sync unavailable. ${error.message || ''}`.trim());
      } finally {
        syncHydratedRef.current = true;
      }
    }

    hydrateMathProfile();
    return () => {
      cancelled = true;
      if (syncPushTimerRef.current) window.clearTimeout(syncPushTimerRef.current);
    };
  }, []);

  function persist(nextProfile) {
    setProfile(nextProfile);
    saveLearningProfile(nextProfile);
    const syncKey = syncKeyRef.current;
    if (syncKey) {
      if (syncPushTimerRef.current) window.clearTimeout(syncPushTimerRef.current);
      syncPushTimerRef.current = window.setTimeout(async () => {
        try {
          const result = await pushSharedProfile(buildSharedProfile({ educationProfile: nextProfile }), { syncKey });
          setSyncStatus(result.ok ? 'Saved math ledger to cloud.' : result.error);
        } catch (error) {
          setSyncStatus(`Cloud save failed; math progress is safe locally. ${error.message || ''}`.trim());
        }
      }, syncHydratedRef.current ? 500 : 1000);
    }
  }

  function advance(nextProfile = profile) {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= queue.length) {
      const nextQueue = buildQuestionQueue(nextProfile);
      setQueue(nextQueue);
      setQuestionIndex(0);
    } else {
      setQuestionIndex(nextIndex);
    }
    setAnswer('');
    shownAtRef.current = performance.now();
  }

  function submitAnswer(event) {
    event.preventDefault();
    const submitted = Number(answer);
    if (!Number.isFinite(submitted)) {
      setFeedback('Type the product, then press Enter.');
      return;
    }

    const timing = calculateTimingMetrics({
      questionShownAt: shownAtRef.current,
      answerSubmittedAt: performance.now(),
      previousReactionTimes: skillRecord?.reactionTimes || [],
    });
    const correct = submitted === currentQuestion.answer;
    const nextStreak = correct ? (subject.streak || 0) + 1 : 0;
    const reward = calculateReward({
      subject: 'multiplication',
      correct,
      firstTry: !skillRecord || skillRecord.attempts === 0,
      difficulty: Math.max(1, Math.ceil(Math.max(currentQuestion.factorA, currentQuestion.factorB) / 3)),
      streak: nextStreak,
      improvementDelta: timing.rollingAverageMs && timing.reactionTimeMs < timing.rollingAverageMs ? 0.15 : 0,
      patternMastery: profile.patterns?.[currentQuestion.family]?.masteryScore || 0.5,
      timing,
    });
    const dollars = reward.coins / 100;
    const nextProfile = applyEducationResult(profile, {
      subject: 'multiplication',
      skillId: currentQuestion.skillId,
      patternFamily: currentQuestion.family,
      correct,
      firstTry: !skillRecord || skillRecord.attempts === 0,
      reactionTimeMs: timing.reactionTimeMs,
      xp: reward.xp,
      coins: reward.coins,
      dollars,
    });

    if (!correct) {
      setMistakes((current) => [
        ...current,
        {
          factorA: currentQuestion.factorA,
          factorB: currentQuestion.factorB,
          answer: submitted,
          correctAnswer: currentQuestion.answer,
          reactionTimeMs: timing.reactionTimeMs,
        }
      ].slice(-12));
      setFeedback(`Close. ${currentQuestion.expression} is ${currentQuestion.answer}. Try the split: ${currentQuestion.explanation}`);
    } else {
      setFeedback(`${currentQuestion.expression} = ${currentQuestion.answer}. ${scenario.story}`);
    }

    setLastTiming(timing);
    setLastReward({ ...reward, dollars, correct });
    persist(nextProfile);
    window.setTimeout(() => advance(nextProfile), correct ? 850 : 1500);
  }

  return (
    <div className="education-shell">
      <header className="education-topbar">
        <div className="education-title">
          <p>BikeBrowser Math Garage</p>
          <h1>Multiplication Intelligence</h1>
        </div>
        <div className="math-side-card">
          <span className="math-card-label">Flow</span>
          <strong>{flowState.level}</strong>
          <small>{syncStatus}</small>
        </div>
      </header>

      <LearningHUD profile={profile} />

      <nav className="math-mode-tabs" aria-label="Visual learning modes">
        {[
          ['mechanic', 'Mechanic'],
          ['array', 'Array'],
          ['decompose', 'Split'],
          ['mirror', 'Mirror'],
          ['finger', '9s Trick'],
        ].map(([mode, label]) => (
          <button key={mode} type="button" className={visualMode === mode ? 'active' : ''} onClick={() => setVisualMode(mode)}>
            {label}
          </button>
        ))}
      </nav>

      <main className="multiplication-layout">
        <section className="math-panel">
          <div className="math-question-row">
            <div>
              <span className="math-card-label">{currentQuestion.family} · {currentQuestion.primaryType}</span>
              <h2 className="math-expression">{currentQuestion.expression}</h2>
            </div>
            <MasteryProgressRing mastery={profile.patterns?.[currentQuestion.family]?.masteryScore || 0} label="Pattern" />
          </div>

          <div className="math-visual-stage">
            <MultiplicationVisualizer question={currentQuestion} mode={visualMode} />
          </div>

          <form className="math-answer-form" onSubmit={submitAnswer}>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              aria-label="Multiplication answer"
              placeholder="Answer"
              autoFocus
            />
            <button type="submit"><Calculator size={20} /> Check</button>
          </form>

          <SharedRewardPopup reward={lastReward} dollars={lastReward?.dollars || 0} />
        </section>

        <aside className="math-side">
          <div className="math-side-card">
            <span className="math-card-label">Mechanical model</span>
            <h2><Wrench size={20} /> {scenario.theme}</h2>
            <p>{scenario.story}</p>
          </div>
          <div className="math-side-card">
            <span className="math-card-label">Reasoning prompt</span>
            <h2>{currentQuestion.reflectionPrompt}</h2>
            <p>{currentQuestion.explanation}</p>
          </div>
          <div className="math-side-card">
            <SpeedGauge timing={lastTiming} />
          </div>
          <div className="math-side-card">
            <ComboMeter streak={subject.streak || 0} />
          </div>
          <div className="math-side-card">
            <span className="math-card-label"><Gauge size={16} /> Coach</span>
            <p>{feedback}</p>
            {mistakeAnalysis.weaknesses.length ? (
              <p>Focus: {mistakeAnalysis.recommendedPatterns.slice(0, 2).join(', ')}</p>
            ) : (
              <p>Earned from math: {money(profile.earnings?.multiplicationDollars)}</p>
            )}
          </div>
          <MathMasteryGraph profile={profile} />
        </aside>
      </main>
    </div>
  );
}
