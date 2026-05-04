export function onRequestGet() {
  return Response.json({
    ok: true,
    service: 'bikebrowser-pages',
    mode: 'cloudflare-pages'
  });
}
