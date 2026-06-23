import React from 'react';
import { UTM_MATERIALS } from '../utm/utmMaterials.js';
import { STRUCTURAL_ROLES, BRIDGE_TASKS } from './bridgeTasks.js';

const ROLE_LABEL = { deck: 'Deck', cables: 'Cables', towers: 'Towers' };

export default function MaterialAssignmentPanel({ materials, suit, onReassign, onRun, phase }) {
  const running = phase === 'loading';
  return (
    <div className="br-assign">
      <div className="utm-tray__title">Material Assignment</div>
      {STRUCTURAL_ROLES.map((role) => {
        const m = materials[role];
        const rating = suit[role];
        return (
          <div className="br-chip" key={role}>
            <div className="br-chip__head">
              <span className="br-chip__role">{ROLE_LABEL[role]}</span>
              <span className="br-chip__badge" style={{ color: rating.color, borderColor: `${rating.color}66` }}>{rating.label}</span>
            </div>
            <div className="br-chip__row">
              <span className="br-chip__swatch" style={{ background: m.color }} />
              <select value={m.id} onChange={(e) => onReassign(role, e.target.value)} disabled={running}>
                {UTM_MATERIALS.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
            <p className="br-chip__hint">{BRIDGE_TASKS[role].blurb}</p>
          </div>
        );
      })}
      <button type="button" className="utm-btn utm-btn--run" onClick={onRun} disabled={running} style={{ width: '100%', marginTop: 4 }}>
        {running ? 'Testing…' : '▶ Run Load Test'}
      </button>
    </div>
  );
}
