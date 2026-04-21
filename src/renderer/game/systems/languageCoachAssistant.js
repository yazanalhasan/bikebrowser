/**
 * Language Coach Assistant — tutor mode for the in-game AI assistant.
 *
 * Extends the failure assistant with language coaching capabilities.
 * Explains meanings, suggests practice words, reviews pronunciation,
 * detects patterns in player mistakes, and encourages progress.
 *
 * Reads from: languageProgressionSystem, npcLanguageSystem, vocabulary data.
 * Does NOT hallucinate — all advice based on actual player progress data.
 */

import { getVocabItem, getRegionVocabulary, formatTerm } from '../data/languages.js';
import {
  getRegionProgress, getReviewQueue, getTermMastery,
  getVocabularyJournal, getNextTermsToIntroduce,
} from './languageProgressionSystem.js';

// ── Coach Message Types ──────────────────────────────────────────────────────

/**
 * Generate a coaching message based on context.
 *
 * @param {string} messageType
 * @param {object} context - { termId?, regionId?, playerState?, npcInteraction? }
 * @param {object} languageState - player language progress
 * @returns {{ message, type, terms?, suggestions? }}
 */
export function generateCoachMessage(messageType, context, languageState) {
  switch (messageType) {
    case 'term_introduced':
      return onTermIntroduced(context, languageState);
    case 'term_mastered':
      return onTermMastered(context, languageState);
    case 'npc_misunderstanding':
      return onMisunderstanding(context, languageState);
    case 'review_suggestion':
      return onReviewSuggestion(context, languageState);
    case 'rank_up':
      return onRankUp(context, languageState);
    case 'practice_prompt':
      return onPracticePrompt(context, languageState);
    case 'pronunciation_feedback':
      return onPronunciationFeedback(context, languageState);
    case 'progress_summary':
      return onProgressSummary(context, languageState);
    default:
      return { message: null, type: 'info' };
  }
}

// ── Message Generators ───────────────────────────────────────────────────────

function onTermIntroduced(context, languageState) {
  const vocab = getVocabItem(context.termId);
  if (!vocab) return { message: null, type: 'info' };

  return {
    message: `New word: ${formatTerm(vocab, 'full')}. ` +
      `You'll see this in crafting, inspection, and NPC dialogue. ` +
      `Use it correctly to build mastery.`,
    type: 'learning',
    terms: [vocab],
    pronunciation: vocab.pronunciation,
  };
}

function onTermMastered(context, languageState) {
  const vocab = getVocabItem(context.termId);
  if (!vocab) return { message: null, type: 'info' };

  const progress = getRegionProgress(languageState, vocab.regionId);

  return {
    message: `Mastered "${vocab.script}" (${vocab.englishGloss})! ` +
      `${progress.masteredTerms}/${progress.totalTerms} terms mastered in this region. ` +
      `NPCs will now use this word without translation.`,
    type: 'achievement',
    terms: [vocab],
  };
}

function onMisunderstanding(context, languageState) {
  const vocab = getVocabItem(context.termId);
  if (!vocab) return { message: 'Try again — the NPC didn\'t understand.', type: 'correction' };

  const mastery = getTermMastery(languageState, context.termId);

  if (mastery === 'unseen' || mastery === 'introduced') {
    return {
      message: `"${vocab.script}" (${vocab.transliteration}) means "${vocab.englishGloss}." ` +
        `This is a new word for you — practice it a few more times.`,
      type: 'correction',
      terms: [vocab],
      suggestions: [`Try saying "${vocab.transliteration}" — pronunciation: ${vocab.pronunciation}`],
    };
  }

  return {
    message: `Close! The NPC expected "${vocab.script}" (${vocab.transliteration}). ` +
      `You've seen this ${mastery === 'familiar' ? 'a few times' : 'before'}. ` +
      `One more correct use will strengthen your memory.`,
    type: 'correction',
    terms: [vocab],
  };
}

function onReviewSuggestion(context, languageState) {
  const regionId = context.regionId;
  const now = Date.now();
  const queue = getReviewQueue(languageState, regionId, now, 5);

  if (queue.length === 0) {
    return {
      message: 'No words due for review right now. Keep exploring!',
      type: 'info',
    };
  }

  const terms = queue.map((q) => q.vocab).filter(Boolean);
  const termList = terms.map((t) => `${t.script} (${t.englishGloss})`).join(', ');

  return {
    message: `${queue.length} word(s) ready for review: ${termList}. ` +
      `Look for them in inspection labels, NPC dialogue, or crafting prompts.`,
    type: 'review',
    terms,
    suggestions: ['Inspect a nearby object to encounter these words naturally.'],
  };
}

function onRankUp(context, languageState) {
  const progress = getRegionProgress(languageState, context.regionId);

  return {
    message: `Language rank up! You're now "${progress.label}" in this region. ` +
      `${progress.unlocks}. ` +
      `NPCs will adjust how they speak to you.`,
    type: 'achievement',
    suggestions: [
      progress.rank >= 3 ? 'Try asking NPCs about ecology using local terms.' : null,
      progress.rank >= 4 ? 'New trust-based quests may now be available.' : null,
    ].filter(Boolean),
  };
}

function onPracticePrompt(context, languageState) {
  const regionId = context.regionId;
  const nextTerms = getNextTermsToIntroduce(languageState, regionId, 3);

  if (nextTerms.length === 0) {
    return {
      message: 'You\'ve encountered all available terms in this region!',
      type: 'info',
    };
  }

  const hint = nextTerms[0];
  return {
    message: `Next word to learn: ${formatTerm(hint, 'full')}. ` +
      `Category: ${hint.category}. ` +
      `You'll find it when you ${getCategoryHint(hint.category)}.`,
    type: 'learning',
    terms: nextTerms,
  };
}

function onPronunciationFeedback(context, languageState) {
  const vocab = getVocabItem(context.termId);
  if (!vocab) return { message: null, type: 'info' };

  const { accuracy } = context;

  if (accuracy > 0.8) {
    return {
      message: `Good pronunciation of "${vocab.transliteration}"! ` +
        `The sounds are clear.`,
      type: 'positive',
      terms: [vocab],
    };
  }
  if (accuracy > 0.5) {
    return {
      message: `Close! "${vocab.transliteration}" — try: ${vocab.pronunciation}. ` +
        `${getPronunciationTip(vocab)}`,
      type: 'correction',
      terms: [vocab],
    };
  }
  return {
    message: `Let's try "${vocab.transliteration}" again. ` +
      `Break it down: ${vocab.pronunciation}. ` +
      `Listen to the audio and repeat slowly.`,
    type: 'correction',
    terms: [vocab],
    suggestions: ['Tap the speaker icon to hear it again.'],
  };
}

function onProgressSummary(context, languageState) {
  const regionId = context.regionId;
  const progress = getRegionProgress(languageState, regionId);
  const journal = getVocabularyJournal(languageState, regionId);

  const recentlyLearned = journal
    .filter((v) => v.mastery === 'familiar' || v.mastery === 'practiced')
    .slice(-5);

  const weakWords = journal
    .filter((v) => v.mastery === 'introduced' && v.encounters > 3)
    .slice(0, 3);

  let message = `Region progress: ${progress.percentage}% (${progress.masteredTerms}/${progress.totalTerms} mastered). ` +
    `Rank: ${progress.label} (${progress.xp} XP). `;

  if (recentlyLearned.length > 0) {
    message += `Recently learning: ${recentlyLearned.map((v) => v.script).join(', ')}. `;
  }
  if (weakWords.length > 0) {
    message += `Needs practice: ${weakWords.map((v) => `${v.script} (${v.englishGloss})`).join(', ')}. `;
  }
  if (progress.xpToNextRank > 0) {
    message += `${progress.xpToNextRank} XP to ${progress.nextRankLabel}.`;
  }

  return { message, type: 'summary', terms: [...recentlyLearned, ...weakWords] };
}

// ── Contextual Helpers ───────────────────────────────────────────────────────

function getCategoryHint(category) {
  const hints = {
    plant: 'explore and forage in the wild',
    animal: 'observe wildlife in their habitat',
    material: 'inspect objects or use the crafting bench',
    action: 'interact with NPCs or perform tasks',
    environment: 'explore the landscape',
    greeting: 'talk to NPCs',
    warning: 'encounter hazards',
  };
  return hints[category] || 'explore the region';
}

function getPronunciationTip(vocab) {
  // Give language-specific hints
  const tips = {
    ar: 'Arabic has sounds not in English — the "h" is deeper, from the throat.',
    qu: 'Quechua stresses the second-to-last syllable consistently.',
    sw: 'Swahili is phonetic — every letter is pronounced as written.',
    tr: 'Turkish vowels are consistent — "ö" and "ü" are rounded vowels.',
    ku: 'Kurdish "x" is a throaty "kh" sound, like clearing your throat gently.',
    zh: 'Mandarin tones matter — the same sound with different pitch means different things.',
  };
  return tips[vocab.languageCode] || '';
}

// ── Voice Integration Helpers ────────────────────────────────────────────────

/**
 * Get voice parameters for speaking a term in its native language.
 * Extends the existing npcSpeech system with language awareness.
 *
 * @param {object} vocab - vocabulary item
 * @returns {{ lang, rate, pitch, text }}
 */
export function getVoiceParams(vocab) {
  if (!vocab) return null;

  const langToSpeechLang = {
    ar: 'ar-SA',
    qu: 'es-PE',  // Quechua doesn't have TTS; use Peruvian Spanish as approximation
    sw: 'sw-KE',
    tr: 'tr-TR',
    ku: 'ku',     // limited TTS support; fallback to Arabic
    zh: 'zh-CN',
  };

  return {
    lang: langToSpeechLang[vocab.languageCode] || 'en-US',
    rate: 0.75,   // slower for learning
    pitch: 1.0,
    text: vocab.script,
    fallbackText: vocab.transliteration,
  };
}

/**
 * Attempt to speak a vocabulary term using browser Speech Synthesis.
 * Falls back to transliteration if native language voice is unavailable.
 *
 * @param {object} vocab
 * @returns {boolean} true if speech was initiated
 */
export function speakTerm(vocab) {
  if (!vocab || typeof window === 'undefined' || !window.speechSynthesis) return false;

  const params = getVoiceParams(vocab);
  if (!params) return false;

  window.speechSynthesis.cancel(); // cancel any current speech

  const utterance = new SpeechSynthesisUtterance(params.text);
  utterance.lang = params.lang;
  utterance.rate = params.rate;
  utterance.pitch = params.pitch;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.startsWith(params.lang.split('-')[0]));
  if (match) {
    utterance.voice = match;
  } else {
    // Fallback: speak the transliteration in English
    utterance.text = params.fallbackText;
    utterance.lang = 'en-US';
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Speak a term slowly with syllable breaks.
 */
export function speakTermSlow(vocab) {
  if (!vocab) return false;
  const params = getVoiceParams(vocab);
  if (!params) return false;

  // Use pronunciation hint which has hyphens for syllable breaks
  const syllables = vocab.pronunciation.split('-').join(' ... ');

  const utterance = new SpeechSynthesisUtterance(syllables);
  utterance.lang = 'en-US'; // pronunciation hints are in English phonetics
  utterance.rate = 0.5;

  window.speechSynthesis?.cancel();
  window.speechSynthesis?.speak(utterance);
  return true;
}
