/**
 * Which step a quest is on, by id rather than by number.
 *
 * A scene that hard-codes `stepIndex === 14` breaks the moment a step is
 * inserted anywhere above it. That is exactly what happened: `34a20c2`
 * added `weigh_samples` to `bridge_collapse`, which pushed `build_bridge`
 * from 14 to 15, and the Dry Wash then showed Mr. Chen's first-visit line
 * with no beams — Act 1 could not be finished on a new save.
 *
 * Step ids are stable; their positions are not. Everything that asks
 * "are we on that step?" goes through here.
 *
 * Pure: no Phaser, no DOM.
 */

import QUESTS from '../data/quests.js';

/**
 * Bumped whenever a step is inserted into or removed from a quest, so a
 * save written against an older layout can be mapped forward.
 *
 * v1 — the layout before `weigh_samples` existed.
 * v2 — `weigh_samples` inserted into `bridge_collapse` before `quiz_weight`.
 */
export const QUEST_DATA_VERSION = 2;

/**
 * Steps inserted since v1, as {questId, index, id}. Used to walk an old
 * save's number forward to the same step it was actually on.
 */
const INSERTIONS_SINCE_V1 = [
  { questId: 'bridge_collapse', index: 8, id: 'weigh_samples' },
];

/** The step list for a quest, or an empty array. */
export function stepsOf(questId) {
  return QUESTS[questId]?.steps || [];
}

/**
 * The id of the step at `index`, or null.
 *
 * @param {string} questId
 * @param {number} index
 */
export function stepIdAt(questId, index) {
  return stepsOf(questId)[index]?.id || null;
}

/**
 * Where a step id sits in its quest, or -1.
 *
 * @param {string} questId
 * @param {string} stepId
 */
export function indexOfStepId(questId, stepId) {
  return stepsOf(questId).findIndex((s) => s.id === stepId);
}

/**
 * Is the active quest sitting on this exact step?
 *
 * Use this in scenes instead of comparing `stepIndex` to a number.
 *
 * @param {object} state gameState
 * @param {string} questId
 * @param {string} stepId
 */
export function isOnStep(state, questId, stepId) {
  const active = state?.activeQuest;
  if (!active || active.id !== questId) return false;
  return stepIdAt(questId, active.stepIndex || 0) === stepId;
}

/**
 * Walk an `activeQuest` recorded against an older step layout forward.
 *
 * A save that already carries `stepId` is authoritative — the number is
 * recomputed from it. Otherwise the index is shifted past every step
 * inserted above it since v1.
 *
 * A save created between the insertion commit and this migration carries
 * neither `stepId` nor a quest data version, so by number it is
 * indistinguishable from an older one. It is no longer allowed to land
 * one step ahead: the shift is refused when it would move onto the step
 * that completes the quest, because that is the case where landing one
 * ahead skips the build and ends the chapter early (plan 0.1b). Landing
 * one behind only replays a step. Saves written from here on carry
 * `stepId`, so they never reach this guess at all.
 *
 * @param {{id: string, stepIndex: number, stepId?: string}|null} activeQuest
 * @param {number} fromVersion the save's quest-data version (0 if absent)
 * @returns {{id: string, stepIndex: number, stepId: string|null}|null}
 */
export function migrateActiveQuest(activeQuest, fromVersion = 0) {
  if (!activeQuest?.id) return activeQuest ?? null;

  const steps = stepsOf(activeQuest.id);
  if (!steps.length) return activeQuest;

  // The id wins whenever we have it.
  if (activeQuest.stepId) {
    const byId = indexOfStepId(activeQuest.id, activeQuest.stepId);
    if (byId >= 0) {
      return { ...activeQuest, stepIndex: byId, stepId: activeQuest.stepId };
    }
  }

  let index = activeQuest.stepIndex || 0;
  if (fromVersion < 2) {
    for (const ins of INSERTIONS_SINCE_V1) {
      if (ins.questId !== activeQuest.id) continue;
      if (index < ins.index) continue;

      const shifted = Math.min(index + 1, steps.length - 1);

      // The shift is a guess, and this is where the guess is paid for.
      //
      // A save with no `stepId` and no quest-data version is either
      // older than the insertion (where this number meant one step) or
      // from the window after it (where the number already meant the
      // next one). By number alone the two are identical: 15 in
      // `bridge_collapse` is `complete_bridge` on the old layout and
      // `build_bridge` on the current one.
      //
      // So the tie is broken by what each mistake costs the child, not
      // by which is likelier. Shifting onto the step that ENDS a quest
      // skips the step before it: for `bridge_collapse` that is
      // `build_bridge` — the ghost beams, the four mesquite spans and
      // the load test, the whole point of the chapter — and Act 1 could
      // not be finished at all. Staying put at worst replays a step the
      // child has already done, which costs them a few minutes of a
      // thing they enjoyed. Never shift onto a terminal step.
      if (steps[shifted]?.type === 'complete') continue;

      index = shifted;
    }
  }
  index = Math.min(index, steps.length - 1);

  return { ...activeQuest, stepIndex: index, stepId: steps[index].id };
}

/** Stamp the step id onto an activeQuest so later migrations need no guesswork. */
export function withStepId(activeQuest) {
  if (!activeQuest?.id) return activeQuest;
  const id = stepIdAt(activeQuest.id, activeQuest.stepIndex || 0);
  return id ? { ...activeQuest, stepId: id } : activeQuest;
}
