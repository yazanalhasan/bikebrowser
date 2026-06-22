import { buildCurve, densify } from './curveModel.js';
import { STRESS_UNIT } from './utmMaterials.js';

// Shared imperative canvas renderer for the stress–strain curve. Used full-size
// (with axes + annotations) by StressStrainPanel and compact by CurveThumbnail.

const COL = {
  bg: '#111827', border: '#374151', grid: '#1F2937',
  axis: '#6B7280', label: '#9CA3AF', annot: '#FACC15',
};

function niceStep(range, targetTicks) {
  const raw = range / targetTicks;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const step = norm >= 5 ? 5 : norm >= 2 ? 2 : 1;
  return step * pow;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderCurve(ctx, opts) {
  const {
    material, width, height, progress = 1,
    showAxes = true, showAnnotations = false, annotationReveal = 0, dpr = 1,
  } = opts;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // panel background + border
  roundRectPath(ctx, 0.5, 0.5, width - 1, height - 1, 8);
  ctx.fillStyle = COL.bg;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = COL.border;
  ctx.stroke();

  const padL = showAxes ? 48 : 8;
  const padT = showAxes ? 32 : 8;
  const padR = showAxes ? 24 : 8;
  const padB = showAxes ? 48 : 8;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const curve = buildCurve(material);
  const dense = densify(curve.keypoints, 160);
  const maxStrainPct = curve.maxStrain * 100;
  const maxStress = material.UTS * 1.15;

  const X = (ePct) => padL + (ePct / maxStrainPct) * plotW;
  const Y = (s) => padT + plotH - (s / maxStress) * plotH;

  // grid + ticks + axis labels
  if (showAxes) {
    const yStep = niceStep(maxStress, 5);
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    for (let s = 0; s <= maxStress + 1e-6; s += yStep) {
      const y = Y(s);
      ctx.strokeStyle = COL.grid;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.strokeStyle = COL.axis;
      ctx.beginPath(); ctx.moveTo(padL - 4, y); ctx.lineTo(padL, y); ctx.stroke();
      ctx.fillStyle = COL.label; ctx.textAlign = 'right';
      ctx.fillText(s.toFixed(yStep < 1 ? 1 : 0), padL - 7, y);
    }
    const ductile = maxStrainPct > 5;
    const xStep = ductile ? niceStep(maxStrainPct, 6) : Math.max(0.5, niceStep(maxStrainPct, 6));
    ctx.textBaseline = 'top';
    for (let e = 0; e <= maxStrainPct + 1e-6; e += xStep) {
      const x = X(e);
      ctx.strokeStyle = COL.axis;
      ctx.beginPath(); ctx.moveTo(x, padT + plotH); ctx.lineTo(x, padT + plotH + 4); ctx.stroke();
      ctx.fillStyle = COL.label; ctx.textAlign = 'center';
      ctx.fillText(e < 1 ? e.toFixed(1) : e.toFixed(0), x, padT + plotH + 7);
    }
    // axis lines
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
    // axis titles
    ctx.fillStyle = COL.label; ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Strain (%)', padL + plotW / 2, height - 12);
    ctx.save();
    ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Stress (${STRESS_UNIT})`, 0, 0);
    ctx.restore();
  }

  // curve (clipped to progress fraction of the x-range)
  const cutPct = progress * maxStrainPct;
  ctx.lineWidth = showAxes ? 2.5 : 1.6;
  ctx.strokeStyle = material.color;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < dense.length; i++) {
    const ePct = dense[i].e * 100;
    if (ePct > cutPct) {
      // interpolate the final clipped point
      const prev = dense[i - 1];
      if (prev) {
        const prevPct = prev.e * 100;
        const f = (cutPct - prevPct) / Math.max(ePct - prevPct, 1e-6);
        const e = prevPct + (ePct - prevPct) * f;
        const s = prev.s + (dense[i].s - prev.s) * f;
        ctx.lineTo(X(e), Y(s));
      }
      break;
    }
    const px = X(ePct); const py = Y(dense[i].s);
    if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // annotation markers (revealed progressively after the curve is complete)
  if (showAnnotations && annotationReveal > 0) {
    const order = [
      { key: 'proportional', label: 'Proportional Limit', kind: 'circle' },
      { key: 'yield', label: `Yield: ${material.yieldStrength} ${STRESS_UNIT}`, kind: 'diamond' },
      { key: 'uts', label: `UTS: ${material.UTS} ${STRESS_UNIT}`, kind: 'triangle' },
      { key: 'fracture', label: 'Fracture', kind: 'x' },
    ];
    ctx.font = '11px Inter, system-ui, sans-serif';
    order.forEach((m, i) => {
      const reveal = Math.max(0, Math.min(1, annotationReveal - i));
      if (reveal <= 0) return;
      const pt = curve.markers[m.key];
      const x = X(pt.e * 100); const y = Y(pt.s);
      ctx.globalAlpha = reveal;
      ctx.strokeStyle = COL.annot; ctx.fillStyle = COL.annot;
      drawMarker(ctx, m.kind, x, y);
      // dashed leader + label, alternating above/below to reduce overlap
      const up = i % 2 === 0 ? -1 : 1;
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y + up * 22); ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(m.label, x + 13, y + up * 22);
      ctx.globalAlpha = 1;
    });
  }
  ctx.restore();
}

function drawMarker(ctx, kind, x, y) {
  const r = 4;
  ctx.lineWidth = 1.5;
  if (kind === 'circle') { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  else if (kind === 'diamond') { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); }
  else if (kind === 'triangle') { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath(); ctx.fill(); }
  else if (kind === 'x') { ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); }
}
