const PROD_ORIGIN = process.env.BIKEBROWSER_PROD_ORIGIN || 'https://bike-browser.com';
const PRIVATE_ORIGIN = process.env.BIKEBROWSER_PRIVATE_ORIGIN || 'https://private.bike-browser.com';

async function readJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Keep raw text for diagnostics below.
  }
  return {
    url,
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    server: response.headers.get('server') || '',
    cfCache: response.headers.get('cf-cache-status') || '',
    json,
    text: text.slice(0, 160),
  };
}

async function main() {
  const health = await readJson(`${PROD_ORIGIN}/api/health`);
  const buildInfo = await readJson(`${PROD_ORIGIN}/build-info.json`);

  console.log(`Production origin: ${PROD_ORIGIN}`);
  console.log(`Health: HTTP ${health.status}, service=${health.json?.service || 'unknown'}, mode=${health.json?.mode || 'unknown'}`);
  console.log(`Build info: HTTP ${buildInfo.status}, sha=${buildInfo.json?.shortSha || 'unknown'}, dirty=${buildInfo.json?.dirty}`);

  const failures = [];
  if (!health.ok || health.json?.service !== 'bikebrowser-pages' || health.json?.mode !== 'cloudflare-pages') {
    failures.push('Production /api/health does not identify as Cloudflare Pages.');
  }
  if (!buildInfo.ok || buildInfo.json?.app !== 'bikebrowser') {
    failures.push('Production /build-info.json is missing or malformed.');
  }
  if (buildInfo.json?.dirty === true) {
    failures.push('Production build-info reports dirty=true; deploy should come from clean GitHub state.');
  }

  try {
    const privateHealth = await readJson(`${PRIVATE_ORIGIN}/api/health`);
    console.log(`Private/dev origin: HTTP ${privateHealth.status}, service=${privateHealth.json?.service || 'unknown'}`);
  } catch (error) {
    console.log(`Private/dev origin: not reachable (${error.message})`);
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL: ${failure}`);
    }
    process.exitCode = 1;
  } else {
    console.log('PASS: production host reports Cloudflare Pages provenance.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

