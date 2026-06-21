import { PLANE_SLOTS, PLANE_CATALOG, planeOptionById } from '../../data/chapter6/aerodynamics.js';

// AeroModel — Chapter 6's aerodynamics carry-forward rig (the wind tunnel). It
// balances the four forces and checks the wing's strength-to-weight: lift must
// beat weight, thrust must beat drag, the structure must carry the lift loads
// without being too heavy to climb, and the angle of attack must stay below stall.
// Verdict reads only from the option data.
//
// Verdict priority: structural (the wing breaks) > stall (flow separates) >
// too_heavy (can't generate enough lift) > underpowered (can't overcome drag) >
// fly.

const STRUCT_LOAD_FACTOR = 0.8;  // lift loads the wing by this fraction

export class AeroModel {
  resolve(selection = {}) {
    return PLANE_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: planeOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `finish the aircraft (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    const stalled = by.angle.aoa === 'high' && by.airfoil.stallResist !== 'high';
    const rawLift = by.airfoil.lift + by.angle.liftBonus;
    const lift = stalled ? Math.round(rawLift * 0.35) : rawLift; // stall collapses lift
    const weight = by.structure.weight;
    const drag = by.airfoil.drag + by.angle.dragBonus;
    const thrust = by.engine.thrust;
    const wingLoad = Math.round(rawLift * STRUCT_LOAD_FACTOR);
    const structureOk = by.structure.strength >= wingLoad;

    let verdict;
    let reason;
    if (!structureOk) {
      verdict = 'structural';
      reason = `Wing fails: ${by.structure.name} (strength ${by.structure.strength}) can't carry the ${wingLoad} lift load. Use a stronger — ideally lighter-and-stronger — structure.`;
    } else if (stalled) {
      verdict = 'stall';
      reason = `Stalls: a high angle of attack on a ${by.airfoil.name.toLowerCase()} separates the flow and lift collapses. Lower the AoA or use a stall-tolerant airfoil.`;
    } else if (lift < weight) {
      verdict = 'too_heavy';
      reason = `Too heavy: lift ${lift} can't raise weight ${weight}. More camber/angle, or a lighter structure.`;
    } else if (thrust < drag) {
      verdict = 'underpowered';
      reason = `Underpowered: thrust ${thrust} can't overcome drag ${drag}, so it never reaches flying speed. More thrust or less drag.`;
    } else {
      verdict = 'fly';
      reason = `Flies: lift ${lift} > weight ${weight}, thrust ${thrust} > drag ${drag}, wing strong enough and light enough. Four forces in balance.`;
    }

    return {
      ok: verdict === 'fly',
      verdict,
      reason,
      lift, weight, drag, thrust, wingLoad,
      stalled,
      members: parts,
      missing: [],
    };
  }

  catalog() { return PLANE_CATALOG; }
}

export default AeroModel;
