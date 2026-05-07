import { DEFAULT_FONT_MODE, resolveFontMode } from './readingModes.js';

export const ACCESSIBILITY_STORAGE_KEY = 'bikebrowser.accessibility';

export const DEFAULT_ACCESSIBILITY_PROFILE = {
  dyslexiaMode: true,
  lowercasePriority: true,
  enhancedConfusableLetters: true,
  preserveCapitalBD: true,
  increasedSpacing: true,
  reducedMotion: true,
  readingFocusMode: false,
  phonemeAudio: true,
  fontMode: DEFAULT_FONT_MODE,
};

function readStoredProfile() {
  if (typeof window === 'undefined' || !window.localStorage) return {};

  try {
    return JSON.parse(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function loadAccessibilityProfile() {
  const stored = readStoredProfile();
  return {
    ...DEFAULT_ACCESSIBILITY_PROFILE,
    ...stored,
    fontMode: resolveFontMode(stored.fontMode || DEFAULT_ACCESSIBILITY_PROFILE.fontMode),
  };
}

export function saveAccessibilityProfile(profile) {
  const nextProfile = {
    ...DEFAULT_ACCESSIBILITY_PROFILE,
    ...(profile || {}),
    fontMode: resolveFontMode(profile?.fontMode || DEFAULT_ACCESSIBILITY_PROFILE.fontMode),
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(nextProfile));
    window.dispatchEvent(new CustomEvent('bikebrowser:accessibility-profile-change', { detail: nextProfile }));
  }

  return nextProfile;
}

export function updateAccessibilityProfile(partial) {
  return saveAccessibilityProfile({
    ...loadAccessibilityProfile(),
    ...(partial || {}),
  });
}
