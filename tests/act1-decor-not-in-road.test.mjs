/**
 * Nothing grows in the road. Plan item 0.13.
 *
 * Owner: "move the trees from the middle of the road." Two cottonwoods
 * stood with their feet in the asphalt, two more laid their canopies
 * across the south kerb, and both bikes-on-stands stood up through a
 * travel lane — the Flat Tire bike's feet were in the lane outright.
 *
 * The rule is about footprints and bodies, not centres: a sprite is
 * drawn from its feet upwards, so a tree whose feet are on the lawn can
 * still have its trunk in the road. Street furniture (hydrant, mailbox,
 * street sign) may stand on the kerb but never in the asphalt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const street = JSON.parse(read('public/layouts/street-block.layout.json')).objects;

/** A rect given as a centre plus a size, as the layouts store them. */
function band(o) {
  return { top: o.y - o.h / 2, bottom: o.y + o.h / 2 };
}

const ROAD = band(street.road);
const KERB_TOP = band(street.sidewalk_top);
const KERB_BOTTOM = band(street.sidewalk_bottom);

/**
 * The vertical span a sprite covers, from the layout point.
 *
 * `_drawTree` puts the 110px-tall cottonwood's feet at y+24; `_drawBike`
 * puts the 120px-tall bike's feet at y+30 with origin (0.5, 1).
 */
const SPANS = {
  tree: (y) => ({ feet: y + 24, top: y + 24 - 110 }),
  bike: (y) => ({ feet: y + 30, top: y + 30 - 120 }),
};

function overlaps(span, zone) {
  return span.top < zone.bottom && span.feet > zone.top;
}

test('the zones are where the test thinks they are', () => {
  // If the street is ever re-laid, these numbers move and every
  // assertion below would otherwise pass against the wrong bands.
  assert.deepEqual(ROAD, { top: 290, bottom: 410 });
  assert.deepEqual(KERB_TOP, { top: 270, bottom: 290 });
  assert.deepEqual(KERB_BOTTOM, { top: 410, bottom: 430 });
});

test('no tree stands in the road', () => {
  const offenders = street.trees
    .map((t, i) => ({ i, t, span: SPANS.tree(t.y) }))
    .filter(({ span }) => overlaps(span, ROAD))
    .map(({ i, t, span }) => `trees[${i}] (${t.x},${t.y}) covers ${span.top}-${span.feet}`);
  assert.deepEqual(offenders, []);
});

test('no tree sits on either kerb', () => {
  const offenders = [];
  street.trees.forEach((t, i) => {
    const span = SPANS.tree(t.y);
    if (overlaps(span, KERB_TOP) || overlaps(span, KERB_BOTTOM)) {
      offenders.push(`trees[${i}] (${t.x},${t.y}) covers ${span.top}-${span.feet}`);
    }
  });
  assert.deepEqual(offenders, []);
});

test('neither bike-on-stand stands in the road or on a kerb', () => {
  for (const key of ['ramirez_bike_icon', 'chen_bike_icon']) {
    const o = street[key];
    const span = SPANS.bike(o.y);
    assert.equal(overlaps(span, ROAD), false,
      `${key} covers ${span.top}-${span.feet}, inside the road ${ROAD.top}-${ROAD.bottom}`);
    assert.equal(overlaps(span, KERB_TOP) || overlaps(span, KERB_BOTTOM), false,
      `${key} covers ${span.top}-${span.feet}, on a kerb`);
  }
});

test('the old positions would fail this test', () => {
  // Proof it bites: the numbers from before the move.
  assert.equal(overlaps(SPANS.tree(340), ROAD), true, 'trees[0]/[4] at y=340');
  assert.equal(overlaps(SPANS.tree(500), KERB_BOTTOM), true, 'trees[5]/[7] at y=500');
  assert.equal(overlaps(SPANS.bike(278), ROAD), true, 'the Flat Tire bike at y=278');
  assert.equal(overlaps(SPANS.bike(420), ROAD), true, "Mr. Chen's bike at y=420");
});

test('kerb furniture stays on the kerb and out of the asphalt', () => {
  // Allow-listed: these belong on the pavement.
  for (const key of ['fire_hydrant', 'mailbox_left', 'mailbox_right', 'street_sign']) {
    const o = street[key];
    if (!o) continue;
    assert.ok(o.y < ROAD.top || o.y > ROAD.bottom,
      `${key} at y=${o.y} is in the asphalt`);
  }
});

test('nothing moved on top of an exit, a spawn or an NPC', () => {
  const blockers = [
    ...street.trees.map((t, i) => ({ name: `trees[${i}]`, x: t.x, y: t.y, w: 112, span: SPANS.tree(t.y) })),
    ...['ramirez_bike_icon', 'chen_bike_icon'].map((k) => ({
      name: k, x: street[k].x, y: street[k].y, w: 160, span: SPANS.bike(street[k].y),
    })),
  ];
  const keepClear = [
    ...['exit_zone_west', 'exit_zone_south', 'exit_zone_north']
      .filter((k) => street[k])
      .map((k) => ({ name: k, ...street[k] })),
    ...['npc_mr_chen', 'npc_mrs_ramirez', 'npc_mariam']
      .filter((k) => street[k])
      .map((k) => ({ name: k, x: street[k].x, y: street[k].y, w: 40, h: 40 })),
  ];

  const hits = [];
  for (const b of blockers) {
    for (const z of keepClear) {
      const zTop = z.y - (z.h || 40) / 2;
      const zBottom = z.y + (z.h || 40) / 2;
      const zLeft = z.x - (z.w || 40) / 2;
      const zRight = z.x + (z.w || 40) / 2;
      const bLeft = b.x - b.w / 2;
      const bRight = b.x + b.w / 2;
      if (bLeft < zRight && zLeft < bRight && b.span.top < zBottom && zTop < b.span.feet) {
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
