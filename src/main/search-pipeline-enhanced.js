const { deepseekConfig } = require('./config/deepseek-config');
const { CostAwareClient } = require('./deepseek/cost-aware-client');
const { FallbackHandler } = require('./deepseek/fallback-handler');
const { SourceRegistry } = require('./sources/source-registry');
const { SafetyFilter } = require('./safety-filter');
const { ShoppingSafetyFilter } = require('./filters/shopping-safety-filter');
const { PerformanceMonitor } = require('./performance-monitor');

class EnhancedSearchPipeline {
  constructor(config = {}) {
    this.providerManager = new CostAwareClient();
    this.deepseek = this.providerManager;
    this.sourceRegistry = new SourceRegistry(config);
    this.sources = this.sourceRegistry.managers;
    this.safetyFilter = new SafetyFilter();
    this.shoppingSafetyFilter = new ShoppingSafetyFilter();
    this.monitor = new PerformanceMonitor();
    this.fallbackHandler = new FallbackHandler();
    this.stages = {
      queryExpansion: true,
      parallelFetch: true,
      preFiltering: true,
      aiEvaluation: true,
      ranking: true,
      postProcessing: true
    };
  }

  async search(userQuery, options = {}) {
    const traceId = this.monitor.startTrace('search');
    const SEARCH_TIMEOUT = 15000; // 15s hard cap on entire search

    try {
      const result = await Promise.race([
        this._searchInner(userQuery, options, traceId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Search pipeline timeout')), SEARCH_TIMEOUT)
        )
      ]);
      return result;
    } catch (error) {
      console.error('Search pipeline error:', error.message);
      this.monitor.endTrace(traceId, { error: error.message });
      this.monitor.clearTrace(traceId);

      // Tier 2: Try fetch-only search (no AI) before giving up
      try {
        console.log('[Search] Tier 2: fetch-only fallback (no AI)');
        const expandedQuery = this.fallbackHandler.getFallbackExpansion(userQuery);
        const rawResults = await Promise.race([
          this.fetchFromAllSources(expandedQuery, options, userQuery),
          new Promise((resolve) => setTimeout(() => resolve([]), 10000))
        ]);
        if (rawResults.length > 0) {
          const preFiltered = this.safetyFilter.preFilter(rawResults, expandedQuery);
          const ranked = this.rankResults(preFiltered);
          const finalResults = this.postProcessResults(ranked, expandedQuery);
          return {
            query: userQuery,
            expandedQuery,
            results: finalResults.slice(0, 24),
            grouped: this.groupByCategory(finalResults),
            metadata: { traceId, tier: 'fetch-only', processingTime: this.monitor.getTraceDuration(traceId) },
            totalResults: finalResults.length,
            timestamp: new Date().toISOString()
          };
        }
      } catch (tier2Error) {
        console.error('[Search] Tier 2 also failed:', tier2Error.message);
      }

      // Tier 3: Return static fallback
      console.log('[Search] Tier 3: static fallback');
      return this.fallbackHandler.getFallbackResults(userQuery);
    }
  }

  async _searchInner(userQuery, options, traceId) {
      const skipExpansion = options.skipExpansion === true;

      // Tier 1: Full AI pipeline with per-stage timeouts
      const expandedQuery = (this.stages.queryExpansion && !skipExpansion)
        ? await this.monitor.measure('query_expansion', () =>
            Promise.race([
              this.providerManager.expandQuery(userQuery),
              new Promise((resolve) => setTimeout(() => {
                console.warn('[Search] Query expansion timed out, using fallback');
                resolve(this.fallbackHandler.getFallbackExpansion(userQuery));
              }, 5000))
            ]), traceId)
        : this.fallbackHandler.getFallbackExpansion(userQuery);

      const rawResults = await this.monitor.measure('parallel_fetch', () => this.fetchFromAllSources(expandedQuery, options, userQuery), traceId);
      const shoppingFiltered = this.shoppingSafetyFilter.filter(rawResults, {
        ...options,
        intent: expandedQuery.intent
      });
      const preFiltered = this.stages.preFiltering
        ? await this.monitor.measure('pre_filtering', () => Promise.resolve(this.safetyFilter.preFilter(shoppingFiltered, expandedQuery)), traceId)
        : shoppingFiltered;
      const aiSafeResults = preFiltered.length > 0
        ? await this.monitor.measure('ai_safety', () =>
            Promise.race([
              this.applyAISafetyFilter(preFiltered),
              new Promise((resolve) => setTimeout(() => {
                console.warn('[Search] AI safety filter timed out, using keyword-only filtering');
                resolve(preFiltered);
              }, 6000))
            ]), traceId)
        : preFiltered;

      const evaluatedResults = this.stages.aiEvaluation && aiSafeResults.length > 0 && !skipExpansion
        ? await this.monitor.measure('ai_evaluation', () =>
            Promise.race([
              this.providerManager.evaluateContentBatch(aiSafeResults),
              new Promise((resolve) => setTimeout(() => {
                console.warn('[Search] AI evaluation timed out, using raw scores');
                resolve(aiSafeResults);
              }, 5000))
            ]), traceId)
        : aiSafeResults;

      const safeResults = evaluatedResults.filter((result) =>
        (result.safety_score ?? 0) >= deepseekConfig.safety.minimumSafetyScore &&
        (result.relevance_score ?? 0) >= deepseekConfig.safety.minimumRelevanceScore
      );

      let rankedResults = this.rankResults(safeResults);
      if (this.stages.ranking) {
        rankedResults = this.applyDeepRanking(rankedResults);
      }

      const finalResults = this.stages.postProcessing
        ? this.postProcessResults(rankedResults, expandedQuery)
        : rankedResults;

      this.monitor.endTrace(traceId, {
        totalResults: finalResults.length,
        expandedQueries: expandedQuery.expanded_queries?.length || 0,
        aiProcessed: evaluatedResults.length
      });

      const metadata = {
        traceId,
        processingTime: this.monitor.getTraceDuration(traceId),
        stages: this.monitor.getTraceMarks(traceId),
        stats: this.providerManager.getStats(),
        providerStatus: this.providerManager.getProviderStatus()
      };
      this.monitor.clearTrace(traceId);

      return {
        query: userQuery,
        expandedQuery,
        results: finalResults.slice(0, 24),
        grouped: this.groupByCategory(finalResults),
        metadata,
        totalResults: finalResults.length,
        timestamp: new Date().toISOString()
      };
  }

  async fetchFromAllSources(expandedQuery, options, userQuery) {
    const sourcePromises = [];
    const sourcesToSearch = this.sourceRegistry.getSourcesForIntent(expandedQuery.intent);

    for (const source of sourcesToSearch) {
      const sourceQueries = this.getSourceSpecificQueries(expandedQuery, source.name, userQuery);
      if (sourceQueries.length === 0) {
        continue;
      }

      sourcePromises.push(
        Promise.race([
          source.manager.search(sourceQueries, {
            ...options,
            intent: expandedQuery.intent
          }),
          new Promise((resolve) => setTimeout(() => {
            console.warn(`Source ${source.name} timed out after 10s`);
            resolve([]);
          }, 10000))
        ]).catch((error) => {
          console.error(`Source ${source.name} failed:`, error.message || error);
          return [];
        })
      );
    }

    const results = await Promise.all(sourcePromises);
    return results.flat();
  }

  async applyAISafetyFilter(results) {
    const filtered = [];

    for (const result of results) {
      const safetyPrompt = `Title: ${result.title}\nDescription: ${result.description || ''}\nSource: ${result.source}`;
      const safetyResult = await this.providerManager.executeWithOrchestration({
        taskType: 'safety_filter',
        prompt: safetyPrompt,
        expectedFormat: 'json',
        metadata: {
          fallbackData: { safe: true, category: result.category || 'watch', riskScore: 0.25 }
        }
      });

      const evaluation = safetyResult.data || { safe: true, category: result.category || 'watch', riskScore: 0.25 };
      if (evaluation.safe === false || Number(evaluation.riskScore || 0) > 0.5) {
        continue;
      }

      filtered.push({
        ...result,
        _provider: result._provider || safetyResult.providerUsed,
        _confidence: Math.max(result._confidence || 0, safetyResult.confidence || 0),
        _fallbackChain: result._fallbackChain || safetyResult.fallbackChain,
        sourceMetadata: {
          ...(result.sourceMetadata || {}),
          aiSafety: {
            provider: safetyResult.providerUsed,
            confidence: safetyResult.confidence,
            category: evaluation.category,
            riskScore: evaluation.riskScore
          }
        }
      });
    }

    return filtered;
  }

  getSourceSpecificQueries(expandedQuery, sourceName, userQuery) {
    const source = this.sources[sourceName];
    const aliases = new Set([sourceName, source?.sourceId]);
    const matched = (expandedQuery.expanded_queries || [])
      .filter((entry) => !entry.target_source || aliases.has(entry.target_source))
      .map((entry) => entry.query)
      .filter(Boolean);

    return matched.length > 0 ? matched : [userQuery];
  }

  rankResults(results) {
    return results
      .map((result) => ({
        ...result,
        compositeScore: this.calculateCompositeScore(result)
      }))
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }

  calculateCompositeScore(result) {
    const curatedBoost = result.sourceMetadata?.is_curated ? 0.1 : 0;
    const relevanceBoost = (result.relevance_score || 0) > 0.8 ? 0.05 : 0;
    return (
      (result.safety_score * 0.5) +
      (result.relevance_score * 0.3) +
      (result.educational_score * 0.2) +
      curatedBoost +
      relevanceBoost
    );
  }

  applyDeepRanking(results) {
    return results
      .map((result) => {
        const next = { ...result };
        if (next.flags?.includes('requires_supervision')) {
          next.compositeScore *= 0.95;
        }
        if ((next.educational_score || 0) > 0.8) {
          next.compositeScore *= 1.05;
        }
        return next;
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }

  postProcessResults(results) {
    return results.map((result) => {
      const next = { ...result };
      if (next.requires_supervision || this.determineIfNeedsSupervision(next)) {
        next.summary = `👨‍👩‍👧 ${next.summary || next.title} (Ask a parent for help!)`;
      }
      if (this.shoppingSafetyFilter.isShoppingResult(next) && next.sourceMetadata?.shoppingWarnings?.length > 0) {
        next.summary = `${next.sourceMetadata.shoppingWarnings[0]} ${next.summary || next.title}`.trim();
      }
      if (!next.suggested_age_range) {
        next.suggested_age_range = this.suggestAgeRange(next);
      }
      if (!next._provider) {
        next._provider = 'fallback';
      }
      return next;
    });
  }

  determineIfNeedsSupervision(result) {
    const keywords = ['solder', 'welding', 'cut', 'drill', 'battery', 'lithium', 'sharp', 'glue gun'];
    const content = `${result.title} ${result.description || ''}`.toLowerCase();
    return keywords.some((keyword) => content.includes(keyword));
  }

  suggestAgeRange(result) {
    if ((result.educational_score || 0) > 0.8 && result.sourceMetadata?.difficulty === 'easy') {
      return '8-10';
    }
    if (result.sourceMetadata?.difficulty === 'medium' || result.requires_supervision) {
      return '10-12';
    }
    return '8-12';
  }

  groupByCategory(results = []) {
    return {
      build: results.filter((result) => result.category === 'build'),
      buy: results.filter((result) => result.category === 'buy'),
      watch: results.filter((result) => result.category === 'watch')
    };
  }
}

module.exports = {
  EnhancedSearchPipeline
};