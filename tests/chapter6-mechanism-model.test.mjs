// chapter6-mechanism-model.test.mjs — locks Chapter 6's molecular-biology pillar.
// The bench must validate a molecule→target→action chain that explains the willow
// observation and reject each wrong link (molecule, target, action) in order.
// Verdicts read only from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { MechanismModel } from '../src/game/phaser/systems/MechanismModel.js';
import { MECH_CHALLENGE, MECH_SLOTS, MECH_CATALOG } from '../src/game/data/chapter6/molecular.js';

const m = new MechanismModel();

test('the correct chain explains the observation', () => {
  const r = m.solve(MECH_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'mechanism');
  assert.equal(r.ok, true);
  assert.equal(r.level, 'protein');
});

test('a non-active molecule is rejected first', () => {
  const r = m.solve({ molecule: 'tannin', target: 'cox_enzyme', effect: 'inhibits' });
  assert.equal(r.verdict, 'wrong_molecule');
});

test('the wrong target (wrong biological level) is rejected', () => {
  const r = m.solve({ molecule: 'salicylic_acid', target: 'dna', effect: 'inhibits' });
  assert.equal(r.verdict, 'wrong_target');
});

test('the wrong action direction is rejected', () => {
  const r = m.solve({ molecule: 'salicylic_acid', target: 'cox_enzyme', effect: 'activates' });
  assert.equal(r.verdict, 'wrong_action');
});

test('priority: molecule is checked before target/action', () => {
  const r = m.solve({ molecule: 'caffeine', target: 'dna', effect: 'activates' });
  assert.equal(r.verdict, 'wrong_molecule');
});

test('an incomplete mechanism is reported, not crashed', () => {
  const r = m.solve({ molecule: 'salicylic_acid' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of MECH_SLOTS) for (const o of MECH_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
