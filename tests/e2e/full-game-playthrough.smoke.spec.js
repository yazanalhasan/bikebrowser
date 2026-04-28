// full-game-playthrough.smoke.spec.js - deterministic end-to-end quest graph.
//
// This is the "play the whole game every time" safety net. It boots the
// browser game, loads the real quest data + quest system modules, and walks
// every shipped quest from first step to completion. For action-gated steps,
// it records the same save-state facts that the scene interaction would have
// produced: required inventory items, observations, crafted recipes, and the
// correct quiz choice.

import { test, expect } from 'playwright/test';
import { waitForGameBoot } from './helpers/gameBoot.js';

const DEFAULT_REQUIRED_ITEMS = [
  'tire_lever',
  'patch_kit',
  'wrench',
  'chain_lube',
  'basic_pump',
  'multi_tool',
  'steel_sample',
  'copper_ore_sample',
  'mesquite_wood_sample',
];

function seedState() {
  return {
    version: 6,
    player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
    inventory: [...DEFAULT_REQUIRED_ITEMS],
    completedQuests: [],
    activeQuest: null,
    upgrades: [],
    zuzubucks: 0,
    reputation: 0,
    hasSeenOnboarding: true,
    journal: ['Automated full-game playthrough started.'],
    gameSettings: {
      speechEnabled: false,
      autoSpeak: false,
      speechRate: 0.9,
      complexityMode: 'adaptive',
      mensaMode: false,
    },
    chapter: 'bike_phase',
    materials: {},
    builds: { bike: null, battery: null, ebike: null },
    factories: {},
    knowledge: { unlocked: [], discoveries: [] },
    skills: {
      mechanic: 1,
      electrical: 0,
      chemistry: 0,
      engineering: 0,
      biology: 0,
    },
    bio: { samples: [], extracted: [], constructs: [], organisms: [], productions: [] },
    knownRecipes: ['healing_salve', 'energy_cake', 'hydration_jelly'],
    knownWorkbenchRecipes: [],
    language: {
      regions: {},
      activeRegion: null,
      settings: {
        transliterationVisible: true,
        pronunciationHints: true,
        autoAudioPlayback: false,
        microphoneEnabled: false,
        displayMode: 'dual',
      },
    },
    sideQuests: {},
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
    worldMap: { lastVisited: null, visitCount: {} },
    solvedObstacles: [],
    milestones: { completed: [], completedAt: {}, unlocked: [], currentPhase: 1 },
    materialLog: [],
    derivedAnswers: {},
    observations: [],
    minedResources: {},
    miningToolLevel: 3,
    miningStats: { totalMined: 0, totalRefined: 0, regionsVisited: [] },
    discovery: { tiles: [], width: 0, height: 0, tile: 32 },
    timestamp: new Date().toISOString(),
  };
}

test.describe('full game playthrough', () => {
  test('every shipped quest can be completed in the browser runtime', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') runtimeErrors.push(msg.text());
    });

    await page.addInitScript((state) => {
      localStorage.setItem('bikebrowser_game_save', JSON.stringify(state));
    }, seedState());

    await waitForGameBoot(page);

    const result = await page.evaluate(async () => {
      const [{ default: QUESTS }, questSystem] = await Promise.all([
        import('/src/renderer/game/data/quests.js'),
        import('/src/renderer/game/systems/questSystem.js'),
      ]);

      const questIds = Object.keys(QUESTS);
      const failures = [];
      let state = window.__phaserGame.registry.get('gameState');

      const addUnique = (list, value) => (
        value && !list.includes(value) ? [...list, value] : list
      );

      const satisfyStep = (currentState, step) => {
        let next = {
          ...currentState,
          inventory: [...(currentState.inventory || [])],
          observations: [...(currentState.observations || [])],
          knownRecipes: [...(currentState.knownRecipes || [])],
          derivedAnswers: { ...(currentState.derivedAnswers || {}) },
          materialLog: [...(currentState.materialLog || [])],
          materialTestsCompleted: [...(currentState.materialTestsCompleted || [])],
        };

        if (step.requiredItem) {
          next.inventory = addUnique(next.inventory, step.requiredItem);
        }
        if (step.requiredRecipe) {
          next.inventory = addUnique(next.inventory, step.requiredRecipe);
          next.knownRecipes = addUnique(next.knownRecipes, step.requiredRecipe);
        }
        if (step.requiredObservation) {
          next.observations = addUnique(next.observations, step.requiredObservation);
        }

        // Template-backed material quests expect these player-derived facts.
        next.observations = addUnique(next.observations, 'volume_known');
        next.observations = addUnique(next.observations, 'masses_measured');
        next.observations = addUnique(next.observations, 'densities_calculated');
        next.materialLog = [
          { id: 'mesquite_wood', name: 'Mesquite wood', massGrams: 8.3, recordedAt: new Date().toISOString() },
          { id: 'copper', name: 'Copper', massGrams: 89, recordedAt: new Date().toISOString() },
          { id: 'steel', name: 'Steel', massGrams: 78, recordedAt: new Date().toISOString() },
        ];
        next.materialTestsCompleted = addUnique(next.materialTestsCompleted, 'load_test_completed');
        next.derivedAnswers = {
          ...next.derivedAnswers,
          lightestMaterial: 'mesquite',
          strongestMaterial: 'steel',
        };

        return next;
      };

      for (const questId of questIds) {
        if (state.activeQuest) {
          failures.push(`${questId}: previous quest left activeQuest=${state.activeQuest.id}`);
          break;
        }

        const started = questSystem.startQuest(state, questId);
        if (!started) {
          failures.push(`${questId}: startQuest returned null`);
          continue;
        }
        state = started;

        const quest = QUESTS[questId];
        for (let guard = 0; guard < quest.steps.length + 3; guard += 1) {
          const step = questSystem.getCurrentStep(state);
          if (!step) break;

          state = satisfyStep(state, step);

          let choiceIndex;
          if (step.type === 'quiz') {
            choiceIndex = step.choices?.findIndex((choice) => choice.correct);
            if (choiceIndex < 0) {
              failures.push(`${questId}/${step.id}: quiz has no correct choice`);
              break;
            }
          }

          const advanced = questSystem.advanceQuest(state, choiceIndex);
          state = advanced.state;
          if (!advanced.ok) {
            failures.push(`${questId}/${step.id}: ${advanced.message || 'advance failed'}`);
            break;
          }

          if (!state.activeQuest) break;
        }

        if (state.activeQuest?.id === questId) {
          failures.push(`${questId}: quest did not finish after ${quest.steps.length + 3} advances`);
          state = { ...state, activeQuest: null };
        }
      }

      window.__phaserGame.registry.set('gameState', state);
      return {
        questCount: questIds.length,
        completedCount: state.completedQuests.length,
        completedQuests: state.completedQuests,
        failures,
      };
    });

    expect(
      result.failures,
      `Full playthrough failures:\n${result.failures.join('\n')}`,
    ).toEqual([]);
    expect(result.completedCount).toBe(result.questCount);

    const relevantErrors = runtimeErrors.filter((message) =>
      !message.includes('UX audit service error'),
    );
    expect(relevantErrors).toEqual([]);
  });
});
