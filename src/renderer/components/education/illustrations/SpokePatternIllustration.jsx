export default function SpokePatternIllustration({ factorA = 6, factorB = 4 }) {
  const total = factorA * factorB;
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        <circle cx="210" cy="145" r="104" fill="#f8fbff" stroke="#17212b" strokeWidth="8" opacity="0.8" />
        <circle cx="210" cy="145" r="20" fill="#ffb330" />
        {Array.from({ length: total }, (_, index) => {
          const angle = (Math.PI * 2 * index) / total;
          const color = Math.floor(index / factorB) % 2 ? '#22c55e' : '#2459ff';
          return <line key={index} x1="210" y1="145" x2={210 + Math.cos(angle) * 100} y2={145 + Math.sin(angle) * 100} stroke={color} strokeWidth="3" opacity="0.88" />;
        })}
        <text x="210" y="278" textAnchor="middle" fontSize="22" fontWeight="900">{factorA} groups x {factorB} spokes = {total}</text>
      </svg>
    </div>
  );
}
