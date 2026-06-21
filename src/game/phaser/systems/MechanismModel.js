import { MECH_SLOTS, MECH_CATALOG, mechOptionById } from '../../data/chapter6/molecular.js';

// MechanismModel — Chapter 6's molecular-biology carry-forward rig (the mechanism
// bench). It checks whether the player's molecule → target → action chain actually
// explains the observation, validating each link in the order a scientist would:
// is it even the active molecule, does it act at the right target/level, and is
// the action the right direction. Verdict reads only from the option data.
//
// Verdict priority: wrong_molecule > wrong_target > wrong_action > mechanism.

export class MechanismModel {
  resolve(selection = {}) {
    return MECH_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: mechOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `assemble the mechanism (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    let verdict; let reason;
    if (!by.molecule.active) {
      verdict = 'wrong_molecule';
      reason = `Wrong molecule: ${by.molecule.name} isn't the active compound behind the relief. Trace it back to the converted salicylate.`;
    } else if (!by.target.correct) {
      verdict = 'wrong_target';
      reason = `Wrong target (${by.target.level} level): salicylates act on a protein enzyme, not ${by.target.name}. Find the inflammatory enzyme.`;
    } else if (!by.effect.correct) {
      verdict = 'wrong_action';
      reason = `Wrong action: ${by.effect.name.toLowerCase()} the COX enzyme wouldn't reduce inflammation. The effect direction has to match the observation.`;
    } else {
      verdict = 'mechanism';
      reason = `Mechanism explained: ${by.molecule.name} inhibits the COX enzyme (a protein), cutting inflammatory-signal synthesis — so the pain drops. Molecule → target → effect.`;
    }

    return {
      ok: verdict === 'mechanism',
      verdict,
      reason,
      level: by.target.level,
      members: parts,
      missing: [],
    };
  }

  catalog() { return MECH_CATALOG; }
}

export default MechanismModel;
