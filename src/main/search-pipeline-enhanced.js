const { deepseekConfig } = require('./config/deepseek-config');
const { CostAwareClient } = require('./deepseek/cost-aware-client');
const { FallbackHandler } = require('./deepseek/fallback-handler');
const { SourceRegistry } = require('./sources/source-registry');
const { SafetyFilter } = require('./safety-filter');
const { ShoppingSafetyFilter } = require('./filters/shopping-safety-filter');
const { PerformanceMonitor } = require('./performance-monitor');
const { ImageToQuery } = require('../pipeline/image-to-query');
const { VoiceToQuery } = require('../pipeline/voice-to-query');
const { SimilarityEngine } = require('../pipeline/similarity-engine');
const { applyLearnedSuppression, applyCompatibilityHints } = require('../server/ranking-utils');
const { perfProfile } = require('./config/perf-profile');
const { QUALITY_PRESETS, scoreQualityFit } = require('../shared/videoQualitySources');

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
    this.imageToQuery = new ImageToQuery(this.providerManager);
    this.voiceToQuery = new VoiceToQuery(this.providerManager);
    this.similarityEngine = new SimilarityEngine();
    this.historyStore = null; // Set externally via setHistoryStore()
    this.concurrency = perfProfile.maxConcurrentSourceFetches;
    this.stages = {
      queryExpansion: true,
      parallelFetch: true,
      preFiltering: true,
      aiEvaluation: true,
      ranking: true,
      postProcessing: true
    };
  }

  setHistoryStore(historyStore) {
    this.historyStore = historyStore;
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
          const ranked = this.rankResults(preFiltered, userQuery);
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
      const timing = {};

      // ── Stage 1: Query expansion ──────────────────────────────────────────
      const t0 = Date.now();
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
      timing.queryExpansionMs = Date.now() - t0;

      // ── Stage 2: Source fetch (concurrency-limited) ───────────────────────
      const t1 = Date.now();
      const rawResults = await this.monitor.measure('parallel_fetch', () => this.fetchFromAllSources(expandedQuery, options, userQuery), traceId);
      timing.sourceFetchMs = Date.now() - t1;

      const shoppingFiltered = this.shoppingSafetyFilter.filter(rawResults, {
        ...options,
        intent: expandedQuery.intent
      });
      const preFiltered = this.stages.preFiltering
        ? await this.monitor.measure('pre_filtering', () => Promise.resolve(this.safetyFilter.preFilter(shoppingFiltered, expandedQuery)), traceId)
        : shoppingFiltered;

      // ── Trim before expensive AI evaluation ───────────────────────────────
      // Sort by whatever raw score is available, then cut.
      let trimmed = preFiltered;
      if (trimmed.length > perfProfile.maxResultsBeforeRanking) {
        trimmed = trimmed
          .slice()
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
          .slice(0, perfProfile.maxResultsBeforeRanking);
      }

      // ── Stage 3: AI safety filter ─────────────────────────────────────────
      const t2 = Date.now();
      const aiSafeResults = trimmed.length > 0
        ? await this.monitor.measure('ai_safety', () =>
            Promise.race([
              this.applyAISafetyFilter(trimmed),
              new Promise((resolve) => setTimeout(() => {
                console.warn('[Search] AI safety filter timed out, using keyword-only filtering');
                resolve(trimmed);
              }, 6000))
            ]), traceId)
        : trimmed;

      // ── Stage 4: AI batch evaluation (capped batch size) ──────────────────
      const evalCandidates = aiSafeResults.slice(0, perfProfile.aiEvalBatchSize * 3);
      const evaluatedResults = this.stages.aiEvaluation && evalCandidates.length > 0 && !skipExpansion
        ? await this.monitor.measure('ai_evaluation', () =>
            Promise.race([
              this.providerManager.evaluateContentBatch(evalCandidates),
              new Promise((resolve) => setTimeout(() => {
                console.warn('[Search] AI evaluation timed out, using raw scores');
                resolve(evalCandidates);
              }, 5000))
            ]), traceId)
        : evalCandidates;
      timing.aiEvaluationMs = Date.now() - t2;

      const safeResults = evaluatedResults.filter((result) =>
        (result.safety_score ?? 0) >= deepseekConfig.safety.minimumSafetyScore &&
        (result.relevance_score ?? 0) >= deepseekConfig.safety.minimumRelevanceScore
      );

      // ── Stage 5: Ranking ──────────────────────────────────────────────────
      const t3 = Date.now();
      let rankedResults = this.rankResults(safeResults, userQuery);
      if (this.stages.ranking) {
        rankedResults = this.applyDeepRanking(rankedResults);
      }

      // Apply learned suppression from user decision history
      rankedResults = applyLearnedSuppression(rankedResults, this.historyStore);

      // Apply compatibility hints from normalized intent (if provided via options)
      if (options._compatibilityHints) {
        rankedResults = applyCompatibilityHints(rankedResults, options._compatibilityHints);
        rankedResults.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));
      }
      timing.rankingMs = Date.now() - t3;

      const finalResults = this.stages.postProcessing
        ? this.postProcessResults(rankedResults, expandedQuery)
        : rankedResults;

      this.monitor.endTrace(traceId, {
        totalResults: finalResults.length,
        expandedQueries: expandedQuery.expanded_queries?.length || 0,
        aiProcessed: evaluatedResults.length
      });

      timing.totalMs = Date.now() - t0;
      console.log('[Search timing]', timing);

      const metadata = {
        traceId,
        processingTime: this.monitor.getTraceDuration(traceId),
        timing,
        stages: this.monitor.getTraceMarks(traceId),
        stats: this.providerManager.getStats(),
        providerStatus: this.providerManager.getProviderStatus()
      };
      this.monitor.clearTrace(traceId);

      return {
        query: userQuery,
        expandedQuery,
        results: finalResults.slice(0, perfProfile.maxFinalResults),
        grouped: this.groupByCategory(finalResults),
        metadata,
        totalResults: finalResults.length,
        timestamp: new Date().toISOString()
      };
  }

  async fetchFromAllSources(expandedQuery, options, userQuery) {
    const sourcesToSearch = this.sourceRegistry.getSourcesForIntent(expandedQuery.intent);
    const timeout = perfProfile.sourceFetchTimeoutMs;
    const concurrency = this.concurrency;
    const cutoff = perfProfile.earlyResultCutoff;

    // Build task list
    const tasks = [];
    for (const source of sourcesToSearch) {
      const sourceQueries = this.getSourceSpecificQueries(expandedQuery, source.name, userQuery);
      if (sourceQueries.length === 0) continue;
      tasks.push({ source, sourceQueries });
    }

    // Concurrency-limited execution with early cutoff
    const allResults = [];
    let i = 0;

    async function runOne(task) {
      try {
        return await Promise.race([
          task.source.manager.search(task.sourceQueries, {
            ...options,
            intent: expandedQuery.intent
          }),
          new Promise((resolve) => setTimeout(() => {
            console.warn(`Source ${task.source.name} timed out after ${timeout}ms`);
            resolve([]);
          }, timeout))
        ]);
      } catch (error) {
        console.error(`Source ${task.source.name} failed:`, error.message || error);
        return [];
      }
    }

    // Launch initial batch
    const active = new Map();
    while (i < tasks.length && active.size < concurrency) {
      const idx = i++;
      active.set(idx, runOne(tasks[idx]));
    }

    // Process as they complete, launch next
    while (active.size > 0) {
      const entries = [...active.entries()];
      const settled = await Promise.race(
        entries.map(([idx, p]) => p.then((r) => ({ idx, results: r })))
      );

      active.delete(settled.idx);
      if (settled.results.length > 0) {
        allResults.push(...settled.results);
      }

      // Early cutoff: if we have enough results, skip remaining sources
      if (allResults.length >= cutoff && i < tasks.length) {
        console.log(`[Search] Early cutoff: ${allResults.length} results from ${settled.idx + 1}/${tasks.length} sources`);
        // Let in-flight requests finish but don't launch new ones
        i = tasks.length;
      }

      // Launch next
      if (i < tasks.length && active.size < concurrency) {
        const idx = i++;
        active.set(idx, runOne(tasks[idx]));
      }
    }

    return allResults;
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

    const baseQueries = matched.length > 0 ? matched : [userQuery];
    if (!['youtube', 'youtubeKids'].includes(sourceName)) {
      return baseQueries;
    }

    return this.addQualitySourceQueries(baseQueries, userQuery);
  }

  addQualitySourceQueries(baseQueries = [], userQuery = '') {
    const normalizedQuery = String(userQuery || baseQueries[0] || '').toLowerCase();
    const qualityQueries = [];

    for (const preset of QUALITY_PRESETS) {
      const idWords = preset.id.split('-');
      const labelWords = preset.label.toLowerCase().split(/\s+/);
      const matchesPreset =
        idWords.some((word) => normalizedQuery.includes(word)) ||
        labelWords.some((word) => normalizedQuery.includes(word));

      if (matchesPreset) {
        qualityQueries.push(preset.query);
      }
    }

    if (/e-?bike|electric bike|controller|battery|motor|conversion/.test(normalizedQuery)) {
      qualityQueries.push(QUALITY_PRESETS.find((preset) => preset.id === 'ebike-power')?.query);
    }
    if (/dirt bike|motorcycle|carburetor|fork seal|top end|engine/.test(normalizedQuery)) {
      qualityQueries.push(QUALITY_PRESETS.find((preset) => preset.id === 'dirt-bike-shop')?.query);
    }
    if (/diagnostic|mosfet|capacitor|wiring|multimeter|electrical/.test(normalizedQuery)) {
      qualityQueries.push(QUALITY_PRESETS.find((preset) => preset.id === 'electrical-diagnostics')?.query);
    }
    if (/repair|maintenance|derailleur|brake|torque|drivetrain/.test(normalizedQuery)) {
      qualityQueries.push(QUALITY_PRESETS.find((preset) => preset.id === 'bike-mechanics')?.query);
    }

    return [...new Set([...baseQueries, ...qualityQueries.filter(Boolean)])].slice(0, 3);
  }

  rankResults(results, query = '') {
    return results
      .map((result) => ({
        ...result,
        compositeScore: this.calculateCompositeScore(result, query)
      }))
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }

  calculateCompositeScore(result, query = '') {
    const curatedBoost = result.sourceMetadata?.is_curated ? 0.1 : 0;
    const relevanceBoost = (result.relevance_score || 0) > 0.8 ? 0.05 : 0;
    const quality = scoreQualityFit(result, query);

    return (
      (result.safety_score * 0.5) +
      (result.relevance_score * 0.3) +
      (result.educational_score * 0.2) +
      curatedBoost +
      relevanceBoost +
      quality.total
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

  // --- History store integration ---

  setHistoryStore(store) {
    this.historyStore = store;
  }

  _recordSearch(inputType, inputData, structuredQuery, results) {
    if (!this.historyStore) return;
    try {
      this.historyStore.saveSearchResult({
        input_type: inputType,
        input_data: inputData,
        structured_query: structuredQuery,
        results_count: results.length,
        top_results: results.slice(0, 10)
      });
    } catch (error) {
      console.warn('[Pipeline] Failed to record search:', error.message);
    }
  }

  // --- Unified pipeline entry ---

  async runSearchPipeline(input) {
    const type = input._inputType || 'text';
    let query = '';
    let searchTerms = [];
    let structuredData = {};

    if (type === 'image') {
      query = (input.search_terms || []).join(' ') || input.description || input.category || '';
      searchTerms = input.search_terms || [];
      structuredData = input;
    } else if (type === 'voice') {
      query = (input.search_terms || []).join(' ') || input.raw_text || '';
      searchTerms = input.search_terms || [];
      structuredData = input;
    } else {
      query = typeof input === 'string' ? input : (input.query || '');
      structuredData = { query };
    }

    if (!query) {
      return { query: '', results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0 };
    }

    // Run the core search
    const result = await this.search(query, input.options || {});

    // Deduplicate
    if (result.results && result.results.length > 0) {
      result.results = this.similarityEngine.deduplicateResults(result.results);
    }

    // Smart filtering: compare items within same category and assign status
    result.results = this._applySmartFiltering(result.results, input.projectContext || null);

    // Re-group after filtering
    result.grouped = this.groupByCategory(result.results);

    // Persist to history
    this._recordSearch(type, { query, searchTerms }, structuredData, result.results);

    // Attach input metadata
    result.inputType = type;
    result.structuredInput = structuredData;

    return result;
  }

  // --- Image input entry ---

  async processImageInput(imageBase64) {
    const structured = await this.imageToQuery.analyze(imageBase64);
    structured._inputType = 'image';
    return this.runSearchPipeline(structured);
  }

  // --- Voice input entry ---

  async processVoiceInput(transcript) {
    const parsed = await this.voiceToQuery.parse(transcript);
    parsed._inputType = 'voice';
    return this.runSearchPipeline(parsed);
  }

  // --- Smart filtering ---

  _applySmartFiltering(results, projectContext) {
    if (!results || results.length === 0) return results;

    // Group by category
    const byCategory = {};
    for (const item of results) {
      const cat = item.category || 'watch';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    }

    const output = [];

    for (const [category, items] of Object.entries(byCategory)) {
      if (items.length === 0) continue;

      // Sort by score within category
      items.sort((a, b) => (b.compositeScore || b.score || 0) - (a.compositeScore || a.score || 0));

      const primary = items[0];
      primary.status = 'primary';
      primary.fade = false;
      output.push(primary);

      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const similarity = this.similarityEngine.scoreSimilarity(primary, item);

        if (similarity > 0.8) {
          // Near-duplicate of primary — skip or mark
          item.status = 'duplicate';
          item.fade = true;
        } else if (projectContext && this._isIncompatible(item, projectContext)) {
          item.status = 'incompatible';
          item.fade = true;
        } else {
          item.status = 'alternative';
          item.fade = false;
        }

        output.push(item);
      }
    }

    // Maintain overall score ordering, primaries first
    return output.sort((a, b) => {
      if (a.status === 'primary' && b.status !== 'primary') return -1;
      if (b.status === 'primary' && a.status !== 'primary') return 1;
      if (a.fade && !b.fade) return 1;
      if (b.fade && !a.fade) return -1;
      return (b.compositeScore || b.score || 0) - (a.compositeScore || a.score || 0);
    });
  }

  _isIncompatible(item, projectContext) {
    if (!projectContext || !projectContext.voltage) return false;
    const itemVoltage = item.attributes?.voltage || '';
    if (itemVoltage && projectContext.voltage && itemVoltage !== projectContext.voltage) return true;
    return false;
  }
}

module.exports = {
  EnhancedSearchPipeline
};
