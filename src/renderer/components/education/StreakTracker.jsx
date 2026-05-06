export default function StreakTracker({ streak = 0, best = 0 }) {
  return (
    <div className="learning-hud-card">
      <span>Streak</span>
      <strong>{streak} correct</strong>
      <p>Best: {best}</p>
    </div>
  );
}
