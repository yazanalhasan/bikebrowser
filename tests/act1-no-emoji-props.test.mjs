/**
 * A world object is art, not an emoji. Plan 2.4 and 2.7.
 *
 * Owner: "these blobs need to be substituted as well." An emoji in a
 * Text object is a different art style from everything around it, it
 * renders differently on every platform, and at a prop's size it is a
 * smudge — the wilted plant was a 28px 🥀 standing in a painted desert.
 *
 * This is a ratchet, not a cliff. Ten obstacle and puzzle icons were
 * emoji when it was written; the wilted plant is art now and the rest
 * are named below. The list may shrink and must never grow, and
 * nothing new may arrive as an emoji.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const obstacles = read('src/renderer/game/data/obstacles.js');

/**
 * Still drawn as an emoji, each with the plan item that replaces it.
 *
 * These are obstacles and puzzles in scenes beyond the first quest.
 * Phase 2.7 is the audit that clears them.
 */
const KNOWN_EMOJI_ICONS = [
  '💦', // Muddy Path
  '🔨', // Broken Fence
  '🌊', // Deep Water
  '🧪', // Dirty Spring
  '🧗', // Steep Cliff
  '🥶', // Freezing Altitude
  '☀️', // Scorching Desert
  '🪧', // a trail sign
  '🔧', // a repair point
  '📟', // a device
];

/** Every `icon: '...'` literal in the obstacle data. */
function iconLiterals() {
  return [...obstacles.matchAll(/\bicon:\s*'([^']*)'/g)].map((m) => m[1]);
}

test('the obstacle data is being read', () => {
  const icons = iconLiterals();
  assert.ok(icons.length >= 8, `only ${icons.length} icon literals found`);
});

test('the wilted plant is painted art', () => {
  // Plan 2.4 by name: it is the first thing a child meets in the desert.
  assert.match(obstacles, /icon:\s*ART\.wilted_plant/);
  assert.match(obstacles, /solvedIcon:\s*ART\.recovered_plant/,
    'watering it has to change the plant, or the child cannot see that they fixed it');
  assert.doesNotMatch(obstacles, /icon:\s*'🥀'/);
});

test('no new emoji prop has appeared, and the old ones only go away', () => {
  const icons = iconLiterals().filter(Boolean);
  const unexpected = icons.filter((i) => !KNOWN_EMOJI_ICONS.includes(i));
  assert.deepEqual(unexpected, [],
    'a world object arrived as an emoji instead of art');
  assert.ok(icons.length <= KNOWN_EMOJI_ICONS.length,
    `emoji props grew to ${icons.length}: ${icons.join(' ')}`);
});

test('the recovered plant swaps in where the child can see it', () => {
  const system = read('src/renderer/game/systems/obstacleSystem.js');
  assert.match(system, /puzzle\.solvedIcon/);
  assert.match(system, /setTexture\(art\.key\)/);
  // And the prompt goes, so it stops inviting a press that does nothing.
  assert.match(system, /interactable\.prompt\?\.destroy\?\.\(\)/);
});
