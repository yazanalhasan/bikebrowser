export class ConstructionSystem {
  static carryForward = {
    environmentalPrimitives: ['span_distance', 'load_path', 'terrain_gap'],
    progressionPrimitives: ['plan_created', 'bridge_reconnected', 'route_unlocked'],
    actScalingPath: 'Bridge repair introduces rule-checked design before later simulations and larger vehicle frames.',
  };

  constructor(materialsLab) {
    this.materialsLab = materialsLab;
    this.plan = null;
    this.bridgeReconnected = false;
    this.crossed = false;
    this.repairMoment = null;
    this.crossingMoment = null;
  }

  completeBridgePlan(planId = 'tested_triangle_plan') {
    if (planId === 'weak_scrap_only') {
      return {
        ok: false,
        reason: 'weak_materials_fail',
        explanation: 'Weak scrap alone bends too much and does not create a trustworthy load path.',
      };
    }
    const requiredTests = ['mesquite', 'steel', 'copper_brace', 'weak_scrap'];
    const missingTests = requiredTests.filter((materialId) => !this.materialsLab.hasTested(materialId));
    if (missingTests.length) return { ok: false, reason: 'missing_tests', missingTests };
    this.plan = {
      id: planId,
      deck: 'mesquite',
      supports: 'steel',
      braces: 'copper_brace',
      rejects: ['weak_scrap'],
      lesson: 'A deck, supports, and triangular braces carry load better than weak scrap alone.',
      loadPath: ['deck', 'support', 'triangle_brace', 'ground'],
    };
    return { ok: true, plan: this.plan };
  }

  repairBridge() {
    if (!this.plan) return { ok: false, reason: 'missing_plan' };
    this.bridgeReconnected = true;
    this.repairMoment = {
      before: 'Broken planks and a washed-out gap made the path feel unsafe.',
      transition: ['fit tested deck', 'tighten triangle braces', 'settle support feet'],
      after: 'The new deck and braces make one clear safe crossing.',
      socialAcknowledgement: 'Mr. Chen nods: "You did not guess. You tested, then built."',
      childSummary: 'I fixed the crossing because my evidence made the plan safe.',
    };
    return { ok: true, bridgeReconnected: true, repairMoment: this.repairMoment };
  }

  crossBridge() {
    if (!this.bridgeReconnected) return { ok: false, reason: 'bridge_not_repaired' };
    this.crossed = true;
    this.crossingMoment = {
      witnessedBy: ['Zuzu', 'Mr. Chen'],
      feeling: 'The bike rolls across slowly, then the bridge stays steady.',
      unlockHint: 'A wider route can open because the crossing is safe again.',
    };
    return { ok: true, crossed: true, crossingMoment: this.crossingMoment };
  }

  getState() {
    return {
      plan: this.plan,
      bridgeReconnected: this.bridgeReconnected,
      crossed: this.crossed,
      repairMoment: this.repairMoment,
      crossingMoment: this.crossingMoment,
    };
  }

  loadState(state = {}) {
    this.plan = state.plan || null;
    this.bridgeReconnected = Boolean(state.bridgeReconnected);
    this.crossed = Boolean(state.crossed);
    this.repairMoment = state.repairMoment || null;
    this.crossingMoment = state.crossingMoment || null;
  }
}
