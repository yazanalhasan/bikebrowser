import { useEffect, useMemo, useRef, useState } from 'react';
import { presentPartSource } from '../../../builder/present.js';

function chipsFor(part) {
  const specs = part.specs || {};
  const chips = [];
  if (specs.speeds) chips.push(`${specs.speeds}-speed`);
  if (specs.freehub) chips.push(specs.freehub);
  if (specs.largestCog) chips.push(`${specs.smallestCog}–${specs.largestCog}T`);
  if (specs.maxCog) chips.push(`max cog ${specs.maxCog}T`);
  if (specs.capacity) chips.push(`capacity ${specs.capacity}T`);
  if (Array.isArray(specs.chainrings) && specs.chainrings.length) chips.push(specs.chainrings.join('/'));
  if (specs.fluid) chips.push(`${specs.fluid} fluid`);
  if (specs.brakeType) chips.push(specs.brakeType);
  if (specs.sizeMm) chips.push(`${specs.sizeMm} mm`);
  if (specs.rotorMount) chips.push(specs.rotorMount);
  if (specs.caliperMount) chips.push(specs.caliperMount);
  if (specs.hanger) chips.push(specs.hanger);
  if (specs.axle) chips.push(specs.axle);
  if (specs.diameterMm) chips.push(`${specs.diameterMm} mm axle`);
  if (specs.chainType && specs.chainType !== 'standard') chips.push(specs.chainType);
  if (specs.mount === 'full-mount') chips.push('Full Mount');
  return chips;
}

function matchesQuery(part, query) {
  const haystack = `${part.brand} ${part.model} ${part.modelCode || ''}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function PartButton({ part, badge, reason, grownup, onChoose }) {
  const source = presentPartSource(part, { grownup });
  return (
    <button
      type="button"
      onClick={() => onChoose(part.id)}
      className="w-full rounded-xl px-3 py-3 text-left hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
    >
      <span className="block text-base font-bold text-slate-950">
        {part.brand} {part.model}
      </span>
      <span className="mt-1 flex flex-wrap gap-2">
        {chipsFor(part).map((chip) => (
          <span key={chip} className="rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-900">
            {chip}
          </span>
        ))}
        {badge}
        {part.reviewStatus === 'draft' && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-950">
            Still being checked
          </span>
        )}
      </span>
      {reason && <span className="mt-2 block text-sm text-slate-800">{reason}</span>}
      {grownup && (source.sourceRef || source.sourceUrl) && (
        <span className="mt-2 block text-sm text-slate-700">
          {source.sourceRef}
          {source.sourceUrl && (
            <>
              {' '}
              <a href={source.sourceUrl} className="font-semibold text-sky-900 underline" target="_blank" rel="noreferrer noopener">
                Source
              </a>
            </>
          )}
        </span>
      )}
    </button>
  );
}

export default function PartPicker({
  slot,
  parts,
  fittingIds,
  cannotCheckIds = [],
  reasons,
  grownup,
  onChoose,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const [onlyFit, setOnlyFit] = useState(true);
  const searchRef = useRef(null);
  const fitSet = useMemo(() => new Set(fittingIds), [fittingIds]);
  const openSet = useMemo(() => new Set(cannotCheckIds), [cannotCheckIds]);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fitting = parts.filter((part) => fitSet.has(part.id) && matchesQuery(part, query));
  const cannotCheck = parts.filter((part) => openSet.has(part.id) && matchesQuery(part, query));
  const blocked = parts.filter((part) => !fitSet.has(part.id) && !openSet.has(part.id) && matchesQuery(part, query));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-picker-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 id="part-picker-title" className="text-xl font-bold text-slate-950">
              Choose a {slot.label.toLowerCase()}
            </h2>
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900">
              Close
            </button>
          </div>
          <label className="mt-3 block text-sm font-semibold text-slate-800" htmlFor="part-search">
            Search by name
          </label>
          <input
            id="part-search"
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-400 px-3 py-3 text-base text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Try Alivio, Eagle, 11-42…"
          />
          <label className="mt-3 flex min-h-11 items-center gap-3 text-base font-semibold text-slate-900">
            <input
              type="checkbox"
              checked={onlyFit}
              onChange={(event) => setOnlyFit(event.target.checked)}
              className="h-5 w-5"
            />
            Show only parts that fit
          </label>
          <p className="mt-1 text-sm text-slate-700">Parts we cannot check yet stay in their own list. They are not a fit.</p>
        </div>
        <div className="overflow-y-auto p-3">
          <h3 className="px-3 pt-2 text-sm font-bold uppercase tracking-wide text-slate-700">Parts that fit</h3>
          {fitting.length === 0 ? (
            <p className="px-3 py-3 text-slate-800">None of these fit with what is already chosen.</p>
          ) : (
            <ul>
              {fitting.map((part) => (
                <li key={part.id} className="border-b border-slate-100">
                  <PartButton part={part} grownup={grownup} onChoose={onChoose} />
                </li>
              ))}
            </ul>
          )}
          {(onlyFit || cannotCheck.length > 0) && (
            <>
              <h3 className="px-3 pt-4 text-sm font-bold uppercase tracking-wide text-slate-700">Can&apos;t check yet</h3>
              <p className="px-3 text-sm text-slate-700">A number is missing, so these do not count as a fit.</p>
              {cannotCheck.length === 0 ? (
                <p className="px-3 py-3 text-slate-800">Nothing in this search is waiting on a missing number.</p>
              ) : (
                <ul>
                  {cannotCheck.map((part) => (
                    <li key={part.id} className="border-b border-slate-100">
                      <PartButton
                        part={part}
                        grownup={grownup}
                        onChoose={onChoose}
                        reason={reasons[part.id]}
                        badge={<span className="rounded-full bg-slate-200 px-2 py-1 text-sm font-semibold text-slate-950">Can&apos;t check yet</span>}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {!onlyFit && (
            <>
              <h3 className="px-3 pt-4 text-sm font-bold uppercase tracking-wide text-slate-700">Does not fit</h3>
              {blocked.length === 0 ? (
                <p className="px-3 py-3 text-slate-800">Nothing in this search is ruled out.</p>
              ) : (
                <ul>
                  {blocked.map((part) => (
                    <li key={part.id} className="border-b border-slate-100">
                      <PartButton
                        part={part}
                        grownup={grownup}
                        onChoose={onChoose}
                        reason={reasons[part.id]}
                        badge={<span className="rounded-full bg-rose-100 px-2 py-1 text-sm font-semibold text-rose-950">Does not fit</span>}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
