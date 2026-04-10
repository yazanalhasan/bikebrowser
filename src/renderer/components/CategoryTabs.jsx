const CATEGORY_LABELS = {
  all: 'All',
  build: 'Build',
  buy: 'Buy',
  watch: 'Watch'
};

export function CategoryTabs({ activeCategory = 'all', counts = {}, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(CATEGORY_LABELS).map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange?.(category)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeCategory === category
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 shadow hover:bg-slate-50'
          }`}
        >
          {CATEGORY_LABELS[category]}
          {typeof counts[category] === 'number' ? ` (${counts[category]})` : ''}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;