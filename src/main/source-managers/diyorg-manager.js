const { BaseSourceManager } = require('./base-manager');

class DIYOrgManager extends BaseSourceManager {
  constructor() {
    super('DIY.org');
    this.sourceId = 'diyorg';
    this.baseUrl = 'https://diy.org';
  }

  async search() {
    console.log('DIY.org search - implement RSS parsing');
    return [];
  }

  async getById() {
    return null;
  }

  normalize(rawItem) {
    return {
      id: `diyorg:${rawItem.id}`,
      title: rawItem.title,
      source: 'diyorg',
      sourceName: 'DIY.org',
      url: rawItem.link,
      thumbnail: rawItem.thumbnail || '',
      description: rawItem.description || '',
      safety_score: 0.95,
      relevance_score: 0.5,
      educational_score: 0.85,
      category: 'build',
      summary: rawItem.description || rawItem.title,
      tags: rawItem.tags || [],
      requires_supervision: true,
      sourceMetadata: {
        author: rawItem.creator,
        difficulty: rawItem.difficulty,
        is_curated: false
      }
    };
  }
}

module.exports = {
  DIYOrgManager
};