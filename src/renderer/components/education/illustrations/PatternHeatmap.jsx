export default function PatternHeatmap() {
  const values = [9, 18, 27, 36, 45, 54, 63, 72, 81, 90];
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        {values.map((value, index) => (
          <g key={value} className={index % 2 === 0 ? 'edu-pulse' : ''}>
            <rect x={34 + (index % 5) * 76} y={58 + Math.floor(index / 5) * 82} width="58" height="58" rx="8" fill="#17212b" opacity="0.88" />
            <text x={63 + (index % 5) * 76} y={96 + Math.floor(index / 5) * 82} textAnchor="middle" fontSize="24" fontWeight="900" fill="#ffffff">{String(value).padStart(2, '0')}</text>
          </g>
        ))}
        <text x="210" y="254" textAnchor="middle" fontSize="22" fontWeight="900">Tens climb, ones fall, digits sum to 9</text>
      </svg>
    </div>
  );
}
