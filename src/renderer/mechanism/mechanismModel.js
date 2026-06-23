// Pathway correctness + Michaelis–Menten kinetics.
export function pathwayMatch(enzyme, substrateId, cofactorId) {
  const subOk = enzyme.substrateId === substrateId;
  const cofOk = enzyme.cofactorId === cofactorId;
  return { subOk, cofOk, correct: subOk && cofOk };
}

// v = Vmax·[S] / (Km + [S]); zero turnover unless the pathway is correct.
export function buildMMCurve(enzyme, active) {
  const sMax = Math.max(2, enzyme.Km * 12);
  const pts = [];
  for (let s = 0; s <= sMax + 1e-9; s += sMax / 60) {
    const v = active ? (enzyme.Vmax * s) / (enzyme.Km + s) : 0;
    pts.push([Number(s.toFixed(3)), Number(v.toFixed(2))]);
  }
  return { pts, sMax };
}

export function mechanismResult(enzyme, substrateId, cofactorId) {
  const { subOk, cofOk, correct } = pathwayMatch(enzyme, substrateId, cofactorId);
  const { pts, sMax } = buildMMCurve(enzyme, correct);
  // velocity at saturating [S] = ~Vmax when correct
  const vAtSat = correct ? (enzyme.Vmax * sMax) / (enzyme.Km + sMax) : 0;
  let rating;
  if (correct) rating = rate('SUITABLE', `Pathway assembled: ${enzyme.name} + its substrate + ${cofactorId.toUpperCase()} cofactor catalyses ${enzyme.reaction}. Vmax ≈ ${enzyme.Vmax} µmol/min, Km = ${enzyme.Km} mM → ${enzyme.product}. ${enzyme.summary}`);
  else if (subOk && !cofOk) rating = rate('MARGINAL', `Substrate binds the active site, but the wrong cofactor means no turnover. ${enzyme.name} needs its specific cofactor to complete ${enzyme.reaction}.`);
  else rating = rate('UNSUITABLE', `No reaction: that substrate doesn't fit ${enzyme.name}'s active site — enzymes are substrate-specific (lock and key). Velocity stays at zero.`);
  return { enzyme, substrateId, cofactorId, subOk, cofOk, correct, pts, sMax, vmax: enzyme.Vmax, km: enzyme.Km, vAtSat, rating };
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
