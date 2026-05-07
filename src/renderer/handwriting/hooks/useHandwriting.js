import { useCallback, useMemo, useState } from 'react';
import { evaluateHandwritingAttempt } from '../engine/handwritingEngine.js';

export function useHandwriting({ target = 'b', mode = 'trace-letter', onEvaluated } = {}) {
  const [strokes, setStrokes] = useState([]);
  const [result, setResult] = useState(null);
  const hasInk = strokes.some((stroke) => stroke.length > 1);

  const evaluate = useCallback((nextStrokes = strokes) => {
    const evaluation = evaluateHandwritingAttempt({ strokes: nextStrokes, target, mode });
    setResult(evaluation);
    onEvaluated?.(evaluation);
    return evaluation;
  }, [mode, onEvaluated, strokes, target]);

  const clear = useCallback(() => {
    setStrokes([]);
    setResult(null);
  }, []);

  return useMemo(() => ({
    strokes,
    setStrokes,
    hasInk,
    result,
    evaluate,
    clear,
  }), [clear, evaluate, hasInk, result, strokes]);
}
