// chapter3-engine-model.test.mjs — locks Chapter 3's combustion/thermal rig.
// The dyno must reward a balanced tune (clean power) and distinctly diagnose the
// three failure modes the chapter teaches: knock (too much compression/advance or
// wrong-octane fuel), overheat (heat load beyond cooling), and foul (too rich).
// Verdicts read only from the tune option data.

import assert from 'node:assert/strict';
import test from 'node:test';

import { EngineModel } from '../src/game/phaser/systems/EngineModel.js';
import { ENGINE_CHALLENGE, ENGINE_SLOTS, ENGINE_CATALOG } from '../src/game/data/chapter3/engineTune.js';

const e = new EngineModel();

test('the ideal tune runs clean with strong power, no knock, safe temp', () => {
  const r = e.solve(ENGINE_CHALLENGE.idealSelection);
  assert.equal(r.verdict, 'runs');
  assert.equal(r.ok, true);
  assert.ok(r.power >= 105, `expected strong power, got ${r.power}`);
  assert.ok(r.temp < 110, `temp should be safe, got ${r.temp}`);
  assert.ok(r.knockIndex < 30);
});

test('high compression on regular fuel knocks (octane mismatch)', () => {
  const r = e.solve({ afr: 'stoich', timing: 'optimal', compression: 'high', cooling: 'liquid', fuel: 'regular' });
  assert.equal(r.verdict, 'knock');
  assert.equal(r.ok, false);
  assert.ok(r.octaneShort > 0);
  assert.match(r.reason, /octane|detonat|knock/i);
});

test('advanced timing + high compression knocks even on premium', () => {
  const r = e.solve({ afr: 'stoich', timing: 'advanced', compression: 'high', cooling: 'liquid', fuel: 'premium' });
  assert.equal(r.verdict, 'knock');
});

test('retarded timing + high compression + air cooling overheats (without knocking)', () => {
  const r = e.solve({ afr: 'stoich', timing: 'retarded', compression: 'high', cooling: 'air', fuel: 'premium' });
  assert.equal(r.verdict, 'overheat');
  assert.ok(r.temp >= 110);
  assert.ok(r.knockIndex < 30, 'overheat case should not also be knocking');
});

test('a rich mixture fouls — cool and safe but weak', () => {
  const r = e.solve({ afr: 'rich', timing: 'optimal', compression: 'mid', cooling: 'liquid', fuel: 'premium' });
  assert.equal(r.verdict, 'foul');
  assert.ok(r.power < e.solve(ENGINE_CHALLENGE.idealSelection).power, 'rich makes less power than the ideal tune');
});

test('an incomplete tune is reported, not crashed', () => {
  const r = e.solve({ afr: 'stoich' });
  assert.equal(r.verdict, 'incomplete');
  assert.ok(r.missing.length > 0);
});

test('every knob declares the numeric primitives the model reads', () => {
  for (const slot of ENGINE_SLOTS) {
    for (const o of ENGINE_CATALOG[slot]) {
      assert.equal(typeof o.id, 'string');
      assert.equal(typeof o.name, 'string');
    }
  }
});
