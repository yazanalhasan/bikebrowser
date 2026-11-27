/**
 * Nothing flashes the whole screen at a child, and no label hides behind a
 * character.
 *
 * The reviewer found three more full-screen flashes after the hazard one
 * was localised, in a camera-wiring path the fix had not touched:
 *   - a red flash on the second contact with the Scorching Pavement, which
 *     is on the natural route to the Workshop and the GPS;
 *   - a red flash on EVERY MCP tick while health is low, which is a strobe;
 *   - a white flash plus a camera shake on every quest the child finishes.
 * Two more sat in the explainer and the quiz on a correct answer.
 *
 * And labels: prop captions and prompts had been raised to depth 11/12, but
 * characters are y-sorted (`10 + y / 26`), so in the mine the child's own
 * depth reaches the high 30s and drew over them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import {
  NPC_LABEL_DEPTH, NPC_PROMPT_DEPTH, PROP_CAPTION_DEPTH, PROP_PROMPT_DEPTH,
} from '../src/renderer/game/systems/labelLayout.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** Every game source file, so a new flash anywhere is caught. */
function gameSources(dir = 'src/renderer/game', acc = []) {
  const base = new URL(`../${dir}/`, import.meta.url);
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) gameSources(rel, acc);
    else if (/\.(js|jsx)$/.test(entry.name)) acc.push(rel);
  }
  return acc;
}

test('no scene flashes the camera', () => {
  const offenders = [];
  for (const file of gameSources()) {
    const src = read(file);
    for (const [i, line] of src.split('\n').entries()) {
      if (!/cameras\s*\.\s*main\s*\.\s*flash\(/.test(line)) continue;
      // the one definition is allowed to exist; nothing may call it
      if (file.endsWith('physicsbridge.js') && /^\s*scene\.cameras\.main\.flash\(duration/.test(line)) continue;
      offenders.push(`${file}:${i + 1}`);
    }
  }
  assert.deepEqual(offenders, [],
    `a full-screen camera flash is back at ${offenders.join(', ')}`);
});

test('nothing calls the cameraFlash helper', () => {
  const callers = [];
  for (const file of gameSources()) {
    const src = read(file);
    for (const [i, line] of src.split('\n').entries()) {
      if (/\bcameraFlash\s*\(/.test(line) && !/export function cameraFlash/.test(line)) {
        callers.push(`${file}:${i + 1}`);
      }
    }
  }
  assert.deepEqual(callers, [], `cameraFlash is called again at ${callers.join(', ')}`);
});

test('the MCP camera wiring pulses on the player instead', () => {
  const bridge = read('src/renderer/game/systems/physicsbridge.js');
  assert.match(bridge, /OBSTACLE_FAILED_REPEATEDLY[\s\S]{0,120}pulseOnPlayer/);
  assert.match(bridge, /PLAYER_LOW_HEALTH[\s\S]{0,200}pulseOnPlayer/);
  assert.match(bridge, /QUEST_COMPLETED[\s\S]{0,160}pulseOnPlayer/);
});

test('low health pulses once, not on every tick', () => {
  // MCPSystem emits PLAYER_LOW_HEALTH on every update while health < 0.25.
  const bridge = read('src/renderer/game/systems/physicsbridge.js');
  assert.match(bridge, /_lowHealthPulsed/);
  assert.match(bridge, /PLAYER_HEALTH_RECOVERED/,
    'something has to clear the latch or it never pulses again');
});

test('finishing a quest does not shake the camera either', () => {
  const bridge = read('src/renderer/game/systems/physicsbridge.js');
  const quest = bridge.slice(bridge.indexOf("'QUEST_COMPLETED'"));
  const block = quest.slice(0, quest.indexOf('});'));
  assert.doesNotMatch(block, /cameraShake/);
});

// ── labels sit above every character ───────────────────────────────────────

test('labels are above anything the y-sort can reach', () => {
  // Player.js: depth = 10 + feetY / 26. The tallest Act 1 room is 1200px,
  // which puts a character at ~56; the mine measured 31-38.
  const player = read('src/renderer/game/entities/Player.js');
  assert.match(player, /10 \+ .*\/ 26/, 'the y-sort formula moved; re-check these depths');

  const worstCharacterDepth = 10 + 1200 / 26; // ~56.2
  for (const [name, depth] of [
    ['NPC_LABEL_DEPTH', NPC_LABEL_DEPTH],
    ['NPC_PROMPT_DEPTH', NPC_PROMPT_DEPTH],
    ['PROP_CAPTION_DEPTH', PROP_CAPTION_DEPTH],
    ['PROP_PROMPT_DEPTH', PROP_PROMPT_DEPTH],
  ]) {
    assert.ok(depth >= worstCharacterDepth,
      `${name} is ${depth}, under a character at the bottom of a tall room (${worstCharacterDepth.toFixed(1)})`);
  }
});

test('an NPC name and prompt use the label layer, not their own depth', () => {
  const npc = read('src/renderer/game/entities/Npc.js');
  assert.match(npc, /this\.label\.setDepth\(NPC_LABEL_DEPTH\)/);
  assert.match(npc, /this\.prompt\.setDepth\(NPC_PROMPT_DEPTH\)/);
  assert.doesNotMatch(npc, /this\.label\.setDepth\(depth \+/,
    'the name is back on the NPC own depth, so a child standing in front hides it');
});

test('the prompt still reads over its caption', () => {
  assert.ok(PROP_PROMPT_DEPTH > PROP_CAPTION_DEPTH);
  assert.ok(NPC_PROMPT_DEPTH > NPC_LABEL_DEPTH);
});
