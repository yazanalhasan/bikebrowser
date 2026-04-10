const fs = require('fs/promises');
const { BaseSourceManager } = require('./base-manager');

class CuratedSourceManager extends BaseSourceManager {
  constructor(sourceName, indexPath) {
    super(sourceName);
    this.indexPath = indexPath;
    this.contentIndex = null;
  }

  async loadIndex() {
    if (!this.contentIndex) {
      const data = await fs.readFile(this.indexPath, 'utf-8');
      this.contentIndex = JSON.parse(data);
    }

    return this.contentIndex;
  }

  async search(queries = []) {
    const index = await this.loadIndex();
    const safeQueries = Array.isArray(queries) && queries.length > 0 ? queries : [''];
    const results = [];

    for (const item of index.content || []) {
      const searchableText = `${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
      let relevance = 0;

      for (const query of safeQueries) {
        const queryLower = String(query || '').trim().toLowerCase();
        if (!queryLower) {
          relevance = Math.max(relevance, 0.25);
          continue;
        }

        if (searchableText.includes(queryLower)) {
          relevance += 0.3;
        }

        if (item.title.toLowerCase().includes(queryLower)) {
          relevance += 0.2;
        }

         const terms = queryLower.split(/\s+/).filter((term) => term.length > 2);
         if (terms.length > 0) {
           const termMatches = terms.filter((term) => searchableText.includes(term)).length;
           const titleMatches = terms.filter((term) => item.title.toLowerCase().includes(term)).length;
           relevance += (termMatches / terms.length) * 0.35;
           relevance += (titleMatches / terms.length) * 0.15;
         }
      }

      relevance = Math.min(relevance, 1);
      if (relevance <= 0) {
        continue;
      }

      const normalized = this.normalize(item, index);
      normalized.relevance_score = relevance;
      results.push(normalized);
    }

    return results;
  }

  async getById(id) {
    const index = await this.loadIndex();
    const cleanId = String(id || '').split(':').pop();
    const item = (index.content || []).find((entry) => entry.id === cleanId);
    return item ? this.normalize(item, index) : null;
  }

  normalize(rawItem, index = this.contentIndex) {
    return {
      id: `${this.sourceId}:${rawItem.id}`,
      title: rawItem.title,
      source: this.sourceId,
      sourceName: this.sourceName,
      url: rawItem.url,
      thumbnail: rawItem.thumbnail || '',
      description: rawItem.description || '',
      safety_score: 1,
      relevance_score: 0.5,
      educational_score: 0.9,
      category: rawItem.category || 'watch',
      summary: rawItem.description || rawItem.title,
      tags: rawItem.tags || [],
      requires_supervision: rawItem.requires_supervision || false,
      sourceMetadata: {
        duration: rawItem.duration,
        difficulty: rawItem.difficulty,
        materials_needed: rawItem.materials_needed,
        age_range: rawItem.age_range,
        is_curated: true
      }
    };
  }
}

module.exports = {
  CuratedSourceManager
};