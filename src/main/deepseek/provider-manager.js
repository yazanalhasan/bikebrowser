const fs = require('fs');
const path = require('path');
const { deepseekConfig } = require('../config/deepseek-config');
const { DeepSeekClient } = require('./deepseek-client');
const { FallbackHandler } = require('./fallback-handler');
const { CostOptimizer } = require('./cost-optimizer');
const { NetworkHealthMonitor } = require('./network-health-monitor');
const { DeepSeekProvider } = require('./providers/deepseek-provider');
const { ThauraProvider } = require('./providers/thaura-provider');
const { OpenAIProvider } = require('./providers/openai-provider');
const { LocalProvider } = require('./providers/local-provider');
const { createTaskSchema, validateJSON } = require('./provider-utils');

class ProviderManager {
  constructor() {
    this.config = deepseekConfig;
    this.deepseekClient = new DeepSeekClient();
    this.fallbackHandler = new FallbackHandler();
    this.costOptimizer = new CostOptimizer();
    this.networkHealth = new NetworkHealthMonitor({
      failureThreshold: this.config.orchestration.healthFailureThreshold,
      cooldownMs: this.config.orchestration.healthCooldownMs
    });
    this.cache = this.deepseekClient.cache;
    this.budgetFilePath = path.join(
      process.env.HOME || process.env.USERPROFILE || process.cwd(),
      '.kid-safe-browser',
      'cost-budget.json'
    );
    this.costBudget = this.loadBudget();
    this.stats = {
      totalRequests: 0,
      cachedHits: 0,
      totalTokens: 0,
      errors: 0,
      lastEstimatedCost: 0,
      currentProvider: 'fallback',
      budgetStatus: 'ok',
      providerUsage: {
        deepseek: 0,
        thaura: 0,
        openai: 0,
        local: 0,
        fallback: 0,
        offline: 0,
        cache: 0
      },
      providerMetrics: {
        deepseek: this.createProviderMetric(),
        thaura: this.createProviderMetric(),
        openai: this.createProviderMetric(),
        local: this.createProviderMetric(),
        fallback: this.createProviderMetric(),
        offline: this.createProviderMetric(),
        cache: this.createProviderMetric()
      }
    };
    this.providers = {
      deepseek: new DeepSeekProvider(this.deepseekClient, this.config),
      thaura: new ThauraProvider(this.config.providers.thaura),
      openai: new OpenAIProvider(this.config.providers.openai),
      local: new LocalProvider(this.config.providers.local || {}),
    };
  }

  createProviderMetric() {
    return {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      avgLatency: 0,
      totalConfidence: 0,
      avgConfidence: 0,
      costEstimate: 0,
      skipped: 0,
      lastFailureReason: null
    };
  }

  loadBudget() {
    const defaultBudget = {
      daily: 1,
      weekly: 5,
      monthly: 20,
      currentDaily: 0,
      currentWeekly: 0,
      currentMonthly: 0,
      lastResetDaily: Date.now(),
      lastResetWeekly: Date.now(),
      lastResetMonthly: Date.now()
    };

    try {
      const dir = path.dirname(this.budgetFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(this.budgetFilePath)) {
        return defaultBudget;
      }

      const raw = JSON.parse(fs.readFileSync(this.budgetFilePath, 'utf8'));
      return { ...defaultBudget, ...raw };
    } catch (error) {
      console.warn('[ProviderManager] Failed to load budget state:', error.message);
      return defaultBudget;
    }
  }

  saveBudget() {
    try {
      fs.writeFileSync(this.budgetFilePath, JSON.stringify(this.costBudget, null, 2), 'utf8');
    } catch (error) {
      console.warn('[ProviderManager] Failed to persist budget state:', error.message);
    }
  }

  resetBudgetsIfNeeded() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    if (now - this.costBudget.lastResetDaily > dayMs) {
      this.costBudget.currentDaily = 0;
      this.costBudget.lastResetDaily = now;
    }
    if (now - this.costBudget.lastResetWeekly > weekMs) {
      this.costBudget.currentWeekly = 0;
      this.costBudget.lastResetWeekly = now;
    }
    if (now - this.costBudget.lastResetMonthly > monthMs) {
      this.costBudget.currentMonthly = 0;
      this.costBudget.lastResetMonthly = now;
    }
  }

  hasBudgetForCost(cost) {
    this.resetBudgetsIfNeeded();
    return (
      this.costBudget.currentDaily + cost <= this.costBudget.daily &&
      this.costBudget.currentWeekly + cost <= this.costBudget.weekly &&
      this.costBudget.currentMonthly + cost <= this.costBudget.monthly
    );
  }

  trackCost(providerName, cost) {
    this.costBudget.currentDaily += cost;
    this.costBudget.currentWeekly += cost;
    this.costBudget.currentMonthly += cost;
    this.stats.providerMetrics[providerName].costEstimate += cost;
    this.stats.lastEstimatedCost = cost;
    this.saveBudget();
  }

  updateBudgetStatus() {
    const monthlyRemaining = this.costBudget.monthly - this.costBudget.currentMonthly;
    if (monthlyRemaining <= 0.1) {
      this.stats.budgetStatus = 'exhausted';
      return;
    }
    if (monthlyRemaining <= this.costBudget.monthly * 0.1) {
      this.stats.budgetStatus = 'warning';
      return;
    }
    this.stats.budgetStatus = 'ok';
  }

  incrementProvider(providerName) {
    this.stats.currentProvider = providerName;
    this.stats.providerUsage[providerName] = (this.stats.providerUsage[providerName] || 0) + 1;
  }

  getBudgetStatus() {
    this.updateBudgetStatus();
    return {
      daily: {
        used: this.costBudget.currentDaily,
        limit: this.costBudget.daily,
        remaining: this.costBudget.daily - this.costBudget.currentDaily
      },
      weekly: {
        used: this.costBudget.currentWeekly,
        limit: this.costBudget.weekly,
        remaining: this.costBudget.weekly - this.costBudget.currentWeekly
      },
      monthly: {
        used: this.costBudget.currentMonthly,
        limit: this.costBudget.monthly,
        remaining: this.costBudget.monthly - this.costBudget.currentMonthly
      }
    };
  }

  selectProviderChain(taskType) {
    switch (taskType) {
      case 'ux_audit':
        return ['deepseek', 'thaura', 'openai'];
      case 'ux_debug':
        return ['openai', 'thaura', 'deepseek'];
      case 'query_expansion':
        return ['deepseek', 'thaura', 'openai'];
      case 'structured_parsing':
        return ['local', 'thaura', 'openai', 'deepseek'];
      case 'safety_filter':
        return ['thaura', 'openai'];
      case 'ranking':
        return ['deepseek', 'thaura', 'openai'];
      case 'high_confidence':
        return ['openai', 'thaura', 'deepseek'];
      case 'npc_dialogue':
        return ['local', 'thaura', 'openai', 'deepseek'];
      default:
        return ['deepseek', 'thaura', 'openai'];
    }
  }

  resolveProviderChain(taskType, metadata = {}) {
    const base = this.selectProviderChain(taskType);
    const preferredRaw = String(metadata?.preferredProvider || metadata?.providerPreference || '').toLowerCase();
    const preferred = preferredRaw === 'thura' ? 'thaura' : preferredRaw;

    if (!preferred || !this.providers[preferred]) {
      return base;
    }

    return [preferred, ...base.filter((name) => name !== preferred)];
  }

  shouldUseExpensiveProvider(providerName, context = {}) {
    if (providerName !== 'openai') {
      return true;
    }

    return ['high_confidence', 'ux_debug'].includes(context.taskType) || (context.previousFailures || 0) > 0;
  }

  buildCacheKey(taskType, prompt, expectedFormat, metadata = {}) {
    return this.deepseekClient.generateCacheKey([
      { role: 'system', content: taskType },
      { role: 'user', content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
    ], {
      expectedFormat,
      schema: metadata.schema || null,
      itemCount: metadata.items?.length || 0
    });
  }

  recordProviderAttempt(providerName, result, success) {
    const metric = this.stats.providerMetrics[providerName];
    metric.requests += 1;
    metric.totalLatency += result.latency || 0;
    metric.avgLatency = metric.totalLatency / metric.requests;
    metric.totalConfidence += result.confidence || 0;
    metric.avgConfidence = metric.totalConfidence / metric.requests;
    if (success) {
      metric.successes += 1;
    } else {
      metric.failures += 1;
      metric.lastFailureReason = result.failureReason || result.error || 'unknown';
    }
  }

  recordProviderSkip(providerName, reason) {
    const metric = this.stats.providerMetrics[providerName];
    metric.skipped += 1;
    metric.lastFailureReason = reason;
  }

  estimateRequestCost(providerName, prompt) {
    const estimatedTokens = Math.max(1, Math.ceil(String(typeof prompt === 'string' ? prompt : JSON.stringify(prompt)).length / 4));
    const multiplier = providerName === 'openai' ? 5 : providerName === 'thaura' ? 2 : 1;
    return this.costOptimizer.estimateCost(estimatedTokens) * multiplier;
  }

  async executeWithOrchestration({ taskType, prompt, expectedFormat = 'text', metadata = {} }) {
    this.stats.totalRequests += 1;
    this.updateBudgetStatus();
    const providerChain = this.resolveProviderChain(taskType, metadata);
    const cacheKey = this.buildCacheKey(taskType, prompt, expectedFormat, metadata);
    const schema = createTaskSchema(taskType, metadata);
    let previousFailures = 0;

    // Per-provider timeout: 8s default, shorter for safety_filter since it's called per-result
    const perProviderTimeout = taskType === 'safety_filter' ? 4000 : 8000;

    for (const providerName of providerChain) {
      const provider = this.providers[providerName];
      if (!provider) {
        continue;
      }

      if (this.networkHealth.shouldUseFallback(providerName)) {
        this.recordProviderSkip(providerName, 'unhealthy');
        continue;
      }

      if (!this.shouldUseExpensiveProvider(providerName, { taskType, previousFailures, metadata })) {
        this.recordProviderSkip(providerName, 'cost_control');
        continue;
      }

      if (!(await provider.healthCheck())) {
        if (providerName === 'local') {
          console.log('[AI] ✗ local provider health check failed — is LM Studio running?');
        }
        const failed = {
          success: false,
          data: null,
          error: `${providerName} not configured`,
          latency: 0,
          confidence: 0,
          provider: providerName,
          failureReason: 'network_error'
        };
        this.recordProviderAttempt(providerName, failed, false);
        this.networkHealth.recordFailure(providerName, 'network_error');
        previousFailures += 1;
        continue;
      }

      const estimatedCost = this.estimateRequestCost(providerName, prompt);
      if (providerName !== 'fallback' && !this.hasBudgetForCost(estimatedCost)) {
        this.recordProviderSkip(providerName, 'budget_exhausted');
        continue;
      }

      let result;
      try {
        result = await Promise.race([
          provider.generate({ prompt, taskType, expectedFormat, metadata }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${providerName} timed out after ${perProviderTimeout}ms`)), perProviderTimeout)
          )
        ]);
      } catch (timeoutErr) {
        result = {
          success: false,
          data: null,
          error: timeoutErr.message,
          latency: perProviderTimeout,
          confidence: 0,
          provider: providerName,
          failureReason: 'timeout'
        };
      }
      this.recordProviderAttempt(providerName, result, Boolean(result.success));

      if (!result.success) {
        this.stats.errors += 1;
        this.networkHealth.recordFailure(providerName, result.failureReason || 'network_error');
        previousFailures += 1;
        continue;
      }

      if (expectedFormat === 'json') {
        const validation = validateJSON(result.data, schema);
        if (!validation.valid) {
          this.stats.errors += 1;
          this.networkHealth.recordFailure(providerName, 'parse_error');
          previousFailures += 1;
          continue;
        }
        result.data = validation.data;
      }

      if ((result.confidence || 0) < this.config.orchestration.confidenceThreshold) {
        result.failureReason = 'low_confidence';
        this.stats.errors += 1;
        this.networkHealth.recordFailure(providerName, 'low_confidence');
        previousFailures += 1;
        continue;
      }

      console.log(`[AI] ✓ ${providerName} responded (${result.latency || 0}ms, task: ${taskType})`);
      this.networkHealth.recordSuccess(providerName);
      this.incrementProvider(providerName);
      this.trackCost(providerName, estimatedCost);
      this.stats.totalTokens = this.deepseekClient.stats.totalTokens;

      const payload = {
        ...result,
        providerUsed: providerName,
        fallbackChain: providerChain
      };
      await this.cache.set(cacheKey, payload);
      return payload;
    }

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.incrementProvider('cache');
      this.stats.cachedHits += 1;
      this.recordProviderAttempt('cache', {
        latency: 0,
        confidence: cached.confidence || 0.5,
        failureReason: null
      }, true);
      return {
        ...cached,
        providerUsed: 'cache',
        provider: 'cache',
        fallbackChain: providerChain
      };
    }

    const minimal = this.getMinimalFallback(taskType, prompt, metadata);
    if (minimal !== null) {
      this.incrementProvider('fallback');
      this.recordProviderAttempt('fallback', {
        latency: 0,
        confidence: 0.35,
        failureReason: 'all_failed'
      }, true);
      return {
        success: true,
        data: minimal,
        error: null,
        latency: 0,
        confidence: 0.35,
        provider: 'fallback',
        providerUsed: 'fallback',
        fallbackChain: providerChain,
        failureReason: 'all_failed'
      };
    }

    this.incrementProvider('offline');
    this.recordProviderAttempt('offline', {
      latency: 0,
      confidence: 0,
      failureReason: 'all_failed'
    }, false);
    return {
      success: false,
      data: {
        message: 'Check your internet connection',
        providerUsed: 'offline'
      },
      error: 'All providers failed',
      latency: 0,
      confidence: 0,
      provider: 'offline',
      providerUsed: 'offline',
      fallbackChain: providerChain,
      failureReason: 'all_failed'
    };
  }

  getMinimalFallback(taskType, prompt, metadata = {}) {
    switch (taskType) {
      case 'query_expansion':
        return this.fallbackHandler.getFallbackExpansion(prompt);
      case 'safety_filter':
        return { safe: true, category: 'unknown', riskScore: 0.25 };
      case 'ranking':
        return (metadata.items || []).map((item) => ({
          id: item.id,
          safety_score: item.safety_score ?? 0.8,
          relevance_score: item.relevance_score ?? 0.6,
          educational_score: item.educational_score ?? 0.5,
          category: item.category || 'watch',
          summary: (item.summary || item.description || item.title || '').slice(0, 100)
        }));
      case 'structured_parsing':
        return metadata.fallbackData || null;
      case 'high_confidence':
        return metadata.fallbackData || null;
      default:
        return null;
    }
  }

  async expandQuery(userQuery) {
    const result = await this.executeWithOrchestration({
      taskType: 'query_expansion',
      prompt: userQuery,
      expectedFormat: 'json',
      metadata: { userQuery }
    });

    const expanded = result.data || this.fallbackHandler.getFallbackExpansion(userQuery);
    expanded._provider = result.providerUsed;
    expanded._confidence = result.confidence;
    expanded._fallbackChain = result.fallbackChain;
    return expanded;
  }

  async evaluateContentBatch(items) {
    if (!items || items.length === 0) {
      return [];
    }

    const rankingPrompt = this.deepseekClient.promptTemplates.buildContentEvaluationPrompt(items);
    const result = await this.executeWithOrchestration({
      taskType: 'ranking',
      prompt: rankingPrompt,
      expectedFormat: 'json',
      metadata: { items }
    });

    const evaluations = Array.isArray(result.data) ? result.data : [];
    return items.map((item) => {
      const evaluation = evaluations.find((entry) => entry.id === item.id);
      const merged = evaluation
        ? { ...item, ...this.deepseekClient.safetyValidator.validateContentEvaluation(evaluation) }
        : {
            ...item,
            safety_score: item.safety_score ?? 0.8,
            relevance_score: item.relevance_score ?? 0.6,
            educational_score: item.educational_score ?? 0.5,
            category: item.category || 'watch',
            summary: (item.summary || item.description || item.title || '').substring(0, 100)
          };

      return {
        ...merged,
        _provider: result.providerUsed,
        _confidence: result.confidence,
        _fallbackChain: result.fallbackChain
      };
    });
  }

  async generateBuilderRecommendation(project, availableParts, budget) {
    const prompt = this.deepseekClient.promptTemplates.buildBuilderPrompt(project, availableParts, budget);
    const result = await this.executeWithOrchestration({
      taskType: 'high_confidence',
      prompt,
      expectedFormat: 'json',
      metadata: {
        fallbackData: {
          suggested_build: {
            name: project,
            difficulty: 'medium',
            estimated_time: 'Ask a parent to help estimate time',
            components: [],
            total_estimated: budget || 0,
            tips: ['Start with a simple, safe version of the project.'],
            safety_warnings: ['Adult supervision recommended for tools and batteries.'],
            next_steps: ['Review the project plan with a parent or teacher.']
          },
          alternative_approaches: ['Try a smaller cardboard or model build first.'],
          questions_to_ask_parent: ['What tools are safe to use for this project?']
        }
      }
    });

    return result.data;
  }

  async analyzeImage(base64Image, systemPrompt) {
    const prompt = [
      systemPrompt || 'Identify the bike part in this image. Return JSON.',
      '\n[Image data provided as base64]'
    ].join('\n');

    const result = await this.executeWithOrchestration({
      taskType: 'structured_parsing',
      prompt,
      expectedFormat: 'json',
      metadata: {
        imageBase64: base64Image,
        fallbackData: {
          type: 'bike_part',
          category: 'unknown',
          attributes: {},
          confidence: 0,
          description: 'Image analysis not available',
          search_terms: []
        }
      }
    });

    return result;
  }

  async compareItems(itemA, itemB) {
    const prompt = `Compare these two bike parts for a child's bike build project.

ITEM A:
- Title: ${itemA.title || 'Unknown'}
- Category: ${itemA.category || 'Unknown'}
- Brand: ${itemA.attributes?.brand || itemA.brand || 'Unknown'}
- Price: ${itemA.price || 'Unknown'}
- Source: ${itemA.source || 'Unknown'}

ITEM B:
- Title: ${itemB.title || 'Unknown'}
- Category: ${itemB.category || 'Unknown'}
- Brand: ${itemB.attributes?.brand || itemB.brand || 'Unknown'}
- Price: ${itemB.price || 'Unknown'}
- Source: ${itemB.source || 'Unknown'}

OUTPUT FORMAT (JSON only):
{
  "better_choice": "A" or "B",
  "reason": "child-friendly explanation",
  "compatibility_score": 0.0-1.0,
  "safety_notes": ""
}`;

    const result = await this.executeWithOrchestration({
      taskType: 'high_confidence',
      prompt,
      expectedFormat: 'json',
      metadata: {
        fallbackData: {
          better_choice: 'A',
          reason: 'Unable to compare — both options may work',
          compatibility_score: 0.5,
          safety_notes: 'Ask a parent to help you decide'
        }
      }
    });

    const data = result.data || {};
    return {
      better_choice: data.better_choice === 'B' ? itemB : itemA,
      reason: data.reason || '',
      compatibility_score: Math.min(1, Math.max(0, Number(data.compatibility_score) || 0.5)),
      safety_notes: data.safety_notes || ''
    };
  }

  getProviderStatus() {
    return {
      providers: Object.fromEntries(
        Object.entries(this.providers).map(([name, provider]) => [name, {
          configured: Boolean(this.config.providers[name]?.valid),
          name: provider.getName()
        }])
      ),
      networkHealth: this.networkHealth.getStatus(),
      budgetStatus: this.stats.budgetStatus,
      currentProvider: this.stats.currentProvider
    };
  }

  getStats() {
    const baseStats = this.deepseekClient.getStats();
    return {
      ...baseStats,
      totalRequests: this.stats.totalRequests,
      cachedHits: this.stats.cachedHits + baseStats.cachedHits,
      totalTokens: this.deepseekClient.stats.totalTokens,
      errors: this.stats.errors + baseStats.errors,
      lastEstimatedCost: this.stats.lastEstimatedCost,
      currentProvider: this.stats.currentProvider,
      providerUsage: { ...this.stats.providerUsage },
      providerMetrics: { ...this.stats.providerMetrics },
      budgetStatus: this.stats.budgetStatus,
      budget: this.getBudgetStatus(),
      networkHealth: this.networkHealth.getStatus()
    };
  }
}

module.exports = {
  ProviderManager
};