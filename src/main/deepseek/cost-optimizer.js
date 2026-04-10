class CostOptimizer {
  constructor() {
    this.tokenCounts = new Map();
    this.estimatedCostPer1kTokens = 0.002;
  }

  batchSimilarQueries(queries, similarityThreshold = 0.7) {
    const batches = [];
    const used = new Set();

    for (let index = 0; index < queries.length; index += 1) {
      if (used.has(index)) {
        continue;
      }

      const batch = [queries[index]];
      used.add(index);

      for (let compareIndex = index + 1; compareIndex < queries.length; compareIndex += 1) {
        if (used.has(compareIndex)) {
          continue;
        }

        if (this.calculateSimilarity(queries[index], queries[compareIndex]) > similarityThreshold) {
          batch.push(queries[compareIndex]);
          used.add(compareIndex);
        }
      }

      batches.push(batch);
    }

    return batches;
  }

  calculateSimilarity(query1, query2) {
    const words1 = new Set(String(query1 || '').toLowerCase().split(/\s+/).filter(Boolean));
    const words2 = new Set(String(query2 || '').toLowerCase().split(/\s+/).filter(Boolean));
    const intersection = new Set([...words1].filter((word) => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  estimateCost(tokens) {
    return (tokens / 1000) * this.estimatedCostPer1kTokens;
  }

  shouldCache(_result, cost) {
    return cost > 0.01;
  }

  getOptimizationRecommendations(stats) {
    const recommendations = [];

    if ((stats.cacheHitRate || 0) < 0.3) {
      recommendations.push('Increase cache TTL to improve hit rate');
    }

    if ((stats.averageTokensPerRequest || 0) > 3000) {
      recommendations.push('Consider reducing batch size to lower token usage');
    }

    if ((stats.totalRequests || 0) > 1000) {
      recommendations.push(`Estimated monthly cost: $${this.estimateCost(stats.totalTokens || 0).toFixed(2)}`);
    }

    return recommendations;
  }
}

module.exports = {
  CostOptimizer
};