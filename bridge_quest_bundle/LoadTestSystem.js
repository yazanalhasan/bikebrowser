import { LOAD_SCENARIOS, StructuralModel } from './StructuralModel.js';

export class LoadTestSystem {
  static carryForward = {
    environmentalPrimitives: ['load_path', 'force_direction', 'material_limit'],
    progressionPrimitives: ['stress_visualized', 'load_test_passed', 'failure_predicted'],
    actScalingPath: 'Bridge load testing turns material evidence into readable stress simulations before later larger vehicles and storms.',
  };

  constructor({ structuralModel = new StructuralModel(), targetScenarioId = 'monsoon_flood' } = {}) {
    this.structuralModel = structuralModel;
    this.targetScenarioId = targetScenarioId;
    this.scenarioIndex = 0;
    this.history = [];
    this.lastResult = null;
    this.completed = false;
  }

  reset() {
    this.scenarioIndex = 0;
    this.history = [];
    this.lastResult = null;
    this.completed = false;
  }

  getScenario() {
    return LOAD_SCENARIOS[this.scenarioIndex] || LOAD_SCENARIOS[0];
  }

  runScenario(planOrSelection = {}, scenarioIdOrIndex = this.scenarioIndex) {
    const result = this.structuralModel.solve(planOrSelection, scenarioIdOrIndex);
    const targetPassed = result.ok && result.scenario.id === this.targetScenarioId;
    this.lastResult = {
      ...result,
      targetPassed,
      scenarioIndex: LOAD_SCENARIOS.findIndex((scenario) => scenario.id === result.scenario.id),
      nextScenarioId: this.nextScenarioId(result.scenario.id),
    };
    this.history.push(this.lastResult);
    this.history = this.history.slice(-LOAD_SCENARIOS.length);
    if (targetPassed) this.completed = true;
    return this.lastResult;
  }

  runCurrent(planOrSelection = {}) {
    return this.runScenario(planOrSelection, this.scenarioIndex);
  }

  advance() {
    this.scenarioIndex = Math.min(this.scenarioIndex + 1, LOAD_SCENARIOS.length - 1);
    return this.getScenario();
  }

  nextScenarioId(scenarioId) {
    const idx = LOAD_SCENARIOS.findIndex((scenario) => scenario.id === scenarioId);
    return LOAD_SCENARIOS[idx + 1]?.id || null;
  }

  runAll(planOrSelection = {}) {
    this.reset();
    for (let i = 0; i < LOAD_SCENARIOS.length; i += 1) {
      this.scenarioIndex = i;
      const result = this.runCurrent(planOrSelection);
      if (!result.ok) return { ok: false, failedAt: result.scenario.id, result, history: [...this.history] };
    }
    this.completed = true;
    return { ok: true, passedTarget: true, result: this.lastResult, history: [...this.history] };
  }

  loadState(state = {}) {
    const scenarioCount = LOAD_SCENARIOS.length;
    this.scenarioIndex = Number.isInteger(state.scenarioIndex)
      ? Math.max(0, Math.min(state.scenarioIndex, scenarioCount - 1))
      : 0;
    this.targetScenarioId = state.targetScenarioId || this.targetScenarioId;
    this.completed = Boolean(state.completed);
    this.lastResult = state.lastResult || null;
    this.history = Array.isArray(state.history) ? state.history.slice(-scenarioCount) : [];
  }
  getState() {
    return {
      scenarios: LOAD_SCENARIOS.map((scenario) => ({ ...scenario })),
      scenarioIndex: this.scenarioIndex,
      targetScenarioId: this.targetScenarioId,
      completed: this.completed,
      lastResult: this.lastResult,
      history: this.history,
    };
  }
}

