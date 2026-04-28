import arizonaCognitiveQuests from './arizonaCognitiveQuests.js';

export const COGNITIVE_QUESTS = {
  ...arizonaCognitiveQuests,
};

export function getCognitiveQuest(id) {
  return COGNITIVE_QUESTS[id] || null;
}

export function getCognitiveQuestList() {
  return Object.values(COGNITIVE_QUESTS);
}
