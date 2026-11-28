// MUST 0.15 — "No legacy art after progression".
//
// Owner bug (t65u): after the bridge the game dropped back to the very old
// graphics (flat beige garage, emoji icons, grey oil-stain circles, Graphics
// houses). Cause: DryWash's west edge walked into the retired NeighborhoodScene
// (seamlessTraversal.js SCENE_ADJACENCY), whose "Go Home" door opened the
// retired GarageScene. This spec loads a save at every milestone, and also WALKS
// the post-bridge edges, then audits the display list of whatever scene is live.
//
// Run: npx playwright test no-legacy-art.smoke
import { test, expect } from 'playwright/test';
import { waitForGameBoot } from './helpers/gameBoot.js';

const LEGACY_SCENE_KEYS = ['GarageScene', 'NeighborhoodScene'];

// Flat-rectangle "furniture" still allowed per scene (ratchet: may go down,
// never up). Rect = visible Phaser Rectangle, fillAlpha >= 0.9, >= 40x40.
const FLAT_RECT_BUDGET = {
  ZuzuGarageScene: 1,   // notebook desk — replace with art, then set to 0
  MaterialLabScene: 6,
  ThermalRigScene: 6,
  // Measured on 9e75179 — other scenes' flat pieces; ratchet only, fixed by plan Phase 2.
  DogParkScene: 1, LakeEdgeScene: 1, SportsFieldsScene: 2, MountainScene: 1,
  WorldMapScene: 1, CopperMineScene: 4,
};
// Known debt, not part of 0.15: DogParkScene's floor is not painted art (0% cover).
const COVER_EXEMPT = new Set(['DogParkScene']);

const base = (over = {}) => ({
  version: 7,
  player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
  inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube'],
  completedQuests: [], activeQuest: null, upgrades: [], zuzubucks: 0, reputation: 0,
  hasSeenOnboarding: true, journal: [],
  gameSettings: { speechEnabled: false, autoSpeak: false },
  materialLog: [], observations: [],
  worldMap: { lastVisited: null, visitCount: {} },
  discovery: { tiles: [], width: 0, height: 0, tile: 32 },
  timestamp: new Date().toISOString(),
  ...over,
});
const BRIDGE_DONE = ['flat_tire_repair', 'chain_repair', 'bridge_collapse'];
const SAVES = {
  'fresh': base({ hasSeenOnboarding: false }),
  'after Mrs. Ramirez': base({ completedQuests: ['flat_tire_repair'], zuzubucks: 20 }),
  'after the bridge (in Dry Wash)': base({
    completedQuests: BRIDGE_DONE, observations: ['bridge_built'], bridgeBuilt: true, zuzubucks: 480,
    player: { x: 400, y: 350, scene: 'DryWashScene' },
  }),
  'Act 1 complete': base({
    completedQuests: [...BRIDGE_DONE, 'food_chain_tracker', 'medicine_balance'],
    observations: ['bridge_built'], bridgeBuilt: true, zuzubucks: 480, reputation: 80,
    materialLog: [{ id: 'steel', name: 'Steel', massGrams: 12 }],
  }),
  'old v6 save, scene GarageScene': base({ version: 6, player: { x: 400, y: 340, scene: 'GarageScene' } }),
  'old v6 save, scene NeighborhoodScene': base({ version: 6, player: { x: 280, y: 280, scene: 'NeighborhoodScene' } }),
  'v7 save poisoned by the bug (scene NeighborhoodScene)': base({
    completedQuests: BRIDGE_DONE, bridgeBuilt: true, player: { x: 280, y: 280, scene: 'NeighborhoodScene' },
  }),
};

/** Audit every active scene's display list. Returns a list of violation strings. */
async function audit(page, label) {
  return page.evaluate(async ({ LEGACY, BUDGET, EXEMPT }) => {
    const game = window.__phaserGame;
    // The app publishes its own approved list beside the game handle.
    // This used to be `import('/src/game/assets/assetManifest.js')`,
    // which only resolves on the dev server — so this spec could not run
    // against a built bundle, and MUST 0.16 proved that a green dev run
    // can hide a bug the live site has.
    const approved = new Set(window.__approvedTextureKeys || []);
    if (!approved.size) return ['no approved texture list on the page'];
    // tileSprites are cut from approved slots into uuid-named, edge-extruded textures
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/;
    const v = [];
    for (const k of LEGACY) if (game.scene.keys[k]) v.push(`legacy scene "${k}" is still registered`);
    const live = game.scene.scenes.filter((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key));
    if (!live.length) v.push('no active scene');
    for (const s of live) {
      const key = s.scene.key;
      if (LEGACY.includes(key)) v.push(`active scene is legacy: ${key}`);
      const b = s.physics?.world?.bounds;
      const W = b?.width || s.scale.width, H = b?.height || s.scale.height;
      let cover = 0, flatRects = 0;
      const bad = new Set();
      for (const o of s.children.list) {
        if (!o.visible) continue;
        if (o.type === 'Image' || o.type === 'Sprite' || o.type === 'TileSprite') {
          const tk = o.texture?.key;
          const ok = approved.has(tk) || (o.type === 'TileSprite' && UUID.test(tk));
          if (!ok) bad.add(tk);
          if (o.depth <= 1 && ok) cover += o.displayWidth * o.displayHeight;
        }
        if (o.type === 'Rectangle' && o.fillAlpha >= 0.9 && o.width >= 40 && o.height >= 40) flatRects += 1;
      }
      if (bad.size) v.push(`${key}: textures outside the approved manifest: ${[...bad].join(', ')}`);
      if (!EXEMPT.includes(key) && cover < 0.5 * W * H) v.push(`${key}: painted floor/backdrop covers only ${Math.round(100 * cover / (W * H))}% of the scene (need >= 50%)`);
      const budget = BUDGET[key] ?? 0;
      if (flatRects > budget) v.push(`${key}: ${flatRects} flat Rectangle furniture/floor pieces (budget ${budget})`);
    }
    return v;
  }, { LEGACY: LEGACY_SCENE_KEYS, BUDGET: FLAT_RECT_BUDGET, EXEMPT: [...COVER_EXEMPT] }).then((v) => v.map((m) => `[${label}] ${m}`));
}

async function bootSave(page, save) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('bikebrowser_game_save', JSON.stringify(s));
      sessionStorage.setItem('seeded', '1');
    }
  }, save);
  await waitForGameBoot(page);
  await page.waitForTimeout(2500);
}
const liveKeys = (page) => page.evaluate(() => window.__phaserGame.scene.scenes
  .filter((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key)).map((s) => s.scene.key));

for (const [name, save] of Object.entries(SAVES)) {
  test(`milestone: ${name} has no legacy art`, async ({ page }) => {
    await bootSave(page, save);
    expect(await audit(page, name)).toEqual([]);
  });
}

test('walking out of Dry Wash after the bridge never reaches legacy art', async ({ page }) => {
  test.setTimeout(90_000);
  await bootSave(page, SAVES['after the bridge (in Dry Wash)']);
  const violations = [];
  // 1. Walk off each edge with the keyboard (west was the bug).
  for (const [dir, x, y] of [['ArrowLeft', 150, 250], ['ArrowRight', 750, 250], ['ArrowUp', 450, 120], ['ArrowDown', 450, 480]]) {
    await page.evaluate(({ x, y }) => {
      const s = window.__phaserGame.scene.getScene('DryWashScene');
      if (s?.scene.isActive()) s.player.sprite.setPosition(x, y);
    }, { x, y });
    await page.keyboard.down(dir);
    await page.waitForTimeout(2500);
    await page.keyboard.up(dir);
    await page.waitForTimeout(1500);
    violations.push(...await audit(page, `edge ${dir} -> ${(await liveKeys(page)).join('+')}`));
    // back to Dry Wash for the next edge
    await page.evaluate(() => window.__phaserGame.scene.scenes
      .filter((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key)).forEach((s) => window.__phaserGame.scene.stop(s.scene.key)));
    await page.evaluate(() => window.__phaserGame.scene.start('DryWashScene'));
    await page.waitForTimeout(1500);
  }
  expect(violations).toEqual([]);
});

test('every scene reachable from the Home Street exits and doors is non-legacy', async ({ page }) => {
  test.setTimeout(120_000);
  await bootSave(page, SAVES['Act 1 complete']);
  const keys = await page.evaluate(() => window.__phaserGame.scene.scenes.map((s) => s.scene.key)
    .filter((k) => !/Overlay|Explainer|CognitiveQuest/.test(k)));
  const violations = [];
  for (const k of keys) {
    await page.evaluate((k) => {
      const g = window.__phaserGame;
      g.scene.scenes.filter((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key)).forEach((s) => g.scene.stop(s.scene.key));
      g.scene.start(k);
    }, k);
    await page.waitForTimeout(2000);
    violations.push(...await audit(page, `scene ${k}`));
  }
  expect(violations).toEqual([]);
});
