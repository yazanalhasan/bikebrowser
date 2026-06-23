// Vacuum integrity + re-entry heating/ablation model for the chamber.
const SCALE = 608700; // calibrated so PICA peaks ~1650°C
const ABLATION_TIME = 150; // effective heating seconds for ablation (peak window)

export function vacuumIntegrity(m) {
  if (m.outgassing === 'low') return { verdict: 'PASS', message: 'No significant outgassing — structural integrity nominal.' };
  if (m.outgassing === 'medium') return { verdict: 'MARGINAL', message: 'Minor outgassing detected — acceptable with monitoring.' };
  return { verdict: 'FAIL', message: 'Severe outgassing under vacuum — cracks form; cannot proceed to re-entry.' };
}

export function peakTemp(m) {
  let T = SCALE / Math.sqrt(m.k * m.density * m.cp);
  // High-conductivity carbon-carbon: formula underestimates the ablation-free peak.
  if (m.id === 'carbon-carbon') T = Math.min(T * 2.5, 1800);
  return Math.round(Math.max(150, Math.min(T, 2000)));
}

export function buildReentryCurve(m) {
  const Tp = peakTemp(m);
  const pts = [];
  for (let t = 0; t <= 600; t += 10) {
    const temp = t <= 120 ? Tp * Math.sin((t / 120) * (Math.PI / 2)) : Tp * Math.exp(-((t - 120) / 200));
    pts.push([t, Math.max(0, Math.round(temp))]);
  }
  return pts;
}

export function reentryResult(m) {
  const pT = peakTemp(m);
  const ablationLoss = Math.min(Math.round(m.ablationRate * ABLATION_TIME), 30);
  const maxG = 8; // Gaussian peak of the deceleration profile
  const burnThrough = ablationLoss >= 30;
  const overheat = pT > m.maxServiceTemp * 1.15;
  const verdict = burnThrough || overheat ? 'FAIL' : 'PASS';
  const cause = burnThrough ? 'ABLATION_COMPLETE' : overheat ? 'OVERHEAT' : null;
  return { peakTemp: pT, ablationLoss, maxG, verdict, cause };
}

export function spaceSuitability(m, vacuum, reentry, mission) {
  if (!m) return rating('UNSUITABLE', 'No material loaded.');
  if (vacuum.verdict === 'FAIL') return rating('UNSUITABLE', vacuum.message);
  if (reentry.verdict === 'FAIL') return rating('UNSUITABLE', reentry.cause === 'ABLATION_COMPLETE' ? `Heat shield ablates completely (${reentry.ablationLoss} mm) — burn-through.` : `Surface temperature ${reentry.peakTemp}°C exceeds the material's limit.`);
  const r = mission.requirements;
  const ok = reentry.peakTemp <= r.maxPeakTemp && reentry.ablationLoss <= r.maxAblationLoss && r.vacuumIntegrity.includes(vacuum.verdict) && reentry.maxG <= r.maxGForce;
  if (ok) return rating('SUITABLE', `Certified for ${mission.name}: peak ${reentry.peakTemp}°C, ${reentry.ablationLoss} mm ablation, ${vacuum.verdict.toLowerCase()} vacuum.`);
  const fails = [];
  if (reentry.peakTemp > r.maxPeakTemp) fails.push(`peak ${reentry.peakTemp}°C > ${r.maxPeakTemp}`);
  if (reentry.ablationLoss > r.maxAblationLoss) fails.push(`ablation ${reentry.ablationLoss} > ${r.maxAblationLoss} mm`);
  if (!r.vacuumIntegrity.includes(vacuum.verdict)) fails.push(`${vacuum.verdict.toLowerCase()} vacuum`);
  if (reentry.maxG > r.maxGForce) fails.push(`${reentry.maxG}G > ${r.maxGForce}G`);
  return rating('MARGINAL', `Survives re-entry but misses ${mission.name} limits: ${fails.join(', ')}.`);
}

function rating(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
