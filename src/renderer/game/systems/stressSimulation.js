/**
 * Stress Simulation — real-time segment-based structural simulation.
 *
 * Runs continuously for vehicles, bridges, structures, and machines.
 * Each structural object is modeled as connected segments with loads
 * distributed across them. Every tick computes stress, strain, fatigue,
 * vibration, and thermal effects — then emits events when thresholds
 * are crossed.
 *
 * This is the simulation backbone that feeds:
 *   - inspectorSystem.js (live metrics for UI)
 *   - failureAssistant.js (cause analysis and advice)
 *
 * Performance: LOD-based — close objects get full sim, far objects sleep.
 *
 * Pure functions for core math. State management for the simulation loop.
 */

import { MATERIAL_MAP } from '../data/materials.js';
import {
  computeStress, computeStrain, computeFatigue, computeThermalStress,
  computeIntegrityLoss, computeVibration, computeDeformation, stressConcentration,
} from '../utils/materialMath.js';
import { classifyFailureState } from '../utils/failureMath.js';

// ── Structural Segment Model ─────────────────────────────────────────────────

/**
 * Create a structural segment for simulation.
 *
 * @param {object} config
 * @returns {object} segment
 */
export function createSegment(config) {
  const mat = MATERIAL_MAP[config.material] || {};
  return {
    id: config.id,
    label: config.label || config.id,
    material: config.material,
    role: config.role || 'frame',
    length: config.length || 1,
    crossSection: config.crossSection || 0.5,
    supportFactor: config.supportFactor || 0.5,
    constraintFactor: config.constraintFactor || 0.5,
    connections: config.connections || [],
    // Material properties (cached from database)
    matProps: {
      strength: mat.structural?.strength || 0.5,
      elasticity: mat.structural?.elasticity || 0.5,
      fracturePoint: mat.structural?.fracturePoint || 0.5,
      fatigueResistance: mat.structural?.fatigueResistance || 0.5,
      density: mat.physical?.density || 0.5,
      thermalExpansion: mat.thermal?.expansion || 0.3,
      meltingPoint: mat.thermal?.meltingPoint || 0.5,
      damping: mat.structural?.elasticity * 0.3 || 0.1,
    },
    // Dynamic state (updated every tick)
    state: {
      integrity: config.integrity || 1,
      stress: 0,
      strain: 0,
      fatigue: config.fatigue || 0,
      deformation: 0,
      vibration: 0,
      temperature: config.temperature || 0.3,
      thermalStress: 0,
      bondStress: 0,
      contamination: 0,
      coatingCoverage: config.coatingCoverage || 0,
      failureState: 'stable',
    },
    // History for graphs (ring buffer, last 60 ticks)
    history: [],
    maxHistory: 60,
  };
}

// ── Structural Object ────────────────────────────────────────────────────────

/**
 * Create a complete structural object from segments.
 *
 * @param {object} config
 * @returns {object} structural object for simulation
 */
export function createStructuralObject(config) {
  return {
    id: config.id,
    name: config.name,
    category: config.category || 'structure',
    segments: (config.segments || []).map(createSegment),
    loads: config.loads || [],
    environment: config.environment || {
      ambientTemperature: 0.3,
      wind: 0,
      fluidType: 'dry',
      uvExposure: 0.3,
      surfaceType: 'ground',
    },
    // Simulation LOD
    lodLevel: config.lodLevel || 'full', // 'full' | 'medium' | 'coarse' | 'sleeping'
    lastTick: 0,
    tickCount: 0,
    // Event log
    events: [],
    maxEvents: 50,
  };
}

// ── Load Types ───────────────────────────────────────────────────────────────

/**
 * Create a load definition.
 */
export function createLoad(config) {
  return {
    id: config.id || `load_${Date.now()}`,
    type: config.type || 'static', // 'static' | 'dynamic' | 'thermal' | 'chemical'
    source: config.source || 'gravity',
    force: config.force || 0,
    targetSegments: config.targetSegments || [], // empty = distribute to all
    frequency: config.frequency || 0, // for periodic/vibration loads
    duration: config.duration || Infinity, // how long this load persists
    startTime: config.startTime || 0,
  };
}

// ── Simulation Tick ──────────────────────────────────────────────────────────

/**
 * Run one simulation tick on a structural object.
 * This is the core loop that updates all segments.
 *
 * @param {object} obj - structural object
 * @param {number} deltaSec - time since last tick
 * @param {number} now - current timestamp
 * @returns {{ obj, events }} - updated object + new events this tick
 */
export function tickSimulation(obj, deltaSec, now) {
  // LOD: skip or reduce tick rate based on distance/importance
  const tickInterval = {
    full: 0,      // every frame
    medium: 0.5,  // twice per second
    coarse: 2,    // every 2 seconds
    sleeping: -1, // skip entirely
  }[obj.lodLevel] || 0;

  if (tickInterval < 0) return { obj, events: [] };
  if (tickInterval > 0 && now - obj.lastTick < tickInterval * 1000) {
    return { obj, events: [] };
  }

  const newEvents = [];
  const segments = obj.segments.map((seg) => ({ ...seg, state: { ...seg.state } }));

  // 1. Gather and distribute loads
  const loadMap = distributeLoads(obj.loads, segments, now);

  // 2. Process each segment
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const totalLoad = loadMap[seg.id] || 0;
    const mp = seg.matProps;

    // ── Stress computation ──
    const concentrationFactor = stressConcentration(
      1 - (seg.state.bondStress || 0), // bond quality = 1 - bondStress
      seg.connections.length > 2 ? 0.3 : 0.1
    );
    const rawStress = computeStress(totalLoad, seg.crossSection);
    seg.state.stress = rawStress * concentrationFactor;

    // ── Strain ──
    seg.state.strain = computeStrain(seg.state.stress, mp.elasticity);

    // ── Deformation ──
    seg.state.deformation = computeDeformation(seg.state.strain, seg.length);

    // ── Thermal stress ──
    const deltaTemp = Math.abs(seg.state.temperature - obj.environment.ambientTemperature);
    seg.state.thermalStress = computeThermalStress(
      mp.thermalExpansion, deltaTemp, seg.constraintFactor, mp.elasticity
    );
    seg.state.stress += seg.state.thermalStress;

    // ── Temperature update from environment + loads ──
    const heatLoads = obj.loads.filter((l) => l.type === 'thermal');
    for (const hl of heatLoads) {
      if (hl.targetSegments.length === 0 || hl.targetSegments.includes(seg.id)) {
        seg.state.temperature = Math.min(1, seg.state.temperature + hl.force * deltaSec * 0.1);
      }
    }
    // Ambient temperature drift
    seg.state.temperature += (obj.environment.ambientTemperature - seg.state.temperature) * 0.01 * deltaSec;

    // ── Vibration ──
    const vibrationLoads = obj.loads.filter((l) => l.source === 'vibration' || l.source === 'engine' || l.source === 'terrain');
    let maxVibration = 0;
    for (const vl of vibrationLoads) {
      const naturalFreq = 0.5 + (1 - mp.density) * 0.5; // lighter = higher freq
      const freqRatio = vl.frequency > 0 ? vl.frequency / naturalFreq : 0;
      const vib = computeVibration(vl.force, freqRatio, mp.damping);
      maxVibration = Math.max(maxVibration, vib);
    }
    seg.state.vibration = maxVibration;

    // ── Fatigue ──
    const cyclicStress = seg.state.vibration * seg.state.stress;
    const cycles = deltaSec * (maxVibration > 0.1 ? 2 : 0.1);
    seg.state.fatigue = computeFatigue(seg.state.fatigue, cyclicStress, cycles, mp);

    // ── Integrity loss ──
    const stressRatio = seg.state.stress / Math.max(0.01, mp.strength);
    const tempRatio = seg.state.temperature / Math.max(0.01, mp.meltingPoint);
    const loss = computeIntegrityLoss(stressRatio, seg.state.fatigue, tempRatio);
    seg.state.integrity = Math.max(0, seg.state.integrity - loss * deltaSec);

    // ── Classify failure state ──
    const prevState = seg.state.failureState;
    const classification = classifyFailureState(seg.state);
    seg.state.failureState = classification.id;

    // ── Emit events on state changes ──
    if (classification.id !== prevState && classification.severity > 0) {
      const event = {
        entityId: obj.id,
        componentId: seg.id,
        componentLabel: seg.label,
        timestamp: now,
        severity: classification.severity,
        type: classification.id,
        causeType: _inferCause(seg.state),
        icon: classification.icon,
        metricsSnapshot: { ...seg.state },
        message: `${seg.label}: ${classification.label}`,
      };
      newEvents.push(event);
    }

    // Specific threshold events
    if (seg.state.stress > 0.7 && rawStress <= 0.7) {
      newEvents.push(_makeEvent(obj, seg, 'STRESS_HIGH', 0.5, 'Stress approaching material limit', now));
    }
    if (seg.state.stress > 0.9) {
      newEvents.push(_makeEvent(obj, seg, 'STRESS_CRITICAL', 0.8, 'Stress critical — failure imminent', now));
    }
    if (seg.state.fatigue > 0.6 && seg.state.fatigue - computeFatigue(0, cyclicStress, cycles, mp) < 0.6) {
      newEvents.push(_makeEvent(obj, seg, 'FATIGUE_RISING', 0.4, 'Fatigue damage accumulating', now));
    }
    if (seg.state.vibration > 1.0) {
      newEvents.push(_makeEvent(obj, seg, 'RESONANCE_RISK', 0.7, 'Near resonance — vibration amplifying', now));
    }
    if (seg.state.integrity <= 0) {
      newEvents.push(_makeEvent(obj, seg, 'COMPONENT_FAILED', 1.0, `${seg.label} failed catastrophically`, now));
    }

    // ── Record history ──
    seg.history.push({
      t: now,
      stress: r(seg.state.stress),
      strain: r(seg.state.strain),
      fatigue: r(seg.state.fatigue),
      vibration: r(seg.state.vibration),
      temperature: r(seg.state.temperature),
      integrity: r(seg.state.integrity),
    });
    if (seg.history.length > seg.maxHistory) seg.history.shift();
  }

  // Update object
  const updated = {
    ...obj,
    segments,
    lastTick: now,
    tickCount: obj.tickCount + 1,
    events: [...obj.events, ...newEvents].slice(-obj.maxEvents),
  };

  return { obj: updated, events: newEvents };
}

// ── Load Distribution ────────────────────────────────────────────────────────

function distributeLoads(loads, segments, now) {
  const loadMap = {};
  for (const seg of segments) {
    loadMap[seg.id] = 0;
  }

  for (const load of loads) {
    // Skip expired loads
    if (load.duration !== Infinity && now - load.startTime > load.duration * 1000) continue;

    if (load.targetSegments.length > 0) {
      // Distribute to specific segments
      const share = load.force / load.targetSegments.length;
      for (const segId of load.targetSegments) {
        if (loadMap[segId] !== undefined) {
          loadMap[segId] += share;
        }
      }
    } else {
      // Distribute to all segments weighted by support factor
      const totalSupport = segments.reduce((s, seg) => s + seg.supportFactor, 0) || 1;
      for (const seg of segments) {
        loadMap[seg.id] += load.force * (seg.supportFactor / totalSupport);
      }
    }
  }

  // Add self-weight
  for (const seg of segments) {
    loadMap[seg.id] += seg.matProps.density * seg.length * 0.1;
  }

  return loadMap;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _inferCause(state) {
  if (state.stress > 0.8) return 'overload';
  if (state.fatigue > 0.7) return 'fatigue';
  if (state.vibration > 1.0) return 'resonance';
  if (state.temperature > 0.8) return 'thermal';
  if (state.thermalStress > 0.5) return 'thermal_mismatch';
  if (state.bondStress > 0.6) return 'bond_failure';
  return 'combined';
}

function _makeEvent(obj, seg, type, severity, message, now) {
  return {
    entityId: obj.id,
    componentId: seg.id,
    componentLabel: seg.label,
    timestamp: now,
    severity,
    type,
    causeType: _inferCause(seg.state),
    icon: severity > 0.7 ? '🔴' : severity > 0.4 ? '🟡' : '🟢',
    metricsSnapshot: { ...seg.state },
    message,
  };
}

function r(v) { return Math.round(v * 1000) / 1000; }

// ── Object Queries ───────────────────────────────────────────────────────────

/**
 * Get the weakest segment in an object.
 */
export function getWeakestSegment(obj) {
  let weakest = null;
  for (const seg of obj.segments) {
    if (!weakest || seg.state.integrity < weakest.state.integrity) {
      weakest = seg;
    }
  }
  return weakest;
}

/**
 * Get the most stressed segment.
 */
export function getMostStressedSegment(obj) {
  let worst = null;
  for (const seg of obj.segments) {
    if (!worst || seg.state.stress > worst.state.stress) {
      worst = seg;
    }
  }
  return worst;
}

/**
 * Get aggregate metrics for the whole object.
 */
export function getObjectMetrics(obj) {
  if (obj.segments.length === 0) {
    return { avgStress: 0, maxStress: 0, minIntegrity: 1, avgFatigue: 0, maxVibration: 0, avgTemperature: 0 };
  }

  let totalStress = 0, maxStress = 0, minIntegrity = 1;
  let totalFatigue = 0, maxVibration = 0, totalTemp = 0;

  for (const seg of obj.segments) {
    totalStress += seg.state.stress;
    maxStress = Math.max(maxStress, seg.state.stress);
    minIntegrity = Math.min(minIntegrity, seg.state.integrity);
    totalFatigue += seg.state.fatigue;
    maxVibration = Math.max(maxVibration, seg.state.vibration);
    totalTemp += seg.state.temperature;
  }

  const n = obj.segments.length;
  return {
    avgStress: r(totalStress / n),
    maxStress: r(maxStress),
    minIntegrity: r(minIntegrity),
    avgFatigue: r(totalFatigue / n),
    maxVibration: r(maxVibration),
    avgTemperature: r(totalTemp / n),
    segmentCount: n,
    failedCount: obj.segments.filter((s) => s.state.integrity <= 0).length,
  };
}

/**
 * Get recent events from an object.
 */
export function getRecentEvents(obj, count = 10) {
  return obj.events.slice(-count);
}

/**
 * Set LOD level for an object.
 */
export function setSimulationLOD(obj, lodLevel) {
  return { ...obj, lodLevel };
}
