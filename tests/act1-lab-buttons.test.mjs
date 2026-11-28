/**
 * A lab station's buttons are never under a hint.
 *
 * The scale's RECORD button sat at depth 4 while the generic "💬 Interact"
 * prompt sat on the shared label layer at 65, four pixels away — so the
 * one thing the child had to press was covered by a hint telling them to
 * press something else. Plan item 0.2.
 *
 * Two rules, both checked here:
 *   - a station button outranks every prompt in depth;
 *   - while a station is waiting for a press, its prop's prompt stands
 *     down, so they never share the spot in the first place.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  LAB_BUTTON_DEPTH, PROP_PROMPT_DEPTH, PROP_CAPTION_DEPTH,
  NPC_PROMPT_DEPTH, COMPANION_PROMPT_DEPTH, labelsOverlap, labelBox,
} from '../src/renderer/game/systems/labelLayout.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('a station button is above every prompt on screen', () => {
  for (const [name, depth] of [
    ['PROP_PROMPT_DEPTH', PROP_PROMPT_DEPTH],
    ['PROP_CAPTION_DEPTH', PROP_CAPTION_DEPTH],
    ['NPC_PROMPT_DEPTH', NPC_PROMPT_DEPTH],
    ['COMPANION_PROMPT_DEPTH', COMPANION_PROMPT_DEPTH],
  ]) {
    assert.ok(LAB_BUTTON_DEPTH > depth,
      `LAB_BUTTON_DEPTH ${LAB_BUTTON_DEPTH} is not above ${name} ${depth}`);
  }
});

test('RECORD is drawn on that layer, not at 4', () => {
  const station = read('src/renderer/game/systems/lab/scaleStation.js');
  assert.match(station, /setDepth\(LAB_BUTTON_DEPTH\)/);
  assert.match(station, /'✎ RECORD'[\s\S]{0,200}setDepth\(LAB_BUTTON_DEPTH \+ 1\)/);
  assert.doesNotMatch(station, /'✎ RECORD'[\s\S]{0,200}setDepth\(5\)/);
});

test('the scale stands its prompt down while RECORD is waiting', () => {
  const station = read('src/renderer/game/systems/lab/scaleStation.js');
  assert.match(station, /function isAwaitingInput\(\)/);
  assert.match(station, /return Boolean\(recordButton\);/);

  const lab = read('src/renderer/game/scenes/MaterialLabScene.js');
  assert.match(lab, /promptSuppressed: \(\) => Boolean\(this\._scale\?\.isAwaitingInput\?\.\(\)\)/);

  const base = read('src/renderer/game/scenes/LocalSceneBase.js');
  assert.match(base, /prop\.promptSuppressed\(\)/);
  assert.match(base, /setVisible\(prop === nearest && !suppressed\)/);
});

test('a suppressed prompt also stops the HUD fading for it', () => {
  // `propPromptVisible` drives the quest column's fade; a prompt that is
  // not drawn must not count as one that is.
  const base = read('src/renderer/game/scenes/LocalSceneBase.js');
  const line = base.split('\n').find((l) => l.includes('const anyPrompting'));
  assert.ok(line);
  assert.match(base, /anyPrompting = Boolean\(nearest\)\s*\n\s*&& !\(typeof nearest\.promptSuppressed/);
});

test('RECORD and the prompt would collide if both were drawn', () => {
  // Proof the rule is needed: the scale's prompt is at displayY + 34 and
  // RECORD at displayY + 38, 86x26. Without the rule they overlap.
  const displayY = 400;
  const prompt = labelBox(560, displayY + 34 - 9, 70, 18);
  const record = labelBox(560, displayY + 38 - 13, 86, 26);
  assert.equal(labelsOverlap(prompt, record), true);
});
