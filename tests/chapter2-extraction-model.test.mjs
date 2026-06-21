// chapter2-extraction-model.test.mjs — locks the Ethnobotany Extraction Bench,
// Chapter 2's biology pillar. The core lesson is "method changes outcome": the
// model must reward the correct part→method pairing, distinctly flag the tempting
// wrong method (with a reason), and shrug at irrelevant methods. Verdicts read
// only from the species data, never hard-coded.

import assert from 'node:assert/strict';
import test from 'node:test';

import { ExtractionModel } from '../src/game/phaser/systems/ExtractionModel.js';
import { ETHNOBOTANY_SPECIES, USE_CATEGORIES } from '../src/game/data/chapter2/ethnobotanySpecies.js';

const m = new ExtractionModel();

test('correct part→method yields the declared product', () => {
  const r = m.process('agave', 'leaf', 'ret');
  assert.equal(r.outcome, 'yield');
  assert.equal(r.ok, true);
  assert.equal(r.product, 'cordage');
  assert.equal(r.category, 'fiber');
});

test('the tempting wrong method fails with an explanation (the teaching contrast)', () => {
  const r = m.process('agave', 'leaf', 'grind');
  assert.equal(r.outcome, 'wrong');
  assert.equal(r.ok, false);
  assert.equal(r.correctMethod, 'ret');
  assert.match(r.reason, /mush|retted|fibre/i);
});

test('same part, different method, different outcome — across the whole catalog', () => {
  // Every species/part: its method yields; its wrong method does not.
  for (const sp of ETHNOBOTANY_SPECIES) {
    for (const part of sp.parts) {
      const good = m.process(sp.id, part.id, part.method);
      assert.equal(good.outcome, 'yield', `${sp.id}.${part.id} should yield via ${part.method}`);
      assert.ok(USE_CATEGORIES.includes(good.category), `valid category for ${sp.id}.${part.id}`);
      if (part.wrong) {
        const bad = m.process(sp.id, part.id, part.wrong.method);
        assert.equal(bad.outcome, 'wrong', `${sp.id}.${part.id} wrong method should fail`);
        assert.equal(bad.ok, false);
      }
    }
  }
});

test('an irrelevant method is inert, not a crash', () => {
  // creosote leaves want 'steep'; 'ferment' has no defined effect → inert.
  const r = m.process('creosote', 'leaves', 'ferment');
  assert.equal(r.outcome, 'inert');
  assert.equal(r.ok, false);
  assert.equal(r.correctMethod, 'steep');
});

test('invalid picks are handled gracefully', () => {
  assert.equal(m.process('nope', 'x', 'y').outcome, 'invalid');
  assert.equal(m.process('agave', 'nope', 'ret').outcome, 'invalid');
});

test('productsOf summarizes what a plant can become', () => {
  const prods = m.productsOf('prickly_pear');
  assert.equal(prods.length, 3);
  const cats = prods.map((p) => p.category).sort();
  assert.deepEqual([...new Set(cats)].sort(), ['dye', 'food']); // food (pad+fruit) + dye (cochineal)
});

test('the catalog spans multiple use categories (food/fiber/dye/medicine/fuel/drink)', () => {
  const cats = new Set();
  for (const sp of ETHNOBOTANY_SPECIES) for (const p of sp.parts) cats.add(p.category);
  for (const need of ['food', 'fiber', 'dye', 'medicine', 'fuel', 'drink']) {
    assert.ok(cats.has(need), `catalog should teach ${need}`);
  }
});
