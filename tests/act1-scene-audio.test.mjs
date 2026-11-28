/**
 * No scene may be pointed at a music key with no audio behind it.
 *
 * `desert_discovery.ogg` is a 0-byte placeholder. A scene mapped to it fades
 * the previous track out and then plays nothing, so the room goes silent.
 * `audioManifest.js` already carried a prose note saying so, and the Desert
 * Edge split walked straight into it anyway — prose does not execute. This
 * does.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SCENE_MUSIC, SCENE_MUSIC_ALT, MUSIC,
} from '../src/renderer/game/audio/audioManifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

/** Every extension the loader may fall back to for a given manifest path. */
const EXTS = ['.ogg', '.mp3', '.m4a', '.wav'];

/** Bytes of the largest real file backing a manifest path, 0 if none exist. */
function trackBytes(manifestPath) {
  const rel = manifestPath.replace(/^\//, '');
  let best = 0;
  for (const ext of EXTS) {
    const file = path.join(PUBLIC, rel + ext);
    if (fs.existsSync(file)) best = Math.max(best, fs.statSync(file).size);
  }
  return best;
}

const byKey = new Map(MUSIC.map((t) => [t.key, t]));

test('the music manifest is readable and non-empty', () => {
  assert.ok(byKey.size > 0, 'no tracks found — the manifest shape changed');
});

test('every scene music key resolves to a track in the manifest', () => {
  for (const [scene, key] of Object.entries({ ...SCENE_MUSIC, ...SCENE_MUSIC_ALT })) {
    assert.ok(byKey.has(key), `${scene} points at unknown music key "${key}"`);
  }
});

test('no scene is pointed at a track with no audio on disk', () => {
  const silent = [];
  for (const [scene, key] of Object.entries(SCENE_MUSIC)) {
    const track = byKey.get(key);
    if (!track) continue;
    if (trackBytes(track.path) === 0) silent.push(`${scene} -> ${key}`);
  }
  assert.deepEqual(
    silent, [],
    'these scenes would fade out and then play nothing:\n  ' + silent.join('\n  '),
  );
});

test('Desert Edge in particular has real music', () => {
  // The scene this guard was written for.
  const key = SCENE_MUSIC.DesertEdgeScene;
  assert.ok(key, 'Desert Edge must have a music mapping at all');
  assert.notEqual(key, 'desert_discovery', 'that file is a 0-byte placeholder');
  assert.ok(trackBytes(byKey.get(key).path) > 0, `${key} has no audio on disk`);
});
