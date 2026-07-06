import { test, expect } from 'playwright/test';

// The dry wash must be impassable until the bridge is repaired (the whole point
// of building it). Verify the player is blocked from crossing east before repair,
// and can cross after.
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await page.evaluate(() => window.__GAME__.resetAct1());
}
function playerX(page) {
  return page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').player.x);
}
async function holdRight(page, ms) {
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(ms); await page.keyboard.up('ArrowRight');
}

test('wash blocks crossing until the bridge is repaired', async ({ page }) => {
  test.setTimeout(45000);
  await ready(page);
  // Teleport the player just west of the wash barrier, then push east hard.
  await page.evaluate(() => {
    const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    s.player.setPosition(s.layout.desert_wash.x + 20, s.player.y);
  });
  for (let i = 0; i < 8; i++) await holdRight(page, 250);
  const blockedX = await playerX(page);
  const barrierX = await page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').layout.desert_wash.x + 80);
  expect(blockedX, 'player cannot cross east past the wash barrier before repair').toBeLessThan(barrierX);

  // Repair the bridge via the real chain, then the barrier should drop.
  await page.evaluate(() => {
    const g = window.__GAME__;
    for (let i = 0; i < 8; i += 1) g.handleInteraction('collect_materials');
    for (let i = 0; i < 3; i += 1) g.handleInteraction('ecology_patch'); // collect mesquite so it can be tested
    ['bamboo', 'steel', 'carbon_fiber'].forEach((id) => g.testMaterial(id));
    g.designBridge({ deck: 'bamboo', support: 'steel', brace: 'carbon_fiber' });
    g.repairBridge();
    window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').updateEvidencePanel();
  });
  for (let i = 0; i < 8; i++) await holdRight(page, 250);
  const crossedX = await playerX(page);
  expect(crossedX, 'player can cross east after the bridge is repaired').toBeGreaterThan(barrierX);
});
