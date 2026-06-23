// Bridge load simulation on the game's relative 0–10 scale (teaching model, not
// real SI units). Deck stiffness drives the sag; role suitability gates pass/fail.
import { rateSuitability } from '../utm/suitability.js';
import { BRIDGE_TASKS, STRUCTURAL_ROLES } from './bridgeTasks.js';

export const SPAN = 10;

export function roleSuitabilities(materials) {
  const out = {};
  STRUCTURAL_ROLES.forEach((role) => { out[role] = rateSuitability(materials[role], BRIDGE_TASKS[role]); });
  return out;
}

// Static result for a given material set + load (0..1, default ~0.7).
export function computeBridgeSim(materials, load = 0.7) {
  const suit = roleSuitabilities(materials);
  const deck = materials.deck;
  // Sag (world units): softer/weaker deck → more sag. Stiffness is 0–10.
  const maxDeflection = clamp((load * 6) / (deck.stiffness + 1.5) * 0.18, 0.02, 1.0);

  const anyUnsuitable = STRUCTURAL_ROLES.some((r) => suit[r].label === 'UNSUITABLE');
  const cablesWeak = suit.cables.label === 'UNSUITABLE';

  let verdict; let failureReason;
  if (anyUnsuitable) {
    verdict = 'fail';
    const bad = STRUCTURAL_ROLES.filter((r) => suit[r].label === 'UNSUITABLE').join(', ');
    failureReason = cablesWeak
      ? `Cables (${materials.cables.name}) cannot carry the tension — they snap.`
      : `Material unsuitable for: ${bad}.`;
  } else if (maxDeflection > 0.62) {
    verdict = 'fail';
    failureReason = `The deck (${materials.deck.name}) is too flexible — it sags past the safe limit and buckles.`;
  } else if (maxDeflection > 0.34) {
    verdict = 'marginal';
  } else {
    verdict = 'pass';
  }
  return { maxDeflection, verdict, failureReason, suit };
}

// Deck deflection at normalized x (0..1) for a load at normalized position p.
export function deflectionAtX(x, loadPos, maxDelta) {
  const influence = 4 * x * (1 - x); // parabola, 0 at supports, 1 at midspan
  const proximity = Math.max(0, 1 - Math.abs(x - loadPos) * 2); // peak near the load
  return maxDelta * Math.max(0, influence * 0.55 + proximity * 0.45);
}

export const VERDICT_LABEL = { pass: 'BRIDGE HOLDS', marginal: 'BRIDGE SURVIVES — BARELY', fail: 'STRUCTURAL FAILURE' };
export const VERDICT_COLOR = { pass: '#22C55E', marginal: '#EAB308', fail: '#EF4444' };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
