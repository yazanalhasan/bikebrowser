const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const H = 24;     // simulated horizon (hours)
const DT = 0.2;   // sim step
const OD0 = 0.05; // inoculum

// How well the player's conditions match the organism. Returns 0 on a crash.
export function conditionModifier(org, tempC, aerationOn) {
  const tempDelta = Math.abs(tempC - org.optimalTempC);
  if (tempDelta > 10) return { mod: 0, crashed: true, note: `${tempDelta.toFixed(0)}°C off optimum — the culture crashes.` };
  const tempPenalty = clamp(1 - tempDelta * 0.05, 0.1, 1.0);
  let aerPenalty = 1;
  if (org.aerobe === 'aerobe' && !aerationOn) aerPenalty = 0.25;        // needs O₂
  if (org.aerobe === 'anaerobe' && aerationOn) aerPenalty = 0.55;       // O₂ inhibits
  return { mod: tempPenalty * aerPenalty, crashed: false, note: '' };
}

// Logistic growth post-lag; pH drifts down with biomass; product tracks OD.
export function simulate(org, substrate, tempC, aerationOn) {
  const { mod, crashed } = conditionModifier(org, tempC, aerationOn);
  const compatible = substrate.compatibility.includes(org.id);
  const yieldPenalty = compatible ? 1 : 0.5;
  const r = (Math.log(2) / org.doublingTime_h) * mod;
  const K = org.maxOD;
  const odPts = []; const phPts = []; const prodPts = [];
  let N = OD0;
  for (let t = 0; t <= H + 1e-9; t += DT) {
    if (t >= org.lagPhase_h && mod > 0) { const dN = r * N * (1 - N / K) * DT; N = Math.min(K, N + dN); }
    const ph = clamp(org.optimalPH - org.pHDrop * (N - OD0), 2.0, 9.0);
    const product = org.yield * substrate.sugar * (N / K) * yieldPenalty;
    odPts.push([Number(t.toFixed(2)), Number(N.toFixed(3))]);
    phPts.push([Number(t.toFixed(2)), Number(ph.toFixed(2))]);
    prodPts.push([Number(t.toFixed(2)), Number(product.toFixed(1))]);
  }
  const finalOD = N;
  const finalProduct = org.yield * substrate.sugar * (finalOD / K) * yieldPenalty;
  return { mod, crashed, compatible, odPts, phPts, prodPts, finalOD, finalProduct, K, stationaryFrac: finalOD / K };
}

export function fermentResult(org, substrate, tempC, aerationOn) {
  const sim = simulate(org, substrate, tempC, aerationOn);
  let rating;
  if (sim.crashed || sim.mod === 0) rating = rate('UNSUITABLE', `Culture crashed: ${Math.abs(tempC - org.optimalTempC).toFixed(0)}°C from ${org.binomial}'s optimum (${org.optimalTempC}°C). No growth, no product.`);
  else if (sim.stationaryFrac >= 0.85 && sim.compatible && sim.mod >= 0.6) rating = rate('SUITABLE', `Healthy fermentation: reached ${(sim.stationaryFrac * 100).toFixed(0)}% of max biomass and harvested ${sim.finalProduct.toFixed(0)} g/L of ${org.product}. Conditions matched ${org.binomial}.`);
  else rating = rate('MARGINAL', `Sluggish run: ${(sim.stationaryFrac * 100).toFixed(0)}% of max biomass, ${sim.finalProduct.toFixed(0)} g/L ${org.product}.${sim.compatible ? '' : ' Poor substrate match halved the yield.'}${sim.mod < 0.6 ? ' Conditions were off-optimum.' : ''}`);
  return { org, substrate, tempC, aerationOn, ...sim, product: sim.finalProduct, rating };
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
export const SIM_HORIZON = H;
