/**
 * NPC AI Client — game-facing service for AI-assisted dialogue.
 *
 * Routes through the existing aiOrchestrator → IPC → providerManager
 * pipeline. Returns structured dialogue JSON with deterministic fallback.
 *
 * Design:
 *   - Lightweight cache keyed by (npcId, questId, stepId, band)
 *   - Timeout protection (3s default)
 *   - Always returns usable content (fallback on any failure)
 *   - Structured output schema enforced in prompt
 */

import { getNpcProfile } from '../data/npcProfiles.js';
import { getFallbackDialogue } from '../data/npcDialogueTemplates.js';
import { getBandConfig } from '../systems/dialogueDifficulty.js';

// ── Cache ────────────────────────────────────────────────────────────────────

const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

function cacheKey(npcId, questId, stepId, band) {
  return `${npcId}:${questId}:${stepId}:${band}`;
}

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  if (_cache.size >= MAX_CACHE_SIZE) {
    // Evict oldest
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
  _cache.set(key, { data, ts: Date.now() });
}

// ── AI availability check ────────────────────────────────────────────────────

function isAiAvailable() {
  return Boolean(window?.api?.ai?.orchestrate);
}

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildNpcDialoguePrompt(params) {
  const { npcProfile, questId, stepId, stepType, band, bandConfig, learningContext, originalText } = params;

  return `You are generating dialogue for an NPC in a children's bicycle repair learning game.

ROLE: You are ${npcProfile.name}, ${npcProfile.role}.
TONE: ${npcProfile.tone}, ${npcProfile.ageStyle}
TEACHING STYLE: ${npcProfile.teachingStyle}
PATIENCE: ${npcProfile.patienceStyle}
ENCOURAGEMENT: ${npcProfile.encouragementStyle}

CONTEXT:
- Quest: ${questId}
- Step: ${stepId} (type: ${stepType})
- Complexity band: ${band} (${bandConfig.description})
- Max sentence length: ~${bandConfig.maxSentenceWords} words
- Hint strength: ${bandConfig.hintStrength}
- Explanation depth: ${bandConfig.explanationDepth}
${learningContext ? `- Player learning context: ${learningContext}` : ''}

ORIGINAL DIALOGUE (for reference, you may adapt but keep the same meaning):
"${originalText}"

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON, no markdown fencing
- Keep spokenLine under ${bandConfig.maxSentenceWords * 2} words
- Keep captionLine concise and readable
- Match the complexity band exactly
- Stay child-friendly, educational, and on-topic
- Do NOT include scary, manipulative, or off-topic content
- Do NOT use complex jargon beyond the band level

${stepType === 'quiz' ? `QUIZ NOTE: Do NOT change the correct answer. You may rephrase the question and choice labels, but the first choice must remain correct.` : ''}

JSON SCHEMA:
{
  "spokenLine": "short natural spoken line for text-to-speech",
  "captionLine": "visible text caption (can be slightly longer)",
  "hintLine": "helpful hint matching ${bandConfig.hintStrength} strength",
  "encouragementLine": "short positive reinforcement"${stepType === 'quiz' ? `,
  "questionPrompt": "the quiz question rephrased for this band",
  "explanationLine": "short explanation after answering correctly"` : ''}
}`;
}

// ── Main API ─────────────────────────────────────────────────────────────────

/**
 * Request AI-enhanced NPC dialogue for a quest step.
 *
 * Always returns structured content — AI-generated if available,
 * deterministic fallback otherwise.
 *
 * @param {object} params
 * @param {string} params.npcId
 * @param {string} params.questId
 * @param {string} params.stepId
 * @param {string} params.stepType - 'dialogue'|'inspect'|'use_item'|'quiz'|'complete'
 * @param {string} params.band - difficulty band
 * @param {string} [params.originalText] - original quest step text
 * @param {object} [params.learningContext] - topic progress info
 * @returns {Promise<{ dialogue: object, source: 'ai'|'fallback'|'cache' }>}
 */
export async function getNpcDialogue({
  npcId,
  questId,
  stepId,
  stepType,
  band = 'starter',
  originalText = '',
  learningContext,
}) {
  const key = cacheKey(npcId, questId, stepId, band);

  // 1. Check cache
  const cached = getCached(key);
  if (cached) {
    return { dialogue: cached, source: 'cache' };
  }

  // 2. Try AI if available
  if (isAiAvailable()) {
    try {
      const npcProfile = getNpcProfile(npcId);
      const bandConfig = getBandConfig(band);
      const contextStr = learningContext
        ? Object.entries(learningContext).map(([k, v]) => `${k}: ${v}`).join(', ')
        : null;

      const prompt = buildNpcDialoguePrompt({
        npcProfile,
        questId,
        stepId,
        stepType,
        band,
        bandConfig,
        learningContext: contextStr,
        originalText,
      });

      const fallback = getFallbackDialogue(questId, stepId, band);

      const result = await Promise.race([
        window.api.ai.orchestrate({
          taskType: 'npc_dialogue',
          prompt,
          expectedFormat: 'json',
          metadata: {
            fallbackData: fallback,
            schema: {
              type: 'object',
              required: ['spokenLine', 'captionLine'],
            },
            // Resource-aware routing hints
            workloadTaskType: 'npc_dialogue_generation',
            allowLocalGpu: true,
            allowRemote: true,
            allowFallback: true,
            latencyBudgetMs: 3000,
            npcId,
            questId,
            complexityBand: band,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('NPC AI timeout')), 3000)
        ),
      ]);

      if (result?.success && result.data) {
        const dialogue = typeof result.data === 'string'
          ? JSON.parse(result.data)
          : result.data;

        // Validate minimum fields
        if (dialogue.spokenLine && dialogue.captionLine) {
          // Merge with fallback to ensure all fields exist
          const merged = { ...fallback, ...dialogue };
          setCache(key, merged);
          return { dialogue: merged, source: 'ai' };
        }
      }
    } catch {
      // AI failed — fall through to fallback
    }
  }

  // 3. Deterministic fallback
  const fallback = getFallbackDialogue(questId, stepId, band);
  if (fallback) {
    setCache(key, fallback);
    return { dialogue: fallback, source: 'fallback' };
  }

  // 4. Absolute last resort — use original text
  const lastResort = {
    spokenLine: originalText,
    captionLine: originalText,
    hintLine: null,
    encouragementLine: 'Keep going!',
  };
  return { dialogue: lastResort, source: 'fallback' };
}

/** Clear the dialogue cache (e.g., on new game). */
export function clearDialogueCache() {
  _cache.clear();
}
