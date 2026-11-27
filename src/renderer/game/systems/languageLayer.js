/**
 * Language interaction layer — Act 1 Levantine Arabic cards.
 *
 * Primitive declarations (arc.md §8.1):
 * - Consults: none (no biome, no terrain).
 * - Updates: state.languagePractice and, optionally, knowledge ids
 *   `language.term:<id>` via the caller. This module does not write them.
 * - Scales: the same practice record works for any later language id, so
 *   Act 2's Arabian Region and the other five languages reuse this shape.
 *
 * Cultural representation. The three cards below are the Act 1 Levantine
 * Arabic fills authorised by the owner from `bb-briefs/levantine-arabic.md`
 * (the "Mariam says" table and its short English captions). Nothing here is
 * invented or machine-translated: script, transliteration and caption are
 * copied from that brief verbatim.
 *
 * Scope limits still in force — do NOT extend without a further brief sign-off:
 * - Only these three terms (hello / water / repair). The brief's wider
 *   21-term starter deck is NOT approved for `data/languages.js` yet.
 * - No Spanish cards, and no rewriting of the existing MSA-leaning `ar_*`
 *   entries in `data/languages.js` (brief questions 1, 2 and 4 are open).
 * - No `cultural:` knowledge ids are marked from here.
 *
 * Transliteration scheme (kid-friendly, from the brief): 3 = ع, 7 = ح,
 * 2 = ء/glottal stop, doubled consonant = shadda.
 *
 * No scene imports.
 */

/**
 * Act 1 language cards. `id` is the term id; `spoken*` is the full line
 * Mariam says; `term*` is the single word the card teaches.
 */
export const LANGUAGE_CARDS = [
  {
    id: 'ar_hello',
    languageSlot: 'ar',
    english: 'hello',
    script: 'مرحبا',
    transliteration: 'mar7aba',
    spokenScript: 'مرحبا يا زوزو.',
    spokenTransliteration: 'Mar7aba ya Zuzu.',
    caption: 'Mar7aba, Zuzu. That’s how we say hello.',
    lesson: 'A greeting is the first word you trade with a neighbor.',
    mentor: 'mariam',
  },
  {
    id: 'ar_water',
    languageSlot: 'ar',
    english: 'water',
    script: 'مي',
    transliteration: 'mayy',
    spokenScript: 'بدك مي؟ في مي هون. اشرب مي قبل ما تمشي.',
    spokenTransliteration: 'Biddak mayy? Fi mayy hoon. Ishrab mayy 2abl ma timshi.',
    caption: 'Mayy means water. Take some before a desert walk.',
    lesson: 'Water is the word you need before a desert walk.',
    mentor: 'mariam',
  },
  {
    id: 'ar_fix',
    languageSlot: 'ar',
    english: 'repair',
    script: 'صلّح',
    transliteration: 'salli7',
    spokenScript: 'يلا نصلّح السيكل. صلّح يعني تزبطه ليرجع يشتغل.',
    spokenTransliteration: 'Yalla nsalli7 is-saykal. Salli7 ya3ni tzabbto li-yarja3 yishtaghel.',
    caption: 'Salli7 means fix it so it works again. Yalla, let’s repair the bike.',
    lesson: 'Repair is the word for fixing something so it works again.',
    mentor: 'mariam',
  },
];

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
 * The returned `message` is what the dialog shows: Arabic script, the kid
 * transliteration, then the English caption — the brief's rule is that rank 1
 * never hides the script.
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

/** The full line Mariam speaks for a card, with transliteration and caption. */
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
