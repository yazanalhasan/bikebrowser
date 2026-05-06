export default function FingerMathIllustration({ factorB = 4 }) {
  const left = Math.max(0, factorB - 1);
  const right = Math.max(0, 10 - factorB);
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        {Array.from({ length: 10 }, (_, index) => {
          const folded = index === factorB - 1;
          return <rect key={index} x={42 + index * 34} y={folded ? 120 : 70} width="24" height={folded ? 80 : 128} rx="12" fill={folded ? '#ef4444' : '#2459ff'} opacity="0.82" />;
        })}
        <text x="106" y="240" textAnchor="middle" fontSize="24" fontWeight="900">{left}</text>
        <text x="292" y="240" textAnchor="middle" fontSize="24" fontWeight="900">{right}</text>
        <text x="210" y="276" textAnchor="middle" fontSize="22" fontWeight="900">9 x {factorB} = {left}{right}</text>
      </svg>
    </div>
  );
}
