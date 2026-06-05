import { act1Materials } from '../../data/act1/index.js';

export const LOAD_SCENARIOS = [
  { id: 'person', label: 'person', load: 2.8, lateral: 0, buoyant: 0 },
  { id: 'handcart', label: 'handcart', load: 4.4, lateral: 0.2, buoyant: 0 },
  { id: 'wagon', label: 'loaded wagon', load: 6.1, lateral: 0.35, buoyant: 0 },
  { id: 'herd', label: 'herd', load: 7.4, lateral: 0.65, buoyant: 0 },
  { id: 'monsoon_flood', label: 'monsoon flood', load: 7.8, lateral: 2.2, buoyant: 1.2 },
];

export const STRESS_COLORS = {
  green: 0x4fca64,
  yellow: 0xf1c84b,
  red: 0xe45757,
  failed: 0xff3030,
};

const DEFAULT_SELECTION = {
  deck: 'bamboo',
  support: 'steel',
  brace: 'carbon_fiber',
};

const MEMBER_TEMPLATES = [
  { id: 'deck_left', role: 'deck', label: 'left deck', forceType: 'tension', x1: -150, y1: 0, x2: 0, y2: 0, loadFactor: 0.58, deflectionFactor: 1.05 },
  { id: 'deck_right', role: 'deck', label: 'right deck', forceType: 'tension', x1: 0, y1: 0, x2: 150, y2: 0, loadFactor: 0.58, deflectionFactor: 1.05 },
  { id: 'support_left', role: 'support', label: 'left support', forceType: 'compression', x1: -112, y1: 0, x2: -112, y2: 82, loadFactor: 0.62, deflectionFactor: 0.4 },
  { id: 'support_right', role: 'support', label: 'right support', forceType: 'compression', x1: 112, y1: 0, x2: 112, y2: 82, loadFactor: 0.62, deflectionFactor: 0.4 },
  { id: 'brace_left', role: 'brace', label: 'left tension brace', forceType: 'tension', x1: -112, y1: 78, x2: 0, y2: 0, loadFactor: 0.82, lateralFactor: 0.55, deflectionFactor: 0.72 },
  { id: 'brace_right', role: 'brace', label: 'right compression brace', forceType: 'compression', x1: 112, y1: 78, x2: 0, y2: 0, loadFactor: 0.74, lateralFactor: 0.9, deflectionFactor: 0.62 },
  { id: 'cross_tie', role: 'brace', label: 'lower tension tie', forceType: 'tension', x1: -112, y1: 78, x2: 112, y2: 78, loadFactor: 0.5, lateralFactor: 0.75, deflectionFactor: 0.5 },
];

function normalizeSelection(planOrSelection = {}) {
  const source = planOrSelection.plan || planOrSelection || {};
  return {
    deck: source.deck || DEFAULT_SELECTION.deck,
    support: source.support || source.supports || DEFAULT_SELECTION.support,
    brace: source.brace || source.braces || DEFAULT_SELECTION.brace,
  };
}

function capacityFor(material, forceType) {
  const explicit = forceType === 'compression'
    ? material.compressionStrength ?? material.compressiveStrength
    : material.tensionStrength ?? material.tensileStrength;
  if (explicit == null) return material.strength || 1;
  return explicit <= 1 ? explicit * 10 : explicit;
}

function stressZone(stressRatio) {
  if (stressRatio >= 1) return 'failed';
  if (stressRatio >= 0.9) return 'red';
  if (stressRatio >= 0.6) return 'yellow';
  return 'green';
}

function failureStyle(failureMode = '') {
  const lower = failureMode.toLowerCase();
  if (lower.includes('buckle') || lower.includes('crush')) return 'buckling';
  if (lower.includes('yield') || lower.includes('bend') || lower.includes('flex')) return 'ductile';
  return 'brittle';
}

export class StructuralModel {
  constructor(materials = act1Materials) {
    this.materials = new Map(materials.map((material) => [material.id, material]));
  }

  getScenario(idOrIndex = 0) {
    if (typeof idOrIndex === 'number') return LOAD_SCENARIOS[idOrIndex] || LOAD_SCENARIOS[0];
    return LOAD_SCENARIOS.find((scenario) => scenario.id === idOrIndex) || LOAD_SCENARIOS[0];
  }

  createMembers(planOrSelection = {}) {
    const selection = normalizeSelection(planOrSelection);
    return MEMBER_TEMPLATES.map((template) => {
      const materialId = selection[template.role] || DEFAULT_SELECTION[template.role];
      const material = this.materials.get(materialId) || this.materials.get(DEFAULT_SELECTION[template.role]);
      return {
        ...template,
        materialId,
        materialName: material?.displayName || material?.name || materialId,
        material,
      };
    });
  }

  solve(planOrSelection = {}, scenarioIdOrIndex = 0) {
    const scenario = this.getScenario(scenarioIdOrIndex);
    const members = this.createMembers(planOrSelection).map((member) => this.solveMember(member, scenario));
    const failed = members.filter((member) => member.failed).sort((a, b) => b.stressRatio - a.stressRatio);
    const maxStress = members.reduce((max, member) => Math.max(max, member.stressRatio), 0);
    return {
      ok: failed.length === 0,
      verdict: failed.length ? 'fail' : 'hold',
      scenario,
      scenarioId: scenario.id,
      members,
      failed,
      failedMember: failed[0] || null,
      maxStress,
      teachingMoment: this.compareConcreteVsSteelTension(planOrSelection, scenario.id),
    };
  }

  solveMember(member, scenario) {
    const material = member.material;
    const lateralForce = (scenario.lateral || 0) * (member.lateralFactor || 0);
    const floodForce = scenario.id === 'monsoon_flood' && member.role !== 'deck' ? (scenario.buoyant || 0) * 0.35 : 0;
    const selfWeight = (material.weight || 1) * 0.08;
    const axialForce = Number((scenario.load * member.loadFactor + lateralForce + floodForce + selfWeight).toFixed(2));
    const capacity = Number(Math.max(0.1, capacityFor(material, member.forceType)).toFixed(2));
    const rawStress = axialForce / capacity;
    const stressRatio = Number(rawStress.toFixed(3));
    const zone = stressZone(stressRatio);
    const stiffness = Math.max(1, material.stiffness || 1);
    const deflection = Number((((scenario.load + lateralForce + floodForce) * member.deflectionFactor) / stiffness).toFixed(2));
    return {
      ...member,
      axialForce,
      capacity,
      stressRatio,
      clampedStressRatio: Number(Math.min(1, rawStress).toFixed(3)),
      zone,
      color: STRESS_COLORS[zone],
      arrow: member.forceType === 'compression' ? '→←' : '←→',
      deflection,
      failed: stressRatio >= 1,
      failureMode: material.failureMode,
      failureStyle: failureStyle(material.failureMode),
      notes: material.notes,
    };
  }

  compareConcreteVsSteelTension(planOrSelection = {}, scenarioIdOrIndex = 0) {
    const scenario = this.getScenario(scenarioIdOrIndex);
    const template = MEMBER_TEMPLATES.find((member) => member.id === 'brace_left');
    const concrete = this.solveMember({
      ...template,
      materialId: 'concrete',
      materialName: 'Concrete',
      material: this.materials.get('concrete'),
    }, scenario);
    const steel = this.solveMember({
      ...template,
      materialId: 'steel',
      materialName: 'Steel',
      material: this.materials.get('steel'),
    }, scenario);
    return {
      scenarioId: scenario.id,
      activeBraceMaterial: normalizeSelection(planOrSelection).brace,
      memberId: template.id,
      concreteFails: concrete.failed,
      steelHolds: !steel.failed,
      concrete,
      steel,
      summary: concrete.failed && !steel.failed
        ? 'Concrete cracks in a tension brace where steel holds the same pull.'
        : 'Tension members need a material with enough pull strength.',
    };
  }
}

