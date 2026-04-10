/**
 * Request Manager
 * 
 * Manages API requests with:
 * - Cancellation via AbortController
 * - Request deduplication (prevent duplicate in-flight requests)
 * - Request versioning (only latest result wins)
 * - Timeout support
 * - Automatic cleanup
 */

class RequestManager {
  constructor(options = {}) {
    this.pendingRequests = new Map(); // key -> { controller, promise, timestamp }
    this.requestVersions = new Map(); // context -> version number
    this.defaultTimeout = options.defaultTimeout || 30000;
    this.maxAge = options.maxAge || 60000; // Auto-cleanup requests older than 1 min
    
    // Periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this._cleanup();
    }, 30000);
  }

  /**
   * Generate request key for deduplication
   */
  _generateKey(context, query, params = {}) {
    const paramsStr = JSON.stringify(params);
    return `${context}:${query}:${paramsStr}`;
  }

  /**
   * Get current version for a context (e.g., 'youtube-search')
   */
  _getVersion(context) {
    return this.requestVersions.get(context) || 0;
  }

  /**
   * Increment version for a context (invalidates previous requests)
   */
  _incrementVersion(context) {
    const newVersion = this._getVersion(context) + 1;
    this.requestVersions.set(context, newVersion);
    return newVersion;
  }

  /**
   * Execute a request with deduplication and cancellation
   * 
   * @param {string} context - Logical context (e.g., 'youtube-search', 'places-search')
   * @param {string} query - The query/search term
   * @param {Function} requestFn - Async function that performs the request
   * @param {Object} options - { params, timeout, dedupe, version }
   * @returns {Promise} Result or throws if cancelled/timed out
   */
  async execute(context, query, requestFn, options = {}) {
    const {
      params = {},
      timeout = this.defaultTimeout,
      dedupe = true,
      version = true
    } = options;

    const key = this._generateKey(context, query, params);

    // Check for duplicate in-flight request
    if (dedupe && this.pendingRequests.has(key)) {
      console.log(`[RequestManager] Deduping request: ${key}`);
      return this.pendingRequests.get(key).promise;
    }

    // Increment version if versioning is enabled
    const currentVersion = version ? this._incrementVersion(context) : null;

    // Cancel previous requests in this context if versioning enabled
    if (version) {
      this.cancelContext(context, currentVersion);
    }

    // Create AbortController
    const controller = new AbortController();
    const { signal } = controller;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    // Create promise
    const promise = (async () => {
      try {
        const result = await requestFn(signal);

        // Clear timeout
        clearTimeout(timeoutId);

        // Remove from pending
        this.pendingRequests.delete(key);

        // Check if this result is still relevant (version check)
        if (version && currentVersion !== this._getVersion(context)) {
          console.log(`[RequestManager] Stale result discarded: ${key}`);
          throw new Error('Request result is stale');
        }

        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(key);

        // Don't log abort errors (normal cancellation)
        if (error.name !== 'AbortError' && !signal.aborted) {
          console.error(`[RequestManager] Request failed: ${key}`, error);
        }

        throw error;
      }
    })();

    // Store pending request
    this.pendingRequests.set(key, {
      controller,
      promise,
      timestamp: Date.now(),
      context,
      version: currentVersion
    });

    return promise;
  }

  /**
   * Cancel a specific request by key
   */
  cancelRequest(context, query, params = {}) {
    const key = this._generateKey(context, query, params);
    const request = this.pendingRequests.get(key);

    if (request) {
      request.controller.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cancel all requests in a context (except current version)
   */
  cancelContext(context, keepVersion = null) {
    const keysToCancel = [];

    for (const [key, request] of this.pendingRequests.entries()) {
      if (request.context === context) {
        // Keep current version if specified
        if (keepVersion !== null && request.version === keepVersion) {
          continue;
        }
        keysToCancel.push(key);
      }
    }

    for (const key of keysToCancel) {
      const request = this.pendingRequests.get(key);
      if (request) {
        request.controller.abort();
        this.pendingRequests.delete(key);
      }
    }

    if (keysToCancel.length > 0) {
      console.log(`[RequestManager] Cancelled ${keysToCancel.length} stale requests in ${context}`);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    for (const [key, request] of this.pendingRequests.entries()) {
      request.controller.abort();
    }
    this.pendingRequests.clear();
    console.log('[RequestManager] Cancelled all requests');
  }

  /**
   * Clean up old completed/abandoned requests
   */
  _cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        request.controller.abort();
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.pendingRequests.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`[RequestManager] Cleaned up ${keysToDelete.length} stale requests`);
    }
  }

  /**
   * Get statistics for diagnostics
   */
  getStats() {
    const byContext = {};

    for (const request of this.pendingRequests.values()) {
      if (!byContext[request.context]) {
        byContext[request.context] = 0;
      }
      byContext[request.context]++;
    }

    return {
      totalPending: this.pendingRequests.size,
      byContext,
      versions: Object.fromEntries(this.requestVersions)
    };
  }

  /**
   * Destroy manager
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cancelAll();
    this.requestVersions.clear();
  }
}

/**
 * Debounce utility for search inputs
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with cancel method
 */
function debounce(fn, delay) {
  let timeoutId = null;
  let latestArgs = null;

  const debounced = function (...args) {
    latestArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, latestArgs);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };

  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      return fn.apply(this, latestArgs);
    }
  };

  return debounced;
}

module.exports = { RequestManager, debounce };
