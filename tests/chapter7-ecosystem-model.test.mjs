// chapter7-ecosystem-model.test.mjs — locks Chapter 7's systems-biology capstone.
// The model must reward a balanced, responsibly-engineered closed loop and
// diagnose each cascade failure (no_base, nutrient_lockup, algae_bloom) plus the
// ethical gate (reckless = stable design released irreversibly). Verdicts read
// only from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { EcosystemModel } from '../src/game/phaser/systems/EcosystemModel.js';
import { ECO_CHALLENGE, ECO_SLOTS, ECO_CATALOG } from '../src/game/data/chapter7/systemsBio.js';

const e = new EcosystemModel();

test('the ideal design is a stable, responsibly-engineered loop', () => {
  const r = e.solve(ECO_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'stable');
  assert.equal(r.ok, true);
  assert.deepEqual(r.roles, { producer: true, decomposer: true, balanced: true, responsible: true });
});

test('no producer = no energy base (first failure)', () => {
  const r = e.solve({ producer: 'none_p', decomposer: 'microbes', consumer: 'grazers', approach: 'monitored' });
  assert.equal(r.verdict, 'no_base');
});

test('no decomposer locks up nutrients', () => {
  const r = e.solve({ producer: 'algae', decomposer: 'none_d', consumer: 'grazers', approach: 'monitored' });
  assert.equal(r.verdict, 'nutrient_lockup');
});

test('no consumer means the producer blooms and crashes', () => {
  const r = e.solve({ producer: 'algae', decomposer: 'microbes', consumer: 'none_c', approach: 'monitored' });
  assert.equal(r.verdict, 'algae_bloom');
});

test('the ethical gate: an ecologically-stable design released irreversibly is reckless', () => {
  const r = e.solve({ producer: 'algae', decomposer: 'microbes', consumer: 'grazers', approach: 'release' });
  assert.equal(r.verdict, 'reckless');
  assert.equal(r.ok, false);
  assert.match(r.reason, /should I/i);
});

test('priority: a missing base is caught before the ethics gate', () => {
  const r = e.solve({ producer: 'none_p', decomposer: 'none_d', consumer: 'none_c', approach: 'release' });
  assert.equal(r.verdict, 'no_base');
});

test('an incomplete design is reported, not crashed', () => {
  const r = e.solve({ producer: 'algae' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of ECO_SLOTS) for (const o of ECO_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
