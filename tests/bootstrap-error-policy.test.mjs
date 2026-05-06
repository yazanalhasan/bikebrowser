import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shouldRenderBootstrapError } from '../src/renderer/bootstrapErrorPolicy.js';

test('bootstrap overlay is shown before the app has started', () => {
  assert.equal(shouldRenderBootstrapError({ appStarted: false }), true);
});

test('post-startup script errors do not replace the running app with the bootstrap overlay', () => {
  assert.equal(
    shouldRenderBootstrapError({ appStarted: true, source: 'window.error', error: 'Script error.' }),
    false
  );
});
