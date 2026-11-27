/**
 * Language interaction layer — Act 1 Arabic cards.
 *
 * Primitive declarations (arc.md §8.1):
 * - Consults: none (no biome, no terrain). Reads canonical vocabulary rows
 *   from `data/languages.js`.
 * - Updates: state.languagePractice and, optionally, knowledge ids
 *   `language.term:<id>` via the caller. This module does not write them.
 * - Scales: the same practice record works for any later language id, so
 *   Act 2's Arabian Region and the other five languages reuse this shape.
 *
 * Dialect. Act 1 teaches **Modern Standard Arabic** (owner decision,
 * 2026-11-26). The colloquial Levantine fills that used to live here
 * (mar7aba / mayy / salli7) were never owner-authorised and have been
 * removed; the earlier comment in this file claiming they were is the
 * error that decision corrected.
 *
 * Single source of truth. Script, transliteration and English gloss are
 * read from the `ar_*` rows in `data/languages.js` — this module keeps no
 * copy of any word. Only the English teaching prose (`lesson`) is authored
 * here, and Mariam's spoken line is the MSA word itself plus that English
 * caption. Adding a term means adding a row there and an entry below.
 *
 * Scope limits still in force — do NOT extend without owner sign-off:
 * - Only these three terms (hello / water / repair). The wider 21-term
 *   starter deck is not approved for Act 1.
 * - No Spanish cards, and no Indigenous or religious content.
 * - No `cultural:` knowledge ids are marked from here.
 *
 * No scene imports.
 */

import { getVocabItem } from '../data/languages.js';

/**
 * The Act 1 deck: a canonical vocabulary id plus the English teaching prose
 * for it. Everything else on a card is derived from `data/languages.js`.
 */
const ACT1_DECK = [
  {
    id: 'ar_hello',
    mentor: 'mariam',
    lesson: 'A greeting is the first word you trade with a neighbor.',
  },
  {
    id: 'ar_water',
    mentor: 'mariam',
    lesson: 'The word to know before a desert walk.',
  },
  {
    id: 'ar_fix',
    mentor: 'mariam',
    lesson: 'The word for making something work again.',
  },
];

/** Sentence-case a transliteration so it can open a spoken line. */
function openingForm(transliteration) {
  if (!transliteration) return '';
  return transliteration.charAt(0).toUpperCase() + transliteration.slice(1);
}

/**
 * Build one card from its canonical row.
 *
 * Throws rather than dropping the card: a missing row is a data-integrity
 * error, and a short deck would otherwise fail silently (the deck-size
 * sentinel in `tests/act1-progress.test.mjs` is the executable half of this
 * rule). The throw is deterministic — if a row is gone, every test and
 * every build-time import fails before anything ships.
 */
function buildCard(entry) {
  const row = getVocabItem(entry.id);
  if (!row) {
    throw new Error(
      `languageLayer: no vocabulary row for "${entry.id}" in data/languages.js`,
    );
  }
  const spoken = openingForm(row.transliteration);
  return {
    id: row.id,
    languageSlot: row.languageCode,
    english: row.englishGloss,
    script: row.script,
    transliteration: row.transliteration,
    // Mariam says the word itself, then its English caption — the whole of
    // what the MSA decision sanctions her saying.
    spokenScript: row.script,
    spokenTransliteration: spoken,
    caption: `${spoken} means ${row.englishGloss}. ${entry.lesson}`,
    lesson: entry.lesson,
    mentor: entry.mentor,
  };
}

/**
 * Act 1 language cards. `id` is the term id; `spoken*` is the line Mariam
 * says; `script`/`transliteration`/`english` are the word she teaches.
 */
export const LANGUAGE_CARDS = ACT1_DECK.map(buildCard);

/**
 * Ids used while these three cards were English placeholders. Kept so saved
 * practice records and older callers still resolve to the right card.
 */
const LEGACY_CARD_IDS = {
  placeholder_hello: 'ar_hello',
  placeholder_water: 'ar_water',
  placeholder_repair: 'ar_fix',
};

/** Resolve a card by its id (or the placeholder id it used to have). */
export function getLanguageCard(id) {
  const resolved = LEGACY_CARD_IDS[id] || id;
  return LANGUAGE_CARDS.find((card) => card.id === resolved) || null;
}

/**
 * Record one practice of a term.
 *
 * The returned `message` is what the dialog shows: Arabic script, the
 * transliteration, then the English caption — rank 1 never hides the script.
 */
export function practiceLanguageTerm(state, id) {
  const card = getLanguageCard(id);
  if (!card) return { state, ok: false, message: 'That word card is not in the practice deck.' };
  const practice = { ...(state?.languagePractice || {}) };
  const prev = practice[card.id] || { seen: 0, practiced: 0 };
  practice[card.id] = {
    seen: prev.seen + 1,
    practiced: prev.practiced + 1,
    languageSlot: card.languageSlot,
  };
  return {
    state: { ...state, languagePractice: practice },
    ok: true,
    card,
    message: `${card.script} — ${card.transliteration} — ${card.english}. ${card.caption}`,
  };
}

/** The line Mariam speaks for a card, with transliteration and caption. */
export function getMentorLine(id) {
  const card = getLanguageCard(id);
  if (!card) return null;
  return {
    script: card.spokenScript,
    transliteration: card.spokenTransliteration,
    caption: card.caption,
    languageSlot: card.languageSlot,
  };
}
