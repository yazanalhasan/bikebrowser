import React from 'react';
import CurveThumbnail from './CurveThumbnail.jsx';
import { STRESS_UNIT } from './utmMaterials.js';

// Library of previously tested materials (persisted in localStorage). Clicking a
// card re-populates the result card without re-running the test.
export default function LibraryModal({ open, items, onPick, onClose, onClear }) {
  if (!open) return null;
  return (
    <div className="utm-modal" role="dialog" aria-modal="true" aria-label="Material library" onClick={onClose}>
      <div className="utm-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="utm-modal__head">
          <span>Material Library ({items.length})</span>
          <div className="utm-drawer__actions">
            <button type="button" className="utm-btn utm-btn--ghost" onClick={onClear} disabled={!items.length}>Clear</button>
            <button type="button" className="utm-iconbtn" onClick={onClose} aria-label="Close library">×</button>
          </div>
        </div>
        <div className="utm-modal__grid">
          {items.length === 0 && <p className="utm-drawer__empty">No tested materials yet.</p>}
          {items.map((r) => (
            <button type="button" className="utm-libcard" key={r.id} onClick={() => onPick(r)}>
              <div className="utm-col__head">
                <span className="utm-col__swatch" style={{ background: r.color }} />
                <span className="utm-col__name">{r.name}</span>
              </div>
              <CurveThumbnail material={r.material || r} width={120} height={70} />
              <dl className="utm-col__props">
                <div><dt>YS</dt><dd>{r.yieldStrength} {STRESS_UNIT}</dd></div>
                <div><dt>UTS</dt><dd>{r.UTS} {STRESS_UNIT}</dd></div>
                <div><dt>E</dt><dd>{r.youngsModulus}/10</dd></div>
              </dl>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
