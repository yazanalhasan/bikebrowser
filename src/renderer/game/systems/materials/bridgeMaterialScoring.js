/**
 * Bridge Material Scoring — given a UTM TestResult and a bridge use case,
 * compute a 0-1 suitability score, a recommendedBridgeUse string, warnings,
 * and alternative-use suggestions.
 *
 * References:
 *   - AASHTO LRFD Bridge Design Specifications — high-level guidance on
 *     selecting structural materials by load class and environment.
 *   - USDA Forest Products Lab Wood Handbook — cross-grain knockdowns
 *     informing the "warning" rules for wood loaded across grain.
 *   - Engineering Toolbox — corrosion behavior of mild steel vs copper
 *     informing environment-tag weights.
 *
 * GAMEPLAY SIMPLIFICATIONS:
 *   - The score is a weighted sum of 0-1 normalized scores from the test
 *     result. No real structural engineering codes are evaluated.
 *   - Environment effects re-weight corrosionResistance only; UV / freeze-
 *     thaw / fatigue interactions are not modeled.
 *   - Threshold gate: strengthScore < 0.30 (and priority !== 'cost')
 *     forces a "not suitable as primary structure" recommendation. Other
 *     priorities still receive numeric scores for ranking.
 *
 * Pure module — no I/O, no state.
 */

/**
 * Default use case for the bridge_collapse quest. The UTM scene should
 * pass this to scoreMaterialForBridge() unless the quest provides its
 * own use case object.
 */
export const BRIDGE_COLLAPSE_USE_CASE = Object.freeze({
  spanMeters: 2,
  loadKg: 100,
  environmentTags: ['desert', 'monsoon'],
  priority: 'balanced',
});

/**
 * Priority-driven base weights. Each row sums to ~1.0 across the five
 * weighted scores below.
 *   stw   = strengthToWeightScore
 *   str   = strengthScore
 *   cost  = costScore
 *   corr  = corrosionResistance (0-1, taken straight off the material)
 *   fat   = fatigueResistance   (0-1, taken straight off the material)
 */
const PRIORITY_WEIGHTS = {
  lightweight:        { stw: 0.50, str: 0.20, cost: 0.05, corr: 0.10, fat: 0.15 },
  maximal_strength:   { stw: 0.10, str: 0.55, cost: 0.05, corr: 0.10, fat: 0.20 },
  balanced:           { stw: 0.25, str: 0.30, cost: 0.15, corr: 0.15, fat: 0.15 },
  cost:               { stw: 0.10, str: 0.20, cost: 0.50, corr: 0.10, fat: 0.10 },
};

/**
 * Environment-tag adjustments. Returns a multiplicative weight bump for
 * specific axes; NOT a re-normalization. Effects compound across tags.
 */
const ENVIRONMENT_TAG_EFFECTS = {
  monsoon: { corrMultiplier: 2.0 }, // wet season — corrosion matters more
  desert:  { corrMultiplier: 0.7 }, // dry — corrosion matters less
  forest:  { corrMultiplier: 1.2 },
  urban:   { corrMultiplier: 1.0 }, // baseline
};

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Compute the bridge suitability for a tested material under a use case.
 *
 * @param {object} testResult - output of runTensileTest / runCompressionTest.
 *   Must include `scores` and `materialId`. May optionally include the raw
 *   material descriptor under testResult.material for richer warnings;
 *   when absent the function falls back to score-only reasoning.
 * @param {object} bridgeUseCase - { spanMeters, loadKg, environmentTags[],
 *   priority }.
 * @returns {object} { bridgeSuitabilityScore, recommendedBridgeUse,
 *   warnings[], alternativeUses[] }
 */
export function scoreMaterialForBridge(testResult, bridgeUseCase) {
  if (!testResult || !testResult.scores) {
    return {
      bridgeSuitabilityScore: 0,
      recommendedBridgeUse: 'No test data available — run a UTM test first.',
      warnings: ['Missing test result.'],
      alternativeUses: [],
    };
  }

  const useCase = bridgeUseCase || BRIDGE_COLLAPSE_USE_CASE;
  const priority = useCase.priority || 'balanced';
  const weights = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS.balanced;
  const tags = useCase.environmentTags || [];

  // Material reference — optional. When the caller threads the original
  // material through testResult.material we get richer warnings; otherwise
  // bias / corrosion / fatigue come straight off the scoreset/material.
  const material = testResult.material || null;
  const corrosionResistance =
    material?.corrosionResistance ?? testResult.scores.corrosionResistance ?? 0.5;
  const fatigueResistance =
    material?.fatigueResistance ?? testResult.scores.fatigueResistance ?? 0.5;
  const bridgeScoreBias = material?.bridgeScoreBias ?? 0;

  // Apply environment-tag multipliers to the corrosion weight.
  let corrMul = 1;
  for (const tag of tags) {
    const effect = ENVIRONMENT_TAG_EFFECTS[tag];
    if (effect?.corrMultiplier != null) corrMul *= effect.corrMultiplier;
  }
  const wCorr = weights.corr * corrMul;

  const { strengthToWeightScore, strengthScore, costScore } = testResult.scores;

  // Weighted base. Note we re-derive the effective weight sum so the
  // environment multiplier doesn't artificially inflate / deflate the
  // overall score scale — keeps results comparable across environments.
  const weightSum = weights.stw + weights.str + weights.cost + wCorr + weights.fat;
  const base =
    (weights.stw * strengthToWeightScore +
      weights.str * strengthScore +
      weights.cost * costScore +
      wCorr * corrosionResistance +
      weights.fat * fatigueResistance) /
    (weightSum || 1);

  // bridgeScoreBias is an additive correction in [-1, +1]; scaled down so
  // a strong bias only nudges 0.10 in the final score.
  const biased = base + bridgeScoreBias * 0.10;
  let bridgeSuitabilityScore = clamp01(biased);

  // Threshold gate.
  const warnings = [];
  const alternativeUses = [];
  let recommendedBridgeUse;

  if (strengthScore < 0.30 && priority !== 'cost') {
    recommendedBridgeUse =
      'Not suitable as primary structure — consider for decorative or sensor roles';
    warnings.push(
      `Strength score ${strengthScore.toFixed(2)} below 0.30 threshold for the "${priority}" priority.`
    );
    if (material?.questTags?.includes('electrical')) {
      alternativeUses.push('bridge sensor wiring', 'health-monitoring strain gauge');
    } else {
      alternativeUses.push('decorative trim', 'non-structural cladding');
    }
  } else if (bridgeSuitabilityScore >= 0.75) {
    recommendedBridgeUse = 'Excellent — primary structural element for this use case';
  } else if (bridgeSuitabilityScore >= 0.55) {
    recommendedBridgeUse = 'Good — viable as a main beam, double-check fatigue under cyclic load';
  } else if (bridgeSuitabilityScore >= 0.40) {
    recommendedBridgeUse = 'Best for early lightweight beams or short spans';
  } else {
    recommendedBridgeUse = 'Marginal — use only with reinforcement or for non-critical members';
  }

  // Environment-aware warnings.
  if (tags.includes('monsoon') && corrosionResistance < 0.5) {
    warnings.push(
      'Corrosion resistance is low — monsoon environment will accelerate degradation. Consider sealing or coating.'
    );
  }
  if (material?.anisotropy && testResult.summary?.elasticModulusGPa &&
      material.elasticModulusGPa &&
      testResult.summary.elasticModulusGPa < material.elasticModulusGPa * 0.5) {
    warnings.push('Cross-grain loading reduces strength 75% — orient grain along load path.');
  }
  if (fatigueResistance < 0.5 && useCase.loadKg && useCase.loadKg > 50) {
    warnings.push(
      'Fatigue resistance is low under the specified load — bridge may degrade over many crossings.'
    );
  }

  // Always-on alternative-use hints driven by quest tags.
  if (material?.questTags?.includes('electrical') && !alternativeUses.includes('bridge sensor wiring')) {
    alternativeUses.push('bridge sensor wiring');
  }

  return {
    bridgeSuitabilityScore,
    recommendedBridgeUse,
    warnings,
    alternativeUses,
  };
}
