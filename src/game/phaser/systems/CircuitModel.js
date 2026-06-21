import { CIRCUIT_SLOTS, componentById, COMPONENT_CATALOG } from '../../data/chapter2/circuitComponents.js';

// CircuitModel — Chapter 2's electrical carry-forward rig (the analog of
// StructuralModel for Chapter 1's bridge). It solves a simple SERIES circuit with
// Ohm's law and reports, per part, whether the current that flows is within that
// part's rating — the electrical form of "is it strong enough?".
//
// Series model: total resistance = Σ part resistances; current I = V / Rtotal
// (battery EMF over the loop). Then for each part we compare I against its
// maxCurrentA. The motor additionally needs a minimum voltage across it to spin.
// Pure logic, no Phaser — node-testable. Primitive-declaring: the verdict comes
// entirely from the parts' declared numbers, never a hard-coded answer.

export const CURRENT_ZONES = {
  green: 0x4fca64,   // comfortably within rating
  yellow: 0xf1c84b,  // near rating (≥75%)
  red: 0xe45757,     // at/over rating → fails
};

function zoneFor(ratio) {
  if (ratio >= 1) return 'red';
  if (ratio >= 0.75) return 'yellow';
  return 'green';
}

export class CircuitModel {
  constructor(catalog = COMPONENT_CATALOG) {
    this.catalog = catalog;
  }

  // selection: { battery, fuse, controller, wire, motor } of component ids.
  resolve(selection = {}) {
    return CIRCUIT_SLOTS.map((slot) => {
      const id = selection[slot];
      const part = id ? componentById(id) : null;
      return { slot, id: id || null, part };
    });
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.part).map((p) => p.slot);
    const battery = parts.find((p) => p.slot === 'battery')?.part || null;
    const motor = parts.find((p) => p.slot === 'motor')?.part || null;

    // Open circuit: any slot empty (or no source) → no current can flow.
    if (missing.length || !battery) {
      return {
        ok: false,
        verdict: 'open',
        reason: missing.length ? `incomplete circuit (missing: ${missing.join(', ')})` : 'no power source',
        volts: battery?.volts || 0,
        current: 0,
        totalResistance: 0,
        members: parts.map((p) => ({ ...p, ratio: 0, zone: 'green', failed: false })),
        failed: [],
        missing,
      };
    }

    const volts = battery.volts;
    const totalResistance = parts.reduce((sum, p) => sum + (p.part.resistanceOhm || 0), 0);
    const current = totalResistance > 0 ? Number((volts / totalResistance).toFixed(2)) : Infinity;

    // Voltage the motor actually sees = its share of the series resistance.
    const motorVolts = motor ? Number((current * (motor.resistanceOhm || 0)).toFixed(2)) : 0;

    // Per-part current rating check.
    const members = parts.map((p) => {
      const cap = p.part.maxCurrentA;
      const ratio = cap === Infinity ? 0 : Number((current / cap).toFixed(3));
      const failed = current > cap; // strictly over rating
      return {
        ...p,
        current,
        capacity: cap,
        ratio,
        zone: failed ? 'red' : zoneFor(ratio),
        color: CURRENT_ZONES[failed ? 'red' : zoneFor(ratio)],
        failed,
        failureMode: failed ? this._failureMode(p.slot) : null,
      };
    });

    // The fuse is the sacrificial protector: if the current exceeds its rating it
    // blows FIRST, opening the circuit before anything expensive is damaged. That
    // is a SAFE stop ('tripped'), not a failure ('fry') — the whole point of a
    // fuse. Only if the fuse is absent/oversized does a downstream part fry.
    const fuseMember = members.find((m) => m.slot === 'fuse');
    const fuseBlows = fuseMember && fuseMember.capacity !== Infinity && current > fuseMember.capacity;

    const failed = members
      .filter((m) => m.failed && m.slot !== 'fuse')
      .sort((a, b) => b.ratio - a.ratio);
    const spins = motor && motorVolts >= motor.minVolts && current <= motor.maxCurrentA;

    // Verdict priority: protected trip > fry > stall > spin.
    let verdict;
    let reason;
    if (fuseBlows) {
      verdict = 'tripped';
      reason = `${current}A would flow — the ${fuseMember.part.name} blows first and protects the circuit. Nothing fried, but the motor won't run until you size the parts for less current.`;
    } else if (failed.length) {
      verdict = 'fry';
      const f = failed[0];
      const protect = fuseMember && fuseMember.capacity !== Infinity
        ? ` Your ${fuseMember.part.name} was rated too high to protect it.`
        : ' With no fuse, nothing stopped it.';
      reason = `${f.part.name} exceeds its ${f.capacity}A rating (${current}A flows) — it ${this._failureVerb(f.slot)}.${protect}`;
    } else if (!spins) {
      verdict = 'stall';
      reason = motorVolts < motor.minVolts
        ? `only ${motorVolts}V reaches the motor (needs ${motor.minVolts}V) — too little push to spin.`
        : 'the motor cannot turn under these conditions.';
    } else {
      verdict = 'spin';
      reason = `${current}A at ${motorVolts}V — the motor spins, every part within its rating, fuse protecting.`;
    }

    return {
      ok: verdict === 'spin',
      verdict,
      reason,
      volts,
      current,
      motorVolts,
      totalResistance: Number(totalResistance.toFixed(3)),
      members,
      failed,
      failedMember: verdict === 'tripped' ? fuseMember : (failed[0] || null),
      fuseBlows,
      missing: [],
    };
  }

  _failureMode(slot) {
    return { fuse: 'blows', wire: 'melts', controller: 'fries', motor: 'burns out', battery: 'overheats' }[slot] || 'fails';
  }

  _failureVerb(slot) {
    return { fuse: 'blows (as designed)', wire: 'melts', controller: 'fries', motor: 'burns out', battery: 'overheats' }[slot] || 'fails';
  }
}

export default CircuitModel;
