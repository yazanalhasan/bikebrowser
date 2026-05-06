import { searchVideoResults } from './videos.js';

function emptySearchResponse(query) {
  return {
    success: true,
    query,
    results: [],
    grouped: {
      build: [],
      buy: [],
      watch: [],
    },
    totalResults: 0,
    metadata: {
      source: 'cloudflare-pages-curated',
      intent: 'watch',
    },
  };
}

export async function onRequestPost({ request }) {
  let payload = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const query = String(payload.query || '').trim();
  const intent = String(payload.options?.intent || 'watch');

  if (!query) {
    return Response.json(emptySearchResponse(query));
  }

  const results = searchVideoResults(query, 12);

  return Response.json({
    success: true,
    query,
    results,
    grouped: {
      build: [],
      buy: [],
      watch: results,
    },
    totalResults: results.length,
    metadata: {
      source: 'cloudflare-pages-curated',
      intent,
    },
  });
}
