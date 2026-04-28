import { saveGame } from './saveSystem.js';
import { getCognitiveQuest } from '../data/cognitiveQuests/index.js';
import {
  evaluateCognitiveQuest,
  shouldShowCognitiveHint,
  updateCognitiveProfile,
} from './cognitive/CognitiveEngine.js';

const COGNITIVE_SCENE_KEY = 'CognitiveQuestScene';

export function isMensaModeEnabled(state) {
  return !!state?.gameSettings?.mensaMode;
}

export function shouldShowHint(state, quest) {
  return shouldShowCognitiveHint(state, quest);
}

export function evaluateAnswer(questId, input) {
  return evaluateCognitiveQuest(questId, input);
}

export function startCognitiveQuest(scene, questId, options = {}) {
  const quest = getCognitiveQuest(questId);
  if (!scene || !quest) return false;

  const returnSceneKey = options.returnSceneKey || scene.scene.key;
  scene.registry.set('dialogEvent', null);
  scene.scene.pause(returnSceneKey);
  scene.scene.launch(COGNITIVE_SCENE_KEY, {
    questId,
    returnSceneKey,
    onComplete: options.onComplete || null,
  });
  return true;
}

export function recordCognitiveAnswer(scene, questId, optionId, correct) {
  const quest = getCognitiveQuest(questId);
  let state = scene.registry.get('gameState') || {};
  const attempts = state.cognitiveAnswers || [];
  state = updateCognitiveProfile(state, quest, correct);

  state = {
    ...state,
    cognitiveStats: {
      ...(state.cognitiveStats || {}),
      solved: state.cognitiveStats?.solved || 0,
      attempts: (state.cognitiveStats?.attempts || 0) + 1,
      byType: state.cognitiveStats?.byType || {},
    },
    cognitiveAnswers: [
      ...attempts.slice(-24),
      {
        questId,
        type: quest?.type || 'unknown',
        optionId,
        correct,
        answeredAt: new Date().toISOString(),
      },
    ],
  };
  scene.registry.set('gameState', state);
  saveGame(state);
  return state;
}

export function completeCognitiveQuest(scene, data = {}) {
  const quest = getCognitiveQuest(data.questId);
  let state = scene.registry.get('gameState') || {};
  const solved = new Set(state.solvedCognitiveQuests || []);

  if (quest && data.correct && !solved.has(quest.id)) {
    solved.add(quest.id);
    const reward = quest.reward || {};
    const rewards = quest.rewards || {};
    const bonus = isMensaModeEnabled(state) ? 2 : 1;
    const earnedBucks = (reward.zuzubucks ?? rewards.currency ?? 0) * bonus;
    const entry = `Solved reasoning puzzle: ${quest.title}${earnedBucks ? ` (+${earnedBucks} Zuzubucks)` : ''}.`;

    state = {
      ...state,
      solvedCognitiveQuests: [...solved],
      cognitiveStats: {
        solved: (state.cognitiveStats?.solved || 0) + 1,
        attempts: state.cognitiveStats?.attempts || 0,
        byType: {
          ...(state.cognitiveStats?.byType || {}),
          [quest.type]: ((state.cognitiveStats?.byType || {})[quest.type] || 0) + 1,
        },
      },
      zuzubucks: (state.zuzubucks || 0) + earnedBucks,
      cognitiveUnlocks: rewards.unlock
        ? Array.from(new Set([...(state.cognitiveUnlocks || []), rewards.unlock]))
        : (state.cognitiveUnlocks || []),
      journal: [...(state.journal || []), entry],
    };
    scene.registry.set('gameState', state);
    saveGame(state);
  }

  const returnSceneKey = data.returnSceneKey;
  scene.scene.stop(COGNITIVE_SCENE_KEY);
  if (returnSceneKey) scene.scene.resume(returnSceneKey);

  if (typeof data.onComplete === 'function') {
    data.onComplete({ scene, quest, state, correct: data.correct });
  }

  return state;
}

export function cancelCognitiveQuest(scene, data = {}) {
  const returnSceneKey = data.returnSceneKey;
  scene.scene.stop(COGNITIVE_SCENE_KEY);
  if (returnSceneKey) scene.scene.resume(returnSceneKey);
}
