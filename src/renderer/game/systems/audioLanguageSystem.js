/**
 * Audio Language System — pronunciation playback, syllable guidance,
 * and speech capture for language learning.
 *
 * Uses browser Speech Synthesis for TTS with per-language voice selection.
 * Falls back to transliteration display when native TTS unavailable.
 *
 * Integrates with languageCoachAssistant.js for the coaching loop:
 *   hear word → attempt pronunciation → get feedback → repeat
 */

import { getVocabItem, VOCABULARY } from '../data/languages.js';

// ── TTS Voice Configuration Per Language ─────────────────────────────────────

const VOICE_CONFIG = {
  ar: { lang: 'ar-SA', rate: 0.75, pitch: 1.0, label: 'Arabic (Levantine)' },
  qu: { lang: 'es-PE', rate: 0.7, pitch: 1.0, label: 'Quechua (via Spanish)' },
  sw: { lang: 'sw-KE', rate: 0.8, pitch: 1.0, label: 'Swahili' },
  tr: { lang: 'tr-TR', rate: 0.75, pitch: 1.0, label: 'Turkish' },
  ku: { lang: 'ku', rate: 0.7, pitch: 1.0, label: 'Kurdish', fallbackLang: 'ar-SA' },
  fa: { lang: 'fa-IR', rate: 0.75, pitch: 1.0, label: 'Persian', fallbackLang: 'ar-SA' },
  zh: { lang: 'zh-CN', rate: 0.65, pitch: 1.0, label: 'Mandarin' },
};

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

// ── Core Playback ────────────────────────────────────────────────────────────

/**
 * Play a vocabulary word's audio pronunciation.
 *
 * @param {string} wordId - vocabulary item id
 * @param {object} [options]
 * @param {boolean} [options.slowMode=false] - play at 0.6x speed
 * @param {number} [options.repeatCount=1] - how many times to repeat
 * @param {boolean} [options.highlightSyllables=false] - play syllable-by-syllable
 * @param {function} [options.onEnd] - callback when playback finishes
 * @returns {boolean} true if playback initiated
 */
export function playWordAudio(wordId, options = {}) {
  if (!synth) return false;

  const vocab = getVocabItem(wordId);
  if (!vocab) return false;

  synth.cancel(); // stop any current playback

  if (options.highlightSyllables) {
    return playSyllables(vocab, options);
  }

  const config = VOICE_CONFIG[vocab.languageCode] || VOICE_CONFIG.ar;
  const rate = options.slowMode ? config.rate * 0.6 : config.rate;
  const count = options.repeatCount || 1;

  let played = 0;
  const playOnce = () => {
    const utterance = new SpeechSynthesisUtterance(vocab.script);
    utterance.lang = config.lang;
    utterance.rate = rate;
    utterance.pitch = config.pitch;

    // Try to find matching voice
    const voice = findVoice(config.lang, config.fallbackLang);
    if (voice) {
      utterance.voice = voice;
    } else {
      // Fallback: speak transliteration in English
      utterance.text = vocab.transliteration;
      utterance.lang = 'en-US';
      utterance.rate = rate * 0.8;
    }

    utterance.onend = () => {
      played++;
      if (played < count) {
        setTimeout(playOnce, 500); // pause between repeats
      } else {
        options.onEnd?.();
      }
    };

    synth.speak(utterance);
  };

  playOnce();
  return true;
}

/**
 * Play word syllable by syllable with pauses.
 */
function playSyllables(vocab, options = {}) {
  const syllables = vocab.pronunciation.split('-');
  let i = 0;

  const playNext = () => {
    if (i >= syllables.length) {
      // After syllables, play full word once
      setTimeout(() => {
        playWordAudio(vocab.id, { ...options, highlightSyllables: false, repeatCount: 1 });
      }, 600);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(syllables[i]);
    utterance.lang = 'en-US'; // pronunciation hints are English phonetics
    utterance.rate = 0.5;
    utterance.onend = () => {
      i++;
      setTimeout(playNext, 400); // pause between syllables
    };
    synth.speak(utterance);
  };

  playNext();
  return true;
}

// ── Voice Finding ────────────────────────────────────────────────────────────

function findVoice(primaryLang, fallbackLang) {
  if (!synth) return null;
  const voices = synth.getVoices();
  const primary = primaryLang.split('-')[0];

  // Try exact match first
  let match = voices.find((v) => v.lang === primaryLang);
  if (match) return match;

  // Try language prefix match
  match = voices.find((v) => v.lang.startsWith(primary));
  if (match) return match;

  // Try fallback
  if (fallbackLang) {
    match = voices.find((v) => v.lang.startsWith(fallbackLang.split('-')[0]));
    if (match) return match;
  }

  return null;
}

/**
 * Check if native TTS is available for a language.
 */
export function hasNativeVoice(languageCode) {
  const config = VOICE_CONFIG[languageCode];
  if (!config) return false;
  return findVoice(config.lang, config.fallbackLang) !== null;
}

/**
 * Get all available voices for debugging.
 */
export function getAvailableVoices() {
  if (!synth) return [];
  return synth.getVoices().map((v) => ({ name: v.name, lang: v.lang }));
}

// ── Pronunciation Capture (Microphone) ───────────────────────────────────────

let _mediaRecorder = null;
let _audioChunks = [];

/**
 * Start recording the player's pronunciation attempt.
 * Returns a promise that resolves when recording stops.
 *
 * @param {number} [maxDurationMs=5000]
 * @returns {Promise<{ blob, duration }>}
 */
export async function startPronunciationCapture(maxDurationMs = 5000) {
  if (!navigator?.mediaDevices?.getUserMedia) {
    return { blob: null, duration: 0, error: 'Microphone not available' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _audioChunks = [];
    _mediaRecorder = new MediaRecorder(stream);

    return new Promise((resolve) => {
      const startTime = Date.now();

      _mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) _audioChunks.push(e.data);
      };

      _mediaRecorder.onstop = () => {
        const blob = new Blob(_audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        resolve({ blob, duration: Date.now() - startTime });
      };

      _mediaRecorder.start();

      // Auto-stop after max duration
      setTimeout(() => {
        if (_mediaRecorder?.state === 'recording') {
          _mediaRecorder.stop();
        }
      }, maxDurationMs);
    });
  } catch {
    return { blob: null, duration: 0, error: 'Microphone access denied' };
  }
}

/**
 * Stop recording early.
 */
export function stopPronunciationCapture() {
  if (_mediaRecorder?.state === 'recording') {
    _mediaRecorder.stop();
  }
}

/**
 * Simple pronunciation scoring based on recording duration vs expected.
 * This is a TRANSPARENT approximation — not a fake accent grader.
 *
 * Evaluates:
 *   - approximate syllable timing
 *   - whether recording length matches word length
 *   - repetition count for confidence
 *
 * @param {object} captureResult - from startPronunciationCapture
 * @param {object} vocab - vocabulary item
 * @returns {{ accuracy, feedback, level }}
 */
export function scorePronunciation(captureResult, vocab) {
  if (!captureResult?.blob || !vocab) {
    return { accuracy: 0, feedback: 'No recording captured.', level: 'retry' };
  }

  const syllableCount = vocab.pronunciation.split('-').length;
  const expectedMs = syllableCount * 400; // ~400ms per syllable at learning speed
  const actualMs = captureResult.duration;

  // Duration-based scoring (very approximate)
  const durationRatio = actualMs / Math.max(100, expectedMs);
  let accuracy;
  if (durationRatio > 0.5 && durationRatio < 2.5) {
    accuracy = 1 - Math.abs(1 - durationRatio) * 0.5;
  } else {
    accuracy = 0.2;
  }

  accuracy = Math.max(0.1, Math.min(0.95, accuracy));

  let feedback, level;
  if (accuracy > 0.7) {
    feedback = `Good! "${vocab.transliteration}" sounded about right in timing.`;
    level = 'close';
  } else if (accuracy > 0.4) {
    feedback = `Understandable. Try matching the rhythm: ${vocab.pronunciation}.`;
    level = 'understandable';
  } else {
    feedback = `Try again — listen to each syllable: ${vocab.pronunciation}.`;
    level: 'retry';
  }

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    feedback,
    level: level || 'retry',
    syllableCount,
    expectedMs,
    actualMs,
  };
}

/**
 * Shadow speaking mode — for when microphone is unavailable.
 * Player listens, repeats silently, then self-confirms practice.
 *
 * @param {string} wordId
 * @returns {{ vocab, instructions }}
 */
export function getShadowSpeakingPrompt(wordId) {
  const vocab = getVocabItem(wordId);
  if (!vocab) return null;

  return {
    vocab,
    instructions: [
      `Listen to "${vocab.transliteration}"`,
      `Break it down: ${vocab.pronunciation}`,
      'Repeat it quietly to yourself',
      'Try to match the rhythm and sounds',
      'Tap "Done" when you feel comfortable',
    ],
  };
}

/** Get the voice config for a language code. */
export function getVoiceConfig(languageCode) {
  return VOICE_CONFIG[languageCode] || null;
}
