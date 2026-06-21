// chapter4-cell-model.test.mjs — locks Chapter 4's cellular-biology pillar. The
// microscope must reveal cell structures only when all three conditions are met
// (thin + resolving magnification + stain) and otherwise diagnose opaque /
// too_coarse / no_contrast. Verdicts read only from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { CellModel } from '../src/game/phaser/systems/CellModel.js';
import { CELL_CHALLENGE, CELL_SLOTS, CELL_CATALOG } from '../src/game/data/chapter4/cellular.js';

const c = new CellModel();

test('the ideal slide resolves cell structures', () => {
  const r = c.solve(CELL_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'resolved');
  assert.equal(r.ok, true);
  assert.ok(r.revealed.includes('chloroplasts'));
  assert.equal(r.sampleAlive, true);
});

test('a thick chunk is opaque', () => {
  const r = c.solve({ sample: 'leaf', stain: 'methylene', mag: 'high', prep: 'thick' });
  assert.equal(r.verdict, 'opaque');
});

test('too little magnification can\'t resolve cells', () => {
  const r = c.solve({ sample: 'leaf', stain: 'methylene', mag: 'low', prep: 'thin' });
  assert.equal(r.verdict, 'too_coarse');
});

test('no stain gives no contrast', () => {
  const r = c.solve({ sample: 'leaf', stain: 'none', mag: 'high', prep: 'thin' });
  assert.equal(r.verdict, 'no_contrast');
});

test('living soil reveals microbes — why soil supports life', () => {
  const r = c.solve({ sample: 'soil', stain: 'methylene', mag: 'oil', prep: 'thin' });
  assert.equal(r.verdict, 'resolved');
  assert.ok(r.revealed.some((s) => /bacter|fungal/i.test(s)));
});

test('priority: opaque is caught before resolution/contrast', () => {
  const r = c.solve({ sample: 'leaf', stain: 'none', mag: 'low', prep: 'thick' });
  assert.equal(r.verdict, 'opaque');
});

test('an incomplete slide is reported, not crashed', () => {
  const r = c.solve({ sample: 'leaf' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of CELL_SLOTS) for (const o of CELL_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
