/**
 * Phrase Builder — constructs and validates phrases from word combinations.
 *
 * Players learn phrases by combining known words into patterns:
 *   "water" + "here" → "ماء هنا" (maa' huna)
 *
 * The system validates that the combination makes sense and returns
 * the correct native phrase with pronunciation.
 *
 * Uses ONLY the 20 starter words per region.
 */

import { getVocabItem, formatTerm } from '../data/languages.js';
import { TEMPLATE_TYPES, PHRASES, getRegionPhrases } from '../data/phraseTemplates.js';

// ── Phrase Building ──────────────────────────────────────────────────────────

/**
 * Build a phrase from word IDs.
 * Checks if the combination matches a known phrase template.
 *
 * @param {string[]} wordIds - ordered array of vocabulary item IDs
 * @param {string} regionId
 * @returns {{ phrase?, match, nativeText, transliteration, meaning, explanation }}
 */
export function buildPhrase(wordIds, regionId) {
  if (!wordIds || wordIds.length === 0) {
    return { phrase: null, match: false, nativeText: '', transliteration: '', meaning: '', explanation: 'Select words to build a phrase.' };
  }

  // Check for exact match in phrase database
  const phrases = getRegionPhrases(regionId);
  const matchedPhrase = phrases.find((p) => {
    if (p.wordIds.length !== wordIds.length) return false;
    return p.wordIds.every((wId, i) => wId === wordIds[i]);
  });

  if (matchedPhrase) {
    return {
      phrase: matchedPhrase,
      match: true,
      nativeText: matchedPhrase.nativePhrase,
      transliteration: matchedPhrase.transliteration,
      meaning: matchedPhrase.meaning,
      explanation: `"${matchedPhrase.transliteration}" — ${matchedPhrase.meaning}. Used for: ${matchedPhrase.usageContext.replace(/_/g, ' ')}.`,
    };
  }

  // No exact match — try to build a meaningful combination anyway
  const words = wordIds.map((id) => getVocabItem(id)).filter(Boolean);
  if (words.length === 0) {
    return { phrase: null, match: false, nativeText: '', transliteration: '', meaning: '', explanation: 'Unknown words.' };
  }

  // Construct raw phrase from components
  const nativeText = words.map((w) => w.script).join(' ');
  const transliteration = words.map((w) => w.transliteration).join(' ');
  const meaning = words.map((w) => w.englishGloss).join(' + ');

  return {
    phrase: null,
    match: false,
    nativeText,
    transliteration,
    meaning,
    explanation: `This combination isn't a common phrase. Try a different order or pairing. Known patterns: ${Object.values(TEMPLATE_TYPES).map((t) => t.label).join(', ')}.`,
  };
}

/**
 * Validate if a word combination is a valid phrase.
 */
export function validatePhrase(wordIds, regionId) {
  const result = buildPhrase(wordIds, regionId);
  return result.match;
}

// ── Phrase Challenges ────────────────────────────────────────────────────────

/**
 * Generate a phrase challenge for the player.
 *
 * @param {string} regionId
 * @param {number} difficulty - 1–3
 * @param {string[]} knownWordIds - words the player has learned
 * @returns {{ challenge, options, correctAnswer }}
 */
export function generatePhraseChallenge(regionId, difficulty, knownWordIds = []) {
  const phrases = getRegionPhrases(regionId).filter((p) => {
    if (p.difficulty > difficulty) return false;
    // Only use phrases with words the player knows
    return p.wordIds.every((wId) => knownWordIds.includes(wId));
  });

  if (phrases.length === 0) return null;

  // Pick a random phrase
  const target = phrases[Math.floor(Math.random() * phrases.length)];
  const targetWords = target.wordIds.map((id) => getVocabItem(id)).filter(Boolean);

  // Generate challenge types
  const challengeTypes = [
    'translate_to_native',   // show English, player selects native words
    'translate_to_english',  // show native, player selects English meaning
    'reorder_words',         // show words scrambled, player reorders
    'fill_blank',            // show phrase with one word missing
  ];

  const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

  switch (type) {
    case 'translate_to_native':
      return {
        type,
        prompt: `How do you say "${target.meaning}"?`,
        correctAnswer: target.nativePhrase,
        options: targetWords.map((w) => ({
          id: w.id,
          display: w.script,
          transliteration: w.transliteration,
        })),
        phrase: target,
      };

    case 'translate_to_english':
      return {
        type,
        prompt: `What does "${target.nativePhrase}" mean?`,
        correctAnswer: target.meaning,
        options: [
          target.meaning,
          ...getDistractors(regionId, target.meaning, 2),
        ].sort(() => Math.random() - 0.5),
        phrase: target,
      };

    case 'reorder_words': {
      const scrambled = [...targetWords].sort(() => Math.random() - 0.5);
      return {
        type,
        prompt: `Put these words in the right order to say: "${target.meaning}"`,
        correctAnswer: target.wordIds,
        options: scrambled.map((w) => ({
          id: w.id,
          display: w.script,
          transliteration: w.transliteration,
        })),
        phrase: target,
      };
    }

    case 'fill_blank': {
      const blankIndex = Math.floor(Math.random() * targetWords.length);
      const blankWord = targetWords[blankIndex];
      const display = targetWords.map((w, i) =>
        i === blankIndex ? '___' : w.script
      ).join(' ');
      return {
        type,
        prompt: `Fill in the blank: "${display}" (${target.meaning})`,
        correctAnswer: blankWord.id,
        options: [
          { id: blankWord.id, display: blankWord.script },
          ...getDistractorWords(regionId, blankWord.id, 2),
        ].sort(() => Math.random() - 0.5),
        phrase: target,
      };
    }

    default:
      return null;
  }
}

// ── NPC Phrase Usage ─────────────────────────────────────────────────────────

/**
 * Get the most appropriate phrase for an NPC to use in context.
 *
 * @param {string} regionId
 * @param {string} context - 'pointing_to_water', 'heat_warning', etc.
 * @param {number} playerRank - player's language rank (1–5)
 * @returns {{ nativePhrase, transliteration, meaning, wordIds }}
 */
export function getNpcPhrase(regionId, context, playerRank) {
  const phrases = getRegionPhrases(regionId).filter((p) => p.usageContext === context);
  if (phrases.length === 0) return null;

  // Pick appropriate difficulty for player rank
  const maxDiff = Math.min(3, playerRank);
  const suitable = phrases.filter((p) => p.difficulty <= maxDiff);
  const phrase = suitable.length > 0 ? suitable[0] : phrases[0];

  return {
    nativePhrase: phrase.nativePhrase,
    transliteration: phrase.transliteration,
    meaning: phrase.meaning,
    wordIds: phrase.wordIds,
    displayWithHints: playerRank < 3
      ? `${phrase.nativePhrase} (${phrase.meaning})`
      : phrase.nativePhrase,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDistractors(regionId, correctMeaning, count) {
  const phrases = getRegionPhrases(regionId);
  return phrases
    .filter((p) => p.meaning !== correctMeaning)
    .slice(0, count)
    .map((p) => p.meaning);
}

function getDistractorWords(regionId, correctId, count) {
  const phrases = getRegionPhrases(regionId);
  const allWordIds = new Set();
  for (const p of phrases) {
    for (const wId of p.wordIds) {
      if (wId !== correctId) allWordIds.add(wId);
    }
  }
  return [...allWordIds]
    .slice(0, count)
    .map((id) => {
      const v = getVocabItem(id);
      return v ? { id: v.id, display: v.script } : null;
    })
    .filter(Boolean);
}
