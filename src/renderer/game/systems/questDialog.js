/**
 * What the dialog box should show after a quest step advances.
 *
 * Pure decisions, kept out of `scenes/LocalSceneBase.js` so they can be
 * tested without Phaser (which needs a DOM). The scene owns the registry and
 * the explainer overlay; this module owns "what should be on screen next".
 *
 * Primitive declarations (arc.md §8.1):
 * - Consults: nothing environmental. Reads the quest step and save state.
 * - Updates: nothing. Returns a description; the caller writes it.
 * - Scales Act 1 -> Act 3: step types are act-agnostic, so is this.
 *
 * No scene imports.
 */

import { interpolateStepText } from './questTemplating.js';

/**
 * The dialog to show for the step the player has just arrived at.
 *
 * Every step type gets a dialog except `explainer`, which opens its own
 * overlay instead — the caller handles that case and never asks here.
 *
 * Returning a dialog for *every* step is the point. The base class used to
 * re-emit quiz steps only and close the box on everything else, so after each
 * Continue the child had to walk back to the NPC and press E again to hear
 * the next line; `desert_healer` alone took five separate presses on Mrs.
 * Ramirez. The deleted StreetBlockScene fork got this right, and deleting the
 * fork is what regressed it.
 *
 * @param {object|null} step the step now current, or null if the quest ended
 * @param {object} state the save state after the advance
 * @param {string|null} giverName display name of the quest giver
 * @returns {object|null} a `dialogEvent` payload, or null when nothing follows
 */
export function dialogForStep(step, state, giverName) {
  if (!step) return null;
  if (step.type === 'explainer' && step.explainerId) return null;

  const text = step.templateVars
    ? interpolateStepText(step.text, step.templateVars, state)
    : step.text;

  const isQuiz = step.type === 'quiz';
  return {
    speaker: isQuiz ? 'Zuzu (thinking)' : (giverName || 'Zuzu'),
    text,
    choices: isQuiz ? (step.choices || null) : null,
    step,
    questId: state?.activeQuest?.id ?? null,
  };
}

/**
 * Did something else open a dialog while we were writing state?
 *
 * Writing `gameState` runs every registry listener synchronously, and one of
 * them (the end-of-Act-1 celebration) opens a dialog. The advance used to
 * fall through and null `dialogEvent` straight afterwards, wiping it — and
 * since that celebration only fires once, it never came back. Compare the
 * value either side of the write and leave a listener's dialog alone.
 *
 * @param {*} before value of `dialogEvent` before the state write
 * @param {*} after value of `dialogEvent` after it
 * @returns {boolean} true when a listener opened one and it must be kept
 */
export function listenerOpenedDialog(before, after) {
  return after != null && after !== before;
}

/**
 * Sound for arriving at a step. Lived only in the street's forked copy, so
 * the same step played nothing in any other scene.
 *
 * @returns {{ key: string, opts?: object }|null}
 */
export function sfxForStep(step) {
  if (!step) return null;
  if (step.type !== 'use_item') return { key: 'ui_success' };
  if (step.id === 'use_lever') return { key: 'wrench_turn', opts: { vary: true } };
  if (step.id === 'use_patch') return { key: 'patch_apply', opts: { vary: true } };
  return { key: 'item_pickup' };
}
