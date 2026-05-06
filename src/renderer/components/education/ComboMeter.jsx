export default function ComboMeter({ streak = 0 }) {
  const width = Math.min(100, streak * 10);
  return (
    <div className="combo-meter">
      <span>Combo</span>
      <div className="meter-track"><div style={{ width: `${width}%` }} /></div>
      <strong>{streak}x streak</strong>
    </div>
  );
}
