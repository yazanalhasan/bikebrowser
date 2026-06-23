// Load & crash test models, material-driven (game 0–10 scale from UTM_MATERIALS,
// mapped to teaching-friendly engineering numbers). curveType shapes the failure.
import { VEHICLE_TASKS } from './vehicleTasks.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── Load test (frame integrity) ──────────────────────────────────────────────
export function computeLoadResult(material) {
  const ultimateLoadKN = Math.round(material.UTS * 10); // UTS 0–10 → 0–100 kN
  const maxDeflectionMm = Number(clamp(30 - material.stiffness * 2.4, 4, 32).toFixed(1));
  return { material, ultimateLoadKN, maxDeflectionMm, curve: buildLoadCurve(material, ultimateLoadKN, maxDeflectionMm) };
}

// Force (kN) vs deflection (mm), shape by curveType.
export function buildLoadCurve(material, ult, maxDefl) {
  const k = [];
  const t = material.curveType;
  if (t === 'brittle' || t === 'composite') {
    k.push([0, 0], [maxDefl * 0.95, ult * 0.95], [maxDefl, ult], [maxDefl, ult * 0.1]); // near-linear then sudden drop
  } else {
    // ductile: elastic → yield → ultimate → drop
    k.push([0, 0], [maxDefl * 0.35, ult * 0.6], [maxDefl * 0.45, ult * 0.66], [maxDefl * 0.8, ult], [maxDefl, ult * 0.82]);
  }
  // densify to a smooth polyline
  const pts = [];
  for (let i = 0; i < k.length - 1; i++) {
    const [x0, y0] = k[i]; const [x1, y1] = k[i + 1];
    for (let s = 0; s < 8; s++) { const f = s / 8; pts.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]); }
  }
  pts.push(k[k.length - 1]);
  return pts;
}

export function evaluateLoad(result) {
  const { suitable: s, marginal: m } = VEHICLE_TASKS.frame_integrity;
  if (result.ultimateLoadKN >= s.minUltimateLoadKN && result.maxDeflectionMm <= s.maxDeflectionMm)
    return rating('SUITABLE', `Holds ${result.ultimateLoadKN} kN with only ${result.maxDeflectionMm} mm deflection — well within frame limits.`);
  if (result.ultimateLoadKN >= m.minUltimateLoadKN && result.maxDeflectionMm <= m.maxDeflectionMm)
    return rating('MARGINAL', `Survives at ${result.ultimateLoadKN} kN but deflection (${result.maxDeflectionMm} mm) leaves little margin.`);
  return rating('UNSUITABLE', `Ultimate load ${result.ultimateLoadKN} kN / deflection ${result.maxDeflectionMm} mm fail the frame-integrity limits. ${result.material.failureMode || ''}`);
}

// ── Crash test (passenger safety) ────────────────────────────────────────────
export function computeCrashResult(material, speedKmh = 50) {
  // ductile (high elongation) crumple zones absorb energy → lower G to occupants.
  const energyAbsorptionPct = Math.round(clamp(35 + material.elongationAtBreak * 2.4, 20, 95));
  const peakGForce = Math.round(clamp(40 + speedKmh * 0.55 - energyAbsorptionPct * 0.55, 18, 170));
  const intrusionMm = Math.round(clamp(360 - material.UTS * 14 - energyAbsorptionPct * 1.1 + speedKmh * 0.6, 40, 420));
  const safetyRating = energyAbsorptionPct >= 70 && peakGForce <= 50 ? 5 : energyAbsorptionPct >= 50 ? 3 : 1;
  return { material, speedKmh, energyAbsorptionPct, peakGForce, intrusionMm, safetyRating };
}

export function evaluateCrash(result) {
  const { suitable: s, marginal: m } = VEHICLE_TASKS.passenger_safety;
  if (result.peakGForce <= s.maxPeakGForce && result.intrusionMm <= s.maxIntrusionMm && result.energyAbsorptionPct >= s.minEnergyAbsorptionPct)
    return rating('SUITABLE', `Peak ${result.peakGForce} G, ${result.intrusionMm} mm intrusion, ${result.energyAbsorptionPct}% energy absorbed — protects the occupant.`);
  if (result.peakGForce <= m.maxPeakGForce && result.intrusionMm <= m.maxIntrusionMm && result.energyAbsorptionPct >= m.minEnergyAbsorptionPct)
    return rating('MARGINAL', `Survivable but harsh: ${result.peakGForce} G, ${result.intrusionMm} mm intrusion.`);
  return rating('UNSUITABLE', `${result.peakGForce} G and ${result.intrusionMm} mm intrusion exceed safe limits — only ${result.energyAbsorptionPct}% energy absorbed. ${result.material.failureMode || ''}`);
}

function rating(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  const icon = label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x';
  return { label, color, icon, reason };
}
