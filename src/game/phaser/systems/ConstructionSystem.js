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
    return { ok: true, bridgeReconnected: true };
  }

  crossBridge() {
    if (!this.bridgeReconnected) return { ok: false, reason: 'bridge_not_repaired' };
    this.crossed = true;
    return { ok: true, crossed: true };
  }

  getState() {
    return {
      plan: this.plan,
      bridgeReconnected: this.bridgeReconnected,
      crossed: this.crossed,
    };
  }

  loadState(state = {}) {
    this.plan = state.plan || null;
    this.bridgeReconnected = Boolean(state.bridgeReconnected);
    this.crossed = Boolean(state.crossed);
  }
}
