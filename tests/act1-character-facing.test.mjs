/**
 * A character faces the way the frame's name says.
 *
 * Plan item 0.10. After a left walk Zuzu's idle frame showed him facing
 * right, and after a right walk he faced left: the two idle cells in
 * `zuzu.json` were swapped, while both walk cycles were correct.
 *
 * This reads the atlas pixels rather than trusting a coordinate, so the
 * next time a cell moves the test still knows which way the boy is
 * looking. In a side view the face is on the side he faces and the back
 * of the hair is on the other, so the skin centroid sits to the facing
 * side of the hair centroid.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { readPng, crop, eachPixel } from './helpers/png.mjs';

const root = new URL('../', import.meta.url);
const atlas = readPng(new URL('public/assets/game/atlases/zuzu.png', root));
const frames = JSON.parse(
  readFileSync(new URL('public/assets/game/atlases/zuzu.json', root), 'utf8'),
).frames;

/**
 * 'left' | 'right' | null — which way the character in this frame looks.
 *
 * Skin is warm and bright; hair is mid-brown and darker. Both are
 * sampled from the head band only, so the shirt and shoes stay out of it.
 */
function facingOf(frameName) {
  const f = frames[frameName]?.frame;
  if (!f) throw new Error(`no such frame: ${frameName}`);
  const cell = crop(atlas, f.x, f.y, f.w, f.h);

  let skinSum = 0;
  let skinCount = 0;
  let hairSum = 0;
  let hairCount = 0;
  const top = Math.round(cell.height * 0.18);
  const bottom = Math.round(cell.height * 0.45);

  eachPixel(cell, (x, y, r, g, b, a) => {
    if (a < 80 || y < top || y >= bottom) return;
    if (r > 190 && g > 130 && g < 205 && b < 165 && r - b > 55) {
      skinSum += x; skinCount += 1;
    } else if (r > 90 && r < 175 && g > 45 && g < 120 && b < 95 && r - b > 40) {
      hairSum += x; hairCount += 1;
    }
  });

  if (skinCount < 4 || hairCount < 20) return null;
  return skinSum / skinCount > hairSum / hairCount ? 'right' : 'left';
}

test('the measurement can tell the two directions apart', () => {
  // Guard the guard: if this ever returns the same answer for both sides,
  // every assertion below would pass by accident.
  const left = facingOf('zuzu_walk_left_01');
  const right = facingOf('zuzu_walk_right_01');
  assert.ok(left, 'could not read a facing from zuzu_walk_left_01');
  assert.ok(right, 'could not read a facing from zuzu_walk_right_01');
  assert.notEqual(left, right);
});

test('every left-facing Zuzu frame faces left', () => {
  const wrong = [];
  for (const name of Object.keys(frames)) {
    if (!/_left(_\d+)?$/.test(name)) continue;
    const dir = facingOf(name);
    if (dir && dir !== 'left') wrong.push(name);
  }
  assert.deepEqual(wrong, [], 'these frames are named left but face right');
});

test('every right-facing Zuzu frame faces right', () => {
  const wrong = [];
  for (const name of Object.keys(frames)) {
    if (!/_right(_\d+)?$/.test(name)) continue;
    const dir = facingOf(name);
    if (dir && dir !== 'right') wrong.push(name);
  }
  assert.deepEqual(wrong, [], 'these frames are named right but face left');
});

test('the idle frame agrees with the walk cycle it follows', () => {
  // This is the bug as a child met it: walk left, stop, and he turns round.
  for (const side of ['left', 'right']) {
    const idle = facingOf(`zuzu_idle_${side}`);
    const walk = facingOf(`zuzu_walk_${side}_01`);
    assert.equal(idle, walk, `idle_${side} and walk_${side}_01 face different ways`);
  }
});

test('the scene asks for the frame that matches the direction', () => {
  const src = readFileSync(new URL('src/game/characters/createZuzu.js', root), 'utf8');
  assert.match(src, /left:\s*'zuzu_idle_left'/);
  assert.match(src, /right:\s*'zuzu_idle_right'/);
});

// ── the walk cycles are actually shown ─────────────────────────────────────

test('the atlas really does carry four frames per direction', () => {
  for (const dir of ['down', 'up', 'left', 'right']) {
    for (const i of ['01', '02', '03', '04']) {
      assert.ok(frames[`zuzu_walk_${dir}_${i}`], `zuzu_walk_${dir}_${i} is missing`);
    }
  }
});

test('the walk stops when the child lets go of the key', () => {
  // `playWalk` runs the cycle; nothing ever stopped it. Phaser keeps
  // advancing a playing animation every tick, so the idle frame that
  // `setFacing` writes is overwritten on the very next frame and Zuzu
  // keeps walking on the spot after the key is released. `createZuzu`
  // has had a `stop()` since the atlas landed and no one called it.
  const player = readFileSync(new URL('src/renderer/game/entities/Player.js', root), 'utf8');
  const branch = player.match(
    /if \(this\._state === 'walk'\)[\s\S]{0,600}?setFacing\?\.\(this\.facing\)/);
  assert.ok(branch, 'the atlas walk/idle branch moved; re-point this test');
  assert.match(branch[0], /stop\?\.\(\)/,
    'the else branch must stop the animation before setting the idle frame');

  const zuzu = readFileSync(new URL('src/game/characters/createZuzu.js', root), 'utf8');
  assert.match(zuzu, /stop\(\) \{\s+sprite\.stop\(\);/);
});

test('something registers the walk animations', () => {
  // `playWalk` asks for `zuzu-walk-<dir>` and `Player.update` calls it
  // while walking, but nothing ever called the registrar, so
  // `anims.exists` was always false and Zuzu slid around on one idle
  // frame — 16 frames of walk art that never reached the screen.
  const base = readFileSync(new URL('src/renderer/game/scenes/LocalSceneBase.js', root), 'utf8');
  assert.match(base, /registerZuzuAnimations\(this\)/);
  assert.match(base, /registerNPCAnimations\(this\)/);
  assert.match(base, /registerCharacterAnimations\.js'/);

  const registrar = readFileSync(
    new URL('src/game/characters/registerCharacterAnimations.js', root), 'utf8',
  );
  assert.match(registrar, /const key = `zuzu-walk-/);
  assert.match(registrar, /scene\.anims\.create\(/);
  const player = readFileSync(new URL('src/renderer/game/entities/Player.js', root), 'utf8');
  assert.match(player, /playWalk\?\.\(this\.facing\)/);
});
