import { buildGearRatioCurve } from '../simulation/gearRatioEngine';

function scale(value, min, max, low, high) {
  if (max === min) return (low + high) / 2;
  return low + ((value - min) / (max - min)) * (high - low);
}

export default function GearRatioVisualizer({
  chainringTeeth = 32,
  cassetteCogs = [11, 13, 15, 18, 21, 24, 28, 34, 46],
  wheelSizeIn = 29,
  cadenceRpm = 90,
}) {
  const curve = buildGearRatioCurve({ chainringTeeth, cassetteCogs, wheelSizeIn, cadenceRpm });
  const speeds = curve.points.map((point) => point.speedMph);
  const torques = curve.points.map((point) => point.torqueMultiplier);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const minTorque = Math.min(...torques);
  const maxTorque = Math.max(...torques);

  const speedPath = curve.points.map((point, index) => {
    const x = scale(index, 0, curve.points.length - 1, 38, 560);
    const y = scale(point.speedMph, minSpeed, maxSpeed, 138, 28);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const torquePath = curve.points.map((point, index) => {
    const x = scale(index, 0, curve.points.length - 1, 38, 560);
    const y = scale(point.torqueMultiplier, minTorque, maxTorque, 138, 28);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Gear Ratio Visualizer</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-900">
          {chainringTeeth}T x {cassetteCogs[0]}-{cassetteCogs[cassetteCogs.length - 1]}T at {cadenceRpm} rpm
        </span>
      </div>

      <svg viewBox="0 0 600 170" className="mt-4 h-52 w-full rounded-lg bg-white" role="img" aria-label="Cadence speed torque graph">
        <line x1="34" y1="142" x2="570" y2="142" stroke="#cbd5e1" />
        <line x1="34" y1="20" x2="34" y2="142" stroke="#cbd5e1" />
        <path d={speedPath} fill="none" stroke="#2563eb" strokeWidth="4" />
        <path d={torquePath} fill="none" stroke="#059669" strokeWidth="4" strokeDasharray="8 6" />
        {curve.points.map((point, index) => {
          const x = scale(index, 0, curve.points.length - 1, 38, 560);
          const speedY = scale(point.speedMph, minSpeed, maxSpeed, 138, 28);
          return (
            <g key={point.cogTeeth}>
              <circle cx={x} cy={speedY} r="4" fill="#2563eb" />
              <text x={x} y="158" textAnchor="middle" className="fill-slate-600 text-[9px]">{point.cogTeeth}T</text>
            </g>
          );
        })}
        <text x="440" y="28" className="fill-blue-700 text-[11px] font-bold">speed</text>
        <text x="440" y="44" className="fill-emerald-700 text-[11px] font-bold">torque</text>
      </svg>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <p className="rounded-lg bg-white px-3 py-2 text-xs"><span className="font-bold">Climbing ratio:</span> {curve.summary.climbingRatio}</p>
        <p className="rounded-lg bg-white px-3 py-2 text-xs"><span className="font-bold">Top speed:</span> {curve.summary.topSpeedMph} mph</p>
        <p className="rounded-lg bg-white px-3 py-2 text-xs"><span className="font-bold">Torque multiplier:</span> {curve.summary.torqueMultiplication}x</p>
      </div>
    </section>
  );
}
