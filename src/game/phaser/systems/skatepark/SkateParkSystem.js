import { SKATEPARK_OBSTACLES, obstacleById } from '../../../data/act1/skateparkObstacles.js';
import { SKATEPARK_QUESTS } from '../../../data/act1/skateparkQuests.js';

// SkateParkSystem (Phase 2 — data/state only; no riding physics yet).
//
// Owns the obstacle catalog + the loaded park layout and computes park metrics.
// Per the Portability Principle (arc.md): this is a player-owned system that a scene
// *hosts*; its state does not depend on which scene mounts it. The future SkateScene
// (Phase 3) and any later BMX-park / track / testing-ground reuse this same system
// and the same data-driven layout format.
export class SkateParkSystem {
  static carryForward = {
    environmentalPrimitives: ['surface_friction', 'launch_angle', 'load_path'],
    progressionPrimitives: ['obstacle_placed', 'line_chained', 'flow_scored'],
    actScalingPath: 'The modular-obstacle + flow pattern generalizes from skate parks to BMX parks, motorcycle tracks, obstacle courses, and vehicle testing grounds — one layout system.',
  };

  constructor(materials = []) {
    this.materialsById = new Map((materials || []).map((m) => [m.id, m]));
    this.catalog = SKATEPARK_OBSTACLES;
    this.layout = null; // parsed park layout (instances); loaded when the park mounts
    this.level = 1;     // 1 = partially damaged … 5 = regional showcase
    this.quests = SKATEPARK_QUESTS.map((q) => ({ ...q, done: false }));
    this.bestFlow = 0;
    this.lastRun = null;
    this.runs = 0;
  }

  // The first not-yet-complete reasoning quest (Observe→Predict→Test→Explain).
  getActiveQuest() {
    return this.quests.find((q) => !q.done) || null;
  }

  completeQuest(id) {
    const q = this.quests.find((x) => x.id === id);
    if (q && !q.done) { q.done = true; return true; }
    return false;
  }

  // Compute a flow score (0..100) from a run: momentum preserved across the line.
  static flowFrom(run = {}) {
    const speedPart = Math.min(1, (run.avgSpeed ?? run.maxSpeed ?? 0) / 360) * 60;
    const progressPart = Math.min(1, (run.progress ?? 0)) * 25;
    const cleanPart = run.bails ? 0 : 15;
    const stylePart = Math.min(1, (run.style ?? 0) / 100) * 8;
    const comboPart = Math.min(7, (run.bestCombo ?? 0) * 1.5 + (run.grinds ?? 0) * 2);
    return Math.round(Math.min(100, speedPart + progressPart + cleanPart + stylePart + comboPart));
  }

  // Record a finished run: update flow + metrics, evaluate the reasoning quests.
  // Returns the ids completed by this run.
  recordRun(run = {}) {
    this.runs += 1;
    const flowScore = Number.isFinite(run.flowScore) ? run.flowScore : SkateParkSystem.flowFrom(run);
    const enriched = { ...run, flowScore };
    this.lastRun = enriched;
    this.bestFlow = Math.max(this.bestFlow, flowScore);
    const completed = [];
    for (const q of this.quests) {
      if (q.done) continue;
      if (this._questMet(q, enriched)) { q.done = true; completed.push(q.id); }
    }
    return { flowScore, completed };
  }

  _questMet(q, run) {
    if (q.type === 'optimization') return Boolean(run.reachedFlag) && (run.flowScore ?? 0) >= (q.target ?? 60);
    if (q.type === 'prediction') return Boolean(run.usedRamp) && Boolean(run.usedQuarter);
    if (q.type === 'experimental') return Boolean(run.rodeSteel) && Boolean(run.rodeConcrete);
    return false;
  }

  // Load an authored/player layout (data-driven; from public/layouts/skatepark.*.json).
  loadLayout(layout) {
    const ok = Boolean(layout && Array.isArray(layout.obstacles));
    this.layout = ok ? layout : null;
    if (ok && Number.isInteger(layout.level)) this.level = layout.level;
    return { ok, count: ok ? layout.obstacles.length : 0 };
  }

  // Resolve the obstacle defs currently placed in the layout (valid ids only).
  placedObstacles() {
    return (this.layout?.obstacles || [])
      .map((inst) => obstacleById(inst.obstacle))
      .filter(Boolean);
  }

  // Park metrics. Pre-layout, they describe the catalog so the system is queryable
  // before a park is mounted; with a layout, they describe the placed park.
  // flowScore is computed during riding (Phase 3) — null here, on purpose.
  metrics() {
    const placed = this.placedObstacles();
    const set = placed.length ? placed : this.catalog;
    const tags = new Set(set.flatMap((o) => o.educationalTags));
    const avgDifficulty = set.reduce((s, o) => s + o.difficulty, 0) / set.length;
    const types = new Set(set.map((o) => o.type));
    const count = placed.length || this.catalog.length;
    return {
      obstacleCount: placed.length,
      catalogSize: this.catalog.length,
      avgDifficulty: Number(avgDifficulty.toFixed(2)),
      physicsComplexity: tags.size, // distinct physics/educational concepts present
      // safety: easier parks are safer (inverse difficulty, 0..1)
      safety: Number((1 - (avgDifficulty - 1) / 4).toFixed(2)),
      // creativity: variety of obstacle TYPES present (0..1)
      creativity: Number((types.size / 5).toFixed(2)),
      // popularity: derived from flow + variety (NPCs like a park that flows and varies)
      popularity: Number(Math.min(1, this.bestFlow / 100 * 0.7 + types.size / 5 * 0.3).toFixed(2)),
      flowScore: this.lastRun?.flowScore ?? null,
      bestFlow: this.bestFlow,
      educationalTags: [...tags].sort(),
    };
  }

  getState() {
    return {
      level: this.level,
      layoutLoaded: Boolean(this.layout),
      condition: this.layout?.state || 'unmounted',
      obstacleCatalog: this.catalog.map((o) => ({
        id: o.id, type: o.type, material: o.material,
        surfaceFriction: o.surfaceFriction, difficulty: o.difficulty,
        educationalTags: o.educationalTags,
      })),
      placed: (this.layout?.obstacles || []).map((inst) => inst.obstacle),
      metrics: this.metrics(),
      bestFlow: this.bestFlow,
      runs: this.runs,
      lastRun: this.lastRun,
      quests: this.quests.map((q) => ({ id: q.id, type: q.type, level: q.level, title: q.title, done: q.done })),
      questsComplete: this.quests.filter((q) => q.done).length,
      activeQuest: this.getActiveQuest()?.id || null,
    };
  }
}
