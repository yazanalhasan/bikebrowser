import { getCurrentStep, getActiveQuest, advanceQuest } from './questSystem.js';
import { saveGame } from './saveSystem.js';
import { getExplainer } from '../data/explainers/index.js';
import { getCognitiveQuest } from '../data/cognitiveQuests/index.js';

const EXPLAINER_SCENE_KEY = 'ExplainerScene';
const COGNITIVE_SCENE_KEY = 'CognitiveQuestScene';

export function startInteractiveExplainer(scene, explainerId) {
  const explainer = getExplainer(explainerId);
  if (!scene || !explainer) return false;

  const returnSceneKey = scene.scene.key;
  scene.registry.set('dialogEvent', null);
  scene.scene.pause(returnSceneKey);
  scene.scene.launch(EXPLAINER_SCENE_KEY, {
    explainerId,
    returnSceneKey,
  });
  return true;
}

export function completeInteractiveExplainer(scene, data = {}) {
  const explainer = getExplainer(data.explainerId);
  let state = scene.registry.get('gameState');
  const currentStep = getCurrentStep(state);

  if (currentStep?.type === 'explainer' && currentStep.explainerId === data.explainerId) {
    const result = advanceQuest(state);
    if (result.ok) {
      state = result.state;
      scene.registry.set('gameState', state);
      saveGame(state);
    }
  }

  const returnSceneKey = data.returnSceneKey;
  scene.scene.stop(EXPLAINER_SCENE_KEY);
  if (returnSceneKey) {
    scene.scene.resume(returnSceneKey);
  }

  const nextStep = getCurrentStep(state);
  const completionDialog = nextStep ? {
    speaker: nextStep.type === 'quiz' ? 'Zuzu (thinking)' : explainer?.speaker || getActiveQuest(state)?.giver || 'Guide',
    text: nextStep.text,
    choices: nextStep.type === 'quiz' ? nextStep.choices : null,
    step: nextStep,
  } : null;

  if (explainer?.cognitiveQuestId && getCognitiveQuest(explainer.cognitiveQuestId) && returnSceneKey) {
    scene.scene.pause(returnSceneKey);
    scene.scene.launch(COGNITIVE_SCENE_KEY, {
      questId: explainer.cognitiveQuestId,
      returnSceneKey,
      completionDialog,
    });
    return state;
  }

  if (completionDialog) {
    scene.registry.set('dialogEvent', completionDialog);
  } else {
    scene.registry.set('dialogEvent', null);
  }

  return state;
}

export function cancelInteractiveExplainer(scene, data = {}) {
  const returnSceneKey = data.returnSceneKey;
  scene.scene.stop(EXPLAINER_SCENE_KEY);
  if (returnSceneKey) {
    scene.scene.resume(returnSceneKey);
  }
}
