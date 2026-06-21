// chapter5-ferment-model.test.mjs — locks Chapter 5's microbiology pillar. The
// bench must reward yeast fermenting sugar anaerobically into alcohol, and show
// that the same sugar becomes other things (or nothing) with other microbes /
// conditions: vinegar, sour, dead, no_food, aerobic_growth. Verdicts read only
// from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { FermentModel } from '../src/game/phaser/systems/FermentModel.js';
import { FERMENT_CHALLENGE, FERMENT_SLOTS, FERMENT_CATALOG } from '../src/game/data/chapter5/microbiology.js';

const f = new FermentModel();

test('the ideal culture ferments sugar to alcohol', () => {
  const r = f.solve(FERMENT_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'alcohol');
  assert.equal(r.ok, true);
  assert.equal(r.product, 'alcohol');
});

test('yeast with oxygen just grows — no alcohol', () => {
  const r = f.solve({ substrate: 'fruit_juice', microbe: 'yeast', temp: 'warm', oxygen: 'open' });
  assert.equal(r.verdict, 'aerobic_growth');
});

test('a different microbe makes a different product (vinegar)', () => {
  const r = f.solve({ substrate: 'fruit_juice', microbe: 'acetobacter', temp: 'warm', oxygen: 'open' });
  assert.equal(r.verdict, 'vinegar');
});

test('lactobacillus sours the brew (preserves, reshapes the ecosystem)', () => {
  const r = f.solve({ substrate: 'sugar_water', microbe: 'lactobacillus', temp: 'warm', oxygen: 'sealed' });
  assert.equal(r.verdict, 'sour');
});

test('boiling kills the culture (highest priority)', () => {
  const r = f.solve({ substrate: 'fruit_juice', microbe: 'yeast', temp: 'hot', oxygen: 'sealed' });
  assert.equal(r.verdict, 'dead');
});

test('no sugar means no food', () => {
  const r = f.solve({ substrate: 'sterile_water', microbe: 'yeast', temp: 'warm', oxygen: 'sealed' });
  assert.equal(r.verdict, 'no_food');
});

test('too cold and the culture is dormant', () => {
  const r = f.solve({ substrate: 'fruit_juice', microbe: 'yeast', temp: 'cold', oxygen: 'sealed' });
  assert.equal(r.verdict, 'dormant');
});

test('an incomplete culture is reported, not crashed', () => {
  const r = f.solve({ substrate: 'fruit_juice' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of FERMENT_SLOTS) for (const o of FERMENT_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
