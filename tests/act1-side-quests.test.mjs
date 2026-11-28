/**
 * Side quests at the mine, the foraging grounds and the river.
 *
 * Pete's "Start Copper Quest!" answered with the bridge quest's hint and
 * started nothing: nothing in the codebase handled `side_quest_offer` or a
 * choice with `action: 'start_quest'`, so the offer fell through to the
 * main-quest advance. The arrival toast counted quests the kid could not
 * take, and talking to a giver mid-quest reset the quest to step 0.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSideQuest,
  getSideQuestsForLocation,
  getOfferableSideQuests,
  getActiveSideQuestAt,
  sideQuestDialogAction,
  startSideQuest,
  getCurrentSideStep,
  advanceSideQuest,
} from '../src/renderer/game/systems/sideQuestSystem.js';
import ITEMS, { itemName } from '../src/renderer/game/data/items.js';

const LOCATIONS = ['copper_mine', 'desert_foraging', 'salt_river'];

// ── the offer is wired up ──────────────────────────────────────────────────

test('accepting an offer asks the scene to start that quest', () => {
  const dialog = {
    speaker: 'Old Miner Pete',
    choices: [
      { label: 'Start Copper Quest!', action: 'start_quest', questId: 'collect_copper_samples' },
      { label: 'Just looking around', action: 'dismiss' },
    ],
    step: { type: 'side_quest_offer', questId: 'collect_copper_samples' },
  };
  assert.deepEqual(sideQuestDialogAction(dialog, 0),
    { kind: 'start', questId: 'collect_copper_samples' });
});

test('declining an offer starts nothing', () => {
  const dialog = {
    choices: [
      { label: 'Start Copper Quest!', action: 'start_quest', questId: 'collect_copper_samples' },
      { label: 'Just looking around', action: 'dismiss' },
    ],
    step: { type: 'side_quest_offer', questId: 'collect_copper_samples' },
  };
  assert.equal(sideQuestDialogAction(dialog, 1).kind, 'decline');
  // Closing the box without choosing is a decline too, never a silent start.
  assert.equal(sideQuestDialogAction(dialog, undefined).kind, 'decline');
});

test('a running side quest advances itself, not the main quest', () => {
  const dialog = {
    step: { id: 'gather_yucca', type: 'forage', isSideQuest: true, questId: 'collect_desert_fibers' },
  };
  assert.deepEqual(sideQuestDialogAction(dialog, 0),
    { kind: 'advance', questId: 'collect_desert_fibers' });
});

test('main-quest dialogs are left alone', () => {
  // This is the regression that caused the bug: anything that is not a side
  // quest must still reach LocalSceneBase.advanceFromDialog.
  assert.equal(sideQuestDialogAction({ step: { id: 'collect_copper', type: 'forage' } }, 0), null);
  assert.equal(sideQuestDialogAction({ step: null }, 0), null);
  assert.equal(sideQuestDialogAction(null, 0), null);
});

// ── the arrival toast counts what the kid can take ─────────────────────────

test('every location with two quests gates the second one in data', () => {
  // The prerequisite used to live in scene code as "&& fiberQuest?.completed",
  // once per scene. Keep it in the quest data.
  for (const location of LOCATIONS) {
    const quests = getSideQuestsForLocation(location);
    assert.equal(quests.length, 2, `${location} should define two side quests`);
    const gated = quests.filter((q) => Array.isArray(q.requires) && q.requires.length);
    assert.equal(gated.length, 1, `${location} should gate exactly one quest`);
    assert.ok(getSideQuest(gated[0].requires[0]), 'the prerequisite must exist');
  }
});

test('a fresh arrival can only take the first quest', () => {
  for (const location of LOCATIONS) {
    const offerable = getOfferableSideQuests(location, {});
    assert.equal(offerable.length, 1, `${location} offered ${offerable.length} on arrival`);
    assert.equal(offerable[0].requires, undefined);
  }
});

test('finishing the first quest unlocks the second', () => {
  const first = getOfferableSideQuests('copper_mine', {})[0];
  const state = { sideQuests: { [first.id]: { id: first.id, stepIndex: 9, completed: true } } };
  const offerable = getOfferableSideQuests('copper_mine', state);
  assert.equal(offerable.length, 1);
  assert.deepEqual(offerable[0].requires, [first.id]);
});

test('a quest already under way is not offered again', () => {
  const state = {
    sideQuests: { collect_copper_samples: { id: 'collect_copper_samples', stepIndex: 1, completed: false } },
  };
  assert.equal(getOfferableSideQuests('copper_mine', state).length, 0);
  assert.equal(getActiveSideQuestAt('copper_mine', state).id, 'collect_copper_samples');
});

test('nothing is under way before the kid takes a quest', () => {
  assert.equal(getActiveSideQuestAt('salt_river', {}), null);
});

// ── talking to the giver again resumes ─────────────────────────────────────

test('re-starting a quest in progress keeps the kid where they were', () => {
  let state = startSideQuest({}, 'collect_copper_samples').state;
  state = {
    ...state,
    sideQuests: { ...state.sideQuests, collect_copper_samples: { id: 'collect_copper_samples', stepIndex: 2, completed: false } },
  };
  const stepBefore = getCurrentSideStep(state, 'collect_copper_samples');

  const again = startSideQuest(state, 'collect_copper_samples');
  assert.ok(again.ok, 'the giver should be able to resume the quest');
  assert.equal(again.state.sideQuests.collect_copper_samples.stepIndex, 2);
  assert.deepEqual(getCurrentSideStep(again.state, 'collect_copper_samples'), stepBefore);
});

test('a finished quest is not restarted', () => {
  const state = { sideQuests: { balance_the_flow: { id: 'balance_the_flow', stepIndex: 3, completed: true } } };
  assert.equal(startSideQuest(state, 'balance_the_flow').ok, false);
});

// ── never show a child a raw id ────────────────────────────────────────────

test('a side quest asks for an item by name, not by id', () => {
  const state = { sideQuests: { collect_copper_samples: { id: 'collect_copper_samples', stepIndex: 0, completed: false } }, inventory: [] };
  const result = advanceSideQuest(state, 'collect_copper_samples', undefined);
  assert.equal(result.ok, false);
  assert.match(result.message, /Surface Copper/);
  assert.doesNotMatch(result.message, /_/, `raw id leaked: ${result.message}`);
});

test('every side-quest forage target has a real item name', () => {
  // A missing entry falls back to the id with underscores stripped, which
  // reads like a bug ("agave fiber" vs "Agave Fiber"). Catch it here rather
  // than in front of a child.
  for (const location of LOCATIONS) {
    for (const quest of getSideQuestsForLocation(location)) {
      for (const step of quest.steps) {
        if (step.type !== 'forage' || !step.target) continue;
        assert.ok(ITEMS[step.target],
          `${quest.id}/${step.id} forages "${step.target}", which is not in items.js`);
        assert.equal(itemName(step.target), ITEMS[step.target].name);
      }
    }
  }
});
