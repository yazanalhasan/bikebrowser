import React, { useEffect, useState } from 'react';

function Icon({ icon }) {
  const c = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (icon === 'check') return (<svg {...c}><path d="M20 6 9 17l-5-5" /></svg>);
  if (icon === 'warn') return (<svg {...c}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>);
  return (<svg {...c}><path d="M18 6 6 18M6 6l12 12" /></svg>);
}

export default function CrashResultCard({ result, mode, rating }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id); }, [result?.material?.id, mode]);
  if (!result) return null;

  const rows = mode === 'load'
    ? [
      { label: 'Ultimate Load', value: `${result.ultimateLoadKN} kN` },
      { label: 'Max Deflection', value: `${result.maxDeflectionMm} mm` },
    ]
    : [
      { label: 'Peak G-Force', value: `${result.peakGForce} G` },
      { label: 'Cabin Intrusion', value: `${result.intrusionMm} mm` },
      { label: 'Energy Absorbed', value: `${result.energyAbsorptionPct} %` },
      { label: 'Safety Rating', value: '★'.repeat(result.safetyRating) + '☆'.repeat(5 - result.safetyRating) },
    ];

  return (
    <div className={`utm-card ${shown ? 'utm-card--in' : ''}`} style={{ boxShadow: `0 8px 28px rgba(0,0,0,.45), 0 0 0 1px ${result.material.color}44` }}>
      <div className="utm-card__header">
        <div>
          <div className="utm-card__name">{result.material.name}</div>
          <div className="utm-card__cat">{mode === 'load' ? 'Frame Integrity' : 'Passenger Safety'}</div>
        </div>
        <div className="utm-card__swatch" style={{ background: result.material.color }} />
      </div>
      <div className="utm-card__grid">
        {rows.map((p) => (
          <div className="utm-card__row" key={p.label}>
            <span className="utm-card__label">{p.label}</span>
            <span className="utm-card__value">{p.value}</span>
          </div>
        ))}
      </div>
      <div className="utm-card__suit">
        <div className="utm-card__rating" style={{ color: rating.color }}><Icon icon={rating.icon} /><span>{rating.label}</span></div>
        <p className="utm-card__reason">{rating.reason}</p>
      </div>
    </div>
  );
}
