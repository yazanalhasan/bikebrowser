export default function EngineeringHUD({ compatibility, propagation, simulation }) {
  const issueCount = propagation?.issues?.length || 0;
  const incompatibleCount = propagation?.issues?.filter((issue) => issue.status === 'incompatible').length || 0;
  const performanceDelta = simulation?.deltas?.speedMph || 0;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-white">
      <h3 className="text-sm font-bold">Engineering HUD</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-5">
        <Metric label="Mechanical Status" value={incompatibleCount > 0 ? 'At Risk' : 'Stable'} tone={incompatibleCount > 0 ? 'warn' : 'good'} />
        <Metric label="Compatibility Confidence" value={`${Math.round((compatibility?.confidence || 0) * 100)}%`} />
        <Metric label="Constraint Load" value={`${issueCount} checks`} />
        <Metric label="Failure Risk" value={incompatibleCount > 0 ? 'High' : 'Low'} tone={incompatibleCount > 0 ? 'warn' : 'good'} />
        <Metric label="Performance Delta" value={`${performanceDelta > 0 ? '+' : ''}${performanceDelta} mph`} />
      </div>
    </section>
  );
}

function Metric({ label, value, tone = 'neutral' }) {
  const color = tone === 'good' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-cyan-200';
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}
