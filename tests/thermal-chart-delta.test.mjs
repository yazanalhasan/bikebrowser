import assert from 'node:assert/strict';
import { test } from 'node:test';

import { runThermalTest } from '../src/renderer/game/systems/materials/thermalRigEngine.js';

test('thermal chart y values represent expansion, not absolute rod length', () => {
  const steel = runThermalTest('steel_rod');
  const aluminum = runThermalTest('aluminum_rod');

  assert.ok(steel);
  assert.ok(aluminum);

  assert.equal(steel.curve[0].y, 0);
  assert.equal(steel.curve[0].lengthMm, steel.summary.originalLengthMm);

  const steelLast = steel.curve.at(-1);
  const aluminumLast = aluminum.curve.at(-1);

  assert.equal(steelLast.y, steel.summary.totalDeltaMm);
  assert.equal(steelLast.lengthMm, steel.summary.finalLengthMm);
  assert.ok(aluminumLast.y > steelLast.y);
});
