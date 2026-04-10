const STATUS_STYLES = {
  ready: {
    container: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-600 text-white',
    label: 'Ready',
  },
  caution: {
    container: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-600 text-white',
    label: 'Caution',
  },
  blocked: {
    container: 'border-rose-200 bg-rose-50',
    badge: 'bg-rose-600 text-white',
    label: 'Blocked',
  },
};

export default function CartValidationStatus({ status = 'caution', summary = '', counts = {} }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.caution;

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${style.container}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">Cart Validation</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>{style.label}</span>
      </div>

      <p className="mt-2 text-sm text-slate-700">{summary || 'Validation status unavailable.'}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-white/80 px-2 py-1 text-slate-700">Incompatible: {counts.incompatible || 0}</span>
        <span className="rounded-full bg-white/80 px-2 py-1 text-slate-700">Caution: {counts.caution || 0}</span>
        <span className="rounded-full bg-white/80 px-2 py-1 text-slate-700">Low confidence: {counts.lowConfidence || 0}</span>
      </div>
    </section>
  );
}
