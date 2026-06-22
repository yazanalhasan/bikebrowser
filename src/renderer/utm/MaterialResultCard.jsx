import React, { useEffect, useState } from 'react';
import { rateSuitability } from './suitability.js';
import { STRESS_UNIT } from './utmMaterials.js';

function RatingIcon({ icon }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (icon === 'check') return (<svg {...common}><path d="M20 6 9 17l-5-5" /></svg>);
  if (icon === 'warn') return (<svg {...common}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>);
  return (<svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>);
}

// result fields are sourced from the adapted material config (relative game units).
const props = (r) => ([
  { label: 'Yield Strength', value: `${r.yieldStrength} ${STRESS_UNIT}` },
  { label: 'Ultimate Tensile Strength', value: `${r.UTS} ${STRESS_UNIT}` },
  { label: 'Young’s Modulus', value: `${r.youngsModulus} / 10` },
  { label: 'Elongation at Break', value: `${r.elongationAtBreak} %` },
  { label: 'Density', value: `${r.density} (rel.)` },
]);

export default function MaterialResultCard({ result, buildTask, onAddToComparison }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id); }, [result?.id]);
  if (!result) return null;

  const rating = rateSuitability(result.material || result, buildTask);

  return (
    <div className={`utm-card ${shown ? 'utm-card--in' : ''}`} style={{ boxShadow: `0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px ${result.color}44, 0 0 22px ${result.color}33` }}>
      <div className="utm-card__header">
        <div>
          <div className="utm-card__name">{result.name}</div>
          <div className="utm-card__cat">{result.category}</div>
        </div>
        <div className="utm-card__swatch" style={{ background: result.color }} />
      </div>

      <div className="utm-card__grid">
        {props(result).map((p) => (
          <div className="utm-card__row" key={p.label}>
            <span className="utm-card__label">{p.label}</span>
            <span className="utm-card__value">{p.value}</span>
          </div>
        ))}
      </div>

      <div className="utm-card__suit">
        <div className="utm-card__suit-head">
          <span className="utm-card__suit-title">Suitability for Current Task</span>
          <span className="utm-card__badge">{buildTask?.name || '—'}</span>
        </div>
        <div className="utm-card__rating" style={{ color: rating.color }}>
          <RatingIcon icon={rating.icon} />
          <span>{rating.label}</span>
        </div>
        <p className="utm-card__reason">{rating.reason}</p>
      </div>

      {onAddToComparison && (
        <button type="button" className="utm-btn utm-btn--ghost" onClick={() => onAddToComparison(result)}>
          + Add to Comparison
        </button>
      )}
    </div>
  );
}
