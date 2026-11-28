/**
 * A quest step is found by its id, never by its position.
 *
 * `scenes/DryWashScene.js` held `BUILD_STEP_INDEX = 14`. Inserting
 * `weigh_samples` into `bridge_collapse` moved `build_bridge` to 15, so the
 * Dry Wash fell through to Mr. Chen's first-visit line with no beams, and
 * Act 1 could not be finished on a new save at all. The number was right
 * when it was written and wrong the moment a step was added above it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import QUESTS from '../src/renderer/game/data/quests.js';
import {
  stepIdAt, indexOfStepId, isOnStep, migrateActiveQuest, withStepId,
  QUEST_DATA_VERSION,
} from '../src/renderer/game/systems/questSteps.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

function gameSources(dir = 'src/renderer/game', acc = []) {
  const base = new URL(`../${dir}/`, import.meta.url);
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) gameSources(rel, acc);
    else if (/\.(js|jsx)$/.test(entry.name)) acc.push(rel);
  }
  return acc;
}

// ── no scene gates on a step number ────────────────────────────────────────

test('nothing live compares stepIndex to a literal number', () => {
  // A save migration is the one place a number is right: it describes the
  // step layout as it was at that save version, which cannot change
  // retroactively. Everything else must ask by id. Tracking the enclosing
  // function keeps that exemption narrow instead of skipping the file.
  const offenders = [];
  for (const file of gameSources()) {
    let fn = '';
    for (const [i, line] of read(file).split('\n').entries()) {
      const declared = line.match(/^\s*(?:export\s+)?function\s+([A-Za-z0-9_]+)/);
      if (declared) fn = declared[1];
      if (/^\s*(\*|\/\/)/.test(line)) continue; // comments may mention the old shape
      if (!/stepIndex\s*(===|==|>=|<=|>|<)\s*\d/.test(line)
          && !/\bSTEP_INDEX\b\s*=\s*\d/.test(line)) continue;
      if (/^migrateV\d/.test(fn)) continue; // frozen historical layout
      offenders.push(`${file}:${i + 1} ${line.trim().slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, [],
    'these break the moment a step is inserted above them — use isOnStep()');
});

test('the one numeric check left is a frozen migration, and says so', () => {
  const save = read('src/renderer/game/systems/saveSystem.js');
  const line = save.split('\n').find((l) => /aq\.stepIndex === 5/.test(l));
  assert.ok(line, 'the v4 migration moved; re-check the exemption above');
  assert.match(save, /frozen|as it was at save version|historical/i,
    'a frozen numeric index needs a note saying why it stays');
});

test('the Dry Wash asks for the build step by name', () => {
  const scene = read('src/renderer/game/scenes/DryWashScene.js');
  const gates = scene.match(/isOnStep\(state, 'bridge_collapse', 'build_bridge'\)/g) || [];
  assert.equal(gates.length, 2, 'both the mount gate and the dialog gate');
  assert.doesNotMatch(scene, /BUILD_STEP_INDEX\s*=/);
});

// ── the ids the scenes name actually exist ─────────────────────────────────

test('every step id a scene names exists in the quest data', () => {
  const missing = [];
  for (const file of gameSources()) {
    const src = read(file);
    for (const m of src.matchAll(/isOnStep\([^,]+,\s*'([a-z_0-9]+)'\s*,\s*'([a-z_0-9]+)'\s*\)/g)) {
      const [, questId, stepId] = m;
      if (indexOfStepId(questId, stepId) < 0) missing.push(`${questId}/${stepId} in ${file}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('build_bridge is where the quest data says, wherever that is', () => {
  const idx = indexOfStepId('bridge_collapse', 'build_bridge');
  assert.ok(idx > 0, 'build_bridge is missing from bridge_collapse');
  assert.equal(stepIdAt('bridge_collapse', idx), 'build_bridge');
  // the gate follows the data, not a number
  assert.equal(isOnStep({ activeQuest: { id: 'bridge_collapse', stepIndex: idx } },
    'bridge_collapse', 'build_bridge'), true);
  assert.equal(isOnStep({ activeQuest: { id: 'bridge_collapse', stepIndex: idx - 1 } },
    'bridge_collapse', 'build_bridge'), false);
});

test('weigh_samples really does sit above build_bridge', () => {
  // This is the insertion that broke it; if it ever moves, the migration
  // table in questSteps.js has to move with it.
  const weigh = indexOfStepId('bridge_collapse', 'weigh_samples');
  const build = indexOfStepId('bridge_collapse', 'build_bridge');
  assert.ok(weigh >= 0 && weigh < build);
});

// ── an old save lands on the step it was actually on ───────────────────────

test('a pre-insertion save on the build step still lands on the build step', () => {
  // Before `weigh_samples`, build_bridge was index 14.
  const old = { id: 'bridge_collapse', stepIndex: 14 };
  const migrated = migrateActiveQuest(old, 0);
  assert.equal(migrated.stepId, 'build_bridge');
  assert.equal(migrated.stepIndex, indexOfStepId('bridge_collapse', 'build_bridge'));
});

test('a pre-insertion save below the insertion is untouched', () => {
  const old = { id: 'bridge_collapse', stepIndex: 3 };
  const migrated = migrateActiveQuest(old, 0);
  assert.equal(migrated.stepIndex, 3);
  assert.equal(migrated.stepId, stepIdAt('bridge_collapse', 3));
});

test('a save that carries the id ignores the number entirely', () => {
  const wrongNumber = { id: 'bridge_collapse', stepIndex: 0, stepId: 'build_bridge' };
  const migrated = migrateActiveQuest(wrongNumber, QUEST_DATA_VERSION);
  assert.equal(migrated.stepIndex, indexOfStepId('bridge_collapse', 'build_bridge'));
});

test('migrating twice changes nothing the second time', () => {
  const once = migrateActiveQuest({ id: 'bridge_collapse', stepIndex: 14 }, 0);
  const twice = migrateActiveQuest(once, QUEST_DATA_VERSION);
  assert.deepEqual(twice, once);
});

test('no active quest migrates to no active quest', () => {
  assert.equal(migrateActiveQuest(null, 0), null);
  assert.equal(migrateActiveQuest(undefined, 0), null);
});

test('an unknown quest id is left alone rather than mangled', () => {
  const weird = { id: 'not_a_quest', stepIndex: 4 };
  assert.deepEqual(migrateActiveQuest(weird, 0), weird);
});

test('an index past the end is clamped to the last step', () => {
  const steps = QUESTS.bridge_collapse.steps.length;
  const migrated = migrateActiveQuest({ id: 'bridge_collapse', stepIndex: steps + 5 }, 0);
  assert.equal(migrated.stepIndex, steps - 1);
});

// ── new saves carry the id from the start ──────────────────────────────────

test('starting and advancing a quest stamps the step id', () => {
  assert.equal(withStepId({ id: 'bridge_collapse', stepIndex: 0 }).stepId,
    QUESTS.bridge_collapse.steps[0].id);
  const quest = read('src/renderer/game/systems/questSystem.js');
  const stamped = quest.match(/withStepId\(/g) || [];
  assert.ok(stamped.length >= 3,
    'start, resume and advance must all stamp the id');
});

test('the save migration runs and records the quest-data version', () => {
  const save = read('src/renderer/game/systems/saveSystem.js');
  assert.match(save, /const CURRENT_VERSION = 7;/);
  assert.match(save, /migrated\.version === 6\) migrated = migrateV6toV7/);
  assert.match(save, /questDataVersion: QUEST_DATA_VERSION/);
});
