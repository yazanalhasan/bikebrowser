import { ENGINE_SLOTS, ENGINE_CATALOG, engineOptionById } from '../../data/chapter3/engineTune.js';

// EngineModel — Chapter 3's combustion/thermal carry-forward rig (the dyno). It
// turns a tune into a power figure and a verdict, modelling the three-way trade
// the chapter teaches: power vs heat vs knock. Like StructuralModel/CircuitModel,
// the verdict comes only from the options' declared numbers — no hard-coded tune.
//
// Physics-as-understandable (not a real ECU): power is the product of each knob's
// power factor; heat load is additive and capped by cooling; knock rises with
// compression, advance and lean mixtures, and explodes when the fuel's octane is
// below what the compression demands. Verdict priority: knock > overheat > foul >
// runs (detonation wrecks an engine fastest).

const BASE_POWER = 100;
const BASE_HEAT = 30;
const BASELINE_TEMP = 80;     // °C at idle-ish
const OVERHEAT_TEMP = 110;    // °C — coolant boils / seizes past here
const KNOCK_THRESHOLD = 30;   // knock index that means audible detonation
const FOUL_THRESHOLD = 10;    // rich-running plug-fouling index

export class EngineModel {
  resolve(selection = {}) {
    return ENGINE_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: engineOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `set every knob (missing: ${missing.join(', ')})`, missing, power: 0 };
    }

    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));
    const power = Math.round(BASE_POWER * by.afr.powerFactor * by.timing.powerFactor * by.compression.powerFactor);

    const heatLoad = BASE_HEAT + by.afr.heat + by.timing.heat + by.compression.heat;
    const temp = BASELINE_TEMP + (heatLoad - by.cooling.coolingCapacity);

    const octaneShort = Math.max(0, (by.compression.needsOctane || 0) - (by.fuel.octane || 0));
    const octanePenalty = octaneShort * 3;
    const knockIndex = by.afr.knock + by.timing.knock + by.compression.knock + octanePenalty;

    const foulIndex = by.afr.foul || 0;

    let verdict;
    let reason;
    if (knockIndex >= KNOCK_THRESHOLD) {
      verdict = 'knock';
      reason = octaneShort > 0
        ? `Detonation: ${by.compression.name} compression needs ${by.compression.needsOctane} octane but ${by.fuel.name} is only ${by.fuel.octane} — it knocks and would hole a piston.`
        : `Detonation: too much compression + advance for the conditions (knock index ${knockIndex}). Back off timing or compression.`;
    } else if (temp >= OVERHEAT_TEMP) {
      verdict = 'overheat';
      reason = `Overheats at ~${temp}°C: ${by.cooling.name} can't shed this heat load. Add cooling or pull heat out (less compression / advance).`;
    } else if (foulIndex >= FOUL_THRESHOLD) {
      verdict = 'foul';
      reason = `Runs rich (${by.afr.name}): cool and safe but down on power and fouling plugs — wasting fuel for the trip.`;
    } else {
      verdict = 'runs';
      reason = `Clean pull: ${power} units of power at ~${temp}°C, no knock. Fuel matched to compression, cooling holding.`;
    }

    return {
      ok: verdict === 'runs',
      verdict,
      reason,
      power,
      temp: Math.round(temp),
      knockIndex: Math.round(knockIndex),
      octaneShort,
      members: parts,
      missing: [],
    };
  }

  catalog() { return ENGINE_CATALOG; }
}

export default EngineModel;
