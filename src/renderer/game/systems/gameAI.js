/**
 * Game AI System — core gameplay intelligence integrated into MCP.
 *
 * This is NOT a dialogue decorator. It's a system explainer, failure
 * analyst, decision guide, and learning assistant that reads real
 * game state from MCP.
 *
 * Architecture:
 *   MCP.observe() → gameAI receives real state snapshot
 *   MCP.coordinate() → gameAI detects conditions worth explaining
 *   MCP.react() → gameAI generates grounded responses
 *
 * AI provider calls are:
 *   - event-driven (NOT every frame)
 *   - throttled (min 5s between calls)
 *   - cached (same state = same response)
 *   - fallback to deterministic analysis when AI unavailable
 *
 * Three modes:
 *   1. DETERMINISTIC — pure function analysis (always available, instant)
 *   2. AI-ENHANCED — enriched explanation via local/cloud AI (async, cached)
 *   3. FALLBACK — deterministic when AI fails (always safe)
 */

import { rankRootCauses, generateRecommendations, classifyFailureState } from '../utils/failureMath.js';
import { MATERIAL_MAP } from '../data/materials.js';
import { FLORA_MAP } from '../data/flora.js';
import { getVocabItem, getLocalTerm } from '../data/languages.js';
import { getTermMastery } from './languageProgressionSystem.js';

// ── AI System Class ──────────────────────────────────────────────────────────

export default class GameAISystem {
  constructor() {
    this.mcp = null;
    this._lastAICall = 0;
    this._minCallInterval = 5000; // 5 seconds between AI provider calls
    this._cache = new Map();
    this._cacheTTL = 60000; // 1 minute
    this._maxCache = 30;
    this._pendingRequest = false;

    // Output queue — MCP reads these
    this.hints = [];
    this.explanations = [];
    this.lastAnalysis = null;

    this.debug = {
      totalCalls: 0,
      cacheHits: 0,
      deterministicCalls: 0,
      aiCalls: 0,
      lastProvider: null,
      lastLatency: 0,
    };
  }

  /** Called by MCP when registered. */
  setMCP(mcp) {
    this.mcp = mcp;

    // Subscribe to MCP events that need AI response
    mcp.on('PLAYER_LOW_HEALTH', (p) => this._onLowHealth(p));
    mcp.on('PLAYER_DEHYDRATED', (p) => this._onDehydrated(p));
    mcp.on('PLAYER_TOXIC', (p) => this._onToxic(p));
    mcp.on('ENV_HEAT_HIGH', (p) => this._onHeatHigh(p));
    mcp.on('FORAGE_AVAILABLE', (p) => this._onForageAvailable(p));
    mcp.on('CONTAMINATION_HIGH', (p) => this._onContaminationHigh(p));
    mcp.on('FLUID_ZONE_ACTIVE', (p) => this._onFluidZone(p));
    mcp.on('ALERT', (p) => this._onAlert(p));
  }

  /** MCP calls this for state snapshots. */
  getSnapshot() {
    return {
      hintsQueued: this.hints.length,
      lastAnalysis: this.lastAnalysis ? this.lastAnalysis.type : null,
      debug: { ...this.debug },
    };
  }

  // ── Core Analysis Functions (Deterministic — Always Available) ─────────────

  /**
   * Analyze why something failed. Uses REAL state data, not prompts.
   *
   * @param {object} context - from MCP state
   * @returns {object} analysis with cause, factors, fix, tradeoffs
   */
  analyzeFailure(context) {
    this.debug.deterministicCalls++;
    const state = context.state || {};
    const causes = rankRootCauses(state, context.materialContext);
    const recs = generateRecommendations(state, causes, context.materialContext);
    const failureState = classifyFailureState(state);

    const analysis = {
      type: 'failure',
      timestamp: Date.now(),
      cause: causes[0] || { label: 'Unknown cause', weight: 0 },
      contributingFactors: causes.slice(1, 4),
      fix: recs.slice(0, 3),
      tradeoffs: this._getTradeoffs(recs),
      severity: failureState.severity,
      failureLabel: failureState.label,
      summary: this._buildFailureSummary(failureState, causes[0], context),
    };

    this.lastAnalysis = analysis;
    return analysis;
  }

  /**
   * Explain a material choice. Why this material works (or doesn't) here.
   *
   * @param {string} materialId
   * @param {string} role - 'frame', 'hull', 'coating', etc.
   * @param {object} environment - { temperature, moisture, etc. }
   * @returns {object} explanation
   */
  explainMaterial(materialId, role, environment = {}) {
    this.debug.deterministicCalls++;
    const mat = MATERIAL_MAP[materialId];
    if (!mat) return { summary: 'Unknown material.', strengths: [], weaknesses: [], suggestion: null };

    const strengths = [];
    const weaknesses = [];
    let suggestion = null;

    // Analyze strengths
    if (mat.structural.strength > 0.7) strengths.push(`High strength (${Math.round(mat.structural.strength * 100)}%) — resists breaking under load.`);
    if (mat.structural.elasticity > 0.6) strengths.push(`Flexible — absorbs impacts without cracking.`);
    if (mat.structural.fatigueResistance > 0.6) strengths.push(`Fatigue-resistant — handles repeated stress well.`);
    if (mat.physical.density < 0.3) strengths.push(`Lightweight — less energy to move.`);
    if (mat.chemical?.contaminationResistance > 0.7) strengths.push(`Naturally resists contamination and decay.`);
    if (mat.coating?.coverage > 0.7) strengths.push(`Excellent as a protective coating.`);

    // Analyze weaknesses in context
    if (environment.temperature > 0.5 && mat.thermal.meltingPoint < 0.3) {
      weaknesses.push(`Low heat tolerance — may fail in this temperature (${Math.round(environment.temperature * 100)}% of limit).`);
      suggestion = 'Use a heat-resistant material or add thermal coating.';
    }
    if (environment.moisture > 0.4 && mat.category === 'metal' && mat.chemical?.contaminationResistance < 0.5) {
      weaknesses.push(`Prone to corrosion in moist environments.`);
      suggestion = 'Apply a waterproof coating (creosote resin or jojoba wax).';
    }
    if (role === 'frame' && mat.structural.strength < 0.4) {
      weaknesses.push(`Too weak for structural framing. Strength: ${Math.round(mat.structural.strength * 100)}%.`);
      suggestion = 'Use steel (85% strength) or a composite for the frame.';
    }
    if (role === 'hull' && mat.physical.density > 0.5) {
      weaknesses.push(`Too dense for hull — may sink. Density: ${Math.round(mat.physical.density * 100)}%.`);
      suggestion = 'Use wood or a lighter material for buoyancy.';
    }

    return {
      material: mat.label,
      category: mat.category,
      summary: weaknesses.length > 0
        ? `${mat.label} has concerns for this role: ${weaknesses[0]}`
        : `${mat.label} is well-suited for ${role}. ${strengths[0] || ''}`,
      strengths,
      weaknesses,
      suggestion,
    };
  }

  /**
   * Explain a crafting outcome. Why did the result have these properties?
   *
   * @param {object} inputs - { materials[], method, quality }
   * @param {object} result - crafted item properties
   * @returns {object} explanation
   */
  explainCrafting(inputs, result) {
    this.debug.deterministicCalls++;
    const points = [];

    if (result.quality > 0.7) {
      points.push('High quality — good material selection and processing.');
    } else if (result.quality < 0.4) {
      points.push('Low quality — materials or processing could be improved.');
    }

    if (result.risk) {
      points.push(`Risk: ${result.risk}. This comes from the source plant's toxicity. Lower dose = lower risk.`);
    }

    return {
      type: 'crafting',
      quality: result.quality,
      points,
      suggestion: result.quality < 0.5 ? 'Refine ingredients before combining, or harvest from a better environment.' : null,
    };
  }

  /**
   * Generate a contextual hint based on current game state.
   * Called by MCP react phase — NOT every frame.
   *
   * @param {object} mcpState - full MCP observed state
   * @returns {string|null} hint text, or null if nothing worth saying
   */
  generateHint(mcpState) {
    this.debug.deterministicCalls++;
    const { player, environment, quest } = mcpState;

    // Priority-ordered hint generation
    if (player.toxicity > 0.6) {
      return 'Toxicity is dangerous. Stop consuming toxic plants. Toxicity decays slowly over time.';
    }
    if (player.hydration < 0.15) {
      return 'Critical dehydration! Prickly pear fruit restores hydration. Barrel cactus pulp works too, but causes nausea.';
    }
    if (player.health < 0.2) {
      return 'Health critical. Craft a healing salve (creosote + agave) or eat mesquite pods for energy.';
    }
    if (environment.temperature > 0.75 && player.hydration < 0.4) {
      return 'Extreme heat is draining your water fast. Find shade and drink before continuing.';
    }
    if (environment.fluidType === 'non_newtonian') {
      return 'This ground is non-Newtonian — sprint across! Slow movement = sinking.';
    }
    if (environment.contaminationLevel > 0.4) {
      return 'Contaminated area. Items foraged here need antimicrobial treatment before use.';
    }
    if (player.nearPlant && player.nearestPlantSpecies) {
      return this._getPlantHint(player.nearestPlantSpecies, environment);
    }

    return null;
  }

  /**
   * Reinforce language learning in context.
   * Returns a local term if the player should learn it now.
   *
   * @param {string} englishConcept - 'water', 'stone', 'heat', etc.
   * @param {string} regionId
   * @param {object} languageState
   * @returns {{ localTerm, transliteration, mastery, reinforcement }|null}
   */
  reinforceLanguage(englishConcept, regionId, languageState) {
    if (!regionId || !languageState) return null;

    const vocab = getLocalTerm(regionId, englishConcept);
    if (!vocab) return null;

    const mastery = getTermMastery(languageState, vocab.id);

    // Only reinforce terms the player has seen but hasn't mastered
    if (mastery === 'unseen' || mastery === 'mastered') return null;

    return {
      termId: vocab.id,
      localTerm: vocab.script,
      transliteration: vocab.transliteration,
      englishGloss: vocab.englishGloss,
      mastery,
      reinforcement: `${vocab.script} (${vocab.transliteration}) — ${vocab.englishGloss}`,
    };
  }

  // ── AI-Enhanced Analysis (Async, Throttled, Cached) ────────────────────────

  /**
   * Request an AI-enhanced explanation. Falls back to deterministic if AI unavailable.
   *
   * @param {string} type - 'failure' | 'material' | 'hint' | 'quest'
   * @param {object} context - real game state data
   * @returns {Promise<object>} enhanced explanation
   */
  async requestAIExplanation(type, context) {
    this.debug.totalCalls++;

    // Throttle: don't call AI more than once per 5 seconds
    const now = Date.now();
    if (now - this._lastAICall < this._minCallInterval) {
      return this._getDeterministicFallback(type, context);
    }

    // Cache check
    const key = this._cacheKey(type, context);
    const cached = this._getCache(key);
    if (cached) {
      this.debug.cacheHits++;
      return cached;
    }

    // Check if AI is available
    if (!window?.api?.ai?.orchestrate) {
      return this._getDeterministicFallback(type, context);
    }

    // Don't stack requests
    if (this._pendingRequest) {
      return this._getDeterministicFallback(type, context);
    }

    this._pendingRequest = true;
    this._lastAICall = now;
    this.debug.aiCalls++;

    try {
      const prompt = this._buildPrompt(type, context);
      const start = Date.now();

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
            fallbackData: this._getDeterministicFallback(type, context),
            maxTokens: 200,
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 5000)),
      ]);

      this.debug.lastLatency = Date.now() - start;
      this.debug.lastProvider = result?.providerUsed || 'unknown';

      if (result?.success && result.data) {
        const parsed = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        const enhanced = { ...this._getDeterministicFallback(type, context), ...parsed, source: 'ai', provider: result.providerUsed };
        this._setCache(key, enhanced);
        return enhanced;
      }
    } catch {
      // AI failed — use deterministic fallback
    } finally {
      this._pendingRequest = false;
    }

    return this._getDeterministicFallback(type, context);
  }

  // ── MCP Event Handlers ─────────────────────────────────────────────────────

  _onLowHealth(payload) {
    this._pushHint('Health low. Craft a healing salve or eat mesquite pods.', 'health');
  }

  _onDehydrated(payload) {
    this._pushHint('Dehydrated! Find prickly pear fruit or a water source.', 'survival');
  }

  _onToxic(payload) {
    this._pushHint(`Toxicity at ${Math.round(payload.toxicity * 100)}%. Avoid toxic plants. It will decay over time.`, 'danger');
  }

  _onHeatHigh(payload) {
    const state = this.mcp?.getState();
    if (state?.player?.hydration < 0.4) {
      this._pushHint('Heat + low hydration is dangerous. Seek shade immediately.', 'danger');
    }
  }

  _onForageAvailable(payload) {
    const species = payload.species;
    if (species) {
      const hint = this._getPlantHint(species);
      if (hint) this._pushHint(hint, 'ecology');
    }
  }

  _onContaminationHigh(payload) {
    this._pushHint('Contaminated zone. Foraged items will need treatment. Creosote resin kills bacteria.', 'science');
  }

  _onFluidZone(payload) {
    if (payload.playerSpeed < 150) {
      this._pushHint('Non-Newtonian ground! Sprint to stay on the surface — slow movement = sinking.', 'science');
    }
  }

  _onAlert(payload) {
    // Log for debug
    if (this.debug.totalCalls > 0) {
      // Already handled by specific handlers
    }
  }

  // ── Hint Management ────────────────────────────────────────────────────────

  _pushHint(text, category = 'general') {
    // Deduplicate within 10 seconds
    const recent = this.hints.find((h) => h.text === text && Date.now() - h.time < 10000);
    if (recent) return;

    this.hints.push({
      text,
      category,
      time: Date.now(),
    });

    // Keep last 10 hints
    if (this.hints.length > 10) this.hints.shift();
  }

  /** Get and consume the latest unread hint. */
  popHint() {
    return this.hints.shift() || null;
  }

  /** Get all current hints without consuming them. */
  peekHints() {
    return [...this.hints];
  }

  // ── Plant Knowledge ────────────────────────────────────────────────────────

  _getPlantHint(species, environment = {}) {
    const flora = FLORA_MAP[species];
    if (!flora) return null;

    const pharm = flora.pharmacology;
    const foraging = flora.foraging;
    const hints = [];

    if (pharm?.hydrating > 0.2) hints.push('good for hydration');
    if (pharm?.antimicrobial > 0.3) hints.push('antimicrobial — treats infections');
    if (pharm?.antiInflammatory > 0.2) hints.push('anti-inflammatory');
    if (pharm?.nutritive > 0.3) hints.push('nutritious');
    if (pharm?.toxicity > 0.2) hints.push('⚠️ toxic in high doses');
    if (pharm?.calming > 0.3) hints.push('calming — improves focus');

    if (foraging?.nightBonus > 0) hints.push('more potent at night');
    if (foraging?.nightDanger > 0.2) hints.push('watch for scorpions nearby');

    if (hints.length === 0) return `${flora.label} — forageable plant.`;
    return `${flora.label}: ${hints.join(', ')}.`;
  }

  // ── Prompt Building (for AI-enhanced mode) ─────────────────────────────────

  _buildPrompt(type, context) {
    const base = `You are an in-game science tutor for a children's desert ecology game. Give a short, educational explanation. Return JSON only.`;

    switch (type) {
      case 'failure':
        return `${base}\n\nA ${context.failureLabel || 'failure'} occurred.\nCause: ${context.cause?.label || 'unknown'}\nMaterial: ${context.material || 'unknown'}\nStress: ${context.stress || 0}\nTemperature: ${context.temperature || 0}\n\nReturn: {"explanation": "1-2 sentence explanation of why this failed", "lesson": "what the player should learn from this"}`;

      case 'material':
        return `${base}\n\nPlayer is choosing ${context.materialName || 'a material'} for ${context.role || 'construction'}.\nStrength: ${context.strength || 0}, Density: ${context.density || 0}, Heat resistance: ${context.heatResistance || 0}\n\nReturn: {"advice": "1 sentence about whether this is a good choice and why", "alternative": "suggest a better option if applicable"}`;

      case 'hint':
        return `${base}\n\nPlayer state: health=${context.health}, hydration=${context.hydration}, toxicity=${context.toxicity}\nEnvironment: ${context.biome}, temperature=${context.temperature}\nNearby: ${context.nearPlant ? context.plantSpecies : 'nothing notable'}\n\nReturn: {"hint": "1 actionable sentence to help the player survive and learn"}`;

      default:
        return `${base}\n\nContext: ${JSON.stringify(context).slice(0, 300)}\n\nReturn: {"response": "short helpful response"}`;
    }
  }

  _getDeterministicFallback(type, context) {
    switch (type) {
      case 'failure':
        return this.analyzeFailure(context);
      case 'material':
        return this.explainMaterial(context.materialId, context.role, context.environment);
      case 'hint':
        return { hint: this.generateHint(context), source: 'deterministic' };
      default:
        return { response: 'No data available.', source: 'deterministic' };
    }
  }

  // ── Tradeoff Analysis ──────────────────────────────────────────────────────

  _getTradeoffs(recommendations) {
    const tradeoffs = [];
    for (const rec of recommendations.slice(0, 2)) {
      if (rec.category === 'overload' || rec.category === 'geometry_weakness') {
        tradeoffs.push('Reinforcement adds weight, which reduces speed and increases energy use.');
      }
      if (rec.category === 'poor_material') {
        tradeoffs.push('Stronger materials are heavier and more expensive.');
      }
      if (rec.category === 'fatigue') {
        tradeoffs.push('Fatigue-resistant materials may be less rigid.');
      }
      if (rec.category === 'coating_failure') {
        tradeoffs.push('Thicker coatings add weight and may reduce heat dissipation.');
      }
    }
    return [...new Set(tradeoffs)];
  }

  _buildFailureSummary(failureState, topCause, context) {
    if (failureState.severity === 0) return 'System is stable.';
    const cause = topCause?.label || 'combined stress';
    return `${failureState.label}: ${cause}. ${topCause?.fix || 'Investigate and improve.'}`;
  }

  // ── Cache ──────────────────────────────────────────────────────────────────

  _cacheKey(type, context) {
    return `${type}:${JSON.stringify(context).slice(0, 100)}`;
  }

  _getCache(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > this._cacheTTL) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(key, data) {
    if (this._cache.size >= this._maxCache) {
      const oldest = this._cache.keys().next().value;
      this._cache.delete(oldest);
    }
    this._cache.set(key, { data, time: Date.now() });
  }
}
