import { test, expect } from 'playwright/test';

// Regression test for the P1 progression-persistence bug (audit 2026-06-23,
// Doc 1). Before the fix, `progression.chaptersComplete` lived only in the Phaser
// registry: it was never written to localStorage and never restored at boot, so a
// page refresh re-locked Chapters 2-7. This test drives the real completion event
// path (NeighborhoodScene._markChapterComplete -> Act1RuntimeSystem.saveGame) and
// asserts the unlock survives a reload (restoreProgression at boot).
const SAVE_KEY = 'bikebrowser.gameRebuild.act1';

async function waitForGameReady(page) {
  await expect(page.getByTestId('rebuild-game-shell')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__GAME__ && window.__bikebrowserRebuildGame));
  await page.waitForFunction(() =>
    window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene')?.scene?.isActive());
  await page.evaluate(() => window.__GAME__.setAudioSettings({ speechEnabled: false }));
}

test('chapter unlock persists across a reload', async ({ page }) => {
  await page.goto('/game-rebuild');
  await waitForGameReady(page);

  // Start clean so the assertion is unambiguous.
  await page.evaluate(() => window.__GAME__.resetAct1());

  // Drive the real path: completing the e-bike (Chapter 2) emits `circuit:built`,
  // which NeighborhoodScene turns into _markChapterComplete(2) + a save.
  await page.evaluate(() => window.__bikebrowserRebuildGame.registry.events.emit('circuit:built'));

  // 1) The unlock is now in the registry...
  const inRegistry = await page.evaluate(() =>
    window.__bikebrowserRebuildGame.registry.get('progression')?.chaptersComplete || []);
  expect(inRegistry).toContain(2);

  // 2) ...and was persisted to localStorage (the part that was missing).
  const persisted = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw)?.progression?.chaptersComplete || [] : [];
  }, SAVE_KEY);
  expect(persisted).toContain(2);

  // 3) After a real reload, restoreProgression() rehydrates the registry at boot.
  await page.reload();
  await waitForGameReady(page);
  const afterReload = await page.evaluate(() =>
    window.__bikebrowserRebuildGame.registry.get('progression')?.chaptersComplete || []);
  expect(afterReload).toContain(2);
});

test('biology-spine completion persists across a reload (Doc 4)', async ({ page }) => {
  await page.goto('/game-rebuild');
  await waitForGameReady(page);
  await page.evaluate(() => window.__GAME__.resetAct1());

  // Completing the Chapter 3 phytochemistry lab emits `phyto:built`, which now
  // records the parallel biological spine alongside the vehicle ladder.
  await page.evaluate(() => window.__bikebrowserRebuildGame.registry.events.emit('phyto:built'));

  const persisted = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw)?.bioComplete || [] : [];
  }, SAVE_KEY);
  expect(persisted).toContain(3);

  await page.reload();
  await waitForGameReady(page);
  const afterReload = await page.evaluate(() =>
    window.__bikebrowserRebuildGame.registry.get('bioComplete') || []);
  expect(afterReload).toContain(3);
});

test('a save with no progression field boots cleanly (backward compatible)', async ({ page }) => {
  await page.goto('/game-rebuild');
  await waitForGameReady(page);

  // Simulate an OLD save written before the fix: act1 state present, no progression.
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ schemaVersion: 2, quests: {}, notebook: {} }));
  }, SAVE_KEY);

  await page.reload();
  await waitForGameReady(page);

  // No crash; progression defaults to empty (Chapter 1 only).
  const chaptersComplete = await page.evaluate(() =>
    window.__bikebrowserRebuildGame.registry.get('progression')?.chaptersComplete || []);
  expect(chaptersComplete).toEqual([]);
});
