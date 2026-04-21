/**
 * Material Math — pure engineering formulas for stress simulation.
 *
 * Simplified but internally consistent. Every formula uses normalized
 * 0–1 values from the material database. Results feed into the stress
 * simulation, inspector, and failure assistant.
 *
 * These are APPROXIMATIONS for gameplay, not full engineering analysis.
 * What matters: consistency, reasonable behavior, and educational value.
 */

/**
 * Stress = Force / Area.
 * Higher force or smaller cross-section = higher stress.
 *
 * @param {number} force - applied force (normalized 0–1)
 * @param {number} area - cross-sectional area (normalized 0–1, min 0.01)
 * @returns {number} stress (can exceed 1.0 = beyond material limits)
 */
export function computeStress(force, area) {
  return force / Math.max(0.01, area);
}

/**
 * Strain = Stress / Elastic Modulus.
 * How much the material deforms under stress. Higher elasticity = more flex.
 *
 * @param {number} stress
 * @param {number} elasticity - material elasticity (0–1)
 * @returns {number} strain (0 = no deformation, >1 = severe)
 */
export function computeStrain(stress, elasticity) {
  // Elastic modulus: stiffer materials (low elasticity) resist deformation
  const modulus = Math.max(0.05, 1 - elasticity * 0.8);
  return stress / modulus;
}

/**
 * Fatigue accumulation from repeated cyclic stress.
 * Each cycle adds micro-damage. Higher stress and lower resistance = faster damage.
 *
 * @param {number} previousFatigue - accumulated fatigue (0–1)
 * @param {number} cyclicStress - stress per cycle (0–1)
 * @param {number} cycleCount - number of new cycles
 * @param {object} material - { fatigueResistance }
 * @returns {number} new fatigue level (0–1)
 */
export function computeFatigue(previousFatigue, cyclicStress, cycleCount, material) {
  const resistance = material.fatigueResistance || 0.5;
  const damagePerCycle = cyclicStress * (1 - resistance) * 0.003;
  return Math.min(1, previousFatigue + damagePerCycle * cycleCount);
}

/**
 * Thermal stress from constrained expansion.
 * When heated, materials expand. If constrained (bolted to another part),
 * expansion creates internal stress.
 *
 * @param {number} expansionCoeff - material thermal expansion (0–1)
 * @param {number} deltaTemp - temperature change (0–1 normalized)
 * @param {number} constraintFactor - how constrained (0 = free, 1 = fully fixed)
 * @param {number} elasticity - material elasticity
 * @returns {number} thermal stress contribution
 */
export function computeThermalStress(expansionCoeff, deltaTemp, constraintFactor, elasticity) {
  const expansion = expansionCoeff * deltaTemp;
  const modulus = Math.max(0.05, 1 - elasticity * 0.8);
  return expansion * constraintFactor * modulus;
}

/**
 * Integrity loss from combined stress, fatigue, and thermal factors.
 *
 * @param {number} stressRatio - current stress / material strength
 * @param {number} fatigue - accumulated fatigue (0–1)
 * @param {number} temperatureRatio - current temp / melting point
 * @returns {number} integrity loss per tick (0–1)
 */
export function computeIntegrityLoss(stressRatio, fatigue, temperatureRatio) {
  let loss = 0;

  // Stress-driven damage (accelerates above yield)
  if (stressRatio > 0.8) {
    loss += (stressRatio - 0.8) * 0.1;
  }
  if (stressRatio > 1.0) {
    loss += (stressRatio - 1.0) * 0.5; // rapid damage above strength
  }

  // Fatigue-driven damage (accelerates above 0.6)
  if (fatigue > 0.6) {
    loss += (fatigue - 0.6) * 0.05;
  }

  // Thermal damage
  if (temperatureRatio > 0.7) {
    loss += (temperatureRatio - 0.7) * 0.08;
  }

  return Math.min(0.5, loss); // cap per-tick loss
}

/**
 * Vibration amplitude from periodic forcing.
 * Resonance occurs when forcing frequency matches natural frequency.
 *
 * @param {number} forcingAmplitude - external vibration force (0–1)
 * @param {number} naturalFreqRatio - forcing/natural frequency ratio (1.0 = resonance)
 * @param {number} damping - material damping factor (0–1, higher = more damped)
 * @returns {number} vibration amplitude
 */
export function computeVibration(forcingAmplitude, naturalFreqRatio, damping) {
  // Simplified resonance curve: peaks when ratio ≈ 1.0
  const freqDiff = Math.abs(1 - naturalFreqRatio);
  const resonanceFactor = 1 / Math.max(0.05, freqDiff + damping * 0.5);
  return Math.min(2, forcingAmplitude * resonanceFactor * 0.3);
}

/**
 * Deformation amount from strain and geometry.
 *
 * @param {number} strain
 * @param {number} segmentLength
 * @returns {number} deformation in length units
 */
export function computeDeformation(strain, segmentLength) {
  return strain * segmentLength;
}

/**
 * Stress concentration factor at joints/connections.
 * Poor bonding or sharp corners increase local stress.
 *
 * @param {number} bondQuality - connection bond quality (0–1)
 * @param {number} geometryFactor - how sharp the geometry change is (0–1, 0=smooth)
 * @returns {number} stress multiplier (1.0 = no concentration, >1 = amplified)
 */
export function stressConcentration(bondQuality, geometryFactor = 0.2) {
  const bondWeakness = 1 - bondQuality;
  return 1 + bondWeakness * 0.5 + geometryFactor * 0.3;
}
