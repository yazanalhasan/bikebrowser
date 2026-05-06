export default function CommutativeMirrorIllustration({ factorA = 4, factorB = 6 }) {
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        <rect x="46" y="58" width="120" height="170" rx="8" fill="#dbeafe" stroke="#2459ff" strokeWidth="4" />
        <rect x="254" y="58" width="120" height="170" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="4" />
        <path d="M178 142h64" stroke="#17212b" strokeWidth="5" markerEnd="url(#mirrorArrow)" />
        <text x="106" y="150" textAnchor="middle" fontSize="28" fontWeight="900">{factorA} x {factorB}</text>
        <text x="314" y="150" textAnchor="middle" fontSize="28" fontWeight="900">{factorB} x {factorA}</text>
        <text x="210" y="262" textAnchor="middle" fontSize="22" fontWeight="900">Same structure, rotated</text>
        <defs><marker id="mirrorArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#17212b" /></marker></defs>
      </svg>
    </div>
  );
}
