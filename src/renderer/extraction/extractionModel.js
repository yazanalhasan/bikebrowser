// Polarity matching, yield, chromatogram curves, and extraction result.
export function polarityMatch(plant, solvent) {
  if (plant.polarity === solvent.polarity) return 'HIGH';
  if (solvent.polarity === 'mixed') return 'MEDIUM';
  return 'LOW';
}
export const computeYield = (plant, solvent) => plant.yield[solvent.id] ?? 0;

const MATCH_SCALAR = { HIGH: 1.0, MEDIUM: 0.55, LOW: 0.15 };

// One Gaussian series per chromatogram peak, scaled by yield + polarity match.
export function buildChromatogram(plant, solvent) {
  const match = polarityMatch(plant, solvent);
  const y = computeYield(plant, solvent);
  const yieldScalar = Math.min(1, y / 10);
  return plant.profile.map((peak) => {
    const isFront = peak.name === 'Solvent Front';
    const intensity = isFront ? peak.i * 0.8 : peak.i * yieldScalar * MATCH_SCALAR[match];
    const pts = [];
    const sigma = 0.32;
    for (let x = 0; x <= 12; x += 0.12) pts.push([x, Number((intensity * Math.exp(-Math.pow(x - peak.e, 2) / (2 * sigma * sigma))).toFixed(3))]);
    return { id: peak.name, label: peak.name, color: peak.color, points: pts, yAxis: 'left', _intensity: intensity, _target: !!peak.target };
  });
}

export function extractionResult(plant, solvent) {
  const match = polarityMatch(plant, solvent);
  const y = computeYield(plant, solvent);
  const curves = buildChromatogram(plant, solvent);
  const identified = curves.filter((c) => c._intensity > 0.2).map((c) => c.id);
  const targetPeaks = curves.filter((c) => c._target);
  const targetPresent = targetPeaks.some((c) => c._intensity > 0.2);
  const totalArea = curves.reduce((s, c) => s + c._intensity, 0) || 1;
  const targetArea = targetPeaks.reduce((s, c) => s + c._intensity, 0);
  const purity = Math.round((targetArea / totalArea) * 100);
  let rating;
  if (match === 'HIGH' && y >= 4 && targetPresent) rating = rate('SUITABLE', `Excellent extraction: ${y} g/100g yield, ${purity}% target purity. ${plant.name} is ${plant.polarity}, and ${solvent.name} matches — "like dissolves like".`);
  else if (targetPresent && (match === 'MEDIUM' || y >= 2)) rating = rate('MARGINAL', `Partial extraction: ${y} g/100g, ${purity}% purity. ${solvent.name} only partly matches ${plant.name}'s polarity.`);
  else rating = rate('UNSUITABLE', `Poor extraction: only ${y} g/100g. ${solvent.name} (${solvent.polarity}) does not match ${plant.name} (${plant.polarity}) — the target barely elutes.`);
  return { plant, solvent, yield: y, match, purity, identified, targetPresent, curves, rating };
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
