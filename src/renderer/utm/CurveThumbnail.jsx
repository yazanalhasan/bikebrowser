import React, { useLayoutEffect, useRef } from 'react';
import { renderCurve } from './curveDraw.js';

// Static full-curve thumbnail (no axes), used in the comparison drawer + library.
export default function CurveThumbnail({ material, width = 120, height = 80 }) {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !material) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    renderCurve(ctx, { material, width, height, progress: 1, showAxes: false, dpr });
  }, [material, width, height]);
  return <canvas ref={canvasRef} style={{ width, height, display: 'block', borderRadius: 6 }} />;
}
