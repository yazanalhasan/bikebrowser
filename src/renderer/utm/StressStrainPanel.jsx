import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { renderCurve } from './curveDraw.js';

// Stress–strain panel (Section 3). Draws incrementally from a shared progressRef
// while the test runs (no per-frame React re-render), then animates the four
// annotation markers in with a staggered fade once the test completes.
export default function StressStrainPanel({ material, progressRef, isRunning, testComplete, width = 480, height = 360 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const annotRef = useRef(0); // 0..4 reveal counter

  const paint = (progress, annotationReveal) => {
    const canvas = canvasRef.current;
    if (!canvas || !material) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    renderCurve(ctx, { material, width, height, progress, showAxes: true, showAnnotations: testComplete, annotationReveal, dpr });
  };

  // size the backing store for crisp lines
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    paint(testComplete ? 1 : (progressRef?.current?.t ?? 0), annotRef.current);
  }, [width, height, material?.id]);

  // live incremental draw while running
  useEffect(() => {
    if (!isRunning) return undefined;
    annotRef.current = 0;
    const tick = () => {
      paint(progressRef?.current?.t ?? 0, 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, material?.id]);

  // staggered annotation reveal after completion (~200ms per marker)
  useEffect(() => {
    if (!testComplete) { annotRef.current = 0; paint(0, 0); return undefined; }
    let start = null;
    const STAGGER = 200;
    const step = (ts) => {
      if (start == null) start = ts;
      const reveal = Math.min(4, (ts - start) / STAGGER);
      annotRef.current = reveal;
      paint(1, reveal);
      if (reveal < 4) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [testComplete, material?.id]);

  return <canvas ref={canvasRef} className="utm-curve-canvas" style={{ width, height }} />;
}
