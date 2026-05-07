export default function RotationalClockIllustration({ factorA = 12, factorB = 5 }) {
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        <circle cx="210" cy="140" r="100" fill="#ffffff" stroke="#17212b" strokeWidth="7" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (Math.PI * 2 * index) / 12 - Math.PI / 2;
          return <text key={index} x={210 + Math.cos(angle) * 78} y={147 + Math.sin(angle) * 78} textAnchor="middle" fontSize="17" fontWeight="900">{index || 12}</text>;
        })}
        <line className="edu-spin" x1="210" y1="140" x2="210" y2="60" stroke="#2459ff" strokeWidth="6" strokeLinecap="round" />
        <text x="210" y="274" textAnchor="middle" fontSize="22" fontWeight="900">{factorA} x {factorB}: repeated rotation jumps</text>
      </svg>
    </div>
  );
}
