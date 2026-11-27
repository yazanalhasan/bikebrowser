/**
 * Generate `src/game/assets/act1ArtRegistry.js` from `docs/act1-art-manifest.json`.
 *
 * The art manifest is the provenance record delivered with the Act 1 art
 * bundle (200 entries over 150 PNGs). This script turns it into the runtime
 * visual-token registry the game reads, so slot -> texture-key -> file-path
 * is derived from the manifest rather than hand-copied.
 *
 * Anchors are derived from the asset's role, which the target directory
 * already encodes:
 *   props/ plants/ animals/  -> 'ground' (origin 0.5,1 — the sprite stands on
 *                               its y; these PNGs are trimmed tight to bbox)
 *   items/ challenges/ map/ ui/ fx/ -> 'icon' (origin 0.5,0.5 — drawn at a point)
 *   grounds/                 -> 'tile' or 'backdrop' (see below)
 *
 * Re-run with:  node scripts/generate-act1-art-registry.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { pngAlphaBounds } from './lib/pngAlphaBounds.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'docs', 'act1-art-manifest.json');
const OUT = path.join(ROOT, 'src', 'game', 'assets', 'act1ArtRegistry.js');

// Scene grounds larger than a tile are full-scene backdrops, not tiling
// textures. The bundle ships these at 1920x1080.
const BACKDROP_MIN = 512;

const ICON_DIRS = new Set(['items', 'challenges', 'map', 'ui', 'fx']);
const GROUND_DIRS = new Set(['props', 'plants', 'animals']);

function keyFor(entry) {
  const rel = entry.target_repo_path.split('#')[0];
  if (rel.startsWith('public/assets/ecology/')) {
    const [, , , cat, file] = rel.split('/');
    const singular = cat === 'plants' ? 'plant' : cat === 'animals' ? 'animal' : 'terrain';
    return `ecology.${singular}.${path.basename(file, '.png')}`;
  }
  const parts = rel.split('/');            // public assets game act1 <dir> <file>
  const dir = parts[4];
  const name = path.basename(parts[5], '.png');
  return `act1.${dir}.${name}`;
}

function anchorFor(entry, width, height) {
  const rel = entry.target_repo_path.split('#')[0];
  const dir = rel.split('/')[4];
  if (entry.kind === 'scene_ground') {
    return Math.max(width, height) >= BACKDROP_MIN ? 'backdrop' : 'tile';
  }
  if (entry.kind === 'terrain_tile') return 'tile';
  if (entry.kind === 'ecology_sprite') return 'ground';
  if (ICON_DIRS.has(dir)) return 'icon';
  if (GROUND_DIRS.has(dir)) return 'ground';
  return 'icon';
}

function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(26);
  fs.readSync(fd, buf, 0, 26, 0);
  fs.closeSync(fd);
  if (buf.toString('latin1', 1, 4) !== 'PNG') throw new Error(`not a png: ${file}`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const sprites = new Map();     // key -> record (props, icons, ecology, grounds)
const characters = new Map();  // slot -> sheet record
const atlases = new Map();     // png -> { frames: [] }
const tilesets = new Map();

for (const entry of manifest.entries) {
  const rel = entry.target_repo_path.split('#')[0];
  const frag = entry.target_repo_path.includes('#')
    ? entry.target_repo_path.split('#')[1]
    : null;
  const abs = path.join(ROOT, rel.replace(/\//g, path.sep));
  const loadPath = rel.replace(/^public\//, '');

  if (entry.kind === 'atlas_frame') {
    if (!atlases.has(rel)) atlases.set(rel, { path: loadPath, frames: [] });
    atlases.get(rel).frames.push(frag);
    continue;
  }

  if (entry.kind === 'tileset_tile') {
    if (!tilesets.has(rel)) {
      const f = entry.frame || {};
      tilesets.set(rel, {
        key: 'sonoran_tiles',
        path: loadPath,
        tileWidth: (entry.size && entry.size[0]) || f.frameWidth || 64,
        tileHeight: (entry.size && entry.size[1]) || f.frameHeight || 64,
        tiles: 0,
      });
    }
    tilesets.get(rel).tiles += 1;
    continue;
  }

  if (entry.kind === 'character_sheet') {
    const f = entry.frame || {};
    characters.set(entry.slot, {
      slot: entry.slot,
      key: `char.${entry.slot}`,
      path: loadPath,
      frameWidth: f.frameWidth || 96,
      frameHeight: f.frameHeight || 96,
      cols: f.cols || 4,
      rows: f.rows || 4,
      feetY: f.feet_baseline_y || 91,
      rowOrder: f.row_order || '',
    });
    continue;
  }

  const { width, height } = pngSize(abs);
  const key = keyFor(entry);
  if (sprites.has(key)) continue;   // one record per file
  const anchor = anchorFor(entry, width, height);
  // Tiling textures that ship with a transparent border draw a visible grid
  // of gaps when repeated, so record the border and let the renderer tile
  // the cropped region. Only measured for tiles — a trimmed prop is fine.
  let trim = [0, 0, 0, 0];
  if (anchor === 'tile') {
    try {
      trim = pngAlphaBounds(abs).trim;
    } catch {
      trim = [0, 0, 0, 0];
    }
  }
  sprites.set(key, {
    slot: entry.slot,
    key,
    path: loadPath,
    kind: entry.kind,
    anchor,
    width,
    height,
    trim,
    replaces: entry.replaces || null,
    scenes: entry.scenes || null,
  });
}

function j(v) { return JSON.stringify(v); }

const lines = [];
lines.push('/**');
lines.push(' * Act 1 art registry — GENERATED FILE. Do not edit by hand.');
lines.push(' *');
lines.push(' * Source:    docs/act1-art-manifest.json');
lines.push(' * Generator: scripts/generate-act1-art-registry.mjs');
lines.push(' *');
lines.push(' * Maps art slots to Phaser texture keys and public-relative load paths.');
lines.push(' * This is the canonical visual-token table: scenes name a slot, never a');
lines.push(' * file path, so art can be re-cut without touching scene code (arc.md §4');
lines.push(' * "visual tokens come from data", §8.6 no primitive fragmentation).');
lines.push(' *');
lines.push(' * anchor:');
lines.push(" *   'ground'   origin (0.5, 1) — stands on its y");
lines.push(" *   'icon'     origin (0.5, 0.5) — drawn centred at a point");
lines.push(" *   'tile'     seamless texture, use as a tileSprite");
lines.push(" *   'backdrop' full-scene image");
lines.push(' */');
lines.push('');
lines.push(`export const ART_MANIFEST_PROVENANCE = ${j({
  project: manifest.project,
  pr: manifest.pr,
  generated: manifest.generated,
  entries: manifest.entries.length,
})};`);
lines.push('');

lines.push('/** slot/key -> sprite record. Keyed by texture key. */');
lines.push('export const ACT1_ART = Object.freeze({');
for (const r of [...sprites.values()].sort((a, b) => a.key.localeCompare(b.key))) {
  const trim = (r.trim || [0, 0, 0, 0]).some((n) => n > 0)
    ? `, trim: ${j(r.trim)}`
    : '';
  lines.push(`  ${j(r.key)}: Object.freeze({ key: ${j(r.key)}, path: ${j(r.path)}, `
    + `anchor: ${j(r.anchor)}, width: ${r.width}, height: ${r.height}, slot: ${j(r.slot)}${trim} }),`);
}
lines.push('});');
lines.push('');

lines.push('/** Character sheets (4x4 of 96px frames, feet baseline y=91). */');
lines.push('export const ACT1_CHARACTER_SHEETS = Object.freeze({');
for (const r of characters.values()) {
  lines.push(`  ${j(r.slot)}: Object.freeze({ key: ${j(r.key)}, path: ${j(r.path)}, `
    + `frameWidth: ${r.frameWidth}, frameHeight: ${r.frameHeight}, cols: ${r.cols}, `
    + `rows: ${r.rows}, feetY: ${r.feetY}, rowOrder: ${j(r.rowOrder)} }),`);
}
lines.push('});');
lines.push('');

lines.push('/** Atlases that back the Act 1 art (frame lists come from the atlas JSON). */');
lines.push('export const ACT1_ATLAS_FRAMES = Object.freeze({');
for (const [rel, v] of atlases) {
  const name = path.basename(rel, '.png');
  lines.push(`  ${j(name)}: Object.freeze(${j(v.frames.sort())}),`);
}
lines.push('});');
lines.push('');

lines.push('/** The Sonoran tileset. */');
lines.push('export const ACT1_TILESETS = Object.freeze([');
for (const v of tilesets.values()) {
  lines.push(`  Object.freeze({ key: ${j(v.key)}, path: ${j(v.path)}, `
    + `tileWidth: ${v.tileWidth}, tileHeight: ${v.tileHeight}, tiles: ${v.tiles} }),`);
}
lines.push(']);');
lines.push('');

lines.push('/**');
lines.push(' * Art slot name -> texture key. Scenes import this and write');
lines.push(' * `ART.saguaro` instead of a raw key string, so a renamed or dropped');
lines.push(' * slot is an immediate undefined rather than a silent missing texture.');
lines.push(' */');
lines.push('export const ART = Object.freeze({');
for (const r of [...sprites.values()].sort((a, b) => a.slot.localeCompare(b.slot))) {
  lines.push(`  ${j(r.slot)}: ${j(r.key)},`);
}
lines.push('});');
lines.push('');

lines.push('/** Every image texture Act 1 loads, as {key, path}. */');
lines.push('export const ACT1_IMAGE_LOADS = Object.freeze(');
lines.push('  Object.values(ACT1_ART).map((r) => Object.freeze({ key: r.key, path: r.path })),');
lines.push(');');
lines.push('');
lines.push('/** Look up an art record by texture key. Returns null when unknown. */');
lines.push('export function getArt(key) {');
lines.push('  return ACT1_ART[key] || null;');
lines.push('}');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(
  `wrote ${path.relative(ROOT, OUT)}: ${sprites.size} sprites, `
  + `${characters.size} character sheets, ${atlases.size} atlases, ${tilesets.size} tileset(s)`,
);
