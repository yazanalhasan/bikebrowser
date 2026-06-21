import { CRASH_SLOTS, CRASH_CATALOG, crashOptionById } from '../../data/chapter4/crashLoad.js';

// CrashModel — Chapter 4's safety/systems carry-forward rig. It fires a frontal
// crash and reports the occupant's peak deceleration and whether the survival
// cell held, modelling the chapter's lesson: a crumple zone lowers peak g (energy
// absorbed over a longer fold) while the cage must stay intact. Verdict reads
// only from the option data — no hard-coded "correct car".
//
// Verdict priority: collapse (cabin intrusion = lethal) > high_g (occupant injury)
// > unstable (poor balance) > safe.

const IMPACT_G = 60;          // raw frontal deceleration of a hard hit
const SURVIVABLE_G = 30;      // occupant peak g above this = serious injury
const INTRUSION_SCALE = 100;  // soft fronts load the cage by intrusionRisk * scale

export class CrashModel {
  resolve(selection = {}) {
    return CRASH_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: crashOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `configure the whole car (missing: ${missing.join(', ')})`, missing, occupantG: 0 };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    // Energy management: the crumple absorbs some impact, the restraint reduces
    // what reaches the body.
    const afterCrumple = IMPACT_G * (1 - by.front.crumple);
    const occupantG = Math.round(afterCrumple * (1 - by.restraint.gReduction) * 10) / 10;

    // The survival cell: a soft front loads the cage; it must out-strength that load.
    const intrusionLoad = by.front.intrusionRisk * INTRUSION_SCALE;
    const cabinHolds = by.cage.strength >= intrusionLoad;

    const stable = by.load.balanced;

    let verdict;
    let reason;
    if (!cabinHolds) {
      verdict = 'collapse';
      reason = `Cabin intrusion: the ${by.front.name.toLowerCase()} folds into a ${by.cage.name.toLowerCase()} (load ${Math.round(intrusionLoad)} > strength ${by.cage.strength}). Stiffen the cage or use a more controlled crumple.`;
    } else if (occupantG > SURVIVABLE_G) {
      verdict = 'high_g';
      reason = `Occupant peak ${occupantG}g exceeds the survivable ~${SURVIVABLE_G}g: too little crumple/restraint, so the hit goes straight to the body. Add a crumple zone or better restraint.`;
    } else if (!stable) {
      verdict = 'unstable';
      reason = `Crash-safe, but ${by.load.name.toLowerCase()} makes it unstable to drive. Balance the load.`;
    } else {
      verdict = 'safe';
      reason = `Survivable: occupant peak ${occupantG}g, cabin intact, balanced. The crumple zone did its job and the cage held.`;
    }

    return {
      ok: verdict === 'safe',
      verdict,
      reason,
      occupantG,
      intrusionLoad: Math.round(intrusionLoad),
      cabinHolds,
      stable,
      members: parts,
      missing: [],
    };
  }

  catalog() { return CRASH_CATALOG; }
}

export default CrashModel;
