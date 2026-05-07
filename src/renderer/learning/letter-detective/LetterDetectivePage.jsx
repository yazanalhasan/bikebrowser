import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAccessibility } from '../../accessibility/accessibilityHooks';
import { speak } from '../../accessibility/speechEngine';
import { LETTER_DETECTIVE_MODES } from './letterDetectiveData';
import {
  getLetterDetectiveDifficulty,
  loadLetterDetectiveProgress,
  recordLetterDetectiveAttempt,
  saveLetterDetectiveProgress,
} from './LetterDetectiveEngine';
import LetterDetectiveQuestion from './LetterDetectiveQuestion';
import LetterDetectiveResults from './LetterDetectiveResults';

const SPEED_THRESHOLD_MS = 2500;

export default function LetterDetectivePage() {
  const { profile } = useAccessibility();
  const [progress, setProgress] = useState(() => loadLetterDetectiveProgress());
  const [modeIndex, setModeIndex] = useState(0);
  const [roundStartedAt, setRoundStartedAt] = useState(() => Date.now());
  const [feedback, setFeedback] = useState('Find the matching letter.');
  const [lastChoice, setLastChoice] = useState(null);
  const mode = LETTER_DETECTIVE_MODES[modeIndex];
  const difficulty = useMemo(() => getLetterDetectiveDifficulty(progress), [progress]);

  function startMode(index) {
    setModeIndex(index);
    setRoundStartedAt(Date.now());
    setLastChoice(null);
    setFeedback(LETTER_DETECTIVE_MODES[index].prompt);
    if (profile.phonemeAudio) {
      speak(LETTER_DETECTIVE_MODES[index].soundPrompt);
    }
  }

  function handleAnswer(choice) {
    const correct = choice === mode.answer;
    const elapsedMs = Date.now() - roundStartedAt;
    const result = recordLetterDetectiveAttempt(progress, {
      target: mode.answer,
      choice,
      correct,
      elapsedMs,
      speedBonusEnabled: difficulty.speedBonusEnabled,
      speedThresholdMs: SPEED_THRESHOLD_MS,
      confusablePair: mode.confusablePair,
    });
    const message = correct
      ? mode.feedback
      : mode.explanation.replace('{choice}', choice);

    setProgress(saveLetterDetectiveProgress(result.progress));
    setLastChoice({ choice, correct });
    setFeedback(message);
    if (profile.phonemeAudio) speak(message);
  }

  const accuracy = progress.totalAttempts
    ? Math.round((progress.totalCorrect / progress.totalAttempts) * 100)
    : 100;

  return (
    <div className="letter-detective-page">
      <main className="letter-detective-shell">
        <section className="letter-detective-hero">
          <div>
            <p>Reading practice</p>
            <h1>Letter Detective</h1>
          </div>
        </section>

        <section className="letter-detective-modes">
          {LETTER_DETECTIVE_MODES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => startMode(index)}
              className={mode.id === item.id ? 'is-active' : ''}
            >
              <span><Search size={18} /></span>
              <strong>{item.title}</strong>
              <small>{item.prompt}</small>
            </button>
          ))}
        </section>

        <section className="letter-detective-workspace">
          <LetterDetectiveQuestion
            mode={mode}
            difficulty={difficulty}
            lastChoice={lastChoice}
            onAnswer={handleAnswer}
          />
          <LetterDetectiveResults
            progress={progress}
            accuracy={accuracy}
            difficulty={difficulty}
            feedback={feedback}
            lastChoice={lastChoice}
            answer={mode.answer}
          />
        </section>
      </main>
    </div>
  );
}
