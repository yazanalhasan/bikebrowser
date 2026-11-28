/**
 * The X that closes an overlay is big enough for a child's finger.
 *
 * Plan 0.5 / review item: on a 390x844 phone the close control measured
 * 42.9 CSS px. It is authored as a circle of `r: 22` in the portrait
 * block of both first-quest overlays — 44 design px — but the overlay
 * camera contains a 400x860 design space into the viewport, and that
 * 0.975 scale shrinks 44 to 42.9. Everything else a child taps clears
 * 44; this one missed by a pixel.
 *
 * The size that matters is the one on glass, so the test computes it the
 * way the game does: through `overlayCameraFit`, the same function the
 * scenes call. A number written in a layout file is not a measurement.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { overlayCameraFit } from '../src/renderer/game/utils/overlayCameraFit.js';

const root = new URL('../', import.meta.url);
const layout = (name) =>
  JSON.parse(readFileSync(new URL(`public/layouts/${name}.layout.json`, root), 'utf8'));

const OVERLAYS = ['flat-tire-explainer', 'cognitive-flat-tire'];

/** The smallest comfortable touch target, in CSS pixels. */
const MIN_TAP_PX = 44;

/** The phone the owner reviews on. */
const PHONE = { width: 390, height: 844 };

/** On-glass diameter of a circular control authored in a design space. */
function fittedDiameter(circle, design, viewport) {
  const { zoom } = overlayCameraFit({
    camWidth: viewport.width,
    camHeight: viewport.height,
    designWidth: design.designWidth,
    designHeight: design.designHeight,
  });
  return circle.r * 2 * zoom;
}

test('the fit maths is the same maths the scene uses', () => {
  // Guard the guard. If this zoom ever stops being 0.975 the numbers
  // below are measuring something else and should be re-derived.
  const { zoom } = overlayCameraFit({
    camWidth: PHONE.width, camHeight: PHONE.height,
    designWidth: 400, designHeight: 860,
  });
  assert.equal(Math.round(zoom * 1000) / 1000, 0.975);
});

test('both overlays still have a portrait block with a close control', () => {
  for (const name of OVERLAYS) {
    const p = layout(name).portrait;
    assert.ok(p, `${name} lost its portrait block`);
    assert.ok(p.objects?.close?.r, `${name} portrait has no close.r`);
    assert.equal(p.designWidth, 400);
    assert.equal(p.designHeight, 860);
  }
});

test('the close X is at least 44 CSS px on the phone', () => {
  const measured = [];
  for (const name of OVERLAYS) {
    const p = layout(name).portrait;
    const px = fittedDiameter(p.objects.close, p, PHONE);
    measured.push(`${name}: ${px.toFixed(1)}px`);
    assert.ok(px >= MIN_TAP_PX,
      `${name} close is ${px.toFixed(1)} CSS px at ${PHONE.width}x${PHONE.height}, under ${MIN_TAP_PX}`);
  }
  // Printed so a future reader sees the margin, not just a pass.
  assert.equal(measured.length, 2);
});

test('r: 22 is recorded as the value that was too small', () => {
  // The old number, so the test says what it is defending against: at
  // 0.975 a 44-design-px circle lands at 42.9 on glass.
  const px = 22 * 2 * 0.975;
  assert.ok(px < MIN_TAP_PX);
  assert.equal(Math.round(px * 10) / 10, 42.9);
});

test('the X is not so big it crowds the panel edge', () => {
  // A tap target is a floor, not a licence. The control must stay inside
  // the design space with a margin, or it collides with the card corner.
  for (const name of OVERLAYS) {
    const p = layout(name).portrait;
    const { x, y, r } = p.objects.close;
    assert.ok(x + r <= p.designWidth - 8, `${name} close runs off the right edge`);
    assert.ok(y - r >= 8, `${name} close runs off the top edge`);
    assert.ok(r <= 28, `${name} close is oversized at r=${r}`);
  }
});
