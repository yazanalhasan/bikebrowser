function hasValue(value) {
  return value !== undefined && value !== null && `${value}`.trim() !== '';
}

function evaluateWheelFrameFit(profile) {
  const missing = [];
  if (!hasValue(profile.wheelSizeIn)) missing.push('Wheel size (inches)');
  if (!hasValue(profile.frameSizeCm)) missing.push('Frame size (cm)');

  if (missing.length > 0) {
    return {
      id: 'wheel-frame-fit',
      title: 'Wheel and Frame Fit',
      status: 'needs-info',
      confidence: 0.35,
      summary: 'Need frame and wheel measurements to validate clearance.',
      missingMeasurements: missing,
    };
  }

  const wheel = Number(profile.wheelSizeIn);
  const frame = Number(profile.frameSizeCm);
  const likelyFit =
    (wheel <= 20 && frame <= 38) ||
    (wheel > 20 && wheel <= 26 && frame >= 35 && frame <= 52) ||
    (wheel > 26 && frame >= 48);

  return {
    id: 'wheel-frame-fit',
    title: 'Wheel and Frame Fit',
    status: likelyFit ? 'compatible' : 'caution',
    confidence: likelyFit ? 0.86 : 0.62,
    summary: likelyFit
      ? 'Wheel/frame dimensions look reasonable for a starter build.'
      : 'Wheel and frame sizing may be mismatched. Double-check tire/frame clearance.',
    missingMeasurements: [],
  };
}

function evaluateRiderFit(profile) {
  const missing = [];
  if (!hasValue(profile.riderHeightCm)) missing.push('Rider height (cm)');
  if (!hasValue(profile.frameSizeCm)) missing.push('Frame size (cm)');

  if (missing.length > 0) {
    return {
      id: 'rider-fit',
      title: 'Rider Fit',
      status: 'needs-info',
      confidence: 0.34,
      summary: 'Need rider height and frame size to verify fit.',
      missingMeasurements: missing,
    };
  }

  const height = Number(profile.riderHeightCm);
  const frame = Number(profile.frameSizeCm);
  const ratio = frame / Math.max(height, 1);

  let status = 'compatible';
  let summary = 'Frame sizing appears safe for rider height.';

  if (ratio < 0.22 || ratio > 0.34) {
    status = 'caution';
    summary = 'Frame-to-rider sizing ratio is outside typical range; review geometry before buying.';
  }

  return {
    id: 'rider-fit',
    title: 'Rider Fit',
    status,
    confidence: status === 'compatible' ? 0.83 : 0.59,
    summary,
    missingMeasurements: [],
  };
}

function evaluateStandoverWheelSafety(profile) {
  const missing = [];
  if (!hasValue(profile.riderHeightCm)) missing.push('Rider height (cm)');
  if (!hasValue(profile.wheelSizeIn)) missing.push('Wheel size (inches)');

  if (missing.length > 0) {
    return {
      id: 'standover-wheel-safety',
      title: 'Standover and Wheel Size Safety',
      status: 'needs-info',
      confidence: 0.35,
      summary: 'Need rider height and wheel size to evaluate standover risk.',
      missingMeasurements: missing,
    };
  }

  const riderHeight = Number(profile.riderHeightCm);
  const wheelSize = Number(profile.wheelSizeIn);

  if (riderHeight < 148 && wheelSize === 29) {
    return {
      id: 'standover-wheel-safety',
      title: 'Standover and Wheel Size Safety',
      status: 'incompatible',
      confidence: 0.9,
      summary:
        '29-inch wheels are likely unsafe for this rider height due to standover and control constraints. Prefer 27.5 wheels with XS/small frame geometry.',
      missingMeasurements: [],
    };
  }

  if (riderHeight < 155 && wheelSize === 29) {
    return {
      id: 'standover-wheel-safety',
      title: 'Standover and Wheel Size Safety',
      status: 'caution',
      confidence: 0.82,
      summary:
        '29-inch wheels may be a poor fit for this rider height. Check standover clearance and consider 27.5 wheels with XS/small frame sizing.',
      missingMeasurements: [],
    };
  }

  return {
    id: 'standover-wheel-safety',
    title: 'Standover and Wheel Size Safety',
    status: 'compatible',
    confidence: 0.87,
    summary: 'Wheel size and rider height do not indicate a major standover safety issue.',
    missingMeasurements: [],
  };
}

function evaluateBudget(plan, profile) {
  const estimate = plan.checklist.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);
  const budget = Number(profile.budgetUsd || 0);

  if (!budget) {
    return {
      id: 'budget-check',
      title: 'Budget Feasibility',
      status: 'needs-info',
      confidence: 0.4,
      summary: 'Add a budget to verify the checklist can be completed safely.',
      missingMeasurements: ['Budget (USD)'],
    };
  }

  const ratio = estimate / Math.max(budget, 1);
  const status = ratio <= 0.9 ? 'compatible' : ratio <= 1.1 ? 'caution' : 'incompatible';

  return {
    id: 'budget-check',
    title: 'Budget Feasibility',
    status,
    confidence: status === 'compatible' ? 0.9 : status === 'caution' ? 0.66 : 0.88,
    summary:
      status === 'compatible'
        ? `Estimated parts total is about $${estimate.toFixed(0)} and fits the budget.`
        : status === 'caution'
          ? `Estimated parts total is about $${estimate.toFixed(0)} and is close to the budget limit.`
          : `Estimated parts total is about $${estimate.toFixed(0)} and exceeds budget.`,
    missingMeasurements: [],
  };
}

export function runCompatibilityReview(plan, profile) {
  const cards = [
    evaluateWheelFrameFit(profile),
    evaluateRiderFit(profile),
    evaluateStandoverWheelSafety(profile),
    evaluateBudget(plan, profile),
  ];

  const missingMeasurements = new Set(plan.missingMeasurements || []);
  cards.forEach((card) => {
    (card.missingMeasurements || []).forEach((entry) => missingMeasurements.add(entry));
  });

  const warnings = [...(plan.warnings || [])];
  const incompatibleCount = cards.filter((card) => card.status === 'incompatible').length;
  const standoverCard = cards.find((card) => card.id === 'standover-wheel-safety');

  if (standoverCard && (standoverCard.status === 'caution' || standoverCard.status === 'incompatible')) {
    warnings.push(
      'Rider height and wheel size may create standover issues. Consider 27.5 wheels and XS/small frame to improve fit and control.'
    );
  }

  if (incompatibleCount > 0) {
    warnings.push('One or more compatibility checks failed. Resolve these before purchasing components.');
  }

  return {
    compatibilityCards: cards,
    warnings,
    missingMeasurements: Array.from(missingMeasurements),
  };
}
