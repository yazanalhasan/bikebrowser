// chapter6-aero-model.test.mjs — locks Chapter 6's aerodynamics rig. The tunnel
// must reward a balanced, strong-and-light aircraft and diagnose all four failure
// modes: structural (weak wing), stall (high AoA), too_heavy (lift < weight),
// underpowered (thrust < drag). Verdicts read only from the option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { AeroModel } from '../src/game/phaser/systems/AeroModel.js';
import { PLANE_CHALLENGE, PLANE_SLOTS, PLANE_CATALOG } from '../src/game/data/chapter6/aerodynamics.js';

const a = new AeroModel();

test('the ideal aircraft flies — four forces balanced, wing strong and light', () => {
  const r = a.solve(PLANE_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'fly');
  assert.equal(r.ok, true);
  assert.ok(r.lift >= r.weight);
  assert.ok(r.thrust >= r.drag);
});

test('a balsa wing fails structurally under the lift loads', () => {
  const r = a.solve({ airfoil: 'cambered', angle: 'optimal', structure: 'balsa', engine: 'medium' });
  assert.equal(r.verdict, 'structural');
});

test('too high an angle of attack stalls (unless the airfoil tolerates it)', () => {
  const r = a.solve({ airfoil: 'cambered', angle: 'high', structure: 'composite', engine: 'large' });
  assert.equal(r.verdict, 'stall');
  assert.equal(r.stalled, true);
  // a thin high-AoA-tolerant airfoil at high AoA does NOT stall
  const thin = a.solve({ airfoil: 'thin', angle: 'high', structure: 'composite', engine: 'large' });
  assert.notEqual(thin.verdict, 'stall');
});

test('a low-lift wing carrying a heavy structure is too heavy to climb', () => {
  const r = a.solve({ airfoil: 'flat', angle: 'low', structure: 'aluminum', engine: 'medium' });
  assert.equal(r.verdict, 'too_heavy');
  assert.ok(r.lift < r.weight);
});

test('a clean wing with too small an engine is underpowered', () => {
  const r = a.solve({ airfoil: 'cambered', angle: 'optimal', structure: 'composite', engine: 'small' });
  assert.equal(r.verdict, 'underpowered');
  assert.ok(r.thrust < r.drag);
});

test('composite beats aluminium on strength-to-weight (lighter at similar strength)', () => {
  const { STRUCTURE_OPTIONS } = PLANE_CATALOG.structure ? { STRUCTURE_OPTIONS: PLANE_CATALOG.structure } : {};
  const comp = PLANE_CATALOG.structure.find((o) => o.id === 'composite');
  const alu = PLANE_CATALOG.structure.find((o) => o.id === 'aluminum');
  assert.ok(comp.weight < alu.weight && comp.strength >= alu.strength - 10);
});

test('an incomplete aircraft is reported, not crashed', () => {
  const r = a.solve({ airfoil: 'cambered' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every slot option declares its primitives', () => {
  for (const slot of PLANE_SLOTS) for (const o of PLANE_CATALOG[slot]) {
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.name, 'string');
  }
});
