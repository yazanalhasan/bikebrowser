export default function SharedRewardPopup({ reward, dollars = 0 }) {
  if (!reward) return null;
  return (
    <div className="reward-popup" role="status" aria-live="polite">
      <span>Reward earned</span>
      <strong>+{reward.xp} XP · +${dollars.toFixed(2)}</strong>
      <div className="reward-labels">
        {reward.labels.map((label) => <i key={label}>{label}</i>)}
      </div>
    </div>
  );
}
