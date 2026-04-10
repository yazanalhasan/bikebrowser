const STATUS_STYLE = {
  pending: 'bg-slate-200 text-slate-800',
  linked: 'bg-sky-100 text-sky-800',
  added: 'bg-emerald-100 text-emerald-800',
  conflict: 'bg-rose-100 text-rose-800',
};

export default function BuildPlannerVisualizer({ placements = [] }) {
  if (!Array.isArray(placements) || placements.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Build Visualizer</h3>
        <p className="mt-2 text-sm text-slate-600">Run analysis to generate placement data.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Build Visualizer</h3>
      <p className="mt-1 text-sm text-slate-600">Live placement map from checklist + linked items + cart.</p>

      <div className="relative mt-4 h-80 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50">
        {placements.map((placement, index) => {
          const x = Number.isFinite(Number(placement.x)) ? Number(placement.x) : (index % 4) * 20 + 15;
          const y = Number.isFinite(Number(placement.y)) ? Number(placement.y) : Math.floor(index / 4) * 18 + 18;
          const statusClass = STATUS_STYLE[placement.status] || STATUS_STYLE.pending;

          return (
            <div
              key={placement.id || `placement-${index + 1}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`rounded-full border border-white px-3 py-1 text-xs font-semibold shadow ${statusClass}`}>
                {placement.label}
              </div>
              <p className="mt-1 text-center text-[10px] uppercase tracking-[0.12em] text-slate-500">
                {placement.source}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
