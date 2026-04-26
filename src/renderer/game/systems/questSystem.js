/**
 * Quest system — drives quest progression, step advancement, and rewards.
 *
 * Pure functions that operate on save state. The Phaser scene calls these
 * and then persists the result via saveSystem.
 */

import QUESTS from '../data/quests.js';
import { addItem, hasItem } from './inventorySystem.js';
import { onRegionDiscovered } from './discoverySystem.js';
import DISCOVERY_UNLOCKS from '../data/discoveryUnlocks.js';

// ── Discovery → Quest Bridge ─────────────────────────────────────────────────

/**
 * Pending quest unlocks queued by the discovery bridge.
 * Stored as an array of questId strings. Consumed by callers via
 * `consumePendingDiscoveryUnlocks(state)`.
 * @type {string[]}
 */
const _pendingDiscoveryUnlocks = [];

/**
 * Wire discovery events to quest unlocks.
 *
 * Call once at boot (e.g. from GameContainer after quest system is ready).
 * Registers an `onRegionDiscovered` listener that queues quest IDs for
 * non-pending entries in DISCOVERY_UNLOCKS. Queued IDs are consumed by
 * `consumePendingDiscoveryUnlocks(state)` which scenes call on their
 * next interaction checkpoint.
 *
 * Idempotent within a session — safe to call more than once (no duplicate
 * listeners are added because each call registers a distinct closure, but
 * calling multiple times is a no-op as both closures do the same work and
 * `startQuest` already guards against duplicate starts).
 */
export function initDiscoveryQuestBridge() {
  onRegionDiscovered(({ regionId }) => {
    const spec = DISCOVERY_UNLOCKS[regionId];
    if (!spec || spec.pending) return;
    const questId = spec.questId;
    if (!questId) return;
    if (!QUESTS[questId]) {
      // eslint-disable-next-line no-console
      console.warn(`[discovery→quest] quest "${questId}" not found in QUESTS — skipping`);
      return;
    }
    if (!_pendingDiscoveryUnlocks.includes(questId)) {
      _pendingDiscoveryUnlocks.push(questId);
      // eslint-disable-next-line no-console
      console.log(`[discovery→quest] queued unlock for quest "${questId}" (region: ${regionId})`);
    }
  });
}

/**
 * Consume any discovery-triggered quest unlock queue.
 *
 * Call this from scene checkpoints (e.g. NPC interaction, scene entry) where
 * it is natural to offer the player a new quest. The functional quest pattern
 * is preserved: this returns an updated state, leaving persistence to the caller.
 *
 * @param {object} state — current game save state
 * @returns {object} Updated state with any queued quests started (if none were
 *   active and the quests are valid). If nothing was consumed, returns `state`
 *   unchanged.
 */
export function consumePendingDiscoveryUnlocks(state) {
  if (_pendingDiscoveryUnlocks.length === 0) return state;

  let current = state;
  // Drain the queue — splice as we go so partial consumption is safe.
  while (_pendingDiscoveryUnlocks.length > 0) {
    const questId = _pendingDiscoveryUnlocks[0];
    const updated = startQuest(current, questId);
    if (updated) {
      // Successfully started — advance state.
      current = updated;
      _pendingDiscoveryUnlocks.splice(0, 1);
      // startQuest only allows one active quest at a time — stop if we started one.
      if (current.activeQuest) break;
    } else {
      // Can't start (busy / already done) — remove from queue and move on.
      _pendingDiscoveryUnlocks.splice(0, 1);
    }
  }

  return current;
}

/**
 * Start a quest by id. Returns updated save state, or null if already active.
 */
export function startQuest(state, questId) {
  if (state.activeQuest) return null; // one at a time for now
  if (state.completedQuests.includes(questId)) return null; // already done

  const quest = QUESTS[questId];
  if (!quest) return null;

  return {
    ...state,
    activeQuest: { id: questId, stepIndex: 0 },
    journal: [
      ...state.journal,
      `📋 New quest: ${quest.title}`,
    ],
  };
}

/** Get the current step object for the active quest, or null. */
export function getCurrentStep(state) {
  if (!state.activeQuest) return null;
  const quest = QUESTS[state.activeQuest.id];
  if (!quest) return null;
  return quest.steps[state.activeQuest.stepIndex] || null;
}

/** Get full quest metadata for the active quest. */
export function getActiveQuest(state) {
  if (!state.activeQuest) return null;
  return QUESTS[state.activeQuest.id] || null;
}

/**
 * Try to advance to the next step.
 *
 * For 'use_item' steps, verifies the item is in inventory.
 * For 'quiz' steps, the caller must pass `choiceIndex` for the selected answer.
 *
 * Returns { state, ok, message } — ok is false if blocked.
 */
export function advanceQuest(state, choiceIndex) {
  const step = getCurrentStep(state);
  if (!step) return { state, ok: false, message: 'No active quest.' };

  const quest = QUESTS[state.activeQuest.id];

  // --- Handle requirements based on step type ---------------------------------
  if (step.type === 'use_item') {
    if (!hasItem(state.inventory, step.requiredItem)) {
      return {
        state,
        ok: false,
        message: step.hint || `You need: ${step.requiredItem}`,
      };
    }
  }

  if (step.type === 'forage') {
    if (!hasItem(state.inventory, step.requiredItem)) {
      return {
        state,
        ok: false,
        message: step.hint || `Forage to find: ${step.requiredItem}`,
      };
    }
  }

  if (step.type === 'craft') {
    const resultItem = step.requiredRecipe;
    if (!hasItem(state.inventory, resultItem)) {
      return {
        state,
        ok: false,
        message: step.hint || `Craft the required item first.`,
      };
    }
  }

  if (step.type === 'observe') {
    // Observe steps auto-advance when the player is near the target
    // The scene handles detection; if we reach advanceQuest, it's met
  }

  if (step.type === 'quiz') {
    if (choiceIndex === undefined || choiceIndex === null) {
      return { state, ok: false, message: 'Pick an answer first.' };
    }
    const choice = step.choices[choiceIndex];
    if (!choice?.correct) {
      return { state, ok: false, message: 'Hmm, not quite — try again!' };
    }
  }

  // --- Advance -----------------------------------------------------------------
  const nextIndex = state.activeQuest.stepIndex + 1;

  // If we just completed the last step, finish the quest.
  if (nextIndex >= quest.steps.length) {
    return finishQuest(state, quest);
  }

  return {
    state: {
      ...state,
      activeQuest: { ...state.activeQuest, stepIndex: nextIndex },
    },
    ok: true,
    message: null,
  };
}

/** Internal — complete the quest, grant rewards, clear active quest. */
function finishQuest(state, quest) {
  let inventory = [...state.inventory];
  const upgrades = [...state.upgrades];

  // Grant reward items.
  for (const itemId of quest.reward?.items || []) {
    inventory = addItem(inventory, itemId);
    if (itemId === 'basic_pump' || itemId.startsWith('upgrade_')) {
      upgrades.push(itemId);
    }
  }

  const earnedBucks = quest.reward?.zuzubucks || 0;
  const earnedRep = quest.reward?.reputation || 0;

  const journalEntries = [
    `✅ Quest complete: ${quest.title}`,
    ...(quest.reward?.items || []).map((id) => `🎁 Received: ${id}`),
  ];
  if (earnedBucks > 0) journalEntries.push(`💰 Earned ${earnedBucks} Zuzubucks!`);
  if (earnedRep > 0) journalEntries.push(`⭐ Reputation +${earnedRep}`);

  return {
    state: {
      ...state,
      inventory,
      upgrades,
      zuzubucks: (state.zuzubucks || 0) + earnedBucks,
      reputation: (state.reputation || 0) + earnedRep,
      completedQuests: [...state.completedQuests, quest.id],
      activeQuest: null,
      journal: [...state.journal, ...journalEntries],
    },
    ok: true,
    message: 'Quest complete!',
  };
}
