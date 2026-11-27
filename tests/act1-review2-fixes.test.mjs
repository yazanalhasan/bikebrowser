/**
 * Regression tests for the second review pass (2026-11-26).
 *
 * One per MUST, as asked. Four of the six were regressions I introduced in
 * the previous push, so these exist to stop the same mistakes twice.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  triggerQuestRevealsForState,
  _drainPendingReveals,
  _debugGetAct1CompleteLocations,
} from '../src/renderer/game/systems/discoveryBridge.js';
import { WORLD_LOCATIONS } from '../src/renderer/game/data/worldMapData.js';
import { localCameraFit } from '../src/renderer/game/utils/localCameraFit.js';
import { spawnObstacles } from '../src/renderer/game/systems/obstacleSystem.js';
import { mountLayoutFlora } from '../src/renderer/game/systems/foragingScenery.js';
import {
  dialogForStep, listenerOpenedDialog, sfxForStep,
} from '../src/renderer/game/systems/questDialog.js';
import QUESTS from '../src/renderer/game/data/quests.js';

// ── MUST 1: the ending node must leave the fog ──────────────────────────────

test('MUST1: Act 1 completion reveals the ending node', () => {
  // The node is found from the data, not named here, so adding another
  // act1-gated location is covered automatically.
  const milestone = _debugGetAct1CompleteLocations();
  assert.ok(milestone.includes('wider_earth_gate'), 'the ending node is a milestone reveal');
  for (const id of milestone) {
    assert.ok(WORLD_LOCATIONS[id], `${id} must be a real world location`);
  }

  _drainPendingReveals(null); // start clean

  triggerQuestRevealsForState({ completedQuests: [], act1: { complete: false } });
  assert.deepEqual(
    _drainPendingReveals(null), [],
    'nothing is revealed before Act 1 is done',
  );

  triggerQuestRevealsForState({ completedQuests: [], act1: { complete: true } });
  assert.deepEqual(
    _drainPendingReveals(null), ['wider_earth_gate'],
    'the ending node is queued once Act 1 is stamped',
  );
});

test('MUST1: every act1-gated location is on the milestone list', () => {
  // Positive-coverage sentinel: a location gated on act1Complete that nothing
  // reveals is unreachable, which is exactly the bug.
  const gated = Object.values(WORLD_LOCATIONS)
    .filter((l) => l?.unlockReq?.act1Complete)
    .map((l) => l.id);
  assert.ok(gated.length > 0, 'there is at least one act1-gated location');
  assert.deepEqual([...gated].sort(), [..._debugGetAct1CompleteLocations()].sort());
});

// ── MUST 4 / 5: camera framing ──────────────────────────────────────────────

const GARAGE = { worldWidth: 800, worldHeight: 600 };
const STREET = { worldWidth: 1000, worldHeight: 700 };

test('MUST5: a rig shows its whole room and never follows', () => {
  // 1280x720 used to show 800x450 of the 800x600 Materials Lab, so the top of
  // the material list and the START TEST button were never on screen together.
  const fit = localCameraFit({ camWidth: 1280, camHeight: 720, ...GARAGE, mode: 'contain' });
  assert.equal(fit.followY, false, 'a control panel must not chase the player');
  assert.ok(fit.viewHeight >= GARAGE.worldHeight, 'the whole room height is visible');
  assert.ok(fit.viewWidth >= GARAGE.worldWidth, 'the whole room width is visible');
  assert.equal(fit.showsWholeRoom, true);
});

test('MUST5: contain fit holds at short and phone sizes too', () => {
  for (const size of [
    { camWidth: 1024, camHeight: 484 },
    { camWidth: 390, camHeight: 844 },
    { camWidth: 1920, camHeight: 911 },
  ]) {
    const fit = localCameraFit({ ...size, ...GARAGE, mode: 'contain' });
    assert.equal(fit.showsWholeRoom, true, `whole room at ${size.camWidth}x${size.camHeight}`);
    assert.equal(fit.followY, false);
  }
});

test('MUST5: walking rooms still use cover fit', () => {
  const fit = localCameraFit({ camWidth: 1280, camHeight: 720, ...STREET });
  assert.equal(fit.mode, 'cover');
  assert.equal(fit.fillsWidth, true);
});

test('MUST4: a phone fits the room by shrinking it, which is where bands broke', () => {
  // The frame used to paint letterbox bands with setScrollFactor(0), which
  // Phaser still scales by zoom about the viewport centre. Below zoom 1 the
  // bands collapsed inward into a block over the middle of the room. This
  // test pins the condition that exposed it: phone zoom really is < 1.
  const garage = localCameraFit({ camWidth: 390, camHeight: 844, ...GARAGE });
  const street = localCameraFit({ camWidth: 390, camHeight: 844, ...STREET });
  assert.ok(garage.zoom < 1, `garage phone zoom ${garage.zoom} must be below 1`);
  assert.ok(street.zoom < 1, `street phone zoom ${street.zoom} must be below 1`);
  // And the room must still be fully across the screen at that zoom.
  assert.ok(garage.viewWidth >= GARAGE.worldWidth);
  assert.ok(street.viewWidth >= STREET.worldWidth);
});

// ── MUST 3: one press, one item; one solve, one payout ──────────────────────

function makeScene(sceneKey, state) {
  const registry = new Map([['gameState', state]]);
  const noop = () => {};
  const chainable = () => {
    const o = new Proxy({ x: 0, y: 0, depth: 0, alpha: 1, active: true, visible: true },
      { get: (t, k) => (k in t ? t[k] : () => o) });
    return o;
  };
  const interactables = [];
  return {
    _interactables: interactables,
    getSceneKey: () => sceneKey,
    scene: { key: sceneKey },
    registry: {
      get: (k) => registry.get(k),
      set: (k, v) => registry.set(k, v),
      events: { on: noop, off: noop, emit: noop },
    },
    add: new Proxy({}, { get: () => chainable }),
    events: { on: noop, off: noop, once: noop, emit: noop },
    tweens: { add: noop, killTweensOf: noop },
    time: { delayedCall: noop },
    cameras: { main: { zoom: 1 } },
    physics: { add: { existing: noop, overlap: noop, collider: noop } },
    player: { sprite: { x: 0, y: 0, active: true } },
    addVisibleWall: chainable,
    addProp: chainable,
    addGroundTexture: chainable,
    hasArtTexture: () => false,
    addInteractable: (cfg) => {
      const entry = { ...cfg, prompt: null, nameLabel: null, text: null };
      interactables.push(entry);
      return entry;
    },
    removeInteractable(entry) {
      const at = interactables.indexOf(entry);
      if (at !== -1) interactables.splice(at, 1);
    },
  };
}

test('MUST3a: a solved puzzle cannot be re-solved in the same visit', () => {
  const scene = makeScene('DesertEdgeScene', {
    inventory: ['prickly_pear_fruit', 'prickly_pear_fruit'],
    zuzubucks: 0, reputation: 0, solvedObstacles: [], completedQuests: [], activeQuest: null,
  });
  spawnObstacles(scene);
  const puzzle = scene._interactables.find((i) => i.label === 'Wilted Plant');
  assert.ok(puzzle);

  puzzle.onInteract();
  assert.equal(scene.registry.get('gameState').zuzubucks, 10, 'paid once');
  // The hotspot is taken away on solve...
  assert.equal(
    scene._interactables.includes(puzzle), false,
    'the spent hotspot is removed',
  );
  // ...and a press that was already queued is refused rather than paying again.
  puzzle.onInteract();
  const after = scene.registry.get('gameState');
  assert.equal(after.zuzubucks, 10, 'a second press must not pay again');
  assert.equal(
    after.inventory.filter((i) => i === 'prickly_pear_fruit').length, 1,
    'the second fruit is not eaten',
  );
  assert.match(
    scene.registry.get('dialogEvent').text, /green again/i,
    'and the child is told it is already done',
  );
});

test('MUST3b: one forage interaction grants exactly one item', () => {
  // `registerEntity` defaults grantsItemId from SCENE_ITEM_GRANTS, and
  // emitForage then granted it a second time on top of the scene's own grant.
  const scene = makeScene('DesertEdgeScene', {
    inventory: [], zuzubucks: 0, solvedObstacles: [], completedQuests: [],
    activeQuest: { id: 'desert_healer', stepIndex: 1 },
  });
  const plants = [{ species: 'creosote', label: 'Creosote Bush', x: 100, y: 100, radius: 50 }];
  const { entities } = mountLayoutFlora(scene, plants, { sceneKey: 'DesertEdgeScene' });

  assert.equal(entities.length, 1);
  assert.equal(
    entities[0].grantsItemId, null,
    'the substrate must not also grant — the scene flow owns that',
  );

  const hotspot = scene._interactables.find((i) => i.label === 'Creosote Bush');
  hotspot.onInteract();

  const inv = scene.registry.get('gameState').inventory;
  assert.equal(
    inv.filter((i) => i === 'creosote_leaves').length, 1,
    `one press must add one item, got ${JSON.stringify(inv)}`,
  );
});

// ── MUST 6: the conversation must not close on every Continue ───────────────

test('MUST6: every step type keeps the dialog open, spoken by the giver', () => {
  const state = { activeQuest: { id: 'desert_healer', stepIndex: 0 } };
  const types = ['dialogue', 'forage', 'craft', 'use_item', 'observe', 'inspect', 'complete'];
  for (const type of types) {
    const d = dialogForStep({ type, id: `s_${type}`, text: 'Next thing.' }, state, 'Mrs. Ramirez');
    assert.ok(d, `${type} must still show a dialog`);
    assert.equal(d.speaker, 'Mrs. Ramirez', `${type} is spoken by the quest giver`);
    assert.equal(d.choices, null, `${type} has no choices`);
    assert.equal(d.step.type, type);
  }
});

test('MUST6: a real desert_healer chain stays open at every step', () => {
  // The quest the reviewer counted five E presses on.
  const quest = QUESTS.desert_healer;
  assert.ok(quest, 'desert_healer still exists');
  const state = { activeQuest: { id: 'desert_healer', stepIndex: 0 } };
  for (const step of quest.steps) {
    if (step.type === 'explainer' && step.explainerId) continue;
    assert.ok(
      dialogForStep(step, state, 'Mrs. Ramirez'),
      `step ${step.id} (${step.type}) must keep the box open`,
    );
  }
});

test('MUST6: quizzes still speak as Zuzu and keep their choices', () => {
  const state = { activeQuest: { id: 'q', stepIndex: 0 } };
  const d = dialogForStep(
    { type: 'quiz', text: 'Which one?', choices: ['a', 'b'] }, state, 'Mr. Chen',
  );
  assert.equal(d.speaker, 'Zuzu (thinking)');
  assert.deepEqual(d.choices, ['a', 'b']);
});

test('MUST6: template tokens are interpolated, not shown raw', () => {
  // `templateVars` is an array of names; the values come from save state.
  const state = {
    activeQuest: { id: 'bridge_collapse', stepIndex: 0 },
    materialTestsCompleted: ['steel', 'mesquite_wood'],
  };
  const d = dialogForStep(
    {
      type: 'quiz',
      text: 'Load test results: {strengthTable}\n\nWhich holds up best?',
      templateVars: ['strengthTable'],
    },
    state, null,
  );
  assert.doesNotMatch(d.text, /\{strengthTable\}/, 'no raw token reaches the child');
});

test('MUST6: the real bridge quiz step interpolates its table', () => {
  // The exact step the reviewer saw showing "{strengthTable}" raw.
  const step = QUESTS.bridge_collapse.steps.find((s) => s.id === 'quiz_strength');
  assert.ok(step, 'quiz_strength still exists');
  const d = dialogForStep(step, {
    activeQuest: { id: 'bridge_collapse', stepIndex: 0 },
    materialTestsCompleted: ['steel'],
  }, null);
  assert.doesNotMatch(d.text, /\{strengthTable\}/);
});

test('MUST6: an explainer step yields no dialog (its overlay takes over)', () => {
  assert.equal(
    dialogForStep({ type: 'explainer', explainerId: 'silent_leak', text: 'x' }, {}, 'X'),
    null,
  );
});

test('MUST6: nothing follows a finished quest', () => {
  assert.equal(dialogForStep(null, {}, 'X'), null);
});

test('MUST6: use_item steps get their own sound again', () => {
  assert.deepEqual(sfxForStep({ type: 'use_item', id: 'use_lever' }),
    { key: 'wrench_turn', opts: { vary: true } });
  assert.deepEqual(sfxForStep({ type: 'use_item', id: 'use_patch' }),
    { key: 'patch_apply', opts: { vary: true } });
  assert.deepEqual(sfxForStep({ type: 'use_item', id: 'other' }), { key: 'item_pickup' });
  assert.deepEqual(sfxForStep({ type: 'dialogue' }), { key: 'ui_success' });
});

// ── MUST 2: a dialog opened by a listener must survive the advance ──────────

test('MUST2: a dialog opened during the state write is kept', () => {
  // The end-of-Act-1 celebration runs synchronously inside the
  // `changedata-gameState` listener, i.e. in the middle of advanceFromDialog.
  const celebration = { speaker: 'Zuzu', text: 'I did it!' };
  assert.equal(listenerOpenedDialog(null, celebration), true, 'from nothing -> kept');
  assert.equal(listenerOpenedDialog({ speaker: 'X' }, celebration), true, 'replaced -> kept');
});

test('MUST2: an untouched or cleared dialog is not mistaken for a new one', () => {
  const same = { speaker: 'X' };
  assert.equal(listenerOpenedDialog(same, same), false, 'unchanged -> may close');
  assert.equal(listenerOpenedDialog(same, null), false, 'cleared -> may close');
  assert.equal(listenerOpenedDialog(null, null), false);
});
