#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const sceneDir = path.join(root, 'src', 'renderer', 'game', 'scenes');
const manifestPath = path.join(root, 'src', 'game', 'assets', 'assetManifest.js');
const metadataPath = path.join(root, 'src', 'game', 'assets', 'assetMetadata.js');

const warnings = [];

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, predicate);
    return predicate(full) ? [full] : [];
  });
}

function warn(file, line, message) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  warnings.push(`${rel}${line ? `:${line}` : ''} ${message}`);
}

function scanScenes() {
  const files = walk(sceneDir, (file) => file.endsWith('.js') || file.endsWith('.jsx'));
  const emojiPattern = /['"`][^'"`]*(?:[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}])[^'"`]*['"`]/u;
  const directImagePattern = /load\.image\(|add\.image\([^,\n]+,\s*[^,\n]+,\s*['"`]\/?assets\//;
  const rawLabelPattern = /add\.text\([^)]*(House|Bike GPS|Flat Tire|Garage|Workshop|Javelina|Jackrabbit|Coyote|Mesquite|Creosote|Agave|Yucca)/;

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const n = index + 1;
      if (directImagePattern.test(line)) warn(file, n, 'direct image path in scene; prefer assetManifest + atlas helper.');
      if (emojiPattern.test(line) && !line.includes('speaker') && !line.includes('journal')) warn(file, n, 'emoji literal in scene; verify it is UI/dialog, not world art.');
      if (rawLabelPattern.test(line) && !line.includes('createWorldLabel') && !line.includes('_drawMapLabel')) {
        warn(file, n, 'raw world label text; use WorldLabel.');
      }
    });
  }
}

function extractManifestAssets() {
  const text = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '';
  const paths = [...text.matchAll(/(?:image|json|path):\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
  for (const publicPath of paths) {
    const diskPath = path.join(root, 'public', publicPath.replace(/^\/+/, ''));
    if (!fs.existsSync(diskPath)) warn(manifestPath, null, `manifest references missing asset: ${publicPath}`);
  }
}

function scanAtlasFrames() {
  const atlasFiles = walk(path.join(root, 'public', 'assets', 'game', 'atlases'), (file) => file.endsWith('.json'));
  const metadataText = fs.existsSync(metadataPath) ? fs.readFileSync(metadataPath, 'utf8') : '';
  const expectedFrames = [...metadataText.matchAll(/^\s*([A-Za-z0-9_' -]+):\s*\{/gm)]
    .map((m) => m[1].replace(/^['"]|['"]$/g, ''));

  for (const atlas of atlasFiles) {
    try {
      const atlasName = path.basename(atlas, '.json');
      const data = JSON.parse(fs.readFileSync(atlas, 'utf8'));
      const frames = new Set(Array.isArray(data.frames)
        ? data.frames.map((frame) => frame.filename)
        : Object.keys(data.frames || {}));
      for (const frame of expectedFrames) {
        if (frame.startsWith('zuzu_') || frame.startsWith('npc_') || frame.startsWith('plant_') || frame.startsWith('animal_') || frame.startsWith('prop_') || frame.startsWith('house_') || frame.startsWith('building_') || frame.startsWith('sign_')) {
          if (atlasName === 'zuzu' && !frame.startsWith('zuzu_')) continue;
          if (atlasName === 'neighborhood' && frame.startsWith('zuzu_')) continue;
          if (!frames.has(frame)) warn(atlas, null, `atlas does not contain expected frame: ${frame}`);
        }
      }
    } catch (error) {
      warn(atlas, null, `could not parse atlas JSON: ${error.message}`);
    }
  }
}

scanScenes();
extractManifestAssets();
scanAtlasFrames();

if (warnings.length) {
  console.log('Game asset audit warnings:');
  for (const message of warnings) console.log(`- ${message}`);
} else {
  console.log('Game asset audit passed: no warnings.');
}
