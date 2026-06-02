import { act1Materials } from '../../data/act1/index.js';

export class MaterialsLabSystem {
  static carryForward = {
    environmentalPrimitives: ['material_property', 'load_constraint'],
    progressionPrimitives: ['material_tested', 'evidence_result_recorded'],
    actScalingPath: 'The UTM pattern generalizes from bridge materials to terrain, chemistry, and spacecraft design tests.',
  };

  constructor(materials = act1Materials) {
    this.materials = new Map(materials.map((material) => [material.id, material]));
    this.tested = new Map();
    this.testOrder = [];
  }

  testMaterial(materialId) {
    const material = this.materials.get(materialId);
    if (!material) return { ok: false, reason: 'unknown_material', materialId };
    const score = Number(((material.tensileStrength + material.compressiveStrength + material.elasticity - material.brittleness + material.bridgeUsefulness) / 5).toFixed(2));
    const deformation = Number((1 - material.elasticity + material.brittleness).toFixed(2));
    const usefulness = material.bridgeUsefulness;
    const tactileCue = usefulness >= 0.8
      ? 'The sample flexes slightly, then holds its shape under the press.'
      : usefulness >= 0.55
        ? 'The sample bends enough to notice, so Zuzu marks it as useful with limits.'
        : 'The sample twists and fails early, which is useful evidence too.';
    if (!this.tested.has(materialId)) this.testOrder.push(materialId);
    const result = {
      materialId,
      displayName: material.displayName,
      score,
      testIndex: this.testOrder.indexOf(materialId) + 1,
      deformation,
      deformationBand: deformation >= 1 ? 'fails visibly' : deformation >= 0.62 ? 'bends visibly' : 'holds shape',
      strengthBand: usefulness >= 0.8 ? 'strong candidate' : usefulness >= 0.55 ? 'useful with limits' : 'comparison failure',
      // Explicit engineering verdict (Phase 1.2): the player can see a poor
      // material fail the load test and a good one pass — real differentiated
      // outcomes, the evidence later phases (predict, bridge) build on.
      bridgeSafe: usefulness >= 0.5 && deformation < 1,
      loadResult: deformation >= 1 ? 'failed under load' : usefulness >= 0.8 ? 'carried full load' : 'carried partial load',
      verdict: (usefulness >= 0.5 && deformation < 1)
        ? `Safe for bridge load — good for ${material.bestUse}.`
        : 'Not safe for bridge load — it bends and cracks too early.',
      bridgeUsefulness: usefulness,
      tactileCue,
      comparisonCue: `${material.displayName}: ${material.bestUse}; ${tactileCue}`,
      explanation: material.childReadableDescription,
      bestUse: material.bestUse,
    };
    this.tested.set(materialId, result);
    return { ok: true, result };
  }

  hasTested(materialId) {
    return this.tested.has(materialId);
  }

  getState() {
    return {
      tested: [...this.tested.values()],
      materials: [...this.materials.values()],
      tactileSummary: this.testOrder
        .map((materialId) => this.tested.get(materialId))
        .filter(Boolean)
        .map((result) => ({
          materialId: result.materialId,
          displayName: result.displayName,
          deformationBand: result.deformationBand,
          strengthBand: result.strengthBand,
          bestUse: result.bestUse,
        })),
    };
  }

  loadState(state = {}) {
    this.tested = new Map((state.tested || []).map((result) => [result.materialId, result]));
    this.testOrder = (state.tested || []).map((result) => result.materialId);
  }
}
