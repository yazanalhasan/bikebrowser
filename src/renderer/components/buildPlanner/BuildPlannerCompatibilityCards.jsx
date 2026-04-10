const STATUS_STYLES = {
  compatible: {
    container: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-600 text-white',
    label: 'Compatible',
  },
  caution: {
    container: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-500 text-white',
    label: 'Caution',
  },
  incompatible: {
    container: 'border-rose-200 bg-rose-50',
    badge: 'bg-rose-600 text-white',
    label: 'Incompatible',
  },
  'needs-info': {
    container: 'border-sky-200 bg-sky-50',
    badge: 'bg-sky-600 text-white',
    label: 'Missing Info',
  },
  uncertain: {
    container: 'border-yellow-200 bg-yellow-50',
    badge: 'bg-yellow-600 text-white',
    label: 'Uncertain',
  },
};

function confidenceTone(confidence) {
  if (confidence >= 0.8) {
    return 'bg-emerald-100 text-emerald-800';
  }

  if (confidence >= 0.6) {
    return 'bg-amber-100 text-amber-800';
  }

  return 'bg-rose-100 text-rose-800';
}

export default function BuildPlannerCompatibilityCards({ cards }) {
  const safeCards = Array.isArray(cards) ? cards : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Compatibility Review Cards</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {safeCards.map((card, index) => {
          const style = STATUS_STYLES[card.status] || STATUS_STYLES['needs-info'];
          return (
            <article key={card.id || `compatibility-${index + 1}`} className={`rounded-xl border p-4 ${style.container}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{card.title}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${style.badge}`}>{style.label}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{card.summary}</p>
              {typeof card.confidence === 'number' && (
                <p className="mt-2 text-sm">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${confidenceTone(card.confidence)}`}>
                    Confidence {(card.confidence * 100).toFixed(0)}%
                  </span>
                </p>
              )}
              {card.missingMeasurements?.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  {card.missingMeasurements.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
