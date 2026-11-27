/**
 * Every sound the game asks for has to exist.
 *
 * The console filled with "[AudioManager] Unknown asset key: ui_click" —
 * three keys that were never in the manifest (`ui_click`, `ui_open`,
 * `discover`), each the near-miss of a real one (`ui_tap`,
 * `ui_panel_open`, `desert_discovery`). A missing key is silent in the
 * game and noisy in the console, which is the worst of both: the child
 * loses the sound and the next person reading the console loses the real
 * errors in the scroll.
 *
 * This walks the source for the keys the code plays and checks each one
 * against the manifest, so a typo fails here instead of in front of a
 * child.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

function gameSources(dir = 'src/renderer/game', acc = []) {
  const base = new URL(`../${dir}/`, import.meta.url);
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) gameSources(rel, acc);
    else if (/\.(js|jsx)$/.test(entry.name)) acc.push(rel);
  }
  return acc;
}

/** Keys declared in the audio manifest. */
function manifestKeys() {
  const src = read('src/renderer/game/audio/audioManifest.js');
  return new Set([...src.matchAll(/key:\s*'([a-z0-9_]+)'/g)].map((m) => m[1]));
}

/** Keys any scene or system asks to play, with where it asks. */
function playedKeys() {
  const calls = [];
  const pattern = /play(?:Sfx|Stinger|Music|Ambience)\??\.?\(\s*'([a-z0-9_]+)'/g;
  for (const file of gameSources()) {
    const src = read(file);
    for (const [i, line] of src.split('\n').entries()) {
      for (const m of line.matchAll(pattern)) {
        calls.push({ key: m[1], where: `${file}:${i + 1}` });
      }
    }
  }
  return calls;
}

test('the manifest is not empty (the scan still works)', () => {
  const keys = manifestKeys();
  assert.ok(keys.size > 30, `only found ${keys.size} keys — the manifest format changed`);
  assert.ok(keys.has('ui_tap'));
});

test('the scan finds the calls (it would pass on an empty list otherwise)', () => {
  const calls = playedKeys();
  assert.ok(calls.length > 20, `only found ${calls.length} play calls — the scan missed them`);
});

test('every sound the game plays exists in the manifest', () => {
  const keys = manifestKeys();
  const missing = playedKeys().filter((c) => !keys.has(c.key));
  assert.deepEqual(
    missing.map((m) => `${m.key} (${m.where})`),
    [],
    'these keys warn "[AudioManager] Unknown asset key" and play nothing',
  );
});

test('the three that were wrong point at the right sounds now', () => {
  assert.match(read('src/renderer/game/scenes/LabRigBase.js'), /playSfx\?\.\('ui_tap'\)/);
  assert.match(read('src/renderer/game/scenes/DryWashScene.js'), /playSfx\?\.\('ui_panel_open'\)/);
  assert.match(read('src/renderer/game/scenes/WorldMapScene.js'), /playSfx\('desert_discovery'\)/);
});
