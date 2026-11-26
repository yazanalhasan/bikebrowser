/**
 * Language interaction layer — mechanics only.
 *
 * Primitive declarations (arc.md §8.1):
 * - Consults: none (no biome, no terrain).
 * - Updates: state.languagePractice and, optionally, knowledge ids
 *   `language.term:<id>` via the caller. This module does not write them.
 * - Scales: the same practice record works for any later language id.
 *
 * Cultural representation: this file does NOT contain Arabic, Spanish,
 * or indigenous phrases. Cards are English placeholders. A human brief
 * is required before real translations are filled in.
 *
 * No scene imports.
 */

export const LANGUAGE_PLACEHOLDERS = [
  {
    id: 'placeholder_hello',
    languageSlot: 'und',
    english: 'hello',
    placeholder: '[needs a human language brief]',
    lesson: 'A greeting is the first word you trade with a neighbor.',
  },
  {
    id: 'placeholder_water',
    languageSlot: 'und',
    english: 'water',
    placeholder: '[needs a human language brief]',
    lesson: 'Water is the word you need before a desert walk.',
  },
  {
    id: 'placeholder_repair',
    languageSlot: 'und',
    english: 'repair',
    placeholder: '[needs a human language brief]',
    lesson: 'Repair is the word for fixing something so it works again.',
  },
];

export function getLanguagePlaceholder(id) {
  return LANGUAGE_PLACEHOLDERS.find((card) => card.id === id) || null;
}

export function practiceLanguageTerm(state, id) {
  const card = getLanguagePlaceholder(id);
  if (!card) return { state, ok: false, message: 'That word card is not in the practice deck.' };
  const practice = { ...(state?.languagePractice || {}) };
  const prev = practice[id] || { seen: 0, practiced: 0 };
  practice[id] = {
    seen: prev.seen + 1,
    practiced: prev.practiced + 1,
    placeholder: true,
    languageSlot: card.languageSlot,
  };
  return {
    state: { ...state, languagePractice: practice },
    ok: true,
    card,
    message: `${card.english}: ${card.placeholder}. ${card.lesson}`,
  };
}
