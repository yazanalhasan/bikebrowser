import assert from 'node:assert/strict';
import test from 'node:test';

import { gameplayReportsEnabled } from '../src/renderer/game/utils/gameplayReports.js';

test('the BUG button stays off in production unless explicitly enabled', () => {
  assert.equal(gameplayReportsEnabled({}), false);
  assert.equal(gameplayReportsEnabled({ DEV: false, VITE_ENABLE_GAMEPLAY_REPORTS: 'false' }), false);
  assert.equal(gameplayReportsEnabled({ DEV: false }), false);
});

test('the BUG button is on for dev and for an explicit production flag', () => {
  assert.equal(gameplayReportsEnabled({ DEV: true }), true);
  assert.equal(gameplayReportsEnabled({ DEV: false, VITE_ENABLE_GAMEPLAY_REPORTS: 'true' }), true);
});
