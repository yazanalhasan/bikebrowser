/**
 * Local scene camera framing.
 *
 * Two owner decisions, in order:
 *
 * - 2026-11-26: the room must fill the screen width — no side bands on a
 *   landscape window. The old contain fit left 320px of band on a 1280x720
 *   garage.
 * - 2026-11-27 (**supersedes the phone half of the above**): on a phone held
 *   upright the camera zooms in and follows Zuzu. Only larger screens —
 *   desktop, tablet, landscape — keep showing the full room width. Fitting a
 *   1000px room into 390px meant zoom 0.39, Zuzu about 15px tall and two
 *   thirds of the screen empty.
 *
 * Both decisions are recorded in the review handoff, not given to me
 * directly. These tests pin each branch.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  localCameraFit,
  localCameraCenter,
  isPortrait,
  MAX_FIT_ZOOM,
  MIN_PORTRAIT_ZOOM,
} from '../src/renderer/game/utils/localCameraFit.js';

const GARAGE = { worldWidth: 800, worldHeight: 600 };
const STREET = { worldWidth: 1000, worldHeight: 700 };
const DESERT = { worldWidth: 1000, worldHeight: 700 };

/** Pixels of empty band left and right of the room. 0 means the width is filled. */
function sideBandPx(camWidth, fit, worldWidth) {
  return Math.max(0, camWidth - worldWidth * fit.zoom);
}

// ── Width is always filled ──────────────────────────────────────────────────

// Landscape only — a portrait phone deliberately does not fill the width.
for (const [label, size] of [
  ['wide 1280x720', { camWidth: 1280, camHeight: 720 }],
  ['short 1024x484', { camWidth: 1024, camHeight: 484 }],
  ['laptop 1440x900', { camWidth: 1440, camHeight: 900 }],
  ['big 1920x911', { camWidth: 1920, camHeight: 911 }],
]) {
  for (const [room, world] of [['garage', GARAGE], ['Home Street', STREET], ['Desert Edge', DESERT]]) {
    test(`${room} fills the width at ${label} — no side bands`, () => {
      const fit = localCameraFit({ ...size, ...world });
      assert.equal(fit.fillsWidth, true, 'the width zoom must not be capped here');
      assert.equal(
        sideBandPx(size.camWidth, fit, world.worldWidth), 0,
        'no empty band beside the room',
      );
    });
  }
}

// ── Phones see the whole room across ────────────────────────────────────────

test('a portrait phone zooms in and follows instead of shrinking the room', () => {
  for (const [name, world] of [['garage', GARAGE], ['Home Street', STREET]]) {
    const fit = localCameraFit({ camWidth: 390, camHeight: 844, ...world });
    assert.equal(fit.portrait, true, `${name}: 390x844 is a portrait phone`);
    assert.ok(
      fit.zoom >= MIN_PORTRAIT_ZOOM,
      `${name}: zoom ${fit.zoom} must not shrink below ${MIN_PORTRAIT_ZOOM} — `
      + 'that is what left Zuzu 15px tall',
    );
    assert.equal(fit.followX, true, `${name}: the camera follows across`);
    assert.equal(fit.fillsWidth, false, `${name}: portrait does not fill the width`);
  }
});

test('a portrait phone keeps Zuzu in view and never shows past a wall', () => {
  const fit = localCameraFit({ camWidth: 390, camHeight: 844, ...STREET });
  for (let x = 0; x <= STREET.worldWidth; x += 50) {
    const { centerX } = localCameraCenter({
      fit, worldWidth: STREET.worldWidth, worldHeight: STREET.worldHeight,
      focusX: x, focusY: 350,
    });
    const left = centerX - fit.viewWidth / 2;
    assert.ok(left >= -1e-9, `view must not run past the west wall at x=${x}`);
    assert.ok(
      left + fit.viewWidth <= STREET.worldWidth + 1e-9,
      `view must not run past the east wall at x=${x}`,
    );
  }
});

test('a tablet in portrait is treated as a phone, a laptop is not', () => {
  assert.equal(isPortrait(768, 1024), true, 'tablet upright');
  assert.equal(isPortrait(390, 844), true, 'phone upright');
  assert.equal(isPortrait(1024, 484), false, 'short laptop');
  assert.equal(isPortrait(1280, 720), false, 'desktop');
  assert.equal(isPortrait(1024, 1024), false, 'square is not portrait');
});

test('a phone in landscape goes back to the full-width fit', () => {
  // Turning the phone sideways is a landscape screen and gets landscape rules.
  const fit = localCameraFit({ camWidth: 844, camHeight: 390, ...STREET });
  assert.equal(fit.portrait, false);
  assert.equal(fit.fillsWidth, true);
});

// ── Wide/short windows follow vertically, clamped ───────────────────────────

test('a wide window follows Zuzu vertically instead of banding', () => {
  const fit = localCameraFit({ camWidth: 1280, camHeight: 720, ...GARAGE });
  assert.ok(Math.abs(fit.zoom - 1280 / 800) < 1e-9, 'zoom fills the width');
  assert.equal(fit.followY, true, 'the room is taller than the view, so follow');
  assert.ok(fit.viewHeight < GARAGE.worldHeight);
});

test('a short window follows vertically and never shows past the walls', () => {
  const fit = localCameraFit({ camWidth: 1024, camHeight: 484, ...GARAGE });
  assert.equal(fit.followY, true);

  const half = fit.viewHeight / 2;
  const at = (y) => localCameraCenter({
    fit, worldWidth: GARAGE.worldWidth, worldHeight: GARAGE.worldHeight,
    focusX: 400, focusY: y,
  }).centerY;
  assert.equal(at(0), half, 'clamped at the top wall');
  assert.ok(Math.abs(at(GARAGE.worldHeight) - (GARAGE.worldHeight - half)) < 1e-9,
    'clamped at the bottom wall');
  const mid = at(300);
  assert.ok(mid > half && mid < GARAGE.worldHeight - half, 'follows between the walls');
});

test('vertical follow keeps the player inside the view at every height', () => {
  const fit = localCameraFit({ camWidth: 1280, camHeight: 720, ...STREET });
  for (let y = 0; y <= STREET.worldHeight; y += 25) {
    const { centerY } = localCameraCenter({
      fit, worldWidth: STREET.worldWidth, worldHeight: STREET.worldHeight,
      focusX: 500, focusY: y,
    });
    const top = centerY - fit.viewHeight / 2;
    assert.ok(top >= -1e-9, `view must not show above the room at y=${y}`);
    assert.ok(
      top + fit.viewHeight <= STREET.worldHeight + 1e-9,
      `view must not run past the bottom wall at y=${y}`,
    );
  }
});

// ── The zoom cap ────────────────────────────────────────────────────────────

test('a very large display is capped and then centred, not stretched forever', () => {
  const fit = localCameraFit({ camWidth: 4000, camHeight: 2000, ...GARAGE });
  assert.equal(fit.zoom, MAX_FIT_ZOOM);
  assert.equal(fit.fillsWidth, false, 'this is the one case bands are accepted');
  const { centerX } = localCameraCenter({
    fit, worldWidth: GARAGE.worldWidth, worldHeight: GARAGE.worldHeight,
    focusX: 400, focusY: 300,
  });
  // viewWidth exceeds the room, so it centres on the room.
  assert.equal(centerX, GARAGE.worldWidth / 2);
});

test('degenerate sizes do not divide by zero', () => {
  const fit = localCameraFit({ camWidth: 0, camHeight: 0, worldWidth: 0, worldHeight: 0 });
  assert.ok(Number.isFinite(fit.zoom) && fit.zoom > 0);
  const c = localCameraCenter({
    fit, worldWidth: 0, worldHeight: 0, focusX: 0, focusY: 0,
  });
  assert.ok(Number.isFinite(c.centerX) && Number.isFinite(c.centerY));
});

test('the room lands on screen — the scroll-convention trap stays fixed', () => {
  // Phaser zooms about the viewport midpoint, so `scrollX` is NOT the world
  // x of the left edge. Driving the camera with it put Home Street 883px off
  // the left of a 1920px canvas, leaving only ~1038px of room visible. This
  // reproduces the arithmetic Phaser does, from the centre we hand it, and
  // checks the room actually covers the screen.
  const camWidth = 1920;
  const camHeight = 911;
  const fit = localCameraFit({ camWidth, camHeight, ...STREET });
  const { centerX } = localCameraCenter({
    fit, worldWidth: STREET.worldWidth, worldHeight: STREET.worldHeight,
    focusX: 500, focusY: 350,
  });

  // Phaser: worldView is centred on the camera midpoint.
  const worldLeft = centerX - fit.viewWidth / 2;
  const roomLeftOnScreen = (0 - worldLeft) * fit.zoom;
  const roomRightOnScreen = (STREET.worldWidth - worldLeft) * fit.zoom;

  assert.ok(roomLeftOnScreen <= 1e-6, `room starts at screen x=${roomLeftOnScreen}, must be <= 0`);
  assert.ok(
    roomRightOnScreen >= camWidth - 1e-6,
    `room ends at screen x=${roomRightOnScreen}, must reach ${camWidth}`,
  );
});
