export default function DoublingVisualizer({ factorA = 4, factorB = 6 }) {
  const layers = factorA >= 8 ? [2, 4, 8] : factorA >= 4 ? [2, 4] : [2];
  return (
    <div className="edu-illustration" aria-label="Doubling pattern">
      <svg viewBox="0 0 420 300">
        {layers.map((layer, index) => (
          <g key={layer} className="edu-group edu-pulse" style={{ animationDelay: `${index * 180}ms` }}>
            <rect x={40 + index * 108} y={60} width="82" height={layer * 18} rx="8" fill={['#2459ff', '#14b8a6', '#ffb330'][index]} opacity="0.85" />
            <text x={81 + index * 108} y={48} textAnchor="middle" fontSize="20" fontWeight="900">{layer} x {factorB}</text>
            <text x={81 + index * 108} y={92 + layer * 18} textAnchor="middle" fontSize="18" fontWeight="900">{layer * factorB}</text>
          </g>
        ))}
        <path d="M130 125h70M238 125h70" stroke="#17212b" strokeWidth="4" markerEnd="url(#arrow)" opacity="0.45" />
        <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#17212b" /></marker></defs>
      </svg>
    </div>
  );
}
