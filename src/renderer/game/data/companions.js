/**
 * Companions — friends who travel with the player.
 *
 * Canonical data for `systems/companionSystem.js`. Adding a companion is a
 * row here plus their character sheets in the art registry; no code change.
 *
 * Cultural scope. Lina only ever repeats a word Mariam has already taught,
 * and Act 1 teaches Modern Standard Arabic (owner decision, 2026-11-26).
 * Her word lines therefore carry a `{term}` placeholder that is filled from
 * the canonical `ar_*` row in `./languages.js` — no word is spelled out
 * here, so the dialect can never drift away from the vocabulary data. The
 * colloquial forms this file used to hard-code (mar7aba / mayy / salli7)
 * were not owner-authorised and have been removed.
 *
 * Her greeting is English. The Southwest Spanish brief is NOT approved, so
 * there is no Spanish here; adding Spanish, new Arabic, or Indigenous or
 * religious content needs owner sign-off first. Lina never introduces a
 * word Mariam or Mrs. Ramirez has not already taught.
 */

import { getVocabItem } from './languages.js';

export const COMPANIONS = {
  lina: {
    id: 'lina',
    name: 'Lina',
    walkSheet: 'lina_walk',
    idleSheet: 'lina_idle',
    /**
     * Scenes Lina appears in: the neighborhood and the desert, per the
     * brief ("she can appear beside him in neighborhood and desert
     * scenes"). She is absent from interiors and instrument rigs, where a
     * follower would just crowd the apparatus.
     */
    scenes: [
      'StreetBlockScene',
      'DesertEdgeScene',
      'OverworldScene',
      'DesertTrailScene',
      'DesertForagingScene',
      'DryWashScene',
    ],
    /**
     * Where Zuzu meets her. She is on the street from the first time he
     * steps outside — "early in Act 1" per the brief — and only tags along
     * to the other scenes once they have actually met, so she is never
     * just waiting in the desert for a boy who has never seen her.
     */
    meetScene: 'StreetBlockScene',
    /**
     * Short lines for when Zuzu talks to her. `requiresCard` gates a line
     * on Mariam having taught that term first, so Lina never gets there
     * ahead of the mentor.
     */
    lines: [
      {
        id: 'lina_greet',
        text: 'Come on, Zuzu! Let’s go see what’s down the street.',
      },
      {
        id: 'lina_hello',
        requiresCard: 'ar_hello',
        text: '{term}! That’s the one Mariam taught us. Did I say it right?',
      },
      {
        id: 'lina_water',
        requiresCard: 'ar_water',
        text: '{term}. That’s the word for water. Take some before we ride — it’s hot out here.',
      },
      {
        id: 'lina_repair',
        requiresCard: 'ar_fix',
        text: '{term}! You fixed it. Mariam’s word for making something work again.',
      },
    ],
  },
};

/**
 * Companions that should be mounted in the given scene.
 *
 * A companion shows up in her meet scene always, and elsewhere only after
 * the player has met her (`state.companions[id].met`).
 */
export function getCompanionsForScene(sceneKey, state) {
  return Object.values(COMPANIONS).filter((c) => {
    if (!c.scenes.includes(sceneKey)) return false;
    if (sceneKey === c.meetScene) return true;
    return Boolean(state?.companions?.[c.id]?.met);
  });
}

/** Record that the player has met a companion. Idempotent. */
export function markCompanionMet(state, companionId) {
  const companions = { ...(state?.companions || {}) };
  if (companions[companionId]?.met) return state;
  companions[companionId] = { ...(companions[companionId] || {}), met: true };
  return { ...state, companions };
}

/**
 * Fill a line's `{term}` placeholder from the canonical vocabulary row for
 * its `requiresCard`, sentence-cased so it can open the sentence.
 *
 * A line with no placeholder is returned untouched. A missing row leaves the
 * placeholder visible rather than inventing a word — loud, and caught by the
 * companion-line test.
 */
function resolveLineTerm(line) {
  if (!line || !line.text.includes('{term}') || !line.requiresCard) return line;
  const row = getVocabItem(line.requiresCard);
  if (!row) return line;
  const term = row.transliteration.charAt(0).toUpperCase() + row.transliteration.slice(1);
  return { ...line, text: line.text.replace('{term}', term) };
}

/**
 * Pick Lina's next line: prefer a word she has seen Mariam teach (so she is
 * practising, not introducing), else her plain greeting.
 */
export function pickCompanionLine(companion, state) {
  const practice = state?.languagePractice || {};
  const practised = (companion.lines || []).filter(
    (line) => line.requiresCard && practice[line.requiresCard]?.practiced > 0,
  );
  if (practised.length > 0) {
    const turn = Object.values(practice).reduce((n, rec) => n + (rec.practiced || 0), 0);
    return resolveLineTerm(practised[turn % practised.length]);
  }
  return (companion.lines || []).find((line) => !line.requiresCard) || null;
}

export default COMPANIONS;
