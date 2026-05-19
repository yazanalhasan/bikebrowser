// mission-inventory-hud.smoke.spec.js - player-visible progression affordances.

import { test, expect } from 'playwright/test';
import { waitForGameBoot } from './helpers/gameBoot.js';

function seedState() {
  return {
    version: 6,
    player: { x: 400, y: 350, scene: 'StreetBlockScene' },
    inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube'],
    completedQuests: [],
    activeQuest: { id: 'flat_tire_repair', stepIndex: 1 },
    upgrades: [],
    zuzubucks: 0,
    reputation: 0,
    hasSeenOnboarding: true,
    journal: [],
    gameSettings: {
      speechEnabled: false,
      autoSpeak: false,
      speechRate: 0.9,
      complexityMode: 'adaptive',
      mensaMode: false,
    },
    knownRecipes: ['healing_salve', 'energy_cake', 'hydration_jelly'],
    knownWorkbenchRecipes: [],
    solvedChallenges: [],
    solvedCognitiveQuests: [],
    cognitiveProfile: {
      patternSkill: 0.5,
      spatialSkill: 0.5,
      logicSkill: 0.5,
      optimizationSkill: 0.5,
      sequenceSkill: 0.5,
    },
    cognitiveUnlocks: [],
    cognitiveStats: { solved: 0, attempts: 0, byType: {} },
    cognitiveAnswers: [],
    observations: [],
    materialLog: [],
    derivedAnswers: {},
    sideQuests: {},
    worldMap: { lastVisited: null, visitCount: {} },
    solvedObstacles: [],
    milestones: { completed: [], completedAt: {}, unlocked: [], currentPhase: 1 },
    discovery: { tiles: [], width: 0, height: 0, tile: 32 },
    timestamp: new Date().toISOString(),
  };
}

function seedForageState() {
  return {
    ...seedState(),
    inventory: [],
    activeQuest: { id: 'desert_healer', stepIndex: 1 },
  };
}

test.describe('mission and inventory HUD', () => {
  test('active mission objective and inventory are visible to the player', async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('bikebrowser_game_save', JSON.stringify(state));
    }, seedState());

    await waitForGameBoot(page);

    await expect(page.getByText("Fix Mrs. Ramirez's Flat Tire")).toBeVisible();
    await expect(page.getByText('Step 2/7')).toBeVisible();
    await expect(page.getByText('Look closely at the tire')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open inventory' })).toContainText('4');

    await page.getByRole('button', { name: 'Open inventory' }).click();
    await expect(page.getByText('Inventory')).toBeVisible();
    await expect(page.getByText('Patch Kit')).toBeVisible();
  });

  test('blocked forage steps tell the player what to do next', async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('bikebrowser_game_save', JSON.stringify(state));
    }, seedForageState());

    await waitForGameBoot(page);

    await expect(page.getByText('Find: 🌿 Creosote Leaves')).toBeVisible();

    await page.evaluate(() => {
      window.__phaserGame.registry.set('dialogEvent', {
        speaker: 'Mrs. Ramirez',
        text: 'Find a creosote bush in the desert and harvest some leaves.',
        step: {
          id: 'find_creosote',
          type: 'forage',
          requiredItem: 'creosote_leaves',
          hint: 'Creosote bushes grow in dry, low-elevation areas. Look for small green bushes.',
        },
      });
    });

    await expect(page.getByText('Next: Creosote bushes grow in dry, low-elevation areas. Look for small green bushes.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close and forage' })).toBeVisible();
  });
});
