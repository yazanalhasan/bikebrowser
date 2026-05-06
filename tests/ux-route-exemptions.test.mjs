import assert from 'node:assert/strict';
import test from 'node:test';

import { ROUTE_EXEMPTIONS } from '../src/renderer/utils/uxSafety.js';

test('immersive game routes are exempt from standard app chrome checks', () => {
  for (const route of ['/play', '/play3d']) {
    assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_HOME_BUTTON'));
    assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_HEADER'));
    assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_NAV_CONTAINER'));
    assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_MAIN_CONTENT'));
  }
});
