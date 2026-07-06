// Shared material-identity visuals for the UTM (load-testing machine). The
// sample used to render as one flat bar tinted only by pass/fail, so steel,
// balsa, bamboo, and concrete were indistinguishable — the test taught nothing
// about WHY a material holds or fails. Each material now reads as its own family
// (warm pixel palette) with a procedural surface texture; failure is curve-driven
// (brittle -> crack, ductile -> bend). Procedural primitives only (no painted
// asset), so this is a freeze-safe clarity edit. Used by the ambient
// neighbourhood rig (the predict-then-test flow now lives in the R3F UTM lab).
export const MATERIAL_VIS = {
  balsa: { base: 0xe7d6a2, detail: 0xc8b173, pattern: 'grain' },
  pine: { base: 0xd2a062, detail: 0xa06a33, pattern: 'grain' },
  bamboo: { base: 0xc4cf72, detail: 0x88a23e, pattern: 'segments' },
  brick: { base: 0xb15538, detail: 0x7c3320, pattern: 'courses' },
  concrete: { base: 0xb3ac9c, detail: 0x827b6b, pattern: 'speckle' },
  iron: { base: 0x8a8c92, detail: 0x585b61, pattern: 'sheen' },
  steel: { base: 0xc1c7d0, detail: 0x8b929c, pattern: 'sheen' },
  carbon_fiber: { base: 0x33373d, detail: 0x6b7078, pattern: 'weave' },
  _default: { base: 0xb9c7bf, detail: 0x6f8079, pattern: 'grain' },
};

export function materialVis(id) {
  return MATERIAL_VIS[id] || MATERIAL_VIS._default;
}

// Draw the material's surface texture (and, if it gave way, a brittle crack)
// onto a Phaser Graphics, centred at the graphics origin and spanning the given
// half-extents. Width-aware so it reads at both the small ambient prop scale and
// the large modal beam. The graphics is expected to share the sample's
// squish/rotation so the texture deforms with the bar.
export function drawMaterialTexture(g, vis, halfW, halfH, cracked = false) {
  if (!g) return;
  g.clear();
  const big = halfW > 40;
  const w = Math.max(2, halfW - 2);
  const h = Math.max(1, halfH - 1);
  const lineW = big ? 2 : 1;
  g.lineStyle(lineW, vis.detail, 0.9);
  switch (vis.pattern) {
    case 'segments': { // bamboo — node bands across the culm
      const step = Math.max(14, (w * 2) / 4);
      for (let x = -w + step; x < w; x += step) g.lineBetween(x, -h, x, h);
      break;
    }
    case 'courses': { // brick — mortar joints, offset top/bottom courses
      g.lineBetween(-w, 0, w, 0);
      const step = Math.max(16, (w * 2) / 6);
      for (let x = -w + step; x < w; x += step) {
        g.lineBetween(x, -h, x, 0);
        g.lineBetween(x - step / 2, 0, x - step / 2, h);
      }
      break;
    }
    case 'speckle': { // concrete — aggregate flecks
      g.fillStyle(vis.detail, 0.85);
      const n = Math.max(5, Math.round(w / 8));
      for (let i = 0; i < n; i += 1) {
        const x = -w + ((i + 0.5) / n) * (w * 2);
        const y = ((i % 3) - 1) * (h * 0.6);
        g.fillCircle(x, y, lineW);
      }
      break;
    }
    case 'sheen': { // metal — bright highlight band over a darker base line
      g.lineStyle(Math.max(2, lineW), 0xffffff, 0.45); g.lineBetween(-w, -h * 0.5, w, -h * 0.5);
      g.lineStyle(lineW, vis.detail, 0.8); g.lineBetween(-w, h * 0.6, w, h * 0.6);
      break;
    }
    case 'weave': { // carbon fibre — fine parallel tows
      const step = big ? 10 : 5;
      for (let x = -w; x <= w; x += step) g.lineBetween(x, -h, x, h);
      break;
    }
    default: { // grain — wood fibres run lengthwise
      g.lineBetween(-w, -h * 0.4, w, -h * 0.4);
      g.lineBetween(-w, h * 0.5, w, h * 0.5);
      if (big) g.lineBetween(-w, 0, w, 0);
    }
  }
  if (cracked) { // jagged fracture — the brittle-snap teaching beat
    g.lineStyle(Math.max(1.6, lineW), 0x9a2f1a, 1);
    g.beginPath();
    g.moveTo(0, -h - 2); g.lineTo(-3, -1); g.lineTo(3, 2); g.lineTo(-1, h + 2);
    g.strokePath();
  }
}
