import { act1Ecology } from '../../data/act1/index.js';

export class EcologyObservationSystem {
  static carryForward = {
    environmentalPrimitives: ['heat', 'water', 'shade', 'habitat_marker'],
    progressionPrimitives: ['species_observed', 'harvest_ethic_recorded'],
    actScalingPath: 'Act 1 ecology observations become terrain constraints and life-support reasoning later.',
  };

  constructor(species = act1Ecology) {
    this.species = new Map(species.map((entry) => [entry.id, entry]));
    this.observed = new Set();
  }

  observe(speciesId) {
    const entry = this.species.get(speciesId);
    if (!entry) return { ok: false, reason: 'unknown_species', speciesId };
    this.observed.add(speciesId);
    return { ok: true, observation: entry };
  }

  getState() {
    return {
      observed: [...this.observed],
      species: [...this.species.values()].map((entry) => ({
        ...entry,
        observed: this.observed.has(entry.id),
      })),
    };
  }

  loadState(state = {}) {
    this.observed = new Set(state.observed || []);
  }
}
