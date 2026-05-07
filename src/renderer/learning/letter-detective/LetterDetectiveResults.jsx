import React from 'react';
import { Headphones, Sparkles } from 'lucide-react';
import AccessibleText from '../../components/accessibility/AccessibleText';
import { speakLetter } from '../../accessibility/speechEngine';

export default function LetterDetectiveResults({
  progress,
  accuracy,
  difficulty,
  feedback,
  lastChoice,
  answer,
}) {
  return (
    <aside className="letter-detective-results">
      <h2><Sparkles size={20} /> Rewards</h2>
      <div className="letter-detective-stats">
        <div>
          <span>Score</span>
          <strong data-testid="letter-detective-score">{progress.score || 0}</strong>
        </div>
        <div>
          <span>Streak</span>
          <strong>{progress.streak}</strong>
        </div>
        <div>
          <span>Accuracy</span>
          <strong>{accuracy}%</strong>
        </div>
      </div>
      <p>+1 point for a correct answer.</p>
      <p>+2 every 5 correct in a row.</p>
      <p>Speed bonus starts after steady accuracy.</p>
      <p>No points are subtracted for mixed-up letters.</p>
      {difficulty.emphasizeBD && (
        <div className="letter-detective-note">
          b/d practice is getting extra-large tiles and no speed pressure.
        </div>
      )}
      <div className="letter-detective-feedback">
        {feedback}
      </div>
      {lastChoice && !lastChoice.correct && (
        <div className="letter-detective-contrast">
          <span>Look closely</span>
          <strong><AccessibleText text={lastChoice.choice} isolatedTile /></strong>
          <span>is not</span>
          <strong><AccessibleText text={answer} isolatedTile /></strong>
        </div>
      )}
      <button
        type="button"
        onClick={() => speakLetter(answer)}
        className="letter-detective-sound-button"
      >
        <Headphones size={18} /> Letter sound
      </button>
    </aside>
  );
}
