function clampScore(value) {
  return Math.max(0, Math.min(5, Math.round(value)));
}

export function scoreHandwritingAttempt(analysis, context = {}) {
  const effortScore = clampScore((analysis.completion || 0) * 4 + Math.min(1, analysis.strokeCount || 1));
  const legibilityScore = clampScore(((analysis.overlap || 0) * 0.65 + (analysis.smoothness || 0) * 0.35) * 5);
  const orientationScore = clampScore((analysis.orientationScore || 0) * 5);
  const consistencyScore = clampScore(((analysis.directionSimilarity || 0) * 0.6 + (analysis.smoothness || 0) * 0.4) * 5);
  const previousBest = context.previousBest?.finalRewardScore || 0;
  const baseImprovement = Math.max(0, Math.max(legibilityScore, orientationScore) - previousBest);
  const improvementScore = clampScore(baseImprovement + (analysis.completion >= 0.7 ? 1 : 0));
  const hesitationSupport = analysis.hesitationCount > 2 ? -0.4 : 0.4;
  const finalRewardScore = clampScore(
    effortScore * 0.34
    + improvementScore * 0.24
    + orientationScore * 0.18
    + consistencyScore * 0.14
    + legibilityScore * 0.1
    + hesitationSupport,
  );

  const encouragement = finalRewardScore >= 4 || improvementScore >= 1
    ? 'Nice improvement! Your letter is getting easier to read.'
    : 'Good effort. Try tracing the guide slowly one more time.';

  return {
    effortScore,
    legibilityScore,
    orientationScore,
    improvementScore,
    consistencyScore,
    finalRewardScore: Math.max(1, finalRewardScore),
    rewardTypes: [
      effortScore >= 3 ? 'Effort Stars' : null,
      improvementScore >= 2 ? 'Improvement Bonus' : null,
      orientationScore >= 4 ? 'Orientation Mastery' : null,
      legibilityScore >= 4 ? 'Legibility Reward' : null,
      consistencyScore >= 4 ? 'Consistency Streak' : null,
      analysis.completion >= 0.8 ? 'Trace Completion' : null,
      context.mode?.includes('memory') ? 'Memory Writing Bonus' : null,
    ].filter(Boolean),
    encouragement,
  };
}
