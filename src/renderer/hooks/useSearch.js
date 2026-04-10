import { useCallback, useState } from 'react';
import { apiClient } from '../../client/apiClient';

export function useSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, options = {}) => {
    if (!String(query || '').trim()) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await apiClient.search(query, options);
      setResults(searchResults);
      return searchResults;
    } catch (err) {
      setError(err.message);
      console.error('Search failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults
  };
}