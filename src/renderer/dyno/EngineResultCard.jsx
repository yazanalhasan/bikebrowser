import React, { useEffect, useState } from 'react';
import { engineSuitability } from './dynoModel.js';

function Icon({ icon }) {
  const c = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (icon === 'check') return (<svg {...c}><path d="M20 6 9 17l-5-5" /></svg>);
  if (icon === 'warn') return (<svg {...c}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>);
  return (<svg {...c}><path d="M18 6 6 18M6 6l12 12" /></svg>);
}

const rows = (r) => [
  { label: 'Peak Torque', value: `${r.peakTorque} Nm` },
  { label: '@ RPM', value: `${r.peakTorqueRPM.toLocaleString()}` },
  { label: 'Peak Power', value: `${r.peakPower} kW` },
  { label: '@ RPM', value: `${r.peakPowerRPM.toLocaleString()}` },
  { label: 'Redline', value: `${r.redlineRPM.toLocaleString()} RPM` },
  ...(r.powerToWeight != null ? [{ label: 'Power-to-Weight', value: `${r.powerToWeight} W/kg` }] : []),
];

export default function EngineResultCard({ result, mission, onAddToComparison }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id); }, [result?.id]);
  if (!result) return null;
  const rating = engineSuitability(result.engine, mission);

  return (
    <div className={`utm-card ${shown ? 'utm-card--in' : ''}`} style={{ boxShadow: `0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px ${result.color}44, 0 0 22px ${result.color}33` }}>
      <div className="utm-card__header">
        <div>
          <div className="utm-card__name">{result.name}</div>
          <div className="utm-card__cat">{result.category} · {result.engine.displacement}cc</div>
        </div>
        <div className="utm-card__swatch" style={{ background: result.color }} />
      </div>
      <div className="utm-card__grid">
        {rows(result).map((p, i) => (
          <div className="utm-card__row" key={p.label + i}>
            <span className="utm-card__label">{p.label}</span>
            <span className="utm-card__value">{p.value}</span>
          </div>
        ))}
      </div>
      <div className="utm-card__suit">
        <div className="utm-card__suit-head">
          <span className="utm-card__suit-title">Suitability for Mission</span>
          <span className="utm-card__badge">{mission?.name || '—'}</span>
        </div>
        <div className="utm-card__rating" style={{ color: rating.color }}><Icon icon={rating.icon} /><span>{rating.label}</span></div>
        <p className="utm-card__reason">{rating.reason}</p>
      </div>
      {onAddToComparison && (
        <button type="button" className="utm-btn utm-btn--ghost" onClick={() => onAddToComparison(result)}>+ Add to Comparison</button>
      )}
    </div>
  );
}
