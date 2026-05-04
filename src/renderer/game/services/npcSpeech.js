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
 *   - Module-level voice cache, primed on load and refreshed via the
 *     `voiceschanged` event, eliminates the cold-start empty-array
 *     race that Electron/Chrome exhibits on first load.
 */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

let _enabled = true;
let _autoSpeak = true;
let _currentUtterance = null;
let _lastSpokenText = null;
let _rate = 0.9;
let _pitch = 1.0;

// ── Voice cache (race-free) ─────────────────────────────────────────────────

/**
 * Module-level voice cache. Primed synchronously on module load; refreshed
 * whenever the browser fires `voiceschanged`. All voice lookups in this file
 * read from this cache instead of calling `synth.getVoices()` directly,
 * which is the documented fix for the Chromium cold-start empty-array race.
 *
 * @type {SpeechSynthesisVoice[]}
 */
let _voiceCache = [];

function _refillVoiceCache() {
  if (!synth) return;
  const voices = synth.getVoices();
  if (Array.isArray(voices)) {
    _voiceCache = voices;
  }
}

if (synth) {
  // Prime cache immediately — may return [] on cold start, that's expected.
  _refillVoiceCache();
  // Listener fires once the engine has loaded its voices.
  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', _refillVoiceCache);
  } else if ('onvoiceschanged' in synth) {
    synth.onvoiceschanged = _refillVoiceCache;
  }
}

/** Read the cached voice list (never calls `synth.getVoices()` directly). */
function _getCachedVoices() {
  // If cache is empty (cold start before voiceschanged fired) attempt a
  // late refill — getVoices() may now succeed on a subsequent tick.
  if (_voiceCache.length === 0 && synth) {
    _refillVoiceCache();
  }
  return _voiceCache;
}

// ── Gender-based voice mapping ──────────────────────────────────────────────

/**
 * Character voice gender registry.
 * Maps character id → 'male' | 'female' | 'default'.
 *
 * 'default' means: do not pick a gendered voice — let the browser/OS choose
 * its default voice. Used for Zuzu (per user requirement) and any NPC whose
 * gender is genuinely ambiguous.
 *
 * One-line inline comment per NPC documents the inference (honorific +
 * given name) so reviewers can audit choices.
 */
const CHARACTER_GENDER = {
  zuzu: 'default',           // protagonist — explicit user requirement: use system default voice
  mrs_ramirez: 'female',     // honorific "Mrs." — female
  mr_chen: 'male',           // honorific "Mr." — male
  old_miner: 'male',         // "Old Miner Pete" — male given name
  desert_guide: 'female',    // "Ranger Nita" — female given name
  river_biologist: 'female', // "Dr. Maya" — female given name
};

/**
 * Get a voice matching the requested gender from cached browser voices.
 * Returns null immediately for 'default' so the caller can let the
 * browser/OS pick its default voice.
 *
 * @param {'male'|'female'|'default'} gender
 * @returns {SpeechSynthesisVoice|null}
 */
function _pickVoiceByGender(gender) {
  if (!synth) return null;
  if (gender === 'default') return null; // explicit: use OS/browser default

  const voices = _getCachedVoices();
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
 * Unknown ids fall through to 'default' (was 'male' previously) so we never
 * silently force a gender on an undeclared NPC.
 *
 * @param {string} characterId - e.g. 'zuzu', 'mrs_ramirez', 'mr_chen'
 * @returns {{ gender: string, voice: SpeechSynthesisVoice|null }}
 */
export function getVoiceForCharacter(characterId) {
  const gender = CHARACTER_GENDER[characterId] || 'default';
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

const UNIT_END = '(?=\\s|[).,;:!?]|$)';

function speakSignedNumber(value) {
  return String(value).startsWith('-')
    ? `minus ${String(value).slice(1)}`
    : String(value);
}

function normalizeNumberUnit(_, value, unit) {
  const unitName = {
    mAh: 'milliamp hours',
    Ah: 'amp hours',
    Wh: 'watt hours',
    mV: 'millivolts',
    V: 'volts',
    mA: 'milliamps',
    A: 'amps',
    W: 'watts',
    Hz: 'hertz',
    mm: 'millimeters',
    cm: 'centimeters',
    kg: 'kilograms',
    mg: 'milligrams',
    g: 'grams',
    ml: 'milliliters',
    mL: 'milliliters',
    L: 'liters',
    N: 'newtons',
    J: 'joules',
  }[unit] || unit;
  return `${speakSignedNumber(value)} ${unitName}`;
}

export function normalizeSpeechText(text) {
  return String(text)
    // Ratios and powers first, before plain unit expansion touches either side.
    .replace(new RegExp(`\\bkg\\s*\\/\\s*m(?:³|\\^3|3)${UNIT_END}`, 'gi'), 'kilograms per meter cubed')
    .replace(new RegExp(`\\bg\\s*\\/\\s*cm(?:³|\\^3|3)${UNIT_END}`, 'gi'), 'grams per centimeter cubed')
    .replace(new RegExp(`\\bm\\s*\\/\\s*s(?:²|\\^2|2)${UNIT_END}`, 'gi'), 'meters per second squared')
    .replace(new RegExp(`\\bm\\s*\\/\\s*s${UNIT_END}`, 'gi'), 'meters per second')
    .replace(new RegExp(`\\bN\\s*\\/\\s*m(?:²|\\^2|2)${UNIT_END}`, 'g'), 'newtons per meter squared')
    .replace(new RegExp(`\\bper\\s+cm(?:³|\\^3|3)${UNIT_END}`, 'gi'), 'per centimeter cubed')
    .replace(new RegExp(`\\bper\\s+m(?:³|\\^3|3)${UNIT_END}`, 'gi'), 'per meter cubed')
    .replace(new RegExp(`\\bcm(?:³|\\^3|3)${UNIT_END}`, 'gi'), 'centimeters cubed')
    .replace(new RegExp(`\\bm(?:³|\\^3|3)${UNIT_END}`, 'gi'), 'meters cubed')
    .replace(new RegExp(`\\bmm(?:²|\\^2|2)${UNIT_END}`, 'gi'), 'millimeters squared')
    .replace(new RegExp(`\\bcm(?:²|\\^2|2)${UNIT_END}`, 'gi'), 'centimeters squared')
    .replace(new RegExp(`\\bm(?:²|\\^2|2)${UNIT_END}`, 'gi'), 'meters squared')
    .replace(/\b10\s*⁻\s*⁶\s*\/\s*K\b/g, '10 to the minus 6 per kelvin')
    .replace(/\b10\s*\^\s*-?\s*6\s*\/\s*K\b/gi, '10 to the minus 6 per kelvin')
    // Common math symbols in quest captions, quizzes, and knowledge cards.
    .replace(/→/g, ' to ')
    .replace(/←/g, ' from ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/≈|~/g, ' approximately ')
    .replace(/≥/g, ' greater than or equal to ')
    .replace(/≤/g, ' less than or equal to ')
    .replace(/±/g, ' plus or minus ')
    .replace(/\bvs\.?\b/gi, 'versus')
    .replace(/\bBMS\b/g, 'battery management system')
    .replace(/\bPSI\b/g, 'pounds per square inch')
    .replace(/\bUTM\b/g, 'universal testing machine')
    .replace(/\bWh\b/g, 'watt hours')
    .replace(/\bAh\b/g, 'amp hours')
    .replace(/\bAmp-hours\b/gi, 'amp hours')
    .replace(/\bpH\b/g, 'p H')
    .replace(/(^|[^\w])(-?\d+(?:\.\d+)?)\s*°\s*C\b/g, (_, prefix, value) =>
      `${prefix}${speakSignedNumber(value)} degrees Celsius`
    )
    .replace(/\b(-?\d+(?:\.\d+)?)\s*%/g, (_, value) => `${speakSignedNumber(value)} percent`)
    .replace(/\b(-?\d+(?:\.\d+)?)\s*(mAh|Ah|Wh|mV|V|mA|A|W|Hz|mm|cm|kg|mg|g|mL|ml|L|N|J)\b/g, normalizeNumberUnit)
    .replace(/\s{2,}/g, ' ')
    .trim();
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
 * @param {'male'|'female'|'default'} [options.gender] - voice selection hint
 * @returns {boolean} true if speech was initiated
 */
export function speak(text, options = {}) {
  if (!synth || !_enabled || !text) return false;
  const spokenText = normalizeSpeechText(text);

  // Prevent replaying the exact same line (re-render protection)
  if (!options.force && spokenText === _lastSpokenText && synth.speaking) {
    return false;
  }

  // Cancel any current speech
  cancelSpeech();

  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.rate = options.rate || _rate;
  utterance.pitch = options.pitch || _pitch;
  utterance.lang = 'en-US';

  // Pick voice:
  //   - 'default' gender → leave utterance.voice unset so the browser/OS
  //     picks its default voice (the ask for Zuzu).
  //   - other gender → pick a matching English voice from the cache.
  //   - no gender → fall through to the natural-English heuristic.
  if (options.gender === 'default') {
    // Intentionally do not set utterance.voice — browser default applies.
  } else if (options.gender) {
    const genderVoice = _pickVoiceByGender(options.gender);
    if (genderVoice) utterance.voice = genderVoice;
  } else {
    const voices = _getCachedVoices();
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
  _lastSpokenText = spokenText;
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
  // Resolve gender from npcId if provided. Unknown ids fall through to
  // 'default' so we never silently force a gendered voice.
  const gender = options.npcId
    ? (CHARACTER_GENDER[options.npcId] || 'default')
    : options.gender;
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

/**
 * Dev-only verification helper. Returns a snapshot mapping each NPC id in
 * `CHARACTER_GENDER` to the voice name that would be selected right now,
 * given the current cached voice list. Useful in DevTools:
 *
 *     import { debugListVoiceAssignments } from './services/npcSpeech.js';
 *     console.table(debugListVoiceAssignments());
 *
 * Returns an object: { [npcId]: voiceName | '(default)' | '(none)' }
 */
export function debugListVoiceAssignments() {
  const out = {};
  for (const id of Object.keys(CHARACTER_GENDER)) {
    const gender = CHARACTER_GENDER[id];
    if (gender === 'default') {
      out[id] = '(default)';
      continue;
    }
    const voice = _pickVoiceByGender(gender);
    out[id] = voice ? voice.name : '(none)';
  }
  return out;
}
