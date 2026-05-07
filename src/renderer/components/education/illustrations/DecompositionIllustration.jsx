export default function DecompositionIllustration({ factorA = 7, factorB = 8, decomposition }) {
  const parts = decomposition || [{ factorA: 5, factorB, product: 5 * factorB }, { factorA: factorA - 5, factorB, product: (factorA - 5) * factorB }];
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        {parts.map((part, index) => (
          <g key={index}>
            <rect x={50 + index * 172} y="70" width="136" height={part.factorA * 20} rx="8" fill={index ? '#22c55e' : '#2459ff'} opacity="0.82" />
            <text x={118 + index * 172} y="52" textAnchor="middle" fontSize="20" fontWeight="900">{part.factorA} x {factorB}</text>
            <text x={118 + index * 172} y={96 + part.factorA * 20} textAnchor="middle" fontSize="20" fontWeight="900">{part.product}</text>
          </g>
        ))}
        <text x="210" y="268" textAnchor="middle" fontSize="22" fontWeight="900">{factorA} x {factorB} = {parts.map((p) => p.product).join(' + ')} = {factorA * factorB}</text>
      </svg>
    </div>
  );
}
