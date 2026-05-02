/**
 * Thermal Rig Engine — pure simulation for the Thermal Expansion Lab.
 *
 * Mirror of materialTestingEngine.js's pattern: pure functions, no I/O,
 * deterministic outputs. Produces a temperature → length curve for a rod,
 * a summary block, and gameplay scores.
 *
 * Physics:
 *   Linear thermal expansion: ΔL = α · L₀ · ΔT
 *   where α (1/K) is the rod's coefficient of thermal expansion,
 *   L₀ is the unloaded length, and ΔT is the temperature change in K
 *   (= ΔT in °C for differences).
 *
 * GAMEPLAY NOTE:
 *   The default test runs 25°C → 200°C. None of the seeded rods (steel,
 *   copper, aluminum) actually fail in that range (their melting points
 *   are 660°C+). That's intentional — the gameplay value is the visible
 *   contrast between aluminum's dramatic stretch and steel's tiny one,
 *   not catastrophic failure. The 'failure' region is reserved for any
 *   future low-melting-point rod (solder, plastic) that does fail.
 *
 * GAMEPLAY SIMPLIFICATIONS:
 *   - α is treated as a constant. Real metals show α drift with
 *     temperature; we model the small-T linear regime.
 *   - No transverse expansion / volumetric effects — 1D only.
 *   - Region thresholds (elastic / plastic / failure) are gameplay
 *     bands keyed off failureTempC, not real phase-transition data.
 *
 * Pure functions only. No I/O, no global state.
 */

import { getThermalRod, getMaxAlpha } from './thermalRigDatabase.js';

const DEFAULT_OPTIONS = Object.freeze({
  startTempC: 25,
  endTempC: 200,
  sampleCount: 60,
  originalLengthMm: 100,
});

// Region band cutoffs as fractions of failureTempC.
const REGION_PLASTIC_FRACTION = 0.5;
const REGION_FAILURE_FRACTION = 0.9;

/**
 * Classify a temperature point relative to the rod's failure temperature.
 * @param {number} tempC
 * @param {number} failureTempC
 * @returns {'elastic'|'plastic'|'failure'}
 */
export function classifyThermalRegion(tempC, failureTempC) {
  if (tempC >= failureTempC * REGION_FAILURE_FRACTION) return 'failure';
  if (tempC >= failureTempC * REGION_PLASTIC_FRACTION) return 'plastic';
  return 'elastic';
}

/**
 * Run the thermal expansion test for a rod.
 * @param {string} rodId
 * @param {object} [opts]
 * @param {number} [opts.startTempC=25]
 * @param {number} [opts.endTempC=200]
 * @param {number} [opts.sampleCount=60]
 * @param {number} [opts.originalLengthMm=100]
 * @returns {object|null} TestResult or null if rod unknown.
 */
export function runThermalTest(rodId, opts = {}) {
  const rod = getThermalRod(rodId);
  if (!rod) return null;

  const startTempC = opts.startTempC ?? DEFAULT_OPTIONS.startTempC;
  const endTempC = opts.endTempC ?? DEFAULT_OPTIONS.endTempC;
  const sampleCount = Math.max(2, opts.sampleCount ?? DEFAULT_OPTIONS.sampleCount);
  const L0 = opts.originalLengthMm ?? rod.originalLengthMm ?? DEFAULT_OPTIONS.originalLengthMm;

  const alpha = rod.alphaPerK;
  const failureTempC = rod.failureTempC;

  const curve = [];
  let maxTempC = startTempC;

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const tempC = startTempC + (endTempC - startTempC) * t;
    const deltaT = tempC - startTempC;
    const deltaMm = alpha * L0 * deltaT;
    const lengthMm = L0 + deltaMm;
    const region = classifyThermalRegion(tempC, failureTempC);

    curve.push({
      x: tempC,
      y: deltaMm,
      tempC,
      lengthMm,
      deltaMm,
      region,
    });

    if (tempC > maxTempC) maxTempC = tempC;
  }

  const last = curve[curve.length - 1];
  const totalDeltaMm = last.deltaMm;
  const finalLengthMm = last.lengthMm;
  const fullDeltaT = endTempC - startTempC;
  const deltaMmPerCelsius = fullDeltaT > 0 ? totalDeltaMm / fullDeltaT : 0;

  const summary = {
    rodId,
    originalLengthMm: L0,
    finalLengthMm,
    totalDeltaMm,
    deltaMmPerCelsius,
    maxTempC,
    failureTempC,
  };

  // Scores normalize against the highest-α rod in the registry (currently
  // aluminum at 23e-6 /K). expansionMagnitude = "how much it stretched";
  // dimensionalStability = "how little it stretched"; heatTolerance scales
  // failureTempC against an arbitrary 1500°C ceiling.
  const refMaxAlpha = getMaxAlpha() || alpha || 1;
  const expansionMagnitudeScore = clamp01(alpha / refMaxAlpha);
  const dimensionalStabilityScore = 1 - expansionMagnitudeScore;
  const heatToleranceScore = clamp01(failureTempC / 1500);

  return {
    rodId,
    testType: 'thermal-expansion',
    curve,
    summary,
    scores: {
      expansionMagnitudeScore,
      dimensionalStabilityScore,
      heatToleranceScore,
    },
    unlockedKnowledge: Array.isArray(rod.unlocks) ? [...rod.unlocks] : [],
  };
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/**
 * Smoke-test the engine. Mirrors the pattern in materialTestingEngine.js.
 * Returns true if all assertions hold.
 * @returns {boolean}
 */
export function _smokeTest() {
  const errors = [];

  // 1. Steel produces a small but positive expansion.
  const steel = runThermalTest('steel_rod');
  if (!steel) errors.push('steel_rod returned null');
  else {
    if (steel.curve.length < 10) errors.push('steel curve too short');
    if (!(steel.summary.totalDeltaMm > 0)) errors.push('steel totalDelta not > 0');
    if (steel.summary.totalDeltaMm > 1) errors.push('steel totalDelta unrealistically large');
  }

  // 2. Aluminum expands more than steel for the same range.
  const alu = runThermalTest('aluminum_rod');
  if (!alu) errors.push('aluminum_rod returned null');
  else if (steel && !(alu.summary.totalDeltaMm > steel.summary.totalDeltaMm)) {
    errors.push('aluminum should expand more than steel');
  }

  // 3. Copper is between steel and aluminum.
  const cu = runThermalTest('copper_rod');
  if (!cu) errors.push('copper_rod returned null');
  else if (steel && alu) {
    const ok = cu.summary.totalDeltaMm > steel.summary.totalDeltaMm &&
               cu.summary.totalDeltaMm < alu.summary.totalDeltaMm;
    if (!ok) errors.push('copper should sit between steel and aluminum');
  }

  // 4. Region classification: at 25–200°C all rods should be 'elastic'
  //    (failureTempC * 0.5 ≥ 330°C for the lowest-melting rod).
  if (steel) {
    for (const p of steel.curve) {
      if (p.region !== 'elastic') errors.push('steel curve point not elastic');
    }
  }

  // 5. Unknown id returns null.
  if (runThermalTest('nonexistent_rod') !== null) {
    errors.push('unknown rod did not return null');
  }

  // 6. classifyThermalRegion boundaries.
  if (classifyThermalRegion(0, 1000) !== 'elastic') errors.push('classify low');
  if (classifyThermalRegion(600, 1000) !== 'plastic') errors.push('classify mid');
  if (classifyThermalRegion(950, 1000) !== 'failure') errors.push('classify high');

  if (errors.length) {
    // eslint-disable-next-line no-console
    console.error('thermalRigEngine smoke test failed:', errors);
    return false;
  }
  return true;
}
