import { SPACE_SLOTS, SPACE_CATALOG, REENTRY_HEAT, spaceOptionById } from '../../data/chapter7/vacuumReentry.js';

// VacuumModel — Chapter 7's vacuum/extremes carry-forward rig (the certification
// chamber). It certifies a crewed spacecraft against the four extremes, in the
// order a failure would kill the mission: can it even thrust in vacuum, does the
// shield survive re-entry, can the crew breathe, and is any critical system a
// single point of failure. Verdict reads only from the option data.
//
// Verdict priority: vacuum_fail > burn_up > life_fail > single_point > certified.

export class VacuumModel {
  resolve(selection = {}) {
    return SPACE_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: spaceOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `complete the spacecraft (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    let verdict;
    let reason;
    if (!by.propulsion.vacuumCapable) {
      verdict = 'vacuum_fail';
      reason = `Won't thrust in space: ${by.propulsion.name} needs atmosphere. Only a reaction engine works in vacuum.`;
    } else if (by.shield.protection < REENTRY_HEAT) {
      verdict = 'burn_up';
      reason = `Burns up on re-entry: ${by.shield.name} (protection ${by.shield.protection}) can't survive ${REENTRY_HEAT} of heating. Fit a real heat shield.`;
    } else if (by.life.capacity < 2) {
      verdict = 'life_fail';
      reason = by.life.capacity === 0
        ? 'Life support fails: no system to keep a crew alive. Add closed-loop recycling.'
        : `Life support marginal: ${by.life.name} won't sustain a crew for the trip. Use closed-loop recycling.`;
    } else if (by.redundancy.failTolerance < 1) {
      verdict = 'single_point';
      reason = `Single point of failure: ${by.redundancy.name} means one fault ends the mission — and lives. Add redundancy to the critical systems.`;
    } else {
      verdict = 'certified';
      reason = `CERTIFIED: vacuum-capable propulsion, a shield that survives re-entry, closed-loop life support, and ${by.redundancy.failTolerance}-fault redundancy. Cleared to leave Earth.`;
    }

    return {
      ok: verdict === 'certified',
      verdict,
      reason,
      vacuumCapable: by.propulsion.vacuumCapable,
      shieldProtection: by.shield.protection,
      reentryHeat: REENTRY_HEAT,
      lifeCapacity: by.life.capacity,
      failTolerance: by.redundancy.failTolerance,
      members: parts,
      missing: [],
    };
  }

  catalog() { return SPACE_CATALOG; }
}

export default VacuumModel;
