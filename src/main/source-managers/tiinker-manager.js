const { BaseSourceManager } = require('./base-manager');

class TiinkerManager extends BaseSourceManager {
  constructor() {
    super('Tiinker');
    this.baseUrl = 'https://tiinker.com';
  }

  async search() {
    console.log('Tiinker search - awaiting API access');
    return [];
  }

  async getById() {
    return null;
  }

  normalize(rawItem) {
    return {
      id: `tiinker:${rawItem.id}`,
      title: rawItem.title,
      source: 'tiinker',
      sourceName: 'Tiinker',
      url: rawItem.url,
      thumbnail: rawItem.thumbnail || '',
      description: rawItem.description || '',
      safety_score: 0.85,
      relevance_score: 0.7,
      educational_score: 0.8,
      category: 'build',
      summary: rawItem.description || rawItem.title,
      tags: rawItem.tags || ['motorcycle', 'build'],
      requires_supervision: true,
      sourceMetadata: {
        author: rawItem.author,
        is_curated: false
      }
    };
  }
}

module.exports = {
  TiinkerManager
};