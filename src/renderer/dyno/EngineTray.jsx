import React from 'react';

export const ENGINE_DND = 'application/x-utm-engine';

export default function EngineTray({ engines, selectedId, onSelect }) {
  return (
    <div className="utm-tray" role="list" aria-label="Engines">
      <div className="utm-tray__title">Engines</div>
      {engines.map((e) => (
        <div
          key={e.id}
          role="listitem"
          className={`utm-chip ${selectedId === e.id ? 'utm-chip--sel' : ''}`}
          style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${e.color}33, transparent 60%)` }}
          draggable
          onDragStart={(ev) => { ev.dataTransfer.setData(ENGINE_DND, e.id); ev.dataTransfer.setData('text/plain', e.id); ev.dataTransfer.effectAllowed = 'copy'; }}
          onClick={() => onSelect(e.id)}
          title={`${e.name} — ${e.displacement}cc`}
        >
          <span className="utm-chip__name" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: e.color, flex: 'none', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.25)' }} />
            {e.name}
          </span>
          <span style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 10, color: '#9fb0c4' }}>{e.displacement}cc</span>
        </div>
      ))}
    </div>
  );
}
