import { TESTS } from './phytoData.js';

// Each assay is positive when its target compound class is in the extract.
export function runAssays(extract) {
  return TESTS.map((t) => {
    const positive = extract.compounds.includes(t.target);
    return { ...t, positive, color: positive ? t.positiveColor : t.negativeColor };
  });
}

// Absorption spectrum: each positive compound adds a Gaussian band at its λmax,
// height scaled by molar absorptivity (ε). One CurvePanel series per band.
export function buildAbsorptionCurves(assays) {
  return assays.filter((a) => a.positive).map((a) => {
    const peak = Math.min(1, a.epsilon / 8000);
    const sigma = 32;
    const pts = [];
    for (let x = 200; x <= 700; x += 6) pts.push([x, Number((peak * Math.exp(-Math.pow(x - a.lambdaMax, 2) / (2 * sigma * sigma))).toFixed(3))]);
    return { id: a.id, label: `${a.name} (${a.lambdaMax}nm)`, color: a.positiveColor, points: pts, yAxis: 'left', _peak: peak };
  });
}

export function phytoResult(extract) {
  const assays = runAssays(extract);
  const positives = assays.filter((a) => a.positive);
  const identified = positives.map((a) => a.target);
  const curves = buildAbsorptionCurves(assays);
  const n = positives.length;
  let rating;
  if (n >= 3) rating = rate('SUITABLE', `Rich phytochemical fingerprint: ${n} compound classes confirmed (${identified.join(', ')}). The spectrophotometer resolves clean λmax bands — the extract's chemistry is fully characterised.`);
  else if (n === 2) rating = rate('MARGINAL', `Partial fingerprint: only ${n} classes detected (${identified.join(', ')}). Enough to identify, not to fully characterise the plant.`);
  else rating = rate('UNSUITABLE', `Sparse result: ${n} class${n === 1 ? '' : 'es'} detected. This extract is too dilute or too narrow to fingerprint.`);
  return { extract, assays, positives: n, identified, curves, rating };
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
