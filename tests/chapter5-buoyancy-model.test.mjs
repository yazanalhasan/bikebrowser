// chapter5-buoyancy-model.test.mjs — locks Chapter 5's buoyancy/hydro rig. The
// tank must reward a boat that floats with reserve buoyancy and stays upright, and
// distinctly diagnose SINK (weight ≥ displacement) and CAPSIZE (top-heavy/narrow).
// Verdicts read only from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { BuoyancyModel } from '../src/game/phaser/systems/BuoyancyModel.js';
import { BOAT_CHALLENGE, BOAT_SLOTS, BOAT_CATALOG } from '../src/game/data/chapter5/buoyancy.js';

const b = new BuoyancyModel();

test('the ideal boat floats with reserve buoyancy and is stable', () => {
  const r = b.solve(BOAT_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'float');
  assert.equal(r.ok, true);
  assert.ok(r.reserve > 0, `should have reserve buoyancy, got ${r.reserve}`);
  assert.ok(r.stability >= 14);
  assert.equal(r.corrosion, 'low');
});

test('too much weight for the displacement sinks', () => {
  const r = b.solve({ hull: 'skiff', material: 'steel', cargo: 'heavy', ballast: 'heavy' });
  assert.equal(r.verdict, 'sink');
  assert.ok(r.totalWeight >= r.displacement * 0.95);
});

test('a beamy hull that floats can still capsize if top-heavy with no ballast', () => {
  const r = b.solve({ hull: 'barge', material: 'pine', cargo: 'heavy', ballast: 'none' });
  assert.equal(r.verdict, 'capsize');
  assert.ok(r.reserve > 0, 'it floats (has reserve) but rolls over');
  assert.ok(r.stability < 14);
});

test('adding low ballast rescues a tippy boat (raises righting score)', () => {
  const none = b.solve({ hull: 'dinghy', material: 'aluminum', cargo: 'medium', ballast: 'none' });
  const low = b.solve({ hull: 'dinghy', material: 'aluminum', cargo: 'medium', ballast: 'low' });
  assert.ok(low.stability > none.stability, 'ballast should improve stability');
});

test('steel hull floats but flags salt corrosion', () => {
  const r = b.solve({ hull: 'barge', material: 'steel', cargo: 'light', ballast: 'low' });
  assert.equal(r.corrosion, 'high');
  if (r.verdict === 'float') assert.match(r.reason, /salt|corrod/i);
});

test('an incomplete boat is reported, not crashed', () => {
  const r = b.solve({ hull: 'dinghy' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of BOAT_SLOTS) for (const o of BOAT_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
