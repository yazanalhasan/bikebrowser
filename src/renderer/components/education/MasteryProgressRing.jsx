export default function MasteryProgressRing({ mastery = 0, label = 'Mastery' }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, mastery)));
  return (
    <div className="mastery-ring">
      <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#dce5ef" strokeWidth="8" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#2459ff" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 36 36)" />
        <text x="36" y="41" textAnchor="middle" fontSize="16" fontWeight="900">{Math.round(mastery * 100)}%</text>
      </svg>
      <span>{label}</span>
    </div>
  );
}
