export class TrustSystem {
  static carryForward = {
    environmentalPrimitives: ['relationship_context', 'community_need'],
    progressionPrimitives: ['trust_delta', 'trust_milestone'],
    actScalingPath: 'Trust remains a social access layer for mentors, shops, and regional collaboration.',
  };

  constructor() {
    this.trust = new Map([
      ['neighbor', 0],
      ['arabic_mentor', 0],
      ['garage_mentor', 1],
    ]);
    this.milestones = new Set();
  }

  addTrust(characterId, amount = 1, reason = 'helped') {
    const next = (this.trust.get(characterId) || 0) + amount;
    this.trust.set(characterId, next);
    if (next >= 1) this.milestones.add(`${characterId}_trust`);
    return { ok: true, characterId, trust: next, reason, milestone: next >= 1 ? `${characterId}_trust` : null };
  }

  hasTrust(characterId, threshold = 1) {
    return (this.trust.get(characterId) || 0) >= threshold;
  }

  getState() {
    return {
      trust: Object.fromEntries(this.trust),
      milestones: [...this.milestones],
    };
  }

  loadState(state = {}) {
    this.trust = new Map(Object.entries(state.trust || { neighbor: 0, arabic_mentor: 0, garage_mentor: 1 }));
    this.milestones = new Set(state.milestones || []);
  }
}
