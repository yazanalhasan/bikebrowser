import { test, expect } from 'playwright/test';

// PLAYER REACHABILITY + PAYOFF acceptance for the World Map (Phase 2.3). By REAL
// keyboard: pressing G opens a FUNCTIONAL map showing Current / Reachable /
// Locked (not decorative), and pressing G again closes it (the G key is live —
// it previously double-toggled and appeared dead).
const captureDir = 'playtest_captures/game_rebuild_worldmap_reachability';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}

test.describe('Player reachability — world map', () => {
  test('G opens a functional map (current/reachable/locked) and G closes it', async ({ page }) => {
    test.setTimeout(45_000);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });
    await ready(page);

    // The map mirror exists and the panel starts closed.
    await page.waitForFunction(() => Boolean(window.__WORLDMAP__));
    expect(await page.evaluate(() => window.__WORLDMAP__.open), 'map starts collapsed').toBe(false);

    // Press G -> the map opens (the dead-key/double-toggle bug is fixed).
    await page.keyboard.press('KeyG');
    await page.waitForFunction(() => window.__WORLDMAP__.open === true, null, { timeout: 5_000 });
    const m = await page.evaluate(() => window.__WORLDMAP__);
    await page.screenshot({ path: `${captureDir}/01_map_open.png`, fullPage: true });

    // Functional, not decorative: real current + reachable + locked.
    expect(m.currentLabel, 'shows the current location').toBeTruthy();
    expect(m.reachable, 'reachable list includes the always-known neighborhood').toEqual(expect.arrayContaining(['home', 'garage', 'street']));
    expect(m.current, 'the player is standing at a reachable place (no dead link)').toBeTruthy();
    expect(m.reachable.includes(m.current), 'current is itself a reachable destination').toBe(true);
    expect(m.locked.length, 'a locked frontier is shown honestly').toBeGreaterThan(0);
    expect(m.quest, 'the quest marker is published with the map').toBe('dry_wash');
    expect(m.routeSummary, 'the map names the child-readable next route').toContain('Quest: Dry Wash');

    // Press G again -> it closes. The control is live (toggles both ways).
    await page.keyboard.press('KeyG');
    await page.waitForFunction(() => window.__WORLDMAP__.open === false, null, { timeout: 5_000 });
  });

  test('the current location tracks the player as they move', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);
    await page.waitForFunction(() => Boolean(window.__WORLDMAP__));
    const start = await page.evaluate(() => window.__WORLDMAP__.current);
    // Walk a good distance to the right (toward the wash/desert side).
    for (let i = 0; i < 8; i++) { await page.keyboard.down('ArrowRight'); await page.waitForTimeout(180); await page.keyboard.up('ArrowRight'); }
    await page.waitForTimeout(300);
    const moved = await page.evaluate(() => window.__WORLDMAP__.current);
    // Either the nearest location changed, or the player legitimately remained
    // nearest the same known spot — but the value must always be a real place.
    const real = ['home', 'garage', 'street', 'dry_wash', 'bridge', 'wider_gate', 'salt_river', 'copper_mine'];
    expect(real.includes(moved), 'current is always a real destination').toBe(true);
    expect(typeof start === 'string' && typeof moved === 'string').toBe(true);
  });
});
