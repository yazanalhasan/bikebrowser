import { useMemo, useState } from 'react';

function priorityStyle(priority) {
  return priority === 'optional'
    ? 'bg-slate-100 text-slate-700'
    : 'bg-emerald-100 text-emerald-800';
}

function sourceBadgeStyle(source) {
  const normalized = String(source || '').toLowerCase();
  if (normalized.includes('curated')) return 'bg-rose-100 text-rose-800';
  if (normalized.includes('ebay')) return 'bg-yellow-100 text-yellow-800';
  if (normalized.includes('offerup') || normalized.includes('local')) return 'bg-emerald-100 text-emerald-800';
  if (normalized.includes('facebook')) return 'bg-blue-100 text-blue-800';
  if (normalized.includes('craigslist')) return 'bg-green-100 text-green-800';
  if (normalized.includes('market')) return 'bg-sky-100 text-sky-800';
  return 'bg-slate-100 text-slate-700';
}

function rankingLabel(score) {
  const safeScore = Number(score || 0);
  if (safeScore > 60) {
    return {
      text: 'Best Match',
      className: 'bg-emerald-100 text-emerald-800',
    };
  }

  if (safeScore >= 40) {
    return {
      text: 'Good Option',
      className: 'bg-sky-100 text-sky-800',
    };
  }

  return {
    text: 'Low Confidence',
    className: 'bg-amber-100 text-amber-800',
  };
}

function noResultsMessage(part) {
  if (part?.noResultsReason) {
    return part.noResultsReason;
  }

  return 'No relevant listings found. Try refining this part name or category.';
}

function deriveVideoReferences(product) {
  const explicitRefs = Array.isArray(product?.videoReferences)
    ? product.videoReferences
        .filter((ref) => ref && typeof ref === 'object' && ref.url)
        .slice(0, 2)
    : [];

  if (explicitRefs.length > 0) {
    return explicitRefs;
  }

  const signalRefs = Array.isArray(product?.signals?.youtube)
    ? product.signals.youtube
        .filter((ref) => ref && typeof ref === 'object' && ref.url)
        .slice(0, 2)
        .map((ref) => ({
          videoId: ref.id || '',
          title: ref.title || 'Build video',
          channelName: ref.channel || '',
          url: ref.url,
          matchConfidence: null,
          matchReason: 'Video discovered from build signal search',
        }))
    : [];

  return signalRefs;
}

export default function RecommendedPartsPanel({
  parts = [],
  onAddToCart = () => {},
  onAddToProject = () => {},
  decisionStateMap = {},
  onMarkPreferred = () => {},
  onClearPreferred = () => {},
  onToggleDeprioritized = () => {},
}) {
  const safeParts = Array.isArray(parts) ? parts : [];
  const [channelFilter, setChannelFilter] = useState('all');
  const [rankingFilter, setRankingFilter] = useState('lowest-total');

  const filteredParts = useMemo(() => {
    return safeParts.map((part) => {
      const decisionId = String(part?.decisionId || part?.id || `${part?.category || 'part'}-${part?.name || ''}`);
      const products = Array.isArray(part.products) ? [...part.products] : [];

      const scoped = products.filter((product) => {
        if (channelFilter === 'online-only') {
          return product.type !== 'local';
        }
        if (channelFilter === 'local-only') {
          return product.type === 'local';
        }
        return true;
      });

      scoped.sort((a, b) => {
        if (rankingFilter === 'closest-distance') {
          const ad = Number.isFinite(Number(a.distance)) ? Number(a.distance) : Number.MAX_SAFE_INTEGER;
          const bd = Number.isFinite(Number(b.distance)) ? Number(b.distance) : Number.MAX_SAFE_INTEGER;
          if (ad !== bd) return ad - bd;
        }

        const at = Number(a.totalCost ?? a.price ?? 0);
        const bt = Number(b.totalCost ?? b.price ?? 0);
        return at - bt;
      });

      return {
        ...part,
        decisionId,
        products: scoped,
      };
    });
  }, [safeParts, channelFilter, rankingFilter]);

  const { preferred, primary, alternatives } = useMemo(() => {
    const preferredParts = [];
    const primaryParts = [];
    const alternativesParts = [];

    filteredParts.forEach((part) => {
      const state = decisionStateMap?.[part.decisionId] || {};
      if (state.isPreferred) {
        preferredParts.push(part);
        return;
      }

      if (state.isDeprioritized) {
        alternativesParts.push(part);
        return;
      }

      primaryParts.push(part);
    });

    return {
      preferred: preferredParts,
      primary: primaryParts,
      alternatives: alternativesParts,
    };
  }, [filteredParts, decisionStateMap]);

  const renderPartCard = (part) => {
    const state = decisionStateMap?.[part.decisionId] || {};
    const isPreferred = Boolean(state.isPreferred);
    const isDeprioritized = Boolean(state.isDeprioritized) && !isPreferred;

    return (
      <article
        key={part.decisionId}
        className={`rounded-xl border bg-slate-50 p-4 transition ${
          isPreferred
            ? 'border-emerald-300 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]'
            : 'border-slate-200'
        } ${isDeprioritized ? 'opacity-50 grayscale' : ''}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-900">{part.name}</p>
          <div className="flex items-center gap-2">
            {isPreferred && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Preferred</span>}
            {isDeprioritized && <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">Deprioritized</span>}
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityStyle(part.priority)}`}>
              {part.priority === 'optional' ? 'Optional' : 'Required'}
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-700">{part.description}</p>
        <p className="mt-1 text-sm text-slate-700">{part.reason}</p>

        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-800">{part.category || 'General'}</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">{part.estimatedPrice || 'Price TBD'}</span>
          {part.source === 'curated' && (
            <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-800">Proven Setup</span>
          )}
          {typeof part.fitmentConfidence === 'number' && (
            <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-800">
              Fit {(part.fitmentConfidence * 100).toFixed(0)}%
            </span>
          )}
          {part.mustVerify && <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-800">Must verify fitment</span>}
        </div>

        {Array.isArray(part.exampleSearchQueries) && part.exampleSearchQueries.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            {part.exampleSearchQueries.slice(0, 2).map((query) => (
              <li key={query}>{query}</li>
            ))}
          </ul>
        )}
        {part.source === 'curated' && part.fallbackLink && (
          <a
            href={part.fallbackLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            View curated fallback listings
          </a>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => onAddToCart(part)}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add to Cart
          </button>
          <button
            onClick={() => onAddToProject(part)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Add to Project
          </button>
          {!isPreferred && (
            <button
              onClick={() => onMarkPreferred(part.decisionId)}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Mark Preferred
            </button>
          )}
          {isPreferred && (
            <button
              onClick={() => onClearPreferred(part.decisionId)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Clear Preferred
            </button>
          )}
          <button
            onClick={() => onToggleDeprioritized(part.decisionId, !isDeprioritized)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            {isDeprioritized ? 'Restore Visibility' : 'Deprioritize'}
          </button>
        </div>

        {Array.isArray(part.products) && part.products.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {part.products.map((product, productIndex) => {
              const rank = rankingLabel(product.score);
              const displayVideoReferences = deriveVideoReferences(product);
              return (
                <div
                  key={`${product.title}-${productIndex + 1}`}
                  className="flex gap-3 rounded-lg border border-slate-200 bg-white p-2"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-16 w-16 rounded-md border border-slate-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${rank.className}`}>
                        {rank.text}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        Score {Math.round(Number(product.score || 0))}
                      </span>
                      {displayVideoReferences.length > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Video references ({displayVideoReferences.length})
                        </span>
                      )}
                      {Array.isArray(product.signals?.youtube) && product.signals.youtube.length > 0 && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                          Seen in build videos
                        </span>
                      )}
                      {Array.isArray(product.signals?.reddit) && product.signals.reddit.length > 0 && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">
                          Discussed by builders
                        </span>
                      )}
                    </div>

                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">{product.title}</p>
                    <div className="mt-1 text-sm text-slate-700">
                      <p>${Number(product.price || 0).toFixed(2)} + ${Number(product.shippingCost || 0).toFixed(2)} shipping</p>
                      <p className="font-semibold">Total: ${Number((product.totalCost ?? product.price) || 0).toFixed(2)}</p>
                      {Number.isFinite(Number(product.distance)) && (
                        <p className="text-xs text-slate-600">{Number(product.distance).toFixed(1)} miles away</p>
                      )}
                    </div>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sourceBadgeStyle(product.source)}`}>
                      {product.source}
                    </span>
                    {product.type === 'local' && (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">Pickup today</p>
                    )}
                    {Array.isArray(product.explanation) && product.explanation.length > 0 && (
                      <ul className="mt-1 list-disc pl-4 text-[11px] text-slate-600">
                        {product.explanation.slice(0, 2).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    )}
                    {displayVideoReferences.length > 0 && (
                      <div className="mt-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-900">
                        {displayVideoReferences.map((reference, refIndex) => (
                          <p key={`${reference.videoId || reference.url}-${refIndex + 1}`} className="truncate">
                            <a href={reference.url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                              {reference.title}
                            </a>
                            {Number.isFinite(Number(reference.matchConfidence))
                              ? ` (${Math.round(Number(reference.matchConfidence || 0) * 100)}% match)`
                              : ' (build signal)'}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => onAddToCart(part, product)}
                        className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Add to Cart
                      </button>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {noResultsMessage(part)}
          </p>
        )}
      </article>
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Recommended Parts</h3>
      <p className="mt-1 text-sm text-slate-600">Specific, purchasable recommendations generated from your project profile.</p>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Availability Filter</span>
          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
          >
            <option value="all">All</option>
            <option value="online-only">Online only</option>
            <option value="local-only">Local only</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Ranking</span>
          <select
            value={rankingFilter}
            onChange={(event) => setRankingFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
          >
            <option value="lowest-total">Lowest total cost</option>
            <option value="closest-distance">Closest distance</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        {preferred.map(renderPartCard)}
        {primary.map(renderPartCard)}
        {alternatives.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-3">
            <h4 className="text-sm font-semibold text-slate-800">Alternatives</h4>
            <p className="mt-1 text-xs text-slate-600">These items were deprioritized because a preferred interchangeable option is selected.</p>
            <div className="mt-2 grid gap-3">
              {alternatives.map(renderPartCard)}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
