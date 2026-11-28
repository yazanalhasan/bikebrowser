// A child on a phone must be able to leave a lab rig with a finger.
//
// Review MUST 1, and I caused it: plan 0.5 part 2 hid the d-pad and the
// action button inside a rig, which left a WALK-IN exit zone as the only
// way out of the Materials Lab and the Thermal Rig. There is no walking
// without a d-pad. A child who went into the lab stayed in the lab.
//
// This runs against the production build with the dev flags off, drives
// the page with touch only (no keyboard, no mouse), and checks the thing
// that matters: after the taps, which scene is running. An opening-state
// test cannot see this bug at all — the exit LOOKS fine, it just does
// nothing.
import { expect, test } from 'playwright/test';

import { bootToScene, PHONES, shot, tapAt } from './helpers/touchOnly.js';

const RIGS = [
  { key: 'MaterialLabScene', label: 'Materials Lab' },
  { key: 'ThermalRigScene', label: 'Thermal Rig' },
];

// Every phone the reviewer used, in both orientations, plus the desktop
// size — the lock is worst on a phone but the control must exist at all.
const VIEWPORTS = [
  ...PHONES,
  { name: '844x390-landscape', width: 844, height: 390 },
  { name: '1280x720', width: 1280, height: 720 },
];

for (const rig of RIGS) {
  for (const vp of VIEWPORTS) {
    test(`${rig.label} can be left by touch at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await bootToScene(page, rig.key);

      // The control is on the screen and big enough for a finger.
      const leave = page.getByTestId('leave-scene');
      await expect(leave).toBeVisible();
      const box = await leave.boundingBox();
      expect(box, 'leave control has a box').not.toBeNull();
      expect(box.height, 'leave control tap height').toBeGreaterThanOrEqual(44);
      expect(box.width, 'leave control tap width').toBeGreaterThanOrEqual(44);
      // Fully inside the viewport, not half off the edge.
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
      expect(box.y + box.height).toBeLessThanOrEqual(vp.height);

      await shot(page, rig.key, vp.name, 1, 'arrived-leave-control-visible');

      // Touch it — a real touch, not a click.
      await tapAt(page, box.x + box.width / 2, box.y + box.height / 2);

      // And we are out. This is the assertion the bug would fail.
      await expect
        .poll(() => page.evaluate(() => {
          const g = window.__phaserGame;
          return g.scene.getScenes(true).map((s) => s.scene.key).join(',');
        }), { timeout: 8000 })
        .toContain('ZuzuGarageScene');

      await shot(page, rig.key, vp.name, 2, 'left-by-touch-back-in-garage');
    });
  }
}

// The world exit answers a tap too, in every scene that has one — a
// child reaches for the thing that says "Back to Garage" before they
// reach for a d-pad. Checked in a walkable scene, where the exit is on
// screen and the d-pad exists, so this is about the tap and nothing else.
test('a world exit sign can be tapped instead of walked into', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootToScene(page, 'StreetBlockScene');

  const exit = await page.evaluate(() => {
    const g = window.__phaserGame;
    const scene = g.scene.getScenes(true).find((s) => s.scene.key === 'StreetBlockScene');
    const entry = scene._exits?.[0];
    if (!entry) return null;
    const cam = scene.cameras.main;
    const z = cam.zoom;
    const sx = (entry.zone.x - cam.scrollX) * z + cam.x;
    const sy = (entry.zone.y - cam.scrollY) * z + cam.y;
    return {
      target: entry.targetScene,
      interactive: Boolean(entry.zone.input),
      x: sx,
      y: sy,
      onScreen: sx > 0 && sy > 0 && sx < cam.width && sy < cam.height,
    };
  });

  expect(exit, 'StreetBlockScene has an exit').not.toBeNull();
  expect(exit.interactive, 'exit zone takes input').toBe(true);
  test.skip(!exit.onScreen, 'exit is off camera at this size; covered by the rig tests');

  await tapAt(page, exit.x, exit.y);
  await expect
    .poll(() => page.evaluate(() => window.__phaserGame.scene.getScenes(true)
      .map((s) => s.scene.key).join(',')), { timeout: 8000 })
    .toContain(exit.target);
});
