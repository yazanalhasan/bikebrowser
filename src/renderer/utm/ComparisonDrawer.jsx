import React from 'react';
import CurveThumbnail from './CurveThumbnail.jsx';
import { STRESS_UNIT } from './utmMaterials.js';

// Side-by-side comparison of up to 3 tested materials.
export default function ComparisonDrawer({ open, items, onRemove, onClear, onClose }) {
  return (
    <aside className={`utm-drawer ${open ? 'utm-drawer--open' : ''}`} aria-hidden={!open}>
      <div className="utm-drawer__head">
        <span>Compare ({items.length}/3)</span>
        <div className="utm-drawer__actions">
          <button type="button" className="utm-btn utm-btn--ghost" onClick={onClear} disabled={!items.length}>Clear All</button>
          <button type="button" className="utm-iconbtn" onClick={onClose} aria-label="Close comparison">×</button>
        </div>
      </div>
      <div className="utm-drawer__cols">
        {items.length === 0 && <p className="utm-drawer__empty">Run a test and choose “Add to Comparison”.</p>}
        {items.map((m) => (
          <div className="utm-col" key={m.id}>
            <button type="button" className="utm-col__remove" onClick={() => onRemove(m.id)} aria-label={`Remove ${m.name}`}>×</button>
            <div className="utm-col__head">
              <span className="utm-col__swatch" style={{ background: m.color }} />
              <span className="utm-col__name">{m.name}</span>
            </div>
            <CurveThumbnail material={m} width={120} height={80} />
            <dl className="utm-col__props">
              <div><dt>YS</dt><dd>{m.yieldStrength} {STRESS_UNIT}</dd></div>
              <div><dt>UTS</dt><dd>{m.UTS} {STRESS_UNIT}</dd></div>
              <div><dt>E</dt><dd>{m.youngsModulus}/10</dd></div>
            </dl>
          </div>
        ))}
      </div>
    </aside>
  );
}
