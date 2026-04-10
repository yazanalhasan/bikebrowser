const { BaseSourceManager } = require('./base-manager');
const { YouTubeManager } = require('./youtube-manager');

class YouTubeKidsManager extends BaseSourceManager {
  constructor(apiKey) {
    super('YouTube Kids');
    this.sourceId = 'youtube-kids';
    this.youtube = new YouTubeManager(apiKey);
  }

  async search(queries = [], options = {}) {
    const results = await this.youtube.search(queries, options);
    return results.map((result) => ({
      ...result,
      id: result.id.replace(/^youtube:/, 'youtube-kids:'),
      source: 'youtube-kids',
      sourceName: 'YouTube Kids',
      safety_score: Math.min((result.safety_score || 0.5) + 0.1, 1)
    }));
  }

  async getById(id) {
    const result = await this.youtube.getById(String(id || '').replace(/^youtube-kids:/, 'youtube:'));
    if (!result) {
      return null;
    }

    return {
      ...result,
      id: result.id.replace(/^youtube:/, 'youtube-kids:'),
      source: 'youtube-kids',
      sourceName: 'YouTube Kids',
      safety_score: Math.min((result.safety_score || 0.5) + 0.1, 1)
    };
  }

  normalize(rawItem) {
    return {
      ...this.youtube.normalize(rawItem),
      source: 'youtube-kids',
      sourceName: 'YouTube Kids'
    };
  }
}

module.exports = {
  YouTubeKidsManager
};