import { act1MapRegions } from '../../data/act1/index.js';

export class DiscoveryMapSystem {
  static carryForward = {
    environmentalPrimitives: ['region_visibility', 'route_gate'],
    progressionPrimitives: ['region_discovered', 'gate_unlocked'],
    actScalingPath: 'Discovery state stays geographic only so knowledge and map reveal can scale independently.',
  };

  constructor(regions = act1MapRegions) {
    this.regions = regions;
    this.discovered = new Set(['home', 'garage', 'street']);
    this.newRegions = new Set();
    this.widerMapUnlocked = false;
  }

  discover(regionId) {
    if (!this.regions.includes(regionId)) return { ok: false, reason: 'unknown_region', regionId };
    const isNew = !this.discovered.has(regionId);
    this.discovered.add(regionId);
    if (isNew) this.newRegions.add(regionId);
    return { ok: true, regionId, isNew };
  }

  unlockWiderMap() {
    this.widerMapUnlocked = true;
    this.discover('wider_gate');
    return { ok: true, widerMapUnlocked: true };
  }

  getState() {
    return {
      discovered: [...this.discovered],
      newRegions: [...this.newRegions],
      widerMapUnlocked: this.widerMapUnlocked,
      regions: this.regions.map((id) => ({ id, discovered: this.discovered.has(id) })),
    };
  }

  loadState(state = {}) {
    this.discovered = new Set(state.discovered || ['home', 'garage', 'street']);
    this.newRegions = new Set(state.newRegions || []);
    this.widerMapUnlocked = Boolean(state.widerMapUnlocked);
  }
}
