export default function MultiplicationArrayIllustration({ factorA = 4, factorB = 6 }) {
  const cells = [];
  for (let row = 0; row < factorA; row += 1) {
    for (let col = 0; col < factorB; col += 1) {
      cells.push({ row, col });
    }
  }
  return (
    <div className="edu-illustration" aria-label={`${factorA} rows of ${factorB}`}>
      <svg viewBox="0 0 420 300">
        {cells.map(({ row, col }) => (
          <rect
            key={`${row}-${col}`}
            className={row === 0 || col === 0 ? 'edu-pulse' : ''}
            x={38 + col * 42}
            y={42 + row * 42}
            width="30"
            height="30"
            rx="6"
            fill={row % 2 ? '#22c55e' : '#2459ff'}
            opacity="0.82"
          />
        ))}
        <path d="M36 34h260M28 42v190" stroke="#17212b" strokeWidth="3" opacity="0.3" />
        <text x="36" y="270" fontSize="22" fontWeight="900" fill="#17212b">{factorA} groups x {factorB} each = {factorA * factorB}</text>
      </svg>
    </div>
  );
}
