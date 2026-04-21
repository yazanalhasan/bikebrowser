/**
 * Material Engine — deformation, fracture, fatigue, thermal effects,
 * fluid behavior, and composite material creation.
 *
 * This is the physics layer that sits between the material database
 * and the simulation engine. All vehicle, structure, and crafting
 * systems use this engine to compute material behavior.
 *
 * Core principles:
 *   - All behavior emerges from numeric properties (no hardcoded outcomes)
 *   - Materials degrade under stress, heat, and repeated use
 *   - Composites blend properties of their components
 *   - Environmental conditions (temperature, moisture) affect performance
 *
 * Pure functions — no side effects.
 */

import { MATERIALS, MATERIAL_MAP } from '../data/materials.js';

// ── Stress & Deformation ─────────────────────────────────────────────────────

/**
 * Apply force to a material and compute the result.
 *
 * @param {string} materialId
 * @param {number} force - applied force (normalized 0–1)
 * @param {number} [currentIntegrity=1] - current material integrity (0–1)
 * @returns {{ deformed, fractured, newIntegrity, strain, explanation }}
 */
export function applyForce(materialId, force, currentIntegrity = 1) {
  const mat = MATERIAL_MAP[materialId];
  if (!mat) return { deformed: false, fractured: false, newIntegrity: currentIntegrity, strain: 0, explanation: 'Unknown material.' };

  const s = mat.structural;
  const effectiveStrength = s.strength * currentIntegrity;
  const effectiveFracture = s.fracturePoint * currentIntegrity;

  // Strain: how much the material deforms
  // elastic materials absorb force, rigid materials resist until they snap
  const strain = force > effectiveStrength
    ? (force - effectiveStrength) * (1 - s.elasticity)
    : force * s.elasticity * 0.1; // elastic deformation (reversible)

  const deformed = force > effectiveStrength;
  const fractured = force > effectiveFracture;

  let newIntegrity = currentIntegrity;
  if (fractured) {
    newIntegrity = 0; // catastrophic failure
  } else if (deformed) {
    // Permanent deformation reduces integrity
    newIntegrity = Math.max(0, currentIntegrity - strain * 0.3);
  }

  let explanation;
  if (fractured) {
    explanation = `${mat.label} fractured! Force (${r(force)}) exceeded fracture point (${r(effectiveFracture)}). ` +
      `The material failed catastrophically — atomic bonds broke faster than they could redistribute stress.`;
  } else if (deformed) {
    explanation = `${mat.label} deformed permanently. Force (${r(force)}) exceeded yield strength (${r(effectiveStrength)}). ` +
      `The crystal structure (or polymer chains) shifted to a new position and won't spring back. ` +
      `Integrity: ${r(newIntegrity * 100)}%.`;
  } else {
    explanation = `${mat.label} held. Force (${r(force)}) within elastic range (${r(effectiveStrength)}). ` +
      `The material flexed and returned to its original shape — elastic deformation.`;
  }

  return { deformed, fractured, newIntegrity, strain: r(strain), explanation };
}

// ── Fatigue ──────────────────────────────────────────────────────────────────

/**
 * Apply repeated stress cycles (fatigue) to a material.
 * Even forces below yield strength cause damage over time.
 *
 * @param {string} materialId
 * @param {number} stressLevel - per-cycle stress (0–1)
 * @param {number} cycles - number of stress cycles
 * @param {number} [currentIntegrity=1]
 * @returns {{ newIntegrity, fatigued, cyclesRemaining, explanation }}
 */
export function applyFatigue(materialId, stressLevel, cycles, currentIntegrity = 1) {
  const mat = MATERIAL_MAP[materialId];
  if (!mat) return { newIntegrity: currentIntegrity, fatigued: false, cyclesRemaining: Infinity, explanation: 'Unknown material.' };

  const resistance = mat.structural.fatigueResistance;

  // Fatigue damage per cycle: higher stress and lower resistance = more damage
  const damagePerCycle = (stressLevel * (1 - resistance)) * 0.005;
  const totalDamage = damagePerCycle * cycles;
  const newIntegrity = Math.max(0, currentIntegrity - totalDamage);
  const fatigued = newIntegrity < 0.5;

  // Estimate remaining cycles before failure
  const cyclesRemaining = newIntegrity > 0 ? Math.floor(newIntegrity / Math.max(0.0001, damagePerCycle)) : 0;

  let explanation;
  if (newIntegrity <= 0) {
    explanation = `${mat.label} failed from fatigue after ${cycles} cycles at ${r(stressLevel * 100)}% stress. ` +
      `Micro-cracks accumulated until the material could no longer hold. ` +
      `Fatigue resistance: ${r(resistance * 100)}%.`;
  } else if (fatigued) {
    explanation = `${mat.label} showing fatigue damage (${r(newIntegrity * 100)}% integrity). ` +
      `~${cyclesRemaining} cycles remaining. ` +
      `Each stress cycle creates microscopic cracks that slowly grow.`;
  } else {
    explanation = `${mat.label} holding well after ${cycles} cycles. ` +
      `Integrity: ${r(newIntegrity * 100)}%. ` +
      `Fatigue resistance: ${r(resistance * 100)}%.`;
  }

  return { newIntegrity: r(newIntegrity), fatigued, cyclesRemaining, explanation };
}

// ── Thermal Effects ──────────────────────────────────────────────────────────

/**
 * Compute thermal effects on a material at a given temperature.
 *
 * @param {string} materialId
 * @param {number} temperature - normalized 0–1 (0=cold, 1=extremely hot)
 * @param {number} [currentIntegrity=1]
 * @returns {{ expanded, melted, strengthMod, newIntegrity, explanation }}
 */
export function applyTemperature(materialId, temperature, currentIntegrity = 1) {
  const mat = MATERIAL_MAP[materialId];
  if (!mat) return { expanded: false, melted: false, strengthMod: 1, newIntegrity: currentIntegrity, explanation: 'Unknown material.' };

  const t = mat.thermal;

  // Expansion: materials grow with heat
  const expansionAmount = temperature * t.expansion;

  // Melting/charring check
  const effectiveMeltPoint = t.meltingPoint || t.charPoint || 1;
  const melted = temperature > effectiveMeltPoint;

  // Strength decreases with temperature
  // Most materials lose ~50% strength at 60% of melting point
  const heatRatio = temperature / Math.max(0.01, effectiveMeltPoint);
  const strengthMod = Math.max(0.1, 1 - heatRatio * 0.6);

  let newIntegrity = currentIntegrity;
  if (melted) {
    newIntegrity = 0;
  } else if (heatRatio > 0.7) {
    // Creep damage near melting point
    newIntegrity = Math.max(0, currentIntegrity - (heatRatio - 0.7) * 0.5);
  }

  let explanation;
  if (melted) {
    const failType = t.meltingPoint ? 'melted' : 'charred';
    explanation = `${mat.label} ${failType}! Temperature exceeded ${failType === 'melted' ? 'melting' : 'char'} point. ` +
      `At this temperature, ${failType === 'melted' ? 'atomic bonds break and the solid becomes liquid' : 'organic molecules decompose, leaving carbon'}.`;
  } else {
    explanation = `${mat.label} at ${r(temperature * 100)}% temperature. ` +
      `Expansion: ${r(expansionAmount * 100)}%. Strength: ${r(strengthMod * 100)}% of rated. ` +
      `Heat weakens materials by giving atoms energy to move out of their optimal positions.`;
  }

  return {
    expanded: expansionAmount > 0.01,
    expansionAmount: r(expansionAmount),
    melted,
    strengthMod: r(strengthMod),
    newIntegrity: r(newIntegrity),
    explanation,
  };
}

// ── Fluid Behavior ───────────────────────────────────────────────────────────

/**
 * Compute fluid behavior of a material at a given shear rate.
 *
 * @param {string} materialId
 * @param {number} shearRate - how fast the material is being deformed (0–1)
 * @returns {{ effectiveViscosity, flowState, explanation }}
 */
export function computeFluidBehavior(materialId, shearRate) {
  const mat = MATERIAL_MAP[materialId];
  if (!mat) return { effectiveViscosity: 0, flowState: 'unknown', explanation: 'Unknown material.' };

  const f = mat.fluid;
  if (f.flowBehavior === 'solid') {
    return { effectiveViscosity: Infinity, flowState: 'solid', explanation: `${mat.label} is a solid — it does not flow.` };
  }

  let effectiveViscosity = f.viscosity;

  switch (f.flowBehavior) {
    case 'newtonian':
      // Constant viscosity regardless of shear
      break;
    case 'shear_thinning':
      // Viscosity decreases with shear (ketchup, mucilage)
      effectiveViscosity = f.viscosity * (1 - shearRate * 0.6);
      break;
    case 'shear_thickening':
      // Viscosity increases with shear (oobleck, clay suspensions)
      effectiveViscosity = f.viscosity * (1 + shearRate * 2);
      break;
    case 'thixotropic':
      // Viscosity decreases over time under constant shear (resin, paint)
      effectiveViscosity = f.viscosity * (1 - shearRate * 0.4);
      break;
    case 'viscoelastic':
      // Both viscous and elastic (rubber)
      effectiveViscosity = f.viscosity * (1 - shearRate * 0.3);
      break;
    case 'soluble':
      // Dissolves — viscosity depends on concentration
      effectiveViscosity = f.viscosity * 0.5;
      break;
  }

  const flowState = effectiveViscosity > 0.9 ? 'solid_like'
    : effectiveViscosity > 0.5 ? 'thick'
    : effectiveViscosity > 0.2 ? 'flowing'
    : 'thin';

  const behaviorExplanation = {
    newtonian: 'Constant viscosity — flows the same regardless of force applied.',
    shear_thinning: 'Gets thinner when stirred. Long polymer chains align with flow direction, reducing resistance.',
    shear_thickening: 'Gets thicker under force. Particles jam together when pushed — the oobleck effect.',
    thixotropic: 'Thins over time under constant force, then thickens when left alone.',
    viscoelastic: 'Both stretchy and flowy. Bounces like a solid, flows like a liquid.',
    soluble: 'Dissolves into solution, releasing ions or molecules.',
  };

  return {
    effectiveViscosity: r(effectiveViscosity),
    flowState,
    flowBehavior: f.flowBehavior,
    explanation: `${mat.label}: ${behaviorExplanation[f.flowBehavior] || 'Unknown flow behavior.'}`,
  };
}

// ── Composite Material Creation ──────────────────────────────────────────────

/**
 * Combine two materials into a composite with emergent properties.
 * NOT a recipe lookup — properties are computed mathematically.
 *
 * @param {string} matIdA
 * @param {string} matIdB
 * @param {number} [ratioA=0.5] - fraction of material A (0–1)
 * @returns {{ composite: object, explanation: string }}
 */
export function combineMaterials(matIdA, matIdB, ratioA = 0.5) {
  const matA = MATERIAL_MAP[matIdA];
  const matB = MATERIAL_MAP[matIdB];
  if (!matA || !matB) return { composite: null, explanation: 'Unknown material(s).' };

  const ratioB = 1 - ratioA;

  // Blend all property domains
  const composite = {
    id: `composite_${matIdA}_${matIdB}`,
    label: `${matA.label}/${matB.label} Composite`,
    category: 'composite',
    icon: '🔀',
    source: 'crafted',
    components: [{ id: matIdA, ratio: ratioA }, { id: matIdB, ratio: ratioB }],
    structural: blendDomain(matA.structural, matB.structural, ratioA, ratioB, 'structural'),
    physical: blendDomain(matA.physical, matB.physical, ratioA, ratioB, 'physical'),
    thermal: blendDomain(matA.thermal, matB.thermal, ratioA, ratioB, 'thermal'),
    fluid: {
      viscosity: matA.fluid.viscosity * ratioA + matB.fluid.viscosity * ratioB,
      flowBehavior: matA.fluid.flowBehavior === 'solid' && matB.fluid.flowBehavior === 'solid'
        ? 'solid' : 'viscoelastic',
    },
    electrical: blendDomain(matA.electrical, matB.electrical, ratioA, ratioB, 'electrical'),
    description: `Composite of ${matA.label} (${r(ratioA * 100)}%) and ${matB.label} (${r(ratioB * 100)}%).`,
  };

  // Apply synergy bonuses for complementary categories
  const synergy = computeSynergy(matA, matB);
  if (synergy.bonus > 0) {
    for (const [prop, mult] of Object.entries(synergy.boosts)) {
      const [domain, key] = prop.split('.');
      if (composite[domain] && typeof composite[domain][key] === 'number') {
        composite[domain][key] = Math.min(0.98, composite[domain][key] * mult);
      }
    }
  }

  const explanation = `Combined ${matA.label} + ${matB.label}.\n` +
    `Strength: ${r(composite.structural.strength * 100)}% ` +
    `(${matA.label}: ${r(matA.structural.strength * 100)}%, ${matB.label}: ${r(matB.structural.strength * 100)}%)\n` +
    `Weight: ${r(composite.physical.density * 100)}% density\n` +
    (synergy.bonus > 0 ? `✨ Synergy: ${synergy.explanation}` : 'No special synergy between these materials.');

  return { composite, explanation, synergy };
}

function blendDomain(domainA, domainB, ratioA, ratioB, domainName) {
  const result = {};
  const allKeys = new Set([...Object.keys(domainA || {}), ...Object.keys(domainB || {})]);
  for (const key of allKeys) {
    const a = domainA?.[key];
    const b = domainB?.[key];
    if (typeof a === 'number' && typeof b === 'number') {
      result[key] = r(a * ratioA + b * ratioB);
    } else if (typeof a === 'number') {
      result[key] = r(a * ratioA);
    } else if (typeof b === 'number') {
      result[key] = r(b * ratioB);
    } else {
      result[key] = a ?? b;
    }
  }
  return result;
}

function computeSynergy(matA, matB) {
  const cats = [matA.category, matB.category].sort().join('+');
  const synergies = {
    'fiber+resin': {
      bonus: 0.15,
      boosts: { 'structural.strength': 1.3, 'structural.fatigueResistance': 1.25 },
      explanation: 'Fiber + resin = fiberglass principle. Resin binds fibers into a rigid matrix stronger than either alone.',
    },
    'metal+polymer': {
      bonus: 0.1,
      boosts: { 'structural.fatigueResistance': 1.3, 'structural.elasticity': 1.2 },
      explanation: 'Metal core + polymer coating. Metal provides strength, polymer absorbs vibration and resists corrosion.',
    },
    'carbon+polymer': {
      bonus: 0.2,
      boosts: { 'structural.strength': 1.4, 'physical.density': 0.8 },
      explanation: 'Carbon fiber composite! Carbon provides rigidity, polymer provides flexibility. Stronger than steel at 1/5 the weight.',
    },
    'fiber+gel': {
      bonus: 0.1,
      boosts: { 'structural.elasticity': 1.3, 'structural.fatigueResistance': 1.15 },
      explanation: 'Gel-impregnated fiber. The gel fills gaps and distributes stress evenly across the fiber network.',
    },
    'metal+carbon': {
      bonus: 0.15,
      boosts: { 'electrical.conductivity': 1.3, 'structural.strength': 1.15 },
      explanation: 'Metal + carbon composite. Enhanced conductivity and structural properties.',
    },
  };

  return synergies[cats] || { bonus: 0, boosts: {}, explanation: '' };
}

// ── Load Testing ─────────────────────────────────────────────────────────────

/**
 * Test a material under a specific load scenario.
 * Used by the simulation engine for structures and vehicles.
 *
 * @param {string} materialId
 * @param {object} scenario
 * @param {number} scenario.staticLoad - continuous force (0–1)
 * @param {number} scenario.dynamicLoad - repeated impact force (0–1)
 * @param {number} scenario.cycles - number of dynamic stress cycles
 * @param {number} scenario.temperature - environmental temperature (0–1)
 * @param {number} [currentIntegrity=1]
 * @returns {{ passed, integrity, failures, explanation }}
 */
export function loadTest(materialId, scenario, currentIntegrity = 1) {
  const failures = [];
  let integrity = currentIntegrity;

  // Static load test
  const forceResult = applyForce(materialId, scenario.staticLoad || 0, integrity);
  integrity = forceResult.newIntegrity;
  if (forceResult.fractured) failures.push({ type: 'fracture', ...forceResult });
  else if (forceResult.deformed) failures.push({ type: 'deformation', ...forceResult });

  // Fatigue test
  if (scenario.dynamicLoad > 0 && scenario.cycles > 0) {
    const fatigueResult = applyFatigue(materialId, scenario.dynamicLoad, scenario.cycles, integrity);
    integrity = fatigueResult.newIntegrity;
    if (fatigueResult.fatigued) failures.push({ type: 'fatigue', ...fatigueResult });
  }

  // Thermal test
  if (scenario.temperature > 0.1) {
    const thermalResult = applyTemperature(materialId, scenario.temperature, integrity);
    integrity = thermalResult.newIntegrity;
    if (thermalResult.melted) failures.push({ type: 'thermal_failure', ...thermalResult });
  }

  const passed = failures.length === 0 && integrity > 0.5;
  const mat = MATERIAL_MAP[materialId];

  return {
    passed,
    integrity: r(integrity),
    failures,
    material: mat?.label || materialId,
    explanation: passed
      ? `${mat?.label} passed all load tests. Integrity: ${r(integrity * 100)}%.`
      : `${mat?.label} failed: ${failures.map((f) => f.type).join(', ')}. Integrity: ${r(integrity * 100)}%.`,
  };
}

// ── Environmental Degradation ────────────────────────────────────────────────

/**
 * Apply environmental exposure effects over time.
 *
 * @param {string} materialId
 * @param {number} elapsedHours - game-time hours of exposure
 * @param {object} environment - { moisture, temperature, uv }
 * @param {number} [currentIntegrity=1]
 * @returns {{ newIntegrity, degradationType, explanation }}
 */
export function applyEnvironmentalDegradation(materialId, elapsedHours, environment, currentIntegrity = 1) {
  const mat = MATERIAL_MAP[materialId];
  if (!mat) return { newIntegrity: currentIntegrity, degradationType: null, explanation: 'Unknown material.' };

  let damage = 0;
  let degradationType = null;

  // Moisture damage (corrosion for metals, rot for organics)
  const moisture = environment.moisture || 0;
  if (mat.category === 'metal' && moisture > 0.3) {
    damage += moisture * 0.001 * elapsedHours;
    degradationType = 'corrosion';
  }
  if (['wood', 'fiber'].includes(mat.category) && moisture > 0.5) {
    damage += moisture * 0.002 * elapsedHours;
    degradationType = 'rot';
  }

  // UV damage (polymers degrade in sunlight)
  const uv = environment.uv || 0;
  if (mat.category === 'polymer' && uv > 0.3) {
    damage += uv * 0.001 * elapsedHours;
    degradationType = 'uv_degradation';
  }

  // Heat damage
  const temp = environment.temperature || 0;
  if (temp > mat.thermal.meltingPoint * 0.5) {
    damage += (temp - mat.thermal.meltingPoint * 0.5) * 0.002 * elapsedHours;
    degradationType = degradationType || 'heat_damage';
  }

  const newIntegrity = Math.max(0, currentIntegrity - damage);

  return {
    newIntegrity: r(newIntegrity),
    degradationType: damage > 0 ? degradationType : null,
    damage: r(damage),
    explanation: damage > 0
      ? `${mat.label} degrading from ${degradationType}: -${r(damage * 100)}% integrity over ${elapsedHours}h.`
      : `${mat.label} stable in current conditions.`,
  };
}

// ── Buoyancy System ──────────────────────────────────────────────────────────

/**
 * Compute buoyancy of an object in a fluid.
 *
 * @param {string} objectMaterialId - material of the object
 * @param {number} objectVolume - volume in arbitrary units
 * @param {number} fluidDensity - density of surrounding fluid (0–1, water=0.12)
 * @param {number} [cargoMass=0] - additional mass from cargo
 * @param {number} [cargoCenterOffset=0] - offset from center (-1 to 1, 0=centered)
 * @returns {{ floats, submersion, tiltAngle, capsizeRisk, explanation }}
 */
export function computeBuoyancy(objectMaterialId, objectVolume, fluidDensity, cargoMass = 0, cargoCenterOffset = 0) {
  const mat = MATERIAL_MAP[objectMaterialId];
  if (!mat) return { floats: false, submersion: 1, tiltAngle: 0, capsizeRisk: 0, explanation: 'Unknown material.' };

  const objectDensity = mat.physical.density;
  const objectMass = objectDensity * objectVolume + cargoMass;
  const buoyantForce = fluidDensity * objectVolume;

  const floats = objectMass < buoyantForce;
  const submersion = floats ? Math.min(1, objectMass / Math.max(0.01, buoyantForce)) : 1;

  // Tilt from uneven cargo
  const tiltAngle = Math.abs(cargoCenterOffset) * 45; // degrees
  const capsizeRisk = Math.min(1, (tiltAngle / 90) + (submersion > 0.8 ? 0.3 : 0));

  let explanation;
  if (!floats) {
    explanation = `Object sinks! Density (${r(objectDensity)}) exceeds fluid density (${r(fluidDensity)}). ` +
      `Buoyancy = displaced fluid weight. To float, object density must be less than fluid density (Archimedes\' principle).`;
  } else if (capsizeRisk > 0.7) {
    explanation = `Object floats but is dangerously unstable! Tilt: ${r(tiltAngle)}°. ` +
      `Uneven cargo shifts the center of gravity away from the center of buoyancy → capsizing risk.`;
  } else {
    explanation = `Object floats at ${r(submersion * 100)}% submersion. ` +
      `Object density (${r(objectDensity)}) < fluid density (${r(fluidDensity)}). Archimedes: the buoyant force equals the weight of displaced fluid.`;
  }

  return { floats, submersion: r(submersion), tiltAngle: r(tiltAngle), capsizeRisk: r(capsizeRisk), explanation };
}

// ── Interfacial Chemistry (Surfactants + Capillary) ──────────────────────────

/**
 * Apply a surfactant to a system. Reduces surface tension and improves wetting.
 *
 * @param {string} surfactantMaterialId - surfactant material
 * @param {number} concentration - how much surfactant (0–1)
 * @param {object} targetProperties - the fluid/surface properties being modified
 * @returns {{ modifiedProperties, contaminationReduction, frictionReduction, explanation }}
 */
export function applySurfactant(surfactantMaterialId, concentration, targetProperties) {
  const surf = MATERIAL_MAP[surfactantMaterialId];
  if (!surf) return { modifiedProperties: targetProperties, contaminationReduction: 0, frictionReduction: 0, explanation: 'Unknown surfactant.' };

  const surfPower = surf.fluid.wetting * concentration;
  const tensionReduction = (1 - surf.fluid.surfaceTension) * concentration;

  const modified = { ...targetProperties };

  // Reduce surface tension
  if (typeof modified.surfaceTension === 'number') {
    modified.surfaceTension = Math.max(0.01, modified.surfaceTension - tensionReduction);
  }

  // Improve wetting
  if (typeof modified.wetting === 'number') {
    modified.wetting = Math.min(0.99, modified.wetting + surfPower * 0.5);
  }

  // Contamination removal: surfactant lifts contaminants from surfaces
  const contaminationReduction = surf.chemical.reactivity * concentration * 0.5;

  // Friction reduction: surfactant acts as lubricant
  const frictionReduction = surfPower * 0.3;

  const explanation = `Applied ${surf.label} (${r(concentration * 100)}% concentration). ` +
    `Surface tension: -${r(tensionReduction * 100)}%. Wetting: +${r(surfPower * 50)}%. ` +
    `Surfactant molecules wedge between oil and water at the interface, ` +
    `breaking the cohesion that holds contaminants to the surface. ` +
    `Lower surface tension = better penetration into pores and cracks.`;

  return { modifiedProperties: modified, contaminationReduction: r(contaminationReduction), frictionReduction: r(frictionReduction), explanation };
}

/**
 * Compute capillary rise in a material with pores/channels.
 *
 * @param {string} materialId - the porous material
 * @param {number} channelWidth - pore/channel size (0–1, smaller = more rise)
 * @param {number} fluidSurfaceTension - tension of the wicking fluid
 * @returns {{ riseHeight, wettingRate, explanation }}
 */
export function computeCapillary(materialId, channelWidth, fluidSurfaceTension) {
  const mat = MATERIAL_MAP[materialId];
  if (!mat) return { riseHeight: 0, wettingRate: 0, explanation: 'Unknown material.' };

  const capFactor = mat.fluid.capillaryFactor || 0;
  if (capFactor === 0) {
    return { riseHeight: 0, wettingRate: 0, explanation: `${mat.label} has no capillary channels — fluid cannot wick through it.` };
  }

  // Capillary rise: inversely proportional to channel width, proportional to surface tension
  const narrowness = 1 - channelWidth;
  const riseHeight = r(capFactor * narrowness * fluidSurfaceTension * 2);
  const wettingRate = r(capFactor * mat.fluid.wetting * (1 - fluidSurfaceTension) * 0.5);

  return {
    riseHeight,
    wettingRate,
    explanation: `${mat.label}: capillary rise = ${riseHeight} (${capFactor > 0.7 ? 'strong' : 'moderate'} wicking). ` +
      `Narrow channels pull fluid upward against gravity — surface tension and channel walls create a meniscus ` +
      `that "climbs." Narrower channels = higher rise. This is how trees move water from roots to leaves.`,
  };
}

// ── Coating System ───────────────────────────────────────────────────────────

/**
 * Apply a coating to an object. Returns the protection profile.
 *
 * @param {string} coatingMaterialId
 * @param {string} substrateMaterialId
 * @param {number} thickness - coating thickness (0–1)
 * @returns {{ protection, explanation }}
 */
export function applyCoating(coatingMaterialId, substrateMaterialId, thickness) {
  const coat = MATERIAL_MAP[coatingMaterialId];
  const sub = MATERIAL_MAP[substrateMaterialId];
  if (!coat || !sub) return { protection: null, explanation: 'Unknown material(s).' };

  const coatProps = coat.coating;
  const coverage = Math.min(0.99, coatProps.coverage * thickness);

  // Bonding quality: how well the coating adheres
  const bondQuality = Math.min(0.99, coat.chemical.bonding * sub.chemical.bonding);

  // Protection factors
  const heatProtection = coverage * (1 - coat.thermal.conductivity) * bondQuality;
  const moistureProtection = coverage * (1 - coat.fluid.wetting) * bondQuality; // hydrophobic = good moisture barrier
  const uvProtection = coverage * coatProps.reflectivity * bondQuality;
  const contaminationProtection = coverage * coat.chemical.contaminationResistance * bondQuality;
  const corrosionProtection = coverage * coat.chemical.contaminationResistance * (1 - sub.chemical.reactivity) * bondQuality;

  const protection = {
    coverage: r(coverage),
    bondQuality: r(bondQuality),
    heat: r(heatProtection),
    moisture: r(moistureProtection),
    uv: r(uvProtection),
    contamination: r(contaminationProtection),
    corrosion: r(corrosionProtection),
    degradationRate: coatProps.degradationRate * (1 - bondQuality * 0.5),
    coatingMaterial: coatingMaterialId,
    substrate: substrateMaterialId,
  };

  const explanation = `Coated ${sub.label} with ${coat.label} (${r(thickness * 100)}% thickness). ` +
    `Coverage: ${r(coverage * 100)}%. Bond: ${r(bondQuality * 100)}%. ` +
    `Heat protection: ${r(heatProtection * 100)}%. Moisture: ${r(moistureProtection * 100)}%. ` +
    `Coating works by placing a barrier between the material and its environment. ` +
    `The coating\'s properties determine what it blocks: reflective coatings deflect heat, ` +
    `hydrophobic coatings repel water, antimicrobial coatings prevent biological fouling.`;

  return { protection, explanation };
}

/**
 * Degrade a coating over time.
 *
 * @param {object} protection - from applyCoating
 * @param {number} elapsedHours
 * @param {object} [environment] - { temperature, moisture, uv }
 * @returns {{ protection, warning, explanation }}
 */
export function degradeCoating(protection, elapsedHours, environment = {}) {
  if (!protection) return { protection: null, warning: null, explanation: 'No coating.' };

  const baseRate = protection.degradationRate || 0.01;
  const envMultiplier = 1 +
    (environment.temperature || 0) * 0.5 +
    (environment.moisture || 0) * 0.3 +
    (environment.uv || 0) * 0.4;

  const degradation = baseRate * envMultiplier * elapsedHours;
  const newCoverage = Math.max(0, protection.coverage - degradation);
  const ratio = newCoverage / Math.max(0.01, protection.coverage);

  const degraded = {
    ...protection,
    coverage: r(newCoverage),
    heat: r(protection.heat * ratio),
    moisture: r(protection.moisture * ratio),
    uv: r(protection.uv * ratio),
    contamination: r(protection.contamination * ratio),
    corrosion: r(protection.corrosion * ratio),
  };

  let warning = null;
  if (newCoverage < 0.1) warning = 'Coating nearly gone — reapply!';
  else if (newCoverage < 0.3) warning = 'Coating degraded — protection compromised.';

  return {
    protection: degraded,
    warning,
    explanation: newCoverage < 0.1
      ? `Coating has degraded below 10%. The substrate is now exposed to environmental damage. Reapply coating.`
      : `Coating at ${r(newCoverage * 100)}% (lost ${r(degradation * 100)}% over ${elapsedHours}h). ` +
        `Heat, moisture, and UV accelerate degradation by breaking molecular bonds in the coating.`,
  };
}

// ── Cross-System Interaction Loop ────────────────────────────────────────────

/**
 * Unified material state tick — applies ALL systems in sequence.
 * This is the core game loop integration point.
 *
 * Order matters (each system's output feeds the next):
 *   1. Thermal → softens material → affects structural limits
 *   2. Coating → degrades → changes protection level
 *   3. Structural → apply forces → check for deformation/fracture
 *   4. Chemical → contamination, corrosion
 *   5. Fluid → buoyancy, surface effects
 *
 * @param {object} objectState - { materialId, integrity, coating?, temperature, forces, environment }
 * @param {number} deltaSec - seconds since last tick
 * @returns {{ newState, events[], explanation }}
 */
export function tickMaterialState(objectState, deltaSec) {
  const { materialId, integrity = 1, coating: coatingState, environment = {} } = objectState;
  const mat = MATERIAL_MAP[materialId];
  if (!mat) return { newState: objectState, events: [], explanation: 'Unknown material.' };

  const events = [];
  let currentIntegrity = integrity;
  const deltaHours = deltaSec / 3600;
  const temp = environment.temperature || 0.3;

  // 1. Thermal effects → modifies effective strength
  const thermalResult = applyTemperature(materialId, temp, currentIntegrity);
  currentIntegrity = thermalResult.newIntegrity;
  const strengthMod = thermalResult.strengthMod;

  if (thermalResult.melted) {
    events.push({ type: 'thermal_failure', message: thermalResult.explanation });
  } else if (strengthMod < 0.7) {
    events.push({ type: 'heat_weakening', message: `Heat reduced ${mat.label} strength to ${r(strengthMod * 100)}%` });
  }

  // 2. Coating degradation
  let currentCoating = coatingState;
  if (currentCoating?.coverage > 0) {
    const coatResult = degradeCoating(currentCoating, deltaHours, environment);
    currentCoating = coatResult.protection;
    if (coatResult.warning) events.push({ type: 'coating_warning', message: coatResult.warning });
  }

  // 3. Structural — apply current forces (if any)
  const force = objectState.currentForce || 0;
  if (force > 0) {
    const effectiveForce = force / Math.max(0.1, strengthMod); // heat-weakened = effectively stronger force
    // Coating absorbs some force
    const coatingAbsorption = currentCoating?.coverage ? currentCoating.coverage * 0.1 : 0;
    const netForce = Math.max(0, effectiveForce - coatingAbsorption);

    const forceResult = applyForce(materialId, netForce, currentIntegrity);
    currentIntegrity = forceResult.newIntegrity;
    if (forceResult.fractured) events.push({ type: 'fracture', message: forceResult.explanation });
    else if (forceResult.deformed) events.push({ type: 'deformation', message: forceResult.explanation });
  }

  // 4. Environmental degradation (corrosion, rot, UV)
  // Coating reduces environmental exposure
  const coatingShield = currentCoating?.coverage || 0;
  const exposedFraction = 1 - coatingShield;
  if (exposedFraction > 0.01) {
    const envResult = applyEnvironmentalDegradation(materialId, deltaHours * exposedFraction, environment, currentIntegrity);
    currentIntegrity = envResult.newIntegrity;
    if (envResult.degradationType) {
      events.push({ type: envResult.degradationType, message: envResult.explanation });
    }
  }

  return {
    newState: {
      ...objectState,
      integrity: r(currentIntegrity),
      coating: currentCoating,
      strengthMod: r(strengthMod),
      lastTick: Date.now(),
    },
    events,
    explanation: events.length > 0
      ? `${mat.label}: ${events.map((e) => e.type).join(', ')} (integrity: ${r(currentIntegrity * 100)}%)`
      : `${mat.label}: stable (integrity: ${r(currentIntegrity * 100)}%)`,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function r(v) { return Math.round(v * 100) / 100; }
