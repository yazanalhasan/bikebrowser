import { SKATEPARK_OBSTACLES, obstacleById } from '../../../data/act1/skateparkObstacles.js';

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
    return {
      obstacleCount: placed.length,
      catalogSize: this.catalog.length,
      avgDifficulty: Number(avgDifficulty.toFixed(2)),
      physicsComplexity: tags.size, // distinct physics/educational concepts present
      safety: null,                 // Phase 4 (community sim)
      creativity: null,             // Phase 4
      flowScore: null,              // Phase 3 (riding)
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
    };
  }
}
