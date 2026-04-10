import { useEffect, useMemo, useState } from 'react';
import { groupNotes, getBestOption } from '../../services/productNormalization';

const CATEGORIES = ['motor', 'battery', 'brakes', 'drivetrain', 'safety', 'general'];

const EMPTY_FORM = {
  url: '',
  title: '',
  category: 'general',
  partIds: [],
  price: '',
  comment: '',
};

function groupLabel(groupKey) {
  const value = String(groupKey || 'general').replace(/_/g, ' ');
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrice(value) {
  const price = Number(value);
  if (Number.isFinite(price) && price > 0) {
    return `$${price.toFixed(2)}`;
  }
  return 'Price not set';
}

export default function BuildPlannerNotesPanel({
  notes = [],
  parts = [],
  projectKey = 'default',
  onSaveNote = () => {},
  onDeleteNote = () => {},
  onMarkPreferred = () => {},
  onClearPreferred = () => {},
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const partOptions = useMemo(() => {
    return (Array.isArray(parts) ? parts : []).map((part, index) => ({
      id: part?.id || `${String(part?.category || 'part').toLowerCase()}-${index + 1}`,
      label: part?.name || `Part ${index + 1}`,
      category: String(part?.category || 'general').toLowerCase(),
    }));
  }, [parts]);

  const grouped = useMemo(() => {
    const groupedMap = groupNotes(notes || []);
    return Object.entries(groupedMap)
      .map(([groupKey, entries]) => {
        const best = getBestOption(entries);
        const rest = (entries || [])
          .filter((entry) => entry?.id !== best?.id)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        return {
          groupKey,
          label: groupLabel(groupKey),
          best,
          rest,
          count: (entries || []).length,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [notes]);

  useEffect(() => {
    setForm(EMPTY_FORM);
    setError('');
    setExpandedGroups({});
  }, [projectKey]);

  const handleSave = () => {
    const url = String(form.url || '').trim();
    if (!url.startsWith('http')) {
      setError('Please enter a valid URL that starts with http or https.');
      return;
    }

    setError('');
    const result = onSaveNote({
      url,
      title: form.title,
      category: form.category,
      partIds: form.partIds,
      price: form.price,
      comment: form.comment,
    });

    if (result?.duplicate) {
      setError('Duplicate listing detected for the same normalized product and URL.');
      return;
    }

    setForm(EMPTY_FORM);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Saved Links / Notes</h3>
      <p className="mt-1 text-sm text-slate-600">Store listing links and sourcing notes per project or specific part.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-semibold text-slate-700">URL</span>
          <input
            value={form.url}
            onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
            placeholder="https://www.ebay.com/..."
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Title / Label</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="BBS02 listing option"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Category</span>
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <fieldset className="text-sm md:col-span-2">
          <legend className="mb-1 block font-semibold text-slate-700">Attach To Items (optional)</legend>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
            {partOptions.length === 0 && <p className="text-xs text-slate-500">No items available yet.</p>}
            {partOptions.map((part) => {
              const checked = form.partIds.includes(part.id);
              return (
                <label key={part.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setForm((current) => {
                        const partIds = checked
                          ? current.partIds.filter((id) => id !== part.id)
                          : [...current.partIds, part.id];
                        return { ...current, partIds };
                      });
                    }}
                  />
                  <span>{part.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Price (optional)</span>
          <input
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            placeholder="620"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-semibold text-slate-700">Comment</span>
          <textarea
            rows={2}
            value={form.comment}
            onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
            placeholder="Why this listing might be a good fit"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
          />
        </label>
      </div>

      {error && (
        <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-sm text-rose-700">{error}</p>
      )}

      <button
        onClick={handleSave}
        className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Save Note
      </button>

      <div className="mt-4 space-y-2">
        {grouped.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No notes saved yet for this project.
          </p>
        ) : (
          grouped.map((entry) => (
            <article key={entry.groupKey} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{entry.label}</p>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                  {entry.count} option{entry.count === 1 ? '' : 's'}
                </span>
              </div>

              {entry.best && (
                <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2">
                  <p className="text-xs font-semibold text-emerald-800">Best option</p>
                  <a href={entry.best.url} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-semibold text-slate-900 hover:underline">
                    {entry.best.title || entry.best.url}
                  </a>
                  <p className="mt-1 text-xs text-slate-600">{formatPrice(entry.best.price)} • {entry.best.category || 'general'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.isArray(entry.best.relatedItemIds) && entry.best.relatedItemIds.length > 0 && (
                      <button
                        onClick={() => entry.best.relatedItemIds.forEach((id) => onMarkPreferred(id))}
                        className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Apply as Preferred
                      </button>
                    )}
                    {Array.isArray(entry.best.relatedItemIds) && entry.best.relatedItemIds.length > 0 && (
                      <button
                        onClick={() => entry.best.relatedItemIds.forEach((id) => onClearPreferred(id))}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Clear Preference
                      </button>
                    )}
                  </div>
                </div>
              )}

              {entry.rest.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedGroups((current) => ({ ...current, [entry.groupKey]: !current[entry.groupKey] }))}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {expandedGroups[entry.groupKey] ? 'Hide' : 'Show'} + {entry.rest.length} more option{entry.rest.length === 1 ? '' : 's'}
                  </button>

                  {expandedGroups[entry.groupKey] && (
                    <div className="mt-2 space-y-2">
                      {entry.rest.map((note) => (
                        <div key={note.id} className="rounded border border-slate-200 bg-white p-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <a href={note.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-900 hover:underline">
                              {note.title || note.url}
                            </a>
                            <span className="text-xs text-slate-500">{formatPrice(note.price)}</span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">{note.url}</p>
                          {note.comment && <p className="mt-1 text-sm text-slate-700">{note.comment}</p>}
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {Array.isArray(note.relatedItemIds) && note.relatedItemIds.length > 0
                                ? `Attached to ${note.relatedItemIds.length} item${note.relatedItemIds.length === 1 ? '' : 's'}`
                                : 'Project-level note'}
                            </span>
                            <button
                              onClick={() => onDeleteNote(note.id)}
                              className="rounded border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
