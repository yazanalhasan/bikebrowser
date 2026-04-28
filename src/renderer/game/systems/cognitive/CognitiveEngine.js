import { getCognitiveQuest, getCognitiveQuestList } from '../../data/cognitiveQuests/index.js';
import DeductionHandler from './handlers/DeductionHandler.js';
import PatternHandler from './handlers/PatternHandler.js';
import SpatialHandler from './handlers/SpatialHandler.js';
import OptimizationHandler from './handlers/OptimizationHandler.js';
import SequenceHandler from './handlers/SequenceHandler.js';

export const COGNITIVE_SKILL_BY_TYPE = {
  deduction: 'logicSkill',
  pattern: 'patternSkill',
  spatial: 'spatialSkill',
  optimization: 'optimizationSkill',
  sequence: 'sequenceSkill',
};

const HANDLERS = {
  deduction: DeductionHandler,
  pattern: PatternHandler,
  spatial: SpatialHandler,
  optimization: OptimizationHandler,
  sequence: SequenceHandler,
};

export function getCognitiveHandler(type) {
  return HANDLERS[type] || DeductionHandler;
}

export function getDefaultCognitiveProfile() {
  return {
    patternSkill: 0.5,
    spatialSkill: 0.5,
    logicSkill: 0.5,
    optimizationSkill: 0.5,
    sequenceSkill: 0.5,
  };
}

export function getCognitiveProfile(state) {
  return {
    ...getDefaultCognitiveProfile(),
    ...(state?.cognitiveProfile || {}),
  };
}

export function evaluateCognitiveQuest(questId, input) {
  const quest = getCognitiveQuest(questId);
  if (!quest) return false;
  return getCognitiveHandler(quest.type).evaluate(quest, input);
}

export function adaptCognitiveDifficulty(state, quest) {
  const profile = getCognitiveProfile(state);
  const skillKey = COGNITIVE_SKILL_BY_TYPE[quest?.type] || 'logicSkill';
  const skill = profile[skillKey] ?? 0.5;
  const baseDifficulty = quest?.difficulty || 1;

  if (skill >= 0.75) return Math.min(5, baseDifficulty + 1);
  if (skill <= 0.3) return Math.max(1, baseDifficulty - 1);
  return baseDifficulty;
}

export function shouldShowCognitiveHint(state, quest) {
  if (state?.gameSettings?.mensaMode) return false;
  const profile = getCognitiveProfile(state);
  const skillKey = COGNITIVE_SKILL_BY_TYPE[quest?.type] || 'logicSkill';
  return (profile[skillKey] ?? 0.5) < 0.7;
}

export function updateCognitiveProfile(state, quest, correct) {
  const skillKey = COGNITIVE_SKILL_BY_TYPE[quest?.type] || 'logicSkill';
  const profile = getCognitiveProfile(state);
  const current = profile[skillKey] ?? 0.5;
  const delta = correct ? 0.05 : -0.04;

  return {
    ...state,
    cognitiveProfile: {
      ...profile,
      [skillKey]: Math.max(0, Math.min(1, Number((current + delta).toFixed(2)))),
    },
  };
}

export function getCognitiveQuestsForTrigger(sceneKey, trigger = {}) {
  return getCognitiveQuestList().filter((quest) => {
    if (quest.trigger?.scene !== sceneKey) return false;
    if (trigger.npc && quest.trigger?.npc !== trigger.npc) return false;
    if (trigger.object && quest.trigger?.object !== trigger.object) return false;
    return true;
  });
}

export default {
  getCognitiveHandler,
  getCognitiveProfile,
  evaluateCognitiveQuest,
  adaptCognitiveDifficulty,
  shouldShowCognitiveHint,
  updateCognitiveProfile,
  getCognitiveQuestsForTrigger,
};
