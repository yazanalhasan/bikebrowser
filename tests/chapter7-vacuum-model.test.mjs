// chapter7-vacuum-model.test.mjs — locks Chapter 7's vacuum/re-entry rig (the
// spine finale). The chamber must certify a fully-survivable crewed craft and
// diagnose all four extremes in priority order: vacuum_fail, burn_up, life_fail,
// single_point. Verdicts read only from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { VacuumModel } from '../src/game/phaser/systems/VacuumModel.js';
import { SPACE_CHALLENGE, SPACE_SLOTS, SPACE_CATALOG } from '../src/game/data/chapter7/vacuumReentry.js';

const v = new VacuumModel();

test('the ideal spacecraft certifies for launch', () => {
  const r = v.solve(SPACE_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'certified');
  assert.equal(r.ok, true);
  assert.equal(r.vacuumCapable, true);
  assert.ok(r.shieldProtection >= r.reentryHeat);
  assert.ok(r.lifeCapacity >= 2);
  assert.ok(r.failTolerance >= 1);
});

test('an air-breathing engine fails in vacuum (highest-priority fault)', () => {
  // even with everything else perfect, no thrust in space ends it first
  const r = v.solve({ propulsion: 'air_breathing', shield: 'ceramic', life: 'recycling', redundancy: 'triple' });
  assert.equal(r.verdict, 'vacuum_fail');
});

test('no heat shield burns up on re-entry', () => {
  const r = v.solve({ propulsion: 'chemical', shield: 'none', life: 'recycling', redundancy: 'dual' });
  assert.equal(r.verdict, 'burn_up');
});

test('no life support fails a crewed flight', () => {
  const r = v.solve({ propulsion: 'chemical', shield: 'ceramic', life: 'none', redundancy: 'dual' });
  assert.equal(r.verdict, 'life_fail');
});

test('a single-string design is a single point of failure', () => {
  const r = v.solve({ propulsion: 'chemical', shield: 'ceramic', life: 'recycling', redundancy: 'single' });
  assert.equal(r.verdict, 'single_point');
});

test('fault priority: vacuum is caught before re-entry/life/redundancy', () => {
  // air-breathing + no shield + no life + single — all broken, but vacuum wins
  const r = v.solve({ propulsion: 'air_breathing', shield: 'none', life: 'none', redundancy: 'single' });
  assert.equal(r.verdict, 'vacuum_fail');
});

test('an incomplete craft is reported, not crashed', () => {
  const r = v.solve({ propulsion: 'chemical' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of SPACE_SLOTS) for (const o of SPACE_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
