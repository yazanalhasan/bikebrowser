import { test, expect } from 'playwright/test';

// DUAL-SPINE REACHABILITY (added 2026-07-06): every engineering chapter lab must
// expose a working door to its chapter's biology pillar. The Phaser bench scenes
// carried this cross-link, but they are hidden under the React lab overlays —
// without a door on the VISIBLE overlay the whole biology spine (Ch 2–7) was
// unreachable in normal play (audited fake-out #1). This spec drives the real
// GameShell overlay: open each engineering lab, click the bio door, and require
// the biology lab to replace it.
const PAIRINGS = [
  { start: 'circuit:start', eng: 'Circuit Bench', bio: 'Extraction Bench' },
  { start: 'engine:start', eng: 'Engine Dyno', bio: 'Phytochemistry Lab' },
  { start: 'crash:start', eng: 'Crash & Load Test', bio: 'Microscope' },
  { start: 'boat:start', eng: 'Hydro Tank', bio: 'Fermentation Bench' },
  { start: 'plane:start', eng: 'Wind Tunnel', bio: 'Molecular Mechanism Bench' },
  { start: 'space:start', eng: 'Vacuum & Re-entry Chamber', bio: 'Ecosystem Engineering' },
];

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}
const overlayLabel = () => document.querySelector('.bb-utm-overlay')?.getAttribute('aria-label') || null;

test.describe('Dual spine — biology doors on the engineering labs', () => {
  test('every engineering chapter lab opens, shows a bio door, and the door opens the biology lab', async ({ page }) => {
    test.setTimeout(180_000);
    await ready(page);

    for (const pair of PAIRINGS) {
      // Enter the chapter rig through its ladder entry channel (the same
      // registry event ChapterMapScene emits on a card click).
      await page.evaluate((startEvent) => {
        window.__bikebrowserRebuildGame.registry.events.emit(startEvent);
      }, pair.start);
      await page.waitForFunction(
        (expected) => document.querySelector('.bb-utm-overlay')?.getAttribute('aria-label') === expected,
        pair.eng,
        { timeout: 20_000 },
      );

      // The dual-spine door is visible on the overlay and opens the bio lab.
      const door = page.getByTestId('bio-door');
      await expect(door, `${pair.eng} exposes its biology door`).toBeVisible();
      await door.click();
      await page.waitForFunction(
        (expected) => document.querySelector('.bb-utm-overlay')?.getAttribute('aria-label') === expected,
        pair.bio,
        { timeout: 20_000 },
      );
      expect(await page.evaluate(overlayLabel), `${pair.bio} replaced ${pair.eng}`).toBe(pair.bio);

      // Close cleanly before the next chapter (Escape must always work).
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.bb-utm-overlay'));
    }
  });
});
