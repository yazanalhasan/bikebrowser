import { BOAT_SLOTS, BOAT_CATALOG, boatOptionById } from '../../data/chapter5/buoyancy.js';

// BuoyancyModel — Chapter 5's fluid/buoyancy carry-forward rig (the hydro tank).
// Archimedes made playable: the hull can displace `volume` units of water (each
// weighing 1), so its buoyant capacity is that volume; the boat floats if its
// total weight is safely under that. Upright stability comes from beam and low
// ballast versus top-weight. Verdict reads only from the option data.
//
// Verdict priority: sink (no reserve buoyancy) > capsize (rolls over) > float.

const WATER_DENSITY = 1;        // weight per unit displaced volume
const FREEBOARD_MARGIN = 0.95;  // need weight under 95% of capacity, else it swamps
const STABILITY_MIN = 14;       // righting score below this rolls over

export class BuoyancyModel {
  resolve(selection = {}) {
    return BOAT_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: boatOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `finish the boat (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    const displacement = by.hull.volume * WATER_DENSITY;
    const hullWeight = Math.round(by.hull.volume * 0.25 * by.material.weightFactor * 10) / 10;
    const totalWeight = Math.round((hullWeight + by.cargo.weight + by.ballast.weight) * 10) / 10;
    const buoyantCapacity = displacement;
    const reserve = Math.round((buoyantCapacity - totalWeight) * 10) / 10;
    const freeboardOk = totalWeight <= buoyantCapacity * FREEBOARD_MARGIN;

    // Righting score: beam resists rolling, ballast lowers the centre of mass,
    // top-weight (high cargo) works against it.
    const stability = by.hull.beam * 4 + by.ballast.stab * 3 - by.cargo.topWeight;

    let verdict;
    let reason;
    if (!freeboardOk) {
      verdict = 'sink';
      reason = reserve <= 0
        ? `Sinks: it weighs ${totalWeight} but can only displace ${buoyantCapacity} of water — no buoyancy left. Lighten it or use a bigger hull.`
        : `Swamps: only ${reserve} of reserve buoyancy — the gunwales go under. Shed weight or add displacement.`;
    } else if (stability < STABILITY_MIN) {
      verdict = 'capsize';
      reason = `Capsizes: righting score ${stability} is too low — too narrow or too top-heavy. Add ballast low, widen the beam, or carry less up high.`;
    } else {
      verdict = 'float';
      reason = `Floats level: ${reserve} reserve buoyancy, righting score ${stability}. ${by.material.corrosion === 'high' ? 'Watch the salt — this hull will corrode.' : 'Salt-resistant hull.'}`;
    }

    return {
      ok: verdict === 'float',
      verdict,
      reason,
      displacement,
      totalWeight,
      reserve,
      stability,
      corrosion: by.material.corrosion,
      members: parts,
      missing: [],
    };
  }

  catalog() { return BOAT_CATALOG; }
}

export default BuoyancyModel;
