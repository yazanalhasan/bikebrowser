import React from 'react';
import './predictbar.css';

// Reusable "predict the verdict before you run it" control. The player must pick
// an expected outcome to enable the run; after the test the actual outcome is
// revealed and the prediction is marked right/wrong.
export default function PredictBar({ prompt = 'Predict the result before you run it:', options, predicted, onPredict, revealed, actual, disabled }) {
  const correct = revealed && predicted != null && predicted === actual;
  return (
    <div className={`pb ${revealed ? (correct ? 'pb--right' : 'pb--wrong') : ''}`}>
      <div className="pb__prompt">
        {revealed ? (correct ? '✓ You predicted it!' : '✗ Not quite — the result is highlighted') : prompt}
      </div>
      <div className="pb__opts">
        {options.map((o) => {
          const isPred = predicted === o.id;
          const isActual = revealed && actual === o.id;
          return (
            <button
              key={o.id}
              type="button"
              className={`pb__opt ${isPred ? 'pb__opt--pred' : ''} ${isActual ? 'pb__opt--actual' : ''}`}
              style={{ '--pb-c': o.color }}
              disabled={disabled || revealed}
              onClick={() => onPredict(o.id)}
              title={isActual ? 'Actual result' : isPred ? 'Your prediction' : ''}
            >
              {o.label}{isActual ? ' ●' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
