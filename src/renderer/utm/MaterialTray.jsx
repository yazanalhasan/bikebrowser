import React from 'react';

export const DND_MIME = 'application/x-utm-material';

// Chip texture: repeating diagonal lines, angle per material category.
function patternStyle(material) {
  const angle = material.patternAngle ?? 45;
  return {
    background: material.color,
    backgroundImage: `repeating-linear-gradient(${angle}deg, ${material.detailColor}66 0 2px, transparent 2px 7px)`,
  };
}

export default function MaterialTray({ materials, selectedId, onSelect }) {
  return (
    <div className="utm-tray" role="list" aria-label="Material samples">
      <div className="utm-tray__title">Samples</div>
      {materials.map((m) => (
        <div
          key={m.id}
          role="listitem"
          className={`utm-chip ${selectedId === m.id ? 'utm-chip--sel' : ''}`}
          style={patternStyle(m)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(DND_MIME, m.id);
            e.dataTransfer.setData('text/plain', m.id);
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => onSelect(m.id)}
          title={`${m.name} — drag into the grips`}
        >
          <span className="utm-chip__name">{m.name}</span>
        </div>
      ))}
    </div>
  );
}
