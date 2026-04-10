class FallbackHandler {
  constructor() {
    this.fallbackQueries = {
      'cheap dirt bike': [
        'electric dirt bike for kids',
        'mini bike build kit',
        'dirt bike tutorial for beginners'
      ],
      'how to build electric bike': [
        'electric bike conversion kit tutorial',
        'diy e-bike for kids',
        'electric bike assembly guide'
      ],
      'best mini bike': [
        'Razor MX350 dirt rocket',
        'mini bike for 9 year old',
        'beginner mini bike review'
      ],
      'cool motorcycle engine': [
        'how motorcycle engine works',
        'engine for kids explanation',
        'mini bike engine tutorial'
      ]
    };
  }

  getFallbackExpansion(userQuery) {
    const lowerQuery = String(userQuery || '').toLowerCase();

    for (const [pattern, queries] of Object.entries(this.fallbackQueries)) {
      if (lowerQuery.includes(pattern)) {
        return {
          intent: 'mixed',
          expanded_queries: queries.map((query) => ({
            query,
            target_source: 'youtube',
            reasoning: 'Fallback query from safe predefined list'
          })),
          safety_notes: 'Using fallback queries due to API unavailability',
          suggested_filters: {
            price_max: 500,
            location_required: false,
            requires_supervision: false
          }
        };
      }
    }

    return {
      intent: 'watch',
      expanded_queries: [
        {
          query: `${userQuery} for kids`,
          target_source: 'youtube',
          reasoning: 'Safe educational content'
        },
        {
          query: `${userQuery} beginner guide`,
          target_source: 'youtube',
          reasoning: 'Beginner-friendly tutorial'
        },
        {
          query: `${userQuery} how to`,
          target_source: 'youtube',
          reasoning: 'Step-by-step instructions'
        }
      ],
      safety_notes: 'Using generic fallback expansion',
      suggested_filters: {
        price_max: null,
        location_required: false,
        requires_supervision: false
      }
    };
  }

  getFallbackResults(query) {
    const expandedQuery = this.getFallbackExpansion(query);
    return {
      query,
      expandedQuery,
      totalResults: 0,
      results: [],
      grouped: { build: [], buy: [], watch: [] },
      metadata: {
        isFallback: true,
        message: 'Using safe fallback content while AI services are unavailable',
        traceId: null,
        processingTime: 0,
        stats: {
          totalRequests: 0,
          cachedHits: 0,
          totalTokens: 0,
          errors: 0,
          cacheHitRate: 0,
          averageTokensPerRequest: 0,
          estimatedCost: 0,
          optimizationRecommendations: []
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  FallbackHandler
};