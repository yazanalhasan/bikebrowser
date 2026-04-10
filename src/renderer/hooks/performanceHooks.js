import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDebounce Hook
 * 
 * Debounces a value (useful for search inputs).
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useAsyncState Hook
 * 
 * Manages async state with loading/error handling.
 * 
 * @param {Function} asyncFn - Async function to execute
 * @param {any} initialValue - Initial value
 * @returns {Object} { data, loading, error, execute, reset }
 */
export function useAsyncState(asyncFn, initialValue = null) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn(...args);
      
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
      throw err;
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setData(initialValue);
    setError(null);
    setLoading(false);
  }, [initialValue]);

  return { data, loading, error, execute, reset };
}

/**
 * useYouTubeSearch Hook
 * 
 * Optimized YouTube search with debouncing and cancellation.
 * 
 * @param {string} initialQuery - Initial search query
 * @param {Object} options - { debounceDelay, autoSearch }
 * @returns {Object} { results, loading, error, search, query, setQuery }
 */
export function useYouTubeSearch(initialQuery = '', options = {}) {
  const {
    debounceDelay = 500,
    autoSearch = true
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const debouncedQuery = useDebounce(query, debounceDelay);
  const abortControllerRef = useRef(null);

  const search = useCallback(async (searchQuery) => {
    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const videos = await window.electronAPI.searchYouTube(searchQuery.trim());
      setResults(videos || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (autoSearch && debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, autoSearch, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    query,
    setQuery
  };
}

/**
 * useIntersectionObserver Hook
 * 
 * Detects when an element enters/exits viewport.
 * 
 * @param {Object} options - IntersectionObserver options
 * @returns {Object} { ref, isIntersecting }
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: options.threshold || 0,
        rootMargin: options.rootMargin || '0px',
        root: options.root || null
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin, options.root]);

  return { ref, isIntersecting };
}

/**
 * usePrevious Hook
 * 
 * Returns previous value (useful for comparing props).
 */
export function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * usePerformance Hook
 * 
 * Tracks component render performance.
 * 
 * @param {string} componentName - Name for tracking
 */
export function usePerformance(componentName) {
  const renderCount = useRef(0);
  const renderTimes = useRef([]);

  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now();
    renderTimes.current.push(renderTime);

    // Keep only last 10 renders
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}`);
    }
  });

  return {
    renderCount: renderCount.current,
    avgRenderTime: renderTimes.current.length > 1
      ? (renderTimes.current[renderTimes.current.length - 1] - renderTimes.current[0]) / renderTimes.current.length
      : 0
  };
}

/**
 * useLocalStorage Hook
 * 
 * Syncs state with localStorage.
 * 
 * @param {string} key - LocalStorage key
 * @param {any} initialValue - Initial value
 * @returns {Array} [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
