/**
 * No named Act 1 character is five grey shapes. Plan 2.1-2.3, 2.6.
 *
 * Owner: "make sure none of them are fillers." `Npc._buildHumanoid`
 * draws a head, a body and limbs out of Graphics primitives — it is a
 * developer fallback, and Old Miner Pete, Dr. Maya and Ranger Nita
 * were all shipping as one.
 *
 * `Npc` takes the procedural path only when no art is configured or the
 * texture has not loaded, so this checks the two things that decide it:
 * every `addNpc` call in an Act 1 scene names a sheet or an atlas
 * frame, and each of those names resolves to a real file of the right
 * shape. `tests/e2e/*` covers the "texture actually loaded" half in the
 * running game.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

import { ACT1_CHARACTER_SHEETS } from '../src/game/assets/act1ArtRegistry.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const SCENES = new URL('src/renderer/game/scenes/', root);

/** Every `this.addNpc({...})` call in a scene, as its config text. */
function npcCalls(src) {
  const out = [];
  let at = src.indexOf('this.addNpc({');
  while (at !== -1) {
    // Walk to the matching close brace so nested objects come along.
    let depth = 0;
    let i = src.indexOf('{', at);
    const start = i;
    for (; i < src.length; i += 1) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    out.push(src.slice(start, i + 1));
    at = src.indexOf('this.addNpc({', i);
  }
  return out;
}

function sceneFiles() {
  return readdirSync(SCENES).filter((f) => f.endsWith('Scene.js'));
}

test('the scene list is being read at all', () => {
  const files = sceneFiles();
  assert.ok(files.length >= 15, `only ${files.length} scenes found`);
  const withNpcs = files.filter((f) => npcCalls(read(`src/renderer/game/scenes/${f}`)).length);
  assert.ok(withNpcs.length >= 3,
    `only ${withNpcs.length} scenes appear to have NPCs — has addNpc been renamed?`);
});

test('every Act 1 NPC is painted art, not the procedural fallback', () => {
  const bare = [];
  for (const file of sceneFiles()) {
    const src = read(`src/renderer/game/scenes/${file}`);
    for (const cfg of npcCalls(src)) {
      const hasArt = /\bsheet:\s*'/.test(cfg) || /\batlasFrame:\s*'/.test(cfg);
      if (hasArt) continue;
      const id = (cfg.match(/id:\s*'([^']+)'/) || [, '(unnamed)'])[1];
      bare.push(`${file}: ${id}`);
    }
  }
  assert.deepEqual(bare, [],
    'these NPCs have no art and would be drawn as Graphics shapes');
});

test('every sheet an NPC names exists and is a 4x4 of 96px frames', () => {
  const problems = [];
  for (const file of sceneFiles()) {
    const src = read(`src/renderer/game/scenes/${file}`);
    for (const cfg of npcCalls(src)) {
      for (const m of cfg.matchAll(/\b(sheet|talkSheet):\s*'([^']+)'/g)) {
        const slot = m[2];
        const sheet = ACT1_CHARACTER_SHEETS[slot];
        if (!sheet) {
          problems.push(`${file}: ${slot} is not in the registry`);
          continue;
        }
        if (!existsSync(new URL(`public/${sheet.path}`, root))) {
          problems.push(`${file}: ${slot} has no file at ${sheet.path}`);
          continue;
        }
        if (sheet.frameWidth !== 96 || sheet.frameHeight !== 96
            || sheet.cols !== 4 || sheet.rows !== 4 || sheet.feetY !== 91) {
          problems.push(`${file}: ${slot} is ${sheet.cols}x${sheet.rows} of `
            + `${sheet.frameWidth}x${sheet.frameHeight}, feet ${sheet.feetY}`);
        }
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('the fallback stays, and says so when it fires', () => {
  // It is still the right thing to have — a missing texture should draw
  // SOMETHING rather than nothing — but it must not be silent, or art
  // that fails to load looks like a style choice.
  const npc = read('src/renderer/game/entities/Npc.js');
  assert.match(npc, /_buildHumanoid\(appearance\)/);
  assert.match(npc, /console\.warn\(/);
  assert.match(npc, /falling back to the procedural humanoid/);
});

test('a character with a talk sheet uses it while they are talking', () => {
  const npc = read('src/renderer/game/entities/Npc.js');
  assert.match(npc, /setTalking\(talking\)/);
  const base = read('src/renderer/game/scenes/LocalSceneBase.js');
  assert.match(base, /npc\.setTalking\?\.\(/,
    'nothing tells an NPC that they are the one speaking');
});
