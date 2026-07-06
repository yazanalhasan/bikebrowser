// Captures geographically real Sonoran Desert reference renders via Cesium ion
// (World Terrain + ion world imagery) for Chapter 1 art direction. Output is
// reference-only until curated through the production art workflow — same rule
// as Meshy/ComfyUI output. Token comes from CESIUM_ION_ACCESS_TOKEN; never
// commit it.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const outputRoot = join(root, 'artifacts', 'bikebrowser', 'geo_reference');
const CESIUM_VERSION = '1.120.0';
const VIEWPORT = { width: 1600, height: 900 };
const TILE_SETTLE_MS = 90_000;

// Real Sonoran dry-wash / neighborhood-wash locations for Chapter 1
// ("a broken wash bridge connecting two neighborhoods").
// agl = camera height above the sampled terrain surface at (lon, lat).
const shots = [
  {
    id: 'rillito_wash_tucson_oblique',
    note: 'Rillito River wash, Tucson — wide sandy dry wash between residential banks',
    lon: -110.949, lat: 32.29, agl: 350, heading: 350, pitch: -28,
  },
  {
    id: 'pantano_wash_tucson_oblique',
    note: 'Pantano Wash, Tucson — braided dry channel, desert scrub margins',
    lon: -110.842, lat: 32.201, agl: 320, heading: 20, pitch: -30,
  },
  {
    id: 'indian_bend_wash_scottsdale_oblique',
    note: 'Indian Bend Wash greenbelt, Scottsdale — wash threading a neighborhood',
    lon: -111.909, lat: 33.52, agl: 300, heading: 200, pitch: -26,
  },
  {
    id: 'tucson_neighborhood_wash_low',
    note: 'Residential wash crossing, central Tucson — street-scale bridge context',
    lon: -110.905, lat: 32.257, agl: 160, heading: 90, pitch: -22,
  },
  {
    id: 'rillito_wash_tucson_topdown',
    note: 'Rillito wash top-down — channel shape reference for level layout',
    lon: -110.949, lat: 32.284, agl: 900, heading: 0, pitch: -88,
  },
];

function pageHtml(token) {
  const base = `https://cdn.jsdelivr.net/npm/cesium@${CESIUM_VERSION}/Build/Cesium`;
  return `<!doctype html><html><head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${base}/Widgets/widgets.css">
  <style>html,body,#globe{margin:0;padding:0;width:100%;height:100%;overflow:hidden}</style>
  <script>window.CESIUM_BASE_URL='${base}/';</script>
  <script src="${base}/Cesium.js"></script>
</head><body><div id="globe"></div>
<script>
  Cesium.Ion.defaultAccessToken = ${JSON.stringify(token)};
  window.__ready = (async () => {
    // Await the provider so sampleTerrainMostDetailed has a ready terrainProvider.
    const terrainProvider = await Cesium.createWorldTerrainAsync();
    const viewer = new Cesium.Viewer('globe', {
      terrainProvider,
      animation: false, timeline: false, baseLayerPicker: false,
      fullscreenButton: false, geocoder: false, homeButton: false,
      navigationHelpButton: false, sceneModePicker: false, infoBox: false,
      selectionIndicator: false,
    });
    viewer.scene.globe.maximumScreenSpaceError = 1.5;
    window.__viewer = viewer;
    return true;
  })();
  window.flyTo = async (lon, lat, agl, heading, pitch) => {
    const v = window.__viewer;
    // Sample real terrain height so the camera sits agl metres above ground —
    // absolute heights put the camera under the Tucson bajada (~700 m).
    const [sample] = await Cesium.sampleTerrainMostDetailed(
      v.terrainProvider,
      [Cesium.Cartographic.fromDegrees(lon, lat)],
    );
    const ground = (sample && sample.height) || 0;
    v.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, ground + agl),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0,
      },
    });
    return ground;
  };
  window.tilesLoaded = () => {
    const v = window.__viewer;
    return v.scene.globe.tilesLoaded;
  };
</script></body></html>`;
}

async function main() {
  const token = process.env.CESIUM_ION_ACCESS_TOKEN;
  if (!token) throw new Error('CESIUM_ION_ACCESS_TOKEN is not set.');
  await mkdir(outputRoot, { recursive: true });

  // Headed: headless SwiftShader renders Cesium's skybox but not the globe
  // surface on this box; the real GPUs handle it fine.
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: VIEWPORT });
  page.on('pageerror', (err) => console.error('page error:', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.error(`browser ${msg.type()}: ${msg.text().slice(0, 300)}`);
    }
  });
  await page.setContent(pageHtml(token), { waitUntil: 'load' });
  await page.waitForFunction('window.__ready', { timeout: 60_000 });
  await page.evaluate('window.__ready');

  const manifest = [];
  for (const shot of shots) {
    console.log(`Capturing ${shot.id}`);
    const ground = await page.evaluate(
      ([lon, lat, agl, heading, pitch]) => window.flyTo(lon, lat, agl, heading, pitch),
      [shot.lon, shot.lat, shot.agl, shot.heading, shot.pitch],
    );
    console.log(`  terrain height ${Math.round(ground)} m, camera at ${Math.round(ground + shot.agl)} m`);
    // Wait for terrain+imagery tiles to fully stream in at this view.
    const deadline = Date.now() + TILE_SETTLE_MS;
    let stable = 0;
    await new Promise((r) => setTimeout(r, 3000));
    while (Date.now() < deadline && stable < 4) {
      stable = (await page.evaluate('window.tilesLoaded()')) ? stable + 1 : 0;
      await new Promise((r) => setTimeout(r, 1500));
    }
    const file = join(outputRoot, `${shot.id}.png`);
    await page.screenshot({ path: file });
    manifest.push({ ...shot, groundHeightM: Math.round(ground), file, tilesSettled: stable >= 4 });
  }

  await writeFile(join(outputRoot, 'manifest.json'), JSON.stringify({
    createdAt: new Date().toISOString(),
    source: 'cesium-ion (World Terrain + ion world imagery)',
    purpose: 'Chapter 1 Sonoran dry-wash geographic reference for art direction',
    runtimeUse: 'reference_only_until_curated',
    viewport: VIEWPORT,
    shots: manifest,
  }, null, 2));
  await browser.close();
  console.log(`Geo reference capture complete: ${outputRoot}`);
}

main().catch((error) => {
  console.error(`Cesium capture failed: ${error.message}`);
  process.exitCode = 1;
});
