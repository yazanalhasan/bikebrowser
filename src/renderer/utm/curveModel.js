// Builds a stress–strain curve as an ordered list of keypoints {e (strain
// fraction), s (stress, relative units)} plus the four annotation markers, for a
// given material. Shapes differ per material.curveType so steel, concrete, carbon
// fibre etc. read as visually distinct curves. All numbers derive from the
// material's existing curve data (elasticLimit, UTS, fractureStrain) + derived
// yield — nothing is invented at draw time.

export function buildCurve(material) {
  const sy = material.yieldStrength;
  const su = material.UTS;
  const eL = material.elasticLimit; // strain at proportional limit
  const ef = Math.max(material.fractureStrain, eL * 1.05);

  let keypoints;
  let markers;

  switch (material.curveType) {
    case 'brittle': {
      // Near-perfectly linear to a short, sudden fracture.
      const ePL = ef * 0.9;
      keypoints = [
        { e: 0, s: 0 },
        { e: ePL, s: su * 0.92 },
        { e: ef, s: su },
      ];
      markers = {
        proportional: { e: ePL, s: su * 0.92 },
        yield: { e: ef * 0.97, s: su * 0.99 }, // brittle: no real yield, sits at the top
        uts: { e: ef, s: su },
        fracture: { e: ef, s: su },
      };
      break;
    }
    case 'composite': {
      // Very steep, almost linear to a sudden high-stress brittle fracture.
      const ePL = ef * 0.88;
      const eNear = ef * 0.96;
      keypoints = [
        { e: 0, s: 0 },
        { e: ePL, s: su * 0.86 },
        { e: eNear, s: su * 0.97 },
        { e: ef, s: su },
      ];
      markers = {
        proportional: { e: ePL, s: su * 0.86 },
        yield: { e: eNear, s: su * 0.97 },
        uts: { e: ef, s: su },
        fracture: { e: ef, s: su },
      };
      break;
    }
    case 'polymer': {
      const eYield = eL;
      const eDrop = eL * 1.6;
      const ePlateauEnd = ef * 0.9;
      keypoints = [
        { e: 0, s: 0 },
        { e: eYield, s: sy }, // upper yield peak
        { e: eDrop, s: sy * 0.8 }, // yield drop
        { e: ePlateauEnd, s: sy * 0.85 }, // cold-draw plateau
        { e: ef, s: su }, // final rise to fracture
      ];
      markers = {
        proportional: { e: eYield * 0.8, s: sy * 0.85 },
        yield: { e: eYield, s: sy },
        uts: { e: ef, s: su },
        fracture: { e: ef, s: su },
      };
      break;
    }
    case 'ductile_metal':
    default: {
      // Linear rise → yield → (optional) plateau → strain-harden to UTS → drop to fracture.
      const ePL = eL;
      const eYield = eL * 1.12;
      const hasPlateau = Boolean(material.curveParams?.yieldPlateau) || material.id === 'steel' || material.id === 'iron';
      const plateauLen = hasPlateau ? (ef - eYield) * 0.16 : 0;
      const ePlateau = eYield + plateauLen;
      const eUTS = clamp(material.curveParams?.neckingStrain ?? ePlateau + (ef - ePlateau) * 0.6, ePlateau + 1e-4, ef * 0.96);
      keypoints = [
        { e: 0, s: 0 },
        { e: ePL, s: sy * 0.92 },
        { e: eYield, s: sy },
        ...(plateauLen > 0 ? [{ e: ePlateau, s: sy * 1.01 }] : []),
        { e: eUTS, s: su },
        { e: ef, s: su * 0.82 },
      ];
      markers = {
        proportional: { e: ePL, s: sy * 0.92 },
        yield: { e: eYield, s: sy },
        uts: { e: eUTS, s: su },
        fracture: { e: ef, s: su * 0.82 },
      };
      break;
    }
  }

  const maxStrain = ef;
  const maxStress = su;
  return { keypoints, markers, maxStrain, maxStress, curveType: material.curveType };
}

// Resample keypoints into a smooth dense polyline (Catmull-Rom → many points) so
// the panel/thumbnail can clip it cleanly by strain without visible kinks.
export function densify(keypoints, steps = 120) {
  if (keypoints.length < 2) return keypoints.slice();
  const pts = keypoints;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const seg = Math.max(2, Math.round(steps / (pts.length - 1)));
    for (let j = 0; j < seg; j++) {
      const t = j / seg;
      out.push({ e: catmull(p0.e, p1.e, p2.e, p3.e, t), s: Math.max(0, catmull(p0.s, p1.s, p2.s, p3.s, t)) });
    }
  }
  out.push(pts[pts.length - 1]);
  // keep strictly increasing in e for clean clipping
  for (let i = 1; i < out.length; i++) if (out[i].e < out[i - 1].e) out[i].e = out[i - 1].e;
  return out;
}

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
