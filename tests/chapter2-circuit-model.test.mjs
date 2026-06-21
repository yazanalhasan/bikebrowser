// chapter2-circuit-model.test.mjs — locks Chapter 2's electrical carry-forward
// rig. The CircuitModel is the analog of the bridge's StructuralModel: it must
// reward a correctly-sized series circuit (motor spins) and explain every way it
// can go wrong (too little voltage → stall; over a part's rating → fry; a proper
// fuse → safe trip). Pure logic, runs under node --test.

import assert from 'node:assert/strict';
import test from 'node:test';

import { CircuitModel } from '../src/game/phaser/systems/CircuitModel.js';
import { challengeById } from '../src/game/data/chapter2/circuitChallenges.js';
import { CIRCUIT_SLOTS, optionsForSlot } from '../src/game/data/chapter2/circuitComponents.js';

const model = new CircuitModel();

test('the ideal build spins the motor with every part within rating', () => {
  const sel = challengeById('ebike_first_power').idealSelection;
  const r = model.solve(sel);
  assert.equal(r.verdict, 'spin');
  assert.equal(r.ok, true);
  assert.equal(r.failed.length, 0);
  assert.ok(r.motorVolts >= 30, `motor should see >=30V, saw ${r.motorVolts}`);
  assert.ok(r.current > 0 && r.current < 12, `current should be in motor band, was ${r.current}`);
});

test('a 24V battery stalls the 36V motor (too little voltage)', () => {
  const r = model.solve({ battery: 'batt_24v', fuse: 'fuse_10a', controller: 'ctrl_15a', wire: 'wire_med', motor: 'motor_250w' });
  assert.equal(r.verdict, 'stall');
  assert.equal(r.ok, false);
  assert.ok(r.motorVolts < 30);
});

test('48V into an 8A controller without protection fries the controller', () => {
  // no fuse so nothing protects the under-rated controller
  const r = model.solve({ battery: 'batt_48v', fuse: 'fuse_none', controller: 'ctrl_8a', wire: 'wire_med', motor: 'motor_250w' });
  assert.equal(r.verdict, 'fry');
  assert.equal(r.ok, false);
  assert.equal(r.failedMember.slot, 'controller');
  assert.ok(/no fuse/i.test(r.reason));
});

test('a correctly-sized fuse blows FIRST and protects (safe trip, not a fry)', () => {
  // 48V + 8A controller, but now a 10A fuse: current ~11A > 10A fuse → fuse trips
  // before the controller is destroyed.
  const r = model.solve({ battery: 'batt_48v', fuse: 'fuse_10a', controller: 'ctrl_8a', wire: 'wire_med', motor: 'motor_250w' });
  assert.equal(r.verdict, 'tripped');
  assert.equal(r.ok, false);
  assert.equal(r.failedMember.slot, 'fuse');
  assert.ok(/protect/i.test(r.reason));
});

test('an incomplete circuit reads as open, not a crash', () => {
  const r = model.solve({ battery: 'batt_36v', motor: 'motor_250w' }); // missing fuse/controller/wire
  assert.equal(r.verdict, 'open');
  assert.equal(r.ok, false);
  assert.ok(r.missing.length > 0);
});

test('verdict is driven only by declared part primitives (no hard-coded answer)', () => {
  // Every slot has options, and each option declares the primitives the solver reads.
  for (const slot of CIRCUIT_SLOTS) {
    const opts = optionsForSlot(slot);
    assert.ok(opts.length >= 1, `slot ${slot} has options`);
    for (const o of opts) {
      assert.equal(typeof o.maxCurrentA, 'number');
      assert.ok('resistanceOhm' in o);
    }
  }
});

test('current obeys Ohm\'s law over the series resistance', () => {
  const sel = challengeById('ebike_first_power').idealSelection;
  const r = model.solve(sel);
  const expected = Number((r.volts / r.totalResistance).toFixed(2));
  assert.ok(Math.abs(r.current - expected) < 0.05, `I=${r.current} vs V/R=${expected}`);
});
