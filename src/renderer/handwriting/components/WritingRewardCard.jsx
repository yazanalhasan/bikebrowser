import React from 'react';
import { RotateCcw, Sparkles, Star } from 'lucide-react';

export default function WritingRewardCard({ result, onResetProgress }) {
  const score = result?.scoring?.finalRewardScore || 0;
  const rewardTypes = result?.scoring?.rewardTypes || [];

  return (
    <aside className="bb-writing-reward-card">
      <h3><Sparkles size={18} /> Handwriting rewards</h3>
      <div className="bb-writing-stars" aria-label={`${score} effort stars`}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Star key={index} size={19} className={score >= index ? 'is-filled' : ''} />
        ))}
      </div>
      <p>{result?.feedback || 'Write once, then tap Check writing.'}</p>
      {rewardTypes.length > 0 && (
        <div className="bb-writing-reward-tags">
          {rewardTypes.map((reward) => <span key={reward}>{reward}</span>)}
        </div>
      )}
      <button type="button" className="bb-writing-reset-progress" onClick={onResetProgress}>
        <RotateCcw size={17} /> Reset handwriting progress
      </button>
    </aside>
  );
}
