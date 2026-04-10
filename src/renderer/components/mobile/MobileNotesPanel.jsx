import { useMemo, useState } from 'react';

function isTabletLayout() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth >= 900;
}

export default function MobileNotesPanel({ notes = [], onAddNote }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const tablet = useMemo(() => isTabletLayout(), []);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    await onAddNote(text);
    setDraft('');
    setOpen(tablet);
  };

  const panelClass = tablet
    ? 'fixed right-4 top-28 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl'
    : `fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl transition-transform ${open ? 'translate-y-0' : 'translate-y-[72%]'}`;

  return (
    <div className={panelClass}>
      {!tablet && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mb-3 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
        >
          {open ? 'Hide Notes' : 'Show Notes'}
        </button>
      )}

      <h3 className="text-lg font-black text-slate-900">Notes</h3>
      <div className="mt-3 space-y-2 max-h-56 overflow-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-xl bg-slate-100 p-2 text-sm text-slate-800">
              {note.content || note.itemName || note.title}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add note and preference"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}
