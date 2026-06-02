// Phase 1.7 — Reasoning Grader (a LEARNING system, not a score calculator).
// It evaluates HOW the player reasoned, not whether they were lucky. Evidence
// usage and correction-after-failure are weighted above raw correctness, so:
//   wrong prediction + high confidence + a real test + belief updated  -> strong
//   lucky guess + no evidence + no explanation                         -> developing
// The grade always comes with teaching feedback: why right, why wrong, how to improve.
export class ReasoningGrader {
  static assess(context = {}) {
    const predictions = context.predictions || [];
    const resolved = predictions.filter((p) => p.resolved);
    const testedCount = context.testedCount || 0;
    const bridgePlan = context.bridgePlan || null;
    const wrong = resolved.filter((p) => !p.correct);
    const right = resolved.filter((p) => p.correct);

    // 1. Prediction quality — did the player commit a hypothesis before testing?
    const prediction = predictions.length >= 2 ? 1 : predictions.length === 1 ? 0.6 : 0;

    // 2. Evidence usage — did they gather test evidence rather than guess?
    const evidence = Math.min(1, testedCount / 4);

    // 3. Correction after failure — the core learning signal: after a wrong
    //    prediction, did the player avoid trusting the failed material?
    const bridgeMaterials = bridgePlan ? [bridgePlan.deck, bridgePlan.supports, bridgePlan.braces] : [];
    const usedWeakInBridge = bridgeMaterials.includes('weak_scrap');
    let correction;
    if (wrong.length === 0) correction = resolved.length ? 0.8 : 0; // nothing to correct
    else if (bridgePlan && !usedWeakInBridge) correction = 1; // learned: did not reuse the failed material
    else if (!bridgePlan) correction = 0.4; // wrong, no follow-through yet
    else correction = 0.3; // repeated the mistake despite the evidence

    // 4. Confidence calibration — high confidence should track being right.
    const calHits = resolved.filter((p) =>
      (p.confidence === 'high' && p.correct) ||
      (p.confidence === 'low' && !p.correct) ||
      p.confidence === 'medium'
    ).length;
    const calibration = resolved.length ? calHits / resolved.length : 0;

    // 5. Explanation quality — did the player say WHY (testable reasoning)?
    const explained = predictions.filter((p) => (p.explanation || '').trim().length > 0).length;
    const explanation = predictions.length ? Math.max(0.3, explained / predictions.length) : 0;

    const overall = Number((0.2 * prediction + 0.3 * evidence + 0.3 * correction + 0.1 * calibration + 0.1 * explanation).toFixed(2));
    const band = overall >= 0.75 ? 'strong' : overall >= 0.5 ? 'solid' : 'developing';

    const learnings = [];
    right.forEach((p) => learnings.push(`You predicted ${p.subjectId} would ${p.willHold ? 'hold' : 'fail'} and the test agreed — your reasoning matched the evidence.`));
    wrong.forEach((p) => {
      learnings.push(
        bridgePlan && !usedWeakInBridge
          ? `You predicted ${p.subjectId} would hold, the test proved otherwise, and you did not trust it in the bridge — that is exactly how to learn from evidence.`
          : `You predicted ${p.subjectId} would hold, but the test failed it. Update your plan so you do not rely on it.`
      );
    });
    if (explanation < 0.5) learnings.push('To improve: say WHY before you test — naming your reasoning makes it checkable.');
    if (evidence < 1) learnings.push('To improve: test every candidate before you decide.');

    return {
      dimensions: {
        prediction: { score: prediction },
        evidence: { score: Number(evidence.toFixed(2)) },
        correction: { score: Number(correction.toFixed(2)) },
        calibration: { score: Number(calibration.toFixed(2)) },
        explanation: { score: Number(explanation.toFixed(2)) },
      },
      overall,
      band,
      learnings,
      // The grader rewards reasoning quality, not correctness alone.
      rewardsReasoningNotCorrectness: true,
    };
  }
}
