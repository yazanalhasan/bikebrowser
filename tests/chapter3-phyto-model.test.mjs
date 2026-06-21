// chapter3-phyto-model.test.mjs — locks Chapter 3's phytochemistry pillar. The
// lab must reward conditions that extract pure salicin and diagnose each way it
// goes wrong: wrong_compound (non-polar solvent), degraded (boiling), bitter
// (over-extracted tannins), low_yield (under-extracted). Verdicts read only from
// the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { PhytoModel } from '../src/game/phaser/systems/PhytoModel.js';
import { PHYTO_CHALLENGE, PHYTO_SLOTS, PHYTO_CATALOG } from '../src/game/data/chapter3/phytochemistry.js';

const p = new PhytoModel();

test('the ideal conditions extract pure salicin', () => {
  const r = p.solve(PHYTO_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'pure');
  assert.equal(r.ok, true);
  assert.equal(r.compound, 'salicin');
  assert.ok(r.purityPct >= 90);
});

test('a non-polar solvent pulls the wrong compound class (waxes)', () => {
  const r = p.solve({ solvent: 'oil', temp: 'warm', time: 'medium', grind: 'ground' });
  assert.equal(r.verdict, 'wrong_compound');
  assert.match(r.compound, /wax/i);
});

test('boiling degrades the heat-sensitive target', () => {
  const r = p.solve({ solvent: 'water', temp: 'hot', time: 'medium', grind: 'ground' });
  assert.equal(r.verdict, 'degraded');
});

test('over-extraction (long steep) drags out bitter tannins', () => {
  const r = p.solve({ solvent: 'water', temp: 'warm', time: 'long', grind: 'ground' });
  assert.equal(r.verdict, 'bitter');
});

test('aggressive solvent also over-extracts tannins at length', () => {
  const r = p.solve({ solvent: 'alcohol', temp: 'warm', time: 'medium', grind: 'ground' });
  assert.equal(r.verdict, 'bitter');
});

test('too little surface/heat/time under-extracts (low yield)', () => {
  const cold = p.solve({ solvent: 'water', temp: 'cold', time: 'medium', grind: 'ground' });
  assert.equal(cold.verdict, 'low_yield');
  const whole = p.solve({ solvent: 'water', temp: 'warm', time: 'medium', grind: 'whole' });
  assert.equal(whole.verdict, 'low_yield');
});

test('same bark, different conditions, different molecule — the core lesson', () => {
  const waxes = p.solve({ solvent: 'oil', temp: 'warm', time: 'medium', grind: 'ground' }).compound;
  const salicin = p.solve(PHYTO_CHALLENGE.idealSelection).compound;
  const tannins = p.solve({ solvent: 'water', temp: 'warm', time: 'long', grind: 'ground' }).compound;
  assert.notEqual(waxes, salicin);
  assert.notEqual(salicin, tannins);
});

test('an incomplete setup is reported, not crashed', () => {
  const r = p.solve({ solvent: 'water' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of PHYTO_SLOTS) for (const o of PHYTO_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
