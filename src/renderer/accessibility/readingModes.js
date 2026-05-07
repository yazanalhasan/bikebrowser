export const FONT_MODES = {
  lexend: {
    id: 'lexend',
    label: 'Lexend',
    className: 'bb-font-lexend',
  },
  atkinson: {
    id: 'atkinson',
    label: 'Atkinson Hyperlegible',
    className: 'bb-font-atkinson',
  },
  openDyslexic: {
    id: 'openDyslexic',
    label: 'OpenDyslexic',
    className: 'bb-font-opendyslexic',
  },
  system: {
    id: 'system',
    label: 'System',
    className: 'bb-font-system',
  },
};

export const DEFAULT_FONT_MODE = 'lexend';

export function resolveFontMode(fontMode) {
  return FONT_MODES[fontMode] ? fontMode : DEFAULT_FONT_MODE;
}
