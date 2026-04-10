import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import ResultGrid from '../components/ResultGrid';
import { useSearch } from '../hooks/useSearch';

function flattenResults(results, category) {
  if (!results) {
    return [];
  }

  if (category === 'all') {
    return results.results || [];
  }

  return results.grouped?.[category] || [];
}

export default function SafeSearchPage() {
  const { results, loading, error, search } = useSearch();
  const [activeCategory, setActiveCategory] = useState('all');
  const [lastQuery, setLastQuery] = useState('');
  const [localOnly, setLocalOnly] = useState(false);
  const [usOnly, setUsOnly] = useState(false);

  const visibleResults = useMemo(
    () => flattenResults(results, activeCategory),
    [results, activeCategory]
  );

  const counts = useMemo(() => ({
    all: results?.results?.length || 0,
    build: results?.grouped?.build?.length || 0,
    buy: results?.grouped?.buy?.length || 0,
    watch: results?.grouped?.watch?.length || 0
  }), [results]);

  useEffect(() => {
    if (!lastQuery) {
      return;
    }

    search(lastQuery, {
      localOnly,
      usOnly
    });
  }, [lastQuery, localOnly, search, usOnly]);

  const handleSearch = async (query) => {
    setLastQuery(query);
    setActiveCategory('all');
    await search(query, {
      localOnly,
      usOnly
    });
  };

  const handleResultClick = async (result) => {
    if (!result?.url) return;
    if (window.api?.openExternal) {
      await window.api.openExternal(result.url);
    } else {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div data-testid="safe-search-view" className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Safe Search</p>
            <h1 className="text-4xl font-black text-slate-900">Kid-safe bike and maker search</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Search curated projects, educational videos, and kid-safe maker content. Results are grouped into build, buy, and watch.
            </p>
          </div>
        </div>

        <SearchBar loading={loading} onSearch={handleSearch} />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${localOnly ? 'bg-sky-700 text-white shadow' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50'}`}
            onClick={() => setLocalOnly((value) => !value)}
          >
            {localOnly ? 'Local only on' : 'Local only off'}
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${usOnly ? 'bg-emerald-700 text-white shadow' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50'}`}
            onClick={() => setUsOnly((value) => !value)}
          >
            {usOnly ? 'US only on' : 'US only off'}
          </button>
          <p className="self-center text-sm text-slate-500">
            These filters apply most strongly to shopping results.
          </p>
        </div>

        <CategoryTabs activeCategory={activeCategory} counts={counts} onChange={setActiveCategory} />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
            Search failed: {error}
          </div>
        )}

        {results && (
          <div className="rounded-2xl bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{visibleResults.length}</span> results
              {results.query ? <> for <span className="font-semibold text-slate-900">{results.query}</span></> : null}
              {results.expandedQuery?.intent ? <> with <span className="font-semibold text-slate-900">{results.expandedQuery.intent}</span> intent</> : null}.
            </p>
          </div>
        )}

        <ResultGrid results={visibleResults} onResultClick={handleResultClick} />
      </div>
    </div>
  );
}