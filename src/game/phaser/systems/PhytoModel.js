import { PHYTO_SLOTS, PHYTO_CATALOG, PHYTO_CHALLENGE, phytoOptionById } from '../../data/chapter3/phytochemistry.js';

// PhytoModel — Chapter 3's phytochemistry carry-forward rig (the extraction lab).
// It turns extraction conditions into WHICH compound comes out and how clean it
// is, modelling the lesson that solvent polarity selects the compound class while
// heat/time trade yield against degradation and tannin over-extraction. Verdict
// reads only from the option data.
//
// Verdict priority: wrong_compound (non-polar solvent → waxes) > degraded (too
// hot) > bitter (over-extracted tannins) > low_yield (under-extracted) > pure.

export class PhytoModel {
  resolve(selection = {}) {
    return PHYTO_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: phytoOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `set up the extraction (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));
    const target = PHYTO_CHALLENGE.target;

    const extraction = by.grind.surface + by.time.level + by.temp.level; // 0..5-ish
    const yieldPct = Math.min(100, 15 + extraction * 17);

    let verdict; let compound; let purityPct; let reason;
    if (!by.solvent.polar) {
      verdict = 'wrong_compound'; compound = 'plant waxes & resins'; purityPct = 10;
      reason = `Wrong compound: a non-polar solvent dissolves waxes and resins, not the polar ${target}. Use a polar solvent (water/ethanol).`;
    } else if (by.temp.level === 2) {
      verdict = 'degraded'; compound = `degraded ${target}`; purityPct = 40;
      reason = `Degraded: boiling breaks down heat-sensitive ${target}. Extract warm, not boiling.`;
    } else if (by.temp.level >= 1 && (by.time.level === 2 || (by.solvent.aggressive && by.time.level >= 1))) {
      verdict = 'bitter'; compound = 'tannins + salicin'; purityPct = 55;
      reason = `Bitter: over-extraction drags out tannins alongside the ${target}. Shorten the steep or use plain water.`;
    } else if (by.grind.surface === 0 || by.time.level === 0 || by.temp.level === 0) {
      verdict = 'low_yield'; compound = `trace ${target}`; purityPct = 85;
      reason = `Low yield: too little surface area, time or heat — barely any ${target} diffuses out. Grind it, warm it, steep longer.`;
    } else {
      verdict = 'pure'; compound = target; purityPct = 95;
      reason = `Pure ${target}: a polar solvent at moderate heat and time pulled the target cleanly, before tannins or degradation. ~${yieldPct}% yield.`;
    }

    return {
      ok: verdict === 'pure',
      verdict,
      reason,
      compound,
      target,
      yieldPct,
      purityPct,
      members: parts,
      missing: [],
    };
  }

  catalog() { return PHYTO_CATALOG; }
}

export default PhytoModel;
