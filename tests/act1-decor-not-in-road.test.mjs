/**
 * Nothing stands in the road. Plan item 0.13, and the review's follow-ups.
 *
 * Owner: "move the trees from the middle of the road." Two cottonwoods
 * stood with their feet in the asphalt, two more laid their canopies
 * across the south kerb, both bikes-on-stands stood up through a travel
 * lane, and — found in review — so did the Bike GPS, which is the only
 * way to the Copper Mine and the Dry Wash.
 *
 * The rule is about footprints and bodies, not centres: a sprite is
 * drawn from its feet upwards, so a tree whose feet are on the lawn can
 * still have its trunk in the road. Street furniture (hydrant, mailbox,
 * street sign) may stand on the kerb but never in the asphalt.
 *
 * Three things the first version of this test did not do, all of them
 * review findings and all of them fixed here:
 *
 *  1. It copied the sprite geometry (feet at +24, height 110) into the
 *     test, so changing `_drawTree` could not fail it. Every number
 *     below is now read from the draw code or from the atlas the sprite
 *     comes from.
 *  2. It only looked at Home Street. It now walks every layout, and any
 *     scene that grows a road rect is covered the day it does.
 *  3. The Bike GPS was outside its table — not a tree, plant or bike —
 *     while standing in the same asphalt. Anything drawn from a ground
 *     anchor counts now.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const street = JSON.parse(read('public/layouts/street-block.layout.json')).objects;
const sceneSrc = read('src/renderer/game/scenes/StreetBlockScene.js');

// ── the sprite geometry, read rather than remembered ──────────────────────

/** `this.addProp(ART.shade_tree, x, y + 24 * scale, { displayHeight: … 110 …` */
function treeGeometry() {
  const block = sceneSrc.slice(sceneSrc.indexOf('_drawTree(x, y'));
  const feet = block.match(/addProp\(ART\.shade_tree, x, y \+ (\d+) \* scale/);
  const height = block.match(/displayHeight: Math\.round\((\d+) \* scale\)/);
  assert.ok(feet && height, '_drawTree no longer looks the way this test reads it');
  return { feetDy: Number(feet[1]), height: Number(height[1]) };
}

/** An atlas-framed prop: `this.add.image(x, y + N, ATLAS, frame).setOrigin(0.5, 1)` */
function atlasPropGeometry(fnName, frameName) {
  const block = sceneSrc.slice(sceneSrc.indexOf(fnName));
  const feet = block.match(/add\.image\(x, y \+ (\d+), NEIGHBORHOOD_ATLAS/);
  assert.ok(feet, `${fnName} no longer draws from a ground anchor`);

  const atlas = JSON.parse(read('public/assets/game/atlases/neighborhood.json'));
  const frames = Array.isArray(atlas.frames)
    ? Object.fromEntries(atlas.frames.map((f) => [f.filename, f]))
    : atlas.frames;
  const frame = frames[frameName];
  assert.ok(frame, `the atlas has no ${frameName}`);
  return { feetDy: Number(feet[1]), height: frame.frame.h };
}

const TREE = treeGeometry();
const BIKE = atlasPropGeometry('_drawBike(x, y', 'prop_mr_chen_bike');
const GPS = atlasPropGeometry('_drawGpsPost(x, y', 'prop_bike_gps');

test('the geometry came from the code, not from memory', () => {
  // If these ever read as nonsense the assertions below mean nothing.
  for (const [name, g] of [['tree', TREE], ['bike', BIKE], ['gps', GPS]]) {
    assert.ok(g.height > 20 && g.height < 400, `${name} height ${g.height} is not plausible`);
    assert.ok(g.feetDy >= 0 && g.feetDy < 200, `${name} feet offset ${g.feetDy} is not plausible`);
  }
  // And they are the numbers the street was laid out against.
  assert.deepEqual(TREE, { feetDy: 24, height: 110 });
  assert.deepEqual(BIKE, { feetDy: 30, height: 120 });
  assert.deepEqual(GPS, { feetDy: 60, height: 120 });
});

// ── zones ─────────────────────────────────────────────────────────────────

function band(o) {
  return { top: o.y - o.h / 2, bottom: o.y + o.h / 2 };
}

const ROAD = band(street.road);
const KERB_TOP = band(street.sidewalk_top);
const KERB_BOTTOM = band(street.sidewalk_bottom);

const span = (y, g) => ({ feet: y + g.feetDy, top: y + g.feetDy - g.height });
const overlaps = (s, zone) => s.top < zone.bottom && s.feet > zone.top;

test('the zones are where the test thinks they are', () => {
  assert.deepEqual(ROAD, { top: 290, bottom: 410 });
  assert.deepEqual(KERB_TOP, { top: 270, bottom: 290 });
  assert.deepEqual(KERB_BOTTOM, { top: 410, bottom: 430 });
});

test('no tree stands in the road', () => {
  const offenders = street.trees
    .map((t, i) => ({ i, t, s: span(t.y, TREE) }))
    .filter(({ s }) => overlaps(s, ROAD))
    .map(({ i, t, s }) => `trees[${i}] (${t.x},${t.y}) covers ${s.top}-${s.feet}`);
  assert.deepEqual(offenders, []);
});

test('no tree sits on either kerb', () => {
  const offenders = [];
  street.trees.forEach((t, i) => {
    const s = span(t.y, TREE);
    if (overlaps(s, KERB_TOP) || overlaps(s, KERB_BOTTOM)) {
      offenders.push(`trees[${i}] (${t.x},${t.y}) covers ${s.top}-${s.feet}`);
    }
  });
  assert.deepEqual(offenders, []);
});

test('neither bike-on-stand stands in the road or on a kerb', () => {
  for (const key of ['ramirez_bike_icon', 'chen_bike_icon']) {
    const s = span(street[key].y, BIKE);
    assert.equal(overlaps(s, ROAD), false,
      `${key} covers ${s.top}-${s.feet}, inside the road ${ROAD.top}-${ROAD.bottom}`);
    assert.equal(overlaps(s, KERB_TOP) || overlaps(s, KERB_BOTTOM), false,
      `${key} covers ${s.top}-${s.feet}, on a kerb`);
  }
});

test('the Bike GPS is out of the asphalt', () => {
  // Review finding: the post spanned y 250-370 with the road at
  // 290-410. It is the only way to the Copper Mine and the Dry Wash, so
  // a child has to be able to reach it without standing in traffic.
  //
  // `gps_post` is the sprite; `interact_gps` is the hotspot. Both.
  for (const key of ['gps_post', 'interact_gps']) {
    const s = span(street[key].y, GPS);
    assert.equal(overlaps(s, ROAD), false,
      `${key} covers ${s.top}-${s.feet}, inside the road`);
    assert.equal(overlaps(s, KERB_TOP) || overlaps(s, KERB_BOTTOM), false,
      `${key} covers ${s.top}-${s.feet}, on a kerb`);
  }
});

test('the GPS hotspot and the GPS post are the same object to a child', () => {
  // Two layout keys, one thing. Moving one and not the other puts the
  // caption and the "Interact" prompt on empty grass — which is exactly
  // what happened the first time this was moved.
  const post = street.gps_post;
  const hot = street.interact_gps;
  assert.ok(Math.abs(post.x - hot.x) <= 24 && Math.abs(post.y - hot.y) <= 40,
    `the post (${post.x},${post.y}) and the hotspot (${hot.x},${hot.y}) have drifted apart`);
});

test('the old positions would fail this test', () => {
  // Proof it bites: the numbers from before each move.
  assert.equal(overlaps(span(340, TREE), ROAD), true, 'trees[0]/[4] at y=340');
  assert.equal(overlaps(span(500, TREE), KERB_BOTTOM), true, 'trees[5]/[7] at y=500');
  assert.equal(overlaps(span(278, BIKE), ROAD), true, 'the Flat Tire bike at y=278');
  assert.equal(overlaps(span(420, BIKE), ROAD), true, "Mr. Chen's bike at y=420");
  assert.equal(overlaps(span(300, GPS), ROAD), true, 'the Bike GPS at y=300');
});

test('kerb furniture stays on the kerb and out of the asphalt', () => {
  for (const key of ['fire_hydrant', 'mailbox_left', 'mailbox_right', 'street_sign']) {
    const o = street[key];
    if (!o) continue;
    assert.ok(o.y < ROAD.top || o.y > ROAD.bottom, `${key} at y=${o.y} is in the asphalt`);
  }
});

test('nothing moved on top of an exit, a spawn or an NPC', () => {
  const blockers = [
    ...street.trees.map((t, i) => ({ name: `trees[${i}]`, x: t.x, y: t.y, w: 112, s: span(t.y, TREE) })),
    ...['ramirez_bike_icon', 'chen_bike_icon'].map((k) => ({
      name: k, x: street[k].x, y: street[k].y, w: 160, s: span(street[k].y, BIKE),
    })),
    { name: 'interact_gps', x: street.interact_gps.x, y: street.interact_gps.y, w: 160, s: span(street.interact_gps.y, GPS) },
  ];
  const keepClear = [
    ...['exit_zone_west', 'exit_zone_south', 'exit_zone_north']
      .filter((k) => street[k]).map((k) => ({ name: k, ...street[k] })),
    ...['npc_mr_chen', 'npc_mrs_ramirez', 'npc_mariam']
      .filter((k) => street[k]).map((k) => ({ name: k, x: street[k].x, y: street[k].y, w: 40, h: 40 })),
  ];

  const hits = [];
  for (const b of blockers) {
    for (const z of keepClear) {
      const zTop = z.y - (z.h || 40) / 2;
      const zBottom = z.y + (z.h || 40) / 2;
      const zLeft = z.x - (z.w || 40) / 2;
      const zRight = z.x + (z.w || 40) / 2;
      if (b.x - b.w / 2 < zRight && zLeft < b.x + b.w / 2
          && b.s.top < zBottom && zTop < b.s.feet) {
        hits.push(`${b.name} covers ${z.name}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});

test('nothing hangs off the edge of the world', () => {
  const WORLD_W = 1000;
  for (const [i, t] of street.trees.entries()) {
    assert.ok(t.x - 56 >= -8 && t.x + 56 <= WORLD_W + 8,
      `trees[${i}] at x=${t.x} runs off the street`);
  }
});

// ── every other scene ─────────────────────────────────────────────────────

test('no layout anywhere puts decor in a road it defines', () => {
  // Home Street is the only scene with a road today. The review asked
  // for the rest to be covered anyway, so that the day another scene
  // grows a road rect, a tree in it fails on that same commit.
  const dir = new URL('public/layouts/', root);
  const offenders = [];
  let scanned = 0;

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.layout.json')) continue;
    const layout = JSON.parse(read(`public/layouts/${file}`));
    for (const [variant, objects] of [
      ['landscape', layout.objects],
      ['portrait', layout.portrait?.objects],
    ]) {
      if (!objects) continue;
      const roads = Object.entries(objects)
        .filter(([k, v]) => /road|asphalt|lane/.test(k) && v && v.h != null)
        .map(([k, v]) => ({ name: k, ...band(v) }));
      if (!roads.length) continue;
      scanned += 1;

      const decor = [];
      if (Array.isArray(objects.trees)) {
        objects.trees.forEach((t, i) => decor.push([`trees[${i}]`, t.y, TREE]));
      }
      if (Array.isArray(objects.plants)) {
        objects.plants.forEach((p, i) => decor.push([`plants[${i}]`, p.y, TREE]));
      }
      for (const key of ['ramirez_bike_icon', 'chen_bike_icon']) {
        if (objects[key]) decor.push([key, objects[key].y, BIKE]);
      }
      for (const key of ['interact_gps', 'gps_post']) {
        if (objects[key]) decor.push([key, objects[key].y, GPS]);
      }

      for (const [name, y, geom] of decor) {
        for (const road of roads) {
          if (overlaps(span(y, geom), road)) {
            offenders.push(`${file} (${variant}): ${name} is in ${road.name}`);
          }
        }
      }
    }
  }

  assert.ok(scanned >= 1, 'no layout with a road was found — did the files move?');
  assert.deepEqual(offenders, []);
});
