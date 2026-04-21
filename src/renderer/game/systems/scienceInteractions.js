/**
 * Science Interaction System — OYLA-inspired physics and cognition systems
 * integrated into the ecology/world model.
 *
 * Four sub-systems, all reading from getEnvironment():
 *
 *   1. Non-Newtonian Fluid Physics
 *      Organic decay zones create velocity-dependent terrain.
 *      Sprint across = solid surface. Walk slow = sink.
 *
 *   2. Contamination Model
 *      Items degrade over time based on ground contact, moisture,
 *      temperature. Plants with antimicrobial properties reduce contamination.
 *
 *   3. Topology Navigation
 *      Certain zones have Möbius-like spatial properties.
 *      Walking a loop returns you inverted. Rare plants grow only here.
 *
 *   4. Memory Challenge
 *      UI elements fade when signalNoise is high.
 *      Player must remember plant locations from prior exploration.
 *
 * All systems are property-driven and read from the unified environment.
 */

import { getEnvironment } from './ecologyEngine.js';
import { FLORA_MAP } from '../data/flora.js';

// ── 1. Non-Newtonian Fluid Physics ──────────────────────────────────────────

/**
 * Velocity thresholds for non-Newtonian fluid behavior.
 * Below shearThreshold: fluid behaves as liquid (player sinks).
 * Above shearThreshold: fluid behaves as solid (player runs across).
 */
const FLUID_CONFIG = {
  non_newtonian: {
    shearThreshold: 180,    // player speed in pixels/sec
    sinkRate: 0.05,         // how fast player sinks per tick
    maxSinkDepth: 0.8,      // 0–1, how deep before stuck
    recoveryRate: 0.02,     // how fast player recovers when sprinting
    staminaDrain: 0.01,     // extra stamina cost per tick while on fluid
    description: 'Oobleck-like ground — organic plant secretions mixed with desert clay. Sprint to stay on top!',
  },
  mud: {
    speedPenalty: 0.6,      // multiplier to player speed
    staminaDrain: 0.005,
    description: 'Thick mud — slows movement.',
  },
  water: {
    speedPenalty: 0.3,
    staminaDrain: 0.015,
    swimmable: true,
    description: 'Open water — very slow movement.',
  },
  dry: {
    speedPenalty: 1.0,
    staminaDrain: 0,
    description: 'Normal dry ground.',
  },
};

/**
 * Compute fluid interaction for the player's current position and velocity.
 *
 * @param {number} x - player world x
 * @param {number} y - player world y
 * @param {number} playerSpeed - current speed in pixels/sec
 * @param {number} currentSinkDepth - current sink state (0–1)
 * @param {'day'|'night'} [timeOfDay='day']
 * @returns {{ fluidType, speedMultiplier, sinkDelta, staminaDrain, isSolid, explanation }}
 */
export function computeFluidInteraction(x, y, playerSpeed, currentSinkDepth = 0, timeOfDay = 'day') {
  const env = getEnvironment(x, y, timeOfDay);
  const fluidType = env.scientificProperties.fluidType;
  const config = FLUID_CONFIG[fluidType];

  if (!config || fluidType === 'dry') {
    return {
      fluidType: 'dry',
      speedMultiplier: 1.0,
      sinkDelta: -0.05, // recover from any sinking
      staminaDrain: 0,
      isSolid: true,
      explanation: null,
    };
  }

  if (fluidType === 'non_newtonian') {
    const isSolid = playerSpeed > config.shearThreshold;
    const sinkDelta = isSolid
      ? -config.recoveryRate    // sprinting = float up
      : config.sinkRate;        // slow = sink

    const speedMult = isSolid ? 0.9 : Math.max(0.1, 1 - currentSinkDepth);

    return {
      fluidType,
      speedMultiplier: speedMult,
      sinkDelta,
      staminaDrain: config.staminaDrain,
      isSolid,
      isStuck: currentSinkDepth >= config.maxSinkDepth,
      explanation: isSolid
        ? 'Sprinting! The fluid acts like a solid under high shear force.'
        : 'Moving too slowly — the fluid is yielding. Sprint to stay on the surface!',
    };
  }

  // Mud or water
  return {
    fluidType,
    speedMultiplier: config.speedPenalty,
    sinkDelta: 0,
    staminaDrain: config.staminaDrain,
    isSolid: true,
    explanation: config.description,
  };
}

// ── 2. Contamination Model ──────────────────────────────────────────────────

/**
 * Compute contamination accumulation on a foraged item.
 *
 * Contamination increases with:
 *   - Time on the ground
 *   - Environmental moisture (microbes thrive in wet)
 *   - Temperature (heat speeds microbial growth)
 *
 * Contamination decreases with:
 *   - Plant's own contamination resistance (resinous plants resist)
 *   - Antimicrobial treatment (creosote, yerba mansa)
 *
 * @param {object} item - foraged item with { contamination, species }
 * @param {number} x - world position
 * @param {number} y
 * @param {number} elapsedSeconds - time since harvest
 * @param {'day'|'night'} [timeOfDay='day']
 * @returns {{ contamination, edible, warning, explanation }}
 */
export function computeItemContamination(item, x, y, elapsedSeconds, timeOfDay = 'day') {
  const env = getEnvironment(x, y, timeOfDay);
  const flora = FLORA_MAP[item.species];
  const resistance = flora?.scienceInteractions?.contaminationResistance || 0.2;
  const envContam = env.scientificProperties.contaminationLevel;

  // Base contamination growth rate
  const growthRate = (1 - resistance) * 0.001;

  // Environmental factors accelerate contamination
  const moistureFactor = 1 + env.moisture * 2;
  const heatFactor = 1 + env.temperature * 1.5;
  const envFactor = 1 + envContam;

  // Ground contact penalty
  const groundPenalty = item.onGround ? 0.002 : 0;

  const totalRate = (growthRate * moistureFactor * heatFactor * envFactor + groundPenalty);
  const newContamination = Math.min(1, (item.contamination || 0) + totalRate * elapsedSeconds);

  // Edibility thresholds
  const edible = newContamination < 0.3;
  const cookable = newContamination < 0.6; // cooking kills bacteria

  let warning = null;
  let explanation = null;

  if (newContamination > 0.6) {
    warning = 'dangerous';
    explanation = 'Contamination is dangerously high. Bacteria have multiplied beyond safe levels. ' +
      'Even cooking may not make this safe. Discard and harvest fresh.';
  } else if (newContamination > 0.3) {
    warning = 'cook_required';
    explanation = 'Contamination is moderate. Raw consumption risks infection. ' +
      'Cooking (heat above 70°C) kills most bacteria. Antimicrobial plants like creosote can also help.';
  } else if (newContamination > 0.1) {
    warning = 'caution';
    explanation = 'Low contamination — safe to eat but monitor freshness. ' +
      `This plant has ${Math.round(resistance * 100)}% natural resistance to microbes.`;
  }

  return {
    contamination: Math.round(newContamination * 1000) / 1000,
    edible,
    cookable,
    warning,
    explanation,
  };
}

/**
 * Apply antimicrobial treatment to reduce contamination.
 * Uses plants with antimicrobial pharmacology properties.
 *
 * @param {number} currentContamination
 * @param {string} treatmentPlant - flora name
 * @returns {{ contamination, reduction, explanation }}
 */
export function applyAntimicrobialTreatment(currentContamination, treatmentPlant) {
  const flora = FLORA_MAP[treatmentPlant];
  if (!flora?.pharmacology?.antimicrobial) {
    return {
      contamination: currentContamination,
      reduction: 0,
      explanation: `${treatmentPlant} has no antimicrobial properties. Try creosote or juniper.`,
    };
  }

  const power = flora.pharmacology.antimicrobial;
  const reduction = currentContamination * power;
  const newContam = Math.max(0, currentContamination - reduction);

  return {
    contamination: Math.round(newContam * 1000) / 1000,
    reduction: Math.round(reduction * 1000) / 1000,
    explanation: `${flora.label} reduced contamination by ${Math.round(reduction * 100)}%. ` +
      `Antimicrobial compounds in the resin/oil kill bacteria on contact.`,
  };
}

// ── 3. Topology Navigation ──────────────────────────────────────────────────

/**
 * Topology zone effects on player navigation.
 *
 * 'moebius' — cave zone: player walks a loop and emerges inverted
 * 'loop'    — root network: paths that loop back unexpectedly
 * 'twisted' — desert anomaly: distorted spatial perception
 */
const TOPOLOGY_EFFECTS = {
  moebius: {
    label: 'Möbius Cave',
    icon: '🔄',
    positionTransform: (x, y, elapsed) => {
      // After walking N steps, coordinates flip
      const flipPhase = Math.floor(elapsed / 5) % 2;
      return flipPhase === 1
        ? { x: x, y: y, inverted: true }
        : { x, y, inverted: false };
    },
    rarePlants: ['topology_lichen'],
    description: 'A one-sided surface — walk long enough and you end up on the other side without crossing an edge.',
    explanation: 'A Möbius strip has only one surface and one edge. If you walked along it, you\'d return to your starting point having visited "both sides" — but there\'s only one side! This cave system has similar properties.',
  },
  loop: {
    label: 'Root Loop',
    icon: '🌀',
    positionTransform: (x, y, elapsed) => {
      const loopRadius = 30;
      const angle = (elapsed * 0.1) % (Math.PI * 2);
      return {
        x: x + Math.sin(angle) * loopRadius * 0.3,
        y: y + Math.cos(angle) * loopRadius * 0.3,
        inverted: false,
      };
    },
    rarePlants: ['root_orchid'],
    description: 'Ancient mesquite root network that loops back on itself.',
    explanation: 'These roots form a topological loop — a path that returns to its starting point. In mathematics, this is a closed curve. Navigation becomes disorienting because landmarks repeat.',
  },
  twisted: {
    label: 'Twisted Trail',
    icon: '🌀',
    positionTransform: (x, y, elapsed) => ({
      x: x + Math.sin(elapsed * 0.05) * 15,
      y: y + Math.cos(elapsed * 0.07) * 10,
      inverted: false,
    }),
    rarePlants: ['desert_ghost_flower'],
    description: 'A desert trail where spatial perception shifts.',
    explanation: 'Heat mirages and unusual mineral deposits distort the landscape. Your perceived direction doesn\'t match actual movement — a natural example of non-Euclidean navigation.',
  },
  normal: {
    label: 'Normal',
    icon: '',
    positionTransform: (x, y) => ({ x, y, inverted: false }),
    rarePlants: [],
    description: '',
    explanation: '',
  },
};

/**
 * Get topology effect at a position.
 *
 * @param {number} x
 * @param {number} y
 * @param {'day'|'night'} [timeOfDay='day']
 * @returns {{ state, effect, hasRarePlants, explanation }}
 */
export function getTopologyEffect(x, y, timeOfDay = 'day') {
  const env = getEnvironment(x, y, timeOfDay);
  const state = env.scientificProperties.topologyState;
  const effect = TOPOLOGY_EFFECTS[state] || TOPOLOGY_EFFECTS.normal;

  return {
    state,
    label: effect.label,
    icon: effect.icon,
    hasRarePlants: effect.rarePlants.length > 0,
    rarePlants: effect.rarePlants,
    description: effect.description,
    explanation: effect.explanation,
    applyTransform: (px, py, elapsed) => effect.positionTransform(px, py, elapsed),
  };
}

// ── 4. Memory Challenge System ──────────────────────────────────────────────

/**
 * Compute UI visibility based on signal noise at player position.
 *
 * High signal noise = UI elements fade → player must rely on memory.
 * Simulates the concept of "digital amnesia" — over-reliance on
 * external information vs. internalized knowledge.
 *
 * @param {number} x
 * @param {number} y
 * @param {'day'|'night'} [timeOfDay='day']
 * @returns {{ uiOpacity, mapVisible, markerVisible, hudVisible, explanation }}
 */
export function computeMemoryChallenge(x, y, timeOfDay = 'day') {
  const env = getEnvironment(x, y, timeOfDay);
  const noise = env.scientificProperties.signalNoise;

  // Night increases the challenge
  const nightPenalty = timeOfDay === 'night' ? 0.2 : 0;
  const effectiveNoise = Math.min(1, noise + nightPenalty);

  // UI fades with noise
  const uiOpacity = Math.max(0.1, 1 - effectiveNoise);
  const mapVisible = effectiveNoise < 0.5;
  const markerVisible = effectiveNoise < 0.3;
  const hudVisible = effectiveNoise < 0.7;

  let explanation = null;
  if (effectiveNoise > 0.5) {
    explanation = 'Signal interference is high — your navigation tools are unreliable. ' +
      'Remember where you saw plants and landmarks. ' +
      'This is "digital amnesia" in action: when technology fails, only knowledge in your head works.';
  }

  return {
    uiOpacity: Math.round(uiOpacity * 100) / 100,
    mapVisible,
    markerVisible,
    hudVisible,
    signalNoise: effectiveNoise,
    explanation,
  };
}

// ── Unified Query ────────────────────────────────────────────────────────────

/**
 * Get ALL science interactions at a position in one call.
 * Used by the game loop to apply all effects efficiently.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} playerSpeed
 * @param {number} sinkDepth
 * @param {'day'|'night'|'dawn'|'dusk'} [timeOfDay='day']
 * @returns {object} all science interactions
 */
export function getScienceState(x, y, playerSpeed = 0, sinkDepth = 0, timeOfDay = 'day') {
  return {
    fluid: computeFluidInteraction(x, y, playerSpeed, sinkDepth, timeOfDay),
    topology: getTopologyEffect(x, y, timeOfDay),
    memory: computeMemoryChallenge(x, y, timeOfDay),
    environment: getEnvironment(x, y, timeOfDay),
  };
}

/** Export fluid config for UI display. */
export function getFluidConfig() {
  return FLUID_CONFIG;
}

/** Export topology effects for UI display. */
export function getTopologyEffects() {
  return TOPOLOGY_EFFECTS;
}
