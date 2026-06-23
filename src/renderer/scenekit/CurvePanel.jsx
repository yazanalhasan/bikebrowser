import React, { useEffect, useLayoutEffect, useRef } from 'react';

// Generalized live curve panel shared across scenes (UTM-derived). Configurable
// X axis + dual Y axes, multiple data series, shaded zones, progressive drawing
// gated by a shared progressRef, and staggered annotations after completion.
//
// Props:
//   xAxis: { label, min, max, unit }
//   yAxisLeft / yAxisRight: { label, min, max, unit, color }
//   series: [{ id, label, color, points: [[x,y]...], yAxis: 'left'|'right' }]
//   zones: [{ xStart, xEnd, color }]
//   annotations: [{ label, x, y, yAxis, color }]
//   progressRef: { current: { t } }   isRunning / complete: booleans
const COL = { bg: '#111827', border: '#374151', grid: '#1F2937', axis: '#6B7280', label: '#9CA3AF' };

function niceStep(range, ticks) {
  const raw = range / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / pow;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * pow;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fmt(v) { return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : (v % 1 ? v.toFixed(1) : String(v)); }

export default function CurvePanel({
  xAxis, yAxisLeft, yAxisRight, series = [], zones = [], annotations = [],
  progressRef, isRunning, complete, width = 480, height = 300,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const annotRef = useRef(0);

  const draw = (progress, reveal) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    roundRect(ctx, 0.5, 0.5, width - 1, height - 1, 8);
    ctx.fillStyle = COL.bg; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = COL.border; ctx.stroke();

    const padL = 52, padT = 26, padR = yAxisRight ? 52 : 22, padB = 46;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const X = (x) => padL + ((x - xAxis.min) / (xAxis.max - xAxis.min)) * plotW;
    const YL = (y) => padT + plotH - ((y - yAxisLeft.min) / (yAxisLeft.max - yAxisLeft.min)) * plotH;
    const YR = (y) => padT + plotH - ((y - yAxisRight.min) / (yAxisRight.max - yAxisRight.min)) * plotH;

    // shaded zones
    zones.forEach((z) => {
      const x1 = X(z.xStart), x2 = X(z.xEnd);
      ctx.fillStyle = z.color;
      ctx.fillRect(x1, padT, x2 - x1, plotH);
    });

    // left Y grid + ticks
    ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textBaseline = 'middle';
    const yStepL = niceStep(yAxisLeft.max - yAxisLeft.min, 5);
    for (let v = yAxisLeft.min; v <= yAxisLeft.max + 1e-6; v += yStepL) {
      const y = YL(v);
      ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = yAxisLeft.color; ctx.textAlign = 'right'; ctx.fillText(fmt(v), padL - 6, y);
    }
    // right Y ticks
    if (yAxisRight) {
      const yStepR = niceStep(yAxisRight.max - yAxisRight.min, 5);
      for (let v = yAxisRight.min; v <= yAxisRight.max + 1e-6; v += yStepR) {
        ctx.fillStyle = yAxisRight.color; ctx.textAlign = 'left'; ctx.fillText(fmt(v), padL + plotW + 6, YR(v));
      }
    }
    // X ticks
    ctx.textBaseline = 'top';
    const xStep = niceStep(xAxis.max - xAxis.min, 6);
    for (let v = xAxis.min; v <= xAxis.max + 1e-6; v += xStep) {
      const x = X(v);
      ctx.strokeStyle = COL.axis; ctx.beginPath(); ctx.moveTo(x, padT + plotH); ctx.lineTo(x, padT + plotH + 4); ctx.stroke();
      ctx.fillStyle = COL.label; ctx.textAlign = 'center'; ctx.fillText(fmt(v), x, padT + plotH + 7);
    }
    // axis lines + titles
    ctx.strokeStyle = COL.axis; ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
    ctx.fillStyle = COL.label; ctx.font = '11px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${xAxis.label} (${xAxis.unit})`, padL + plotW / 2, height - 10);
    ctx.save(); ctx.translate(13, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = yAxisLeft.color; ctx.fillText(`${yAxisLeft.label} (${yAxisLeft.unit})`, 0, 0); ctx.restore();
    if (yAxisRight) { ctx.save(); ctx.translate(width - 9, padT + plotH / 2); ctx.rotate(Math.PI / 2); ctx.fillStyle = yAxisRight.color; ctx.fillText(`${yAxisRight.label} (${yAxisRight.unit})`, 0, 0); ctx.restore(); }

    // series (progressive: x up to progress fraction of the range)
    const cutX = xAxis.min + progress * (xAxis.max - xAxis.min);
    series.forEach((s) => {
      const Y = s.yAxis === 'right' && yAxisRight ? YR : YL;
      ctx.lineWidth = 2.4; ctx.strokeStyle = s.color; ctx.lineJoin = 'round'; ctx.beginPath();
      let started = false;
      for (let i = 0; i < s.points.length; i++) {
        const [px, py] = s.points[i];
        if (px > cutX) {
          const prev = s.points[i - 1];
          if (prev) { const f = (cutX - prev[0]) / Math.max(px - prev[0], 1e-6); ctx.lineTo(X(cutX), Y(prev[1] + (py - prev[1]) * f)); }
          break;
        }
        if (!started) { ctx.moveTo(X(px), Y(py)); started = true; } else ctx.lineTo(X(px), Y(py));
      }
      ctx.stroke();
    });

    // annotations after completion (staggered reveal 0..N)
    if (complete && reveal > 0) {
      ctx.font = '11px Inter, system-ui, sans-serif';
      annotations.forEach((a, i) => {
        const r = Math.max(0, Math.min(1, reveal - i));
        if (r <= 0) return;
        const Y = a.yAxis === 'right' && yAxisRight ? YR : YL;
        const x = X(a.x), y = Y(a.y);
        ctx.globalAlpha = r; const c = a.color || '#FACC15';
        ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        const up = i % 2 === 0 ? -1 : 1;
        ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + up * 20); ctx.stroke(); ctx.setLineDash([]);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(a.label, x + 11, y + up * 20);
        ctx.globalAlpha = 1;
      });
    }
    ctx.restore();
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    draw(complete ? 1 : (progressRef?.current?.t ?? 0), annotRef.current);
    // eslint-disable-next-line
  }, [width, height, series, complete]);

  useEffect(() => {
    if (!isRunning) return undefined;
    annotRef.current = 0;
    const tick = () => { draw(progressRef?.current?.t ?? 0, 0); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [isRunning]);

  useEffect(() => {
    if (!complete) { annotRef.current = 0; return undefined; }
    let start = null;
    const step = (ts) => { if (start == null) start = ts; const r = Math.min(annotations.length, (ts - start) / 200); annotRef.current = r; draw(1, r); if (r < annotations.length) rafRef.current = requestAnimationFrame(step); };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [complete]);

  return <canvas ref={canvasRef} style={{ width, height, display: 'block', borderRadius: 8 }} />;
}
