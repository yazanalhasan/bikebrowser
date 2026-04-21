/**
 * NPC Language + Conversation + Trust System.
 *
 * NPCs adapt their dialogue based on the player's language mastery level.
 * Correct local language use builds trust, unlocking better prices,
 * hidden knowledge, advanced quests, and ecological lore.
 *
 * This is NOT a separate translation layer — it's a gameplay mechanic
 * where language proficiency directly affects outcomes.
 *
 * Integrates with: languageProgressionSystem, npcProfiles, quest system.
 */

import { getRegionVocabulary, getVocabItem, getLocalTerm, formatTerm } from '../data/languages.js';
import { getTermMastery, getDisplayMode, RANK_THRESHOLDS } from './languageProgressionSystem.js';

// ── NPC Language Profiles ────────────────────────────────────────────────────

/**
 * NPC language behavior templates.
 * Each NPC gets a language profile on top of their base personality.
 */
const NPC_LANGUAGE_STYLES = {
  gentle_explainer: {
    label: 'Gentle Explainer',
    localTermFrequency: 0.3,    // how often they use local terms
    repeatAfterPlayer: true,     // echoes player's attempts
    correctsMistakes: 'gently', // 'gently' | 'directly' | 'never'
    patienceLevel: 0.9,
    teachingRate: 1.2,           // bonus XP multiplier
    introductionStyle: 'always_translate', // always provides English alongside
  },
  practical_trader: {
    label: 'Practical Trader',
    localTermFrequency: 0.5,
    repeatAfterPlayer: false,
    correctsMistakes: 'directly',
    patienceLevel: 0.5,
    teachingRate: 0.8,
    introductionStyle: 'expects_basics', // uses local terms for common items
  },
  strict_elder: {
    label: 'Strict Elder',
    localTermFrequency: 0.8,
    repeatAfterPlayer: false,
    correctsMistakes: 'directly',
    patienceLevel: 0.3,
    teachingRate: 1.5,           // high XP when you get it right
    introductionStyle: 'local_first', // speaks local language primarily
  },
  playful_child: {
    label: 'Playful Child',
    localTermFrequency: 0.4,
    repeatAfterPlayer: true,
    correctsMistakes: 'never',   // just plays along
    patienceLevel: 1.0,
    teachingRate: 1.0,
    introductionStyle: 'mix_playfully',
  },
  technical_craftsperson: {
    label: 'Technical Craftsperson',
    localTermFrequency: 0.6,
    repeatAfterPlayer: false,
    correctsMistakes: 'gently',
    patienceLevel: 0.6,
    teachingRate: 1.3,
    introductionStyle: 'technical_terms', // teaches craft vocabulary
  },
};

/**
 * Create an NPC language profile.
 */
export function createNpcLanguageProfile(npcId, regionId, style = 'gentle_explainer') {
  const template = NPC_LANGUAGE_STYLES[style] || NPC_LANGUAGE_STYLES.gentle_explainer;
  return {
    npcId,
    regionId,
    style,
    ...template,
    trust: 0,          // 0–1, builds with correct language use
    interactionCount: 0,
    lastInteraction: 0,
    vocabularyFocus: [], // specific terms this NPC teaches
  };
}

// ── Trust System ─────────────────────────────────────────────────────────────

/**
 * Trust effects from language interactions.
 */
const TRUST_EFFECTS = {
  correct_greeting: 0.05,
  correct_term_use: 0.03,
  correct_recall: 0.04,
  attempted_pronunciation: 0.02,
  wrong_term: -0.01,
  no_attempt: 0,
  repeated_correct_use: 0.02,
};

/**
 * Apply trust change from a language interaction.
 *
 * @param {object} npcProfile - NPC language profile
 * @param {string} interactionType - key from TRUST_EFFECTS
 * @param {number} now
 * @returns {{ profile, trustDelta, message }}
 */
export function updateTrust(npcProfile, interactionType, now) {
  const delta = TRUST_EFFECTS[interactionType] || 0;
  const newTrust = Math.max(0, Math.min(1, npcProfile.trust + delta));

  const profile = {
    ...npcProfile,
    trust: newTrust,
    interactionCount: npcProfile.interactionCount + 1,
    lastInteraction: now,
  };

  let message = null;
  if (delta > 0 && newTrust > npcProfile.trust) {
    if (newTrust >= 0.8 && npcProfile.trust < 0.8) {
      message = `${npcProfile.npcId} trusts you deeply now. New dialogue options available.`;
    } else if (newTrust >= 0.5 && npcProfile.trust < 0.5) {
      message = `${npcProfile.npcId} is warming up to you. Keep using local terms.`;
    }
  }

  return { profile, trustDelta: delta, message };
}

/**
 * Get trust-based unlocks for an NPC.
 */
export function getTrustUnlocks(npcProfile) {
  const t = npcProfile.trust;
  return {
    basicTrade: true,
    discountPricing: t >= 0.3,
    ecologyLore: t >= 0.4,
    craftingHints: t >= 0.5,
    hiddenQuests: t >= 0.7,
    advancedRecipes: t >= 0.8,
    fullLocalDialogue: t >= 0.9,
  };
}

// ── Dialogue Adaptation ──────────────────────────────────────────────────────

/**
 * Adapt a dialogue line based on player's language mastery level.
 *
 * @param {string} englishLine - the base English dialogue
 * @param {string} regionId - which region
 * @param {object} npcProfile - NPC language profile
 * @param {object} languageState - player's language progression state
 * @param {string[]} [keyTerms] - English terms in the line to potentially localize
 * @returns {{ displayLine, localTermsUsed, teachingMoments }}
 */
export function adaptDialogue(englishLine, regionId, npcProfile, languageState, keyTerms = []) {
  const rank = languageState.regions[regionId]?.rank || 1;
  const style = NPC_LANGUAGE_STYLES[npcProfile.style] || NPC_LANGUAGE_STYLES.gentle_explainer;
  const localTermFreq = style.localTermFrequency;

  let displayLine = englishLine;
  const localTermsUsed = [];
  const teachingMoments = [];

  // Auto-detect key terms if not provided
  const termsToCheck = keyTerms.length > 0 ? keyTerms : extractKeyTerms(englishLine);

  for (const englishTerm of termsToCheck) {
    const localVocab = getLocalTerm(regionId, englishTerm);
    if (!localVocab) continue;

    const mastery = getTermMastery(languageState, localVocab.id);
    const shouldUseLocal = Math.random() < localTermFreq;

    if (!shouldUseLocal) continue;

    // Decide how to present based on rank and mastery
    let replacement;
    if (rank >= 4 && mastery === 'mastered') {
      // Advanced: local term only
      replacement = localVocab.script;
    } else if (rank >= 2 || mastery !== 'unseen') {
      // Intermediate: dual language
      replacement = `${localVocab.script} (${englishTerm})`;
    } else {
      // Beginner: English with local hint
      replacement = `${englishTerm} [${localVocab.script} — ${localVocab.transliteration}]`;
    }

    // Replace in the line (case-insensitive, first occurrence)
    const regex = new RegExp(`\\b${escapeRegex(englishTerm)}\\b`, 'i');
    if (regex.test(displayLine)) {
      displayLine = displayLine.replace(regex, replacement);
      localTermsUsed.push(localVocab);

      if (mastery === 'unseen' || mastery === 'introduced') {
        teachingMoments.push({
          termId: localVocab.id,
          vocab: localVocab,
          context: 'npc_dialogue',
          isNew: mastery === 'unseen',
        });
      }
    }
  }

  return { displayLine, localTermsUsed, teachingMoments };
}

// ── Conversation Actions ─────────────────────────────────────────────────────

/**
 * Available conversation actions based on trust and language level.
 */
export function getAvailableActions(npcProfile, languageState) {
  const rank = languageState.regions[npcProfile.regionId]?.rank || 1;
  const unlocks = getTrustUnlocks(npcProfile);
  const actions = [];

  // Always available
  actions.push({ id: 'greet', label: 'Greet', requiresRank: 1, available: true });
  actions.push({ id: 'ask_item', label: 'Ask about item', requiresRank: 1, available: true });

  // Rank-gated
  if (rank >= 2) {
    actions.push({ id: 'ask_ecology', label: 'Ask about ecology', requiresRank: 2, available: unlocks.ecologyLore });
    actions.push({ id: 'barter', label: 'Barter', requiresRank: 2, available: unlocks.basicTrade });
  }
  if (rank >= 3) {
    actions.push({ id: 'ask_materials', label: 'Ask about materials', requiresRank: 3, available: unlocks.craftingHints });
    actions.push({ id: 'ask_pronunciation', label: 'Ask for pronunciation', requiresRank: 3, available: true });
  }
  if (rank >= 4) {
    actions.push({ id: 'quest_dialogue', label: 'Quest conversation', requiresRank: 4, available: unlocks.hiddenQuests });
    actions.push({ id: 'apologize', label: 'Apologize / clarify', requiresRank: 4, available: true });
  }

  return actions;
}

/**
 * Process a greeting interaction.
 * Returns the NPC's response adapted to player's language level.
 */
export function processGreeting(npcProfile, languageState, now) {
  const regionId = npcProfile.regionId;
  const rank = languageState.regions[regionId]?.rank || 1;
  const helloTerm = getLocalTerm(regionId, 'hello');

  let npcGreeting;
  let trustType;

  if (rank >= 3 && helloTerm) {
    // NPC greets in local language
    npcGreeting = `${helloTerm.script}! `;
    trustType = 'correct_greeting';
  } else if (rank >= 2 && helloTerm) {
    npcGreeting = `${helloTerm.script} (${helloTerm.englishGloss})! `;
    trustType = 'attempted_pronunciation';
  } else {
    npcGreeting = 'Hello! ';
    trustType = 'no_attempt';
  }

  const { profile, trustDelta, message } = updateTrust(npcProfile, trustType, now);

  return {
    npcResponse: npcGreeting,
    profile,
    trustDelta,
    trustMessage: message,
    teachingMoment: helloTerm && rank < 3 ? {
      termId: helloTerm.id,
      vocab: helloTerm,
      context: 'greeting',
      isNew: getTermMastery(languageState, helloTerm.id) === 'unseen',
    } : null,
  };
}

/**
 * Process player using a local term in conversation.
 */
export function processTermUse(npcProfile, termId, languageState, now) {
  const vocab = getVocabItem(termId);
  if (!vocab) return { success: false, message: 'Unknown term.' };

  const mastery = getTermMastery(languageState, termId);
  const style = NPC_LANGUAGE_STYLES[npcProfile.style] || NPC_LANGUAGE_STYLES.gentle_explainer;

  let trustType;
  let npcResponse;

  if (mastery === 'practiced' || mastery === 'reliable' || mastery === 'mastered') {
    trustType = 'correct_term_use';
    npcResponse = style.repeatAfterPlayer
      ? `${vocab.script}! Yes, very good.`
      : `*nods* ${vocab.englishGloss}.`;
  } else if (mastery === 'familiar' || mastery === 'introduced') {
    trustType = 'attempted_pronunciation';
    npcResponse = style.correctsMistakes === 'gently'
      ? `Almost — it's "${vocab.transliteration}." ${vocab.script}.`
      : style.correctsMistakes === 'directly'
      ? `No. "${vocab.transliteration}." Say it again.`
      : `Hmm? ${vocab.script}!`;
  } else {
    trustType = 'no_attempt';
    npcResponse = `I don't understand. Do you mean ${vocab.englishGloss}?`;
  }

  const { profile, trustDelta, message } = updateTrust(npcProfile, trustType, now);

  return {
    success: trustType !== 'no_attempt',
    npcResponse,
    profile,
    trustDelta,
    trustMessage: message,
    xpMultiplier: style.teachingRate,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract likely key terms from an English line (nouns/materials). */
function extractKeyTerms(line) {
  const materialWords = ['water', 'stone', 'iron', 'wood', 'clay', 'fiber', 'resin', 'salt', 'sand', 'fire', 'heat', 'wind', 'rain', 'tree', 'plant', 'mountain', 'desert', 'sun', 'shade', 'earth', 'bamboo', 'tea'];
  return materialWords.filter((w) => line.toLowerCase().includes(w));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
