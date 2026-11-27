/**
 * Act 1 art integrity.
 *
 * The art registry is generated from docs/act1-art-manifest.json, and the
 * runtime trusts it completely: a scene names a slot and expects a texture.
 * These tests are the gate that keeps that trust honest — if an asset is
 * deleted, moved, re-cut at the wrong size, or an atlas frame name drifts
 * away from its JSON, the suite fails here rather than the player meeting a
 * missing texture where a saguaro should be.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import {
  ACT1_ART,
  ACT1_CHARACTER_SHEETS,
  ACT1_ATLAS_FRAMES,
  ACT1_TILESETS,
  ACT1_IMAGE_LOADS,
  ART,
  ART_MANIFEST_PROVENANCE,
} from '../src/game/assets/act1ArtRegistry.js';
import { ASSET_MANIFEST } from '../src/game/assets/assetManifest.js';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

/** Read a PNG's pixel dimensions from its IHDR header. */
function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(26);
  fs.readSync(fd, buf, 0, 26, 0);
  fs.closeSync(fd);
  assert.equal(buf.toString('latin1', 1, 4), 'PNG', `${file} is not a PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function publicFile(relPath) {
  return path.join(PUBLIC, relPath.replace(/^\/+/, '').split('/').join(path.sep));
}

test('the art bundle landed: 117 reused + 83 generated over 150 files', () => {
  assert.equal(ART_MANIFEST_PROVENANCE.entries, 200);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'act1-art-manifest.json'), 'utf8'),
  );
  const origins = manifest.entries.reduce((acc, e) => {
    acc[e.origin] = (acc[e.origin] || 0) + 1;
    return acc;
  }, {});
  assert.equal(origins.reused, 117);
  assert.equal(origins.generated, 83);

  const files = new Set(manifest.entries.map((e) => e.target_repo_path.split('#')[0]));
  assert.equal(files.size, 150);
});

test('every registered sprite exists on disk at its declared size', () => {
  const missing = [];
  const wrongSize = [];
  for (const rec of Object.values(ACT1_ART)) {
    const file = publicFile(rec.path);
    if (!fs.existsSync(file)) {
      missing.push(rec.path);
      continue;
    }
    const { width, height } = pngSize(file);
    if (width !== rec.width || height !== rec.height) {
      wrongSize.push(`${rec.path}: registry ${rec.width}x${rec.height}, file ${width}x${height}`);
    }
  }
  assert.deepEqual(missing, [], 'Act 1 sprites missing from public/');
  assert.deepEqual(wrongSize, [], 'Act 1 sprites re-cut without regenerating the registry');
});

test('every ART slot points at a real registry record', () => {
  const dangling = Object.entries(ART).filter(([, key]) => !ACT1_ART[key]);
  assert.deepEqual(dangling, [], 'ART slot names pointing at unknown texture keys');
  // 143 single-image records: 150 files minus 2 atlases, 4 character sheets
  // and 1 tileset, which load through their own paths.
  assert.equal(Object.keys(ACT1_ART).length, 143);
});

test('character sheets are 4x4 of 96px frames with feet on y=91', () => {
  assert.deepEqual(
    Object.keys(ACT1_CHARACTER_SHEETS).sort(),
    ['lina_idle', 'lina_walk', 'mariam_idle', 'mariam_talk'],
  );
  for (const [slot, sheet] of Object.entries(ACT1_CHARACTER_SHEETS)) {
    const file = publicFile(sheet.path);
    assert.ok(fs.existsSync(file), `${slot} sheet missing: ${sheet.path}`);
    const { width, height } = pngSize(file);
    assert.equal(width, sheet.frameWidth * sheet.cols, `${slot} sheet width`);
    assert.equal(height, sheet.frameHeight * sheet.rows, `${slot} sheet height`);
    assert.equal(sheet.feetY, 91, `${slot} feet baseline`);
    assert.ok(sheet.feetY < sheet.frameHeight, `${slot} feet baseline inside the frame`);
  }
});

test('atlas frame names match the atlas JSON exactly', () => {
  for (const [name, frames] of Object.entries(ACT1_ATLAS_FRAMES)) {
    const jsonFile = publicFile(`assets/game/atlases/${name}.json`);
    const pngFile = publicFile(`assets/game/atlases/${name}.png`);
    assert.ok(fs.existsSync(jsonFile), `${name}.json missing`);
    assert.ok(fs.existsSync(pngFile), `${name}.png missing`);

    const atlas = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    assert.deepEqual(
      [...frames].sort(),
      Object.keys(atlas.frames).sort(),
      `${name} frame names drifted from the atlas JSON`,
    );

    // The sheet must be big enough for the frames the JSON carves out of it.
    const { width, height } = pngSize(pngFile);
    assert.equal(width, atlas.meta.size.w, `${name}.png width vs atlas meta`);
    assert.equal(height, atlas.meta.size.h, `${name}.png height vs atlas meta`);
  }
  assert.equal(ACT1_ATLAS_FRAMES.zuzu.length, 23);
  assert.equal(ACT1_ATLAS_FRAMES.neighborhood.length, 22);
});

test('the Sonoran tileset holds its 8 tiles', () => {
  assert.equal(ACT1_TILESETS.length, 1);
  const [tileset] = ACT1_TILESETS;
  const file = publicFile(tileset.path);
  assert.ok(fs.existsSync(file), 'sonoran_tiles.png missing');
  const { width, height } = pngSize(file);
  const cols = width / tileset.tileWidth;
  const rows = height / tileset.tileHeight;
  assert.ok(Number.isInteger(cols) && Number.isInteger(rows), 'tileset is not a whole grid');
  assert.equal(cols * rows, 8, 'tileset should hold exactly 8 tiles');
  assert.equal(tileset.tiles, 8);
});

test('the preload manifest resolves every path it declares', () => {
  const groups = [
    ['images', ASSET_MANIFEST.images.map((i) => i.path)],
    ['tilesets', ASSET_MANIFEST.tilesets.map((t) => t.path)],
    ['spritesheets', ASSET_MANIFEST.spritesheets.map((s) => s.path)],
    ['atlases', ASSET_MANIFEST.atlases.flatMap((a) => [a.image, a.json])],
    ['tilemaps', ASSET_MANIFEST.tilemaps.map((t) => t.path)],
  ];
  for (const [label, paths] of groups) {
    const missing = paths.filter((p) => !fs.existsSync(publicFile(p)));
    assert.deepEqual(missing, [], `${label} declared but not on disk`);
  }
  // Every Act 1 image reaches the loader.
  assert.equal(
    ACT1_IMAGE_LOADS.every((r) => ASSET_MANIFEST.images.some((i) => i.key === r.key)),
    true,
    'an Act 1 image is in the registry but never preloaded',
  );
  // Both character sheets per new character are loaded as spritesheets.
  for (const sheet of Object.values(ACT1_CHARACTER_SHEETS)) {
    assert.ok(
      ASSET_MANIFEST.spritesheets.some((s) => s.key === sheet.key),
      `${sheet.key} is not preloaded as a spritesheet`,
    );
  }
});

test('texture keys are unique across every preload group', () => {
  const keys = [
    ...ASSET_MANIFEST.images.map((i) => i.key),
    ...ASSET_MANIFEST.tilesets.map((t) => t.key),
    ...ASSET_MANIFEST.spritesheets.map((s) => s.key),
    ...ASSET_MANIFEST.atlases.map((a) => a.key),
  ];
  const seen = new Set();
  const duplicates = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
  assert.deepEqual(duplicates, [], 'duplicate texture keys would overwrite each other');
});
