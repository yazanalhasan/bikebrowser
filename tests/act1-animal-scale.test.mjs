/**
 * An animal is drawn at its own size. Plan 2.6 row k.
 *
 * All three animals Act 1 spawns — a coyote, a javelina and a
 * jackrabbit, all in the Desert Edge — came off the shared 128x128
 * ecology canvas at a flat `displayHeight: 52`. Two things followed:
 * every one of them was resampled at runtime, and a jackrabbit was the
 * same height on screen as a coyote. In a biology game.
 *
 * They now have Act 1 cuts, authored at the size they are drawn, sized
 * against the human scale (a chibi adult is about 84px tall).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

import { ACT1_ART, ART } from '../src/game/assets/act1ArtRegistry.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const ANIMALS = ['jackrabbit', 'javelina', 'coyote'];

test('each Act 1 animal has a cut of its own', () => {
  for (const slot of ANIMALS) {
    const key = ART[slot];
    assert.ok(key, `${slot} is not an ART slot`);
    const rec = ACT1_ART[key];
    assert.ok(rec, `${slot} has no registry record`);
    assert.ok(existsSync(new URL(`public/${rec.path}`, root)), `${slot} has no file`);
  }
});

test('a jackrabbit is not the size of a coyote', () => {
  const h = Object.fromEntries(ANIMALS.map((s) => [s, ACT1_ART[ART[s]].height]));
  assert.ok(h.jackrabbit < h.javelina, `jackrabbit ${h.jackrabbit} vs javelina ${h.javelina}`);
  assert.ok(h.javelina < h.coyote, `javelina ${h.javelina} vs coyote ${h.coyote}`);
  // And none of them is taller than a person.
  for (const [slot, height] of Object.entries(h)) {
    assert.ok(height < 84, `${slot} is ${height}px, taller than an adult`);
  }
});

test('nothing resizes them at draw time', () => {
  const src = read('src/renderer/game/systems/foragingScenery.js');
  assert.match(src, /ACT1_ANIMAL_SLOT/);
  // The flat height is only for a species with no Act 1 cut.
  assert.match(src, /\.\.\.\(cut \? \{\} : \{ displayHeight: 52 \}\)/,
    'the Act 1 cut must be drawn 1:1, with the fallback height only for the rest');
});

test('the shared ecology pack was not edited to do it', () => {
  // Other systems read those canvases; this is an Act 1 cut, not a
  // replacement, and the sources must still be their original size.
  for (const name of ['coyote', 'javelina', 'rabbit']) {
    const p = new URL(`public/assets/ecology/animals/${name}.png`, root);
    assert.ok(existsSync(p), `${name}.png disappeared from the ecology pack`);
  }
});
