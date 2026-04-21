/**
 * MCP AI Adapter — wraps the existing AI pipeline for MCP integration.
 *
 * Uses the REAL pipeline:
 *   window.api.ai.orchestrate() → IPC → computeOrchestrator → provider chain
 *
 * Does NOT create a second AI stack. Reuses everything from npcAiClient
 * and the provider manager.
 *
 * Features:
 *   - Per-type cooldowns (no spam)
 *   - Request deduplication (no identical in-flight requests)
 *   - Response caching (same state = same response)
 *   - Structured JSON contract enforcement
 *   - Deterministic fallback on any failure
 *   - Debug/observability hooks
 */

import {
  buildFailurePrompt, buildHintPrompt, buildLanguagePrompt,
  buildNPCPrompt, buildQuestPrompt, buildQuizQuestionPrompt,
} from './aiPromptBuilders.js';
import {
  fallbackFailureAnalysis, fallbackGameplayHint, fallbackLanguageReinforcement,
  fallbackNPCDialogue, fallbackQuestGuidance, fallbackQuizQuestion,
} from './aiFallbacks.js';
import {
  checkTrigger, generateDeterministicQuest, buildQuestGenerationPrompt,
} from './questGenerator.js';

// ── Per-type cooldowns ───────────────────────────────────────────────────────

const COOLDOWNS = {
  failure_analysis: 5000,
  gameplay_hint: 4000,
  language_reinforcement: 3000,
  npc_context_dialogue: 2000,
  quest_guidance: 4000,
  quiz_question: 3000,
};

// ── MCPAIAdapter Class ───────────────────────────────────────────────────────

export default class MCPAIAdapter {
  constructor() {
    this.mcp = null;
    this.lastCallAt = new Map();   // type → timestamp
    this.inFlight = new Map();     // requestKey → Promise
    this.cache = new Map();        // requestKey → { data, time }
    this.cacheTTL = 60000;         // 1 minute
    this.maxCache = 50;
    this.results = [];             // last N results for debug
    this.maxResults = 20;

    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      aiCalls: 0,
      fallbackCalls: 0,
      errors: 0,
      lastProvider: null,
      lastLatency: 0,
    };
  }

  /** Called by MCP on registration. */
  setMCP(mcp) {
    this.mcp = mcp;
    this._wireEvents(mcp);
  }

  /** Called by MCP for debug snapshots. */
  getSnapshot() {
    return {
      registered: true,
      cacheSize: this.cache.size,
      inFlightCount: this.inFlight.size,
      stats: { ...this.stats },
      lastResults: this.results.slice(-5).map((r) => ({
        type: r.type,
        source: r.source,
        latency: r.latency,
        timestamp: r.timestamp,
      })),
    };
  }

  // ── Core Request Method ────────────────────────────────────────────────────

  /**
   * Send a typed AI request through the existing pipeline.
   * Enforces cooldowns, deduplication, caching, and fallback.
   *
   * @param {string} type - request type
   * @param {object} payload - real game state data
   * @returns {Promise<object>} structured response
   */
  async request(type, payload) {
    this.stats.totalRequests++;
    const now = Date.now();

    // Cooldown check
    const cooldown = COOLDOWNS[type] || 4000;
    const lastCall = this.lastCallAt.get(type) || 0;
    if (now - lastCall < cooldown) {
      return this._getFallback(type, payload);
    }

    // Cache check
    const key = this._requestKey(type, payload);
    const cached = this._getCache(key);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    // Dedup: if same request is already in flight, return fallback
    if (this.inFlight.has(key)) {
      return this._getFallback(type, payload);
    }

    // Check if AI pipeline is available
    if (!window?.api?.ai?.orchestrate) {
      this.stats.fallbackCalls++;
      return this._getFallback(type, payload);
    }

    // Build prompt from real data
    const prompt = this._buildPrompt(type, payload);
    const fallback = this._getFallback(type, payload);

    // Mark in-flight
    this.lastCallAt.set(type, now);
    const requestPromise = this._executeAICall(type, prompt, fallback, key, now);
    this.inFlight.set(key, requestPromise);

    try {
      return await requestPromise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  // ── Typed Request Methods ──────────────────────────────────────────────────

  async explainFailure(payload) {
    return this.request('failure_analysis', payload);
  }

  async generateHint(payload) {
    return this.request('gameplay_hint', payload);
  }

  async reinforceLanguage(payload) {
    return this.request('language_reinforcement', payload);
  }

  async adaptNPCDialogue(payload) {
    return this.request('npc_context_dialogue', payload);
  }

  async guideQuest(payload) {
    return this.request('quest_guidance', payload);
  }

  /**
   * Generate a standards-aligned quiz question using AI, falling back
   * to the curated question bank.
   *
   * @param {object} payload
   * @param {string} [payload.band] - difficulty band
   * @param {number} [payload.tier] - explicit tier (1–4)
   * @param {string} [payload.topic] - preferred math topic
   * @param {object} [payload.gameContext] - quest, biome, items, activity
   * @returns {Promise<object>} question with choices, explanation, concept
   */
  async generateQuizQuestion(payload) {
    const result = await this.request('quiz_question', payload);
    // Validate AI response structure
    if (result.source === 'ai') {
      const { validateAIQuestion } = await import('../education/quizQuestionGenerator.js');
      const validated = validateAIQuestion(result);
      if (validated) return validated;
      // AI returned garbage — fall back
      return this._getFallback('quiz_question', payload);
    }
    return result;
  }

  /**
   * Check if a dynamic quest should be generated and create it.
   * Uses deterministic templates with optional AI text enrichment.
   */
  async tryGenerateQuest(trigger, eventPayload = {}) {
    if (!this.mcp) return null;
    const mcpState = this.mcp.getState();
    const check = checkTrigger(trigger, mcpState, eventPayload);
    if (!check?.shouldGenerate) return null;

    // Generate deterministic quest (always works)
    const quest = generateDeterministicQuest(check.questType, check.context, mcpState);
    this.mcp.emit('DYNAMIC_QUEST_GENERATED', quest);
    return quest;
  }

  // ── AI Pipeline Call ───────────────────────────────────────────────────────

  async _executeAICall(type, prompt, fallback, cacheKey, startTime) {
    this.stats.aiCalls++;

    try {
      const result = await Promise.race([
        window.api.ai.orchestrate({
          taskType: 'npc_dialogue',
          prompt,
          expectedFormat: 'json',
          metadata: {
            workloadTaskType: 'npc_dialogue_generation',
            allowLocalGpu: true,
            allowRemote: true,
            allowFallback: true,
            latencyBudgetMs: 5000,
            fallbackData: fallback,
            maxTokens: 200,
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 5000)),
      ]);

      const latency = Date.now() - startTime;
      this.stats.lastLatency = latency;
      this.stats.lastProvider = result?.providerUsed || 'unknown';

      if (result?.success && result.data) {
        const parsed = typeof result.data === 'string' ? this._safeParseJSON(result.data) : result.data;

        if (parsed && typeof parsed === 'object') {
          const response = { ...fallback, ...parsed, source: 'ai', provider: result.providerUsed, latency };
          this._setCache(cacheKey, response);
          this._recordResult(type, response, latency);
          return response;
        }
      }

      // AI returned but no valid data — use fallback
      this.stats.fallbackCalls++;
      this._recordResult(type, fallback, Date.now() - startTime);
      return fallback;

    } catch (err) {
      this.stats.errors++;
      this.stats.fallbackCalls++;
      this._recordResult(type, { ...fallback, error: err.message }, Date.now() - startTime);
      return fallback;
    }
  }

  // ── MCP Event Wiring ───────────────────────────────────────────────────────

  _wireEvents(mcp) {
    // Failure events → AI analysis
    mcp.on('FAILURE_DETECTED', async (payload) => {
      const result = await this.explainFailure(payload);
      mcp.emit('AI_FAILURE_EXPLAINED', result);
    });

    // Low health → AI hint
    mcp.on('PLAYER_LOW_HEALTH', async (payload) => {
      const state = mcp.getState();
      const result = await this.generateHint({
        player: state.player,
        environment: state.environment,
      });
      mcp.emit('AI_HINT', result);
    });

    // Dehydration → AI hint
    mcp.on('PLAYER_DEHYDRATED', async (payload) => {
      const state = mcp.getState();
      const result = await this.generateHint({
        player: state.player,
        environment: state.environment,
      });
      mcp.emit('AI_HINT', result);
    });

    // Language word used → AI reinforcement
    mcp.on('LANGUAGE_WORD_USED', async (payload) => {
      const result = await this.reinforceLanguage(payload);
      mcp.emit('AI_LANGUAGE_REINFORCED', result);
    });

    // NPC interaction → AI context adaptation
    mcp.on('NPC_INTERACTION_STARTED', async (payload) => {
      const result = await this.adaptNPCDialogue(payload);
      mcp.emit('AI_NPC_ADAPTED', result);
    });

    // Quest completed → AI quest guidance
    mcp.on('QUEST_COMPLETED', async (payload) => {
      const result = await this.guideQuest(payload);
      mcp.emit('AI_QUEST_GUIDANCE', result);
    });

    // NPC nearby → contextual hint (low priority, longer cooldown)
    mcp.on('NPC_NEARBY', async (payload) => {
      const state = mcp.getState();
      if (state.quest?.activeQuestId) {
        const result = await this.guideQuest({
          questTitle: state.quest.activeQuestId,
          currentStepText: '',
          completedQuests: state.quest.completedCount,
        });
        mcp.emit('AI_QUEST_GUIDANCE', result);
      }
    });

    // ── Dynamic Quest Generation Triggers ──

    // Repeated failure → generate repair quest
    mcp.on('AI_FAILURE_EXPLAINED', async (payload) => {
      await this.tryGenerateQuest('failure', payload);
    });

    // Low health/hydration → generate survival quest
    mcp.on('PLAYER_LOW_HEALTH', async () => {
      await this.tryGenerateQuest('resource', { need: 'healing' });
    });
    mcp.on('PLAYER_DEHYDRATED', async () => {
      await this.tryGenerateQuest('resource', { need: 'water' });
    });

    // Knowledge unlocked → generate optimization quest
    mcp.on('KNOWLEDGE_UNLOCKED', async (payload) => {
      await this.tryGenerateQuest('knowledge', payload);
    });
  }

  // ── Prompt Builder Dispatch ────────────────────────────────────────────────

  _buildPrompt(type, payload) {
    switch (type) {
      case 'failure_analysis':   return buildFailurePrompt(payload);
      case 'gameplay_hint':      return buildHintPrompt(payload);
      case 'language_reinforcement': return buildLanguagePrompt(payload);
      case 'npc_context_dialogue':   return buildNPCPrompt(payload);
      case 'quest_guidance':     return buildQuestPrompt(payload);
      case 'quiz_question':      return buildQuizQuestionPrompt(payload);
      default:                   return buildHintPrompt(payload);
    }
  }

  // ── Fallback Dispatch ──────────────────────────────────────────────────────

  _getFallback(type, payload) {
    switch (type) {
      case 'failure_analysis':   return fallbackFailureAnalysis(payload);
      case 'gameplay_hint':      return fallbackGameplayHint(payload);
      case 'language_reinforcement': return fallbackLanguageReinforcement(payload);
      case 'npc_context_dialogue':   return fallbackNPCDialogue(payload);
      case 'quest_guidance':     return fallbackQuestGuidance(payload);
      case 'quiz_question':      return fallbackQuizQuestion(payload);
      default:                   return { hint: 'Keep exploring.', source: 'fallback' };
    }
  }

  // ── Cache ──────────────────────────────────────────────────────────────────

  _requestKey(type, payload) {
    // Hash key from type + minimal state to avoid cache misses on irrelevant changes
    const relevant = {
      t: type,
      h: Math.round((payload.player?.health ?? payload.health ?? 1) * 10),
      hy: Math.round((payload.player?.hydration ?? payload.hydration ?? 1) * 10),
      b: payload.environment?.biome || payload.biome || '',
      p: payload.nearestPlantSpecies || payload.plantSpecies || '',
      q: payload.questTitle || payload.activeQuestId || '',
    };
    return JSON.stringify(relevant);
  }

  _getCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(key, data) {
    if (this.cache.size >= this.maxCache) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, { data, time: Date.now() });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _safeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      // Try stripping markdown fences
      const stripped = str.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      try { return JSON.parse(stripped); } catch { return null; }
    }
  }

  _recordResult(type, result, latency) {
    this.results.push({
      type,
      source: result.source || 'unknown',
      latency,
      timestamp: Date.now(),
    });
    if (this.results.length > this.maxResults) this.results.shift();
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function initAISystem() {
  return new MCPAIAdapter();
}
