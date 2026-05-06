export default function SpeedGauge({ timing }) {
  const tier = timing?.speedTier || 'steady';
  const width = tier === 'lightning' ? 100 : tier === 'fast' ? 76 : tier === 'steady' ? 48 : 24;
  return (
    <div className="speed-gauge">
      <span>Speed</span>
      <div className="speed-track"><div className={tier} style={{ width: `${width}%` }} /></div>
      <strong>{timing ? `${(timing.reactionTimeMs / 1000).toFixed(1)}s · ${tier}` : 'Ready'}</strong>
    </div>
  );
}
