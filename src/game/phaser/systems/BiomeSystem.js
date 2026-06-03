import { act1Biomes } from '../../data/act1/index.js';

// Phase 2.4 — Multi-Biome. Holds reachable biomes, each carrying an
// observe -> predict -> outcome -> payoff loop (the same shape as the ecology
// loop, themed to the biome). Gating (is the biome unlocked yet?) is enforced by
// the runtime; this system owns the per-placement progress.
export class BiomeSystem {
  static carryForward = {
    environmentalPrimitives: ['biome', 'site_rule', 'adaptation'],
    progressionPrimitives: ['biome_entered', 'biome_placement_resolved'],
    actScalingPath: 'Each later region/act adds a biome with new rules but the same observe->predict->outcome->payoff loop.',
  };

  constructor(biomes = act1Biomes) {
    this.biomes = new Map(biomes.map((b) => [b.id, b]));
    this.entered = new Set();
    this.progress = new Map(); // placementId -> { observed, predictedId, resolved, matched }
  }

  _state(placementId) {
    if (!this.progress.has(placementId)) {
      this.progress.set(placementId, { observed: false, predictedId: null, resolved: false, matched: false });
    }
    return this.progress.get(placementId);
  }

  _placement(biomeId, placementId) {
    return this.biomes.get(biomeId)?.placements.find((p) => p.id === placementId) || null;
  }

  enter(biomeId) {
    const biome = this.biomes.get(biomeId);
    if (!biome) return { ok: false, reason: 'unknown_biome', biomeId };
    this.entered.add(biomeId);
    return {
      ok: true,
      biome: {
        id: biome.id,
        name: biome.name,
        intro: biome.intro,
        placements: biome.placements.map((p) => p.id),
      },
    };
  }

  observe(biomeId, placementId) {
    const p = this._placement(biomeId, placementId);
    if (!p) return { ok: false, reason: 'unknown_placement', placementId };
    this._state(placementId).observed = true;
    return {
      ok: true,
      placement: { id: p.id, kind: p.kind, site: p.site, conditions: p.conditions, options: p.options.slice() },
    };
  }

  predict(biomeId, placementId, optionId) {
    const p = this._placement(biomeId, placementId);
    if (!p) return { ok: false, reason: 'unknown_placement', placementId };
    const state = this._state(placementId);
    if (!state.observed) return { ok: false, reason: 'observe_first' };
    if (!p.options.includes(optionId)) return { ok: false, reason: 'not_an_option', optionId };
    state.predictedId = optionId;
    return { ok: true, predictedId: optionId };
  }

  resolve(biomeId, placementId) {
    const p = this._placement(biomeId, placementId);
    if (!p) return { ok: false, reason: 'unknown_placement', placementId };
    const state = this._state(placementId);
    if (!state.predictedId) return { ok: false, reason: 'predict_first' };
    const matched = state.predictedId === p.correct;
    state.resolved = true;
    state.matched = matched;
    return {
      ok: true,
      thrives: matched,
      kind: p.kind,
      predictedId: state.predictedId,
      correct: p.correct,
      why: matched ? p.why : (p.wrongWhy?.[state.predictedId] || p.why),
      correctWhy: p.why,
      discovery: p.discovery || null,
      landmark: this.biomes.get(biomeId)?.landmark || null,
    };
  }

  getState() {
    const biomes = [...this.biomes.values()].map((b) => {
      const placements = b.placements.map((p) => {
        const s = this._state(p.id);
        return { id: p.id, kind: p.kind, observed: s.observed, predictedId: s.predictedId, resolved: s.resolved, matched: s.matched };
      });
      return {
        id: b.id,
        name: b.name,
        entered: this.entered.has(b.id),
        placements,
        resolved: placements.filter((p) => p.resolved).length,
        matched: placements.filter((p) => p.matched).length,
        count: placements.length,
        complete: placements.length > 0 && placements.every((p) => p.resolved),
      };
    });
    return { biomes, enteredCount: this.entered.size };
  }

  loadState(state = {}) {
    this.entered = new Set((state.biomes || []).filter((b) => b.entered).map((b) => b.id));
    this.progress = new Map();
    for (const b of state.biomes || []) {
      for (const p of b.placements || []) {
        if (!p || !p.id) continue;
        this.progress.set(p.id, {
          observed: Boolean(p.observed),
          predictedId: p.predictedId || null,
          resolved: Boolean(p.resolved),
          matched: Boolean(p.matched),
        });
      }
    }
  }
}
