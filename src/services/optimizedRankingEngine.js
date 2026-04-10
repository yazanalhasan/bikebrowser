/**
 * Optimized Ranking Engine Integration
 * 
 * This module provides a drop-in replacement for rankingEngine.processSearch()
 * that uses worker threads for CPU-intensive operations.
 * 
 * Key optimizations:
 * - Feature extraction runs in worker threads (prevents UI blocking)
 * - LRU cache for ranked results (memory-efficient)
 * - Request deduplication (prevents duplicate searches)
 * - Stale request cancellation (latest search wins)
 * - Automatic cache cleanup
 */

const path = require('path');
const WorkerManager = require('../workers/workerManager');
const { LRUCache } = require('../cache/lruCache');
const { RequestManager } = require('../utils/requestManager');
const db = require('./db');

class OptimizedRankingEngine {
  constructor() {
    // Worker pool for ranking operations
    this.workerManager = new WorkerManager({
      maxWorkers: 4,
      defaultTimeout: 30000
    });

    // Initialize worker with rankingWorker.js
    this.workerManager.initialize(
      path.join(__dirname, '../workers/rankingWorker.js')
    );

    // LRU cache for search results (30 recent searches, 5min TTL)
    this.searchCache = new LRUCache({
      name: 'SearchResults',
      maxSize: 30,
      ttl: 300000 // 5 minutes
    });

    // Request manager for cancellation/deduplication
    this.requestManager = new RequestManager({
      defaultTimeout: 30000
    });

    // Channel trust data (cached for worker)
    this.channelTrustCache = null;
    this.channelTrustCacheTime = 0;

    // Database cache cleanup interval (every 30 minutes)
    this.dbCleanupInterval = setInterval(() => {
      this._cleanupDatabaseCache();
    }, 1800000);

    console.log('[OptimizedRankingEngine] Initialized with worker pool');
  }

  /**
   * Get channel trust data (cached)
   */
  async _getChannelTrustData() {
    const now = Date.now();
    
    // Refresh cache every 5 minutes
    if (!this.channelTrustCache || now - this.channelTrustCacheTime > 300000) {
      const channels = db.channels.getAll();
      this.channelTrustCache = {};
      
      for (const channel of channels) {
        this.channelTrustCache[channel.channel_id] = channel.trust_level;
      }
      
      this.channelTrustCacheTime = now;
    }

    return this.channelTrustCache;
  }

  /**
   * Process search with optimizations
   * 
   * @param {string} query - Search query
   * @param {Object} options - { maxResults, minScore, useCache }
   * @returns {Promise<Array>} Ranked videos
   */
  async processSearch(query, options = {}) {
    const {
      maxResults = 20,
      minScore = 20,
      useCache = true
    } = options;

    // Normalize query for caching
    const cacheKey = `${query.toLowerCase().trim()}:${maxResults}:${minScore}`;

    // Check search cache first
    if (useCache) {
      const cached = this.searchCache.get(cacheKey);
      if (cached) {
        console.log('[OptimizedRankingEngine] Cache hit:', query);
        return cached;
      }
    }

    // Use request manager to handle cancellation and deduplication
    return this.requestManager.execute(
      'youtube-search',
      query,
      async (signal) => {
        // Import the original ranking engine (for YouTube scraping only)
        const rankingEngine = require('./rankingEngine');
        
        // Step 1: Fetch videos from YouTube (on main thread for now)
        // Note: This could be optimized further by moving to a separate scraping worker
        const rawVideos = await rankingEngine.youtubeScraper.searchVideos(query, maxResults);

        if (signal.aborted) {
          throw new Error('Search cancelled');
        }

        // Step 2: Check database cache for existing scores
        const videosToScore = [];
        const cachedResults = [];

        for (const video of rawVideos) {
          const cached = db.rankingCache.get(video.videoId);
          
          if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
            // Use cached score (within 7 days)
            cachedResults.push({
              ...video,
              score: cached.score,
              features: JSON.parse(cached.features),
              cached: true
            });
          } else {
            videosToScore.push(video);
          }
        }

        if (signal.aborted) {
          throw new Error('Search cancelled');
        }

        // Step 3: Score new videos using worker thread
        let workerResults = [];
        
        if (videosToScore.length > 0) {
          const channelTrustData = await this._getChannelTrustData();
          
          workerResults = await this.workerManager.execute(
            'rankVideos',
            {
              videos: videosToScore,
              channelTrustData,
              options: { minScore }
            },
            { signal }
          );

          // Cache new scores in database
          for (const result of workerResults) {
            db.rankingCache.set(
              result.videoId,
              result.score,
              JSON.stringify(result.features)
            );
          }
        }

        if (signal.aborted) {
          throw new Error('Search cancelled');
        }

        // Step 4: Merge cached and new results
        const allResults = [...cachedResults, ...workerResults.map((r, i) => ({
          ...videosToScore[i],
          score: r.score,
          features: r.features,
          cached: false
        }))];

        // Step 5: Sort by score and apply threshold
        const ranked = allResults
          .filter(v => v.score >= minScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, maxResults);

        // Add trust tier and explanation
        for (const video of ranked) {
          video.trustTier = this._getTrustTier(video.score);
          video.trustBadge = this._getTrustBadge(video.trustTier);
        }

        // Cache search results
        if (useCache) {
          this.searchCache.set(cacheKey, ranked);
        }

        console.log(`[OptimizedRankingEngine] Processed ${rawVideos.length} videos: ${cachedResults.length} cached, ${workerResults.length} scored`);

        return ranked;
      },
      {
        dedupe: true,
        version: true
      }
    );
  }

  /**
   * Get trust tier from score
   */
  _getTrustTier(score) {
    if (score >= 70) return 'prioritized';
    if (score >= 40) return 'allowed';
    if (score >= 20) return 'downranked';
    return 'blocked';
  }

  /**
   * Get trust badge info
   */
  _getTrustBadge(tier) {
    const badges = {
      prioritized: { icon: '🟢', label: 'Great!', color: 'green' },
      allowed: { icon: '🔵', label: 'Good', color: 'blue' },
      downranked: { icon: '🟡', label: 'OK', color: 'yellow' },
      blocked: { icon: '🔴', label: 'Skip', color: 'red' }
    };
    return badges[tier] || badges.allowed;
  }

  /**
   * Clean up old database cache entries
   */
  _cleanupDatabaseCache() {
    try {
      const deleted = db.rankingCache.clearOld();
      if (deleted > 0) {
        console.log(`[OptimizedRankingEngine] Cleaned ${deleted} old cache entries`);
      }
    } catch (error) {
      console.error('[OptimizedRankingEngine] Error cleaning cache:', error);
    }
  }

  /**
   * Get statistics for diagnostics
   */
  getStats() {
    return {
      workers: this.workerManager.getStatus(),
      cache: this.searchCache.getStats(),
      requests: this.requestManager.getStats()
    };
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    clearInterval(this.dbCleanupInterval);
    await this.workerManager.shutdown();
    this.requestManager.destroy();
    this.searchCache.destroy();
    console.log('[OptimizedRankingEngine] Shutdown complete');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  /**
   * Get singleton instance
   */
  getInstance() {
    if (!instance) {
      instance = new OptimizedRankingEngine();
    }
    return instance;
  },

  /**
   * Process search (convenience function)
   */
  async processSearch(query, options) {
    return this.getInstance().processSearch(query, options);
  },

  /**
   * Get stats (convenience function)
   */
  getStats() {
    return instance ? instance.getStats() : null;
  },

  /**
   * Shutdown (convenience function)
   */
  async shutdown() {
    if (instance) {
      await instance.shutdown();
      instance = null;
    }
  }
};
