function shouldRejectHtmlFallback(pathname) {
  return /\.(?:js|mjs|css)$/i.test(pathname);
}

export async function onRequest({ env, request }) {
  const response = await env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const contentType = response.headers.get('content-type') || '';

  if (
    response.status === 200
    && shouldRejectHtmlFallback(url.pathname)
    && contentType.includes('text/html')
  ) {
    return new Response('Asset not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  return response;
}

