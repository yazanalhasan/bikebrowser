import React, { useEffect, useRef } from 'react';

// 2D eyepiece render: cells drawn into a circular field, blurred by focus and
// tinted by stain. Reads scopeRef {focus, mag, stained} each frame.
export default function EyepieceView({ slide, stain, scopeRef, size = 340 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    let raf = 0;
    const draw = () => {
      const s = scopeRef?.current || { focus: 0, mag: 10, stained: false };
      const r = size / 2;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.clip();
      // field background
      ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, size, size);
      const base = slide ? slide.color : '#888';
      const tint = slide && s.stained ? slide.stainColor : base;
      ctx.fillStyle = tint; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // focus blur
      const blur = (1 - (s.focus || 0)) * 9;
      ctx.filter = `blur(${blur.toFixed(2)}px)`;
      const cell = 26 + (s.mag || 4) * 1.6; // larger at higher mag
      ctx.strokeStyle = 'rgba(40,30,20,0.55)'; ctx.lineWidth = 2;
      if (slide) drawCells(ctx, slide, s, size, cell, tint);
      ctx.filter = 'none';
      ctx.restore();
      // eyepiece vignette ring
      ctx.strokeStyle = '#11161d'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [slide, stain, scopeRef, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="scope-eye" />;
}

function drawCells(ctx, slide, s, size, cell, tint) {
  const cols = Math.max(2, Math.floor(size / cell));
  const nucleusVisible = s.stained && (s.mag >= 10);
  const darker = shade(tint, -40);
  for (let gx = -1; gx <= cols; gx++) {
    for (let gy = -1; gy <= cols; gy++) {
      const x = gx * cell + (gy % 2) * (cell / 4);
      const y = gy * cell;
      ctx.fillStyle = shade(tint, gx % 2 ? -8 : 8);
      if (slide.shape === 'brick') {
        ctx.fillRect(x, y, cell - 3, cell * 0.6 - 3);
        ctx.strokeRect(x, y, cell - 3, cell * 0.6 - 3);
        if (nucleusVisible) { ctx.fillStyle = darker; ctx.beginPath(); ctx.arc(x + cell * 0.5, y + cell * 0.3, cell * 0.12, 0, Math.PI * 2); ctx.fill(); }
      } else if (slide.shape === 'blob') {
        ctx.beginPath(); ctx.ellipse(x + cell / 2, y + cell / 2, cell * 0.42, cell * 0.32, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (nucleusVisible && s.mag >= 40) { ctx.fillStyle = darker; ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * 0.14, 0, Math.PI * 2); ctx.fill(); }
      } else { // tissue — layered cells with green chloroplast granules at 40x
        ctx.fillRect(x, y, cell - 2, cell - 2); ctx.strokeRect(x, y, cell - 2, cell - 2);
        if (s.mag >= 40) { ctx.fillStyle = '#2f7d32'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 4 + (k % 2) * (cell * 0.5), y + 4 + Math.floor(k / 2) * (cell * 0.5), cell * 0.07, 0, Math.PI * 2); ctx.fill(); } }
      }
    }
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}
