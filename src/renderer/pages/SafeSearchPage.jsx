import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import ResultGrid from '../components/ResultGrid';
import { useSearch } from '../hooks/useSearch';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { useCameraCapture } from '../hooks/useCameraCapture';

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
  const [mediaError, setMediaError] = useState(null);

  // ── Voice capture ─────────────────────────────────────────────────────────
  const voice = useVoiceCapture();
  const voiceProcessingRef = useRef(false);

  // When the hook produces a transcript, feed it into the search pipeline
  useEffect(() => {
    if (!voice.transcript || voiceProcessingRef.current) return;
    voiceProcessingRef.current = true;
    setMediaError(null);

    (async () => {
      try {
        // Use voice IPC if available (main-process AI parsing), fall back to text search
        if (window.api?.voice?.searchFromTranscript) {
          const res = await window.api.voice.searchFromTranscript(voice.transcript);
          if (res?.success && res.searchResult) {
            // Inject the voice-search result into the same UI path
            handleSearch(res.searchResult.query || voice.transcript);
          } else {
            // Fall back to plain text search with the transcript
            handleSearch(voice.transcript);
          }
        } else {
          handleSearch(voice.transcript);
        }
      } catch {
        handleSearch(voice.transcript);
      } finally {
        voice.reset();
        voiceProcessingRef.current = false;
      }
    })();
  }, [voice.transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVoiceToggle = useCallback(() => {
    setMediaError(null);
    if (voice.listening) {
      voice.stop();
    } else {
      voice.start();
    }
  }, [voice]);

  // Surface voice errors
  useEffect(() => {
    if (voice.error) setMediaError(`Voice: ${voice.error}`);
  }, [voice.error]);

  // ── Camera capture ────────────────────────────────────────────────────────
  const camera = useCameraCapture();
  const cameraProcessingRef = useRef(false);

  const handleCameraCapture = useCallback(async () => {
    if (cameraProcessingRef.current || loading) return;
    setMediaError(null);

    // If camera isn't active yet, open it. The user re-clicks to take a photo.
    if (!camera.capturing) {
      camera.start();
      return;
    }

    // Take the snapshot and run it through the image pipeline
    const base64 = camera.capture();
    if (!base64) return;

    cameraProcessingRef.current = true;
    try {
      if (window.api?.camera?.searchFromImage) {
        const res = await window.api.camera.searchFromImage(base64);
        if (res?.success && res.searchResult) {
          handleSearch(res.searchResult.query || res.searchArgs?.query || 'bike part');
        } else if (res?.success && res.searchArgs?.query) {
          handleSearch(res.searchArgs.query);
        } else {
          setMediaError('Could not identify the image. Try again or type a search.');
        }
      } else {
        setMediaError('Camera search is not available in this environment.');
      }
    } catch {
      setMediaError('Camera analysis failed. Try again.');
    } finally {
      camera.stop();
      cameraProcessingRef.current = false;
    }
  }, [camera, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Surface camera errors
  useEffect(() => {
    if (camera.error) setMediaError(`Camera: ${camera.error}`);
  }, [camera.error]);

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

        <SearchBar
          loading={loading}
          onSearch={handleSearch}
          onVoice={handleVoiceToggle}
          onCamera={handleCameraCapture}
          voiceListening={voice.listening}
          voiceSupported={voice.supported}
          cameraActive={camera.capturing}
        />

        {/* Camera viewfinder — shown only while camera is active */}
        {camera.capturing && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-black shadow-lg">
            <video
              ref={camera.videoRef}
              autoPlay
              playsInline
              muted
              className="mx-auto block max-h-64 w-full object-contain"
            />
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-sm text-white">
              Tap 📷 again to capture
            </p>
          </div>
        )}

        {/* Media errors (voice / camera) */}
        {mediaError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-amber-800 shadow-sm">
            {mediaError}
          </div>
        )}

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