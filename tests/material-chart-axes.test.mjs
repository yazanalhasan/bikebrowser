import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeSharedStressStrainAxes,
} from '../src/renderer/game/systems/materials/materialTestingEngine.js';

test('UTM chart axes use the full material set so curves do not normalize to the same shape', () => {
  const axes = computeSharedStressStrainAxes([
    'mesquite_wood',
    'structural_steel',
    'copper',
  ]);

  assert.ok(axes.xMax > 0.35, 'x axis should include copper ductility');
  assert.ok(axes.yMax > 450, 'y axis should include steel strength headroom');
});
