export async function onRequestPost({ request }) {
  let payload = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const results = Array.isArray(payload.results) ? payload.results : [];

  return Response.json({
    success: true,
    mode: 'static-curated',
    initial: results.slice(0, 12),
    jobId: null,
    metadata: {
      source: 'cloudflare-pages',
    },
  });
}
