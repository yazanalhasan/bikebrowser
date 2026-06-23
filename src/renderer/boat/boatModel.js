// Buoyancy (Archimedes), drag, and mission suitability for the hydro tank.
const WATER_DENSITY = 1025; // kg/m³ seawater
const KNOTS_TO_MS = 0.5144;

export function computeBuoyancy(hull, waterDensity = WATER_DENSITY) {
  const draft = hull.displacement_kg / (waterDensity * hull.beam * hull.length);
  const floats = draft < hull.draft_max;
  const KG = draft * 0.6;
  const V = hull.displacement_kg / waterDensity;
  const I = (hull.length * Math.pow(hull.beam, 3)) / 12;
  const BM = I / V;
  const KB = draft / 2;
  const GM = KB + BM - KG;
  let stability;
  if (!floats) stability = 'SINKS';
  else if (GM > 0.5) stability = 'STABLE';
  else if (GM > 0.1) stability = 'MARGINAL';
  else stability = 'CAPSIZE';
  return { draft: Number(draft.toFixed(3)), floats, GM: Number(GM.toFixed(3)), stability };
}

export function computeDrag(hull, speedKnots, waterDensity = WATER_DENSITY) {
  const v = speedKnots * KNOTS_TO_MS;
  let Cd = hull.drag_coefficient * (1 + hull.roughness * 0.35);
  if (hull.hull_form === 'catamaran') {
    const hullSpeed = 2.43 * Math.sqrt(hull.length);
    Cd += Math.exp(-Math.pow(speedKnots - hullSpeed, 2) / 4) * 0.3 + Math.exp(-Math.pow(speedKnots - hullSpeed * 0.6, 2) / 3) * 0.2;
  } else if (hull.hull_form === 'flat_bottom' && speedKnots > 5) {
    Cd += 0.015 * Math.pow(speedKnots - 5, 1.5);
  }
  return 0.5 * waterDensity * Cd * hull.wetted_area_m2 * v * v;
}

export function buildDragCurve(hull) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const s = (i / 40) * hull.maxTowSpeed; pts.push([s, Math.round(computeDrag(hull, s))]); }
  return pts;
}
export const dragMax = (hull) => Math.max(1, Math.round(computeDrag(hull, hull.maxTowSpeed) * 1.15));

export function boatSuitability(hull, buoy, mission) {
  if (!hull || !buoy || !mission) return rating('UNSUITABLE', 'No hull selected.');
  const r = mission.requirements;
  if (!buoy.floats) return rating('UNSUITABLE', `It sinks — draft ${buoy.draft} m exceeds the hull's ${hull.draft_max} m freeboard.`);
  const gmOk = buoy.GM >= r.GM_min;
  const draftOk = buoy.draft <= r.draft_max;
  const speedOk = hull.maxTowSpeed >= r.maxSpeed_min;
  const stableOk = r.stability_min.includes(buoy.stability);
  if (gmOk && draftOk && speedOk && stableOk) return rating('SUITABLE', `Floats with GM ${buoy.GM} m and ${hull.maxTowSpeed} kn top speed — ${buoy.stability.toLowerCase()} and well-suited to the ${mission.name.toLowerCase()}.`);
  const fails = [];
  if (!gmOk) fails.push(`stability GM ${buoy.GM} < ${r.GM_min}`);
  if (!draftOk) fails.push(`draft ${buoy.draft} > ${r.draft_max} m`);
  if (!speedOk) fails.push(`top speed ${hull.maxTowSpeed} < ${r.maxSpeed_min} kn`);
  if (!stableOk) fails.push(`${buoy.stability.toLowerCase()} stability`);
  const near = (gmOk || draftOk) && buoy.stability !== 'CAPSIZE';
  return rating(near ? 'MARGINAL' : 'UNSUITABLE', `${near ? 'Borderline' : 'Unsuitable'} for the ${mission.name.toLowerCase()}: ${fails.join(', ')}.`);
}

function rating(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
