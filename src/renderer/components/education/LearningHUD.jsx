import StreakTracker from './StreakTracker.jsx';

function money(value) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function LearningHUD({ profile }) {
  const multiplication = profile.subjects?.multiplication || {};
  const spelling = profile.subjects?.spelling || {};
  return (
    <div className="learning-hud">
      <div className="learning-hud-card">
        <span>Total earned</span>
        <strong>{money(profile.earnings?.totalDollars)}</strong>
      </div>
      <div className="learning-hud-card">
        <span>Spelling earned</span>
        <strong>{money(profile.earnings?.spellingDollars)}</strong>
      </div>
      <div className="learning-hud-card">
        <span>Math earned</span>
        <strong>{money(profile.earnings?.multiplicationDollars)}</strong>
      </div>
      <div className="learning-hud-card">
        <span>XP</span>
        <strong>{profile.xp}</strong>
      </div>
      <StreakTracker streak={multiplication.streak || spelling.streak || 0} best={Math.max(multiplication.bestStreak || 0, spelling.bestStreak || 0)} />
    </div>
  );
}
