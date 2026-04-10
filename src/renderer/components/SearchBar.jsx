import { useState } from 'react';

export function SearchBar({ initialValue = '', loading = false, onSearch }) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg md:flex-row md:items-center">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search for safe bike, engineering, and DIY content"
        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}

export default SearchBar;