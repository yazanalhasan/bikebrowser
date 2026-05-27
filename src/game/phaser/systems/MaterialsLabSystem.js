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
  }

  testMaterial(materialId) {
    const material = this.materials.get(materialId);
    if (!material) return { ok: false, reason: 'unknown_material', materialId };
    const score = Number(((material.tensileStrength + material.compressiveStrength + material.elasticity - material.brittleness + material.bridgeUsefulness) / 5).toFixed(2));
    const result = {
      materialId,
      displayName: material.displayName,
      score,
      deformation: Number((1 - material.elasticity + material.brittleness).toFixed(2)),
      strengthBand: material.bridgeUsefulness >= 0.8 ? 'strong candidate' : material.bridgeUsefulness >= 0.55 ? 'useful with limits' : 'comparison failure',
      bridgeUsefulness: material.bridgeUsefulness,
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
    };
  }

  loadState(state = {}) {
    this.tested = new Map((state.tested || []).map((result) => [result.materialId, result]));
  }
}
