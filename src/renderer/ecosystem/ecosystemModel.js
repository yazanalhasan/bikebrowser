import { PARAMS, CAPS } from './ecosystemData.js';

const DT = 0.1;            // Euler step (years)
export const HORIZON = 80; // simulated years
const STEPS = Math.round(HORIZON / DT);

// dP/dt = r_P·P − a_PH·P·H
// dH/dt = b_PH·P·H − d_H·H − a_HC·H·C
// dC/dt = b_HC·H·C − d_C·C
// dD/dt = d_H·H + d_C·C − k_D·D
export function buildSeries(initialPops, params = PARAMS, caps = CAPS) {
  const p = params;
  let P = initialPops.plants, H = initialPops.herbivores, C = initialPops.predators, D = initialPops.decomposers;
  const out = [{ year: 0, plants: P, herbivores: H, predators: C, decomposers: D }];
  for (let i = 1; i <= STEPS; i++) {
    const dP = (p.r_P * P - p.a_PH * P * H) * DT;
    const dH = (p.b_PH * P * H - p.d_H * H - p.a_HC * H * C) * DT;
    const dC = (p.b_HC * H * C - p.d_C * C) * DT;
    const dD = (p.d_H * H + p.d_C * C - p.k_D * D) * DT;
    P = Math.max(0, Math.min(P + dP, caps.plants));
    H = Math.max(0, Math.min(H + dH, caps.herbivores));
    C = Math.max(0, Math.min(C + dC, caps.predators));
    D = Math.max(0, Math.min(D + dD, caps.decomposers));
    if (i % 4 === 0) out.push({ year: Number((i * DT).toFixed(1)), plants: P, herbivores: H, predators: C, decomposers: D });
  }
  return out;
}

// Stable if every non-extinct level stays within ±12% of its mean over the
// final ~25 years.
function stability(series) {
  const win = series.slice(-Math.floor(series.length * 0.3));
  const keys = ['plants', 'herbivores', 'predators', 'decomposers'];
  let worst = 0;
  for (const k of keys) {
    const vals = win.map((p) => p[k]).filter((v) => v > 0.5);
    if (!vals.length) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (mean <= 0) continue;
    const dev = Math.max(...vals.map((v) => Math.abs(v - mean) / mean));
    worst = Math.max(worst, dev);
  }
  return worst;
}

export function ecosystemResult(initialPops, params = PARAMS) {
  const series = buildSeries(initialPops, params);
  const last = series[series.length - 1];
  const extinct = ['plants', 'herbivores', 'predators'].filter((k) => last[k] < 1);
  const worstDev = stability(series);
  let rating;
  if (extinct.length) rating = rate('UNSUITABLE', `Collapse: ${extinct.join(', ')} went extinct. A trophic level was lost — the web unravels. Rebalance the starting populations.`);
  else if (worstDev <= 0.15) rating = rate('SUITABLE', `Stable ecosystem: all four trophic levels persist within ±${Math.round(worstDev * 100)}% of their means. Producers → herbivores → predators → decomposers cycle in balance. Engineered responsibly.`);
  else rating = rate('MARGINAL', `Persistent oscillation: populations swing ±${Math.round(worstDev * 100)}% — boom-and-bust predator–prey cycles that never settle. Survivable, but not steady.`);
  return { series, last, extinct, worstDev, rating };
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
