import assert from 'node:assert/strict';
import test from 'node:test';

import { getRequestBaseCandidates, isPublicBikeBrowserHost } from '../src/client/apiClient.js';

test('public BikeBrowser hosts do not fall back to localhost APIs', () => {
  const candidates = getRequestBaseCandidates({
    currentBaseUrl: '/api',
    configuredBaseUrl: '',
    localFallback: 'http://localhost:3001',
    hostname: 'bike-browser.com',
  });

  assert.equal(isPublicBikeBrowserHost('bike-browser.com'), true);
  assert.deepEqual(candidates, ['/api']);
});

test('local development still keeps the API fallback', () => {
  const candidates = getRequestBaseCandidates({
    currentBaseUrl: '',
    configuredBaseUrl: '',
    localFallback: 'http://localhost:3001',
    hostname: '127.0.0.1',
  });

  assert.deepEqual(candidates, ['http://localhost:3001']);
});
