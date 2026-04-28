// flat-tire-flow.smoke.spec.js — catches the fragile early-game repair path.

import { test, expect } from 'playwright/test';
import { waitForGameBoot } from './helpers/gameBoot.js';

function baseState() {
  return {
    version: 6,
    player: { x: 400, y: 350, scene: 'StreetBlockScene' },
    inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube'],
    completedQuests: [],
    activeQuest: { id: 'flat_tire_repair', stepIndex: 0 },
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

test.describe('flat tire repair flow', () => {
  test('street bike interaction reaches explainer and cognitive scene boots', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') runtimeErrors.push(msg.text());
    });

    await page.addInitScript((state) => {
      localStorage.setItem('bikebrowser_game_save', JSON.stringify(state));
    }, baseState());

    await waitForGameBoot(page);

    await page.evaluate(() => {
      const game = window.__phaserGame;
      game.scene.start('StreetBlockScene');
    });

    await page.waitForFunction(() => {
      const game = window.__phaserGame;
      return game?.scene?.getScene('StreetBlockScene')?.scene?.isActive();
    });

    await page.evaluate(() => {
      const scene = window.__phaserGame.scene.getScene('StreetBlockScene');
      scene._handleRamirezBikeInteract();
    });

    await expect.poll(async () => page.evaluate(() => {
      const state = window.__phaserGame.registry.get('gameState');
      return state.activeQuest?.stepIndex;
    })).toBe(1);

    await page.evaluate(() => {
      const scene = window.__phaserGame.scene.getScene('StreetBlockScene');
      scene._handleRamirezBikeInteract();
    });

    await page.waitForFunction(() => {
      const game = window.__phaserGame;
      return game?.scene?.getScene('ExplainerScene')?.scene?.isActive();
    });

    await page.evaluate(() => {
      const game = window.__phaserGame;
      const street = game.scene.getScene('StreetBlockScene');
      street.scene.stop('ExplainerScene');
      street.scene.launch('CognitiveQuestScene', {
        questId: 'flat_tire_reasoning',
        returnSceneKey: 'StreetBlockScene',
      });
    });

    await page.waitForFunction(() => {
      const game = window.__phaserGame;
      return game?.scene?.getScene('CognitiveQuestScene')?.scene?.isActive();
    });

    const relevantErrors = runtimeErrors.filter((message) =>
      !message.includes('UX audit service error'),
    );
    expect(relevantErrors).toEqual([]);
  });
});
