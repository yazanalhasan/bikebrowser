export default function BridgeBeamIllustration({ factorA = 4, factorB = 5 }) {
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        {Array.from({ length: factorA }, (_, beam) => (
          <g key={beam} className="edu-group">
            <rect x="42" y={54 + beam * 44} width="310" height="24" rx="5" fill={beam % 2 ? '#14b8a6' : '#2459ff'} opacity="0.8" />
            {Array.from({ length: factorB }, (_, bolt) => (
              <circle key={bolt} className="edu-pulse" cx={72 + bolt * 64} cy={66 + beam * 44} r="7" fill="#ffb330" />
            ))}
          </g>
        ))}
        <text x="42" y="268" fontSize="22" fontWeight="900">{factorA} beams x {factorB} bolts = {factorA * factorB}</text>
      </svg>
    </div>
  );
}
