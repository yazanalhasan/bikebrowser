/**
 * Nothing covers the words. Plan 0.12, at 1280x720 and 390x844.
 *
 * The owner's rule is absolute: no text, readout, card, button or other
 * control may be covered. The player, the companion and NPCs are
 * occluders like anything else — the Materials Lab takeaway card was 91%
 * hidden behind Zuzu simply because the garage spawn puts him on it.
 *
 * The measurement lives in helpers/overlapAudit.js. This file is the
 * matrix: which scene, in which state, with the child standing where.
 */
import { test, expect } from 'playwright/test';

import { waitForGameBoot } from './helpers/gameBoot.js';
import {
  auditCoverage, setViewport, placePlayer, dismissDialogs,
} from './helpers/overlapAudit.js';

const DESKTOP = { width: 1280, height: 720 };
const PHONE = { width: 390, height: 844 };

/** A save far enough in that every Act 1 scene is unlocked. */
const ACT1_SAVE = {
  version: 7,
  player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
  inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube', 'mesquite_wood', 'copper_ore'],
  completedQuests: ['flat_tire_repair', 'bridge_collapse'],
  activeQuest: null,
  upgrades: [],
  zuzubucks: 355,
  reputation: 10,
  hasSeenOnboarding: true,
  journal: [],
  chapter: 'bike_phase',
  materials: { mesquite_wood: 3, copper_ore: 2, steel_scrap: 1 },
  milestones: { 'act1.complete': true },
  discovery: {},
};

async function boot(page, viewport) {
  await page.addInitScript((save) => {
    localStorage.setItem('bikebrowser_game_save', JSON.stringify(save));
    localStorage.setItem('bikebrowser_onboarded', '1');
  }, ACT1_SAVE);
  await waitForGameBoot(page);
  await setViewport(page, viewport);
  await page.waitForTimeout(1200);
}

async function goTo(page, sceneKey) {
  // Wait for whatever is running before switching: a scene.start() left
  // mid-fade means there is no live scene for a frame or two, and
  // reaching into `undefined.scene` turns a layout finding into a crash.
  await page.waitForFunction(() => window.__phaserGame?.scene?.scenes
    ?.some((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key)), null, { timeout: 20_000 });
  await page.evaluate((key) => {
    const game = window.__phaserGame;
    const live = game.scene.scenes.find((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key));
    if (live) live.scene.start(key);
    else game.scene.start(key);
  }, sceneKey);
  await page.waitForTimeout(2500);
  const active = await page.evaluate(() => window.__phaserGame.scene.scenes
    .filter((s) => s.scene.isActive()).map((s) => s.scene.key));
  expect(active, `could not reach ${sceneKey}`).toContain(sceneKey);
  // A first-visit line is open on arrival in most scenes; a dialog is a
  // reading surface, not an overlap, so the audited state has none.
  await dismissDialogs(page);
}

/**
 * Every Act 1 scene from the plan's table, with the player left at the
 * scene's own spawn.
 */
const SCENES = [
  'ZuzuGarageScene',
  'StreetBlockScene',
  'OverworldScene',
  'WorldMapScene',
  'DogParkScene',
  'LakeEdgeScene',
  'SportsFieldsScene',
  'CommunityPoolScene',
  'DesertTrailScene',
  'MountainScene',
  'DesertEdgeScene',
  'DesertForagingScene',
  'CopperMineScene',
  'SaltRiverScene',
  'DryWashScene',
  'MaterialLabScene',
  'ThermalRigScene',
];

for (const viewport of [DESKTOP, PHONE]) {
  const size = `${viewport.width}x${viewport.height}`;

  test(`every Act 1 scene keeps its text and controls clear at ${size}`, async ({ page }) => {
    test.setTimeout(360_000);
    await boot(page, viewport);

    const violations = [];
    for (const key of SCENES) {
      // Say which scene went wrong: a bare timeout in the switcher gives
      // no clue which of seventeen scenes failed to come up.
      await test.step(key, async () => {
        await goTo(page, key);
        violations.push(...await auditCoverage(page, { label: `${size} ${key}` }));
      });
    }
    expect(violations).toEqual([]);
  });

  test(`the Materials Lab stays readable with Zuzu in the room at ${size}`, async ({ page }) => {
    test.setTimeout(240_000);
    await boot(page, viewport);
    await goTo(page, 'MaterialLabScene');

    const violations = [];
    violations.push(...await auditCoverage(page, { label: `${size} lab idle` }));

    // The garage spawn puts him on the takeaway card; walk him across the
    // card and the scale so a character-over-panel cannot pass again.
    for (const [name, pos] of Object.entries({
      'on the takeaway card': { x: 320, y: 516 },
      'at the scale': { x: 560, y: 470 },
      'at the rig': { x: 320, y: 470 },
    })) {
      await placePlayer(page, 'MaterialLabScene', pos);
      violations.push(...await auditCoverage(page, { label: `${size} lab, Zuzu ${name}` }));
    }
    expect(violations).toEqual([]);
  });

  test(`the Thermal Rig stays readable at ${size}`, async ({ page }) => {
    test.setTimeout(180_000);
    await boot(page, viewport);
    await goTo(page, 'ThermalRigScene');

    const violations = await auditCoverage(page, { label: `${size} thermal rig idle` });
    await placePlayer(page, 'ThermalRigScene', { x: 320, y: 470 });
    violations.push(...await auditCoverage(page, { label: `${size} thermal rig, Zuzu at the rig` }));
    expect(violations).toEqual([]);
  });
}
