import { analyzeTracingAttempt } from './tracingAnalysis.js';
import { scoreHandwritingAttempt } from './handwritingScoring.js';
import {
  loadHandwritingProgress,
  recordHandwritingAttempt,
  saveHandwritingProgress,
} from './adaptiveHandwritingEngine.js';

export function evaluateHandwritingAttempt({
  strokes,
  target,
  mode = 'trace-letter',
  recognizedAs = target,
}) {
  const analysis = analyzeTracingAttempt(strokes, { targetLetter: target });
  const scoring = scoreHandwritingAttempt(analysis, { mode });
  const progress = loadHandwritingProgress();
  const result = recordHandwritingAttempt(progress, {
    target,
    recognizedAs,
    mode,
    metrics: { ...analysis, ...scoring },
  });

  saveHandwritingProgress(result.progress);

  return {
    analysis,
    scoring,
    progress: result.progress,
    reward: result.reward,
    feedback: scoring.encouragement,
  };
}
