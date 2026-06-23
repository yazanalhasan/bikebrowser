import React from 'react';
import { SPAN, VERDICT_LABEL, VERDICT_COLOR } from './bridgeModel.js';
import { STRUCTURAL_ROLES } from './bridgeTasks.js';

const ROLE_LABEL = { deck: 'Deck', cables: 'Cables', towers: 'Towers' };

export default function BridgeResultsPanel({ sim, materials, onRetry, onClose }) {
  if (!sim) return null;
  const allowable = SPAN / 360;
  const limit = SPAN / 200;
  const color = VERDICT_COLOR[sim.verdict];
  const exceeded = sim.maxDeflection > allowable;

  return (
    <div className="br-modal" role="dialog" aria-modal="true">
      <div className="br-modal__panel">
        <div className="br-modal__head">
          <span className="br-modal__dot" style={{ background: color }} />
          <h2>Structural Report</h2>
        </div>

        <div className="br-modal__row">
          <div className="br-modal__line"><span>Max Deflection</span><span style={{ color: exceeded ? '#F87171' : '#4ade80' }}>{sim.maxDeflection.toFixed(3)} u</span></div>
          <div className="br-modal__line"><span>Allowable (L/360)</span><span style={{ color: '#cbd5e1' }}>{allowable.toFixed(3)} u</span></div>
          <div className="br-modal__bar"><div className="br-modal__fill" style={{ width: `${Math.min(100, (sim.maxDeflection / limit) * 100)}%`, background: color }} /></div>
        </div>

        <div className="br-modal__mats">
          {STRUCTURAL_ROLES.map((role) => (
            <div className="br-modal__mat" key={role}>
              <span className="br-chip__role">{ROLE_LABEL[role]}</span>
              <span style={{ color: '#fff' }}>{materials[role].name}</span>
              <span className="br-chip__badge" style={{ color: sim.suit[role].color, borderColor: `${sim.suit[role].color}66` }}>{sim.suit[role].label}</span>
            </div>
          ))}
        </div>

        <div className="br-modal__verdict" style={{ color, borderColor: `${color}66`, background: `${color}14` }}>
          <p>{VERDICT_LABEL[sim.verdict]}</p>
          {sim.failureReason && <p className="br-modal__reason">{sim.failureReason}</p>}
        </div>

        <div className="br-modal__actions">
          <button type="button" className="utm-btn utm-btn--ghost" onClick={onRetry}>← Retry Materials</button>
          <button type="button" className="utm-btn utm-btn--run" onClick={onClose} disabled={sim.verdict === 'fail'}>{sim.verdict === 'fail' ? 'Failed' : 'Continue →'}</button>
        </div>
      </div>
    </div>
  );
}
