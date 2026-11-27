/**
 * Companions — friends who travel with the player.
 *
 * Canonical data for `systems/companionSystem.js`. Adding a companion is a
 * row here plus their character sheets in the art registry; no code change.
 *
 * Cultural scope. Lina's spoken lines below are limited to what the owner
 * has decided:
 *   - The three Levantine Arabic terms from `systems/languageLayer.js`
 *     (mar7aba / mayy / salli7), which she repeats kid-to-kid. The brief
 *     explicitly allows her to "repeat a word Mariam just used" and to use
 *     "the same hello / water / repair cards in a kid-to-kid line".
 *   - The one decided Spanish line, "¡Vamos, Zuzu!", from
 *     bb-briefs/southwest-spanish.md ("Lina (companion) — decided
 *     2026-11-26").
 * No other Spanish vocabulary and no new Arabic may be added here without a
 * further sign-off. Lina never introduces a word Mariam or Mrs. Ramirez has
 * not already taught.
 */

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
        text: '¡Vamos, Zuzu! Let’s go see what’s down the street.',
      },
      {
        id: 'lina_hello',
        requiresCard: 'ar_hello',
        text: 'Mar7aba! That’s the one Mariam taught us. Did I say it right?',
      },
      {
        id: 'lina_water',
        requiresCard: 'ar_water',
        text: 'Mayy. Water. Take some before we ride — it’s hot out here.',
      },
      {
        id: 'lina_repair',
        requiresCard: 'ar_fix',
        text: 'Salli7! You fixed it. Mariam’s word — fix it so it works again.',
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
    return practised[turn % practised.length];
  }
  return (companion.lines || []).find((line) => !line.requiresCard) || null;
}

export default COMPANIONS;
