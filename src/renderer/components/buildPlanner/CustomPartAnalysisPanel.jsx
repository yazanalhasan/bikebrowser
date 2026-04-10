import { useState } from 'react';

const STATUS_STYLES = {
  compatible: 'bg-emerald-100 text-emerald-800',
  probable: 'bg-sky-100 text-sky-800',
  verify: 'bg-amber-100 text-amber-800',
  incompatible: 'bg-rose-100 text-rose-800',
};

function AnalysisCard({ result, onAddToCart, onReplaceRecommended }) {
  const [expanded, setExpanded] = useState(false);
  const badge = STATUS_STYLES[result.status] || STATUS_STYLES.verify;

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{result.itemName}</p>
          <p className="text-sm text-slate-600">{result.category} • {result.subsystem}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${badge}`}>{result.status}</span>
      </div>

      <p className="mt-2 text-sm text-slate-700">{result.summary}</p>
      <p className="mt-2 text-xs font-semibold text-slate-600">Confidence {(Number(result.confidence || 0) * 100).toFixed(0)}%</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onAddToCart(result)}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Add to Cart
        </button>
        <button
          onClick={() => onReplaceRecommended(result)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Replace Recommended Part
        </button>
        <button
          onClick={() => setExpanded((open) => !open)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {result.reasons?.length > 0 && (
            <div>
              <p className="font-semibold">Reasons</p>
              <ul className="list-disc pl-5">
                {result.reasons.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            </div>
          )}
          {result.requiredChecks?.length > 0 && (
            <div>
              <p className="font-semibold">Required checks</p>
              <ul className="list-disc pl-5">
                {result.requiredChecks.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            </div>
          )}
          {result.warnings?.length > 0 && (
            <div>
              <p className="font-semibold">Warnings</p>
              <ul className="list-disc pl-5">
                {result.warnings.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            </div>
          )}
          {result.fitmentNotes?.length > 0 && (
            <div>
              <p className="font-semibold">Fitment notes</p>
              <ul className="list-disc pl-5">
                {result.fitmentNotes.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            </div>
          )}
          {result.recommendedAlternatives?.length > 0 && (
            <div>
              <p className="font-semibold">Alternatives</p>
              <ul className="list-disc pl-5">
                {result.recommendedAlternatives.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function CustomPartAnalysisPanel({
  onAnalyze = () => {},
  analyzing = false,
  analysisError = '',
  results = [],
  onAddToCart = () => {},
  onReplaceRecommended = () => {},
}) {
  const [itemName, setItemName] = useState('');
  const [url, setUrl] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmed = itemName.trim();
    if (!trimmed) {
      return;
    }
    onAnalyze({ itemName: trimmed, url: url.trim() });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Add Part or Donor Bike</h3>
      <p className="mt-1 text-sm text-slate-600">
        Examples: Bafang BBS02 mid-drive 48V, 48V 13Ah Hailong battery, Ozark Trail 29 small frame MTB.
      </p>

      <form className="mt-3 space-y-3" onSubmit={submit}>
        <input
          value={itemName}
          onChange={(event) => setItemName(event.target.value)}
          placeholder="Part or donor bike"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
        />
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Optional URL"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
        />
        <button
          type="submit"
          disabled={analyzing}
          className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-300"
        >
          {analyzing ? 'Analyzing...' : 'Analyze Compatibility'}
        </button>
      </form>

      {analysisError && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{analysisError}</p>
      )}

      <div className="mt-4 space-y-3">
        {results.map((result) => (
          <AnalysisCard
            key={result.id}
            result={result}
            onAddToCart={onAddToCart}
            onReplaceRecommended={onReplaceRecommended}
          />
        ))}
      </div>
    </section>
  );
}
