const { BaseSourceManager } = require('./base-manager');
const youtubeScraper = require('../../services/youtubeScraper');
const { scoreQualityFit } = require('../../shared/videoQualitySources');

class YouTubeManager extends BaseSourceManager {
  constructor(apiKey) {
    super('YouTube');
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    this.invalidKeyPattern = /(your[-_]|placeholder|key[-_]?here|youryoutube|your_youtube)/i;
  }

  hasUsableApiKey() {
    const apiKey = String(this.apiKey || '').trim();
    return Boolean(apiKey) && !this.invalidKeyPattern.test(apiKey);
  }

  normalizeScrapedItem(rawItem, query = '') {
    const quality = scoreQualityFit(rawItem, query);
    return {
      id: `youtube:${rawItem.videoId}`,
      title: rawItem.title || 'YouTube Video',
      source: 'youtube',
      sourceName: 'YouTube',
      url: rawItem.url || `https://www.youtube.com/watch?v=${rawItem.videoId}`,
      thumbnail: rawItem.thumbnail || '',
      description: rawItem.description || '',
      channelId: rawItem.channelId || null,
      channelName: rawItem.channelName || 'YouTube',
      safety_score: 0.6,
      relevance_score: Math.min(0.98, 0.6 + quality.depthBonus + (quality.curatedChannel ? 0.08 : 0)),
      educational_score: Math.min(0.98, 0.6 + quality.sourceBonus + quality.depthBonus),
      category: 'watch',
      summary: String(rawItem.description || '').slice(0, 150),
      tags: [],
      requires_supervision: false,
      sourceMetadata: {
        author: rawItem.channelName || 'YouTube',
        channelId: rawItem.channelId || null,
        is_curated: Boolean(quality.curatedChannel),
        curatedChannel: quality.curatedChannel?.name || null,
        technicalMatches: quality.technicalMatches,
        querySystems: quality.querySystems
      }
    };
  }

  async fallbackSearch(queries = [], reason = 'API unavailable') {
    console.log(`[YouTubeManager] Using scraper fallback for search: ${reason}`);
    const results = [];

    for (const query of queries.slice(0, 3)) {
      try {
        const items = await youtubeScraper.searchVideos(query, 5);
        results.push(...items.map((item) => this.normalizeScrapedItem(item, query)));
      } catch (error) {
        console.error(`[YouTubeManager] Scraper search fallback failed for "${query}":`, error.message);
      }
    }

    return results;
  }

  async fallbackGetById(videoId, reason = 'API unavailable') {
    console.log(`[YouTubeManager] Using scraper fallback for getById(${videoId}): ${reason}`);
    try {
      const item = await youtubeScraper.getVideoDetails(videoId);
      if (!item) {
        return null;
      }

      return this.normalizeScrapedItem(item);
    } catch (error) {
      console.error(`[YouTubeManager] Scraper getById fallback failed for "${videoId}":`, error.message);
      return null;
    }
  }

  async search(queries = []) {
    if (!this.hasUsableApiKey()) {
      return this.fallbackSearch(queries, 'invalid YouTube API configuration');
    }

    const allResults = [];
    const seenIds = new Set();
    const maxPerQuery = 15;
    const queryList = queries.slice(0, 3);

    for (const query of queryList) {
      try {
        const searchParams = new URLSearchParams({
          part: 'snippet',
          q: query,
          maxResults: String(maxPerQuery),
          type: 'video',
          safeSearch: 'strict',
          key: this.apiKey
        });
        const response = await fetch(`${this.baseUrl}/search?${searchParams.toString()}`);

        if (!response.ok) {
          return this.fallbackSearch(queries, `YouTube API failed with status ${response.status}`);
        }

        const data = await response.json();
        for (const item of data.items || []) {
          const normalized = this.normalize(item, query);
          const vid = String(normalized.id || '').split(':').pop();
          if (vid && !seenIds.has(vid)) {
            seenIds.add(vid);
            allResults.push(normalized);
          }
        }
      } catch (error) {
        return this.fallbackSearch(queries, `YouTube API request failed: ${error.message}`);
      }
    }

    return allResults;
  }

  async getById(id) {
    const videoId = String(id || '').split(':').pop();
    if (!videoId) {
      return null;
    }

    if (!this.hasUsableApiKey()) {
      return this.fallbackGetById(videoId, 'invalid YouTube API configuration');
    }

    try {
      const detailParams = new URLSearchParams({
        part: 'snippet',
        id: videoId,
        key: this.apiKey
      });
      const response = await fetch(`${this.baseUrl}/videos?${detailParams.toString()}`);

      if (!response.ok) {
        return this.fallbackGetById(videoId, `YouTube API failed with status ${response.status}`);
      }

      const data = await response.json();
      const item = (data.items || [])[0];
      if (!item) {
        return this.fallbackGetById(videoId, 'YouTube API returned no item');
      }

      return this.normalize({
        id: { videoId: item.id },
        snippet: item.snippet
      });
    } catch (error) {
      return this.fallbackGetById(videoId, `YouTube API request failed: ${error.message}`);
    }
  }

  normalize(rawItem, query = '') {
    const videoId = rawItem?.id?.videoId || rawItem?.id;
    const channelName = rawItem?.snippet?.channelTitle || 'YouTube';
    const quality = scoreQualityFit({
      title: rawItem?.snippet?.title,
      description: rawItem?.snippet?.description,
      channelName
    }, query);

    return {
      id: `youtube:${videoId}`,
      title: rawItem?.snippet?.title || 'YouTube Video',
      source: 'youtube',
      sourceName: 'YouTube',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: rawItem?.snippet?.thumbnails?.medium?.url || rawItem?.snippet?.thumbnails?.default?.url || '',
      description: rawItem?.snippet?.description || '',
      channelId: rawItem?.snippet?.channelId || null,
      channelName,
      safety_score: 0.6,
      relevance_score: Math.min(0.98, 0.6 + quality.depthBonus + (quality.curatedChannel ? 0.08 : 0)),
      educational_score: Math.min(0.98, 0.5 + quality.sourceBonus + quality.depthBonus),
      category: 'watch',
      summary: (rawItem?.snippet?.description || '').slice(0, 150),
      tags: [],
      requires_supervision: false,
      sourceMetadata: {
        author: channelName,
        channelId: rawItem?.snippet?.channelId || null,
        is_curated: Boolean(quality.curatedChannel),
        curatedChannel: quality.curatedChannel?.name || null,
        technicalMatches: quality.technicalMatches,
        querySystems: quality.querySystems
      }
    };
  }
}

module.exports = {
  YouTubeManager
};
