/**
 * The save that was stuck one step past the bridge. Plan 0.1b.
 *
 * Plan 0.1 fixed the fresh path: scenes find `build_bridge` by id, so a
 * new game can finish Act 1. The review found the other half still
 * broken. A real save from the owner's machine —
 *
 *     { id: 'bridge_collapse', stepIndex: 15 }   // no stepId, v6
 *
 * — was written in the window after `weigh_samples` was inserted into
 * the quest but before step ids were stored. Its 15 already meant
 * `build_bridge`. The migration could not tell it from a pre-insertion
 * save, shifted it to 16, and stamped `complete_bridge`: the HUD said
 * "Step 17/17", the Dry Wash mounted no ghost beams, Mr. Chen gave his
 * first-visit line, and `act1.complete` stayed false. That save could
 * not finish Act 1 by any route.
 *
 * By number the two save shapes are identical, so this cannot be decided
 * by cleverness — it is decided by cost. A shift that lands on the step
 * which completes a quest skips the step before it; refusing that shift
 * at worst replays a step the child has already played. The tests below
 * pin both halves, so neither can be traded away for the other.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import QUESTS from '../src/renderer/game/data/quests.js';
import {
  migrateActiveQuest,
  QUEST_DATA_VERSION,
  stepIdAt,
  indexOfStepId,
} from '../src/renderer/game/systems/questSteps.js';

const BRIDGE = 'bridge_collapse';
const steps = QUESTS[BRIDGE].steps;

/** The step layout this test was written against. */
test('the quest still has the shape these cases describe', () => {
  // If a step is inserted or removed again, these indices move and every
  // case below would be checking the wrong thing.
  assert.equal(indexOfStepId(BRIDGE, 'weigh_samples'), 8);
  assert.equal(indexOfStepId(BRIDGE, 'build_bridge'), 15);
  assert.equal(indexOfStepId(BRIDGE, 'complete_bridge'), 16);
  assert.equal(steps.length, 17);
  assert.equal(steps[16].type, 'complete', 'the last step is the one that pays out');
  assert.equal(QUEST_DATA_VERSION, 2);
});

// ── the exact save from the review ─────────────────────────────────────────

test('the stuck save lands on build_bridge, not past it', () => {
  // Verbatim shape: v6, no stepId, no questDataVersion.
  const activeQuest = { id: 'bridge_collapse', stepIndex: 15 };
  const out = migrateActiveQuest(activeQuest, 0);

  assert.equal(out.stepId, 'build_bridge',
    'this is the save that could not finish Act 1');
  assert.equal(out.stepIndex, 15);
  assert.notEqual(out.stepId, 'complete_bridge');
});

test('the Dry Wash build gate opens for the migrated save', () => {
  // The gate the scene actually uses, against the migrated state — a
  // stepId that is merely correct in the save is no use if the scene
  // resolves it differently.
  const state = { activeQuest: migrateActiveQuest({ id: BRIDGE, stepIndex: 15 }, 0) };
  assert.equal(stepIdAt(BRIDGE, state.activeQuest.stepIndex), 'build_bridge');
});

// ── the pre-insertion saves the shift exists for ───────────────────────────

test('a true pre-insertion save still walks forward past weigh_samples', () => {
  // The whole reason for the shift: on the old layout these numbers meant
  // the step one place earlier in the list.
  // The old 16-step layout, for reference: ... 7 weigh_instruction,
  // 8 quiz_weight, 9 strength_intro, 10 test_material, 11 quiz_strength,
  // 12 tradeoff_lesson, 13 quiz_choice, 14 build_bridge, 15 complete_bridge.
  const cases = [
    [8, 'quiz_weight'],        // old 8 -> new 9
    [12, 'tradeoff_lesson'],   // old 12 -> new 13
    [14, 'build_bridge'],      // the pre-insertion build step, old 14 -> new 15
  ];
  for (const [stepIndex, expected] of cases) {
    const out = migrateActiveQuest({ id: BRIDGE, stepIndex }, 0);
    assert.equal(out.stepId, expected, `index ${stepIndex} must map to ${expected}`);
  }
});

test('a step below the insertion is left exactly where it was', () => {
  for (let i = 0; i < 8; i += 1) {
    const out = migrateActiveQuest({ id: BRIDGE, stepIndex: i }, 0);
    assert.equal(out.stepIndex, i, `index ${i} is below the insertion and must not move`);
    assert.equal(out.stepId, steps[i].id);
  }
});

test('no migrated save is ever dropped onto the payout step it did not earn', () => {
  // The rule, stated as the property it protects: whatever the input, a
  // save with no stepId never arrives at a `complete` step it was not
  // already sitting on.
  for (let i = 0; i <= 20; i += 1) {
    const out = migrateActiveQuest({ id: BRIDGE, stepIndex: i }, 0);
    if (out.stepId === 'complete_bridge') {
      assert.ok(i >= 16,
        `a save at index ${i} was moved onto complete_bridge (was ${steps[i]?.id ?? 'out of range'})`);
    }
  }
});

// ── saves that carry an id are untouched by any of this ───────────────────

test('a stepId in the save always wins over the number', () => {
  const out = migrateActiveQuest(
    { id: BRIDGE, stepIndex: 3, stepId: 'build_bridge' }, 0,
  );
  assert.equal(out.stepIndex, 15, 'the number is recomputed from the id');
  assert.equal(out.stepId, 'build_bridge');
});

test('a current-version save is not shifted at all', () => {
  const out = migrateActiveQuest({ id: BRIDGE, stepIndex: 15 }, QUEST_DATA_VERSION);
  assert.equal(out.stepId, 'build_bridge');
  assert.equal(out.stepIndex, 15);
});

// ── through the real save loader, not just the pure function ──────────────

test('loadGame brings the stuck save back to the build step', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  const { loadGame } = await import('../src/renderer/game/systems/saveSystem.js');

  // The save as it sat on disk: v6, mid-quest, no stepId, no
  // questDataVersion, with the coins and inventory the child had earned.
  store.set('bikebrowser_game_save', JSON.stringify({
    version: 6,
    player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
    activeQuest: { id: 'bridge_collapse', stepIndex: 15 },
    zuzubucks: 295,
    inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube'],
    completedQuests: ['flat_tire_repair'],
  }));

  const loaded = loadGame();
  assert.equal(loaded.activeQuest.stepId, 'build_bridge');
  assert.equal(loaded.activeQuest.stepIndex, 15);
  assert.equal(loaded.questDataVersion, QUEST_DATA_VERSION,
    'the loaded save must now say which layout it is on, so this never recurs');
  assert.equal(loaded.zuzubucks, 295, 'the migration must not cost the child their coins');
});
