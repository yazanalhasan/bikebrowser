import { isConfusableLetter, normalizeTrainingTileChar } from './confusableLetters.js';
import { FONT_MODES, resolveFontMode } from './readingModes.js';

export { isConfusableLetter };

export function getTypographyClasses(profile = {}) {
  const fontMode = resolveFontMode(profile.fontMode);
  return [
    'app-root',
    FONT_MODES[fontMode].className,
    profile.dyslexiaMode ? 'bb-dyslexia-mode' : '',
    profile.reducedMotion ? 'bb-reduced-motion' : '',
    profile.increasedSpacing ? 'bb-spacing-enhanced' : '',
    profile.readingFocusMode ? 'bb-reading-focus-enabled' : '',
  ].filter(Boolean);
}

export function normalizeReadableText(text, options = {}) {
  const {
    isolatedTile = false,
    preserveCapitalBD = true,
    lowercasePriority = false,
  } = options;

  const baseText = String(text ?? '');
  const readableText = lowercasePriority && !isolatedTile
    ? baseText.toLowerCase()
    : baseText;

  if (!isolatedTile) return readableText;

  return Array.from(readableText)
    .map((char) => normalizeTrainingTileChar(char, { preserveCapitalBD }))
    .join('');
}

export function getReadableChar(char, options = {}) {
  if (!options.isolatedTile) return char;
  return normalizeTrainingTileChar(char, { preserveCapitalBD: options.preserveCapitalBD });
}
