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
    const score = Number(((material.strength + material.stiffness + (11 - material.weight)) / 3).toFixed(2));
    const brittle = material.curve.strainAtFailure <= 0.06;
    const deformation = Number(Math.max(0.05, material.curve.strainAtFailure * (11 - material.stiffness)).toFixed(2));
    const usefulness = material.bridgeUsefulness;
    const bridgeSafe = usefulness >= 0.55;
    const loadResult = bridgeSafe
      ? usefulness >= 0.85 ? 'carried full load' : 'carried partial load'
      : brittle ? 'cracked suddenly under load' : 'failed under load';
    const tactileCue = bridgeSafe
      ? brittle
        ? 'The sample carries the load, but the curve warns that failure would come suddenly.'
        : 'The sample flexes, then keeps carrying load with visible warning.'
      : material.id === 'concrete'
        ? 'The sample resists squeezing, but tension cracks open on the pulled side.'
        : 'The sample fails too early, which is useful evidence too.';
    if (!this.tested.has(materialId)) this.testOrder.push(materialId);
    const result = {
      materialId,
      displayName: material.displayName || material.name,
      name: material.name || material.displayName,
      score,
      testIndex: this.testOrder.indexOf(materialId) + 1,
      deformation,
      deformationBand: brittle ? 'brittle snap' : deformation >= 0.62 ? 'bends visibly' : 'holds shape',
      strengthBand: bridgeSafe ? usefulness >= 0.85 ? 'strong candidate' : 'useful with limits' : 'comparison failure',
      bridgeSafe,
      loadResult,
      verdict: bridgeSafe
        ? `Safe for bridge load - good for ${material.bestUse}.`
        : `Not safe for bridge load - ${material.failureMode}`,
      bridgeUsefulness: usefulness,
      tactileCue,
      comparisonCue: `${material.displayName || material.name}: ${material.bestUse}; ${tactileCue}`,
      explanation: material.childReadableDescription,
      bestUse: material.bestUse,
      strength: material.strength,
      stiffness: material.stiffness,
      weight: material.weight,
      failureMode: material.failureMode,
      curve: { ...material.curve },
      notes: { ...material.notes },
      curveLesson: this._curveLesson(material),
    };
    this.tested.set(materialId, result);
    return { ok: true, result };
  }

  _curveLesson(material) {
    const steep = material.stiffness >= 7 ? 'steep' : material.stiffness >= 4 ? 'moderate' : 'shallow';
    const strain = material.curve.strainAtFailure <= 0.06 ? 'short' : material.curve.strainAtFailure >= 0.18 ? 'long' : 'medium';
    if (material.id === 'concrete') return 'Concrete is high in compression but short in tension, so the curve drops after a small stretch.';
    return `The curve is ${steep} and ${strain}: stiffness, strength, and warning before failure are separate clues.`;
  }

  hasTested(materialId) {
    return this.tested.has(materialId);
  }

  getTest(materialId) {
    return this.tested.get(materialId) || null;
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
          curve: result.curve,
        })),
    };
  }

  loadState(state = {}) {
    this.tested = new Map((state.tested || []).map((result) => [result.materialId, result]));
    this.testOrder = (state.tested || []).map((result) => result.materialId);
  }
}
