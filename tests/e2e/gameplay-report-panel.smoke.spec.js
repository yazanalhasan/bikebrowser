// gameplay-report-panel.smoke.spec.js - bug report handoff panel.

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

test.describe('gameplay report panel', () => {
  test('saved report stays visible as full selectable text', async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('bikebrowser_game_save', JSON.stringify(state));
      localStorage.removeItem('bikebrowser_gameplay_reports');
    }, seedState());

    await waitForGameBoot(page);

    await page.mouse.click(500, 500);
    await page.getByRole('button', { name: 'BUG' }).click({ force: true });
    await page
      .getByPlaceholder('Type what happened.', { exact: false })
      .fill('I cannot copy the report for the programmer.');
    await page.getByRole('button', { name: 'Save report' }).click();

    await expect(page.getByText('Full report to send')).toBeVisible();

    const fullReportBox = page.locator('textarea[readonly]');
    await expect(fullReportBox).toContainText('## Gameplay Report');
    await expect(fullReportBox).toContainText('I cannot copy the report for the programmer.');
    await expect(fullReportBox).toContainText('Quest: flat_tire_repair');
    await expect(page.getByRole('button', { name: 'Copy again' })).toBeVisible();
  });
});
