/**
 * Local scene camera framing.
 *
 * Owner request + review MUST (2026-11-26): the room must fill the screen
 * width — no side bands on a landscape window, and a phone must show the
 * whole room across rather than a zoomed-in slice of it.
 *
 * The old contain-fit left 320px of band on a 1280x720 garage and cropped
 * the room to 390px of its 800px width on a phone. These tests pin the new
 * behaviour at the three aspect ratios the review called out: wide, short
 * and phone.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  localCameraFit,
  localCameraCenter,
  MAX_FIT_ZOOM,
} from '../src/renderer/game/utils/localCameraFit.js';

const GARAGE = { worldWidth: 800, worldHeight: 600 };
const STREET = { worldWidth: 1000, worldHeight: 700 };
const DESERT = { worldWidth: 1000, worldHeight: 700 };

/** Pixels of empty band left and right of the room. 0 means the width is filled. */
function sideBandPx(camWidth, fit, worldWidth) {
  return Math.max(0, camWidth - worldWidth * fit.zoom);
}

// ── Width is always filled ──────────────────────────────────────────────────

for (const [label, size] of [
  ['wide 1280x720', { camWidth: 1280, camHeight: 720 }],
  ['short 1024x484', { camWidth: 1024, camHeight: 484 }],
  ['phone 390x844', { camWidth: 390, camHeight: 844 }],
  ['laptop 1440x900', { camWidth: 1440, camHeight: 900 }],
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

test('a phone shows the whole garage width, not a slice of it', () => {
  const fit = localCameraFit({ camWidth: 390, camHeight: 844, ...GARAGE });
  // The visible world width must cover the room. Before this change the
  // camera sat at zoom 1 and showed 390 of the room's 800px.
  assert.ok(
    fit.viewWidth >= GARAGE.worldWidth,
    `view ${fit.viewWidth} must cover the ${GARAGE.worldWidth}px room`,
  );
  // A phone is tall, so the whole room fits vertically too — nothing to follow.
  assert.equal(fit.followY, false);

  const { centerX, centerY } = localCameraCenter({
    fit, worldWidth: GARAGE.worldWidth, worldHeight: GARAGE.worldHeight,
    focusX: 400, focusY: 350,
  });
  // Centred on the room, which puts equal spare space on each side.
  assert.equal(centerX, GARAGE.worldWidth / 2, 'room centred horizontally');
  assert.equal(centerY, GARAGE.worldHeight / 2, 'room centred vertically');
});

test('a phone shows the whole Home Street width too', () => {
  const fit = localCameraFit({ camWidth: 390, camHeight: 844, ...STREET });
  assert.ok(fit.viewWidth >= STREET.worldWidth);
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
