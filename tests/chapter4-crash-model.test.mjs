// chapter4-crash-model.test.mjs — locks Chapter 4's crash/load safety rig. The
// sled must reward the energy-managing build (crumple + strong cage + restraint +
// balance) and diagnose the three failure modes: cabin collapse (soft front into
// a weak cage), high-g (rigid front transmits the hit), and unstable (poor load
// balance). Verdicts read only from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { CrashModel } from '../src/game/phaser/systems/CrashModel.js';
import { CRASH_CHALLENGE, CRASH_SLOTS, CRASH_CATALOG } from '../src/game/data/chapter4/crashLoad.js';

const c = new CrashModel();

test('the ideal build is survivable: low occupant g, intact cabin, balanced', () => {
  const r = c.solve(CRASH_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'safe');
  assert.equal(r.ok, true);
  assert.ok(r.occupantG <= 30, `occupant g should be survivable, got ${r.occupantG}`);
  assert.equal(r.cabinHolds, true);
});

test('a rigid front transmits the hit — occupant high-g even with airbag', () => {
  const r = c.solve({ front: 'rigid', cage: 'reinforced', restraint: 'belt_airbag', load: 'balanced' });
  assert.equal(r.verdict, 'high_g');
  assert.ok(r.occupantG > 30);
});

test('a soft front into a light cage collapses the cabin', () => {
  const r = c.solve({ front: 'soft', cage: 'light', restraint: 'belt_airbag', load: 'balanced' });
  assert.equal(r.verdict, 'collapse');
  assert.equal(r.cabinHolds, false);
});

test('the counterintuitive lesson: a crumple zone lowers occupant g vs a rigid front', () => {
  const rigid = c.solve({ front: 'rigid', cage: 'reinforced', restraint: 'belt', load: 'balanced' });
  const crumple = c.solve({ front: 'crumple', cage: 'reinforced', restraint: 'belt', load: 'balanced' });
  assert.ok(crumple.occupantG < rigid.occupantG, 'softer-in-front (crumple) should lower peak g');
});

test('a safe car with bad load balance is flagged unstable', () => {
  const r = c.solve({ front: 'crumple', cage: 'reinforced', restraint: 'belt_airbag', load: 'rear_heavy' });
  assert.equal(r.verdict, 'unstable');
});

test('an incomplete car is reported, not crashed', () => {
  const r = c.solve({ front: 'crumple' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of CRASH_SLOTS) {
    for (const o of CRASH_CATALOG[slot]) {
      assert.equal(typeof o.id, 'string');
      assert.equal(typeof o.name, 'string');
    }
  }
});
