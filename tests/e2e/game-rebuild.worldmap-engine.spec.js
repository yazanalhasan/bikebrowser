import { test, expect } from 'playwright/test';

// ENGINE acceptance for the World Map (Phase 2.3). The map must be FUNCTIONAL:
// Current / Reachable / Locked derived from real state, no fake destinations, no
// dead links, and progression (unlocking the wider map) moves Locked -> Reachable.

const REAL_IDS = ['home', 'garage', 'street', 'dry_wash', 'bridge', 'wider_gate', 'salt_river', 'copper_mine'];

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => window.__GAME__.resetAct1());
}

test.describe('Engine acceptance — world map', () => {
  test('current/reachable/locked are real and derived from state; unlocking moves locked->reachable', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);

    const data = await page.evaluate((realIds) => {
      const g = window.__GAME__;
      const fresh = g.getWorldMap();

      // Discovering the wash through a real action makes it reachable.
      g.handleInteraction('dry_wash');
      const afterDiscover = g.getWorldMap();

      // Real progression: build + repair the bridge, which opens the wider map.
      g.handleInteraction('collect_materials'); // steel, copper_brace, weak_scrap
      g.handleInteraction('ecology_patch');     // mesquite
      ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => g.testMaterial(id));
      g.designBridge({ deck: 'mesquite', support: 'steel', brace: 'copper_brace' });
      g.repairBridge();      // sets bridgeReconnected
      g.unlockWiderMap();    // now succeeds -> wider map opens
      const afterUnlock = g.getWorldMap();

      const ids = (m) => [...m.reachable, ...m.locked, ...m.undiscovered].map((l) => l.id);
      const noFake = (m) => ids(m).every((id) => realIds.includes(id));
      return {
        freshReachable: fresh.reachable.map((l) => l.id),
        freshLocked: fresh.locked.map((l) => l.id),
        freshTotal: fresh.counts.total,
        freshNoFake: noFake(fresh),
        washReachableAfterDiscover: afterDiscover.reachable.map((l) => l.id).includes('dry_wash'),
        unlockReachable: afterUnlock.reachable.map((l) => l.id),
        unlockLocked: afterUnlock.locked.map((l) => l.id),
        lockedHaveReason: fresh.locked.every((l) => Boolean(l.unlocksBy)),
      };
    }, REAL_IDS);

    // No fake destinations.
    expect(data.freshTotal).toBe(REAL_IDS.length);
    expect(data.freshNoFake, 'every destination is a real place').toBe(true);
    // Always-known neighborhood is reachable from the start.
    expect(data.freshReachable).toEqual(expect.arrayContaining(['home', 'garage', 'street']));
    // The frontier is honestly locked (with a stated unlock condition).
    expect(data.freshLocked).toEqual(expect.arrayContaining(['salt_river', 'copper_mine', 'wider_gate']));
    expect(data.lockedHaveReason, 'locked places say how to unlock — no dead links').toBe(true);
    // Discovery makes a place reachable.
    expect(data.washReachableAfterDiscover, 'discovering the wash makes it reachable').toBe(true);
    // Progression: unlocking the wider map promotes locked -> reachable.
    expect(data.unlockReachable).toEqual(expect.arrayContaining(['salt_river', 'copper_mine']));
    expect(data.unlockLocked, 'no locked frontier remains after the wider map opens').toEqual([]);
  });
});
