import { useMemo, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { groupNotes, getBestOption } from '../services/productNormalization';

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

export default function AllProjectNotesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Subscribe to the projects array directly — stable reference in Zustand v5
  const projects = useProjectStore((state) => state.projects);

  const projectNotesSummary = useMemo(() => {
    return projects.flatMap((project) =>
      (project.notes || []).map((note) => ({
        projectId: project.id,
        projectName: project.name,
        ...note,
      }))
    );
  }, [projects]);

  const allProjects = useMemo(() => {
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
    }));
  }, [projects]);

  const allNotes = useMemo(() => {
    return projectNotesSummary.map((note) => {
      const url = note.url || note.links?.[0] || '';
      const title = note.title || note.content || url || 'Custom Link';
      const category = note.category || 'general';
      const normalizedName = note.normalizedName || '';
      const groupKey = note.groupKey || `${String(category).toLowerCase()}_${String(title).toLowerCase().split(/\s+/)[0] || 'general'}`;

      return {
        ...note,
        url,
        title,
        category,
        normalizedName,
        groupKey,
        comment: note.comment || note.content || '',
        partId: Array.isArray(note.relatedItemIds) && note.relatedItemIds.length > 0 ? note.relatedItemIds[0] : null,
        createdAt: Number(note.createdAt || Date.now()),
      };
    });
  }, [projectNotesSummary]);

  const categories = useMemo(() => {
    return Array.from(new Set(allNotes.map((note) => String(note.category || 'general').toLowerCase()))).sort();
  }, [allNotes]);

  const filteredNotes = useMemo(() => {
    const query = String(search || '').trim().toLowerCase();

    return [...allNotes]
      .filter((note) => {
        if (categoryFilter !== 'all' && String(note.category || 'general').toLowerCase() !== categoryFilter) {
          return false;
        }

        if (projectFilter !== 'all' && note.projectId !== projectFilter) {
          return false;
        }

        if (!query) {
          return true;
        }

        const haystack = [
          note.title,
          note.comment,
          note.url,
          note.category,
          note.projectName,
          note.normalizedName,
          note.groupKey,
        ]
          .map((value) => String(value || '').toLowerCase())
          .join(' ');

        return haystack.includes(query);
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [allNotes, search, categoryFilter, projectFilter]);

  const groupedNotes = useMemo(() => {
    const groupedMap = groupNotes(filteredNotes);
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
  }, [filteredNotes]);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-6 py-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Saved Parts / Notes</h1>
          <p className="mt-2 text-sm text-slate-600">View and compare all saved sourcing notes across projects.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, link, comment"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All projects</option>
              {allProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </section>

        {projectNotesSummary.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Project Notes Summary</h2>
            <p className="mt-1 text-sm text-slate-600">Derived from project-centric state store.</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {projectNotesSummary.slice(0, 8).map((note) => (
                <li key={note.id} className="rounded-md bg-slate-50 px-2 py-1">
                  <span className="font-semibold">{note.projectName}:</span> {note.content}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          {groupedNotes.length === 0 ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No notes match your filters.
            </p>
          ) : (
            groupedNotes.map((group) => (
              <article key={group.groupKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800">
                    {group.count} option{group.count === 1 ? '' : 's'}
                  </span>
                </div>

                {group.best && (
                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-800">Best option</p>
                    <a
                      href={group.best.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-sm font-semibold text-slate-800 hover:underline"
                    >
                      {group.best.title || group.best.url}
                    </a>
                    <p className="mt-1 text-xs text-slate-600">
                      {group.best.projectName} • {formatPrice(group.best.price)} • {group.best.category || 'general'}
                    </p>
                    {group.best.comment && <p className="mt-1 text-sm text-slate-700">{group.best.comment}</p>}
                  </div>
                )}

                {group.rest.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setExpandedGroups((current) => ({ ...current, [group.groupKey]: !current[group.groupKey] }))}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {expandedGroups[group.groupKey] ? 'Hide' : 'Show'} + {group.rest.length} more option{group.rest.length === 1 ? '' : 's'}
                    </button>

                    {expandedGroups[group.groupKey] && (
                      <div className="mt-2 space-y-2">
                        {group.rest.map((note) => (
                          <div key={`${note.projectId}-${note.id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-600">{note.projectName}</p>
                            <a
                              href={note.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block text-sm font-semibold text-slate-800 hover:underline"
                            >
                              {note.title || note.url}
                            </a>
                            <p className="mt-1 text-xs text-slate-500">{formatPrice(note.price)} • {note.category || 'general'}</p>
                            {note.comment && <p className="mt-1 text-sm text-slate-700">{note.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
