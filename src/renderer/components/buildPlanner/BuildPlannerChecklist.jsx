function ChecklistItem({ item = {}, onAddRecommended = () => {} }) {
  const title = item.title || item.name || 'Untitled item';
  const category = item.category || 'General';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{item.reason || 'No details yet.'}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{category}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {item.required && <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">Required</span>}
        {item.measurementNeeded && (
          <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">Needs measurements</span>
        )}
        <span className="rounded-full bg-sky-100 px-2 py-1 font-semibold text-sky-700">
          Est. ${Number(item.estimatedCost || 0).toFixed(0)}
        </span>
      </div>

      {item.recommendedItem && (
        <button
          onClick={() => onAddRecommended(item)}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Add Recommended Item to Cart
        </button>
      )}
    </div>
  );
}

export default function BuildPlannerChecklist({ checklist, onAddRecommended, onAddAllRecommended }) {
  const safeChecklist = Array.isArray(checklist) ? checklist : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">AI-Generated Structured Checklist</h3>
        <button
          onClick={onAddAllRecommended || (() => {})}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Add All Recommended to Cart
        </button>
      </div>

      <div className="grid gap-3">
        {safeChecklist.map((item, index) => (
          <ChecklistItem key={item?.id || `checklist-${index + 1}`} item={item} onAddRecommended={onAddRecommended} />
        ))}
      </div>
    </section>
  );
}
