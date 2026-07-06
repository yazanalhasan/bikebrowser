import { quests } from '../data/quests.js';

export class QuestSystem {
  constructor(initialQuestId = 'bridge_dry_wash_intro') {
    this.quests = new Map(quests.map((quest) => [quest.id, quest]));
    this.questOrder = quests.map((quest) => quest.id);
    this.activeQuestId = initialQuestId;
    this.activeQuestIds = new Set([initialQuestId]);
    this.completedQuestIds = new Set();
    this.completedObjectives = new Set();
  }

  get activeQuest() {
    return this.quests.get(this.activeQuestId);
  }

  completeObjective(objectiveId) {
    const quest = this.findQuestForObjective(objectiveId);
    if (!quest) {
      return { ok: false, reason: 'unknown_objective' };
    }
    // A side quest (not in the `next` chain) activates the moment the player
    // makes progress on it, so it SHOWS UP in the tracker instead of completing
    // silently in the background.
    if (!this.activeQuestIds.has(quest.id) && !this.completedQuestIds.has(quest.id)) {
      this.activeQuestIds.add(quest.id);
    }
    // Track FIRST completion so rewards (ZuzuBucks, fanfare) fire once, not every
    // time a mini-game is replayed.
    const newObjective = !this.completedObjectives.has(objectiveId);
    const questAlreadyComplete = this.completedQuestIds.has(quest.id);
    this.completedObjectives.add(objectiveId);
    const completedQuest = this.maybeCompleteQuest(quest.id);
    const newQuest = completedQuest && !questAlreadyComplete ? completedQuest : null;
    return { ok: true, objectiveId, questId: quest.id, completedQuest, newObjective, newQuest };
  }

  findQuestForObjective(objectiveId) {
    for (const questId of this.activeQuestIds) {
      const quest = this.quests.get(questId);
      if (quest?.objectives.some((objective) => objective.id === objectiveId)) return quest;
    }
    for (const quest of this.quests.values()) {
      if (quest.objectives.some((objective) => objective.id === objectiveId)) return quest;
    }
    return null;
  }

  maybeCompleteQuest(questId) {
    const quest = this.quests.get(questId);
    if (!quest) return null;
    const done = quest.objectives.every((objective) => this.completedObjectives.has(objective.id));
    if (!done) return null;
    this.completedQuestIds.add(questId);
    if (quest.next) {
      this.activeQuestIds.add(quest.next);
      this.activeQuestId = quest.next;
    }
    return questId;
  }

  isObjectiveComplete(objectiveId) {
    return this.completedObjectives.has(objectiveId);
  }

  getSummary() {
    const quest = this.activeQuest;
    if (!quest) return { id: null, name: 'No active quest', objectives: [], sideQuests: [] };
    // Side quests = active, incomplete quests other than the current chain quest.
    // Surfaced so optional stories (Prediction Duel, Mariam's Garden) are visible
    // in the tracker rather than completing invisibly.
    const sideQuests = [...this.activeQuestIds]
      .filter((id) => id !== quest.id && !this.completedQuestIds.has(id))
      .map((id) => this.quests.get(id))
      .filter(Boolean)
      .map((side) => ({
        id: side.id,
        name: side.name,
        objectives: side.objectives.map((objective) => ({
          ...objective,
          complete: this.completedObjectives.has(objective.id),
        })),
      }));
    return {
      id: quest.id,
      name: quest.name,
      objectives: quest.objectives.map((objective) => ({
        ...objective,
        complete: this.completedObjectives.has(objective.id),
      })),
      sideQuests,
    };
  }

  getState() {
    return {
      activeQuestId: this.activeQuestId,
      activeQuestIds: [...this.activeQuestIds],
      completedQuestIds: [...this.completedQuestIds],
      completedObjectives: [...this.completedObjectives],
      quests: this.questOrder.map((id) => {
        const quest = this.quests.get(id);
        return {
          ...quest,
          active: this.activeQuestIds.has(id),
          complete: this.completedQuestIds.has(id),
          objectives: quest.objectives.map((objective) => ({
            ...objective,
            complete: this.completedObjectives.has(objective.id),
          })),
        };
      }),
    };
  }

  loadState(state = {}) {
    this.activeQuestId = state.activeQuestId || this.activeQuestId;
    this.activeQuestIds = new Set(state.activeQuestIds || [this.activeQuestId]);
    this.completedQuestIds = new Set(state.completedQuestIds || []);
    this.completedObjectives = new Set(state.completedObjectives || []);
  }
}
