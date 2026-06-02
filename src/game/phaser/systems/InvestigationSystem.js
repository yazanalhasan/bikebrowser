import { act1DryWash } from '../../data/act1/index.js';

// Phase 1.8 — Investigation loop for the Dry Wash region.
// Observation -> Hypothesis -> Investigation -> Evidence -> Conclusion.
// A player may pick a misleading hypothesis; the gathered evidence disproves it
// and the conclusion is the better explanation. `updatedFromMisleading` is the
// learning signal (started wrong, corrected by evidence).
export class InvestigationSystem {
  static carryForward = {
    environmentalPrimitives: ['observation', 'hypothesis', 'evidence', 'conclusion'],
    progressionPrimitives: ['mystery_observed', 'hypothesis_formed', 'mystery_concluded'],
    actScalingPath: 'The investigation loop generalizes from the dry wash to every later biome and biology mystery.',
  };

  constructor(data = act1DryWash) {
    this.data = data;
    this.investigations = new Map((data.investigations || []).map((inv) => [inv.id, inv]));
    this.progress = new Map();
  }

  _state(id) {
    if (!this.progress.has(id)) {
      this.progress.set(id, { observed: false, hypothesisId: null, evidence: [], concluded: false, updatedFromMisleading: false });
    }
    return this.progress.get(id);
  }

  observe(id) {
    const inv = this.investigations.get(id);
    if (!inv) return { ok: false, reason: 'unknown_investigation', id };
    const state = this._state(id);
    state.observed = true;
    return { ok: true, observation: inv.observation, hypotheses: inv.hypotheses, title: inv.title };
  }

  hypothesize(id, hypothesisId) {
    const inv = this.investigations.get(id);
    if (!inv) return { ok: false, reason: 'unknown_investigation', id };
    const state = this._state(id);
    if (!state.observed) return { ok: false, reason: 'observe_first' };
    const hypothesis = inv.hypotheses.find((h) => h.id === hypothesisId);
    if (!hypothesis) return { ok: false, reason: 'unknown_hypothesis', hypothesisId };
    state.hypothesisId = hypothesisId;
    return { ok: true, hypothesis, misleading: Boolean(hypothesis.misleading) };
  }

  investigate(id) {
    const inv = this.investigations.get(id);
    if (!inv) return { ok: false, reason: 'unknown_investigation', id };
    const state = this._state(id);
    if (!state.hypothesisId) return { ok: false, reason: 'hypothesize_first' };
    state.evidence = inv.evidence.map((e) => e.id);
    const disprovesHypothesis = inv.evidence.some((e) => e.disproves === state.hypothesisId);
    return { ok: true, evidence: inv.evidence, disprovesHypothesis };
  }

  conclude(id) {
    const inv = this.investigations.get(id);
    if (!inv) return { ok: false, reason: 'unknown_investigation', id };
    const state = this._state(id);
    if (!state.evidence.length) return { ok: false, reason: 'investigate_first' };
    const chosen = inv.hypotheses.find((h) => h.id === state.hypothesisId);
    state.concluded = true;
    state.updatedFromMisleading = Boolean(chosen && chosen.misleading);
    return {
      ok: true,
      conclusion: inv.conclusion,
      correctedFromMisleading: state.updatedFromMisleading,
      notebookEntry: inv.notebookEntry,
    };
  }

  getState() {
    const investigations = [...this.investigations.values()].map((inv) => {
      const state = this._state(inv.id);
      return {
        id: inv.id,
        kind: inv.kind,
        observed: state.observed,
        hypothesisId: state.hypothesisId,
        evidenceCount: state.evidence.length,
        concluded: state.concluded,
        updatedFromMisleading: state.updatedFromMisleading,
      };
    });
    return {
      region: this.data.region,
      investigations,
      concluded: investigations.filter((inv) => inv.concluded).length,
    };
  }

  loadState(state = {}) {
    this.progress = new Map(
      (state.investigations || [])
        .filter((inv) => inv && inv.id)
        .map((inv) => [inv.id, {
          observed: Boolean(inv.observed),
          hypothesisId: inv.hypothesisId || null,
          evidence: Array.isArray(inv.evidence) ? inv.evidence : (inv.evidenceCount ? this.investigations.get(inv.id)?.evidence.map((e) => e.id) || [] : []),
          concluded: Boolean(inv.concluded),
          updatedFromMisleading: Boolean(inv.updatedFromMisleading),
        }])
    );
  }
}
