/**
 * Puzzle solving must stick, cost something, and pay once.
 *
 * Review MUST #1 (2026-11-26): `_handlePuzzleInteract` marked the puzzle
 * solved in one state write and then paid the reward from the *pre-solve*
 * copy in a second write, which wiped `solvedObstacles` in memory and on
 * disk. The wilted plant therefore re-spawned on every visit and paid +10
 * Zuzubucks each time — a money tap a child could hold down.
 *
 * These tests drive the real module through a fake scene, so they fail if
 * the two-write pattern comes back.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { spawnObstacles } from '../src/renderer/game/systems/obstacleSystem.js';
import { SCENE_OBSTACLES } from '../src/renderer/game/data/obstacles.js';
import { getSceneObstacles } from '../src/renderer/game/data/obstacles.js';

/** Minimal stand-in for a Phaser scene: just enough for obstacleSystem. */
function makeScene(sceneKey, state) {
  const registry = new Map([['gameState', state]]);
  const noop = () => {};
  const chainable = () => {
    const o = {
      setDepth: () => o, setStrokeStyle: () => o, setOrigin: () => o,
      setVisible: () => o, setFillStyle: () => o, setAlpha: () => o,
      setPosition: () => o, setScale: () => o, setBlendMode: () => o,
      fillStyle: () => o, fillRect: () => o, fillRoundedRect: () => o,
      strokeRoundedRect: () => o, lineStyle: () => o, lineBetween: () => o,
      fillCircle: () => o, strokeCircle: () => o, destroy: noop,
      add: () => o, x: 0, y: 0, depth: 0, alpha: 1, active: true,
    };
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
      events: { on: noop, off: noop },
    },
    add: {
      text: chainable, rectangle: chainable, graphics: chainable,
      circle: chainable, triangle: chainable, container: chainable,
      image: chainable, ellipse: chainable,
    },
    events: { on: noop, off: noop },
    tweens: { add: noop, killTweensOf: noop },
    time: { delayedCall: noop },
    cameras: { main: { zoom: 1 } },
    physics: { add: { existing: noop, overlap: noop, collider: noop } },
    player: { sprite: { x: 0, y: 0, active: true } },
    addVisibleWall: chainable,
    addInteractable: (cfg) => { interactables.push(cfg); return cfg; },
    hasArtTexture: () => false,
    addProp: chainable,
    addGroundTexture: chainable,
  };
}

function baseState(overrides = {}) {
  return {
    inventory: ['prickly_pear_fruit'],
    zuzubucks: 0,
    reputation: 0,
    solvedObstacles: [],
    completedQuests: [],
    activeQuest: null,
    ...overrides,
  };
}

/** Solve the wilted plant through the real interactable the system spawns. */
function solveWiltedPlant(scene) {
  const spawned = spawnObstacles(scene);
  const puzzle = scene._interactables.find((i) => i.label === 'Wilted Plant');
  assert.ok(puzzle, 'the wilted plant must spawn as an interactable');
  puzzle.onInteract();
  return spawned;
}

test('solving the wilted plant persists in a single state write', () => {
  const scene = makeScene('DesertEdgeScene', baseState());
  solveWiltedPlant(scene);

  const after = scene.registry.get('gameState');
  assert.ok(
    after.solvedObstacles.includes('wilted_plant'),
    'solvedObstacles must survive the reward write',
  );
  assert.equal(after.zuzubucks, 10, 'reward paid once');
});

test('the wilted plant cannot be farmed for Zuzubucks', () => {
  // First solve, then re-enter the scene with the state it produced.
  const first = makeScene('DesertEdgeScene', baseState());
  solveWiltedPlant(first);
  const carried = first.registry.get('gameState');
  assert.equal(carried.zuzubucks, 10);

  const revisit = makeScene('DesertEdgeScene', carried);
  spawnObstacles(revisit);
  const stillThere = revisit._interactables.find((i) => i.label === 'Wilted Plant');
  assert.equal(stillThere, undefined, 'a solved puzzle must not spawn again');
  assert.equal(
    revisit.registry.get('gameState').zuzubucks, 10,
    'returning must not pay a second time',
  );
});

test('solving spends the item that solved it', () => {
  const scene = makeScene('DesertEdgeScene', baseState());
  solveWiltedPlant(scene);
  const after = scene.registry.get('gameState');
  assert.equal(
    after.inventory.includes('prickly_pear_fruit'), false,
    'the fruit is used up, not kept',
  );
});

test('an unsolved puzzle does not pay out when its item is missing', () => {
  const scene = makeScene('DesertEdgeScene', baseState({ inventory: [] }));
  solveWiltedPlant(scene);
  const after = scene.registry.get('gameState');
  assert.equal(after.zuzubucks, 0, 'no reward without the fruit');
  assert.deepEqual(after.solvedObstacles, [], 'not marked solved');
});

test('each reward field is guarded on itself', () => {
  // The old code tested `reward.xp` and then added `reward.reputation`.
  // broken_fence pays reputation; wilted_plant pays zuzubucks. Both must land.
  const fence = SCENE_OBSTACLES.DogParkScene.puzzles.find((p) => p.id === 'broken_fence');
  assert.ok(fence.reward.reputation > 0, 'fixture still pays reputation');

  const scene = makeScene('DogParkScene', baseState({ inventory: ['wrench'] }));
  spawnObstacles(scene);
  scene._interactables.find((i) => i.label === 'Broken Fence').onInteract();

  const after = scene.registry.get('gameState');
  assert.equal(after.reputation, fence.reward.reputation, 'reputation reward lands');
  assert.ok(after.solvedObstacles.includes('broken_fence'));
});

test('the wilted plant no longer promises a path it does not open', () => {
  const puzzle = getSceneObstacles('DesertEdgeScene').puzzles
    .find((p) => p.id === 'wilted_plant');
  assert.doesNotMatch(
    puzzle.successMessage, /hidden path/i,
    'no hidden path is opened, so do not send a child looking for one',
  );
});
