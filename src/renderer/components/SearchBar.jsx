import { useState } from 'react';

export function SearchBar({
  initialValue = '',
  loading = false,
  onSearch,
  onVoice,
  onCamera,
  voiceListening = false,
  voiceSupported = true,
  cameraActive = false,
}) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.(value);
  };

  const busy = loading || voiceListening || cameraActive;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg md:flex-row md:items-center">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={voiceListening ? 'Listening…' : 'Search for safe bike, engineering, and DIY content'}
        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-400"
      />

      <div className="flex gap-2">
        {/* Mic button */}
        {voiceSupported && onVoice && (
          <button
            type="button"
            disabled={busy && !voiceListening}
            onClick={onVoice}
            title={voiceListening ? 'Stop listening' : 'Voice search'}
            className={`rounded-xl px-4 py-3 text-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
              voiceListening
                ? 'animate-pulse bg-red-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎙️
          </button>
        )}

        {/* Camera button */}
        {onCamera && (
          <button
            type="button"
            disabled={busy}
            onClick={onCamera}
            title="Search with camera"
            className={`rounded-xl px-4 py-3 text-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
              cameraActive
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📷
          </button>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  );
}

export default SearchBar;