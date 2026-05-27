export class LanguageSystem {
  static carryForward = {
    environmentalPrimitives: ['speaker_relationship', 'conversation_context'],
    progressionPrimitives: ['phrase_heard', 'contextual_language_trust'],
    actScalingPath: 'Language remains contextual and relationship-based as the map expands.',
  };

  constructor() {
    this.interactions = new Map();
  }

  record(interactionId, payload = {}) {
    const entry = {
      id: interactionId,
      language: payload.language || interactionId.split('_')[0],
      speaker: payload.speaker || 'neighbor',
      phrase: payload.phrase || '',
      translation: payload.translation || '',
      context: payload.context || 'relationship',
    };
    this.interactions.set(interactionId, entry);
    return { ok: true, entry };
  }

  getState() {
    return { interactions: [...this.interactions.values()] };
  }

  loadState(state = {}) {
    this.interactions = new Map((state.interactions || []).map((entry) => [entry.id, entry]));
  }
}
