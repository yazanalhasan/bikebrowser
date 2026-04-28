/**
 * gameHud.js — Non-Phaser HUD helpers.
 *
 * The actual HUD rendering is done by React in GameContainer.jsx.
 * This module provides derived-state helpers so the React layer can
 * quickly compute what to show without reaching into quest/item internals.
 */

import QUESTS from '../data/quests.js';
import ITEMS from '../data/items.js';
import {
  formatWorkbenchRecipeNote,
  getKnownWorkbenchRecipes,
} from '../data/workbenchRecipes.js';

/** Return a short quest tracker string for the HUD. */
export function getQuestSummary(state) {
  if (!state?.activeQuest) return null;

  const quest = QUESTS[state.activeQuest.id];
  if (!quest) return null;

  const step = quest.steps[state.activeQuest.stepIndex];
  const progress = `${state.activeQuest.stepIndex + 1}/${quest.steps.length}`;

  let stepHint = null;
  if (step?.type === 'use_item') {
    stepHint = `Need: ${ITEMS[step.requiredItem]?.icon || ''} ${ITEMS[step.requiredItem]?.name || step.requiredItem}`;
  } else if (step?.type === 'quiz') {
    stepHint = 'Answer the question!';
  } else if (step?.type === 'dialogue') {
    stepHint = 'Talk to continue...';
  } else if (step?.type === 'inspect') {
    stepHint = 'Look closely...';
  } else if (step?.type === 'complete') {
    stepHint = 'Almost done!';
  }

  return { title: quest.title, progress, stepHint };
}

/** Build a displayable inventory list. */
export function getInventoryDisplay(itemIds = []) {
  const counts = {};
  for (const id of itemIds) {
    counts[id] = (counts[id] || 0) + 1;
  }

  return Object.entries(counts).map(([id, count]) => {
    const item = ITEMS[id] || fallbackItem(id);
    return { ...item, count };
  });
}

/**
 * Synthesize display metadata for an item id that isn't registered in
 * ITEMS. Prevents collected items from silently vanishing when a scene
 * adds a resource whose id hasn't been wired into data/items.js yet.
 */
function fallbackItem(id) {
  const name = id
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id,
    name,
    icon: '📦',
    category: 'misc',
    stackable: true,
    description: 'Collected item.',
  };
}

/** Build journal entries for the notebook panel. */
export function getJournalEntries(state) {
  const journal = [...(state?.journal || [])];
  const recipeNotes = getKnownWorkbenchRecipes(state).map(formatWorkbenchRecipeNote);

  for (const note of recipeNotes) {
    if (!journal.includes(note)) journal.push(note);
  }

  return journal.reverse();
}
