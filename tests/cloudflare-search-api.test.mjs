import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost as rankPost } from '../functions/api/rank.js';
import { onRequestPost as searchPost } from '../functions/api/search.js';
import { searchVideoResults } from '../functions/api/videos.js';

test('curated video search returns project builder compatible results', () => {
  const results = searchVideoResults('bike repair drivetrain');

  assert.ok(results.length > 0);
  assert.ok(results[0].title);
  assert.ok(results[0].videoId);
  assert.equal(results[0].source, 'youtube');
});

test('/api/search returns grouped watch results for Cloudflare Pages', async () => {
  const request = new Request('https://bike-browser.com/api/search', {
    method: 'POST',
    body: JSON.stringify({ query: 'cassette repair', options: { intent: 'watch' } }),
  });

  const response = await searchPost({ request });
  const body = await response.json();

  assert.equal(body.success, true);
  assert.ok(body.results.length > 0);
  assert.deepEqual(body.grouped.watch, body.results);
});

test('/api/rank gracefully returns a static curated ordering', async () => {
  const request = new Request('https://bike-browser.com/api/rank', {
    method: 'POST',
    body: JSON.stringify({ results: [{ id: 'a' }, { id: 'b' }] }),
  });

  const response = await rankPost({ request });
  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.mode, 'static-curated');
  assert.deepEqual(body.initial, [{ id: 'a' }, { id: 'b' }]);
});
