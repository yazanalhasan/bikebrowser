import React from 'react';
import { Volume2 } from 'lucide-react';
import LetterTile from '../../components/accessibility/LetterTile';
import { speak } from '../../accessibility/speechEngine';

export default function LetterDetectiveQuestion({
  mode,
  difficulty,
  lastChoice,
  onAnswer,
}) {
  const tileSize = difficulty.largeTiles ? 'lg' : 'md';

  return (
    <div className="letter-detective-question">
      <div className="letter-detective-prompt">
        <div>
          <p>{mode.title}</p>
          <h2>{mode.prompt}</h2>
        </div>
        <button
          type="button"
          onClick={() => speak(mode.soundPrompt)}
          className="letter-detective-audio-button"
        >
          <Volume2 size={18} /> Hear it
        </button>
      </div>

      <div className={`letter-detective-options ${mode.options.length > 4 ? 'is-grid' : ''}`}>
        {mode.options.map((choice, index) => (
          <LetterTile
            key={`${mode.id}-${choice}-${index}`}
            letter={choice}
            size={tileSize}
            correct={lastChoice?.choice === choice && lastChoice.correct}
            incorrect={lastChoice?.choice === choice && !lastChoice.correct}
            playAudio={false}
            onClick={() => onAnswer(choice)}
          />
        ))}
      </div>
    </div>
  );
}
