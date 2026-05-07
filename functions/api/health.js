export function onRequestGet({ env }) {
  return Response.json({
    ok: true,
    service: 'bikebrowser-pages',
    mode: 'cloudflare-pages',
    commit: env?.CF_PAGES_COMMIT_SHA || null,
    branch: env?.CF_PAGES_BRANCH || null,
    url: env?.CF_PAGES_URL || null,
    checkedAt: new Date().toISOString()
  });
}
