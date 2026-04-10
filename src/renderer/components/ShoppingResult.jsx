import React from 'react';

function formatPrice(price) {
  if (!price?.amount) {
    return 'Price not listed';
  }

  const currency = price.currency && price.currency.length === 3 ? price.currency : 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(price.amount);
}

export default function ShoppingResult({ result, onClick }) {
  const warnings = result.sourceMetadata?.shoppingWarnings || [];
  const metadata = result.sourceMetadata || {};

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative bg-gradient-to-br from-amber-100 via-orange-50 to-white p-4">
        <img
          src={result.thumbnail || 'https://via.placeholder.com/640x360?text=Shopping+Result'}
          alt={result.title}
          className="h-44 w-full rounded-2xl object-cover"
          onError={(event) => {
            event.currentTarget.src = 'https://via.placeholder.com/640x360?text=Shopping+Result';
          }}
        />
        <div className="absolute left-7 top-7 flex gap-2">
          <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white">
            {result.sourceName}
          </span>
          {metadata.sellerVerified && (
            <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">
              Verified seller
            </span>
          )}
        </div>
        {result.requires_supervision && (
          <span className="absolute bottom-7 right-7 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
            Parent review
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{result.title}</h3>
            {result.summary && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{result.summary}</p>
            )}
          </div>
          <div className="shrink-0 rounded-2xl bg-emerald-50 px-3 py-2 text-right">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Price</div>
            <div className="text-lg font-black text-emerald-700">{formatPrice(result.price)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          {metadata.localPickup && (
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">Local pickup</span>
          )}
          {metadata.educational && (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">Educational</span>
          )}
          {metadata.diyComponent && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">DIY component</span>
          )}
          {metadata.isInternational && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">International</span>
          )}
          {metadata.shippingEstimate && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">Ships in {metadata.shippingEstimate}</span>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {warnings[0]}
          </div>
        )}

        {metadata.relatedParts?.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Related parts</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {metadata.relatedParts.slice(0, 3).map((part) => (
                <span key={part} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}