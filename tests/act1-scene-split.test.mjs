/**
 * Home Street / Desert Edge split (owner request, 2026-11-26).
 *
 * The neighborhood used to be one screen carrying the houses, the
 * neighbours, the bikes, the road, eleven plants and three animals. These
 * tests hold the split in place: the desert content lives in Desert Edge,
 * the street keeps the people, the two scenes connect both ways, and
 * nothing a quest needs was dropped on the floor.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getSpawn,
  getLocalScenes,
  isSceneUnlocked,
} from '../src/renderer/game/systems/sceneRegistry.js';
import { SCENE_OBSTACLES } from '../src/renderer/game/data/obstacles.js';
import { SCENE_ITEM_GRANTS } from '../src/renderer/game/data/sceneItemGrants.js';
import { FORAGE_PLANTS, getForageItems } from '../src/renderer/game/data/foragePlants.js';
import { COMPANIONS, getCompanionsForScene } from '../src/renderer/game/data/companions.js';
import QUESTS from '../src/renderer/game/data/quests.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function layout(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'layouts', name), 'utf8'));
}

const street = layout('street-block.layout.json');
const desert = layout('desert-edge.layout.json');

test('the desert moved off Home Street', () => {
  assert.deepEqual(street.objects.plants, [], 'no plants on the street');
  assert.deepEqual(street.objects.animals, [], 'no animals on the street');
  // Kept as arrays, not deleted: the scene still reads them, so a plant can
  // be put back by data alone.
  assert.ok(Array.isArray(street.objects.plants));
  assert.ok(Array.isArray(street.objects.animals));
});

test('Desert Edge carries every plant and animal that left the street', () => {
  assert.equal(desert.scene, 'DesertEdgeScene');
  const species = desert.objects.plants.map((p) => p.species);
  // The eleven the street used to hold, agave included.
  for (const expected of [
    'mesquite', 'creosote', 'prickly_pear', 'barrel_cactus', 'jojoba',
    'agave', 'yucca', 'desert_lavender', 'ephedra',
  ]) {
    assert.ok(species.includes(expected), `${expected} must be in Desert Edge`);
  }
  assert.equal(desert.objects.plants.length, 11);

  const fauna = desert.objects.animals.map((a) => a.speciesId);
  assert.deepEqual([...fauna].sort(), ['coyote', 'javelina', 'rabbit']);
});

test('every Desert Edge plant has canonical forage data', () => {
  // Positive-coverage sentinel: a plant placed in a layout with no
  // `FORAGE_PLANTS` row would silently grant nothing and describe itself as
  // "A <label>." — an absence that never errors on its own.
  assert.ok(desert.objects.plants.length > 0, 'the layout must not be empty');
  for (const p of desert.objects.plants) {
    assert.ok(FORAGE_PLANTS[p.species], `${p.species} needs a data/foragePlants.js row`);
    assert.ok(getForageItems(p.species).length > 0, `${p.species} must grant something`);
    assert.ok(p.label, `${p.species} needs a label`);
    assert.ok(p.radius > 0, `${p.species} needs an interaction radius`);
  }
});

test('Desert Edge is registered as a local scene, not hard-coded', () => {
  const keys = getLocalScenes().map((s) => s.key);
  assert.ok(keys.includes('DesertEdgeScene'), 'must come from the scene registry');
  assert.ok(keys.includes('StreetBlockScene'));
  // Open from the start — the desert is not gated behind a quest.
  assert.equal(isSceneUnlocked('DesertEdgeScene', {}), true);
});

test('Home Street and Desert Edge connect both ways', () => {
  const intoDesert = getSpawn('DesertEdgeScene', 'fromStreet');
  const backToStreet = getSpawn('StreetBlockScene', 'fromDesertEdge');
  // Named spawns must actually exist, not silently fall back to `default`.
  assert.notDeepEqual(intoDesert, getSpawn('DesertEdgeScene', 'nope'));
  assert.notDeepEqual(backToStreet, getSpawn('StreetBlockScene', 'nope'));

  // Each arrival point must be WELL clear of the gate it arrived through.
  // Land on the zone and the overlap fires again and the child is thrown
  // straight back where they came from — an inescapable loop for a young
  // player. 60px is comfortably more than the drift we saw between the
  // written spawn and where the player settles.
  const CLEARANCE = 60;
  const gateClearance = (spawn, zone) => Math.abs(spawn.y - zone.y) - zone.h / 2;

  const desertExit = desert.objects.exit_zone_north;
  assert.ok(
    gateClearance(intoDesert, desertExit) >= CLEARANCE,
    `Desert Edge arrival is only ${gateClearance(intoDesert, desertExit)}px from its north gate`,
  );
  const streetExit = street.objects.exit_zone_south;
  assert.ok(
    gateClearance(backToStreet, streetExit) >= CLEARANCE,
    `street arrival is only ${gateClearance(backToStreet, streetExit)}px from its south gate`,
  );
  // The default spawn must be safe too — it is what a cold load uses.
  assert.ok(
    gateClearance(getSpawn('DesertEdgeScene', 'default'), desertExit) >= CLEARANCE,
    'Desert Edge default spawn must also clear the gate',
  );

  // The exits line up horizontally so the gate reads as one opening.
  assert.ok(Math.abs(desertExit.x - streetExit.x) <= 4, 'the two gates line up');
});

test('the street fence has a real gap where the gate is', () => {
  const west = street.objects.wall_south_west;
  const east = street.objects.wall_south_east;
  const exit = street.objects.exit_zone_south;
  assert.ok(west && east, 'the south bound is two bodies');
  assert.equal(street.objects.wall_south, undefined, 'the single south wall is gone');
  const gapStart = west.x + west.w / 2;
  const gapEnd = east.x - east.w / 2;
  assert.ok(gapEnd > gapStart, 'there is a gap between the two bodies');
  assert.ok(gapStart <= exit.x - exit.w / 2, 'the exit zone starts inside the gap');
  assert.ok(gapEnd >= exit.x + exit.w / 2, 'the exit zone ends inside the gap');
});

test('the wilted-plant puzzle followed the plants', () => {
  assert.deepEqual(SCENE_OBSTACLES.StreetBlockScene.puzzles, []);
  const puzzles = SCENE_OBSTACLES.DesertEdgeScene.puzzles;
  assert.equal(puzzles.length, 1);
  assert.equal(puzzles[0].id, 'wilted_plant');
  // It is solved with a prickly pear, which must be forageable in the same
  // scene the puzzle now lives in.
  const item = puzzles[0].solveCondition.item;
  const granted = SCENE_ITEM_GRANTS.DesertEdgeScene.map((g) => g.itemId);
  assert.ok(granted.includes(item), `${item} must be forageable in Desert Edge`);
});

test('the street keeps its own street furniture', () => {
  // The pavement hazard and the workshop gate are not desert content.
  const ids = SCENE_OBSTACLES.StreetBlockScene.obstacles.map((o) => o.id);
  assert.deepEqual([...ids].sort(), ['heat_zone', 'locked_workshop']);
});

test('the workshop is named once, not twice', () => {
  // The locked gate used to be labelled "Workshop" as well as the building,
  // which printed the same word twice on one screen.
  const gate = SCENE_OBSTACLES.StreetBlockScene.obstacles
    .find((o) => o.id === 'locked_workshop');
  assert.notEqual(gate.label, 'Workshop', 'the gate must not repeat the building name');
  assert.match(gate.label, /Workshop Door/);
});

test('forage item grants moved with the plants', () => {
  assert.deepEqual(SCENE_ITEM_GRANTS.StreetBlockScene, [], 'street grants nothing now');
  const granted = new Set(SCENE_ITEM_GRANTS.DesertEdgeScene.map((g) => g.itemId));
  // Every item any Desert Edge plant can produce must be declared, or the
  // reachability audit under-reports what Act 1 can reach.
  for (const p of desert.objects.plants) {
    for (const item of getForageItems(p.species)) {
      assert.ok(granted.has(item), `${item} (${p.species}) must be declared for Desert Edge`);
    }
  }
});

test('every Act 1 forage step can still be satisfied after the split', () => {
  // The real regression risk of moving plants between scenes: a quest asks
  // for an item no scene grants any more.
  const everyGrant = new Set(
    Object.values(SCENE_ITEM_GRANTS).flat().map((g) => g.itemId),
  );
  const missing = [];
  for (const [questId, quest] of Object.entries(QUESTS)) {
    for (const step of quest.steps || []) {
      if (step.type !== 'forage' || !step.requiredItem) continue;
      if (!everyGrant.has(step.requiredItem)) missing.push(`${questId}:${step.requiredItem}`);
    }
  }
  assert.deepEqual(missing, [], 'no forage step may require an ungrantable item');
});

test('Lina follows Zuzu into the desert', () => {
  assert.ok(COMPANIONS.lina.scenes.includes('DesertEdgeScene'));
  // She only tags along once they have met on the street.
  assert.deepEqual(getCompanionsForScene('DesertEdgeScene', {}), []);
  const met = { companions: { lina: { met: true } } };
  assert.equal(getCompanionsForScene('DesertEdgeScene', met).length, 1);
});
