/**
 * LRU Cache
 * 
 * Least Recently Used cache with:
 * - Max size limit (evicts oldest when full)
 * - TTL (time-to-live) expiration
 * - Memory-efficient Map-based storage
 * - Automatic cleanup of stale entries
 */

class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.cache = new Map(); // key -> { value, timestamp, accessCount }
    this.name = options.name || 'Cache';
    
    // Start cleanup timer if TTL is set
    if (this.ttl > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, Math.min(this.ttl, 60000)); // Clean at least every minute
    }
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access timestamp and count (LRU tracking)
    entry.timestamp = Date.now();
    entry.accessCount = (entry.accessCount || 0) + 1;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value) {
    // Check if exists and update
    if (this.cache.has(key)) {
      this.cache.delete(key); // Remove to re-add at end
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Check if key exists (without updating LRU)
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const entry = this.cache.get(key);

    // Check if expired
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get current size
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Shrink the maximum size and immediately evict entries above the new limit.
   *
   * Use this under memory pressure to reclaim heap space.
   *
   * @param {number} fraction  Target fraction of current maxSize (0–1).
   *                           E.g. 0.5 halves the cache capacity.
   */
  shrink(fraction = 0.5) {
    const newMax = Math.max(10, Math.floor(this.maxSize * Math.min(1, Math.max(0.1, fraction))));
    this.maxSize = newMax;
    while (this.cache.size > newMax) {
      this._evictOldest();
    }
  }

  /**
   * Evict the least recently used entry
   */
  _evictOldest() {
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    if (this.ttl <= 0) {
      return;
    }

    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`[${this.name}] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: (this.cache.size / this.maxSize * 100).toFixed(1) + '%',
      oldestEntry: entries.length > 0 ? Date.now() - entries[0].timestamp : 0,
      avgAccessCount: entries.length > 0 
        ? (entries.reduce((sum, e) => sum + (e.accessCount || 0), 0) / entries.length).toFixed(1)
        : 0
    };
  }

  /**
   * Destroy cache and stop cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * Cache Manager - manages multiple named caches
 */
class CacheManager {
  constructor() {
    this.caches = new Map();
  }

  /**
   * Create or get a named cache
   */
  getCache(name, options = {}) {
    if (!this.caches.has(name)) {
      const cache = new LRUCache({ ...options, name });
      this.caches.set(name, cache);
    }
    return this.caches.get(name);
  }

  /**
   * Get all cache statistics
   */
  getAllStats() {
    const stats = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  /**
   * Apply memory pressure to all caches: shrink each cache's max size.
   *
   * @param {number} fraction  Target fraction of current maxSize (0–1).
   *                           E.g. 0.5 halves every cache.
   */
  applyMemoryPressure(fraction = 0.5) {
    for (const cache of this.caches.values()) {
      cache.shrink(fraction);
    }
    console.log(
      `[CacheManager] Memory pressure applied: caches shrunk to ` +
      `${Math.round(fraction * 100)}% of previous max size`
    );
  }

  /**
   * Clear all caches
   */
  clearAll() {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Destroy all caches
   */
  destroyAll() {
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
  }
}

module.exports = { LRUCache, CacheManager };
