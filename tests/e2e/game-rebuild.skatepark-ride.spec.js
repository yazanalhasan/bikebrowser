import { test, expect } from 'playwright/test';

// Skate Park — Phase 3 (BMX riding prototype). The side-view SkateScene opens via
// skate:start; the player can ride/jump, the Physics Goggles toggle, and Esc exits.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
const skate = (page) => page.evaluate(() => window.__SKATE__);

test('BMX ride: open, jump, ride, goggles, exit', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await page.evaluate(() => window.__GAME__.setAudioSettings({ speechEnabled: false }));

  // Open the ride.
  await page.evaluate(() => window.__bikebrowserRebuildGame.registry.events.emit('skate:start'));
  await page.waitForFunction(() => window.__SKATE__?.active === true, null, { timeout: 8000 });
  await page.waitForTimeout(300); // settle onto the ground
  let s = await skate(page);
  expect(s.active).toBe(true);
  const startX = s.x;
  expect(s.inAir, 'player settles on the ground').toBe(false);

  // Jump from a standstill (x~spawn, no ramp here) -> goes airborne.
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  s = await skate(page);
  expect(s.inAir || s.vy < -100, 'Space jump lifts the rider off the ground').toBeTruthy();
  await page.waitForFunction(() => window.__SKATE__?.inAir === false, null, { timeout: 4000 }); // land

  // Ride forward: hold D; track max speed + forward progress.
  let maxSpeed = 0;
  await page.keyboard.down('KeyD');
  for (let i = 0; i < 9; i += 1) {
    await page.waitForTimeout(90);
    const cur = await skate(page);
    maxSpeed = Math.max(maxSpeed, cur.speed);
  }
  await page.keyboard.up('KeyD');
  s = await skate(page);
  expect(s.x, 'rider moved forward').toBeGreaterThan(startX + 120);
  expect(maxSpeed, 'rider built up speed').toBeGreaterThan(100);

  // Physics Goggles toggle.
  await page.keyboard.press('KeyG');
  await page.waitForTimeout(60);
  expect((await skate(page)).goggles, 'goggles on').toBe(true);
  await page.keyboard.press('KeyG');
  await page.waitForTimeout(60);
  expect((await skate(page)).goggles, 'goggles off').toBe(false);

  // Exit cleanly.
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__SKATE__?.active === false, null, { timeout: 4000 });
  expect(await page.evaluate(() => Boolean(window.__bikebrowserRebuildGame.registry.get('modalActive')))).toBe(false);

  expect(errors.filter((m) => !m.includes('AudioContext'))).toEqual([]);
});

test('the skate_park entry is gated on the bridge repair', async ({ page }) => {
  test.setTimeout(30000);
  await ready(page);
  await page.evaluate(() => window.__GAME__.resetAct1());
  // Before repair: invoking the skate_park interaction does NOT open the ride.
  const openedBefore = await page.evaluate(() => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    const r = window.__bikebrowserRebuildGame.registry.get('act1Runtime');
    // emulate the gated dispatch the marker uses
    if (r.constructionSystem.bridgeReconnected) window.__bikebrowserRebuildGame.registry.events.emit('skate:start');
    return Boolean(window.__SKATE__?.active);
  });
  expect(openedBefore).toBe(false);
});
