import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { dirname, join, resolve } from 'node:path';

const API_ROOT = 'https://api.meshy.ai/openapi/v2/text-to-3d';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_MS = 12 * 60 * 1000;

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const outputRoot = join(root, 'generated_assets', 'meshy', 'act1_reference_pass');

const assetPrompts = [
  {
    id: 'broken_wash_bridge',
    prompt:
      'Game-ready low-poly stylized broken desert wash bridge prop for a child friendly bicycle adventure game, Sonoran Arizona neighborhood, warm stucco colors, cracked wooden planks, washed-out dry creek bed supports, readable silhouette, hand-painted texture feel, no text, no people.',
    texturePrompt:
      'Warm late-afternoon Sonoran palette, terracotta, tan wood, dusty teal shadow, subtle flood staining, painterly brush texture, child friendly, clean game asset.',
  },
  {
    id: 'salt_river_rock_water_kit',
    prompt:
      'Stylized modular Salt River desert creek environment kit, turquoise clear water ribbon with rounded red rocks, canyon stones, small saguaro and desert shrubs, low-poly game asset, painterly Arizona canyon colors, no text, no people.',
    texturePrompt:
      'Vivid turquoise water, orange red canyon reflection, warm rocks, painterly brush strokes, readable shapes for a browser game environment.',
  },
  {
    id: 'copper_mine_desert_trail_backdrop_prop',
    prompt:
      'Stylized copper mine desert trail backdrop prop, ochre dirt path, purple distant mountains, copper ore rock face, prickly pear cactus, sunset orange clouds, low-poly diorama asset for kid bicycle game, no text, no people.',
    texturePrompt:
      'Copper red and violet mine rock, golden desert trail, blue-purple shadows, expressive painted texture, warm educational adventure mood.',
  },
  {
    // v2: "modular kit" phrasing produced an incoherent jumble; ask for one
    // coherent diorama slice instead.
    id: 'salt_river_creek_bend_v2',
    prompt:
      'One coherent low-poly diorama slice of a desert creek bend: a smooth turquoise water ribbon curving between rounded red-orange river rocks, sandy banks, two small desert shrubs and one saguaro cactus, stylized game environment piece, readable silhouette, no text, no people.',
    texturePrompt:
      'Vivid turquoise water, warm red-orange smooth rocks, tan sand, painterly hand-painted brush strokes, child friendly browser game look.',
  },
  {
    // v2: "backdrop prop" phrasing collapsed to a few cacti; describe one
    // solid terrain chunk with the trail carved into it.
    id: 'copper_mine_trail_slice_v2',
    prompt:
      'One solid low-poly desert hillside terrain chunk with a winding ochre dirt trail carved across it, a copper mine rock face with rust-orange ore seams on one side, one prickly pear cactus and one saguaro, stylized diorama piece for a kid bicycle adventure game, readable silhouette, no text, no people.',
    texturePrompt:
      'Copper red and violet rock, golden ochre dirt trail, green cactus, warm sunset light, painterly hand-painted texture, clean game asset.',
  },
  {
    id: 'sonoran_neighborhood_bridge_diorama',
    prompt:
      'Small stylized Sonoran neighborhood diorama tile with stucco homes, red tile roofs, palm trees, saguaro cactus, lush desert plants, a broken wash bridge connecting two neighborhoods, low-poly game environment, no text, no people.',
    texturePrompt:
      'Warm Scottsdale desert neighborhood palette, terracotta roofs, pale stucco, green cactus, yellow sunset light, painterly child friendly finish.',
  },
];

function readDotenvValue(contents, name) {
  const line = contents.split(/\r?\n/).find((entry) => entry.trim().startsWith(`${name}=`));
  if (!line) return null;
  return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
}

async function loadMeshyKey() {
  if (process.env.MESHY_API_KEY) return process.env.MESHY_API_KEY;
  const candidates = [
    join(root, '.env'),
    'C:\\Users\\admin\\Documents\\executive-brain\\.env',
  ];
  for (const path of candidates) {
    try {
      const contents = await readFile(path, 'utf8');
      const value = readDotenvValue(contents, 'MESHY_API_KEY');
      if (value) return value;
    } catch {
      // Missing env files are fine; the caller will report the final failure.
    }
  }
  return null;
}

async function meshyRequest(apiKey, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!response.ok) {
    const message = body?.message || body?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

async function createPreview(apiKey, asset) {
  const body = await meshyRequest(apiKey, API_ROOT, {
    method: 'POST',
    body: JSON.stringify({
      mode: 'preview',
      prompt: asset.prompt,
      ai_model: 'latest',
      model_type: 'lowpoly',
      target_formats: ['glb'],
      moderation: true,
    }),
  });
  return body.result;
}

async function createRefine(apiKey, previewTaskId, asset) {
  const body = await meshyRequest(apiKey, API_ROOT, {
    method: 'POST',
    body: JSON.stringify({
      mode: 'refine',
      preview_task_id: previewTaskId,
      texture_prompt: asset.texturePrompt,
      ai_model: 'latest',
      enable_pbr: true,
      remove_lighting: true,
      target_formats: ['glb'],
    }),
  });
  return body.result;
}

async function pollTask(apiKey, taskId, label) {
  const start = Date.now();
  while (Date.now() - start < MAX_POLL_MS) {
    const task = await meshyRequest(apiKey, `${API_ROOT}/${taskId}`, { method: 'GET' });
    console.log(`${label}: ${task.status} ${task.progress ?? 0}%`);
    if (task.status === 'SUCCEEDED') return task;
    if (task.status === 'FAILED' || task.status === 'CANCELED') {
      throw new Error(`${label} ${task.status}: ${task.task_error?.message || 'unknown error'}`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, POLL_INTERVAL_MS));
  }
  throw new Error(`${label} timed out after ${Math.round(MAX_POLL_MS / 1000)} seconds`);
}

async function downloadFile(url, path) {
  if (!url) return null;
  await mkdir(dirname(path), { recursive: true });
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`);
  await pipeline(response.body, createWriteStream(path));
  return path;
}

async function generateAsset(apiKey, asset) {
  const assetDir = join(outputRoot, asset.id);
  await mkdir(assetDir, { recursive: true });
  await writeFile(join(assetDir, 'prompt.json'), JSON.stringify(asset, null, 2));

  console.log(`Creating Meshy preview for ${asset.id}`);
  const previewTaskId = await createPreview(apiKey, asset);
  const previewTask = await pollTask(apiKey, previewTaskId, `${asset.id} preview`);

  console.log(`Creating Meshy refine for ${asset.id}`);
  const refineTaskId = await createRefine(apiKey, previewTaskId, asset);
  const refineTask = await pollTask(apiKey, refineTaskId, `${asset.id} refine`);

  const glbPath = await downloadFile(refineTask.model_urls?.glb || previewTask.model_urls?.glb, join(assetDir, `${asset.id}.glb`));
  const thumbnailPath = await downloadFile(refineTask.thumbnail_url || previewTask.thumbnail_url, join(assetDir, `${asset.id}.png`));

  const manifest = {
    id: asset.id,
    createdAt: new Date().toISOString(),
    previewTaskId,
    refineTaskId,
    status: refineTask.status,
    consumedCredits: {
      preview: previewTask.consumed_credits,
      refine: refineTask.consumed_credits,
    },
    files: {
      glb: glbPath,
      thumbnail: thumbnailPath,
    },
    source: 'meshy-text-to-3d',
    runtimeUse: 'reference_only_until_curated',
  };
  await writeFile(join(assetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

async function main() {
  const apiKey = await loadMeshyKey();
  if (!apiKey) throw new Error('MESHY_API_KEY is not configured in environment or known .env files.');
  await mkdir(outputRoot, { recursive: true });

  const requested = new Set(process.argv.slice(2));
  const selectedAssets = requested.size
    ? assetPrompts.filter((asset) => requested.has(asset.id))
    : assetPrompts;
  if (!selectedAssets.length) {
    throw new Error(`No matching assets. Available: ${assetPrompts.map((asset) => asset.id).join(', ')}`);
  }

  const results = [];
  for (const asset of selectedAssets) {
    results.push(await generateAsset(apiKey, asset));
  }
  await writeFile(join(outputRoot, 'batch_manifest.json'), JSON.stringify(results, null, 2));
  console.log(`Meshy batch complete: ${outputRoot}`);
  console.log(results.map((result) => `${result.id}: ${result.files.glb}`).join('\n'));
}

main().catch((error) => {
  console.error(`Meshy generation failed: ${error.message}`);
  process.exitCode = 1;
});
