const crypto = require('crypto');
const { deepseekConfig } = require('../config/deepseek-config');
const { DeepSeekCache } = require('./deepseek-cache');
const { RateLimiter } = require('./rate-limiter');
const { PromptTemplates } = require('./prompt-templates');
const { SafetyValidator } = require('./safety-validator');
const { FallbackHandler } = require('./fallback-handler');
const { CostOptimizer } = require('./cost-optimizer');

class DeepSeekClient {
  constructor() {
    this.config = deepseekConfig;
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.cache = new DeepSeekCache(this.config.cache);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.promptTemplates = new PromptTemplates();
    this.safetyValidator = new SafetyValidator();
    this.fallbackHandler = new FallbackHandler();
    this.costOptimizer = new CostOptimizer();
    this.stats = {
      totalRequests: 0,
      cachedHits: 0,
      totalTokens: 0,
      errors: 0,
      lastEstimatedCost: 0
    };
    this.lastTokenUsage = 0;
  }

  async callAPI(messages, options = {}) {
    this.stats.totalRequests += 1;
    const cacheKey = this.generateCacheKey(messages, options);

    if (this.config.cache.enabled) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.stats.cachedHits += 1;
        return cached;
      }
    }

    const release = await this.rateLimiter.waitForSlot();
    const requestBody = {
      model: options.model || this.config.model,
      messages,
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature ?? this.config.temperature,
      response_format: options.responseFormat || { type: 'json_object' }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.usage) {
        this.stats.totalTokens += data.usage.total_tokens || 0;
        this.stats.lastEstimatedCost = this.costOptimizer.estimateCost(data.usage.total_tokens || 0);
        this.lastTokenUsage = data.usage.total_tokens || 0;
      }

      if (this.config.cache.enabled) {
        await this.cache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      this.stats.errors += 1;
      console.error('DeepSeek API call failed:', error.message);
      throw error;
    } finally {
      release();
    }
  }

  generateCacheKey(messages, options) {
    return crypto.createHash('sha256').update(JSON.stringify({ messages, options })).digest('hex');
  }

  async expandQuery(userQuery) {
    if (!this.config.apiKey) {
      return this.fallbackHandler.getFallbackExpansion(userQuery);
    }

    const messages = [
      { role: 'system', content: this.promptTemplates.getSystemPrompt('query_expander') },
      { role: 'user', content: this.promptTemplates.buildQueryExpansionPrompt(userQuery) }
    ];

    try {
      const response = await this.callAPI(messages, {
        temperature: 0.3,
        responseFormat: { type: 'json_object' }
      });

      const parsed = this.safeParseJSON(response.choices?.[0]?.message?.content);
      return this.safetyValidator.validateQueryExpansion(parsed);
    } catch (error) {
      console.error('DeepSeek expandQuery failed:', error.message);
      return this.fallbackHandler.getFallbackExpansion(userQuery);
    }
  }

  async evaluateContentBatch(items) {
    if (!items || items.length === 0) {
      return [];
    }

    if (!this.config.apiKey) {
      return items.map((item) => ({
        ...item,
        safety_score: item.safety_score ?? 0.8,
        relevance_score: item.relevance_score ?? 0.6,
        educational_score: item.educational_score ?? 0.7,
        summary: item.summary || item.description || item.title
      }));
    }

    const batchSize = this.getAdaptiveBatchSize();
    const batches = [];
    for (let index = 0; index < items.length; index += batchSize) {
      batches.push(items.slice(index, index + batchSize));
    }

    const allResults = [];
    for (const batch of batches) {
      const batchResults = await this.evaluateSingleBatch(batch);
      allResults.push(...batchResults);
    }

    return allResults;
  }

  async evaluateSingleBatch(items) {
    const messages = [
      { role: 'system', content: this.promptTemplates.getSystemPrompt('content_evaluator') },
      { role: 'user', content: this.promptTemplates.buildContentEvaluationPrompt(items) }
    ];

    try {
      const response = await this.callAPI(messages, {
        temperature: 0.2,
        maxTokens: 4096,
        responseFormat: { type: 'json_object' }
      });

      const evaluations = this.safeParseJSON(response.choices?.[0]?.message?.content);
      const list = Array.isArray(evaluations) ? evaluations : evaluations.items || evaluations.results || [];

      return items.map((item) => {
        const evaluation = list.find((entry) => entry.id === item.id);
        if (!evaluation) {
          return item;
        }

        return {
          ...item,
          ...this.safetyValidator.validateContentEvaluation(evaluation)
        };
      });
    } catch (error) {
      console.error('DeepSeek evaluation failed:', error.message);
      return items.map((item) => ({
        ...item,
        safety_score: item.safety_score ?? 0.7,
        relevance_score: item.relevance_score ?? 0.5,
        educational_score: item.educational_score ?? 0.5,
        summary: item.summary || item.description || item.title
      }));
    }
  }

  async generateBuilderRecommendation(project, availableParts, budget) {
    const messages = [
      { role: 'system', content: this.promptTemplates.getSystemPrompt('builder_assistant') },
      { role: 'user', content: this.promptTemplates.buildBuilderPrompt(project, availableParts, budget) }
    ];

    const response = await this.callAPI(messages, {
      temperature: 0.4,
      maxTokens: 2048,
      responseFormat: { type: 'json_object' }
    });

    return this.safeParseJSON(response.choices?.[0]?.message?.content);
  }

  safeParseJSON(str) {
    try {
      let cleaned = String(str || '').trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      return JSON.parse(cleaned);
    } catch {
      return this.getFallbackResponse();
    }
  }

  getFallbackResponse() {
    return {
      intent: 'mixed',
      expanded_queries: [],
      safety_notes: 'Failed to parse AI response',
      suggested_filters: {}
    };
  }

  getAdaptiveBatchSize() {
    const averageTokens = this.stats.totalRequests > 0
      ? this.stats.totalTokens / this.stats.totalRequests
      : 0;

    if (averageTokens > 3000) {
      return Math.max(5, Math.floor((this.config.batchSize || 20) / 2));
    }

    return this.config.batchSize || 20;
  }

  getStats() {
    const baseStats = {
      ...this.stats,
      cacheHitRate: this.stats.cachedHits / (this.stats.totalRequests || 1),
      averageTokensPerRequest: this.stats.totalTokens / (this.stats.totalRequests || 1)
    };

    return {
      ...baseStats,
      estimatedCost: this.costOptimizer.estimateCost(this.stats.totalTokens),
      optimizationRecommendations: this.costOptimizer.getOptimizationRecommendations(baseStats),
      adaptiveBatchSize: this.getAdaptiveBatchSize()
    };
  }
}

module.exports = {
  DeepSeekClient
};