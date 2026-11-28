/**
 * "Continue Adventure" opens the scene the save names. Plan MUST 0.16.
 *
 * A child who stopped playing in the Dry Wash always woke up in the
 * garage — on the preview and on the live site — and the garage spawn
 * then overwrote where they had been standing. Every milestone save the
 * reviewer loaded did it.
 *
 * The cause is only present in a MINIFIED build. `createGameConfig`
 * picked the boot scene with `s.name === targetScene`, and the minifier
 * renames those classes to `Io`, `Rp`, `Lp`, so nothing ever matched and
 * the first scene in the list — the garage — booted every time. The dev
 * server keeps real class names, which is why the whole e2e suite was
 * green while the live site did this to every save.
 *
 * So this spec runs against `vite preview` of a real `npm run build`:
 *   npx playwright test --config playwright.preview.config.js
 *
 * A pass on the dev server would mean nothing at all.
 */
import { test, expect } from 'playwright/test';

const BASE = {
  version: 7,
  inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube'],
  completedQuests: [],
  activeQuest: null,
  upgrades: [],
  zuzubucks: 120,
  reputation: 0,
  hasSeenOnboarding: true,
  journal: [],
};

/** Each case: the save as it sits on disk, and the scene that must open. */
const CASES = [
  {
    name: 'fresh, saved in the garage',
    save: { ...BASE, player: { x: 400, y: 350, scene: 'ZuzuGarageScene' } },
    expect: 'ZuzuGarageScene',
  },
  {
    name: 'after Mrs. Ramirez, saved on Home Street',
    save: {
      ...BASE,
      player: { x: 500, y: 300, scene: 'StreetBlockScene' },
      completedQuests: ['flat_tire_repair'],
      zuzubucks: 235,
    },
    expect: 'StreetBlockScene',
  },
  {
    name: 'mid-bridge, saved in the Dry Wash',
    save: {
      ...BASE,
      player: { x: 420, y: 300, scene: 'DryWashScene' },
      activeQuest: { id: 'bridge_collapse', stepIndex: 15, stepId: 'build_bridge' },
      questDataVersion: 2,
      zuzubucks: 295,
    },
    expect: 'DryWashScene',
  },
  {
    name: 'after the bridge, saved in the Dry Wash',
    save: {
      ...BASE,
      player: { x: 460, y: 320, scene: 'DryWashScene' },
      completedQuests: ['flat_tire_repair', 'bridge_collapse'],
      milestones: { 'act1.complete': true },
      zuzubucks: 355,
    },
    expect: 'DryWashScene',
  },
  {
    name: 'Act 1 complete, saved in the garage',
    save: {
      ...BASE,
      player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
      completedQuests: ['flat_tire_repair', 'bridge_collapse'],
      milestones: { 'act1.complete': true },
      zuzubucks: 355,
    },
    expect: 'ZuzuGarageScene',
  },
  // The retired keys, which must migrate AND boot (MUST 0.15 + 0.16).
  {
    name: "v6 save in the retired 'GarageScene'",
    save: { ...BASE, version: 6, player: { x: 400, y: 340, scene: 'GarageScene' } },
    expect: 'ZuzuGarageScene',
  },
  {
    name: "v6 save in the retired 'NeighborhoodScene'",
    save: { ...BASE, version: 6, player: { x: 640, y: 500, scene: 'NeighborhoodScene' } },
    expect: 'OverworldScene',
  },
  {
    name: "v7 save poisoned with 'NeighborhoodScene' by the west-edge bug",
    save: {
      ...BASE,
      player: { x: 1180, y: 520, scene: 'NeighborhoodScene' },
      completedQuests: ['flat_tire_repair', 'bridge_collapse'],
    },
    expect: 'OverworldScene',
  },
];

/** Seed a save, press Continue, and report the scene that opened. */
async function resume(page, save) {
  await page.addInitScript((s) => {
    localStorage.setItem('bikebrowser_game_save', JSON.stringify(s));
  }, save);
  await page.goto('/play', { waitUntil: 'domcontentloaded' });

  const cont = page.getByRole('button', { name: 'Continue Adventure' });
  await expect(cont, 'the splash should offer Continue for a save').toBeVisible({ timeout: 20_000 });
  await cont.click();

  await page.waitForFunction(() => Boolean(window.__phaserGame), null, { timeout: 30_000 });
  await page.waitForFunction(() => window.__phaserGame.scene.scenes
    .some((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key)), null, { timeout: 30_000 });
  await page.waitForTimeout(1500);

  return page.evaluate(() => {
    const game = window.__phaserGame;
    const live = game.scene.scenes
      .filter((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key))
      .map((s) => s.scene.key);
    const state = game.scene.scenes.find((s) => s.scene.isActive())?.registry?.get('gameState');
    return {
      live,
      saved: state?.player?.scene,
      zuzubucks: state?.zuzubucks,
      inventory: (state?.inventory || []).length,
      quest: state?.activeQuest?.stepId ?? null,
    };
  });
}

test('the handle is present, so a failure below is the game and not the harness', async ({ page }) => {
  await page.goto('/play', { waitUntil: 'domcontentloaded' });
  const built = await page.evaluate(() => ({
    // A production bundle: the dev client is not in the page.
    dev: Boolean(document.querySelector('script[src*="@vite/client"]')),
  }));
  expect(built.dev, 'this config must run against the built bundle, not vite dev').toBe(false);
});

for (const c of CASES) {
  test(`Continue Adventure: ${c.name} -> ${c.expect}`, async ({ page }) => {
    const got = await resume(page, c.save);
    expect(got.live, `opened ${got.live.join(', ')} instead of ${c.expect}`).toContain(c.expect);
  });
}

test('resuming does not cost the child anything they earned', async ({ page }) => {
  const save = CASES[2].save; // mid-bridge, 295 Zuzubucks, on build_bridge
  const got = await resume(page, save);
  expect(got.live).toContain('DryWashScene');
  expect(got.zuzubucks).toBe(295);
  expect(got.inventory).toBe(4);
  expect(got.quest).toBe('build_bridge');
});
