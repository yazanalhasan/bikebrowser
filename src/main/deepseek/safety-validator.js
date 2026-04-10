class SafetyValidator {
  constructor() {
    this.allowedCategories = ['build', 'buy', 'watch', 'mixed'];
    this.allowedSources = ['youtube', 'sciencekids', 'toymaker', 'krokotak', 'diyorg', 'tiinker', 'ndli', 'youtube-kids', 'shopping'];
    this.blockedPatterns = [
      /\b(adult|sexy|naked|violent|kill|death|crash|accident)\b/i,
      /\b(hack|cheat|exploit|scam|fake)\b/i,
      /\b(dangerous|extreme|crazy)\b/i
    ];
  }

  validateQueryExpansion(parsed = {}) {
    const result = { ...parsed };
    if (!this.allowedCategories.includes(result.intent)) {
      result.intent = 'mixed';
    }

    if (Array.isArray(result.expanded_queries)) {
      result.expanded_queries = result.expanded_queries
        .filter((query) => this.isQuerySafe(query?.query))
        .map((query) => ({
          ...query,
          target_source: this.allowedSources.includes(query.target_source) ? query.target_source : 'youtube'
        }));
    } else {
      result.expanded_queries = [];
    }

    if (!result.safety_notes) {
      result.safety_notes = 'No safety notes provided';
    }

    if (!result.suggested_filters) {
      result.suggested_filters = {};
    }

    return result;
  }

  validateContentEvaluation(evaluation = {}) {
    const result = { ...evaluation };
    result.safety_score = Math.min(1, Math.max(0, result.safety_score ?? 0.5));
    result.relevance_score = Math.min(1, Math.max(0, result.relevance_score ?? 0.5));
    result.educational_score = Math.min(1, Math.max(0, result.educational_score ?? 0.5));

    if (!['build', 'buy', 'watch'].includes(result.category)) {
      result.category = 'watch';
    }

    if (!Array.isArray(result.flags)) {
      result.flags = [];
    }

    if (result.summary) {
      result.summary = String(result.summary).substring(0, 150);
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(result.summary)) {
          result.summary = 'Educational content about bikes and building.';
          result.safety_score = Math.min(result.safety_score, 0.7);
        }
      }
    }

    return result;
  }

  isQuerySafe(query) {
    if (!query || typeof query !== 'string') {
      return false;
    }

    return !this.blockedPatterns.some((pattern) => pattern.test(query.toLowerCase()));
  }
}

module.exports = {
  SafetyValidator
};