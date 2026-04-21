/**
 * Audio Settings — persist volume/mute preferences in localStorage.
 *
 * Schema is versioned so we can migrate cleanly if the shape changes.
 *
 * Stored under key: bikebrowser_audio_settings
 */

const STORAGE_KEY = 'bikebrowser_audio_settings';
const SCHEMA_VERSION = 1;

const DEFAULTS = {
  version: SCHEMA_VERSION,
  masterMute: false,
  musicMute: false,
  sfxMute: false,
  ambientMute: false,
  masterVolume: 1.0,
  musicVolume: 0.65,
  sfxVolume: 0.8,
  ambientVolume: 0.45,
};

/**
 * Load settings from localStorage, falling back to defaults.
 * @returns {typeof DEFAULTS}
 */
export function loadAudioSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    if (parsed.version !== SCHEMA_VERSION) {
      // Future: could migrate; for now reset to defaults
      return { ...DEFAULTS };
    }
    // Merge with defaults so any new keys are present
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Save settings to localStorage.
 * @param {typeof DEFAULTS} settings
 */
export function saveAudioSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, version: SCHEMA_VERSION }));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

/** Get a copy of the default settings */
export function getDefaultAudioSettings() {
  return { ...DEFAULTS };
}
