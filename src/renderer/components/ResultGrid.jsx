import React from 'react';
import ShoppingResult from './ShoppingResult';

const SHOPPING_SOURCES = new Set([
  'aliexpress',
  'banggood',
  'alibaba',
  'revzilla',
  'jensonusa',
  'chainreaction',
  'offerup',
  'facebook-marketplace',
  'adafruit',
  'makerbeam'
]);

export function ResultGrid({ results, onResultClick }) {
  if (!results || results.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">No results found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {results.map((result) => (
        SHOPPING_SOURCES.has(result.source) || result.category === 'buy' ? (
          <ShoppingResult
            key={result.id}
            result={result}
            onClick={() => onResultClick?.(result)}
          />
        ) : (
          <ResultCard
            key={result.id}
            result={result}
            onClick={() => onResultClick?.(result)}
          />
        )
      ))}
    </div>
  );
}

function ResultCard({ result, onClick }) {
  const sourceColors = {
    youtube: 'bg-red-500',
    'youtube-kids': 'bg-red-400',
    sciencekids: 'bg-green-500',
    toymaker: 'bg-purple-500',
    krokotak: 'bg-blue-500',
    diyorg: 'bg-orange-500',
    tiinker: 'bg-yellow-600',
    ndli: 'bg-indigo-500'
  };

  const sourceColor = sourceColors[result.source] || 'bg-gray-500';

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
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
      <div className="relative">
        <img
          src={result.thumbnail || 'https://via.placeholder.com/320x180?text=No+Image'}
          alt={result.title}
          className="h-40 w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = 'https://via.placeholder.com/320x180?text=No+Image';
          }}
        />
        {result.requires_supervision && (
          <span className="absolute right-2 top-2 rounded bg-yellow-500 px-2 py-1 text-xs text-white">
            Adult Help
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-800">{result.title}</h3>

        <div className="mt-2 flex items-center justify-between">
          <span className={`${sourceColor} rounded px-2 py-1 text-xs text-white`}>
            {result.sourceName}
          </span>

          {result.price && (
            <span className="font-bold text-green-600">
              {result.price.currency || '$'}{result.price.amount}
            </span>
          )}
        </div>

        {result.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{result.summary}</p>
        )}
      </div>
    </div>
  );
}

export default ResultGrid;