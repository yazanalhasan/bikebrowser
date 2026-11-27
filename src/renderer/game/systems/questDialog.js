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

export const NARRATOR = "Zuzu's notebook";

/**
 * Step types that are a conversation with the quest giver rather than a job
 * to go and do. These must not happen where the giver is not standing.
 */
const GIVER_PRESENT_STEPS = new Set(['dialogue', 'complete']);

/**
 * Does this step need the giver standing there?
 *
 * Conversations always do. So does any step marked `requiresGiver` in the
 * quest data — used for treatments, because "apply the healing salve to help
 * Mrs. Ramirez's arm" could be completed alone in the desert, nowhere near
 * the arm. Other `use_item` steps (a tyre lever, chain lube) are things you
 * do to an object and are fine anywhere.
 */
function needsGiverHere(step) {
  return Boolean(step?.requiresGiver) || GIVER_PRESENT_STEPS.has(step?.type);
}

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
 * @param {{ giverPresent?: boolean }} [options] whether the giver is in this
 *   scene; when they are not, giver-conversation steps become a "go back"
 *   objective instead of chaining on without them
 * @returns {object|null} a `dialogEvent` payload, or null when nothing follows
 */
export function dialogForStep(step, state, giverName, options = {}) {
  if (!step) return null;
  if (step.type === 'explainer' && step.explainerId) return null;

  const { giverPresent = true } = options;

  const text = step.templateVars
    ? interpolateStepText(step.text, step.templateVars, state)
    : step.text;

  const isQuiz = step.type === 'quiz';

  // A quiz is Zuzu thinking, so it needs nobody.
  if (isQuiz) {
    return {
      speaker: 'Zuzu (thinking)',
      text,
      choices: step.choices || null,
      step,
      questId: state?.activeQuest?.id ?? null,
    };
  }

  // Talking to the giver requires the giver. Chaining regardless meant
  // desert_healer, the infection quest and the coating quest could all be
  // finished out in the desert or in the garage, with "Mrs. Ramirez"
  // speaking in a scene she is not in — and the child never walked back.
  if (!giverPresent && needsGiverHere(step)) {
    return {
      speaker: NARRATOR,
      // No pronoun. There is no pronoun field on an NPC profile, and
      // guessing one from a name is exactly the wrong way to get it — "tell
      // them" about a named person read as a mistake, and "tell her" would
      // be a guess. Naming the person twice is clearer than either.
      text: giverName
        ? `Go back and tell ${giverName} what happened.`
        : 'Go back and tell them what happened.',
      choices: null,
      // No `step`: this is an objective reminder, not the step itself, so
      // Continue must not advance the quest from here.
      step: null,
      questId: state?.activeQuest?.id ?? null,
      objective: true,
    };
  }

  return {
    speaker: speakerFor(step, text, giverName, giverPresent),
    text,
    choices: null,
    step,
    questId: state?.activeQuest?.id ?? null,
  };
}

/**
 * Who says a step's text.
 *
 * Quest steps are written as objectives, so some of them name the giver:
 * "The tire is fixed! Mrs. Ramirez is so happy.", "Take the data back to
 * Mr. Chen." Spoken *by* that person they read as someone talking about
 * themselves in the third person. Those lines go to the notebook instead,
 * which is what they always were.
 *
 * The giver also cannot speak at all when they are not in the scene.
 */
export function speakerFor(step, text, giverName, giverPresent = true) {
  if (!giverName || !giverPresent) return NARRATOR;
  if (typeof text === 'string' && text.includes(giverName)) return NARRATOR;
  return giverName;
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

/**
 * A quest an NPC is willing to hand over, as an Accept / Not now question.
 *
 * Quests used to start the instant the child talked to someone: a second
 * word with Mrs. Ramirez after `desert_healer` silently began
 * `toxic_knowledge`, and from then on Mr. Chen refused his own main quest
 * with "busy with another job". The child never agreed to any of it.
 *
 * `swapsFrom` is set when another quest is already running. Accepting parks
 * that one — its step index is remembered, so nothing is lost — rather than
 * refusing the new giver outright.
 *
 * @param {{ id: string, title: string }} quest the quest on offer
 * @param {string} npcName who is offering
 * @param {{ id: string, title: string }|null} [active] the quest already running
 * @returns {object} a `dialogEvent` payload carrying `questOffer`
 */
export function questOfferDialog(quest, npcName, active = null) {
  const swapping = Boolean(active && active.id !== quest.id);
  const asking = offerPhrase(quest.title, npcName);
  const text = swapping
    ? `${asking}\n\nYou can come back to "${active.title}" after — `
      + `I'll remember where you got to.`
    : asking;

  return {
    speaker: npcName,
    text,
    choices: [
      { label: swapping ? 'Yes — switch to this' : "Yes, let's go" },
      { label: 'Not right now' },
    ],
    step: null,
    questOffer: { questId: quest.id, swapsFrom: swapping ? active.id : null },
  };
}

/**
 * Accept an offer: park whatever was running, then start the new quest.
 *
 * Parking keeps `stepIndex` in `state.pausedQuests` so a child who switches
 * does not silently lose progress, and `resumeParkedQuest` puts it back.
 *
 * @returns {object} the next state
 */
export function acceptQuestOffer(state, questId, startQuest) {
  let next = state;
  const running = state?.activeQuest;
  if (running?.id && running.id !== questId) {
    next = {
      ...next,
      pausedQuests: { ...(next.pausedQuests || {}), [running.id]: running.stepIndex ?? 0 },
      activeQuest: null,
    };
  }
  return startQuest(next, questId) || next;
}

/**
 * Put a parked quest back as the active one, at the step it was left on.
 * Returns the state unchanged when that quest was never parked.
 */
export function resumeParkedQuest(state, questId) {
  const parked = state?.pausedQuests?.[questId];
  if (parked === undefined) return state;
  const rest = { ...(state.pausedQuests || {}) };
  delete rest[questId];
  return {
    ...state,
    activeQuest: { id: questId, stepIndex: parked },
    pausedQuests: rest,
  };
}

/**
 * How an NPC asks for help without naming themselves.
 *
 * Quest titles are written from the outside — "Fix Mrs. Ramirez's Flat
 * Tire", "Fix Mr. Chen's Slipped Chain" — so quoting one back as the offer
 * made Mrs. Ramirez say her own name to the child. When the title names the
 * speaker, their possessive becomes "my" and the result is spoken plainly;
 * otherwise the title is quoted as before.
 *
 * @param {string} title the quest title
 * @param {string|null} npcName who is doing the asking
 * @returns {string} the question to put to the child
 */
export function offerPhrase(title, npcName) {
  const clean = String(title || '').trim();
  if (!clean) return 'Can you help me with something?';
  if (!npcName || !clean.includes(npcName)) {
    return `Want to help with "${clean}"?`;
  }

  // "Fix Mrs. Ramirez's Flat Tire" -> "fix my flat tire"
  let phrase = clean
    .replace(new RegExp(`${escapeForRegExp(npcName)}'s`, 'g'), 'my')
    .replace(new RegExp(escapeForRegExp(npcName), 'g'), 'me')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!phrase) return 'Can you help me with something?';
  return `Can you help me ${phrase}?`;
}

/** Escape a name so it can sit inside a RegExp. */
function escapeForRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
