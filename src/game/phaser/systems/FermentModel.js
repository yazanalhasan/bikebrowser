import { FERMENT_SLOTS, FERMENT_CATALOG, fermentOptionById } from '../../data/chapter5/microbiology.js';

// FermentModel — Chapter 5's microbiology carry-forward rig (the Fermentation
// Bench). It turns culture conditions into a product, modelling the lesson that
// the microbe + oxygen decide WHAT you make while heat/food decide whether the
// culture lives at all. Verdict reads only from the option data.
//
// Verdict priority: dead (too hot) > no_food (no sugar) > dormant (too cold) >
// product (alcohol / vinegar / sour / aerobic_growth) by microbe & oxygen.

export class FermentModel {
  resolve(selection = {}) {
    return FERMENT_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: fermentOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `set up the culture (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    let verdict; let product; let reason;
    if (by.temp.level === 2) {
      verdict = 'dead'; product = null;
      reason = 'Dead culture: boiling kills the microbes before they can work. Keep it warm, not hot.';
    } else if (!by.substrate.sugar) {
      verdict = 'no_food'; product = null;
      reason = `No food: ${by.substrate.name.toLowerCase()} has no fermentable sugar — the microbes starve.`;
    } else if (by.temp.level === 0) {
      verdict = 'dormant'; product = null;
      reason = 'Dormant: too cold — the microbes barely metabolise. Warm it up.';
    } else if (by.microbe.id === 'yeast') {
      if (!by.oxygen.oxygen) { verdict = 'alcohol'; product = 'alcohol'; reason = 'Alcohol: sealed from oxygen, yeast ferments the sugar to alcohol and CO₂. This is fermentation.'; }
      else { verdict = 'aerobic_growth'; product = 'more yeast'; reason = 'Aerobic growth: with oxygen, yeast just multiplies and burns the sugar to CO₂ — no alcohol. Seal the jar.'; }
    } else if (by.microbe.id === 'acetobacter') {
      if (by.oxygen.oxygen) { verdict = 'vinegar'; product = 'vinegar'; reason = 'Vinegar: Acetobacter needs oxygen to make acetic acid. A different microbe, a different product.'; }
      else { verdict = 'aerobic_growth'; product = null; reason = 'Stalled: Acetobacter needs oxygen it does not have here.'; }
    } else { // lactobacillus
      verdict = 'sour'; product = 'sour (lactic acid)';
      reason = 'Sour: Lactobacillus makes lactic acid — it preserves food and reshapes the microbial ecosystem, but it is not alcohol.';
    }

    return {
      ok: verdict === 'alcohol',
      verdict,
      product,
      reason,
      microbe: by.microbe.id,
      members: parts,
      missing: [],
    };
  }

  catalog() { return FERMENT_CATALOG; }
}

export default FermentModel;
