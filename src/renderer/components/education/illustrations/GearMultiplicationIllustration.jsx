function teeth(cx, cy, r, count, color) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    return <circle key={index} cx={cx + Math.cos(angle) * r} cy={cy + Math.sin(angle) * r} r="4" fill={color} />;
  });
}

export default function GearMultiplicationIllustration({ factorA = 3, factorB = 4 }) {
  return (
    <div className="edu-illustration" aria-label="Gear multiplication">
      <svg viewBox="0 0 420 300">
        <path className="edu-chain" d="M122 150 C170 70 250 70 302 150 C250 230 170 230 122 150Z" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
        <g className="edu-spin">
          <circle cx="122" cy="150" r="54" fill="#dbeafe" stroke="#2459ff" strokeWidth="8" />
          {teeth(122, 150, 64, 12, '#2459ff')}
        </g>
        <g className="edu-spin" style={{ animationDuration: '1.8s' }}>
          <circle cx="302" cy="150" r="38" fill="#dcfce7" stroke="#22c55e" strokeWidth="8" />
          {teeth(302, 150, 47, 8, '#22c55e')}
        </g>
        <text x="42" y="42" fontSize="21" fontWeight="900">{factorA} pedal rotations</text>
        <text x="208" y="270" textAnchor="middle" fontSize="23" fontWeight="900">{factorA} x {factorB} = {factorA * factorB} wheel units</text>
      </svg>
    </div>
  );
}
