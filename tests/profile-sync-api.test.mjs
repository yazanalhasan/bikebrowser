import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, onRequestPut } from '../functions/api/profile.js';

function createEnv() {
  const store = new Map();
  return {
    PROFILE_SYNC_KEY: 'test-sync-key',
    PROFILE_STORE: {
      async get(key, type) {
        const value = store.get(key) || null;
        return type === 'json' && value ? JSON.parse(value) : value;
      },
      async put(key, value) {
        store.set(key, value);
      },
    },
  };
}

function request(method, body, key = 'test-sync-key') {
  return new Request('https://bike-browser.com/api/profile', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-profile-sync-key': key,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('profile sync rejects requests without the parent sync key', async () => {
  const response = await onRequestGet({ request: request('GET', null, 'wrong'), env: createEnv() });
  assert.equal(response.status, 401);
});

test('profile sync stores and returns the shared Zaydan profile', async () => {
  const env = createEnv();
  const profile = {
    spellingAccount: { profileName: 'Zaydan', balance: -12.5 },
    educationProfile: { profileName: 'Zaydan', earnings: { totalDollars: 3 } },
    wordList: ['chain', 'brake'],
    rawInput: 'chain\nbrake',
  };

  const putResponse = await onRequestPut({ request: request('PUT', { profile }), env });
  assert.equal(putResponse.status, 200);
  const putBody = await putResponse.json();
  assert.equal(putBody.profile.profileId, 'zaydan');
  assert.deepEqual(putBody.profile.wordList, ['chain', 'brake']);

  const getResponse = await onRequestGet({ request: request('GET'), env });
  const getBody = await getResponse.json();
  assert.equal(getBody.success, true);
  assert.equal(getBody.profile.spellingAccount.balance, -12.5);
});
