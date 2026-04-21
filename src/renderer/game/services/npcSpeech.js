/**
 * NPC Speech Service — browser-based text-to-speech for NPC dialogue.
 *
 * Uses the Web Speech API (SpeechSynthesis) for zero-cost, zero-latency
 * spoken dialogue. Falls back gracefully if speech is unavailable.
 *
 * Design:
 *   - Singleton service, no React dependency
 *   - Cancel-on-change prevents overlapping utterances
 *   - Tracks current utterance to avoid replaying on re-renders
 *   - Configurable rate/pitch per NPC via voice preferences
 */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

let _enabled = true;
let _autoSpeak = true;
let _currentUtterance = null;
let _lastSpokenText = null;
let _rate = 0.9;
let _pitch = 1.0;

// ── Gender-based voice mapping ──────────────────────────────────────────────

/**
 * Character voice gender registry.
 * Maps character id → 'male' | 'female' for voice selection.
 */
const CHARACTER_GENDER = {
  zuzu: 'male',
  mrs_ramirez: 'female',
  mr_chen: 'male',
};

/**
 * Get a voice matching the requested gender from available browser voices.
 * @param {'male'|'female'} gender
 * @returns {SpeechSynthesisVoice|null}
 */
function _pickVoiceByGender(gender) {
  if (!synth) return null;
  const voices = synth.getVoices();
  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));

  // Try to find a voice whose name hints at the right gender
  const genderHints = gender === 'female'
    ? ['female', 'woman', 'zira', 'samantha', 'karen', 'victoria', 'fiona', 'moira', 'tessa']
    : ['male', 'man', 'david', 'daniel', 'james', 'mark', 'alex', 'fred', 'tom', 'guy'];

  const match = englishVoices.find((v) => {
    const lower = v.name.toLowerCase();
    return genderHints.some((h) => lower.includes(h));
  });
  if (match) return match;

  // Fallback: prefer natural English voice
  return englishVoices.find((v) => v.name.toLowerCase().includes('natural'))
    || englishVoices[0]
    || null;
}

/**
 * Get the appropriate voice settings for a character.
 * @param {string} characterId - e.g. 'zuzu', 'mrs_ramirez', 'mr_chen'
 * @returns {{ gender: string, voice: SpeechSynthesisVoice|null }}
 */
export function getVoiceForCharacter(characterId) {
  const gender = CHARACTER_GENDER[characterId] || 'male';
  return { gender, voice: _pickVoiceByGender(gender) };
}

/** Check if speech synthesis is available in this browser. */
export function isSpeechAvailable() {
  return Boolean(synth);
}

/** Enable or disable speech globally. */
export function setSpeechEnabled(enabled) {
  _enabled = enabled;
  if (!enabled) cancelSpeech();
}

export function isSpeechEnabled() {
  return _enabled;
}

/** Enable or disable auto-speak (speak when dialogue appears). */
export function setAutoSpeak(auto) {
  _autoSpeak = auto;
}

export function isAutoSpeakEnabled() {
  return _autoSpeak;
}

/** Set default speech rate (0.5 - 2.0). */
export function setSpeechRate(rate) {
  _rate = Math.max(0.5, Math.min(2.0, rate));
}

export function getSpeechRate() {
  return _rate;
}

/**
 * Speak a line of dialogue.
 *
 * @param {string} text - the text to speak
 * @param {object} [options]
 * @param {number} [options.rate] - speech rate override
 * @param {number} [options.pitch] - pitch override
 * @param {boolean} [options.force] - speak even if same as last spoken text
 * @param {function} [options.onEnd] - callback when speech finishes
 * @returns {boolean} true if speech was initiated
 */
export function speak(text, options = {}) {
  if (!synth || !_enabled || !text) return false;

  // Prevent replaying the exact same line (re-render protection)
  if (!options.force && text === _lastSpokenText && synth.speaking) {
    return false;
  }

  // Cancel any current speech
  cancelSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || _rate;
  utterance.pitch = options.pitch || _pitch;
  utterance.lang = 'en-US';

  // Pick voice: gender-specific if requested, else natural-sounding
  if (options.gender) {
    const genderVoice = _pickVoiceByGender(options.gender);
    if (genderVoice) utterance.voice = genderVoice;
  } else {
    const voices = synth.getVoices();
    const preferred = voices.find((v) =>
      v.lang.startsWith('en') && v.name.toLowerCase().includes('natural')
    ) || voices.find((v) =>
      v.lang.startsWith('en-US')
    ) || voices.find((v) =>
      v.lang.startsWith('en')
    );
    if (preferred) utterance.voice = preferred;
  }

  utterance.onend = () => {
    _currentUtterance = null;
    options.onEnd?.();
  };
  utterance.onerror = () => {
    _currentUtterance = null;
  };

  _currentUtterance = utterance;
  _lastSpokenText = text;
  synth.speak(utterance);
  return true;
}

/** Replay the last spoken line. */
export function replay() {
  if (_lastSpokenText) {
    speak(_lastSpokenText, { force: true });
    return true;
  }
  return false;
}

/** Cancel current speech. */
export function cancelSpeech() {
  if (synth?.speaking || synth?.pending) {
    synth.cancel();
  }
  _currentUtterance = null;
}

/** Check if currently speaking. */
export function isSpeaking() {
  return Boolean(synth?.speaking);
}

/** Reset the "last spoken" tracker (call on dialog close). */
export function resetLastSpoken() {
  _lastSpokenText = null;
}

/**
 * Speak NPC dialogue with persona voice settings.
 *
 * @param {string} text
 * @param {object} [voicePreference] - { rate, pitch } from NPC profile
 * @param {object} [options] - additional speak options
 */
export function speakAsNpc(text, voicePreference = {}, options = {}) {
  // Resolve gender from npcId if provided
  const gender = options.npcId ? (CHARACTER_GENDER[options.npcId] || 'male') : options.gender;
  return speak(text, {
    rate: voicePreference.rate || _rate,
    pitch: voicePreference.pitch || _pitch,
    gender,
    ...options,
  });
}

/**
 * Auto-speak if enabled. Called when a new dialog event fires.
 * Won't re-speak the same text (re-render safe).
 */
export function autoSpeak(text, voicePreference = {}, options = {}) {
  if (!_autoSpeak || !_enabled) return false;
  return speakAsNpc(text, voicePreference, options);
}
