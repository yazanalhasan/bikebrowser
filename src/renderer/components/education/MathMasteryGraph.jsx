import { MULTIPLICATION_PATTERN_ORDER } from '../../services/education/MultiplicationPatternEngine.ts';

export default function MathMasteryGraph({ profile }) {
  const patterns = profile.patterns || {};
  return (
    <div className="math-side-card">
      <span className="math-card-label">Mastery graph</span>
      <div className="mastery-graph-grid" aria-label="Multiplication table mastery">
        {MULTIPLICATION_PATTERN_ORDER.map((table) => {
          const mastery = patterns[`${table}s`]?.masteryScore || 0;
          const color = mastery > 0.8 ? '#22c55e' : mastery > 0.45 ? '#ffb330' : '#dce5ef';
          return (
            <div key={table} className="mastery-cell" style={{ background: color, color: mastery > 0.45 ? '#17212b' : '#5d6f83' }}>
              {table}
            </div>
          );
        })}
      </div>
    </div>
  );
}
