import { test, expect } from 'playwright/test';
import { waitForGameBoot } from './helpers/gameBoot.js';

const ACT1_SAVE = {
  version: 6,
  player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
  inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube'],
  completedQuests: [
    'flat_tire_repair',
    'chain_repair',
    'bridge_collapse',
    'food_chain_tracker',
    'medicine_balance',
  ],
  activeQuest: null,
  upgrades: [],
  zuzubucks: 0,
  reputation: 80,
  hasSeenOnboarding: true,
  journal: [],
  gameSettings: { speechEnabled: false, autoSpeak: false },
  materialLog: [{ id: 'steel', name: 'Steel', massGrams: 12 }],
  observations: ['bridge_built'],
  worldMap: { lastVisited: null, visitCount: {} },
  discovery: { tiles: [], width: 0, height: 0, tile: 32 },
  timestamp: new Date().toISOString(),
};

test('Act 1 completion opens the wider map message', async ({ page }) => {
  await page.addInitScript((state) => {
    localStorage.setItem('bikebrowser_game_save', JSON.stringify(state));
  }, ACT1_SAVE);

  await waitForGameBoot(page);
  await expect(page.getByTestId('act1-complete')).toBeVisible();
  await expect(page.getByText('Wider map is open')).toBeVisible();

  await page.evaluate(() => {
    window.__phaserGame.scene.start('WorldMapScene');
  });

  await page.waitForFunction(() => {
    const scene = window.__phaserGame.scene.getScene('WorldMapScene');
    return scene?.scene?.isActive?.();
  });

  const ceremony = await page.evaluate(() => {
    const scene = window.__phaserGame.scene.getScene('WorldMapScene');
    const loc = scene._locationNodes?.find?.((node) => node.id === 'wider_earth_gate')
      || null;
    return {
      active: scene.scene.isActive(),
      hasGate: Boolean(scene),
    };
  });
  expect(ceremony.active).toBe(true);

  await page.evaluate(() => {
    const scene = window.__phaserGame.scene.getScene('WorldMapScene');
    scene._selectLocation({
      ceremony: true,
      ceremonyText: 'The wider map is open. Your bike rolls, the bridge holds.',
      name: 'Road Beyond the Desert',
    });
  });

  await expect.poll(async () => page.evaluate(() => {
    return window.__phaserGame.registry.get('dialogEvent')?.text || '';
  })).toContain('wider map is open');
});
