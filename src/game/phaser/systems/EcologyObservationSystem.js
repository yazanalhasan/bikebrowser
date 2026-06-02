import { act1Ecology, act1EcologyPlacements } from '../../data/act1/index.js';

export class EcologyObservationSystem {
  static carryForward = {
    environmentalPrimitives: ['heat', 'water', 'shade', 'habitat_marker'],
    progressionPrimitives: ['species_observed', 'harvest_ethic_recorded', 'placement_predicted'],
    actScalingPath: 'Act 1 ecology observations become terrain constraints and life-support reasoning later.',
  };

  constructor(species = act1Ecology, placements = act1EcologyPlacements) {
    this.species = new Map(species.map((entry) => [entry.id, entry]));
    this.observed = new Set();
    // Phase 1.95 — ecology predict loop (observe -> predict -> outcome -> payoff).
    this.placements = new Map(placements.map((p) => [p.id, p]));
    this.placementProgress = new Map();
  }

  observe(speciesId) {
    const entry = this.species.get(speciesId);
    if (!entry) return { ok: false, reason: 'unknown_species', speciesId };
    this.observed.add(speciesId);
    return { ok: true, observation: entry };
  }

  _placementState(id) {
    if (!this.placementProgress.has(id)) {
      this.placementProgress.set(id, { observed: false, predictedId: null, resolved: false, matched: false });
    }
    return this.placementProgress.get(id);
  }

  _speciesName(id) {
    return this.species.get(id)?.displayName || id;
  }

  observePlacement(id) {
    const p = this.placements.get(id);
    if (!p) return { ok: false, reason: 'unknown_placement', id };
    const state = this._placementState(id);
    state.observed = true;
    return {
      ok: true,
      placement: {
        id: p.id,
        site: p.site,
        conditions: p.conditions,
        options: p.options.map((sp) => ({ id: sp, displayName: this._speciesName(sp) })),
      },
    };
  }

  predictPlacement(id, speciesId) {
    const p = this.placements.get(id);
    if (!p) return { ok: false, reason: 'unknown_placement', id };
    const state = this._placementState(id);
    if (!state.observed) return { ok: false, reason: 'observe_first' };
    if (!p.options.includes(speciesId)) return { ok: false, reason: 'not_an_option', speciesId };
    state.predictedId = speciesId;
    return { ok: true, predictedId: speciesId };
  }

  resolvePlacement(id) {
    const p = this.placements.get(id);
    if (!p) return { ok: false, reason: 'unknown_placement', id };
    const state = this._placementState(id);
    if (!state.predictedId) return { ok: false, reason: 'predict_first' };
    const matched = state.predictedId === p.correct;
    state.resolved = true;
    state.matched = matched;
    return {
      ok: true,
      thrives: matched,
      predictedId: state.predictedId,
      predictedName: this._speciesName(state.predictedId),
      correct: p.correct,
      correctName: this._speciesName(p.correct),
      // Being wrong still teaches: name the plant that fits and why.
      why: matched ? p.why : (p.wrongWhy?.[state.predictedId] || p.why),
      correctWhy: p.why,
      notebookEntry: p.notebookEntry,
    };
  }

  getState() {
    const placements = [...this.placements.values()].map((p) => {
      const s = this._placementState(p.id);
      return { id: p.id, observed: s.observed, predictedId: s.predictedId, resolved: s.resolved, matched: s.matched, correct: p.correct };
    });
    return {
      observed: [...this.observed],
      species: [...this.species.values()].map((entry) => ({
        ...entry,
        observed: this.observed.has(entry.id),
      })),
      placements,
      placementsResolved: placements.filter((s) => s.resolved).length,
      placementsMatched: placements.filter((s) => s.matched).length,
      placementCount: placements.length,
    };
  }

  loadState(state = {}) {
    this.observed = new Set(state.observed || []);
    this.placementProgress = new Map(
      (state.placements || [])
        .filter((p) => p && p.id)
        .map((p) => [p.id, {
          observed: Boolean(p.observed),
          predictedId: p.predictedId || null,
          resolved: Boolean(p.resolved),
          matched: Boolean(p.matched),
        }])
    );
  }
}
