/**
 * Material Testing Engine — pure simulation for the UTM (Universal Testing
 * Machine) sub-game. Produces stress-strain curves, force/displacement
 * conversions, and gameplay scores from a material descriptor.
 *
 * References:
 *   - USDA Forest Products Laboratory Wood Handbook (2010, FPL-GTR-190) —
 *     anisotropic wood behavior, cross-grain knockdown factors.
 *   - Engineering Toolbox — Young's modulus / Poisson ratio / typical
 *     ductile metal stress-strain shapes.
 *   - ASTM E8 / E9 — tensile and compression test methodology informs the
 *     curve shape (elastic ramp → yield → strain hardening → necking).
 *
 * GAMEPLAY SIMPLIFICATIONS:
 *   - No strain-rate effects. Real metals stiffen at high rates; we model
 *     quasi-static behavior for clarity. The strainRateHz option therefore
 *     only controls sample density along the curve (NOT physics).
 *   - Plastic hardening uses an exponential approach to the ultimate stress:
 *       sigma = sigma_u * (1 - exp(-8 * plastic_strain))
 *     This is a phenomenological smooth curve, not Ramberg-Osgood or
 *     Hollomon. Tuned for a recognizable "ductile metal" silhouette.
 *   - Wood is modeled linear-up-to-80%-ultimate, then plateau, then a hard
 *     drop at fractureStrain. Real wood shows micro-failures earlier; the
 *     plateau is a gameplay simplification.
 *   - Compression behavior simplified per material family:
 *       wood    → 60% of tensile ultimate (matches handbook ratio between
 *                 perpendicular crushing and parallel tension; oversimplified
 *                 since true wood compression depends on grain).
 *       copper  → tensile ultimate, but allowed to absorb 1.5× tensile
 *                 fracture strain before "failure" (it squishes, doesn't
 *                 break).
 *       steel   → tension and compression treated symmetrically up through
 *                 plastic; buckling/instability ignored.
 *   - Toughness score is the trapezoidal area under the curve normalized to
 *     a reference (steel A36 baseline).
 *
 * Pure functions only. No I/O, no global state.
 */

import { getMaterial } from './materialDatabase.js';

// Reference values used for normalizing 0–1 gameplay scores.
const REF_STEEL_E_GPA = 200;
const REF_STEEL_ULTIMATE_MPA = 450;
const REF_STEEL_TOUGHNESS_MPA = 90; // ≈ 0.5 * (250 + 450) MPa * 0.20 strain
const REF_STEEL_DENSITY = 7850;
const REF_STEEL_STRENGTH_PER_DENSITY = REF_STEEL_ULTIMATE_MPA / REF_STEEL_DENSITY;
const REF_MAX_FRACTURE_STRAIN = 0.50; // copper-class ductility ceiling
const REF_MAX_COST = 100;             // costPerUnit ceiling for normalization

const DEFAULT_OPTIONS = Object.freeze({
  strainRateHz: 50,
  gaugeLengthMm: 50,
  crossSectionAreaMm2: 100,
  grainDirection: 'parallel',
});

/**
 * Compute force from stress and cross-section area.
 *   F (N) = sigma (MPa = N/mm²) * A (mm²)
 */
export function calculateForce(stressMPa, crossSectionAreaMm2) {
  return stressMPa * crossSectionAreaMm2;
}

/**
 * Compute displacement from strain and gauge length.
 *   delta (mm) = strain * L0 (mm)
 */
export function calculateDisplacement(strain, gaugeLengthMm) {
  return strain * gaugeLengthMm;
}

/**
 * Apply grain-direction multipliers to wood properties.
 * Returns adjusted { E_GPa, ultimateMPa } pair.
 */
function applyGrainDirection(material, direction) {
  if (!material.anisotropy || !material.grainDirectionMultiplier) {
    return {
      E_GPa: material.elasticModulusGPa,
      ultimateMPa: material.ultimateStrengthMPa,
    };
  }
  const m = material.grainDirectionMultiplier[direction] ?? 1.0;
  return {
    E_GPa: material.elasticModulusGPa * m,
    ultimateMPa: material.ultimateStrengthMPa * m,
  };
}

/**
 * Generate a stress-strain curve for the given test.
 * Returns Array<{ strain, stress, region }> where region ∈ elastic|plastic|failure.
 *
 * @param {object} material - entry from materialDatabase
 * @param {'tensile'|'compression'} testType
 * @param {object} options
 */
export function generateStressStrainCurve(material, testType, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { E_GPa, ultimateMPa: rawUltimate } = applyGrainDirection(
    material,
    opts.grainDirection
  );

  // Compression knockdowns / extensions per material family.
  let ultimateMPa = rawUltimate;
  let fractureStrain = material.fractureStrain;

  if (testType === 'compression') {
    if (material.category === 'wood') {
      // 60% of tensile ultimate — matches handbook ratio of perpendicular
      // crushing to parallel-grain tension.
      ultimateMPa = rawUltimate * 0.60;
    } else if (material.id === 'copper') {
      // Copper crushes, doesn't snap — extend the strain budget.
      fractureStrain = material.fractureStrain * 1.5;
    }
    // Steel: symmetric to tension up through plastic (buckling ignored).
  }

  const E_MPa = E_GPa * 1000;
  // Sample density: at least 60 points; rises gently with strainRateHz so
  // higher-rate tests render as smoother chart curves.
  const sampleCount = Math.max(60, Math.round(opts.strainRateHz * 1.5));
  const points = [];

  // Decide elastic-region end. Metals: yield. Wood: 80% of ultimate
  // (proportional limit approximation).
  const yieldStress =
    material.yieldStrengthMPa != null
      ? material.yieldStrengthMPa
      : ultimateMPa * 0.80;
  const yieldStrain = yieldStress / E_MPa;

  for (let i = 0; i <= sampleCount; i++) {
    const strain = (i / sampleCount) * fractureStrain;
    let stress;
    let region;

    if (strain <= yieldStrain) {
      // Hooke's law.
      stress = E_MPa * strain;
      region = 'elastic';
    } else {
      // Plastic / pre-failure region.
      if (material.category === 'wood') {
        // Linear up to ~80% of ultimate, then a flat plateau at the
        // ultimate, then a hard drop right at fractureStrain.
        if (strain >= fractureStrain * 0.99) {
          stress = ultimateMPa * 0.10; // sudden splinter / drop
          region = 'failure';
        } else {
          stress = ultimateMPa;
          region = 'plastic';
        }
      } else {
        // Ductile metal: exponential approach to ultimate, then necking
        // failure ramp in the last ~5% of the strain budget.
        const plasticStrain = strain - yieldStrain;
        const hardenedYield = yieldStress;
        const climb = (ultimateMPa - hardenedYield) * (1 - Math.exp(-8 * plasticStrain));
        const sigma = Math.min(ultimateMPa, hardenedYield + climb);

        const neckStart = fractureStrain * 0.95;
        if (strain >= neckStart) {
          // Linear ramp from sigma at neckStart down to ~70% at fracture.
          const t = (strain - neckStart) / (fractureStrain - neckStart);
          stress = sigma * (1 - 0.30 * t);
          region = 'failure';
        } else {
          stress = sigma;
          region = 'plastic';
        }
      }
    }

    points.push({ strain, stress, region, x: strain, y: stress });
  }

  return points;
}

/**
 * Locate yield, ultimate, and fracture points on a curve.
 * Returns null entries if not detectable (e.g. yield for brittle wood).
 */
export function detectFailurePoint(curve) {
  if (!curve || curve.length === 0) {
    return { yieldPoint: null, ultimatePoint: null, fracturePoint: null };
  }

  // Last sample is fracture by construction.
  const fracturePoint = curve[curve.length - 1];

  // Ultimate = highest stress along the curve.
  let ultimatePoint = curve[0];
  for (const p of curve) {
    if (p.stress > ultimatePoint.stress) ultimatePoint = p;
  }

  // Yield = first point that left the elastic region.
  let yieldPoint = null;
  for (const p of curve) {
    if (p.region !== 'elastic') {
      yieldPoint = p;
      break;
    }
  }

  return { yieldPoint, ultimatePoint, fracturePoint };
}

/**
 * Trapezoidal area under the stress-strain curve (gameplay toughness proxy).
 * Units: MPa (since strain is unitless).
 */
function curveArea(curve) {
  let area = 0;
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1];
    const b = curve[i];
    area += 0.5 * (a.stress + b.stress) * (b.strain - a.strain);
  }
  return area;
}

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Build the gameplay scoreset for a tested material.
 */
function computeScores(material, curve, effectiveUltimateMPa, effectiveE_GPa) {
  const toughnessMPa = curveArea(curve);
  const toughnessScore = clamp01(toughnessMPa / REF_STEEL_TOUGHNESS_MPA);
  const stiffnessScore = clamp01(effectiveE_GPa / REF_STEEL_E_GPA);
  const strengthScore = clamp01(effectiveUltimateMPa / REF_STEEL_ULTIMATE_MPA);
  const ductilityScore = clamp01(material.fractureStrain / REF_MAX_FRACTURE_STRAIN);
  const costScore = clamp01(1 - material.costPerUnit / REF_MAX_COST);
  const strengthPerDensity = effectiveUltimateMPa / material.densityKgM3;
  const strengthToWeightScore = clamp01(strengthPerDensity / REF_STEEL_STRENGTH_PER_DENSITY);

  return {
    toughnessScore,
    stiffnessScore,
    strengthScore,
    ductilityScore,
    costScore,
    strengthToWeightScore,
  };
}

/**
 * Build the TestResult shell shared by tensile + compression runs.
 */
function buildResult(material, testType, curve, options) {
  const { E_GPa: effE, ultimateMPa: effU } = applyGrainDirection(
    material,
    options.grainDirection || DEFAULT_OPTIONS.grainDirection
  );
  let effectiveUltimate = effU;
  if (testType === 'compression' && material.category === 'wood') {
    effectiveUltimate = effU * 0.60;
  }

  // Max force across the curve, given test cross-section.
  const area = options.crossSectionAreaMm2 || DEFAULT_OPTIONS.crossSectionAreaMm2;
  let maxForceN = 0;
  for (const p of curve) {
    const f = calculateForce(p.stress, area);
    if (f > maxForceN) maxForceN = f;
  }

  return {
    materialId: material.id,
    testType,
    curve,
    summary: {
      maxForceN,
      ultimateStrengthMPa: effectiveUltimate,
      yieldStrengthMPa: material.yieldStrengthMPa,
      elasticModulusGPa: effE,
      fractureStrain: material.fractureStrain,
      densityKgM3: material.densityKgM3,
    },
    scores: computeScores(material, curve, effectiveUltimate, effE),
    unlockedKnowledge: [...material.unlocks],
    questHooks: [...material.questTags],
  };
}

/**
 * Run a tensile test on a material.
 * @param {string} materialId
 * @param {object} [options]
 * @returns {object|null} TestResult, or null if material unknown.
 */
export function runTensileTest(materialId, options = {}) {
  const material = getMaterial(materialId);
  if (!material) return null;
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const curve = generateStressStrainCurve(material, 'tensile', opts);
  return buildResult(material, 'tensile', curve, opts);
}

/**
 * Run a compression test on a material.
 * Wood crushes (lower ultimate), copper deforms (extra strain budget),
 * steel behaves symmetrically to tension (no buckling modeled).
 */
export function runCompressionTest(materialId, options = {}) {
  const material = getMaterial(materialId);
  if (!material) return null;
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const curve = generateStressStrainCurve(material, 'compression', opts);
  return buildResult(material, 'compression', curve, opts);
}

/**
 * Smoke test — runs all 3 seed materials through tensile + compression.
 * Not auto-executed. Call from a Node REPL or a test harness.
 * @returns {object} per-material summary metrics
 */
export function _smokeTest() {
  const ids = ['mesquite_wood', 'structural_steel', 'copper'];
  const out = {};
  for (const id of ids) {
    const t = runTensileTest(id);
    const c = runCompressionTest(id);
    out[id] = {
      tensile: {
        maxForceN: t?.summary.maxForceN,
        ultimateMPa: t?.summary.ultimateStrengthMPa,
        E_GPa: t?.summary.elasticModulusGPa,
        scores: t?.scores,
      },
      compression: {
        maxForceN: c?.summary.maxForceN,
        ultimateMPa: c?.summary.ultimateStrengthMPa,
      },
    };
  }
  return out;
}
