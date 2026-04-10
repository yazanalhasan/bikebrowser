const { BaseSourceManager } = require('./base-manager');

class NDLIManager extends BaseSourceManager {
  constructor() {
    super('NDLI');
    this.baseUrl = 'https://ndl.iitkgp.ac.in';
  }

  async search() {
    console.log('NDLI search - awaiting API integration');
    return [];
  }

  async getById() {
    return null;
  }

  normalize(rawItem) {
    return {
      id: `ndli:${rawItem.id}`,
      title: rawItem.title,
      source: 'ndli',
      sourceName: 'NDLI',
      url: rawItem.url,
      thumbnail: rawItem.thumbnail || '',
      description: rawItem.description || '',
      safety_score: 0.8,
      relevance_score: 0.7,
      educational_score: 0.85,
      category: 'watch',
      summary: rawItem.description || rawItem.title,
      tags: rawItem.tags || [],
      requires_supervision: false,
      sourceMetadata: {
        author: rawItem.author,
        is_curated: false
      }
    };
  }
}

module.exports = {
  NDLIManager
};