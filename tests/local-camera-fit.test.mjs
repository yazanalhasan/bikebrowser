import assert from 'node:assert/strict';
import test from 'node:test';

import { localCameraFit } from '../src/renderer/game/utils/localCameraFit.js';

test('a phone keeps the garage at full size instead of shrinking it', () => {
  const fit = localCameraFit({
    camWidth: 390,
    camHeight: 800,
    worldWidth: 800,
    worldHeight: 600,
  });

  assert.equal(fit.mode, 'follow');
  assert.equal(fit.zoom, 1);
});

test('a large window scales the garage up without cropping it', () => {
  const fit = localCameraFit({
    camWidth: 1400,
    camHeight: 900,
    worldWidth: 800,
    worldHeight: 600,
  });

  assert.equal(fit.mode, 'fit');
  assert.ok(Math.abs(fit.zoom - 900 / 600) < 0.001);
});

test('a big map on a phone stays a follow camera so it does not shrink away', () => {
  const fit = localCameraFit({
    camWidth: 390,
    camHeight: 800,
    worldWidth: 1200,
    worldHeight: 800,
  });

  assert.equal(fit.mode, 'follow');
  assert.equal(fit.zoom, 1);
});
